import { createConversation } from "./messaging.service";
import { supabase } from "../lib/supabase";
import { isReservationDue } from "./reservations.service";

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
| Payment Readiness Helpers
|--------------------------------------------------------------------------
| COD/Cash orders can proceed immediately. GCash orders require admin
| verification before they can enter Delivery Management.
|--------------------------------------------------------------------------
*/

function normalizePaymentMethod(order) {
  return String(
    order?.payment_method || ""
  )
    .trim()
    .toLowerCase();
}

function normalizePaymentStatus(order) {
  return String(
    order?.payment_status || ""
  )
    .trim()
    .toLowerCase();
}

function isPaymentReadyForDelivery(order) {
  const method =
    normalizePaymentMethod(order);

  const paymentStatus =
    normalizePaymentStatus(order);

  /*
   * GCash requires admin verification.
   */
  if (
    method === "gcash" ||
    method === "g-cash"
  ) {
    return paymentStatus === "verified";
  }

  /*
   * COD/Cash can proceed without payment verification.
   */
  if (
    method === "cod" ||
    method === "cash" ||
    method === "cash on delivery"
  ) {
    return true;
  }

  /*
   * Unknown payment methods are not automatically
   * allowed into Delivery Management.
   */
  return false;
}

function isOrderReadyForDelivery(order) {
  if (!order || isRejectedOrder(order)) {
    return false;
  }

  const isScheduled =
    String(order.delivery_type || "")
      .trim()
      .toLowerCase() === "scheduled";

  if (
    isScheduled &&
    !order.driver_id &&
    !isReservationDue(order)
  ) {
    return false;
  }

  return (
    isPaymentReadyForDelivery(order)
  );
}

