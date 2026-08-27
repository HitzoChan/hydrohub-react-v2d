import { useState } from "react";

const initialForm = {
    customerName: "",
    address: "",
    gallons: "",
    totalPrice: "",
    scheduledDate: "",
    scheduledTime: "",
};

export default function NewReservationModal({
    onClose,
    onCreated,
}) {
    const [form, setForm] = useState(initialForm);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    function updateField(event) {
        const { name, value } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value,
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setSaving(true);
        setError("");

        try {
            await onCreated(form);
        } catch (createError) {
            setError(
                createError?.message ||
                    "Unable to create reservation."
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="new-reservation-overlay" role="presentation">
            <div
                className="new-reservation-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="new-reservation-title"
            >
                <div className="new-reservation-modal-header">
                    <div>
                        <h2 id="new-reservation-title">
                            New Reservation
                        </h2>
                        <p>Schedule a customer delivery.</p>
                    </div>

                    <button
                        type="button"
                        className="new-reservation-close"
                        onClick={onClose}
                        aria-label="Close new reservation form"
                    >
                        <i className="bi bi-x-lg" />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="new-reservation-form-grid">
                        <label>
                            Customer name
                            <input
                                name="customerName"
                                value={form.customerName}
                                onChange={updateField}
                                required
                            />
                        </label>

                        <label>
                            Address
                            <input
                                name="address"
                                value={form.address}
                                onChange={updateField}
                            />
                        </label>

                        <label>
                            Gallons
                            <input
                                name="gallons"
                                type="number"
                                min="1"
                                step="1"
                                value={form.gallons}
                                onChange={updateField}
                                required
                            />
                        </label>

                        <label>
                            Total price
                            <input
                                name="totalPrice"
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.totalPrice}
                                onChange={updateField}
                            />
                        </label>

                        <label>
                            Date
                            <input
                                name="scheduledDate"
                                type="date"
                                value={form.scheduledDate}
                                onChange={updateField}
                                required
                            />
                        </label>

                        <label>
                            Time
                            <input
                                name="scheduledTime"
                                type="time"
                                value={form.scheduledTime}
                                onChange={updateField}
                                required
                            />
                        </label>
                    </div>

                    {error && (
                        <p className="new-reservation-error">
                            {error}
                        </p>
                    )}

                    <div className="new-reservation-actions">
                        <button
                            type="button"
                            className="reservation-secondary-button"
                            onClick={onClose}
                            disabled={saving}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="reservation-primary-button"
                            disabled={saving}
                        >
                            {saving ? "Saving..." : "Create Reservation"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}