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

            max_deliveries_per_driver: Number(settings.maxDeliveries),

            // NOTE:
            // Your table has a typo: delivery_duratioan
            delivery_duration: Number(settings.deliveryDuration),

            cod_enabled: settings.codEnabled,

            cod_verification: settings.codVerification,

            auto_generate_code: settings.autoCode,

            code_length: Number(settings.codeLength)

        })
        .eq("id", settings.id);

if (error) {
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