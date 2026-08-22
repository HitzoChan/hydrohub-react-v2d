import { supabase } from "./supabase";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

/**
 * Check if an order has a rejected payment.
 *
 * Rejected-payment orders should not be included
 * in dashboard statistics.
 */
function isRejectedPayment(order) {
  const paymentStatus = String(
    order?.payment_status || ""
  )
    .trim()
    .toLowerCase();

  return paymentStatus === "rejected";
}

/**
 * Remove rejected-payment orders from dashboard data.
 */
function filterValidOrders(orders = []) {
  return orders.filter(
    (order) => !isRejectedPayment(order)
  );
}

/**
 * Normalize order status.
 */
function normalizeStatus(status = "") {
  const value = String(status)
    .trim()
    .toLowerCase();

  switch (value) {
    case "pending":
      return "pending";

    case "assigned":
      return "assigned";

    case "on_the_way":
    case "on the way":
    case "in_transit":
    case "in transit":
    case "in_progress":
    case "in progress":
      return "on_the_way";

    case "delivered":
    case "completed":
      return "delivered";

    case "cancelled":
    case "canceled":
      return "cancelled";

    case "ready":
    case "ready_for_delivery":
    case "ready for delivery":
      return "assigned";

    default:
      return value;
  }
}

/**
 * Check whether a date belongs to today.
 */
