export default function GeneralSettings({

    settings,
    setSettings

}) {

    function handleChange(e) {

        const { name, value } = e.target;

        setSettings(prev => ({

            ...prev,

            [name]: value

        }));

    }

    return (

        <div className="settings-card">

            <h6 className="section-title">

                Business Profile

            </h6>

            {/* Brand */}

            <div className="brand-display mb-3">

                <div className="brand-avatar">

                    AH

                </div>

                <div>

                    <div className="fw-semibold">

                        Aqua en Lavada System

                    </div>

                    <small className="text-muted">

                        Station profile and system preferences

                    </small>

                </div>

            </div>

            <div className="fields-grid two-col">

                <div>

                    <label className="form-label">

                        Station Name

                    </label>

                    <input

                        type="text"

                        className="form-control"

                        name="stationName"

                        value={settings.stationName}

                        onChange={handleChange}

                        placeholder="Station Name"

                    />

                </div>

                <div>

                    <label className="form-label">

                        Contact

                    </label>

                    <input

                        type="text"

                        className="form-control"

                        name="stationContact"

                        value={settings.stationContact}

                        onChange={handleChange}

                        placeholder="Contact"

                    />

                </div>

                <div className="field-span-2">

                    <label className="form-label">

                        Address

                    </label>

                    <input

                        type="text"

                        className="form-control"

                        name="stationAddress"

                        value={settings.stationAddress}

                        onChange={handleChange}

                        placeholder="Address"

                    />

                </div>

            </div>

        </div>

    );

}