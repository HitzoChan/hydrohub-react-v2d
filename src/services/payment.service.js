import { supabase } from "../../lib/supabase";

/**
 * Get the currently logged-in admin.
 */
async function getCurrentAdmin() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error(
      "Your admin session has expired. Please log in again."
    );
  }

  return user;
}

/**
 * Verify a customer's payment.
 *
 * Payment status:
 * Pending → Verified
 */
export async function verifyPayment(orderId) {
  if (!orderId) {
    throw new Error("Order ID is required.");
  }

  const user = await getCurrentAdmin();

  const verifiedBy = user.email || user.id;

  const { data, error } = await supabase
    .from("orders")
    .update({
      payment_status: "Verified",
      payment_verified_at: new Date().toISOString(),
      verified_by: verifiedBy,
    })
    .eq("id", orderId)
    .eq("payment_status", "Pending")
    .select()
    .maybeSingle();

  if (error) {
    console.error("Verify payment error:", error);
    throw error;
  }

  // No order was updated.
  if (!data) {
    throw new Error(
      "This payment is no longer pending or the order could not be found."
    );
  }

  return data;
}

/**
 * Reject a customer's payment.
 *
 * Payment status:
 * Pending → Rejected
 */
export async function rejectPayment(orderId) {
  if (!orderId) {
    throw new Error("Order ID is required.");
  }

  const user = await getCurrentAdmin();

  const rejectedBy = user.email || user.id;

  const { data, error } = await supabase
    .from("orders")
    .update({
      payment_status: "Rejected",
      payment_verified_at: null,
      verified_by: rejectedBy,
    })
    .eq("id", orderId)
    .eq("payment_status", "Pending")
    .select()
    .maybeSingle();

  if (error) {
    console.error("Reject payment error:", error);
    throw error;
  }

  // No order was updated.
  if (!data) {
    throw new Error(
      "This payment is no longer pending or the order could not be found."
    );
  }

  return data;
}