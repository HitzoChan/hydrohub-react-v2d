export default function DeliverySettings({ settings, setSettings }) {

    const maxDeliveries = Number(settings.maxDeliveries) || 0;
    const duration = Number(settings.deliveryDuration) || 0;

    // 8-hour working day
    const slotsPerDay =
        duration > 0
            ? Math.floor(480 / duration)
            : 0;

    const status =
        duration > 0
            ? "Ready"
            : "Needs Configuration";

    return (

        <div className="card shadow-sm border-0">

            <div className="card-body">

                <h4 className="fw-bold mb-4">
                    Delivery Rules
                </h4>

                <div className="row">

                    {/* Maximum Deliveries */}

                    <div className="col-md-6 mb-4">

                        <label className="form-label fw-semibold">
                            Max Deliveries per Slot
                        </label>

                        <input
                            type="number"
                            min="1"
                            className="form-control form-control-lg"
                            value={settings.maxDeliveries}
                            onChange={(e) =>
                                setSettings(prev => ({
                                    ...prev,
                                    maxDeliveries: e.target.value
                                }))
                            }
                        />

                        <small className="text-muted">
                            Maximum number of orders allowed in one delivery schedule.
                        </small>

                    </div>

                    {/* Duration */}

                    <div className="col-md-6 mb-4">

                        <label className="form-label fw-semibold">
                            Delivery Duration (minutes)
                        </label>

                        <input
                            type="number"
                            min="15"
                            className="form-control form-control-lg"
                            value={settings.deliveryDuration}
                            onChange={(e) =>
                                setSettings(prev => ({
                                    ...prev,
                                    deliveryDuration: e.target.value
                                }))
                            }
                        />

                        <small className="text-muted">
                            Estimated delivery time for scheduling purposes.
                        </small>

                    </div>

                </div>

                <hr className="my-4" />

                {/* SUMMARY */}

                <div className="card bg-light border-0">

                    <div className="card-body">

                        <h5 className="fw-bold mb-4">
                            Delivery Summary
                        </h5>

                        <div className="row">

                            <div className="col-md-6">

                                <p className="mb-3">

                                    🚚 Maximum Deliveries

                                </p>

                            </div>

                            <div className="col-md-6 text-end fw-bold">

                                {maxDeliveries}

                            </div>

                            <div className="col-md-6">

                                <p className="mb-3">

                                    ⏱ Estimated Duration

                                </p>

                            </div>

                            <div className="col-md-6 text-end fw-bold">

                                {duration} minutes

                            </div>

                            <div className="col-md-6">

                                <p className="mb-3">

                                    📅 Recommended Slots / Day

                                </p>

                            </div>

                            <div className="col-md-6 text-end fw-bold">

                                {slotsPerDay}

                            </div>

                            <div className="col-md-6">

                                <p className="mb-0">

                                    Status

                                </p>

                            </div>

                            <div className="col-md-6 text-end">

                                <span
                                    className={`badge ${
                                        duration > 0
                                            ? "bg-success"
                                            : "bg-warning text-dark"
                                    }`}
                                >

                                    {status}

                                </span>

                            </div>

                        </div>

                    </div>

                </div>

                <div className="alert alert-info mt-4 mb-0">

                    <strong>Scheduling Tips</strong>

                    <ul className="mb-0 mt-2">

                        <li>
                            Customers can only book available delivery slots.
                        </li>

                        <li>
                            Maximum deliveries control how many orders each driver receives.
                        </li>

                        <li>
                            Delivery duration is used to calculate available schedules.
                        </li>

                    </ul>

                </div>

            </div>

        </div>

    );

}