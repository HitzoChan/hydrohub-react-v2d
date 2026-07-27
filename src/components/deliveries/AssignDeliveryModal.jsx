import { useState } from "react";

function AssignDeliveryModal({
  show,
  onClose,
  delivery,
  drivers,
  onAssign,
}) {

  const [selectedDriver, setSelectedDriver] =
    useState("");

  if (!show || !delivery) return null;

  const currentDriver =
    selectedDriver !== ""
      ? selectedDriver
      : delivery.driver?.id ?? "";

  const handleSubmit = () => {

    if (!currentDriver) {
      alert("Please select a driver.");
      return;
    }

    onAssign(currentDriver);

    setSelectedDriver("");

  };

  const handleClose = () => {

    setSelectedDriver("");

    onClose();

  };

  return (
    <>

      {/* Backdrop */}

      <div
        className="modal-backdrop fade show"
        onClick={handleClose}
      ></div>

      {/* Modal */}

      <div
        className="modal fade show d-block"
        tabIndex="-1"
      >

        <div className="modal-dialog modal-xl modal-dialog-centered">

          <div className="modal-content shadow-lg border-0">

            {/* Header */}

            <div className="modal-header">

              <div>

                <h4 className="modal-title mb-1">

                  <i className="bi bi-truck me-2 text-primary"></i>

                  Assign Delivery Driver

                </h4>

                <small className="text-muted">

                  Select the most appropriate delivery personnel.

                </small>

              </div>

              <button
                className="btn-close"
                onClick={handleClose}
              ></button>

            </div>

            {/* Body */}

            <div className="modal-body">

              <div className="row">

                {/* LEFT SIDE */}

                <div className="col-lg-6">

                  {/* Customer */}

                  <div className="card border-0 bg-light mb-4">

                    <div className="card-body">

                      <h5 className="fw-bold mb-3">

                        <i className="bi bi-person-circle me-2"></i>

                        Customer Information

                      </h5>

                      <div className="mb-3">

                        <small className="text-muted">
                          Customer Name
                        </small>

                        <div className="fw-semibold fs-6">
                          {delivery.customerName}
                        </div>

                      </div>

                      <div className="mb-3">

                        <small className="text-muted">
                          Contact Number
                        </small>

                        <div>
                          {delivery.phone || "Not Available"}
                        </div>

                      </div>

                      <div>

                        <small className="text-muted">
                          Delivery Address
                        </small>

                        <div>
                          {delivery.address}
                        </div>

                      </div>

                    </div>

                  </div>

                  {/* Delivery */}

                  <div className="card border-0 bg-light">

                    <div className="card-body">

                      <h5 className="fw-bold mb-3">

                        <i className="bi bi-box-seam me-2"></i>

                        Delivery Details

                      </h5>

                      <div className="row">

                        <div className="col-6 mb-3">

                          <small className="text-muted">
                            Order Number
                          </small>

                          <div className="fw-semibold">
                            {delivery.orderNumber}
                          </div>

                        </div>

                        <div className="col-6 mb-3">

                          <small className="text-muted">
                            Gallons
                          </small>

                          <div className="fw-semibold">
                            {delivery.containers}
                          </div>

                        </div>

                        <div className="col-6 mb-3">

                          <small className="text-muted">
                            Delivery Type
                          </small>

                          <div>
                            {delivery.deliveryType}
                          </div>

                        </div>

                        <div className="col-6 mb-3">

                          <small className="text-muted">
                            Status
                          </small>

                          <div className="text-capitalize">
                            {delivery.status.replaceAll("_"," ")}
                          </div>

                        </div>

                        <div className="col-12">

                          <small className="text-muted">
                            Schedule
                          </small>

                          <div>

                            {delivery.scheduledAt
                              ? new Date(
                                  delivery.scheduledAt
                                ).toLocaleString()
                              : "Deliver Immediately"}

                          </div>

                        </div>

                      </div>

                    </div>

                  </div>

                </div>

                {/* RIGHT SIDE */}

                <div className="col-lg-6">

                                   <div className="card border-0 shadow-sm">

                    <div className="card-body">

                      <h5 className="fw-bold mb-3">

                        <i className="bi bi-person-badge me-2"></i>

                        Driver Assignment

                      </h5>

                      {delivery.driver && (

                        <div className="alert alert-info mb-4">

                          <div className="fw-semibold">

                            Current Driver

                          </div>

                          <div className="mt-2">

                            <strong>
                              {delivery.driver.name}
                            </strong>

                          </div>

                          <small className="text-muted">

                            {delivery.driver.phone || "No Contact Number"}

                          </small>

                        </div>

                      )}

                      <div className="mb-3">

                        <label className="form-label fw-semibold">

                          Select Driver

                        </label>

                        <select
                          className="form-select"
                          value={currentDriver}
                          onChange={(e) =>
                            setSelectedDriver(e.target.value)
                          }
                        >

                          <option value="">
                            -- Select Driver --
                          </option>

                          {drivers
                            .filter(
                            (driver) =>
                                driver.driver_status === "online"
                            )   
                          .map((driver) => (

                            <option
                              key={driver.id}
                              value={driver.id}
                            >

                              {driver.name}

                              {driver.driver_status
                                ? ` (${driver.driver_status})`
                                : ""}

                            </option>

                          ))}

                        </select>

                      </div>

                      {drivers.length > 0 && (

                        <div
                          className="border rounded p-3"
                          style={{
                            maxHeight: "320px",
                            overflowY: "auto",
                          }}
                        >

                          {drivers.map((driver) => (

                            <div
                              key={driver.id}
                              className="d-flex justify-content-between align-items-center border-bottom py-3"
                            >

                              <div>

                                <div className="fw-semibold">

                                  {driver.name}

                                </div>

                                <small className="text-muted">

                                  {driver.phone || "No Contact Number"}

                                </small>

                              </div>

                              <div className="text-end">

                                <span
                                  className={`badge ${
                                    driver.driver_status === "online"
                                      ? "bg-success"
                                      : driver.driver_status === "busy"
                                      ? "bg-warning text-dark"
                                      : "bg-secondary"
                                  }`}
                                >

                                  {driver.driver_status || "Offline"}

                                </span>

                              </div>

                            </div>

                          ))}

                        </div>

                      )}

                      {drivers.length === 0 && (

                        <div className="alert alert-warning">

                          No delivery personnel available.

                        </div>

                      )}

                    </div>

                  </div>

                </div>

              </div>

            </div>

            <div className="modal-footer">

              <button
                className="btn btn-light border"
                onClick={handleClose}
              >

                Cancel

              </button>

              <button
                className="btn btn-primary"
                onClick={handleSubmit}
              >

                <i className="bi bi-check-circle me-2"></i>

                Assign Driver

              </button>

            </div>

          </div>

        </div>

      </div>

    </>

  );
}

export default AssignDeliveryModal;               