export default function SecuritySettings({ settings, setSettings }) {
    function handleLimitChange(event) {
        const value = Math.max(
            1,
            Number(event.target.value) || 1
        );

        setSettings((current) => ({
            ...current,
            maxActiveOrdersPerCustomer: value,
        }));
    }

    const limit = Number(
        settings?.maxActiveOrdersPerCustomer
    ) || 3;

    return (
        <div className="card shadow-sm border-0 security-settings-card">
            <div className="card-header bg-white security-settings-header">
                <h5 className="mb-1">Order Security</h5>
                <small className="text-muted security-settings-intro">
                    Protect the station from too many outstanding orders from one customer.
                </small>
            </div>

            <div className="card-body security-settings-body">
                <div className="security-setting-field">
                    <label
                        htmlFor="maxActiveOrdersPerCustomer"
                        className="form-label fw-semibold"
                    >
                        Maximum Active Orders per Customer
                    </label>

                    <input
                        id="maxActiveOrdersPerCustomer"
                        type="number"
                        min="1"
                        step="1"
                        className="form-control"
                        value={limit}
                        onChange={handleLimitChange}
                    />

                    <small className="text-muted security-settings-help">
                        The limit applies to orders waiting for station acceptance.
                        Accepted, assigned, delivered, cancelled, and rejected orders do not count.
                    </small>
                </div>

                <div className="security-rule-summary">
                    <i className="bi bi-shield-lock-fill" />
                    <div className="security-rule-content">
                        <strong>How this protection works</strong>
                        <p>
                            A customer can have up to {limit} pending orders. A new order above this
                            limit is rejected until the station accepts one of the existing orders.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}