function isToday(dateValue) {
  if (!dateValue) {
    return false;
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

/*
|--------------------------------------------------------------------------
| Customer Count
|--------------------------------------------------------------------------
*/

/**
 * Get the actual customer count from customer_profiles.
 *
 * IMPORTANT:
 * We do NOT count customers from orders.
 *
 * This keeps the Dashboard consistent with the
 * Customer Management page.
 */
async function getCustomerCount() {
  try {
    const { data, error } = await supabase
      .from("customer_profiles")
      .select("id");

    if (error) {
      throw error;
    }

    return Array.isArray(data)
      ? data.length
      : 0;
  } catch (error) {
    console.error(
      "Failed to load customer count:",
      error
    );

    return 0;
  }
}

/*
|--------------------------------------------------------------------------
| Dashboard Cards
|--------------------------------------------------------------------------
*/

/**
 * Dashboard Cards
 */
export async function getDashboardStats() {
  try {
    /*
    |--------------------------------------------------------------------------
    | Get Orders
    |--------------------------------------------------------------------------
    */

    const {
      data: orders,
      error: ordersError,
    } = await supabase
      .from("orders")
      .select("*");

    if (ordersError) {
      throw ordersError;
    }

    /*
    |--------------------------------------------------------------------------
    | Remove rejected-payment orders
    |--------------------------------------------------------------------------
    */

    const validOrders = filterValidOrders(
      orders || []
    );

    /*
    |--------------------------------------------------------------------------
    | Total Orders Today
    |--------------------------------------------------------------------------
    */

    const totalOrders = validOrders.filter(
      (order) =>
        isToday(order.created_at)
    ).length;

    /*
    |--------------------------------------------------------------------------
    | Active Deliveries
    |--------------------------------------------------------------------------
    */

    const activeOrders = validOrders.filter(
      (order) => {
        const status = normalizeStatus(
          order.status
        );

        return (
          status === "assigned" ||
          status === "on_the_way"
        );
      }
    ).length;

    /*
    |--------------------------------------------------------------------------
    | Total Customers
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    | Customer count now comes from customer_profiles
    | instead of counting customer_id values in orders.
    |
    */

    const totalCustomers =
      await getCustomerCount();

    /*
    |--------------------------------------------------------------------------
    | Revenue Today
    |--------------------------------------------------------------------------
    */

    const revenue = validOrders
      .filter((order) => {
        const status = normalizeStatus(
          order.status
        );

        if (status !== "delivered") {
          return false;
        }

        return isToday(
          order.created_at
        );
      })
      .reduce(
        (sum, order) =>
          sum +
          Number(
            order.total_price || 0
          ),
        0
      );

    /*
    |--------------------------------------------------------------------------
    | Return Dashboard Statistics
    |--------------------------------------------------------------------------
    */

    return {
      totalOrders,
      activeOrders,
      totalCustomers,
      revenue,
    };
  } catch (error) {
    console.error(
      "Failed to load dashboard stats:",
      error
    );

    return {
      totalOrders: 0,
      activeOrders: 0,
      totalCustomers: 0,
      revenue: 0,
    };
  }
}

/*
|--------------------------------------------------------------------------
| Weekly Sales
|--------------------------------------------------------------------------
*/

/**
 * Weekly Sales
 * Monday - Sunday
 */
export async function getWeeklySales() {
  try {
    const today = new Date();

    /*
    |--------------------------------------------------------------------------
    | Monday
    |--------------------------------------------------------------------------
    */

    const monday = new Date(today);

    monday.setDate(
      today.getDate() -
        ((today.getDay() + 6) % 7)
    );

    monday.setHours(
      0,
      0,
      0,
      0
    );

    /*
    |--------------------------------------------------------------------------
    | Sunday
    |--------------------------------------------------------------------------
    */

    const sunday = new Date(
      monday
    );

    sunday.setDate(
      monday.getDate() + 6
    );

    sunday.setHours(
      23,
      59,
      59,
      999
    );

    /*
    |--------------------------------------------------------------------------
    | Get Orders
    |--------------------------------------------------------------------------
    */

    const {
      data,
      error,
    } = await supabase
      .from("orders")
      .select(
        "created_at,total_price,status,payment_status"
      );

    if (error) {
      throw error;
    }

    /*
    |--------------------------------------------------------------------------
    | Remove rejected payments
    |--------------------------------------------------------------------------
    */

    const validOrders =
      filterValidOrders(
        data || []
      );

    const weekly = [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
    ];

    validOrders.forEach(
      (order) => {
        const status =
          normalizeStatus(
            order.status
          );

        /*
        | Only completed deliveries
        | contribute to sales.
        */

        if (
          status !== "delivered"
        ) {
          return;
        }

        const date = new Date(
          order.created_at
        );

        if (
          Number.isNaN(
            date.getTime()
          )
        ) {
          return;
        }

        if (
          date < monday ||
          date > sunday
        ) {
          return;
        }

        /*
        | Monday = 0
        | Tuesday = 1
        | ...
        | Sunday = 6
        */

        const index =
          (date.getDay() + 6) % 7;

        weekly[index] += Number(
          order.total_price || 0
        );
      }
    );

    return weekly;
  } catch (error) {
    console.error(
      "Failed to load weekly sales:",
      error
    );

    return [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
    ];
  }
}

/*
|--------------------------------------------------------------------------
| Today's Deliveries
|--------------------------------------------------------------------------
*/

/**
 * Today's Deliveries
 */
export async function getTodayDeliveries() {
  try {
    const {
      data,
      error,
    } = await supabase
      .from("orders")
      .select(
        "status,created_at,payment_status"
      );

    if (error) {
      throw error;
    }

    /*
    |--------------------------------------------------------------------------
    | Remove rejected-payment orders
    |--------------------------------------------------------------------------
    */

    const validOrders =
      filterValidOrders(
        data || []
      );

    const result = {
      delivered: 0,
      pending: 0,
      scheduled: 0,
      cancelled: 0,
    };

    validOrders.forEach(
      (order) => {
        /*
        | Only today's orders.
        */

        if (
          !isToday(
            order.created_at
          )
        ) {
          return;
        }

        const status =
          normalizeStatus(
            order.status
          );

        switch (status) {
          case "delivered":
            result.delivered++;
            break;

          case "pending":
            result.pending++;
            break;

          case "assigned":
          case "on_the_way":
            result.scheduled++;
            break;

          case "cancelled":
            result.cancelled++;
            break;

          default:
            break;
        }
      }
    );

    return result;
  } catch (error) {
    console.error(
      "Failed to load today's deliveries:",
      error
    );

    return {
      delivered: 0,
      pending: 0,
      scheduled: 0,
      cancelled: 0,
    };
  }
}