import { supabase } from "../lib/supabase";

/*
|--------------------------------------------------------------------------
| GET ALL PRODUCTS
|--------------------------------------------------------------------------
*/

export async function getProducts() {

    const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", {
            ascending: true
        });

    if (error) {
        console.error(
            "Failed to get products:",
            error
        );

        throw error;
    }

    return Array.isArray(data)
        ? data
        : [];
}


/*
|--------------------------------------------------------------------------
| GET ENABLED PRODUCTS
|--------------------------------------------------------------------------
|
| Used later by Orders so customers only see
| products that the admin has enabled.
|
*/

export async function getEnabledProducts() {

    const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("enabled", true)
        .order("created_at", {
            ascending: true
        });

    if (error) {
        console.error(
            "Failed to get enabled products:",
            error
        );

        throw error;
    }

    return Array.isArray(data)
        ? data
        : [];
}


/*
|--------------------------------------------------------------------------
| GET PRODUCT BY ID
|--------------------------------------------------------------------------
*/

export async function getProductById(id) {

    if (!id) {
        throw new Error(
            "Product ID is required."
        );
    }

    const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
        console.error(
            "Failed to get product:",
            error
        );

        throw error;
    }

    return data;
}


/*
|--------------------------------------------------------------------------
| ADD PRODUCT
|--------------------------------------------------------------------------
|
| Example:
|
| 5 Gallon
| Initial Containers: 100
|
| The initial_containers value is stored in
| the products table.
|
| The database trigger can then create/update
| the corresponding inventory record.
|
*/

export async function addProduct(product) {

    if (!product) {
        throw new Error(
            "Product information is required."
        );
    }

    if (!product.product_name?.trim()) {
        throw new Error(
            "Product name is required."
        );
    }

    if (!product.capacity?.trim()) {
        throw new Error(
            "Product capacity is required."
        );
    }

    const initialContainers =
        Number(product.initial_containers ?? 0);

    if (
        !Number.isInteger(initialContainers) ||
        initialContainers < 0
    ) {
        throw new Error(
            "Initial containers must be a whole number greater than or equal to 0."
        );
    }

    const productData = {

        product_name:
            product.product_name.trim(),

        capacity:
            product.capacity.trim(),

        base_price:
            Number(product.base_price ?? 0),

        exchange_price:
            Number(product.exchange_price ?? 0),

        exchange_required:
            product.exchange_required ?? true,

        enabled:
            product.enabled ?? true,

        initial_containers:
            initialContainers

    };

    const { data, error } = await supabase
        .from("products")
        .insert([productData])
        .select()
        .single();

    if (error) {

        console.error(
            "Failed to add product:",
            error
        );

        throw error;
    }

    return data;
}


/*
|--------------------------------------------------------------------------
| UPDATE PRODUCT
|--------------------------------------------------------------------------
*/

