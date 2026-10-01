
export default function ConversationDetails({
  conversation,
  onClose,
  onViewMap,
  onViewOrder,
}) {

  if (!conversation) return null;

  const customer = conversation.customer || {};
  const driver = conversation.driver || {};
  const customerName =
    customer.full_name || customer.name || conversation.customerName || "Customer";
  const driverName =
    driver.name || driver.full_name || conversation.driverName || "Not Assigned";
  const driverAddress = [
    driver.street,
    driver.barangay,
    driver.city,
    driver.province,
  ]
    .filter(Boolean)
    .join(", ");

  /* ======================================
      QUICK ACTION HELPERS
  ====================================== */

  const handleViewMap = () => {

    if (onViewMap) {

      onViewMap(conversation);

    } else {

      console.log("View Map:", conversation);

    }

  };

  const handleViewOrder = () => {

    if (onViewOrder) {

      onViewOrder(conversation);

    } else {

      console.log("View Order:", conversation);

    }

  };

  return (

    <aside className="conversation-drawer">

      {/* ==========================
          DRAWER HEADER
      ========================== */}

      <div className="drawer-header">

        <div className="drawer-title">

          <div className="drawer-avatar">

            {customerName
              ?.charAt(0)
              ?.toUpperCase()}

            {customer.avatar_url && (
              <img
                className="messaging-profile-image"
                src={customer.avatar_url}
                alt={`${customerName} profile`}
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            )}

          </div>

          <div>

              <h5>{customerName}</h5>

            <small>
                Customer and driver profiles
            </small>

          </div>

        </div>

        <button
          type="button"
          className="drawer-close-btn"
          onClick={onClose}
        >
          <i className="bi bi-x-lg"></i>
        </button>

      </div>

      {/* ==========================
          DRAWER BODY
      ========================== */}

      <div className="drawer-body">

        {/* ==========================
            CUSTOMER INFORMATION
        ========================== */}

        <div className="details-card">

          <div className="details-card-header">

            <div className="details-icon customer">

              <i className="bi bi-person-fill"></i>

              {customer.avatar_url && (
                <img
                  className="messaging-profile-image"
                  src={customer.avatar_url}
                  alt={`${customerName} profile`}
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              )}

            </div>

            <div>

              <h6>Customer</h6>

              <small>
                Customer Information
              </small>

            </div>

          </div>

          <div className="details-content">

            <div className="details-row">

              <span>Name</span>

                <strong>
                  {customerName}
                </strong>

            </div>

            <div className="details-row">

              <span>Phone</span>

                <strong>
                  {customer.phone || customer.contact_number || conversation.customerPhone || "-"}
                </strong>

            </div>

            <div className="details-row">

              <span>Email</span>

                <strong>
                  {customer.email || conversation.customerEmail || "-"}
                </strong>

            </div>

            <div className="details-row address">

              <span>Address</span>

                <strong>
                  {customer.address || customer.complete_address || conversation.customerAddress || "-"}
                </strong>

            </div>

          </div>

        </div>

        {/* ==========================
            DRIVER INFORMATION
        ========================== */}

        <div className="details-card">

          <div className="details-card-header">

            <div className="details-icon driver">

              <i className="bi bi-truck"></i>

              {driver.profile_image_url && (
                <img
                  className="messaging-profile-image"
                  src={driver.profile_image_url}
                  alt={`${driverName} profile`}
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              )}

            </div>

            <div>

              <h6>Driver</h6>

              <small>
                Assigned Delivery Personnel
              </small>

            </div>

          </div>

          <div className="details-content">

            <div className="details-row">

              <span>Name</span>

                <strong>
                  {driverName}
                </strong>

            </div>

            <div className="details-row">

              <span>Employee ID</span>

              <strong>{driver.employee_id || "-"}</strong>

            </div>

            <div className="details-row">

              <span>Role</span>

              <strong>{driver.role || "Driver"}</strong>

            </div>

            <div className="details-row">

              <span>Phone</span>

                <strong>
                  {driver.phone || driver.contact_number || conversation.driverPhone || "-"}
                </strong>

            </div>

            <div className="details-row">

              <span>Email</span>

              <strong>{driver.email || "-"}</strong>

            </div>

            <div className="details-row address">

              <span>Address</span>

              <strong>{driverAddress || "-"}</strong>

            </div>

            <div className="details-row">

              <span>Status</span>

              <span
                className={`status-chip ${
                  (driver.driver_status || driver.status || conversation.driverStatus) === "available"
                    ? "success"
                    : (driver.driver_status || driver.status || conversation.driverStatus) === "busy"
                    ? "warning"
                    : "secondary"
                }`}
              >
                {driver.driver_status || driver.status || conversation.driverStatus || "Unknown"}
              </span>

            </div>

          </div>

        </div>
        {/* ==========================
            ORDER INFORMATION
        ========================== */}

        <div className="details-card">

          <div className="details-card-header">

            <div className="details-icon order">

              <i className="bi bi-box-seam-fill"></i>

            </div>

            <div>

              <h6>Order</h6>

              <small>
                Delivery Information
              </small>

            </div>

          </div>

          <div className="details-content">

            <div className="details-row">

              <span>Order ID</span>

              <strong>
                {conversation.order?.id || "-"}
              </strong>

            </div>

            <div className="details-row">

              <span>Status</span>

              <span
                className={`status-chip ${
                  conversation.orderStatus === "completed"
                    ? "success"
                    : conversation.orderStatus === "assigned"
                    ? "primary"
                    : conversation.orderStatus === "pending"
                    ? "warning"
                    : "secondary"
                }`}
              >
                {conversation.orderStatus || "Unknown"}
              </span>

            </div>

          </div>

        </div>

{/* ==========================
    QUICK ACTIONS
========================== */}

<div className="details-card">

  <div className="details-card-header">

    <div className="details-icon action">
      <i className="bi bi-lightning-fill"></i>
    </div>

    <div>

      <h6>Quick Actions</h6>

      <small>
        Delivery Shortcuts
      </small>

    </div>

  </div>

  <div className="quick-actions">

    <button
      type="button"
      className="btn btn-outline-primary"
      onClick={handleViewMap}
    >
      <i className="bi bi-geo-alt me-2"></i>
      View Map
    </button>

    <button
      type="button"
      className="btn btn-primary"
      onClick={handleViewOrder}
    >
      <i className="bi bi-box-seam me-2"></i>
      View Order
    </button>

  </div>

</div>

      </div>

    </aside>

  );

}