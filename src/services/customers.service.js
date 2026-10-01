import { supabase } from "../lib/supabase";

// ========================================
// LOAD CUSTOMERS
// ========================================

export async function getCustomers() {
  try {
    const [{ data: profiles, error: profileError }, { data: orders, error: ordersError }] =
      await Promise.all([
        supabase.from("customer_profiles").select("*"),
        supabase.from("orders").select("*"),
      ]);

    if (profileError) throw profileError;
    if (ordersError) throw ordersError;

    //--------------------------------------
    // Build Order Summary
    //--------------------------------------

    const orderSummary = {};

    (orders || []).forEach((order) => {
      const customerId = order.customer_id;

      if (!customerId) return;

      if (!orderSummary[customerId]) {
        orderSummary[customerId] = {
          count: 0,
          lastOrder: null,
        };
      }

      orderSummary[customerId].count++;

      const orderDate = order.created_at || order.order_date;

      if (
        orderDate &&
        (!orderSummary[customerId].lastOrder ||
          new Date(orderDate) >
            new Date(orderSummary[customerId].lastOrder))
      ) {
        orderSummary[customerId].lastOrder = orderDate;
      }
    });

    //--------------------------------------
    // ONLY RETURN CUSTOMERS WITH ORDERS
    //--------------------------------------

    const customers = (profiles || [])
      .filter((profile) => {
        const id = profile.user_id || profile.id;
        return !!orderSummary[id];
      })
      .map((profile) => {
        const id = profile.user_id || profile.id;
        const summary = orderSummary[id];

        return {
          id,

          name:
            profile.full_name ||
            profile.name ||
            "Unknown Customer",

          email: profile.email || "-",

          avatar_url: profile.avatar_url || "",

          phone: profile.phone || "-",

          address: profile.address || "No Address",

          orders: summary.count,

          lastOrder: summary.lastOrder,

          status: getStatus(summary.lastOrder),
        };
      });

    //--------------------------------------
    // Sort by latest order
    //--------------------------------------

    customers.sort((a, b) => {
      if (!a.lastOrder) return 1;
      if (!b.lastOrder) return -1;

      return (
        new Date(b.lastOrder).getTime() -
        new Date(a.lastOrder).getTime()
      );
    });

    return customers;
  } catch (error) {
    console.error("Customers Error:", error);
    return [];
  }
}

// ========================================
// CUSTOMER STATUS
// ========================================

function getStatus(lastOrder) {
  if (!lastOrder) return "Inactive";

  const diff =
    (Date.now() - new Date(lastOrder).getTime()) /
    (1000 * 60 * 60 * 24);

  return diff <= 30 ? "Active" : "Inactive";
}