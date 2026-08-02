import { supabase } from "../lib/supabase";

// Get all products
export async function getProducts() {
    const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: true });

    if (error) throw error;

    return data;
}

// Add a new product
export async function addProduct(product) {
    const { data, error } = await supabase
        .from("products")
        .insert([product])
        .select()
        .single();

    if (error) throw error;

    return data;
}

// Update an existing product
export async function updateProduct(id, updates) {
    const { data, error } = await supabase
        .from("products")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

    if (error) throw error;

    return data;
}

// Delete a product
export async function deleteProduct(id) {
    const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

    if (error) throw error;
}