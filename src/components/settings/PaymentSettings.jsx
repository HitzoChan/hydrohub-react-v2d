import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function PaymentSettings() {
    const [settingsId, setSettingsId] = useState(null);

    const [form, setForm] = useState({
        gcash_account_name: "",
        gcash_number: "",
        gcash_enabled: true,
        downpayment_enabled: true,
        downpayment_percentage: 30,
        minimum_gallons: 10,
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        loadSystemSettings();
    }, []);

    async function loadSystemSettings() {
        try {
            setLoading(true);
            setError("");
            setMessage("");

            const { data, error } = await supabase
                .from("system_settings")
                .select(
                    "id, gcash_enabled, gcash_number, gcash_account_name, downpayment_enabled, minimum_gallons, downpayment_percentage"
                )
                .order("created_at", {
                    ascending: true,
                })
                .limit(1)
                .maybeSingle();

            if (error) {
                throw error;
            }

            if (data) {
                setSettingsId(data.id);

                setForm({
                    gcash_account_name:
                        data.gcash_account_name || "",

                    gcash_number:
                        data.gcash_number || "",

                    gcash_enabled:
                        data.gcash_enabled ?? true,

                    downpayment_enabled:
                        data.downpayment_enabled ?? true,

                    downpayment_percentage:
                        data.downpayment_percentage ?? 30,

                    minimum_gallons:
                        data.minimum_gallons ?? 10,
                });
            }
        } catch (err) {
            console.error(
                "Failed to load system settings:",
                err
            );

            setError(
                err.message ||
                    "Unable to load payment settings."
            );
        } finally {
            setLoading(false);
        }
    }

    function handleChange(e) {
        const {
            name,
            value,
            type,
            checked,
        } = e.target;

        setForm((previous) => ({
            ...previous,
            [name]:
                type === "checkbox"
                    ? checked
                    : value,
        }));
    }

    async function handleSubmit(e) {
        e.preventDefault();

        try {
            setSaving(true);
            setError("");
            setMessage("");

            const accountName =
                form.gcash_account_name.trim();

            const gcashNumber =
                form.gcash_number.trim();

            const percentage = Number(
                form.downpayment_percentage
            );

            const minimumGallons = Number(
                form.minimum_gallons
            );

            /*
             * GCash validation
             */
            if (
                form.gcash_enabled &&
                !accountName
            ) {
                throw new Error(
                    "Please enter the GCash account name."
                );
            }

            if (
                form.gcash_enabled &&
                !gcashNumber
            ) {
                throw new Error(
                    "Please enter the GCash number."
                );
            }

            /*
             * Down payment validation
             */
            if (
                form.downpayment_enabled &&
                (percentage <= 0 ||
                    percentage > 100)
            ) {
                throw new Error(
                    "Down payment percentage must be between 1 and 100."
                );
            }

            if (
                form.downpayment_enabled &&
                minimumGallons < 1
            ) {
                throw new Error(
                    "Minimum gallons must be at least 1."
                );
            }

            /*
             * Data uses the REAL system_settings
             * column names.
             */
            const payload = {
                gcash_account_name: accountName,

                gcash_number: gcashNumber,

                gcash_enabled:
                    form.gcash_enabled,

                downpayment_enabled:
                    form.downpayment_enabled,

                downpayment_percentage:
                    percentage,

                minimum_gallons:
                    minimumGallons,
            };

            let savedData;

            /*
             * Update the existing system settings.
             */
            if (settingsId) {
                const { data, error } =
                    await supabase
                        .from("system_settings")
                        .update(payload)
                        .eq("id", settingsId)
                        .select(
                            "id, gcash_enabled, gcash_number, gcash_account_name, downpayment_enabled, minimum_gallons, downpayment_percentage"
                        )
                        .single();

                if (error) {
                    throw error;
                }

                savedData = data;
            }

            /*
             * Create system settings only if
             * no settings record currently exists.
             */
            else {
                const { data, error } =
                    await supabase
                        .from("system_settings")
                        .insert([payload])
                        .select(
                            "id, gcash_enabled, gcash_number, gcash_account_name, downpayment_enabled, minimum_gallons, downpayment_percentage"
                        )
                        .single();

                if (error) {
                    throw error;
                }

                savedData = data;
            }

            /*
             * Keep the ID synchronized.
             */
            if (savedData?.id) {
                setSettingsId(savedData.id);
            }

            /*
             * Keep the form synchronized with
             * the database values.
             */
            if (savedData) {
                setForm({
                    gcash_account_name:
                        savedData.gcash_account_name ||
                        "",

                    gcash_number:
                        savedData.gcash_number ||
                        "",

                    gcash_enabled:
                        savedData.gcash_enabled ??
                        true,

                    downpayment_enabled:
                        savedData.downpayment_enabled ??
                        true,

                    downpayment_percentage:
                        savedData.downpayment_percentage ??
                        30,

                    minimum_gallons:
                        savedData.minimum_gallons ??
                        10,
                });
            }

            setMessage(
                "Payment settings saved successfully."
            );
        } catch (err) {
            console.error(
                "Failed to save payment settings:",
                err
            );

            setError(
                err.message ||
                    "Unable to save payment settings."
            );
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="card">
                <div className="card-body">
                    <p className="mb-0">
                        Loading payment settings...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-body">

                {/* Page Header */}
                <div className="mb-4">
                    <h5 className="mb-1">
                        Payment Settings
                    </h5>

                    <p className="text-muted mb-0">
                        Manage GCash payment information
                        and down payment requirements.
                    </p>
                </div>

                {/* Success Message */}
                {message && (
                    <div
                        className="alert alert-success"
                        role="alert"
                    >
                        {message}
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div
                        className="alert alert-danger"
                        role="alert"
                    >
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    {/* =========================
                        GCASH SETTINGS
                    ========================== */}
                    <div className="mb-4">

                        <h6 className="fw-bold mb-3">
                            GCash Settings
                        </h6>

                        {/* Account Name */}
                        <div className="mb-3">

                            <label className="form-label">
                                GCash Account Name
                            </label>

                            <input
                                type="text"
                                className="form-control"
                                name="gcash_account_name"
                                value={
                                    form.gcash_account_name
                                }
                                onChange={handleChange}
                                placeholder="Enter GCash account name"
                                disabled={saving}
                            />

                        </div>

                        {/* GCash Number */}
                        <div className="mb-3">

                            <label className="form-label">
                                GCash Number
                            </label>

                            <input
                                type="tel"
                                className="form-control"
                                name="gcash_number"
                                value={
                                    form.gcash_number
                                }
                                onChange={handleChange}
                                placeholder="09XXXXXXXXX"
                                maxLength="11"
                                disabled={saving}
                            />

                        </div>

                        {/* Enable GCash */}
                        <div className="form-check">

                            <input
                                type="checkbox"
                                className="form-check-input"
                                id="gcash-enabled"
                                name="gcash_enabled"
                                checked={
                                    form.gcash_enabled
                                }
                                onChange={handleChange}
                                disabled={saving}
                            />

                            <label
                                className="form-check-label"
                                htmlFor="gcash-enabled"
                            >
                                Enable GCash payments
                            </label>

                        </div>

                    </div>

                    <hr />

                    {/* =========================
                        DOWN PAYMENT SETTINGS
                    ========================== */}
                    <div className="mt-4 mb-4">

                        <h6 className="fw-bold mb-3">
                            Down Payment Settings
                        </h6>

                        {/* Enable Down Payment */}
                        <div className="form-check mb-3">

                            <input
                                type="checkbox"
                                className="form-check-input"
                                id="require-down-payment"
                                name="downpayment_enabled"
                                checked={
                                    form.downpayment_enabled
                                }
                                onChange={handleChange}
                                disabled={saving}
                            />

                            <label
                                className="form-check-label"
                                htmlFor="require-down-payment"
                            >
                                Require down payment
                            </label>

                        </div>

                        {form.downpayment_enabled && (
                            <div className="row">

                                {/* Percentage */}
                                <div className="col-md-6 mb-3">

                                    <label className="form-label">
                                        Down Payment Percentage
                                    </label>

                                    <div className="input-group">

                                        <input
                                            type="number"
                                            className="form-control"
                                            name="downpayment_percentage"
                                            value={
                                                form.downpayment_percentage
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            min="1"
                                            max="100"
                                            step="1"
                                            disabled={saving}
                                        />

                                        <span className="input-group-text">
                                            %
                                        </span>

                                    </div>

                                    <small className="text-muted">
                                        Percentage of the
                                        total order amount.
                                    </small>

                                </div>

                                {/* Minimum Quantity */}
                                <div className="col-md-6 mb-3">

                                    <label className="form-label">
                                        Minimum Order Quantity
                                    </label>

                                    <input
                                        type="number"
                                        className="form-control"
                                        name="minimum_gallons"
                                        value={
                                            form.minimum_gallons
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        min="1"
                                        step="1"
                                        disabled={saving}
                                    />

                                    <small className="text-muted">
                                        Orders at or above
                                        this quantity require
                                        a down payment.
                                    </small>

                                </div>

                            </div>
                        )}

                    </div>

                    {/* Save Button */}
                    <div className="d-flex justify-content-end">

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={saving}
                        >
                            {saving
                                ? "Saving..."
                                : "Save Changes"}
                        </button>

                    </div>

                </form>

            </div>
        </div>
    );
}