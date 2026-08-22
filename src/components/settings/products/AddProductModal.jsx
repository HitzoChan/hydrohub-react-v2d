import { useState } from "react";
import { addProduct } from "../../../services/product.service";

export default function AddProductModal({
    show,
    onClose,
    onSuccess
}) {

    const initialForm = {
        product_name: "",
        capacity: "",
        base_price: "",
        exchange_price: "",
        exchange_required: true,
        enabled: true,
        initial_containers: 0
    };

    const [form, setForm] = useState(initialForm);
    const [saving, setSaving] = useState(false);

    function handleChange(e) {

        const { name, value, type, checked } = e.target;

        setForm(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));

    }

    async function handleSubmit(e) {

        e.preventDefault();

        try {

            setSaving(true);

            const initialContainers =
                Math.max(
                    0,
                    parseInt(form.initial_containers, 10) || 0
                );

            await addProduct({

                product_name: form.product_name.trim(),

                capacity: form.capacity.trim(),

                base_price:
                    Number(form.base_price) || 0,

                exchange_price:
                    Number(form.exchange_price) || 0,

                exchange_required:
                    form.exchange_required,

                enabled:
                    form.enabled,

                initial_containers:
                    initialContainers

            });

            await onSuccess();

            onClose();

            setForm(initialForm);

        } catch (err) {

            console.error(
                "Failed to add product:",
                err
            );

            alert(
                err?.message ||
                "Failed to add product."
            );

        } finally {

            setSaving(false);

        }

    }

    if (!show) return null;

    return (

        <div
            className="modal fade show d-block"
            style={{
                background: "rgba(0,0,0,.5)"
            }}
        >

            <div className="modal-dialog">

                <div className="modal-content">

                    <form onSubmit={handleSubmit}>

                        {/* =========================
                            HEADER
                        ========================== */}

                        <div className="modal-header">

                            <h5 className="modal-title">
                                Add Product
                            </h5>

                            <button
                                type="button"
                                className="btn-close"
                                onClick={onClose}
                                disabled={saving}
                            />

                        </div>


                        {/* =========================
                            BODY
                        ========================== */}

                        <div className="modal-body">

                            {/* PRODUCT NAME */}

                            <div className="mb-3">

                                <label className="form-label">
                                    Product Name
                                </label>

                                <input
                                    type="text"
                                    name="product_name"
                                    className="form-control"
                                    placeholder="e.g. Gallons"
                                    value={form.product_name}
                                    onChange={handleChange}
                                    required
                                />

                            </div>


                            {/* CAPACITY */}

                            <div className="mb-3">

                                <label className="form-label">
                                    Capacity
                                </label>

                                <input
                                    type="text"
                                    name="capacity"
                                    className="form-control"
                                    placeholder="e.g. 5 gallons"
                                    value={form.capacity}
                                    onChange={handleChange}
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
                                    name="initial_containers"
                                    className="form-control"
                                    min="0"
                                    step="1"
                                    placeholder="e.g. 100"
                                    value={form.initial_containers}
                                    onChange={handleChange}
                                    required
                                />

                                <div className="form-text">
                                    Starting number of containers owned
                                    by the station.
                                </div>

                            </div>


                            {/* PRICES */}

                            <div className="row g-3">

                                <div className="col-md-6">

                                    <label className="form-label">
                                        Base Price
                                    </label>

                                    <input
                                        type="number"
                                        name="base_price"
                                        className="form-control"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={form.base_price}
                                        onChange={handleChange}
                                        required
                                    />

                                </div>


                                <div className="col-md-6">

                                    <label className="form-label">
                                        Exchange Price
                                    </label>

                                    <input
                                        type="number"
                                        name="exchange_price"
                                        className="form-control"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={form.exchange_price}
                                        onChange={handleChange}
                                        required
                                    />

                                </div>

                            </div>


                            {/* EXCHANGE REQUIRED */}

                            <div className="form-check mt-4">

                                <input
                                    type="checkbox"
                                    id="exchangeRequired"
                                    name="exchange_required"
                                    className="form-check-input"
                                    checked={
                                        form.exchange_required
                                    }
                                    onChange={handleChange}
                                />

                                <label
                                    htmlFor="exchangeRequired"
                                    className="form-check-label"
                                >
                                    Exchange Required
                                </label>

                            </div>


                            {/* ENABLED */}

                            <div className="form-check mt-3">

                                <input
                                    type="checkbox"
                                    id="productEnabled"
                                    name="enabled"
                                    className="form-check-input"
                                    checked={form.enabled}
                                    onChange={handleChange}
                                />

                                <label
                                    htmlFor="productEnabled"
                                    className="form-check-label"
                                >
                                    Product Enabled
                                </label>

                            </div>

                        </div>


                        {/* =========================
                            FOOTER
                        ========================== */}

                        <div className="modal-footer">

                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={onClose}
                                disabled={saving}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={saving}
                            >

                                {saving
                                    ? "Saving..."
                                    : "Add Product"
                                }

                            </button>

                        </div>

                    </form>

                </div>

            </div>

        </div>

    );

}