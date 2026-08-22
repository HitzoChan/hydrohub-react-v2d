export default function DeliverySettings({ settings, setSettings }) {
  /*
  |--------------------------------------------------------------------------
  | Delivery Settings
  |--------------------------------------------------------------------------
  */

  const maxDeliveries = Math.max(
    0,
    Number(settings?.maxDeliveries) || 0
  );

  const duration = Math.max(
    0,
    Number(settings?.deliveryDuration) || 0
  );

  /*
  |--------------------------------------------------------------------------
  | Working Hours
  |--------------------------------------------------------------------------
  |
  | HydroHub currently uses an 8-hour working day.
  | 8 hours = 480 minutes.
  |
  */

  const WORKING_MINUTES_PER_DAY = 480;

  /*
  |--------------------------------------------------------------------------
  | Recommended Delivery Slots
  |--------------------------------------------------------------------------
  */

  const slotsPerDay =
    duration > 0
      ? Math.floor(
          WORKING_MINUTES_PER_DAY / duration
        )
      : 0;

  /*
  |--------------------------------------------------------------------------
  | Maximum Daily Delivery Capacity
  |--------------------------------------------------------------------------
  |
  | Example:
  |
  | 4 deliveries per slot
  | × 8 slots per day
  | = 32 deliveries per day
  |
  */

  const dailyCapacity =
    slotsPerDay * maxDeliveries;

  /*
  |--------------------------------------------------------------------------
  | Configuration Status
  |--------------------------------------------------------------------------
  */

  const isConfigured =
    maxDeliveries > 0 &&
    duration >= 15;

  const status = isConfigured
    ? "Ready"
    : "Needs Configuration";

  /*
  |--------------------------------------------------------------------------
  | Input Handlers
  |--------------------------------------------------------------------------
  */

  const handleMaxDeliveriesChange = (e) => {
    const value = e.target.value;

    setSettings((prev) => ({
      ...prev,
      maxDeliveries: value,
    }));
  };

  const handleDurationChange = (e) => {
    const value = e.target.value;

    setSettings((prev) => ({
      ...prev,
      deliveryDuration: value,
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="card shadow-sm border-0">

      <div className="card-body">

        {/* ================================================================
            HEADER
        ================================================================= */}

        <div className="mb-4">

          <h4 className="fw-bold mb-1">
            Delivery Rules
          </h4>

          <p className="text-muted mb-0">
            Configure how customer orders are scheduled and distributed
            into delivery slots.
          </p>

        </div>

        {/* ================================================================
            SETTINGS
        ================================================================= */}

        <div className="row">

          {/* --------------------------------------------------------------
              MAX DELIVERIES
          --------------------------------------------------------------- */}

          <div className="col-md-6 mb-4">

            <label
              htmlFor="maxDeliveries"
              className="form-label fw-semibold"
            >
              Max Deliveries per Slot
            </label>

            <input
              id="maxDeliveries"
              type="number"
              min="1"
              step="1"
              className="form-control form-control-lg"
              value={settings?.maxDeliveries ?? ""}
              onChange={handleMaxDeliveriesChange}
              placeholder="Example: 5"
            />

            <small className="text-muted">
              Maximum number of customer orders that can be assigned
              to one delivery slot.
            </small>

          </div>

          {/* --------------------------------------------------------------
              DELIVERY DURATION
          --------------------------------------------------------------- */}

          <div className="col-md-6 mb-4">

            <label
              htmlFor="deliveryDuration"
              className="form-label fw-semibold"
            >
              Delivery Duration
            </label>

            <div className="input-group input-group-lg">

              <input
                id="deliveryDuration"
                type="number"
                min="15"
                step="5"
                className="form-control"
                value={settings?.deliveryDuration ?? ""}
                onChange={handleDurationChange}
                placeholder="Example: 60"
              />

              <span className="input-group-text">
                minutes
              </span>

            </div>

            <small className="text-muted">
              Estimated time used to determine the available delivery
              slots during the working day.
            </small>

          </div>

        </div>

        <hr className="my-4" />

        {/* ================================================================
            DELIVERY SUMMARY
        ================================================================= */}

        <div className="card bg-light border-0">

          <div className="card-body">

            <div className="d-flex justify-content-between align-items-center mb-4">

              <div>

                <h5 className="fw-bold mb-1">
                  Delivery Summary
                </h5>

                <small className="text-muted">
                  Based on an 8-hour working day
                </small>

              </div>

              <span
                className={`badge ${
                  isConfigured
                    ? "bg-success"
                    : "bg-warning text-dark"
                }`}
              >
                {status}
              </span>

            </div>

            <div className="row">

              {/* ----------------------------------------------------------
                  MAX DELIVERIES
              ----------------------------------------------------------- */}

              <div className="col-md-6">

                <p className="mb-3">
                  🚚 Maximum Deliveries per Slot
                </p>

              </div>

              <div className="col-md-6 text-md-end fw-bold mb-3">

                {maxDeliveries}

              </div>

              {/* ----------------------------------------------------------
                  DURATION
              ----------------------------------------------------------- */}

              <div className="col-md-6">

                <p className="mb-3">
                  ⏱ Estimated Delivery Duration
                </p>

              </div>

              <div className="col-md-6 text-md-end fw-bold mb-3">

                {duration > 0
                  ? `${duration} minutes`
                  : "Not configured"}

              </div>

              {/* ----------------------------------------------------------
                  SLOTS PER DAY
              ----------------------------------------------------------- */}

              <div className="col-md-6">

                <p className="mb-3">
                  📅 Recommended Slots per Day
                </p>

              </div>

              <div className="col-md-6 text-md-end fw-bold mb-3">

                {slotsPerDay}

              </div>

              {/* ----------------------------------------------------------
                  DAILY CAPACITY
              ----------------------------------------------------------- */}

              <div className="col-md-6">

                <p className="mb-0">
                  📦 Maximum Daily Delivery Capacity
                </p>

              </div>

              <div className="col-md-6 text-md-end fw-bold">

                {dailyCapacity}

              </div>

            </div>

          </div>

        </div>

        {/* ================================================================
            CONFIGURATION WARNING
        ================================================================= */}

        {!isConfigured && (

          <div className="alert alert-warning mt-4 mb-0">

            <strong>
              Delivery scheduling needs configuration.
            </strong>

            <p className="mb-0 mt-2">

              Set the maximum number of deliveries per slot and a
              delivery duration of at least 15 minutes before using
              automatic delivery scheduling.

            </p>

          </div>

        )}

        {/* ================================================================
            SCHEDULING INFORMATION
        ================================================================= */}

        <div className="alert alert-info mt-4 mb-0">

          <strong>
            Scheduling Rules
          </strong>

          <ul className="mb-0 mt-2">

            <li>
              Customers can only select available delivery slots.
            </li>

            <li>
              Each delivery slot can contain up to{" "}
              <strong>
                {maxDeliveries}
              </strong>{" "}
              order{maxDeliveries === 1 ? "" : "s"}.
            </li>

            <li>
              Each slot is based on the configured delivery duration.
            </li>

            <li>
              The system currently calculates slots using an
              <strong> 8-hour working day</strong>.
            </li>

            <li>
              With the current settings, the estimated maximum
              daily capacity is{" "}
              <strong>
                {dailyCapacity}
              </strong>{" "}
              order{dailyCapacity === 1 ? "" : "s"}.
            </li>

          </ul>

        </div>

      </div>

    </div>
  );
}