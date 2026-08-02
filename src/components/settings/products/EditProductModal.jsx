import { useState } from "react";
import { updateProduct } from "../../../services/product.service";

export default function EditProductModal({
    show,
    onClose,
    onSuccess,
    product
}) {

    const [form, setForm] = useState(() => ({
        product_name: product?.product_name ?? "",
        capacity: product?.capacity ?? "",
        base_price: product?.base_price ?? "",
        exchange_price: product?.exchange_price ?? "",
        exchange_required: product?.exchange_required ?? true,
        enabled: product?.enabled ?? true
    }));

    const [saving, setSaving] = useState(false);

    const handleChange = (field, value) => {
        setForm(prev => ({
            ...prev,
            [field]: value
        }));
    };

    async function handleSubmit(e) {
        e.preventDefault();

        if (!product) return;

        try {

            setSaving(true);

            await updateProduct(product.id, {
                ...form,
                base_price: Number(form.base_price),
                exchange_price: Number(form.exchange_price)
            });

            onSuccess();
            onClose();

        } catch (err) {

            console.error(err);
            alert(err.message);

        } finally {

            setSaving(false);

        }
    }

    console.log("Modal render:", show);
    if (!show || !product) return null;

    return (
        <div
            className="modal fade show d-block"
            style={{ background: "rgba(0,0,0,.5)" }}
        >
            <div className="modal-dialog">
                <div className="modal-content">

                    <form onSubmit={handleSubmit}>

                        <div className="modal-header">

                            <h5 className="modal-title">
                                Edit Product
                            </h5>

                            <button
                                type="button"
                                className="btn-close"
                                onClick={onClose}
                            />

                        </div>

                        <div className="modal-body">

                            <div className="mb-3">

                                <label className="form-label">
                                    Product Name
                                </label>

                                <input
                                    className="form-control"
                                    value={form.product_name}
                                    onChange={(e) =>
                                        handleChange("product_name", e.target.value)
                                    }
                                />

                            </div>

                            <div className="mb-3">

                                <label className="form-label">
                                    Capacity
                                </label>

                                <input
                                    className="form-control"
                                    value={form.capacity}
                                    onChange={(e) =>
                                        handleChange("capacity", e.target.value)
                                    }
                                />

                            </div>

                            <div className="row">

                                <div className="col">

                                    <label className="form-label">
                                        Base Price
                                    </label>

                                    <input
                                        type="number"
                                        className="form-control"
                                        value={form.base_price}
                                        onChange={(e) =>
                                            handleChange("base_price", e.target.value)
                                        }
                                    />

                                </div>

                                <div className="col">

                                    <label className="form-label">
                                        Exchange Price
                                    </label>

                                    <input
                                        type="number"
                                        className="form-control"
                                        value={form.exchange_price}
                                        onChange={(e) =>
                                            handleChange("exchange_price", e.target.value)
                                        }
                                    />

                                </div>

                            </div>

                            <div className="form-check mt-3">

                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={form.exchange_required}
                                    onChange={(e) =>
                                        handleChange("exchange_required", e.target.checked)
                                    }
                                />

                                <label className="form-check-label">
                                    Exchange Required
                                </label>

                            </div>

                            <div className="form-check mt-2">

                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={form.enabled}
                                    onChange={(e) =>
                                        handleChange("enabled", e.target.checked)
                                    }
                                />

                                <label className="form-check-label">
                                    Enabled
                                </label>

                            </div>

                        </div>

                        <div className="modal-footer">

                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={onClose}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="btn btn-primary"
                                disabled={saving}
                                onClick={async () => {
                                    if (!product) return;

                                    try {
                                        setSaving(true);

                                        console.log("Updating product...");

                                        await updateProduct(product.id, {
                                            ...form,
                                            base_price: Number(form.base_price),
                                            exchange_price: Number(form.exchange_price)
                                        });

                                        console.log("Update success");

console.log("Before onSuccess");

await onSuccess();

console.log("After onSuccess");

onClose();

console.log("Modal closed");

                                    } catch (err) {
                                        console.error(err);
                                        alert(err.message || "Failed to update product.");
                                    } finally {
                                        setSaving(false);
                                    }
                                }}
                            >
                                {saving ? "Saving..." : "Save Changes"}
                            </button>

                        </div>

                    </form>

                </div>
            </div>
        </div>
    );
}