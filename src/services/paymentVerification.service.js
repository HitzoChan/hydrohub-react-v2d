import { supabase } from "../lib/supabase";

/**
 * Verify a customer's GCash payment.
 *
 * This should only be accessible to authorized admin users.
 */
export async function verifyPayment(orderId, verifiedBy = null) {
  const { data, error } = await supabase
    .from("orders")
    .update({
      payment_status: "Verified",
      payment_verified_at: new Date().toISOString(),
      verified_by: verifiedBy,
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
export async function rejectPayment(orderId, rejectedBy = null) {
  const { data, error } = await supabase
    .from("orders")
    .update({
      payment_status: "Rejected",
      payment_verified_at: null,
      verified_by: rejectedBy,
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