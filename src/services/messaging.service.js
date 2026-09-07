import { supabase } from "../lib/supabase";

/*
|--------------------------------------------------------------------------
| Auto Archive Expired Conversations
|--------------------------------------------------------------------------
|
| Active conversations are automatically archived after 24 hours
| without a new message.
|
*/

export async function archiveExpiredConversations() {
  try {
    const cutoff = new Date(
      Date.now() - 24 * 60 * 60 * 1000
    ).toISOString();

    const { error } = await supabase
      .from("conversations")
      .update({
        status: "archived",
        archived_at: new Date().toISOString(),
      })
      .eq("status", "active")
      .lte("last_message_at", cutoff);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error(
      "archiveExpiredConversations()",
      error
    );
  }
}

/*
|--------------------------------------------------------------------------
| Get Conversations
|--------------------------------------------------------------------------
*/

export async function getConversations(
  status = "active",
  requestedConversationId = null
) {
  try {
    const [
      conversationsResult,
      ordersResult,
      customersResult,
      employeesResult,
      messagesResult,
    ] = await Promise.all([
      /*
      |--------------------------------------------------------------------------
      | Conversations
      |--------------------------------------------------------------------------
      */

      supabase
        .from("conversations")
        .select("*")
        .eq("status", status)
        .order("last_message_at", {
          ascending: false,
        }),

      /*
      |--------------------------------------------------------------------------
      | Orders
      |--------------------------------------------------------------------------
      */

      supabase
        .from("orders")
        .select("*"),

      /*
      |--------------------------------------------------------------------------
      | Customers
      |--------------------------------------------------------------------------
      */

      supabase
        .from("customer_profiles")
        .select("*"),

      /*
      |--------------------------------------------------------------------------
      | Employees
      |--------------------------------------------------------------------------
      */

      supabase
        .from("employees")
        .select("*"),

      /*
      |--------------------------------------------------------------------------
      | Messages
      |--------------------------------------------------------------------------
      |
      | Support conversations should only appear after the customer starts
      | the conversation. Delivery conversations remain unaffected.
      |
      */

      supabase
        .from("messages")
        .select("conversation_id, sender_type"),
    ]);

    /*
    |--------------------------------------------------------------------------
    | Check Errors
    |--------------------------------------------------------------------------
    */

    if (conversationsResult.error) {
      throw conversationsResult.error;
    }

    if (ordersResult.error) {
      throw ordersResult.error;
    }

    if (customersResult.error) {
      throw customersResult.error;
    }

    if (employeesResult.error) {
      throw employeesResult.error;
    }

    if (messagesResult.error) {
      console.warn(
        "Unable to check customer support messages:",
        messagesResult.error
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Safe Defaults
    |--------------------------------------------------------------------------
    */

    const conversations =
      conversationsResult.data ?? [];

    const orders =
      ordersResult.data ?? [];

    const customers =
      customersResult.data ?? [];

    const employees =
      employeesResult.data ?? [];

    const messages =
      messagesResult.data ?? [];

    const customerMessageConversationIds =
      new Set(
        messages
          .filter(
            (message) =>
              String(
                message?.sender_type || ""
              )
                .toLowerCase()
                .trim() === "customer"
          )
          .map(
            (message) =>
              String(
                message.conversation_id
              )
          )
      );

    const visibleConversations =
      conversations.filter((conversation) => {
        if (
          conversation?.conversation_type !==
          "support"
        ) {
          return true;
        }

        return (
          String(conversation.id) ===
            String(requestedConversationId) ||
          customerMessageConversationIds.has(
            String(conversation.id)
          )
        );
      });

    const uniqueConversations = [];
    const deliveryConversationIndexes = new Map();

    visibleConversations.forEach((conversation) => {
      if (
        conversation?.conversation_type !==
        "delivery"
      ) {
        uniqueConversations.push(conversation);
        return;
      }

      const customerId =
        conversation.customer_id ||
        conversation.participant_id;

      if (!customerId) {
        uniqueConversations.push(conversation);
        return;
      }

      const key = String(customerId);
      const existingIndex =
        deliveryConversationIndexes.get(key);

      if (existingIndex === undefined) {
        deliveryConversationIndexes.set(
          key,
          uniqueConversations.length
        );
        uniqueConversations.push(conversation);
        return;
      }

      const existing =
        uniqueConversations[existingIndex];

      const existingTime =
        new Date(
          existing?.last_message_at ||
            existing?.updated_at ||
            existing?.created_at ||
            0
        ).getTime();

      const currentTime =
        new Date(
          conversation?.last_message_at ||
            conversation?.updated_at ||
            conversation?.created_at ||
            0
        ).getTime();

      if (currentTime > existingTime) {
        uniqueConversations[existingIndex] =
          conversation;
      }
    });

    /*
    |--------------------------------------------------------------------------
    | LOOKUP MAPS
    |--------------------------------------------------------------------------
    */

    const orderMap = {};

    orders.forEach((order) => {
      if (order?.id) {
        orderMap[String(order.id)] = order;
      }
    });

    /*
    |--------------------------------------------------------------------------
    | Customer Map
    |--------------------------------------------------------------------------
    |
    | We support both:
    |
    | customer_profiles.id
    | customer_profiles.user_id
    |
    | This is important because participant_id may contain
    | either value depending on how the support conversation
    | was created.
    |
    */

    const customerMap = {};

    customers.forEach((customer) => {
      if (customer?.id) {
        customerMap[String(customer.id)] =
          customer;
      }

      if (customer?.user_id) {
        customerMap[String(customer.user_id)] =
          customer;
      }
    });

    /*
    |--------------------------------------------------------------------------
    | Employee Map
    |--------------------------------------------------------------------------
    */

    const employeeMap = {};

    employees.forEach((employee) => {
      if (employee?.id) {
        employeeMap[String(employee.id)] =
          employee;
      }

      /*
      |--------------------------------------------------------------------------
      | Also support employee.user_id
      |--------------------------------------------------------------------------
      */

      if (employee?.user_id) {
        employeeMap[
          String(employee.user_id)
        ] = employee;
      }
    });

    /*
    |--------------------------------------------------------------------------
    | MERGE DATA
    |--------------------------------------------------------------------------
    */

    return uniqueConversations.map(
      (conversation) => {
        /*
        |--------------------------------------------------------------------------
        | Find Order
        |--------------------------------------------------------------------------
        */

        const order =
          conversation.order_id
            ? orderMap[
                String(conversation.order_id)
              ] || {}
            : {};

        /*
        |--------------------------------------------------------------------------
        | Determine Customer ID
        |--------------------------------------------------------------------------
        |
        | DELIVERY
        | --------
        | Use order.customer_id
        |
        | SUPPORT
        | -------
        | Use conversation.participant_id
        |
        */

        let customerId = null;

        if (
          conversation.conversation_type ===
          "support"
        ) {
          customerId =
            conversation.participant_id ||
            conversation.customer_id ||
            null;
        } else {
          customerId =
            conversation.customer_id ||
            order.customer_id ||
            conversation.participant_id ||
            null;
        }

        /*
        |--------------------------------------------------------------------------
        | Find Customer
        |--------------------------------------------------------------------------
        */

        const customer = customerId
          ? customerMap[String(customerId)] || {}
          : {};

        /*
        |--------------------------------------------------------------------------
        | Determine Driver ID
        |--------------------------------------------------------------------------
        |
        | Prefer conversation.driver_id.
        | Fall back to order.driver_id.
        |
        */

        const driverId =
          conversation.driver_id ||
          order.driver_id ||
          null;

        /*
        |--------------------------------------------------------------------------
        | Find Driver
        |--------------------------------------------------------------------------
        */

        const driver = driverId
          ? employeeMap[String(driverId)] || {}
          : {};

        /*
        |--------------------------------------------------------------------------
        | Customer Name
        |--------------------------------------------------------------------------
        */

        const customerName =
          customer.full_name ||
          customer.name ||
          customer.first_name ||
          order.customer_name ||
          conversation.customer_name ||
          (
            conversation.conversation_type ===
            "support"
              ? "Customer"
              : "Unknown Customer"
          );

        /*
        |--------------------------------------------------------------------------
        | Driver Name
        |--------------------------------------------------------------------------
        */

        const driverName =
          driver.name ||
          driver.full_name ||
          driver.first_name ||
          order.driver_name ||
          "Unassigned";

        /*
        |--------------------------------------------------------------------------
        | Return Conversation
        |--------------------------------------------------------------------------
        */

        return {
          ...conversation,

          /*
          |--------------------------------------------------------------------------
          | Original Related Data
          |--------------------------------------------------------------------------
          */

          order,

          customer,

          driver,

          /*
          |--------------------------------------------------------------------------
          | Customer Information
          |--------------------------------------------------------------------------
          */

          customerId,

          customerName,

          customerPhone:
            customer.phone ||
            customer.contact_number ||
            "",

          customerEmail:
            customer.email ||
            "",

          customerAddress:
            customer.address ||
            customer.complete_address ||
            order.delivery_address ||
            "No Address",

          /*
          |--------------------------------------------------------------------------
          | Driver Information
          |--------------------------------------------------------------------------
          */

          driverId,

          driverName,

          driverPhone:
            driver.phone ||
            driver.contact_number ||
            "",

          driverStatus:
            driver.driver_status ||
            driver.status ||
            "",

          /*
          |--------------------------------------------------------------------------
          | Order Information
          |--------------------------------------------------------------------------
          */

          totalPrice:
            order.total_price ?? 0,

          orderStatus:
            order.status ??
            "pending",

          /*
          |--------------------------------------------------------------------------
          | Conversation Information
          |--------------------------------------------------------------------------
          */

          conversationStatus:
            conversation.status,

          conversationType:
            conversation.conversation_type ||
            "delivery",

          participantId:
            conversation.participant_id ||
            null,

          deliveredAt:
            conversation.delivered_at,

          archivedAt:
            conversation.archived_at,
        };
      }
    );
  } catch (error) {
    console.error(
      "getConversations()",
      error
    );

    return [];
  }
}

/*
|--------------------------------------------------------------------------
| Get Messages
|--------------------------------------------------------------------------
*/

export async function getMessages(
  conversationId
) {
  if (!conversationId) {
    return [];
  }

  const { data, error } =
    await supabase
      .from("messages")
      .select("*")
      .eq(
        "conversation_id",
        conversationId
      )
      .order("created_at", {
        ascending: true,
      });

  if (error) {
    throw error;
  }

  return data ?? [];
}

/*
|--------------------------------------------------------------------------
| Send Message
|--------------------------------------------------------------------------
*/

export async function sendMessage({
  conversationId,
  senderType,
  senderId,
  message,
}) {
  console.log(
    "Sending message:",
    {
      conversationId,
      senderType,
      senderId,
      message,
    }
  );

  /*
  |--------------------------------------------------------------------------
  | Validate
  |--------------------------------------------------------------------------
  */

  if (!conversationId) {
    throw new Error(
      "conversationId is required."
    );
  }

  if (!senderType) {
    throw new Error(
      "senderType is required."
    );
  }

  if (!senderId) {
    throw new Error(
      "senderId is required."
    );
  }

  if (!message?.trim()) {
    throw new Error(
      "Message cannot be empty."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Insert Message
  |--------------------------------------------------------------------------
  */

  const { data, error } =
    await supabase
      .from("messages")
      .insert({
        conversation_id:
          conversationId,

        sender_type:
          senderType,

        sender_id:
          String(senderId),

        message:
          message.trim(),
      })
      .select()
      .single();

  if (error) {
    console.error(
      "INSERT ERROR:",
      error
    );

    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Update Conversation
  |--------------------------------------------------------------------------
  |
  | Sending a new message automatically:
  |
  | - updates last_message
  | - updates last_message_at
  | - reactivates the conversation
  | - removes archived_at
  |
  */

  const { error: updateError } =
    await supabase
      .from("conversations")
      .update({
        last_message:
          message.trim(),

        last_message_at:
          new Date().toISOString(),

        status:
          "active",

        archived_at:
          null,
      })
      .eq(
        "id",
        conversationId
      );

  if (updateError) {
    console.error(
      "UPDATE ERROR:",
      updateError
    );
  }

  return data;
}

/*
|--------------------------------------------------------------------------
| Mark Conversation Read
|--------------------------------------------------------------------------
*/

export async function markAsRead(
  conversationId
) {
  if (!conversationId) {
    return;
  }

  const { error } =
    await supabase
      .from("messages")
      .update({
        is_read: true,
      })
      .eq(
        "conversation_id",
        conversationId
      );

  if (error) {
    throw error;
  }
}

/*
|--------------------------------------------------------------------------
| Create Delivery Conversation
|--------------------------------------------------------------------------
*/

export async function createConversation(
  orderId
) {
  /*
  |--------------------------------------------------------------------------
  | Validate Order ID
  |--------------------------------------------------------------------------
  */

  if (!orderId) {
    throw new Error(
      "orderId is required."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Get Order
  |--------------------------------------------------------------------------
  */

  const {
    data: order,
    error: orderError,
  } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (orderError) {
    throw orderError;
  }

  if (!order) {
    throw new Error(
      "Order not found."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Look for Existing Delivery Conversation
  |--------------------------------------------------------------------------
  |
  | First search by order.
  |
  */

  const {
    data: existingByOrder,
    error: existingOrderError,
  } =
    await supabase
      .from("conversations")
      .select("*")
      .eq(
        "order_id",
        order.id
      )
      .maybeSingle();

  if (existingOrderError) {
    throw existingOrderError;
  }

  /*
  |--------------------------------------------------------------------------
  | Existing Conversation
  |--------------------------------------------------------------------------
  */

  if (existingByOrder) {
    const { data: updated, error } =
      await supabase
        .from("conversations")
        .update({
          customer_id:
            order.customer_id,

          driver_id:
            order.driver_id ||
            null,

          status:
            "active",

          archived_at:
            null,

          last_message_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          existingByOrder.id
        )
        .select()
        .single();

    if (error) {
      throw error;
    }

    return updated;
  }

  /*
  |--------------------------------------------------------------------------
  | Look for Existing Customer Delivery Conversation
  |--------------------------------------------------------------------------
  |
  | This preserves your previous behavior while avoiding
  | accidentally modifying support conversations.
  |
  */

  const {
    data: existingByCustomer,
    error: existingCustomerError,
  } =
    await supabase
      .from("conversations")
      .select("*")
      .eq(
        "customer_id",
        order.customer_id
      )
      .eq(
        "conversation_type",
        "delivery"
      )
      .maybeSingle();

  if (existingCustomerError) {
    throw existingCustomerError;
  }

  /*
  |--------------------------------------------------------------------------
  | Existing Customer Conversation
  |--------------------------------------------------------------------------
  */

  if (existingByCustomer) {
    const {
      data: updated,
      error,
    } = await supabase
      .from("conversations")
      .update({
        order_id:
          order.id,

        customer_id:
          order.customer_id,

        driver_id:
          order.driver_id ||
          null,

        conversation_type:
          "delivery",

        status:
          "active",

        archived_at:
          null,

        last_message_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        existingByCustomer.id
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    return updated;
  }

  /*
  |--------------------------------------------------------------------------
  | Create New Delivery Conversation
  |--------------------------------------------------------------------------
  */

  const {
    data,
    error,
  } = await supabase
    .from("conversations")
    .insert({
      customer_id:
        order.customer_id,

      driver_id:
        order.driver_id ||
        null,

      order_id:
        order.id,

      conversation_type:
        "delivery",

      status:
        "active",

      last_message_at:
        new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/*
|--------------------------------------------------------------------------
| Create Station Support Conversation
|--------------------------------------------------------------------------
|
| A support conversation does NOT require an order.
|
| participant_id identifies the customer.
|
*/

export async function createSupportConversation(
  customerId
) {
  if (!customerId) {
    throw new Error(
      "customerId is required."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Check Existing Support Conversation
  |--------------------------------------------------------------------------
  */

  const {
    data: existing,
    error: existingError,
  } =
    await supabase
      .from("conversations")
      .select("*")
      .eq(
        "conversation_type",
        "support"
      )
      .eq(
        "participant_id",
        String(customerId)
      )
      .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  /*
  |--------------------------------------------------------------------------
  | Reactivate Existing Support Conversation
  |--------------------------------------------------------------------------
  */

  if (existing) {
    const {
      data: updated,
      error,
    } = await supabase
      .from("conversations")
      .update({
        status:
          "active",

        archived_at:
          null,

        last_message_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        existing.id
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    return updated;
  }

  /*
  |--------------------------------------------------------------------------
  | Create New Support Conversation
  |--------------------------------------------------------------------------
  */

  const {
    data,
    error,
  } = await supabase
    .from("conversations")
    .insert({
      participant_id:
        String(customerId),

      conversation_type:
        "support",

      status:
        "active",

      last_message_at:
        new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/*
|--------------------------------------------------------------------------
| Realtime Messages
|--------------------------------------------------------------------------
*/

export function subscribeMessages(
  conversationId,
  callback
) {
  if (!conversationId) {
    return null;
  }

  return supabase
    .channel(
      `messages-${conversationId}`
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "messages",
        filter:
          `conversation_id=eq.${conversationId}`,
      },
      callback
    )
    .subscribe();
}