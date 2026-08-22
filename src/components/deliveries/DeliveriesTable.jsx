/**
 * Normalize delivery status
 *
 * This makes the table compatible with different
 * status values that may come from Supabase.
 */
function normalizeStatus(status) {
  if (!status) return "unknown";

  const value = String(status)
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  switch (value) {
    case "pending":
      return "pending";

    case "assigned":
      return "assigned";

    case "in_transit":
    case "intransit":
    case "on_the_way":
    case "on_the_way_to_customer":
      return "in_transit";

    case "delivered":
    case "completed":
      return "delivered";

    case "cancelled":
    case "canceled":
      return "cancelled";

    case "rejected":
    case "declined":
    case "denied":
      return "rejected";

    default:
      return value;
  }
}


/**
 * Status Badge
 */
function getStatusBadge(status) {
  const normalizedStatus = normalizeStatus(status);

  const styles = {
    pending: "bg-warning text-dark",
    assigned: "bg-info text-white",
    in_transit: "bg-primary",
    delivered: "bg-success",
    cancelled: "bg-danger",
    rejected: "bg-danger",
    unknown: "bg-secondary",
  };

  const labels = {
    pending: "Pending",
    assigned: "Assigned",
    in_transit: "In Transit",
    delivered: "Delivered",
    cancelled: "Cancelled",
    rejected: "Rejected",
    unknown: "Unknown",
  };

  const icons = {
    pending: "bi-hourglass-split",
    assigned: "bi-person-check-fill",
    in_transit: "bi-truck",
    delivered: "bi-check-circle-fill",
    cancelled: "bi-x-circle-fill",
    rejected: "bi-slash-circle-fill",
    unknown: "bi-question-circle",
  };

  return (
    <span
      className={`badge rounded-pill ${
        styles[normalizedStatus] || styles.unknown
      }`}
      style={{
        minWidth: "90px",
        padding: "6px 12px",
        fontWeight: 600,
      }}
    >
      <i
        className={`bi ${icons[normalizedStatus] || icons.unknown} me-1`}
      ></i>

      {labels[normalizedStatus] || "Unknown"}
    </span>
  );
}


/**
 * Short Order Number
 */
function shortOrder(order) {
  if (!order) return "-";

  const orderString = String(order);

  return (
    "#" +
    orderString
      .replace("ORD-", "")
      .slice(-5)
  );
}


/**
 * Short Address
 */
function shortAddress(address) {
  if (!address) return "-";

  const value = String(address);

  if (value.length <= 25) {
    return value;
  }

  return value.substring(0, 25) + "...";
}


/**
 * Short Date
 */
function shortDate(date) {
  if (!date) return "Now";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Now";
  }

  return parsedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}


/**
 * Delivery Table
 */