function filterDeliveryReadyOrders(
  orders = []
) {
  return orders.filter(
    (order) =>
      isOrderReadyForDelivery(order)
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
    | Only payment-ready orders may enter Delivery Management.
    |
    | COD/Cash:
    |   → Allowed immediately.
    |
    | GCash Pending:
    |   → Blocked.
    |
    | GCash Verified:
    |   → Allowed.
    |
    | GCash Rejected:
    |   → Blocked.
    |--------------------------------------------------------------------------
    */

    const orders =
      filterDeliveryReadyOrders(
        allOrders
      );

    /*
    |--------------------------------------------------------------------------
    | LOOKUP MAPS
    |--------------------------------------------------------------------------
    */

    const deliveryMap = {};

    deliveries.forEach(
      (delivery) => {
        if (!delivery.order_id) {
          return;
        }

        deliveryMap[
          String(
            delivery.order_id
          )
        ] = delivery;
      }
    );

    /*
    |--------------------------------------------------------------------------
    | DRIVER MAP
    |--------------------------------------------------------------------------
    */

    const driverMap = {};

    drivers.forEach(
      (driver) => {
        if (!driver.id) {
          return;
        }

        driverMap[
          String(driver.id)
        ] = {
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
      }
    );

    /*
    |--------------------------------------------------------------------------
    | CUSTOMER MAP
    |--------------------------------------------------------------------------
    */

    const customerMap = {};

    customers.forEach(
      (customer) => {
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
      }
    );

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
          isOrderReadyForDelivery(
            order
          )
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
            String(
              order.customer_id
            )
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
          Number(
            order.gallons ?? 0
          );

        /*
        |--------------------------------------------------------------------------
        | SCHEDULE
        |--------------------------------------------------------------------------
        */

        let scheduledAt = null;

        if (
          order.scheduled_date
        ) {
          scheduledAt =
            order.scheduled_date;

          if (
            order.scheduled_time
          ) {
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
                id:
                  driver.id,

                name:
                  driver.name,

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
              .substring(
                0,
                8
              )
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
      deliveries:
        merged,

      drivers,

      /*
      |--------------------------------------------------------------------------
      | Only payment-ready orders are returned for delivery.
      |
      | Pending GCash orders remain available through the Orders
      | Management service/page for admin verification.
      |--------------------------------------------------------------------------
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
          .filter(
            (delivery) => {
              const status =
                normalizeStatus(
                  delivery.status
                );

              return (
                delivery.driver &&
                status !==
                  "delivered"
              );
            }
          )
          .map(
            (delivery) =>
              delivery.driver.id
          )
      ).size,
  };
}

/*
|--------------------------------------------------------------------------
| Filter Deliveries
|--------------------------------------------------------------------------
*/

export function filterDeliveries(
  deliveries = [],
  search = "",
  status = "all"
) {
  const keyword =
    String(search || "")
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
      const customerName =
        String(
          delivery.customerName ||
            delivery.customer_name ||
            ""
        ).toLowerCase();

      const address =
        String(
          delivery.address ||
            delivery.address_text ||
            ""
        ).toLowerCase();

      const orderNumber =
        String(
          delivery.orderNumber ||
            ""
        ).toLowerCase();

      const driverName =
        String(
          delivery.driver?.name ||
            ""
        ).toLowerCase();

      const matchesSearch =
        keyword === "" ||
        customerName.includes(
          keyword
        ) ||
        address.includes(
          keyword
        ) ||
        orderNumber.includes(
          keyword
        ) ||
        driverName.includes(
          keyword
        );

      const normalizedStatus =
        normalizeStatus(
          delivery.status
        );

      const matchesStatus =
        status === "all" ||
        normalizedStatus ===
          status;

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
  | Validate Delivery ID
  |--------------------------------------------------------------------------
  */

  if (!deliveryId) {
    throw new Error(
      "Delivery ID is required."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Validate Driver ID
  |--------------------------------------------------------------------------
  */

  if (!driverId) {
    throw new Error(
      "Driver ID is required."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Get Current Deliveries
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
  | Delivery Not Found
  |--------------------------------------------------------------------------
  */

  if (!selected) {
    throw new Error(
      "Delivery not found."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | FINAL PAYMENT VERIFICATION
  |--------------------------------------------------------------------------
  |
  | This is an additional protection.
  |
  | Even though getDeliveries() already removes unverified GCash
  | orders, we check the order again before assigning a driver.
  |
  */

  if (
    !isOrderReadyForDelivery(
      selected.order
    )
  ) {
    const paymentMethod =
      normalizePaymentMethod(
        selected.order
      );

    const paymentStatus =
      normalizePaymentStatus(
        selected.order
      );

    /*
    |--------------------------------------------------------------------------
    | GCash Pending / Unverified
    |--------------------------------------------------------------------------
    */

    if (
      paymentMethod ===
        "gcash" ||
      paymentMethod ===
        "g-cash"
    ) {
      throw new Error(
        `This GCash order cannot be assigned yet. ` +
        `Payment status: ${
          paymentStatus ||
          "pending"
        }. ` +
        `Please verify the GCash payment first.`
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Other Invalid Payment
    |--------------------------------------------------------------------------
    */

    throw new Error(
      "This order is not ready for delivery."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Rejected Order Protection
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
  | Don't Assign Completed/Cancelled Orders
  |--------------------------------------------------------------------------
  */

  const currentStatus =
    normalizeStatus(
      selected.status
    );

  if (
    currentStatus ===
      "cancelled" ||
    currentStatus ===
      "delivered"
  ) {
    throw new Error(
      "This delivery can no longer be assigned."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Verify Driver
  |--------------------------------------------------------------------------
  */

  const {
    data: driver,
    error:
      driverError,
  } = await supabase
    .from("employees")
    .select("*")
    .eq(
      "id",
      driverId
    )
    .maybeSingle();

  if (driverError) {
    throw driverError;
  }

  if (!driver) {
    throw new Error(
      "Driver not found."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Check Existing Delivery
  |--------------------------------------------------------------------------
  */

  const {
    data: existingDelivery,
    error:
      existingError,
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

  if (existingDelivery) {
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
        existingDelivery.id
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
  | Synchronize Orders Table
  |--------------------------------------------------------------------------
  */

  const {
    error:
      orderError,
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
  | Create Conversation
  |--------------------------------------------------------------------------
  |
  | The customer and assigned driver can communicate
  | through the order conversation.
  |
  */

  try {
    await createConversation(
      selected.order_id
    );
  } catch (error) {
    /*
     * Conversation creation should not undo a successful
     * driver assignment.
     */
    console.error(
      "Failed to create delivery conversation:",
      error
    );
  }

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
  | Validate Delivery ID
  |--------------------------------------------------------------------------
  */

  if (!deliveryId) {
    throw new Error(
      "Delivery ID is required."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Normalize Requested Status
  |--------------------------------------------------------------------------
  */

  const normalizedStatus =
    normalizeStatus(
      status
    );

  /*
  |--------------------------------------------------------------------------
  | Validate Status
  |--------------------------------------------------------------------------
  */

  const validStatuses = [
    "pending",
    "assigned",
    "in_transit",
    "delivered",
    "cancelled",
  ];

  if (
    !validStatuses.includes(
      normalizedStatus
    )
  ) {
    throw new Error(
      `Invalid delivery status: ${status}`
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Get Current Deliveries
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
  | Delivery Not Found
  |--------------------------------------------------------------------------
  */

  if (!selected) {
    throw new Error(
      "Delivery not found."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | FINAL PAYMENT VERIFICATION
  |--------------------------------------------------------------------------
  |
  | An unverified GCash order must never be moved through
  | Delivery Management.
  |
  */

  if (
    !isOrderReadyForDelivery(
      selected.order
    )
  ) {
    const paymentMethod =
      normalizePaymentMethod(
        selected.order
      );

    const paymentStatus =
      normalizePaymentStatus(
        selected.order
      );

    if (
      paymentMethod ===
        "gcash" ||
      paymentMethod ===
        "g-cash"
    ) {
      throw new Error(
        `This GCash order cannot be processed because its payment ` +
        `has not been verified. Current payment status: ${
          paymentStatus ||
          "pending"
        }.`
      );
    }

    throw new Error(
      "This order is not ready for delivery."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Rejected Order Protection
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
  | Get Existing Delivery
  |--------------------------------------------------------------------------
  */

  const {
    data: existingDelivery,
    error:
      existingError,
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
  | Update Existing Delivery
  |--------------------------------------------------------------------------
  */

  if (existingDelivery) {
    const updateData = {
      status:
        normalizedStatus,
    };

    if (
      normalizedStatus ===
      "delivered"
    ) {
      updateData.delivered_at =
        new Date().toISOString();
    }

    /*
    |--------------------------------------------------------------------------
    | Remove driver when cancelled
    |--------------------------------------------------------------------------
    */

    if (
      normalizedStatus ===
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
        existingDelivery.id
      );

    if (error) {
      throw error;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Create Missing Delivery
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
          normalizedStatus ===
          "cancelled"
            ? null
            : selected
                .driver?.id ||
              null,

        status:
          normalizedStatus,

        delivered_at:
          normalizedStatus ===
          "delivered"
            ? new Date().toISOString()
            : null,
      });

    if (error) {
      throw error;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Synchronize Orders Table
  |--------------------------------------------------------------------------
  */

  const orderUpdate = {
    status:
      normalizedStatus,
  };

  /*
  |--------------------------------------------------------------------------
  | Remove Driver When Cancelled
  |--------------------------------------------------------------------------
  */

  if (
    normalizedStatus ===
    "cancelled"
  ) {
    orderUpdate.driver_id =
      null;
  }

  const {
    error:
      orderError,
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
  | Delivered Conversation Handling
  |--------------------------------------------------------------------------
  */

  if (
    normalizedStatus ===
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

    if (
      conversationError
    ) {
      /*
       * Do not undo a successfully completed delivery because
       * conversation updating failed.
       */
      console.error(
        "Failed to update conversation after delivery:",
        conversationError
      );
    }
  }

  return true;
}

/*
|--------------------------------------------------------------------------
| Get Delivery By ID
|--------------------------------------------------------------------------
*/

export async function getDeliveryById(
  deliveryId
) {
  if (!deliveryId) {
    throw new Error(
      "Delivery ID is required."
    );
  }

  const {
    data: delivery,
    error,
  } = await supabase
    .from("deliveries")
    .select("*")
    .eq(
      "id",
      deliveryId
    )
    .maybeSingle();

  if (error) {
    console.error(
      "getDeliveryById()",
      error
    );

    throw error;
  }

  if (!delivery) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | Load Related Order
  |--------------------------------------------------------------------------
  */

  let order = null;

  if (delivery.order_id) {
    const {
      data: orderData,
      error: orderError,
    } = await supabase
      .from("orders")
      .select("*")
      .eq(
        "id",
        delivery.order_id
      )
      .maybeSingle();

    if (orderError) {
      throw orderError;
    }

    order =
      orderData || null;
  }

  /*
  |--------------------------------------------------------------------------
  | Determine Payment/Delivery Eligibility
  |--------------------------------------------------------------------------
  */

  const readyForDelivery =
    order
      ? isOrderReadyForDelivery(
          order
        )
      : false;

  return {
    ...delivery,

    order,

    readyForDelivery,
  };
}

/*
|--------------------------------------------------------------------------
| Get Pending Orders Ready For Delivery
|--------------------------------------------------------------------------
*/

export async function getPendingOrdersForDelivery() {
  const {
    data,
    error,
  } = await supabase
    .from("orders")
    .select("*")
    .eq(
      "status",
      "pending"
    )
    .order(
      "created_at",
      {
        ascending: true,
      }
    );

  if (error) {
    console.error(
      "getPendingOrdersForDelivery()",
      error
    );

    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | IMPORTANT:
  |
  | Apply the same payment eligibility rule used by
  | getDeliveries().
  |
  | This means:
  |
  | COD/Cash       -> included
  | GCash Pending  -> excluded
  | GCash Verified -> included
  | GCash Rejected -> excluded
  |--------------------------------------------------------------------------
  */

  return (
    data || []
  ).filter(
    (order) =>
      isOrderReadyForDelivery(
        order
      )
  );
}

/*
|--------------------------------------------------------------------------
| Get Available Drivers
|--------------------------------------------------------------------------
*/

export async function getAvailableDrivers() {
  const {
    data,
    error,
  } = await supabase
    .from("employees")
    .select("*")
    .ilike(
      "role",
      "driver"
    );

  if (error) {
    console.error(
      "getAvailableDrivers()",
      error
    );

    throw error;
  }

  return data || [];
}

/*
|--------------------------------------------------------------------------
| Get Driver Deliveries
|--------------------------------------------------------------------------
*/

export async function getDriverDeliveries(
  driverId
) {
  if (!driverId) {
    throw new Error(
      "Driver ID is required."
    );
  }

  const {
    data,
    error,
  } = await supabase
    .from("deliveries")
    .select("*")
    .eq(
      "driver_id",
      driverId
    )
    .order(
      "created_at",
      {
        ascending: false,
      }
    );

  if (error) {
    console.error(
      "getDriverDeliveries()",
      error
    );

    throw error;
  }

  const deliveries =
    data || [];

  /*
  |--------------------------------------------------------------------------
  | No deliveries
  |--------------------------------------------------------------------------
  */

  if (
    deliveries.length ===
    0
  ) {
    return [];
  }

  /*
  |--------------------------------------------------------------------------
  | Get Related Order IDs
  |--------------------------------------------------------------------------
  */

  const orderIds =
    deliveries
      .map(
        (delivery) =>
          delivery.order_id
      )
      .filter(Boolean);

  if (
    orderIds.length ===
    0
  ) {
    return deliveries;
  }

  /*
  |--------------------------------------------------------------------------
  | Load Orders
  |--------------------------------------------------------------------------
  */

  const {
    data: orders,
    error: ordersError,
  } = await supabase
    .from("orders")
    .select("*")
    .in(
      "id",
      orderIds
    );

  if (ordersError) {
    throw ordersError;
  }

  /*
  |--------------------------------------------------------------------------
  | Create Order Map
  |--------------------------------------------------------------------------
  */

  const orderMap = {};

  (
    orders || []
  ).forEach(
    (order) => {
      orderMap[
        String(
          order.id
        )
      ] = order;
    }
  );

  /*
  |--------------------------------------------------------------------------
  | Merge Delivery + Order
  |--------------------------------------------------------------------------
  */

  return deliveries.map(
    (delivery) => {
      const order =
        orderMap[
          String(
            delivery.order_id
          )
        ] || null;

      return {
        ...delivery,

        order,

        readyForDelivery:
          order
            ? isOrderReadyForDelivery(
                order
              )
            : false,
      };
    }
  );
}

/*
|--------------------------------------------------------------------------
| Cancel Delivery
|--------------------------------------------------------------------------
*/

export async function cancelDelivery(
  deliveryId
) {
  if (!deliveryId) {
    throw new Error(
      "Delivery ID is required."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Find Delivery
  |--------------------------------------------------------------------------
  */

  const {
    data: delivery,
    error: deliveryError,
  } = await supabase
    .from("deliveries")
    .select("*")
    .eq(
      "id",
      deliveryId
    )
    .maybeSingle();

  if (deliveryError) {
    throw deliveryError;
  }

  if (!delivery) {
    throw new Error(
      "Delivery not found."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Get Related Order
  |--------------------------------------------------------------------------
  */

  let order = null;

  if (delivery.order_id) {
    const {
      data: orderData,
      error: orderError,
    } = await supabase
      .from("orders")
      .select("*")
      .eq(
        "id",
        delivery.order_id
      )
      .maybeSingle();

    if (orderError) {
      throw orderError;
    }

    order =
      orderData || null;
  }

  /*
  |--------------------------------------------------------------------------
  | Do Not Cancel Delivered Order
  |--------------------------------------------------------------------------
  */

  if (
    order &&
    normalizeStatus(
      order.status
    ) === "delivered"
  ) {
    throw new Error(
      "A delivered order cannot be cancelled."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Cancel Delivery
  |--------------------------------------------------------------------------
  */

  const {
    error,
  } = await supabase
    .from("deliveries")
    .update({
      status:
        "cancelled",

      driver_id:
        null,
    })
    .eq(
      "id",
      deliveryId
    );

  if (error) {
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Cancel Related Order
  |--------------------------------------------------------------------------
  */

  if (delivery.order_id) {
    const {
      error:
        orderUpdateError,
    } = await supabase
      .from("orders")
      .update({
        status:
          "cancelled",

        driver_id:
          null,
      })
      .eq(
        "id",
        delivery.order_id
      );

    if (
      orderUpdateError
    ) {
      throw orderUpdateError;
    }
  }

  return true;
}

/*
|--------------------------------------------------------------------------
| Unassign Driver
|--------------------------------------------------------------------------
*/

export async function unassignDriver(
  deliveryId
) {
  if (!deliveryId) {
    throw new Error(
      "Delivery ID is required."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Find Delivery
  |--------------------------------------------------------------------------
  */

  const {
    data: delivery,
    error,
  } = await supabase
    .from("deliveries")
    .select("*")
    .eq(
      "id",
      deliveryId
    )
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!delivery) {
    throw new Error(
      "Delivery not found."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Don't Unassign Delivered Delivery
  |--------------------------------------------------------------------------
  */

  if (
    normalizeStatus(
      delivery.status
    ) === "delivered"
  ) {
    throw new Error(
      "A delivered order cannot be unassigned."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Remove Driver
  |--------------------------------------------------------------------------
  */

  const {
    error:
      updateError,
  } = await supabase
    .from("deliveries")
    .update({
      driver_id:
        null,

      status:
        "pending",
    })
    .eq(
      "id",
      deliveryId
    );

  if (updateError) {
    throw updateError;
  }

  /*
  |--------------------------------------------------------------------------
  | Reset Order
  |--------------------------------------------------------------------------
  */

  if (delivery.order_id) {
    const {
      error:
        orderError,
    } = await supabase
      .from("orders")
      .update({
        driver_id:
          null,

        status:
          "pending",
      })
      .eq(
        "id",
        delivery.order_id
      );

    if (orderError) {
      throw orderError;
    }
  }

  return true;
}

