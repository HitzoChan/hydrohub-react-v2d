
export default function ConversationDetails({
  conversation,
  onClose,
  onViewMap,
  onViewOrder,
}) {

  if (!conversation) return null;

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

            {conversation.customerName
              ?.charAt(0)
              ?.toUpperCase()}

          </div>

          <div>

            <h5>{conversation.customerName}</h5>

            <small>
              Customer Information
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
                {conversation.customerName || "-"}
              </strong>

            </div>

            <div className="details-row">

              <span>Phone</span>

              <strong>
                {conversation.customerPhone || "-"}
              </strong>

            </div>

            <div className="details-row">

              <span>Email</span>

              <strong>
                {conversation.customerEmail || "-"}
              </strong>

            </div>

            <div className="details-row address">

              <span>Address</span>

              <strong>
                {conversation.customerAddress || "-"}
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
                {conversation.driverName || "Not Assigned"}
              </strong>

            </div>

            <div className="details-row">

              <span>Phone</span>

              <strong>
                {conversation.driverPhone || "-"}
              </strong>

            </div>

            <div className="details-row">

              <span>Status</span>

              <span
                className={`status-chip ${
                  conversation.driverStatus === "available"
                    ? "success"
                    : conversation.driverStatus === "busy"
                    ? "warning"
                    : "secondary"
                }`}
              >
                {conversation.driverStatus || "Unknown"}
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