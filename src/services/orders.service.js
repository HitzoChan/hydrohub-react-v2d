import { supabase } from "./supabase";

/*
|--------------------------------------------------------------------------
| Normalize Order Status
|--------------------------------------------------------------------------
*/

function normalizeStatus(status = "") {

  const s = String(status).toLowerCase().trim();

  switch (s) {

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

    case "completed":
    case "delivered":
      return "delivered";

    case "ready":
    case "ready_for_delivery":
    case "ready for delivery":
      return "assigned";

    case "cancelled":
      return "cancelled";

    default:
      return "unknown";
  }

}

/**
 * Get all orders
 */
export async function getOrders() {

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map(order => ({
    ...order,
    status: normalizeStatus(order.status),
  }));

}

/**
 * Dashboard stats for Orders page
 */
export async function getOrderStats() {

  const orders = await getOrders();

  return {

    total: orders.length,

    pending: orders.filter(
      o => o.status === "pending"
    ).length,

    onTheWay: orders.filter(
      o =>
        o.status === "assigned" ||
        o.status === "on_the_way"
    ).length,

    delivered: orders.filter(
      o => o.status === "delivered"
    ).length,

  };

}

/**
 * Filter orders
 */
export function filterOrders(
  orders,
  search,
  status,
  deliveryType
) {

  return orders.filter((order) => {

    const matchesSearch =

      search === "" ||

      order.customer_name
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||

      String(order.id)
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesStatus =

      status === "all"

        ? true

        : status === "on_the_way"

        ? order.status === "assigned" ||
          order.status === "on_the_way"

        : order.status === status;

    const matchesDelivery =

      deliveryType === "all"

        ? true

        : order.delivery_type === deliveryType;

    return (

      matchesSearch &&
      matchesStatus &&
      matchesDelivery

    );

  });

}