export async function updateProduct(
    id,
    updates
) {

    if (!id) {
        throw new Error(
            "Product ID is required."
        );
    }

    if (!updates) {
        throw new Error(
            "Product update information is required."
        );
    }

    const productData = {};

    /*
    |--------------------------------------------------------------------------
    | PRODUCT NAME
    |--------------------------------------------------------------------------
    */

    if (
        updates.product_name !== undefined
    ) {

        const productName =
            String(
                updates.product_name
            ).trim();

        if (!productName) {
            throw new Error(
                "Product name is required."
            );
        }

        productData.product_name =
            productName;
    }


    /*
    |--------------------------------------------------------------------------
    | CAPACITY
    |--------------------------------------------------------------------------
    */

    if (
        updates.capacity !== undefined
    ) {

        const capacity =
            String(
                updates.capacity
            ).trim();

        if (!capacity) {
            throw new Error(
                "Product capacity is required."
            );
        }

        productData.capacity =
            capacity;
    }


    /*
    |--------------------------------------------------------------------------
    | BASE PRICE
    |--------------------------------------------------------------------------
    */

    if (
        updates.base_price !== undefined
    ) {

        const basePrice =
            Number(
                updates.base_price
            );

        if (
            Number.isNaN(basePrice) ||
            basePrice < 0
        ) {
            throw new Error(
                "Base price must be a valid amount."
            );
        }

        productData.base_price =
            basePrice;
    }


    /*
    |--------------------------------------------------------------------------
    | EXCHANGE PRICE
    |--------------------------------------------------------------------------
    */

    if (
        updates.exchange_price !== undefined
    ) {

        const exchangePrice =
            Number(
                updates.exchange_price
            );

        if (
            Number.isNaN(exchangePrice) ||
            exchangePrice < 0
        ) {
            throw new Error(
                "Exchange price must be a valid amount."
            );
        }

        productData.exchange_price =
            exchangePrice;
    }


    /*
    |--------------------------------------------------------------------------
    | EXCHANGE REQUIRED
    |--------------------------------------------------------------------------
    */

    if (
        updates.exchange_required !== undefined
    ) {

        productData.exchange_required =
            Boolean(
                updates.exchange_required
            );
    }


    /*
    |--------------------------------------------------------------------------
    | ENABLED
    |--------------------------------------------------------------------------
    */

    if (
        updates.enabled !== undefined
    ) {

        productData.enabled =
            Boolean(
                updates.enabled
            );
    }


    /*
    |--------------------------------------------------------------------------
    | INITIAL CONTAINERS
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | This is the admin's initial setup value.
    |
    | Example:
    |
    | 5 Gallon = 100
    | 3 Gallon = 50
    |
    | Later, actual inventory movement will be
    | handled through orders/deliveries.
    |
    */

    if (
        updates.initial_containers !== undefined
    ) {

        const initialContainers =
            Number(
                updates.initial_containers
            );

        if (
            !Number.isInteger(
                initialContainers
            ) ||
            initialContainers < 0
        ) {
            throw new Error(
                "Initial containers must be a whole number greater than or equal to 0."
            );
        }

        productData.initial_containers =
            initialContainers;
    }


    /*
    |--------------------------------------------------------------------------
    | NOTHING TO UPDATE
    |--------------------------------------------------------------------------
    */

    if (
        Object.keys(productData).length === 0
    ) {
        throw new Error(
            "No product changes were provided."
        );
    }


    /*
    |--------------------------------------------------------------------------
    | UPDATE DATABASE
    |--------------------------------------------------------------------------
    */

    const { data, error } = await supabase
        .from("products")
        .update(productData)
        .eq("id", id)
        .select()
        .single();

    if (error) {

        console.error(
            "Failed to update product:",
            error
        );

        throw error;
    }

    return data;
}


/*
|--------------------------------------------------------------------------
| DELETE PRODUCT
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| We first check whether this product already has
| inventory or transaction records.
|
| This prevents accidental deletion of historical
| inventory data.
|
*/

export async function deleteProduct(id) {

    if (!id) {
        throw new Error(
            "Product ID is required."
        );
    }


    /*
    |--------------------------------------------------------------------------
    | CHECK INVENTORY
    |--------------------------------------------------------------------------
    */

    const {
        data: inventory,
        error: inventoryError
    } = await supabase
        .from("inventory")
        .select("id")
        .eq("product_id", id)
        .limit(1);

    if (inventoryError) {

        console.error(
            "Failed to check product inventory:",
            inventoryError
        );

        throw inventoryError;
    }


    /*
    |--------------------------------------------------------------------------
    | CHECK TRANSACTIONS
    |--------------------------------------------------------------------------
    */

    const {
        data: transactions,
        error: transactionError
    } = await supabase
        .from("inventory_transactions")
        .select("id")
        .eq("product_id", id)
        .limit(1);

    if (transactionError) {

        console.error(
            "Failed to check product transactions:",
            transactionError
        );

        throw transactionError;
    }


    /*
    |--------------------------------------------------------------------------
    | PREVENT DELETE IF PRODUCT IS ALREADY IN USE
    |--------------------------------------------------------------------------
    */

    if (
        inventory?.length > 0 ||
        transactions?.length > 0
    ) {

        throw new Error(
            "This product cannot be deleted because it already has inventory or transaction records. Disable the product instead."
        );
    }


    /*
    |--------------------------------------------------------------------------
    | DELETE PRODUCT
    |--------------------------------------------------------------------------
    */

    const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

    if (error) {

        console.error(
            "Failed to delete product:",
            error
        );

        throw error;
    }

    return true;
}