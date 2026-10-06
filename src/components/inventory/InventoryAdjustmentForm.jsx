import { useState } from "react";
import { createInventoryAdjustment } from "../../services/inventory.service";

export default function InventoryAdjustmentForm({ inventory = [], onSaved }) {
    const [form, setForm] = useState({
        productId: "",
        type: "new_purchase",
        quantity: "1",
        notes: "",
    });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    const selectedProduct = inventory.find(
        (item) => String(item.product_id || item.id) === String(form.productId)
    );

    const currentTotal = Math.max(
        0,
        Number(selectedProduct?.total ?? 0) -
            Number(selectedProduct?.missing ?? 0)
    );
    const maximumTotal = Number(
        selectedProduct?.initial_containers ?? currentTotal
    );
    const remainingCapacity = Math.max(
        0,
        maximumTotal - currentTotal
    );
    const canPurchase = remainingCapacity > 0;

    async function handleSubmit(event) {
        event.preventDefault();
        const product = selectedProduct;

        if (
            form.type === "new_purchase" &&
            (!canPurchase || Number(form.quantity) > remainingCapacity)
        ) {
            setMessage(
                canPurchase
                    ? `Purchase quantity cannot exceed the remaining ${remainingCapacity} container${remainingCapacity === 1 ? "" : "s"}.`
                    : "This product already reached its initial container limit."
            );
            return;
        }

        try {
            setSaving(true);
            setMessage("");
            await createInventoryAdjustment({
                productId: product?.product_id || product?.id,
                capacity: product?.capacity,
                adjustmentType: form.type,
                quantity: form.quantity,
                notes: form.notes,
                currentTotal,
                maximumTotal,
            });
            setForm((current) => ({ ...current, quantity: "1", notes: "" }));
            setMessage("Container adjustment saved.");
            await onSaved?.();
        } catch (error) {
            setMessage(error?.message || "Unable to save adjustment.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-3">
                <div className="mb-3">
                    <h5 className="mb-1">Add Containers</h5>
                    <small className="text-muted">
                        Record new purchases, repaired damage, or recovered missing containers.
                    </small>
                </div>
                <form className="row g-2 align-items-end" onSubmit={handleSubmit}>
                    <div className="col-md-3">
                        <label className="form-label small fw-semibold">Product</label>
                        <select className="form-select" value={form.productId} onChange={(event) => setForm({ ...form, productId: event.target.value })} required>
                            <option value="">Select product</option>
                            {inventory.map((item) => (
                                <option key={item.product_id || item.id} value={item.product_id || item.id}>
                                    {item.product_name} ({item.capacity})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="col-md-3">
                        <label className="form-label small fw-semibold">Adjustment</label>
                        <select className="form-select" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
                            <option value="new_purchase" disabled={!canPurchase}>
                                {canPurchase ? "New purchase" : "New purchase (limit reached)"}
                            </option>
                            <option value="repaired">Repaired damaged</option>
                            <option value="recovered">Recovered missing</option>
                        </select>
                    </div>
                    <div className="col-md-2">
                        <label className="form-label small fw-semibold">Quantity</label>
                        <input className="form-control" type="number" min="1" max={form.type === "new_purchase" ? remainingCapacity : undefined} step="1" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} required />
                    </div>
                    <div className="col-md-3">
                        <label className="form-label small fw-semibold">Notes</label>
                        <input className="form-control" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Optional" />
                    </div>
                    <div className="col-md-1">
                        <button className="btn btn-primary w-100" disabled={saving || !form.productId || (form.type === "new_purchase" && (!canPurchase || Number(form.quantity) > remainingCapacity))}>{saving ? "..." : "Add"}</button>
                    </div>
                </form>
                {form.type === "new_purchase" && form.productId && (
                    <small className="d-block mt-2 text-muted">
                        {canPurchase
                            ? `${remainingCapacity} container${remainingCapacity === 1 ? "" : "s"} available before reaching the product limit.`
                            : "This product is already at its configured container limit."}
                    </small>
                )}
                {message && <small className="d-block mt-2 text-muted">{message}</small>}
            </div>
        </div>
    );
}
