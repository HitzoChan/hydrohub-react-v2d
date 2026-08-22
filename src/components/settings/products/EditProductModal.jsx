import { useEffect, useState } from "react";
import { updateProduct } from "../../../services/product.service";

export default function EditProductModal({
    show,
    onClose,
    onSuccess,
    product
}) {
    const [form, setForm] = useState({
        product_name: "",
        capacity: "",
        initial_containers: 0,
        base_price: "",
        exchange_price: "",
        exchange_required: true,
        enabled: true
    });

    const [saving, setSaving] = useState(false);

    /*
    |--------------------------------------------------------------------------
    | LOAD PRODUCT DATA
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (product) {
            setForm({
                product_name: product.product_name ?? "",
                capacity: product.capacity ?? "",
                initial_containers:
                    product.initial_containers ?? 0,
                base_price: product.base_price ?? "",
                exchange_price:
                    product.exchange_price ?? "",
                exchange_required:
                    product.exchange_required ?? true,
                enabled:
                    product.enabled ?? true
            });
        }
    }, [product]);

    /*
    |--------------------------------------------------------------------------
    | HANDLE INPUT
    |--------------------------------------------------------------------------
    */

    function handleChange(field, value) {
        setForm((prev) => ({
            ...prev,
            [field]: value
        }));
    }

    /*
    |--------------------------------------------------------------------------
    | SAVE PRODUCT
    |--------------------------------------------------------------------------
    */

    async function handleSubmit(e) {
        e.preventDefault();

        if (!product) return;

        if (
            form.initial_containers === "" ||
            Number(form.initial_containers) < 0
        ) {
            alert(
                "Initial container quantity cannot be negative."
            );
            return;
        }

        try {
            setSaving(true);

            const updates = {
                product_name:
                    form.product_name.trim(),

                capacity:
                    form.capacity.trim(),

                initial_containers:
                    Number(form.initial_containers),

                base_price:
                    Number(form.base_price),

                exchange_price:
                    Number(form.exchange_price),

                exchange_required:
                    form.exchange_required,

                enabled:
                    form.enabled
            };

            await updateProduct(
                product.id,
                updates
            );

            if (onSuccess) {
                await onSuccess();
            }

            onClose();

        } catch (err) {
            console.error(
                "Update product error:",
                err
            );

            alert(
                err?.message ||
                "Failed to update product."
            );

        } finally {
            setSaving(false);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | CLOSE
    |--------------------------------------------------------------------------
    */

    function handleClose() {
        if (saving) return;

        onClose();
    }

    /*
    |--------------------------------------------------------------------------
    | MODAL
    |--------------------------------------------------------------------------
    */

    if (!show || !product) {
        return null;
    }

    return (
        <div
            className="modal fade show d-block"
            style={{
                background:
                    "rgba(0, 0, 0, 0.5)"
            }}
        >
            <div className="modal-dialog modal-dialog-centered">

                <div className="modal-content">

                    {/* =================================================
                        HEADER
                    ================================================= */}

                    <div className="modal-header">

                        <h5 className="modal-title">
                            Edit Product
                        </h5>

                        <button
                            type="button"
                            className="btn-close"
                            onClick={handleClose}
                            disabled={saving}
                        />

                    </div>

                    {/* =================================================
                        FORM
                    ================================================= */}

                    <form onSubmit={handleSubmit}>

                        <div className="modal-body">

                            {/* PRODUCT NAME */}

                            <div className="mb-3">

                                <label className="form-label fw-semibold">
                                    Product Name
                                </label>

                                <input
                                    type="text"
                                    className="form-control"
                                    value={
                                        form.product_name
                                    }
                                    onChange={(e) =>
                                        handleChange(
                                            "product_name",
                                            e.target.value
                                        )
                                    }
                                    placeholder="Example: Purified Water"
                                    required
                                />

                            </div>

                            {/* CAPACITY */}

                            <div className="mb-3">

                                <label className="form-label fw-semibold">
                                    Capacity
                                </label>

                                <input
                                    type="text"
                                    className="form-control"
                                    value={
                                        form.capacity
                                    }
                                    onChange={(e) =>
                                        handleChange(
                                            "capacity",
                                            e.target.value
                                        )
                                    }
                                    placeholder="Example: 5 Gallon"
                                    required
                                />

                            </div>

                            {/* INITIAL CONTAINERS */}

                            <div className="mb-3">

                                <label className="form-label fw-semibold">
                                    Initial Containers
                                </label>

                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    className="form-control"
                                    value={
                                        form.initial_containers
                                    }
                                    onChange={(e) =>
                                        handleChange(
                                            "initial_containers",
                                            e.target.value
                                        )
                                    }
                                    required
                                />

                                <div className="form-text">
                                    Total number of containers
                                    owned by the station at
                                    the start of inventory.
                                </div>

                            </div>

                            {/* PRICES */}

                            <div className="row g-3">

                                <div className="col-md-6">

                                    <label className="form-label fw-semibold">
                                        Base Price
                                    </label>

                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className="form-control"
                                        value={
                                            form.base_price
                                        }
                                        onChange={(e) =>
                                            handleChange(
                                                "base_price",
                                                e.target.value
                                            )
                                        }
                                        required
                                    />

                                </div>

                                <div className="col-md-6">

                                    <label className="form-label fw-semibold">
                                        Exchange Price
                                    </label>

                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className="form-control"
                                        value={
                                            form.exchange_price
                                        }
                                        onChange={(e) =>
                                            handleChange(
                                                "exchange_price",
                                                e.target.value
                                            )
                                        }
                                        required
                                    />

                                </div>

                            </div>

                            {/* EXCHANGE */}

                            <div className="form-check mt-4">

                                <input
                                    id="editExchangeRequired"
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={
                                        form.exchange_required
                                    }
                                    onChange={(e) =>
                                        handleChange(
                                            "exchange_required",
                                            e.target.checked
                                        )
                                    }
                                />

                                <label
                                    htmlFor="editExchangeRequired"
                                    className="form-check-label"
                                >
                                    Exchange Required
                                </label>

                            </div>

                            {/* ENABLED */}

                            <div className="form-check mt-2">

                                <input
                                    id="editProductEnabled"
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={
                                        form.enabled
                                    }
                                    onChange={(e) =>
                                        handleChange(
                                            "enabled",
                                            e.target.checked
                                        )
                                    }
                                />

                                <label
                                    htmlFor="editProductEnabled"
                                    className="form-check-label"
                                >
                                    Product Enabled
                                </label>

                            </div>

                        </div>

                        {/* =================================================
                            FOOTER
                        ================================================= */}

                        <div className="modal-footer">

                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={handleClose}
                                disabled={saving}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={saving}
                            >
                                {saving ? (
                                    <>
                                        <span
                                            className="spinner-border spinner-border-sm me-2"
                                            role="status"
                                        />

                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-check-lg me-2" />
                                        Save Changes
                                    </>
                                )}
                            </button>

                        </div>

                    </form>

                </div>

            </div>
        </div>
    );
}