import { supabase } from "./supabase";

/*
|--------------------------------------------------------------------------
| Helper: Normalize Order Status
|--------------------------------------------------------------------------
|
| Converts the different status formats that may exist in the database
| into the status values used by the Orders UI.
|
*/

export function normalizeStatus(status = "") {
  const value = String(status || "")
    .toLowerCase()
    .trim();

  switch (value) {
    case "pending":
      return "pending";

    case "assigned":
    case "ready":
    case "ready_for_delivery":
    case "ready for delivery":
      return "assigned";

    case "on_the_way":
    case "on the way":
    case "in_transit":
    case "in transit":
    case "in_progress":
    case "in progress":
      return "on_the_way";

    case "completed":
    case "delivered":
      return "delivered";

    case "cancelled":
    case "canceled":
      return "cancelled";

    default:
      /*
       * Do not turn an existing database status into "unknown"
       * unnecessarily. Return the original normalized value.
       */
      return value || "pending";
  }
}

/*
|--------------------------------------------------------------------------
| Helper: Check Rejected Payment
|--------------------------------------------------------------------------
*/

function isRejectedPayment(order) {
  return (
    String(order?.payment_status || "")
      .toLowerCase()
      .trim() === "rejected"
  );
}

/*
|--------------------------------------------------------------------------
| Get All Orders
|--------------------------------------------------------------------------
|
| Reads the existing orders table.
|
| IMPORTANT:
| This function DOES NOT insert, update, or delete anything.
|
*/

export async function getOrders() {
  console.log("[Orders] Loading orders from Supabase...");

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error("[Orders] Supabase error:", error);
    throw error;
  }

  console.log(
    `[Orders] ${data?.length || 0} records loaded`
  );

  /*
   * Keep every database record here.
   *
   * Rejected payments are filtered later by the UI/filter functions.
   * This prevents getOrders() from unexpectedly returning an empty
   * array when the database contains orders.
   */

  return (data || []).map((order) => ({
    ...order,

    // Normalized status used by the UI
    status: normalizeStatus(order.status),

    // Keep original database values available
    original_status: order.status,

    // Safe numeric values
    gallons:
      order.gallons !== null &&
      order.gallons !== undefined
        ? Number(order.gallons)
        : 0,

    total_price:
      order.total_price !== null &&
      order.total_price !== undefined
        ? Number(order.total_price)
        : 0,

    // Product information from products/order snapshot
    product_name:
      order.product_name || "Product",

    capacity:
      order.capacity || "",

    // Customer information
    customer_name:
      order.customer_name || "Unknown Customer",

    // Delivery type
    delivery_type:
      order.delivery_type || "",

    // Payment information
    payment_status:
      order.payment_status || "Pending",

    payment_method:
      order.payment_method || "Cash",
  }));
}

/*
|--------------------------------------------------------------------------
| Get Visible Orders
|--------------------------------------------------------------------------
|
| Used when the page should exclude rejected payments.
|
*/

export async function getVisibleOrders() {
  const orders = await getOrders();

  return orders.filter(
    (order) => !isRejectedPayment(order)
  );
}

/*
|--------------------------------------------------------------------------
| Get Single Order
|--------------------------------------------------------------------------
*/

export async function getOrderById(orderId) {
  if (!orderId) {
    throw new Error("Order ID is required.");
  }

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    console.error(
      "[Orders] Failed to load order:",
      error
    );

    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    ...data,

    status: normalizeStatus(data.status),

    original_status: data.status,

    gallons:
      data.gallons !== null &&
      data.gallons !== undefined
        ? Number(data.gallons)
        : 0,

    total_price:
      data.total_price !== null &&
      data.total_price !== undefined
        ? Number(data.total_price)
        : 0,

    product_name:
      data.product_name || "Product",

    capacity:
      data.capacity || "",

    customer_name:
      data.customer_name || "Unknown Customer",

    payment_status:
      data.payment_status || "Pending",

    payment_method:
      data.payment_method || "Cash",
  };
}

/*
|--------------------------------------------------------------------------
| Dashboard Stats for Orders
|--------------------------------------------------------------------------
*/

export async function getOrderStats() {
  const orders = await getVisibleOrders();

  return {
    total: orders.length,

    pending: orders.filter(
      (order) =>
        order.status === "pending"
    ).length,

    onTheWay: orders.filter(
      (order) =>
        order.status === "assigned" ||
        order.status === "on_the_way"
    ).length,

    delivered: orders.filter(
      (order) =>
        order.status === "delivered"
    ).length,
  };
}

/*
|--------------------------------------------------------------------------
| Filter Orders
|--------------------------------------------------------------------------
*/

export function filterOrders(
  orders = [],
  search = "",
  status = "all",
  deliveryType = "all"
) {
  const searchValue = String(search || "")
    .toLowerCase()
    .trim();

  return orders.filter((order) => {

    /*
     * Hide rejected payments from the normal Orders list.
     */
    if (isRejectedPayment(order)) {
      return false;
    }

    /*
     * Search
     */
    const matchesSearch =
      searchValue === "" ||

      String(order.customer_name || "")
        .toLowerCase()
        .includes(searchValue) ||

      String(order.id || "")
        .toLowerCase()
        .includes(searchValue) ||

      String(order.product_name || "")
        .toLowerCase()
        .includes(searchValue) ||

      String(order.capacity || "")
        .toLowerCase()
        .includes(searchValue);

    /*
     * Status
     */
    let matchesStatus = true;

    if (status !== "all") {

      if (status === "on_the_way") {

        matchesStatus =
          order.status === "assigned" ||
          order.status === "on_the_way";

      } else {

        matchesStatus =
          order.status === status;

      }
    }

    /*
     * Delivery Type
     */
    const matchesDelivery =
      deliveryType === "all" ||
      String(order.delivery_type || "")
        .toLowerCase()
        .trim() ===
        String(deliveryType || "")
          .toLowerCase()
          .trim();

    return (
      matchesSearch &&
      matchesStatus &&
      matchesDelivery
    );
  });
}

/*
|--------------------------------------------------------------------------
| Get Orders By Customer
|--------------------------------------------------------------------------
*/

export async function getOrdersByCustomer(customerId) {
  if (!customerId) {
    return [];
  }

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "[Orders] Customer orders error:",
      error
    );

    throw error;
  }

  return (data || []).map((order) => ({
    ...order,
    status: normalizeStatus(order.status),

    gallons:
      order.gallons !== null &&
      order.gallons !== undefined
        ? Number(order.gallons)
        : 0,

    total_price:
      order.total_price !== null &&
      order.total_price !== undefined
        ? Number(order.total_price)
        : 0,
  }));
}