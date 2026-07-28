import { createConversation } from "./messaging.service";
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

    case "on_the_way":
    case "on the way":
    case "in_progress":
    case "in progress":
    case "in_transit":
      return "in_transit";

    case "completed":
    case "delivered":
      return "delivered";

    case "cancelled":
      return "cancelled";

    default:
      return s;

  }

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

      supabase
        .from("deliveries")
        .select("*"),

      supabase
        .from("orders")
        .select("*")
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("employees")
        .select("*")
        .ilike("role", "driver"),

      supabase
        .from("customer_profiles")
        .select("*"),

    ]);

    if (deliveriesResult.error)
      throw deliveriesResult.error;

    if (ordersResult.error)
      throw ordersResult.error;

    if (driversResult.error)
      throw driversResult.error;

    if (customersResult.error)
      throw customersResult.error;

    const deliveries =
      deliveriesResult.data ?? [];

    const orders =
      ordersResult.data ?? [];

    const drivers =
      driversResult.data ?? [];

    const customers =
      customersResult.data ?? [];

    //----------------------------------
    // LOOKUP MAPS
    //----------------------------------

    const deliveryMap = {};

    deliveries.forEach((delivery) => {

      deliveryMap[
        String(delivery.order_id)
      ] = delivery;

    });

    const driverMap = {};

    drivers.forEach((driver) => {

      if (!driver.id) return;

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

    //----------------------------------
    // MERGE ORDERS + DELIVERIES
    //----------------------------------

        const merged = orders.map((order) => {

      const delivery =
        deliveryMap[String(order.id)] || null;

      const customer =
        customerMap[String(order.customer_id)] || {};

      const driverId =
        delivery?.driver_id ||
        order.driver_id ||
        null;

      const driver =
        driverId
          ? driverMap[String(driverId)] || null
          : null;

      //----------------------------------
      // CUSTOMER INFO
      //----------------------------------

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

      //----------------------------------
      // SCHEDULE
      //----------------------------------

      let scheduledAt = null;

      if (order.scheduled_date) {

        scheduledAt = order.scheduled_date;

        if (order.scheduled_time) {

          scheduledAt +=
            " " +
            order.scheduled_time;

        }

      }

      //----------------------------------
      // RESOLVE FINAL STATUS
      //----------------------------------

      const orderStatus =
        normalizeStatus(order.status);

      const deliveryStatus =
        normalizeStatus(delivery?.status);

      let finalStatus = "pending";

      // Orders table has highest priority

      if (orderStatus === "cancelled") {

        finalStatus = "cancelled";

      }

      else if (orderStatus === "delivered") {

        finalStatus = "delivered";

      }

      else if (orderStatus === "in_transit") {

        finalStatus = "in_transit";

      }

      else if (orderStatus === "assigned") {

        finalStatus = "assigned";

      }

      // Fallback to deliveries table

      else if (deliveryStatus === "cancelled") {

        finalStatus = "cancelled";

      }

      else if (deliveryStatus === "delivered") {

        finalStatus = "delivered";

      }

      else if (deliveryStatus === "in_transit") {

        finalStatus = "in_transit";

      }

      else if (deliveryStatus === "assigned") {

        finalStatus = "assigned";

      }

      //----------------------------------
      // RETURN MERGED OBJECT
      //----------------------------------

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

              phone: driver.phone,

              status:
                driver.driver_status ||
                driver.status,

            }
          : null,

        sourceType:
          delivery
            ? "delivery"
            : "pending_order",

        status: finalStatus,

        customerName,

        address,

        phone,

        orderNumber:
          `ORD-${String(order.id)
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

    //----------------------------------

    return {

      deliveries: merged,

      drivers,

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

export function getDeliveryStats(deliveries = []) {

  // Ignore cancelled deliveries in statistics
  const activeDeliveries = deliveries.filter(
    (delivery) =>
      normalizeStatus(delivery.status) !== "cancelled"
  );

  return {

    total: activeDeliveries.length,

    pending: activeDeliveries.filter(
      (delivery) =>
        normalizeStatus(delivery.status) === "pending"
    ).length,

    assigned: activeDeliveries.filter(
      (delivery) =>
        normalizeStatus(delivery.status) === "assigned"
    ).length,

    inTransit: activeDeliveries.filter(
      (delivery) =>
        normalizeStatus(delivery.status) === "in_transit"
    ).length,

    delivered: activeDeliveries.filter(
      (delivery) =>
        normalizeStatus(delivery.status) === "delivered"
    ).length,

    activeDrivers: new Set(

      activeDeliveries
        .filter((delivery) => {

          const status =
            normalizeStatus(delivery.status);

          return (

            delivery.driver &&

            status !== "delivered"

          );

        })
        .map((delivery) => delivery.driver.id)

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

  // Hide cancelled deliveries from the delivery list
  const visibleDeliveries = deliveries.filter(
    (delivery) =>
      normalizeStatus(delivery.status) !== "cancelled"
  );

  return visibleDeliveries.filter((delivery) => {

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

      status === "all"

      ||

      normalizeStatus(delivery.status) === status;

    return (
      matchesSearch &&
      matchesStatus
    );

  });

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

  const { deliveries } = await getDeliveries();

  const selected = deliveries.find(
    (d) => String(d.id) === String(deliveryId)
  );

  if (!selected) {
    throw new Error("Delivery not found.");
  }

  //----------------------------------
  // Don't assign completed/cancelled
  //----------------------------------

  if (
    selected.status === "cancelled" ||
    selected.status === "delivered"
  ) {
    throw new Error(
      "This delivery can no longer be assigned."
    );
  }

  //----------------------------------
  // Check if delivery exists
  //----------------------------------

  const {
    data: existing,
    error: existingError,
  } = await supabase
    .from("deliveries")
    .select("*")
    .eq("order_id", selected.order_id)
    .maybeSingle();

  if (existingError)
    throw existingError;

  //----------------------------------
  // UPDATE existing delivery
  //----------------------------------

  if (existing) {

    const { error } = await supabase
      .from("deliveries")
      .update({

        driver_id: driverId,

        status: "assigned",

      })
      .eq("id", existing.id);

    if (error)
      throw error;

  }

  //----------------------------------
  // CREATE delivery
  //----------------------------------

  else {

    const { error } = await supabase
      .from("deliveries")
      .insert({

        order_id: selected.order_id,

        customer_id: selected.customer_id,

        customer_name: selected.customerName,

        address_text: selected.address,

        latitude: selected.latitude,

        longitude: selected.longitude,

        driver_id: driverId,

        status: "assigned",

      });

    if (error)
      throw error;

  }

  //----------------------------------
  // Keep Orders synchronized
  //----------------------------------

  const { error: orderError } = await supabase
  .from("orders")
  .update({
    driver_id: driverId,
    status: "assigned",
  })
  .eq("id", selected.order_id);

if (orderError) {
  throw orderError;
}

// Automatically create the conversation
await createConversation(selected.order_id);

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

  status = normalizeStatus(status);

  const { deliveries } =
    await getDeliveries();

  const selected =
    deliveries.find(
      (d) =>
        String(d.id) ===
        String(deliveryId)
    );

  if (!selected) {
    throw new Error(
      "Delivery not found."
    );
  }

  //----------------------------------
  // Find delivery row
  //----------------------------------

  const {
    data: existing,
    error: existingError,
  } = await supabase
    .from("deliveries")
    .select("*")
    .eq("order_id", selected.order_id)
    .maybeSingle();

  if (existingError)
    throw existingError;

  //----------------------------------
  // Update delivery
  //----------------------------------

  if (existing) {

    const updateData = {
      status,
    };

    // Remove driver if cancelled
    if (status === "cancelled") {
      updateData.driver_id = null;
    }

    const { error } = await supabase
      .from("deliveries")
      .update(updateData)
      .eq("id", existing.id);

    if (error)
      throw error;

  }

  //----------------------------------
  // Create delivery if missing
  //----------------------------------

  else {

    const { error } = await supabase
      .from("deliveries")
      .insert({

        order_id: selected.order_id,

        customer_id: selected.customer_id,

        customer_name: selected.customerName,

        address_text: selected.address,

        latitude: selected.latitude,

        longitude: selected.longitude,

        driver_id:
          status === "cancelled"
            ? null
            : selected.driver?.id || null,

        status,

      });

    if (error)
      throw error;

  }

  //----------------------------------
  // Update orders table
  //----------------------------------

  const orderUpdate = {
    status,
  };

  if (status === "cancelled") {
    orderUpdate.driver_id = null;
  }

  const {
    error: orderError,
  } = await supabase
    .from("orders")
    .update(orderUpdate)
    .eq("id", selected.order_id);

  if (orderError)
    throw orderError;

    //----------------------------------
    // Start archive countdown
    //----------------------------------

    if (status === "delivered") {

      const { error: conversationError } = await supabase
        .from("conversations")
        .update({
          delivered_at: new Date().toISOString(),
          status: "active",
        })
        .eq("order_id", selected.order_id);

      if (conversationError) {
        throw conversationError;
      }

    }  

  return true;

}