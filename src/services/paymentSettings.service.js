import { supabase } from "../../lib/supabase";

/*
|--------------------------------------------------------------------------
| Payment Settings
|--------------------------------------------------------------------------
|
| This service manages the HydroHub system-wide payment configuration.
|
| It is NOT responsible for verifying individual customer payments.
|
| Individual order payment verification should be handled separately
| through payment.service.js.
|
|--------------------------------------------------------------------------
*/

/**
 * Select only the payment settings fields we need.
 * Make sure to update this if you add new fields to the system_settings table.
 */
const PAYMENT_SETTINGS_FIELDS = `
  id,
  gcash_enabled,
  gcash_number,
  gcash_account_name,
  require_reference,
  downpayment_enabled,
  minimum_gallons,
  downpayment_percentage
`;

/**
 * Get the current payment settings.
 */
export async function getPaymentSettings() {
  const { data, error } = await supabase
    .from("system_settings")
    .select(PAYMENT_SETTINGS_FIELDS)
    .order("created_at", {
      ascending: true,
    })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to get payment settings:", error);
    throw error;
  }

  return data;
}

/**
 * Create payment settings.
 *
 * This should normally only be used if the system does not
 * already have a payment settings record.
 */
export async function createPaymentSettings(settings = {}) {
  const gcashEnabled = settings.gcash_enabled ?? true;

  const gcashNumber = String(
    settings.gcash_number ?? ""
  ).trim();

  const gcashAccountName = String(
    settings.gcash_account_name ?? ""
  ).trim();

  const requireReference =
    settings.require_reference ?? true;

  const downpaymentEnabled =
    settings.downpayment_enabled ?? true;

  const minimumGallons = Math.max(
    1,
    Number(settings.minimum_gallons ?? 10)
  );

  const downpaymentPercentage = Math.min(
    100,
    Math.max(
      0,
      Number(settings.downpayment_percentage ?? 30)
    )
  );

  const { data, error } = await supabase
    .from("system_settings")
    .insert({
      gcash_enabled: gcashEnabled,
      gcash_number: gcashNumber,
      gcash_account_name: gcashAccountName,
      require_reference: requireReference,
      downpayment_enabled: downpaymentEnabled,
      minimum_gallons: minimumGallons,
      downpayment_percentage: downpaymentPercentage,
    })
    .select(PAYMENT_SETTINGS_FIELDS)
    .single();

  if (error) {
    console.error(
      "Failed to create payment settings:",
      error
    );

    throw error;
  }

  return data;
}

/**
 * Update existing payment settings.
 *
 * Only fields included in `updates` are changed.
 */
export async function updatePaymentSettings(
  id,
  updates = {}
) {
  if (!id) {
    throw new Error(
      "Payment settings ID is required."
    );
  }

  const payload = {};

  if (updates.gcash_enabled !== undefined) {
    payload.gcash_enabled =
      Boolean(updates.gcash_enabled);
  }

  if (updates.gcash_number !== undefined) {
    payload.gcash_number = String(
      updates.gcash_number
    ).trim();
  }

  if (updates.gcash_account_name !== undefined) {
    payload.gcash_account_name = String(
      updates.gcash_account_name
    ).trim();
  }

  if (updates.require_reference !== undefined) {
    payload.require_reference =
      Boolean(updates.require_reference);
  }

  if (updates.downpayment_enabled !== undefined) {
    payload.downpayment_enabled =
      Boolean(updates.downpayment_enabled);
  }

  if (updates.minimum_gallons !== undefined) {
    payload.minimum_gallons = Math.max(
      1,
      Number(updates.minimum_gallons)
    );
  }

  if (updates.downpayment_percentage !== undefined) {
    payload.downpayment_percentage = Math.min(
      100,
      Math.max(
        0,
        Number(updates.downpayment_percentage)
      )
    );
  }

  if (Object.keys(payload).length === 0) {
    throw new Error(
      "No payment settings were provided for update."
    );
  }

  const { data, error } = await supabase
    .from("system_settings")
    .update(payload)
    .eq("id", id)
    .select(PAYMENT_SETTINGS_FIELDS)
    .single();

  if (error) {
    console.error(
      "Failed to update payment settings:",
      error
    );

    throw error;
  }

  return data;
}