import { supabase } from "./supabase";

export async function testConnection() {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .limit(1);

    if (error) {
      throw error;
    }

    console.log("✅ Connected to Supabase!");
    console.log(data);

  } catch (error) {
    console.error("❌ Connection failed:", error.message);
  }
}