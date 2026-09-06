// =============================
// AUTH SERVICE
// =============================

import { supabase } from "../lib/supabase";

/**
 * Get admin credentials from system settings
 */
export async function getAdminCredentials() {
  try {
    const { data, error } = await supabase
      .from("system_settings")
      .select("admin_email, admin_name, admin_password")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Failed to fetch admin credentials:", error);
      // Return default credentials if fetch fails (fallback for dev)
      return {
        admin_email: "admin@gmail.com",
        admin_password: "123456",
        admin_name: "Administrator"
      };
    }

    // If no data found, return defaults
    if (!data) {
      return {
        admin_email: "admin@gmail.com",
        admin_password: "123456",
        admin_name: "Administrator"
      };
    }

    return data;
  } catch (err) {
    console.error("Error fetching admin credentials:", err);
    return {
      admin_email: "admin@gmail.com",
      admin_password: "123456",
      admin_name: "Administrator"
    };
  }
}

/**
 * Login user with email and password
 * Checks against stored admin credentials in system_settings
 */
export async function loginUser(email, password) {
  try {
    const adminCredentials = await getAdminCredentials();

    if (
      email === adminCredentials.admin_email &&
      password === adminCredentials.admin_password
    ) {
      return {
        success: true,
        user: {
          role: "admin",
          email: adminCredentials.admin_email,
          name: adminCredentials.admin_name || "Administrator"
        }
      };
    }

    return {
      success: false
    };
  } catch (err) {
    console.error("Login error:", err);
    return {
      success: false
    };
  }
}