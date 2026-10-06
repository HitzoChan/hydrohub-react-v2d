import { supabase } from "../lib/supabase";

/**
 * Load System Settings
 */
export async function getSettings() {

    try {
        const { data, error } = await supabase
            .from("system_settings")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error("Failed to load system settings:", error);
            throw error;
        }

        // If no settings exist, return defaults
        if (!data) {
            return {
                id: null,
                base_price: null,
                with_exchange_price: null,
                max_active_orders_per_customer: 3,
                cod_enabled: false,
                cod_verification: false,
                admin_email: "admin@gmail.com",
                admin_name: "Administrator",
                admin_password: "123456",
            };
        }

        return data;
    } catch (err) {
        console.error("Error fetching settings:", err);
        throw err;
    }

}

/**
 * Save System Settings
 * Only updates if a settings record exists (id is not null)
 */
export async function saveSettings(settings) {

    // Skip update if no settings record exists yet
    // The record will be created when admin credentials are saved
    if (!settings.id) {
        console.log("No settings ID found - skipping update. Will be created when admin credentials are saved.");
        return;
    }

    try {
        const { error } = await supabase
            .from("system_settings")
            .update({
                base_price: Number(settings.basePrice) || null,
                with_exchange_price: Number(settings.withExchange) || null,
                cod_enabled: settings.codEnabled,
                cod_verification: settings.codVerification,
                max_active_orders_per_customer:
                    Number(settings.maxActiveOrdersPerCustomer) || 3,
            })
            .eq("id", settings.id);

        if (error) {
            console.error("Failed to save settings:", error);
            throw error;
        }
    } catch (err) {
        console.error("Error in saveSettings:", err);
        throw err;
    }
}

/**
 * Update Admin Credentials
 * If no settings record exists, create one
 */
export async function updateAdminCredentials(id, adminName, adminEmail, adminPassword) {
    const payload = {};

    if (adminName) {
        payload.admin_name = adminName.trim();
    }

    if (adminEmail) {
        payload.admin_email = adminEmail.trim().toLowerCase();
    }

    if (adminPassword) {
        payload.admin_password = adminPassword;
    }

    if (Object.keys(payload).length === 0) {
        throw new Error("No admin credentials provided for update");
    }

    try {
        // If id exists, update the existing record
        if (id) {
            const { error } = await supabase
                .from("system_settings")
                .update(payload)
                .eq("id", id);

            if (error) {
                console.error("Failed to update admin credentials:", error);
                throw error;
            }

            return { success: true, id };
        }

        // If no id, create a new settings record with default values
        const { data, error } = await supabase
            .from("system_settings")
            .insert([{
                ...payload,
                cod_enabled: false,
                cod_verification: false,
                gcash_enabled: true,
                max_active_orders_per_customer: 3,
            }])
            .select("id")
            .single();

        if (error) {
            console.error("Failed to create admin credentials:", error);
            throw error;
        }

        return { success: true, id: data?.id };
    } catch (err) {
        console.error("Error in updateAdminCredentials:", err);
        throw err;
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