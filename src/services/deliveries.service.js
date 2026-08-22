import { createConversation } from "./messaging.service";
import { supabase } from "../lib/supabase";

/*
|--------------------------------------------------------------------------
| Status Normalizer
|--------------------------------------------------------------------------
*/

function normalizeStatus(status = "") {
  const s = String(status)
    .trim()
    .toLowerCase();

  switch (s) {
    case "pending":
      return "pending";

    case "assigned":
      return "assigned";

    case "on_the_way":
    case "on the way":
    case "in_progress":
    case "in progress":
    case "in_transit":
    case "in transit":
      return "in_transit";

    case "completed":
    case "delivered":
      return "delivered";

    case "cancelled":
    case "canceled":
      return "cancelled";

    case "rejected":
    case "declined":
      return "rejected";

    default:
      return s;
  }
}

/*
|--------------------------------------------------------------------------
| Rejected Order / Payment Helpers
|--------------------------------------------------------------------------
*/

/**
 * Check whether the payment has been rejected.
 *
 * Orders with rejected payment must NEVER appear
 * in Delivery Management.
 */
function isRejectedPayment(order) {
  const paymentStatus = String(
    order?.payment_status || ""
  )
    .trim()
    .toLowerCase();

  return [
    "rejected",
    "declined",
    "failed",
  ].includes(paymentStatus);
}

/**
 * Check whether the order itself has been rejected.
 */
function isRejectedOrderStatus(order) {
  const orderStatus = normalizeStatus(
    order?.status
  );

  return [
    "rejected",
    "declined",
  ].includes(orderStatus);
}

/**
 * Final safety check.
 *
 * If either the order status OR payment status
 * indicates rejection, the order must not be
 * processed by Delivery Management.
 */
function isRejectedOrder(order) {
  return (
    isRejectedPayment(order) ||
    isRejectedOrderStatus(order)
  );
}

/**
 * Remove rejected orders from a list.
 */
function filterValidOrders(orders = []) {
  return orders.filter(
    (order) => !isRejectedOrder(order)
  );
}

/*
|--------------------------------------------------------------------------
| Fetch Deliveries
|--------------------------------------------------------------------------
*/

