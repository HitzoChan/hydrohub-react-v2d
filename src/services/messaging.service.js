import { supabase } from "../lib/supabase";

/*
|--------------------------------------------------------------------------
| Auto Archive Expired Conversations
|--------------------------------------------------------------------------
*/

export async function archiveExpiredConversations() {
  try {
      const cutoff = new Date(
        Date.now() - 2 * 60 * 1000
      ).toISOString();

      const { error } = await supabase
        .from("conversations")
        .update({
          status: "archived",
          archived_at: new Date().toISOString(),
        })
        .eq("status", "active")
        .lte("last_message_at", cutoff);

    if (error) throw error;
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
  status = "active"
) {
  try {
    const [
      conversationsResult,
      ordersResult,
      customersResult,
      employeesResult,
    ] = await Promise.all([
    supabase
      .from("conversations")
      .select("*")
      .eq("status", status)
      .order("last_message_at", {
        ascending: false,
      }),

      supabase
        .from("orders")
        .select("*"),

      supabase
        .from("customer_profiles")
        .select("*"),

      supabase
        .from("employees")
        .select("*"),
    ]);

    if (conversationsResult.error)
      throw conversationsResult.error;

    if (ordersResult.error)
      throw ordersResult.error;

    if (customersResult.error)
      throw customersResult.error;

    if (employeesResult.error)
      throw employeesResult.error;

    const conversations =
      conversationsResult.data ?? [];

    const orders =
      ordersResult.data ?? [];

    const customers =
      customersResult.data ?? [];

    const employees =
      employeesResult.data ?? [];

    //----------------------------------
    // LOOKUP MAPS
    //----------------------------------

    const orderMap = {};

    orders.forEach((order) => {
      orderMap[String(order.id)] = order;
    });

    const customerMap = {};

    customers.forEach((customer) => {
      if (customer.id) {
        customerMap[String(customer.id)] =
          customer;
      }

      if (customer.user_id) {
        customerMap[
          String(customer.user_id)
        ] = customer;
      }
    });

    const employeeMap = {};

    employees.forEach((employee) => {
      employeeMap[String(employee.id)] =
        employee;
    });

    //----------------------------------
    // MERGE DATA
    //----------------------------------

    return conversations.map(
      (conversation) => {
        const order =
          orderMap[
            String(conversation.order_id)
          ] || {};

        const customer =
          customerMap[
            String(order.customer_id)
          ] || {};

        const driver =
          employeeMap[
            String(order.driver_id)
          ] || {};

        //----------------------------------

        return {
          ...conversation,

          order,

          customer,

          driver,

          customerName:
            customer.full_name ||
            customer.name ||
            order.customer_name ||
            "Unknown Customer",

          customerPhone:
            customer.phone || "",

          customerEmail:
            customer.email || "",

          customerAddress:
            customer.address ||
            customer.complete_address ||
            order.delivery_address ||
            "No Address",

          driverName:
            driver.name ||
            driver.full_name ||
            "Unassigned",

          driverPhone:
            driver.phone ||
            driver.contact_number ||
            "",

          driverStatus:
            driver.driver_status ||
            driver.status ||
            "",

          totalPrice:
            order.total_price ?? 0,

          orderStatus:
            order.status ??
            "pending",
            
          conversationStatus:
            conversation.status,

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

  if (error) throw error;

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
  console.log("Sending message:", {
    conversationId,
    senderType,
    senderId,
    message,
  });

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_type: senderType,
      sender_id: senderId,
      message,
    })
    .select()
    .single();

  if (error) {
    console.error("INSERT ERROR:", error);
    throw error;
  }

  const { error: updateError } = await supabase
    .from("conversations")
    .update({

        last_message: message,

        last_message_at: new Date().toISOString(),

        status: "active",

        archived_at: null,

    })
    .eq("id", conversationId);

  if (updateError) {
    console.error("UPDATE ERROR:", updateError);
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

  if (error) throw error;
}

/*
|--------------------------------------------------------------------------
| Create Conversation
|--------------------------------------------------------------------------
*/

export async function createConversation(orderId) {

  // -----------------------------
  // Get the order first
  // -----------------------------

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (orderError) throw orderError;

  // -----------------------------
  // Look for existing conversation
  // by customer
  // -----------------------------

  const { data: existing, error: existingError } = await supabase
    .from("conversations")
    .select("*")
    .eq("customer_id", order.customer_id)
    .maybeSingle();

  if (existingError) throw existingError;

  // -----------------------------
  // Conversation exists
  // -----------------------------

  if (existing) {

    await supabase
      .from("conversations")
      .update({

        order_id: order.id,

        status: "active",

        archived_at: null,

        last_message_at: new Date().toISOString(),

      })
      .eq("id", existing.id);

    return {
      ...existing,
      order_id: order.id,
      status: "active",
    };
  }

  // -----------------------------
  // Create new conversation
  // -----------------------------

  const { data, error } = await supabase
    .from("conversations")
    .insert({

      customer_id: order.customer_id,

      order_id: order.id,

      status: "active",

      last_message_at: new Date().toISOString(),

    })
    .select()
    .single();

  if (error) throw error;

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
        filter: `conversation_id=eq.${conversationId}`,
      },
      callback
    )
    .subscribe();
}