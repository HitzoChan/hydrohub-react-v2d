export default function EmployeeSettings({

    settings,
    setSettings

}) {

    function handleCheckbox(e) {

        const { name, checked } = e.target;

        setSettings(prev => ({

            ...prev,

            [name]: checked

        }));

    }

    function handleInput(e) {

        const { name, value } = e.target;

        setSettings(prev => ({

            ...prev,

            [name]: value

        }));

    }

    return (

        <>

            <div className="card shadow-sm border-0 mb-4">

                <div className="card-header bg-white">

                    <h5 className="mb-1">

                        Employee Settings

                    </h5>

                    <small className="text-muted">

                        Configure employee accounts and workload.

                    </small>

                </div>

                <div className="card-body">

                    <div className="mb-4">

                        <label className="form-label fw-semibold">

                            Maximum Deliveries Per Driver

                        </label>

                        <input

                            type="number"

                            min="1"

                            className="form-control"

                            name="max_deliveries_per_driver"

                            value={settings.max_deliveries_per_driver}

                            onChange={handleInput}

                        />

                        <small className="text-muted">

                            Limits the number of deliveries assigned to each driver.

                        </small>

                    </div>

                    <hr />

                    <div className="form-check form-switch mb-4">

                        <input

                            className="form-check-input"

                            type="checkbox"

                            role="switch"

                            id="autoCode"

                            name="auto_generate_code"

                            checked={settings.auto_generate_code}

                            onChange={handleCheckbox}

                        />

                        <label
                            className="form-check-label ms-2"
                            htmlFor="autoCode"
                        >

                            Automatically Generate Employee Access Code

                        </label>

                    </div>

                    <div>

                        <label className="form-label fw-semibold">

                            Employee Access Code Length

                        </label>

                        <input

                            type="number"

                            min="4"

                            max="12"

                            className="form-control"

                            name="code_length"

                            value={settings.code_length}

                            onChange={handleInput}

                            disabled={!settings.auto_generate_code}

                        />

                        <small className="text-muted">

                            Recommended length is between 6 and 8 characters.

                        </small>

                    </div>

                </div>

            </div>

            <div className="card border-0 shadow-sm">

                <div className="card-header bg-light">

                    <h6 className="mb-0">

                        Current Configuration

                    </h6>

                </div>

                <div className="card-body">

                    <div className="d-flex justify-content-between mb-3">

                        <span>

                            Maximum Deliveries

                        </span>

                        <strong>

                            {settings.max_deliveries_per_driver}

                        </strong>

                    </div>

                    <div className="d-flex justify-content-between mb-3">

                        <span>

                            Auto Generate Code

                        </span>

                        <span
                            className={`badge ${
                                settings.auto_generate_code
                                    ? "bg-success"
                                    : "bg-danger"
                            }`}
                        >

                            {settings.auto_generate_code
                                ? "Enabled"
                                : "Disabled"}

                        </span>

                    </div>

                    <div className="d-flex justify-content-between">

                        <span>

                            Access Code Length

                        </span>

                        <strong>

                            {settings.code_length} Characters

                        </strong>

                    </div>

                </div>

            </div>

        </>

    );

}