export async function getDeliveries() {
  try {
    const [
      deliveriesResult,
      ordersResult,
      driversResult,
      customersResult,
    ] = await Promise.all([
      /*
      |--------------------------------------------------------------------------
      | Deliveries
      |--------------------------------------------------------------------------
      */

      supabase
        .from("deliveries")
        .select("*"),

      /*
      |--------------------------------------------------------------------------
      | Orders
      |--------------------------------------------------------------------------
      */

      supabase
        .from("orders")
        .select("*")
        .order("created_at", {
          ascending: false,
        }),

      /*
      |--------------------------------------------------------------------------
      | Drivers
      |--------------------------------------------------------------------------
      */

      supabase
        .from("employees")
        .select("*")
        .ilike("role", "driver"),

      /*
      |--------------------------------------------------------------------------
      | Customers
      |--------------------------------------------------------------------------
      */

      supabase
        .from("customer_profiles")
        .select("*"),
    ]);

    if (deliveriesResult.error) {
      throw deliveriesResult.error;
    }

    if (ordersResult.error) {
      throw ordersResult.error;
    }

    if (driversResult.error) {
      throw driversResult.error;
    }

    if (customersResult.error) {
      throw customersResult.error;
    }

    /*
    |--------------------------------------------------------------------------
    | Raw Data
    |--------------------------------------------------------------------------
    */

    const deliveries =
      deliveriesResult.data ?? [];

    const allOrders =
      ordersResult.data ?? [];

    const drivers =
      driversResult.data ?? [];

    const customers =
      customersResult.data ?? [];

    /*
    |--------------------------------------------------------------------------
    | IMPORTANT:
    | REMOVE REJECTED ORDERS
    |--------------------------------------------------------------------------
    |
    | A rejected payment/order belongs to Order Management.
    | It must never enter the Delivery Queue.
    |
    */

    const orders =
      filterValidOrders(allOrders);

    /*
    |--------------------------------------------------------------------------
    | LOOKUP MAPS
    |--------------------------------------------------------------------------
    */

    const deliveryMap = {};

    deliveries.forEach((delivery) => {
      if (!delivery.order_id) {
        return;
      }

      deliveryMap[
        String(delivery.order_id)
      ] = delivery;
    });

    /*
    |--------------------------------------------------------------------------
    | DRIVER MAP
    |--------------------------------------------------------------------------
    */

    const driverMap = {};

    drivers.forEach((driver) => {
      if (!driver.id) {
        return;
      }

      driverMap[String(driver.id)] = {
        ...driver,

        name:
          driver.name ||
          driver.full_name ||
          "Unknown Driver",

        phone:
          driver.phone ||
          driver.contact_number ||
          "",
      };
    });

    /*
    |--------------------------------------------------------------------------
    | CUSTOMER MAP
    |--------------------------------------------------------------------------
    */

    const customerMap = {};

    customers.forEach((customer) => {
      if (customer.id) {
        customerMap[
          String(customer.id)
        ] = customer;
      }

      if (customer.user_id) {
        customerMap[
          String(customer.user_id)
        ] = customer;
      }
    });

    /*
    |--------------------------------------------------------------------------
    | MERGE ORDERS + DELIVERIES
    |--------------------------------------------------------------------------
    */

    const merged = orders
      /*
      |--------------------------------------------------------------------------
      | SECOND SAFETY FILTER
      |--------------------------------------------------------------------------
      */

      .filter(
        (order) =>
          !isRejectedOrder(order)
      )

      .map((order) => {
        /*
        |--------------------------------------------------------------------------
        | FIND DELIVERY
        |--------------------------------------------------------------------------
        */

        const delivery =
          deliveryMap[
            String(order.id)
          ] || null;

        /*
        |--------------------------------------------------------------------------
        | CUSTOMER
        |--------------------------------------------------------------------------
        */

        const customer =
          customerMap[
            String(order.customer_id)
          ] || {};

        /*
        |--------------------------------------------------------------------------
        | DRIVER
        |--------------------------------------------------------------------------
        */

        const driverId =
          delivery?.driver_id ||
          order.driver_id ||
          null;

        const driver =
          driverId
            ? driverMap[
                String(driverId)
              ] || null
            : null;

        /*
        |--------------------------------------------------------------------------
        | CUSTOMER INFO
        |--------------------------------------------------------------------------
        */

        const customerName =
          customer.full_name ||
          customer.name ||
          customer.customer_name ||
          order.customer_name ||
          delivery?.customer_name ||
          "Unknown Customer";

        const address =
          order.delivery_address ||
          order.address ||
          delivery?.address_text ||
          customer.address ||
          customer.complete_address ||
          "No Address";

        const phone =
          customer.phone || "";

        const gallons =
          Number(order.gallons ?? 0);

        /*
        |--------------------------------------------------------------------------
        | SCHEDULE
        |--------------------------------------------------------------------------
        */

        let scheduledAt = null;

        if (order.scheduled_date) {
          scheduledAt =
            order.scheduled_date;

          if (order.scheduled_time) {
            scheduledAt +=
              " " +
              order.scheduled_time;
          }
        }

        /*
        |--------------------------------------------------------------------------
        | RESOLVE FINAL STATUS
        |--------------------------------------------------------------------------
        */

        const orderStatus =
          normalizeStatus(
            order.status
          );

        const deliveryStatus =
          normalizeStatus(
            delivery?.status
          );

        let finalStatus =
          "pending";

        /*
        |--------------------------------------------------------------------------
        | ORDER STATUS HAS HIGHEST PRIORITY
        |--------------------------------------------------------------------------
        */

        if (
          orderStatus ===
          "cancelled"
        ) {
          finalStatus =
            "cancelled";
        }

        else if (
          orderStatus ===
          "delivered"
        ) {
          finalStatus =
            "delivered";
        }

        else if (
          orderStatus ===
          "in_transit"
        ) {
          finalStatus =
            "in_transit";
        }

        else if (
          orderStatus ===
          "assigned"
        ) {
          finalStatus =
            "assigned";
        }

        /*
        |--------------------------------------------------------------------------
        | FALLBACK TO DELIVERY STATUS
        |--------------------------------------------------------------------------
        */

        else if (
          deliveryStatus ===
          "cancelled"
        ) {
          finalStatus =
            "cancelled";
        }

        else if (
          deliveryStatus ===
          "delivered"
        ) {
          finalStatus =
            "delivered";
        }

        else if (
          deliveryStatus ===
          "in_transit"
        ) {
          finalStatus =
            "in_transit";
        }

        else if (
          deliveryStatus ===
          "assigned"
        ) {
          finalStatus =
            "assigned";
        }

        /*
        |--------------------------------------------------------------------------
        | RETURN MERGED DELIVERY
        |--------------------------------------------------------------------------
        */

        return {
          id:
            delivery?.id ||
            order.id,

          order_id:
            order.id,

          customer_id:
            order.customer_id,

          address_id:
            order.address_id,

          customer_name:
            customerName,

          address_text:
            address,

          latitude:
            delivery?.latitude ??
            order.latitude,

          longitude:
            delivery?.longitude ??
            order.longitude,

          order,

          customer,

          driver: driver
            ? {
                id: driver.id,

                name: driver.name,

                phone:
                  driver.phone,

                status:
                  driver.driver_status ||
                  driver.status,
              }
            : null,

          sourceType:
            delivery
              ? "delivery"
              : "pending_order",

          status:
            finalStatus,

          customerName,

          address,

          phone,

          orderNumber:
            `ORD-${String(
              order.id
            )
              .substring(0, 8)
              .toUpperCase()}`,

          deliveryType:
            order.delivery_type,

          containers:
            gallons,

          scheduledAt,

          created_at:
            order.created_at,
        };
      });

    /*
    |--------------------------------------------------------------------------
    | RETURN DATA
    |--------------------------------------------------------------------------
    */

    return {
      deliveries: merged,

      drivers,

      /*
      | Return ONLY valid orders.
      | Rejected orders are intentionally excluded.
      */
      orders,
    };
  } catch (error) {
    console.error(
      "getDeliveries()",
      error
    );

    return {
      deliveries: [],

      drivers: [],

      orders: [],
    };
  }
}

