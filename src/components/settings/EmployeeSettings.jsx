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

                            name="maxDeliveries"

                            value={settings.maxDeliveries}

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

                            name="autoCode"

                            checked={settings.autoCode}

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

                            name="codeLength"

                            value={settings.codeLength}

                            onChange={handleInput}

                            disabled={!settings.autoCode}

                        />

                        <small className="text-muted">

                            Recommended length is between 6 and 8 characters.

                        </small>

                    </div>

                </div>

            </div>

        </>

    );

}