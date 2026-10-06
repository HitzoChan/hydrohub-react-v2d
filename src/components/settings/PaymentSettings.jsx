import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const GCASH_QR_BUCKET = "gcash-qr-codes";

export default function PaymentSettings() {
    const [settingsId, setSettingsId] = useState(null);

    const [form, setForm] = useState({
        gcash_account_name: "",
        gcash_number: "",
        gcash_qr_code_url: "",
        gcash_enabled: true,
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [qrFile, setQrFile] = useState(null);
    const [qrPreview, setQrPreview] = useState("");
    const [removeQr, setRemoveQr] = useState(false);

    useEffect(() => {
        return () => {
            if (qrPreview.startsWith("blob:")) {
                URL.revokeObjectURL(qrPreview);
            }
        };
    }, [qrPreview]);

    async function loadSystemSettings() {
        try {
            const { data, error } = await supabase
                .from("system_settings")
                .select(
                    "id, gcash_enabled, gcash_number, gcash_account_name, gcash_qr_code_url"
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

                    gcash_qr_code_url:
                        data.gcash_qr_code_url || "",

                    gcash_enabled:
                        data.gcash_enabled ?? true,
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

    useEffect(() => {
        Promise.resolve().then(loadSystemSettings);
    }, []);

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

    function handleQrChange(e) {
        const file = e.target.files?.[0];

        if (!file) {
            return;
        }

        if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
            setError("Choose a PNG, JPG, or WebP image for the GCash QR code.");
            e.target.value = "";
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError("The GCash QR image must be 5 MB or smaller.");
            e.target.value = "";
            return;
        }

        setError("");
        setQrFile(file);
        setQrPreview(URL.createObjectURL(file));
        setRemoveQr(false);
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
             * Data uses the REAL system_settings
             * column names.
             */
            const payload = {
                gcash_account_name: accountName,

                gcash_number: gcashNumber,

                gcash_enabled:
                    form.gcash_enabled,
            };

            const previousQrUrl = form.gcash_qr_code_url;

            if (qrFile) {
                const extension = {
                    "image/png": "png",
                    "image/jpeg": "jpg",
                    "image/webp": "webp",
                }[qrFile.type];
                const uploadedQrPath = `gcash-qr/${crypto.randomUUID()}.${extension}`;

                const { error: uploadError } = await supabase.storage
                    .from(GCASH_QR_BUCKET)
                    .upload(uploadedQrPath, qrFile, {
                        cacheControl: "3600",
                        contentType: qrFile.type,
                        upsert: false,
                    });

                if (uploadError) {
                    throw uploadError;
                }

                const { data: publicUrlData } = supabase.storage
                    .from(GCASH_QR_BUCKET)
                    .getPublicUrl(uploadedQrPath);

                payload.gcash_qr_code_url = publicUrlData.publicUrl;
            } else if (removeQr) {
                payload.gcash_qr_code_url = null;
            } else {
                payload.gcash_qr_code_url = previousQrUrl || null;
            }

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
                            "id, gcash_enabled, gcash_number, gcash_account_name, gcash_qr_code_url"
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
                            "id, gcash_enabled, gcash_number, gcash_account_name, gcash_qr_code_url"
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

                    gcash_qr_code_url:
                        savedData.gcash_qr_code_url ||
                        "",

                    gcash_enabled:
                        savedData.gcash_enabled ??
                        true,
                });
            }

            setQrFile(null);
            setQrPreview("");
            setRemoveQr(false);

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
                        Manage GCash payment information.
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

                        {/* GCash QR Code */}
                        <div className="mb-3">
                            <label className="form-label" htmlFor="gcash-qr-code">
                                GCash QR Code
                            </label>

                            <input
                                id="gcash-qr-code"
                                type="file"
                                className="form-control"
                                accept="image/png,image/jpeg,image/webp"
                                onChange={handleQrChange}
                                disabled={saving}
                            />

                            <small className="text-muted">
                                Upload a PNG, JPG, or WebP image up to 5 MB.
                            </small>

                            {(qrPreview || form.gcash_qr_code_url) && !removeQr && (
                                <div className="mt-3 d-flex align-items-start gap-3">
                                    <img
                                        src={qrPreview || form.gcash_qr_code_url}
                                        alt="GCash payment QR code"
                                        style={{
                                            width: 160,
                                            height: 160,
                                            objectFit: "contain",
                                        }}
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-outline-danger btn-sm"
                                        onClick={() => {
                                            setQrFile(null);
                                            setQrPreview("");
                                            setRemoveQr(true);
                                        }}
                                        disabled={saving}
                                    >
                                        Remove QR code
                                    </button>
                                </div>
                            )}

                            {removeQr && (
                                <p className="text-muted mt-2 mb-0">
                                    The QR code will be removed when you save.
                                </p>
                            )}
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