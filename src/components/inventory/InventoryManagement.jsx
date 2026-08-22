import React, { useMemo } from "react";

function InventoryManagement({
    inventory = [],
}) {

    /*
    |--------------------------------------------------------------------------
    | INVENTORY DATA
    |--------------------------------------------------------------------------
    |
    | The inventory array comes from inventory.service.js.
    |
    | Products are NOT hardcoded here.
    |
    | Every enabled product created in Product Management
    | will automatically appear here.
    |
    |--------------------------------------------------------------------------
    */

    const products = useMemo(() => {

        if (!Array.isArray(inventory)) {
            return [];
        }

        return inventory
            .filter(item => item?.product_id || item?.id)
            .sort((a, b) => {

                const nameA =
                    String(
                        a?.product_name || ""
                    ).toLowerCase();

                const nameB =
                    String(
                        b?.product_name || ""
                    ).toLowerCase();

                return nameA.localeCompare(nameB);
            });

    }, [inventory]);


    /*
    |--------------------------------------------------------------------------
    | EMPTY STATE
    |--------------------------------------------------------------------------
    */

    if (products.length === 0) {

        return (

            <div className="inventory-management-card">

                <div className="inventory-section-heading">

                    <div>

                        <h5>
                            Container Inventory
                        </h5>

                        <p>
                            Inventory is automatically
                            generated from Product Management,
                            customer orders, deliveries,
                            and container returns.
                        </p>

                    </div>

                </div>

                <div className="alert alert-warning mb-0">

                    <strong>
                        No products found.
                    </strong>

                    <div className="mt-1">

                        Please add and enable a product
                        from Settings → Product Management.

                    </div>

                </div>

            </div>

        );
    }


    /*
    |--------------------------------------------------------------------------
    | RENDER
    |--------------------------------------------------------------------------
    */

    return (

        <div className="inventory-management-card">

            {/* =====================================================
                HEADER
            ===================================================== */}

            <div className="inventory-section-heading">

                <div>

                    <h5>
                        Container Inventory
                    </h5>

                    <p>
                        Monitor all gallon sizes and
                        container movement automatically.
                    </p>

                </div>

                <span className="inventory-count-badge">

                    {products.length}{" "}
                    {products.length === 1
                        ? "Product"
                        : "Products"}

                </span>

            </div>


            {/* =====================================================
                PRODUCT INVENTORY CARDS
            ===================================================== */}

            <div className="inventory-product-grid">

                {products.map((product) => {

                    const productId =
                        product.product_id ||
                        product.id;

                    const productName =
                        product.product_name ||
                        "Water Container";

                    const capacity =
                        product.capacity ||
                        "—";

                    /*
                    |--------------------------------------------------
                    | CURRENT INVENTORY
                    |--------------------------------------------------
                    */

                    const total =
                        Number(
                            product.total ?? 0
                        );

                    const full =
                        Number(
                            product.full ?? 0
                        );

                    const empty =
                        Number(
                            product.empty ?? 0
                        );

                    const customers =
                        Number(
                            product.with_customers ?? 0
                        );

                    const drivers =
                        Number(
                            product.with_drivers ?? 0
                        );

                    const damaged =
                        Number(
                            product.damaged ?? 0
                        );

                    const missing =
                        Number(
                            product.missing ?? 0
                        );

                    const initial =
                        Number(
                            product.initial_containers ?? 0
                        );


                    return (

                        <div
                            key={productId}
                            className="inventory-product-card"
                            style={{
                                display: "block",
                                cursor: "default",
                            }}
                        >

                            {/* =================================================
                                PRODUCT HEADER
                            ================================================= */}

                            <div
                                className="d-flex justify-content-between align-items-start"
                            >

                                <div>

                                    <strong>
                                        {productName}
                                    </strong>

                                    <small>
                                        {capacity}
                                    </small>

                                </div>

                                <span
                                    style={{
                                        color:
                                            full > 0
                                                ? "#16a34a"
                                                : "#dc2626",
                                    }}
                                >
                                    {full}
                                </span>

                            </div>


                            {/* =================================================
                                PRODUCT STATUS
                            ================================================= */}

                            <div className="mt-3">

                                <div className="d-flex justify-content-between mb-2">

                                    <small className="text-muted">
                                        Total Owned
                                    </small>

                                    <strong>
                                        {total}
                                    </strong>

                                </div>


                                <div className="d-flex justify-content-between mb-2">

                                    <small className="text-muted">
                                        Full / Available
                                    </small>

                                    <strong
                                        className="text-success"
                                    >
                                        {full}
                                    </strong>

                                </div>


                                <div className="d-flex justify-content-between mb-2">

                                    <small className="text-muted">
                                        Empty Recovered
                                    </small>

                                    <strong>
                                        {empty}
                                    </strong>

                                </div>


                                <div className="d-flex justify-content-between mb-2">

                                    <small className="text-muted">
                                        With Customers
                                    </small>

                                    <strong
                                        style={{
                                            color: "#7c3aed",
                                        }}
                                    >
                                        {customers}
                                    </strong>

                                </div>


                                <div className="d-flex justify-content-between mb-2">

                                    <small className="text-muted">
                                        With Drivers
                                    </small>

                                    <strong
                                        style={{
                                            color: "#d97706",
                                        }}
                                    >
                                        {drivers}
                                    </strong>

                                </div>


                                <div className="d-flex justify-content-between mb-2">

                                    <small className="text-muted">
                                        Damaged
                                    </small>

                                    <strong
                                        className={
                                            damaged > 0
                                                ? "text-danger"
                                                : ""
                                        }
                                    >
                                        {damaged}
                                    </strong>

                                </div>


                                <div className="d-flex justify-content-between">

                                    <small className="text-muted">
                                        Missing
                                    </small>

                                    <strong
                                        className={
                                            missing > 0
                                                ? "text-danger"
                                                : ""
                                        }
                                    >
                                        {missing}
                                    </strong>

                                </div>

                            </div>


                            {/* =================================================
                                INITIAL CONTAINER INFORMATION
                            ================================================= */}

                            <div
                                className="mt-3 pt-3 border-top"
                            >

                                <div className="d-flex justify-content-between">

                                    <small className="text-muted">

                                        Initial Containers

                                    </small>

                                    <strong>

                                        {initial}

                                    </strong>

                                </div>

                            </div>


                            {/* =================================================
                                AUTOMATIC STATUS
                            ================================================= */}

                            <div className="mt-3">

                                <span
                                    className="inventory-status active"
                                >

                                    <i className="bi bi-arrow-repeat me-1" />

                                    Automatic Tracking

                                </span>

                            </div>

                        </div>

                    );

                })}

            </div>


            {/* =====================================================
                INFORMATION
            ===================================================== */}

            <div
                className="mt-4 p-3 rounded-3"
                style={{
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                }}
            >

                <div className="d-flex gap-3">

                    <i
                        className="bi bi-info-circle"
                        style={{
                            color: "#2563eb",
                            fontSize: "20px",
                        }}
                    />

                    <div>

                        <strong>
                            Automatic Inventory Tracking
                        </strong>

                        <p
                            className="small text-muted mb-0 mt-1"
                        >
                            Product sizes and initial container
                            quantities come from Product Management.
                            Customer orders, driver acceptance,
                            completed deliveries, exchanges,
                            returns, damaged containers, and
                            missing containers are reflected
                            automatically in the inventory.
                        </p>

                    </div>

                </div>

            </div>

        </div>

    );
}

export default InventoryManagement;