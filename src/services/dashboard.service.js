import { supabase } from "./supabase";

/**
 * Dashboard Cards
 */
export async function getDashboardStats() {
  try {
    const { data: orders, error } = await supabase
      .from("orders")
      .select("*");

    if (error) throw error;

    //----------------------------------
    // Total Orders
    //----------------------------------

    const totalOrders = orders.length;

    //----------------------------------
    // Active Deliveries
    //----------------------------------

    const activeOrders = orders.filter((order) => {
      const status = String(order.status)
        .trim()
        .toLowerCase();

      return (
        status === "pending" ||
        status === "assigned" ||
        status === "in_transit"
      );
    }).length;

    //----------------------------------
    // Customers
    //----------------------------------

    const totalCustomers = new Set(
      orders.map((order) => order.customer_id)
    ).size;

    //----------------------------------
    // Revenue Today
    //----------------------------------

    const today = new Date();

    const start = new Date(today);
    start.setHours(0, 0, 0, 0);

    const end = new Date(today);
    end.setHours(23, 59, 59, 999);

    const revenue = orders
      .filter((order) => {
        const status = String(order.status)
          .trim()
          .toLowerCase();

        if (
          status !== "delivered" &&
          status !== "completed"
        ) {
          return false;
        }

        const orderDate = new Date(order.created_at);

        return (
          orderDate >= start &&
          orderDate <= end
        );
      })
      .reduce(
        (sum, order) =>
          sum + Number(order.total_price || 0),
        0
      );

    return {
      totalOrders,
      activeOrders,
      totalCustomers,
      revenue,
    };

  } catch (error) {

    console.error(error);

    return {
      totalOrders: 0,
      activeOrders: 0,
      totalCustomers: 0,
      revenue: 0,
    };

  }
}

/**
 * Weekly Sales (Monday - Sunday)
 */
export async function getWeeklySales() {

  try {

    const today = new Date();

    const monday = new Date(today);
    monday.setDate(
      today.getDate() - ((today.getDay() + 6) % 7)
    );
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from("orders")
      .select("created_at,total_price,status");

    if (error) throw error;

    const weekly = [0, 0, 0, 0, 0, 0, 0];

    data.forEach((order) => {

      const status = String(order.status)
        .trim()
        .toLowerCase();

      if (
        status !== "delivered" &&
        status !== "completed"
      ) {
        return;
      }

      const date = new Date(order.created_at);

      if (date < monday || date > sunday) {
        return;
      }

      const index = (date.getDay() + 6) % 7;

      weekly[index] += Number(order.total_price || 0);

    });

    return weekly;

  } catch (error) {

    console.error(error);

    return [0, 0, 0, 0, 0, 0, 0];

  }
}

/**
 * Today's Deliveries
 */
export async function getTodayDeliveries() {

  try {

    const { data, error } = await supabase
      .from("orders")
      .select("status, created_at");

    if (error) throw error;

    const today = new Date();

    const start = new Date(today);
    start.setHours(0, 0, 0, 0);

    const end = new Date(today);
    end.setHours(23, 59, 59, 999);

    const result = {
      delivered: 0,
      pending: 0,
      scheduled: 0,
      cancelled: 0,
    };

    data.forEach((order) => {

      const orderDate = new Date(order.created_at);

      if (orderDate < start || orderDate > end) {
        return;
      }

      const status = String(order.status)
        .trim()
        .toLowerCase();

      switch (status) {

        case "delivered":
        case "completed":
          result.delivered++;
          break;

        case "pending":
          result.pending++;
          break;

        case "assigned":
        case "in_transit":
          result.scheduled++;
          break;

        case "cancelled":
          result.cancelled++;
          break;

        default:
          break;

      }

    });

    return result;

  } catch (error) {

    console.error(error);

    return {
      delivered: 0,
      pending: 0,
      scheduled: 0,
      cancelled: 0,
    };

  }
}