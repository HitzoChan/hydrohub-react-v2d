import { supabase } from "../lib/supabase";

/*
|--------------------------------------------------------------------------
| Status Normalizer
|--------------------------------------------------------------------------
*/

function normalizeStatus(status = "") {
  const s = String(status).trim().toLowerCase();

  switch (s) {
    case "pending":
      return "pending";

    case "assigned":
      return "assigned";

    case "in_progress":
    case "in progress":
    case "in_transit":
    case "on_the_way":
    case "on the way":
      return "in_transit";

    case "delivered":
    case "completed":
      return "delivered";

    case "cancelled":
      return "cancelled";

    default:
      return s;
  }
}

export async function getActiveDeliveries() {

  // ===============================
  // LOAD ORDERS
  // ===============================

  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("*");

  if (ordersError) throw ordersError;

  // ===============================
  // KEEP ONLY ACTIVE ORDERS
  // ===============================

  const activeOrders = (orders ?? []).filter((order) => {
    const status = normalizeStatus(order.status);

    return (
      status === "assigned" ||
      status === "in_transit"
    );
  });

  if (activeOrders.length === 0) {
    return [];
  }

  // ===============================
  // LOAD EMPLOYEES
  // ===============================

  const { data: employees, error: employeesError } = await supabase
    .from("employees")
    .select("*");

  if (employeesError) throw employeesError;

  // ===============================
  // LOAD DELIVERIES
  // ===============================

  const { data: deliveries, error: deliveriesError } = await supabase
    .from("deliveries")
    .select("*");

  if (deliveriesError) throw deliveriesError;

  // ===============================
  // COMBINE DATA
  // ===============================

  return activeOrders.map((order) => {

    const driver =
      employees.find(
        (employee) =>
          String(employee.id) === String(order.driver_id)
      ) ?? null;

    const delivery =
      deliveries.find(
        (d) =>
          String(d.order_id) === String(order.id)
      ) ?? null;

    return {

      id: order.id,

      customer_id: order.customer_id,

      customer_name: order.customer_name,

      address: order.address,

      gallons: order.gallons,

      total_price: order.total_price,

      delivery_type: order.delivery_type,

      schedule_date: order.scheduled_date,

      schedule_time: order.scheduled_time,

      status: normalizeStatus(order.status),

      driver,

      driver_id: order.driver_id,

      latitude: order.latitude,

      longitude: order.longitude,

      driver_lat: order.driver_lat,

      driver_lng: order.driver_lng,

      customer_lat: order.customer_lat,

      customer_lng: order.customer_lng,

      created_at: order.created_at,

      eta: delivery?.eta ?? "--",

      schedule: delivery?.schedule ?? null,

      delivery_id: delivery?.id ?? null,

    };

  });

}