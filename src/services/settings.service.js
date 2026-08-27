import { supabase } from "../lib/supabase";

/**
 * Load System Settings
 */
export async function getSettings() {

    const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .limit(1)
        .single();

    if (error) {
        if (error.code === "42703") {
            return {
                ...data,
                max_active_orders_per_customer: 3,
            };
        }

    console.log(error);
    throw error;
}

    return data;

}

/**
 * Save System Settings
 */
export async function saveSettings(settings) {

    const { error } = await supabase
        .from("system_settings")
        .update({

            base_price: Number(settings.basePrice),

            with_exchange_price: Number(settings.withExchange),

            cod_enabled: settings.codEnabled,

            cod_verification: settings.codVerification,

            max_active_orders_per_customer:
                Number(settings.maxActiveOrdersPerCustomer) || 3,

        })
        .eq("id", settings.id);

    if (error && error.code !== "42703") {
    console.log(error);
    throw error;
}

}

/**
 * Change Password
 */
export async function updatePassword(password) {

    if (!password) return;

    const { error } = await supabase.auth.updateUser({

        password

    });

if (error) {
    console.log(error);
    throw error;
}

}

/**
 * Logout
 */
export async function logout() {

    const { error } = await supabase.auth.signOut();

if (error) {
    console.log(error);
    throw error;
}

}