function DeliveriesTable({
  deliveries = [],
  onAssign,
}) {

  /**
   * Make sure we always have an array.
   */
  const deliveryList = Array.isArray(deliveries)
    ? deliveries
    : [];


  /**
   * Empty state
   */
  if (!deliveryList.length) {

    return (
      <div className="text-center py-5">

        <i
          className="bi bi-truck"
          style={{
            fontSize: "3rem",
            color: "#c7ccd3",
          }}
        ></i>

        <h5 className="mt-3 mb-2">
          No Deliveries Found
        </h5>

        <p className="text-muted mb-0">
          There are currently no delivery records to display.
        </p>

      </div>
    );
  }


  return (

    <div className="table-responsive">

      <table className="table table-hover align-middle deliveries-table">

        <thead className="table-light">

          <tr>

            <th style={{ width: "90px" }}>
              Order
            </th>

            <th style={{ minWidth: "180px" }}>
              Customer
            </th>

            <th style={{ minWidth: "260px" }}>
              Address
            </th>

            <th
              className="text-center"
              style={{ width: "70px" }}
            >
              Gal
            </th>

            <th
              className="text-center"
              style={{ width: "120px" }}
            >
              Status
            </th>

            <th style={{ width: "170px" }}>
              Driver
            </th>

            <th style={{ width: "90px" }}>
              Date
            </th>

            <th
              className="text-center"
              style={{ width: "140px" }}
            >
              Action
            </th>

          </tr>

        </thead>


        <tbody>

          {deliveryList.map((delivery) => {

            const status = normalizeStatus(
              delivery.status
            );

            return (

              <tr key={delivery.id}>

                {/* =========================
                    ORDER
                ========================== */}

                <td>

                  <span
                    className="badge bg-light text-primary border fw-semibold"
                  >
                    {shortOrder(
                      delivery.orderNumber ||
                      delivery.order_id ||
                      delivery.orderId
                    )}
                  </span>

                </td>


                {/* =========================
                    CUSTOMER
                ========================== */}

                <td>

                  <div className="fw-semibold">
                    {delivery.customerName ||
                      delivery.customer_name ||
                      "Unknown Customer"}
                  </div>

                  {delivery.phone && (
                    <small className="text-muted">
                      {delivery.phone}
                    </small>
                  )}

                </td>


                {/* =========================
                    ADDRESS
                ========================== */}

                <td
                  title={
                    delivery.address ||
                    "No address provided"
                  }
                >
                  {shortAddress(
                    delivery.address
                  )}
                </td>


                {/* =========================
                    GALLONS
                ========================== */}

                <td className="text-center fw-semibold">

                  {delivery.containers ??
                    delivery.gallons ??
                    delivery.quantity ??
                    0}

                </td>


                {/* =========================
                    STATUS
                ========================== */}

                <td className="text-center">

                  {getStatusBadge(
                    delivery.status
                  )}

                </td>


                {/* =========================
                    DRIVER
                ========================== */}

                <td>

                  {delivery.driver ? (

                    <>

                      <div className="fw-semibold">
                        {delivery.driver.name}
                      </div>

                      <small className="text-muted">
                        {delivery.driver.driver_status ||
                          "Assigned"}
                      </small>

                    </>

                  ) : (

                    <span className="text-muted">
                      Unassigned
                    </span>

                  )}

                </td>


                {/* =========================
                    DATE
                ========================== */}

                <td>

                  {shortDate(
                    delivery.scheduledAt ||
                    delivery.scheduled_at ||
                    delivery.created_at
                  )}

                </td>


                {/* =========================
                    ACTION
                ========================== */}

                <td className="text-center">


                  {/* PENDING */}

                  {status === "pending" && (

                    <button
                      className="btn btn-primary btn-sm px-3"
                      onClick={() =>
                        onAssign(delivery)
                      }
                    >
                      <i className="bi bi-person-plus-fill me-1"></i>

                      Assign
                    </button>

                  )}


                  {/* ASSIGNED */}

                  {status === "assigned" && (

                    <button
                      className="btn btn-outline-primary btn-sm px-3"
                      onClick={() =>
                        onAssign(delivery)
                      }
                    >
                      <i className="bi bi-pencil-square me-1"></i>

                      Change
                    </button>

                  )}


                  {/* IN TRANSIT */}

                  {status === "in_transit" && (

                    <button
                      className="btn btn-outline-warning btn-sm px-3"
                      disabled
                    >
                      <i className="bi bi-truck me-1"></i>

                      Transit
                    </button>

                  )}


                  {/* DELIVERED */}

                  {status === "delivered" && (

                    <button
                      className="btn btn-outline-success btn-sm px-3"
                      disabled
                    >
                      <i className="bi bi-check-circle-fill me-1"></i>

                      Done
                    </button>

                  )}


                  {/* CANCELLED */}

                  {status === "cancelled" && (

                    <button
                      className="btn btn-outline-danger btn-sm px-3"
                      disabled
                    >
                      <i className="bi bi-x-circle-fill me-1"></i>

                      Cancelled
                    </button>

                  )}


                  {/* REJECTED */}

                  {status === "rejected" && (

                    <button
                      className="btn btn-outline-danger btn-sm px-3"
                      disabled
                      title="This order was rejected and cannot be assigned."
                    >
                      <i className="bi bi-slash-circle-fill me-1"></i>

                      Rejected
                    </button>

                  )}


                  {/* UNKNOWN */}

                  {status === "unknown" && (

                    <button
                      className="btn btn-outline-secondary btn-sm px-3"
                      disabled
                    >
                      <i className="bi bi-question-circle me-1"></i>

                      Unknown
                    </button>

                  )}

                </td>

              </tr>

            );

          })}

        </tbody>

      </table>

    </div>

  );
}


export default DeliveriesTable;