/*
|--------------------------------------------------------------------------
| Statistics
|--------------------------------------------------------------------------
*/

export function getDeliveryStats(
  deliveries = []
) {
  /*
  |--------------------------------------------------------------------------
  | Remove cancelled deliveries
  |--------------------------------------------------------------------------
  */

  const activeDeliveries =
    deliveries.filter(
      (delivery) =>
        normalizeStatus(
          delivery.status
        ) !== "cancelled"
    );

  return {
    /*
    |--------------------------------------------------------------------------
    | Total
    |--------------------------------------------------------------------------
    */

    total:
      activeDeliveries.length,

    /*
    |--------------------------------------------------------------------------
    | Pending
    |--------------------------------------------------------------------------
    */

    pending:
      activeDeliveries.filter(
        (delivery) =>
          normalizeStatus(
            delivery.status
          ) === "pending"
      ).length,

    /*
    |--------------------------------------------------------------------------
    | Assigned
    |--------------------------------------------------------------------------
    */

    assigned:
      activeDeliveries.filter(
        (delivery) =>
          normalizeStatus(
            delivery.status
          ) === "assigned"
      ).length,

    /*
    |--------------------------------------------------------------------------
    | In Transit
    |--------------------------------------------------------------------------
    */

    inTransit:
      activeDeliveries.filter(
        (delivery) =>
          normalizeStatus(
            delivery.status
          ) === "in_transit"
      ).length,

    /*
    |--------------------------------------------------------------------------
    | Delivered
    |--------------------------------------------------------------------------
    */

    delivered:
      activeDeliveries.filter(
        (delivery) =>
          normalizeStatus(
            delivery.status
          ) === "delivered"
      ).length,

    /*
    |--------------------------------------------------------------------------
    | Active Drivers
    |--------------------------------------------------------------------------
    */

    activeDrivers:
      new Set(
        activeDeliveries
          .filter((delivery) => {
            const status =
              normalizeStatus(
                delivery.status
              );

            return (
              delivery.driver &&
              status !==
                "delivered"
            );
          })
          .map(
            (delivery) =>
              delivery.driver.id
          )
      ).size,
  };
}

