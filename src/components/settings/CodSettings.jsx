export default function CodSettings({

    settings,
    setSettings

}) {

    function handleToggle(e) {

        const { name, checked } = e.target;

        setSettings(prev => ({

            ...prev,

            [name]: checked

        }));

    }

    return (

        <div className="settings-card">

            <h6 className="section-title">

                Cash on Delivery

            </h6>

            <div className="switch-grid two-col">

                <label className="switch-item">

                    <div>

                        <span className="fw-medium">

                            Enable COD

                        </span>

                        <div className="small text-muted">

                            Allow customers to pay upon delivery.

                        </div>

                    </div>

                    <div className="form-check form-switch m-0">

                        <input

                            className="form-check-input"

                            type="checkbox"

                            role="switch"

                            name="codEnabled"

                            checked={settings.codEnabled}

                            onChange={handleToggle}

                        />

                    </div>

                </label>

                <label className="switch-item">

                    <div>

                        <span className="fw-medium">

                            Require Verification

                        </span>

                        <div className="small text-muted">

                            Verify customers before allowing COD orders.

                        </div>

                    </div>

                    <div className="form-check form-switch m-0">

                        <input

                            className="form-check-input"

                            type="checkbox"

                            role="switch"

                            name="codVerification"

                            checked={settings.codVerification}

                            onChange={handleToggle}

                        />

                    </div>

                </label>

            </div>

            <div className="alert alert-info mt-4 mb-0">

                <h6 className="mb-3">

                    Current Configuration

                </h6>

                <div className="d-flex justify-content-between">

                    <span>

                        Cash on Delivery

                    </span>

                    <strong className={settings.codEnabled ? "text-success" : "text-danger"}>

                        {settings.codEnabled ? "Enabled" : "Disabled"}

                    </strong>

                </div>

                <div className="d-flex justify-content-between mt-2">

                    <span>

                        Customer Verification

                    </span>

                    <strong className={settings.codVerification ? "text-success" : "text-danger"}>

                        {settings.codVerification ? "Required" : "Not Required"}

                    </strong>

                </div>

            </div>

        </div>

    );

}