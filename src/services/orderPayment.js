import { supabase } from "../../lib/supabase";

/**
 * Verify a customer's GCash payment.
 */
export async function verifyOrderPayment(orderId, verifiedBy) {
  if (!orderId) {
    throw new Error("Order ID is required.");
  }

  const { data, error } = await supabase
    .from("orders")
    .update({
      payment_status: "Verified",
      payment_verified_at: new Date().toISOString(),
      verified_by: verifiedBy || "Admin",
    })
    .eq("id", orderId)
    .eq("payment_method", "GCash")
    .eq("payment_status", "Pending")
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Reject a customer's GCash payment.
 */
export async function rejectOrderPayment(orderId, rejectedBy) {
  if (!orderId) {
    throw new Error("Order ID is required.");
  }

  const { data, error } = await supabase
    .from("orders")
    .update({
      payment_status: "Rejected",
      payment_verified_at: null,
      verified_by: rejectedBy || "Admin",
    })
    .eq("id", orderId)
    .eq("payment_method", "GCash")
    .eq("payment_status", "Pending")
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}