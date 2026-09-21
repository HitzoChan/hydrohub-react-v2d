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
        "status,created_at,payment_status,delivery_type,reservation_status,scheduled_date"
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

        const isScheduledReservation =
          String(order.delivery_type || "").trim().toLowerCase() === "scheduled";

        const isTodayOrder = isToday(order.created_at);
        const isTodayReservation = isToday(order.scheduled_date);

        if (!isTodayOrder && !isTodayReservation) {
          return;
        }

        const status =
          normalizeStatus(
            order.status
          );

        const reservationStatus = String(
          order.reservation_status || ""
        ).trim().toLowerCase();

        if (
          isScheduledReservation &&
          isTodayReservation &&
          ["pending", "scheduled", "confirmed"].includes(reservationStatus) &&
          status !== "delivered" &&
          status !== "cancelled"
        ) {
          result.scheduled++;
          return;
        }

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

export async function getMonthlySales() {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("created_at,total_price,status,payment_status")
      .order("created_at", { ascending: true });

    if (error) throw error;

    const now = new Date();
    const startYear = now.getFullYear();
    const startMonthIndex = now.getMonth();
    const monthly = Array.from({ length: 12 }, () => 0);

    filterValidOrders(data || []).forEach((order) => {
      if (normalizeStatus(order.status) !== "delivered") return;

      const dateKey = String(order.created_at || "").slice(0, 10);
      const dateParts = dateKey.split("-").map(Number);
      const orderYear = dateParts[0];
      const orderMonthIndex = dateParts[1] - 1;

      if (
        !Number.isInteger(orderYear) ||
        !Number.isInteger(orderMonthIndex) ||
        orderMonthIndex < 0 ||
        orderMonthIndex > 11
      ) {
        return;
      }

      const index =
        (orderYear - startYear) * 12 +
        orderMonthIndex - startMonthIndex;

      if (index >= 0 && index < 12) {
        monthly[index] += Number(order.total_price || 0);
      }
    });

    return monthly;
  } catch (error) {
    console.error("Failed to load monthly sales:", error);
    return Array.from({ length: 12 }, () => 0);
  }
}

export async function getContainerFlowStats(period = "weekly") {
  try {
    const [{ data: orders, error: ordersError }, { data: returns, error: returnsError }, { data: borrowings, error: borrowingsError }] = await Promise.all([
      supabase.from("orders").select("created_at,status,new_containers,exchange_containers"),
      supabase.from("container_returns").select("created_at,returned_quantity,damaged_quantity,missing_quantity"),
      supabase.from("container_borrowings").select("created_at,borrowed_at,quantity,status"),
    ]);

    if (ordersError) throw ordersError;
    if (returnsError) throw returnsError;
    if (borrowingsError) throw borrowingsError;

    const now = new Date();
    const start = period === "monthly"
      ? new Date(now.getFullYear(), now.getMonth(), 1)
      : new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    const inRange = (value) => {
      const date = new Date(value);
      return !Number.isNaN(date.getTime()) && date >= start && date <= end;
    };

    const stats = { newContainers: 0, exchange: 0, borrowed: 0, returned: 0, damaged: 0, missing: 0 };

    (orders || []).filter((order) => normalizeStatus(order.status) === "delivered" && inRange(order.created_at)).forEach((order) => {
      stats.newContainers += Number(order.new_containers || 0);
      stats.exchange += Number(order.exchange_containers || 0);
    });
    (returns || []).filter((row) => inRange(row.created_at)).forEach((row) => {
      stats.returned += Number(row.returned_quantity || 0);
      stats.damaged += Number(row.damaged_quantity || 0);
      stats.missing += Number(row.missing_quantity || 0);
    });
    (borrowings || []).filter((row) => !["cancelled", "requested"].includes(String(row.status || "").toLowerCase()) && inRange(row.borrowed_at || row.created_at)).forEach((row) => {
      stats.borrowed += Number(row.quantity || 0);
    });

    return stats;
  } catch (error) {
    console.error("Failed to load container flow stats:", error);
    return { newContainers: 0, exchange: 0, borrowed: 0, returned: 0, damaged: 0, missing: 0 };
  }
}