/*
|--------------------------------------------------------------------------
| Search & Filter
|--------------------------------------------------------------------------
*/

export function filterDeliveries(
  deliveries = [],
  search = "",
  status = "all"
) {
  const keyword =
    search
      .toLowerCase()
      .trim();

  /*
  |--------------------------------------------------------------------------
  | Hide cancelled deliveries
  |--------------------------------------------------------------------------
  */

  const visibleDeliveries =
    deliveries.filter(
      (delivery) =>
        normalizeStatus(
          delivery.status
        ) !== "cancelled"
    );

  return visibleDeliveries.filter(
    (delivery) => {
      const matchesSearch =
        delivery.customerName
          ?.toLowerCase()
          .includes(keyword)

        ||

        delivery.address
          ?.toLowerCase()
          .includes(keyword)

        ||

        delivery.orderNumber
          ?.toLowerCase()
          .includes(keyword)

        ||

        delivery.driver?.name
          ?.toLowerCase()
          .includes(keyword);

      const matchesStatus =
        status === "all" ||
        normalizeStatus(
          delivery.status
        ) === status;

      return (
        matchesSearch &&
        matchesStatus
      );
    }
  );
}

/*
|--------------------------------------------------------------------------
| Assign Driver
|--------------------------------------------------------------------------
*/

export async function assignDriver(
  deliveryId,
  driverId
) {
  /*
  |--------------------------------------------------------------------------
  | Get current deliveries
  |--------------------------------------------------------------------------
  */

  const {
    deliveries,
  } = await getDeliveries();

  const selected =
    deliveries.find(
      (delivery) =>
        String(
          delivery.id
        ) ===
        String(deliveryId)
    );

  /*
  |--------------------------------------------------------------------------
  | Delivery not found
  |--------------------------------------------------------------------------
  */

  if (!selected) {
    throw new Error(
      "Delivery not found."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | FINAL REJECTED ORDER PROTECTION
  |--------------------------------------------------------------------------
  */

  if (
    isRejectedOrder(
      selected.order
    )
  ) {
    throw new Error(
      "This order was rejected and cannot be assigned for delivery."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Don't assign completed/cancelled
  |--------------------------------------------------------------------------
  */

  if (
    selected.status ===
      "cancelled" ||
    selected.status ===
      "delivered"
  ) {
    throw new Error(
      "This delivery can no longer be assigned."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Check if delivery exists
  |--------------------------------------------------------------------------
  */

  const {
    data: existing,
    error: existingError,
  } = await supabase
    .from("deliveries")
    .select("*")
    .eq(
      "order_id",
      selected.order_id
    )
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  /*
  |--------------------------------------------------------------------------
  | UPDATE EXISTING DELIVERY
  |--------------------------------------------------------------------------
  */

  if (existing) {
    const {
      error,
    } = await supabase
      .from("deliveries")
      .update({
        driver_id:
          driverId,

        status:
          "assigned",
      })
      .eq(
        "id",
        existing.id
      );

    if (error) {
      throw error;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | CREATE DELIVERY
  |--------------------------------------------------------------------------
  */

  else {
    const {
      error,
    } = await supabase
      .from("deliveries")
      .insert({
        order_id:
          selected.order_id,

        customer_id:
          selected.customer_id,

        customer_name:
          selected.customerName,

        address_text:
          selected.address,

        latitude:
          selected.latitude,

        longitude:
          selected.longitude,

        driver_id:
          driverId,

        status:
          "assigned",
      });

    if (error) {
      throw error;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Keep Orders Synchronized
  |--------------------------------------------------------------------------
  */

  const {
    error: orderError,
  } = await supabase
    .from("orders")
    .update({
      driver_id:
        driverId,

      status:
        "assigned",
    })
    .eq(
      "id",
      selected.order_id
    );

  if (orderError) {
    throw orderError;
  }

  /*
  |--------------------------------------------------------------------------
  | Automatically create conversation
  |--------------------------------------------------------------------------
  */

  await createConversation(
    selected.order_id
  );

  return true;
}

/*
|--------------------------------------------------------------------------
| Update Delivery Status
|--------------------------------------------------------------------------
*/

export async function updateDeliveryStatus(
  deliveryId,
  status
) {
  /*
  |--------------------------------------------------------------------------
  | Normalize status
  |--------------------------------------------------------------------------
  */

  status =
    normalizeStatus(status);

  /*
  |--------------------------------------------------------------------------
  | Get current deliveries
  |--------------------------------------------------------------------------
  */

  const {
    deliveries,
  } = await getDeliveries();

  const selected =
    deliveries.find(
      (delivery) =>
        String(
          delivery.id
        ) ===
        String(deliveryId)
    );

  /*
  |--------------------------------------------------------------------------
  | Delivery not found
  |--------------------------------------------------------------------------
  */

  if (!selected) {
    throw new Error(
      "Delivery not found."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | FINAL REJECTED ORDER PROTECTION
  |--------------------------------------------------------------------------
  */

  if (
    isRejectedOrder(
      selected.order
    )
  ) {
    throw new Error(
      "This order was rejected and its delivery cannot be updated."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Find delivery row
  |--------------------------------------------------------------------------
  */

  const {
    data: existing,
    error: existingError,
  } = await supabase
    .from("deliveries")
    .select("*")
    .eq(
      "order_id",
      selected.order_id
    )
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  /*
  |--------------------------------------------------------------------------
  | Update Delivery
  |--------------------------------------------------------------------------
  */

  if (existing) {
    const updateData = {
      status,
    };

    /*
    |--------------------------------------------------------------------------
    | Remove driver if cancelled
    |--------------------------------------------------------------------------
    */

    if (
      status ===
      "cancelled"
    ) {
      updateData.driver_id =
        null;
    }

    const {
      error,
    } = await supabase
      .from("deliveries")
      .update(updateData)
      .eq(
        "id",
        existing.id
      );

    if (error) {
      throw error;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Create Delivery if Missing
  |--------------------------------------------------------------------------
  */

  else {
    const {
      error,
    } = await supabase
      .from("deliveries")
      .insert({
        order_id:
          selected.order_id,

        customer_id:
          selected.customer_id,

        customer_name:
          selected.customerName,

        address_text:
          selected.address,

        latitude:
          selected.latitude,

        longitude:
          selected.longitude,

        driver_id:
          status ===
          "cancelled"
            ? null
            : selected
                .driver?.id ||
              null,

        status,
      });

    if (error) {
      throw error;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Update Orders Table
  |--------------------------------------------------------------------------
  */

  const orderUpdate = {
    status,
  };

  /*
  |--------------------------------------------------------------------------
  | Remove driver if cancelled
  |--------------------------------------------------------------------------
  */

  if (
    status ===
    "cancelled"
  ) {
    orderUpdate.driver_id =
      null;
  }

  const {
    error: orderError,
  } = await supabase
    .from("orders")
    .update(orderUpdate)
    .eq(
      "id",
      selected.order_id
    );

  if (orderError) {
    throw orderError;
  }

  /*
  |--------------------------------------------------------------------------
  | Start Archive Countdown
  |--------------------------------------------------------------------------
  */

  if (
    status ===
    "delivered"
  ) {
    const {
      error:
        conversationError,
    } = await supabase
      .from("conversations")
      .update({
        delivered_at:
          new Date().toISOString(),

        status:
          "active",
      })
      .eq(
        "order_id",
        selected.order_id
      );

    if (conversationError) {
      throw conversationError;
    }
  }

  return true;
}