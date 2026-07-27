
function getStatusBadge(status) {
  const styles = {
    pending: "bg-warning text-dark",
    assigned: "bg-info text-white",
    in_transit: "bg-primary",
    delivered: "bg-success",
    cancelled: "bg-danger",
  };

  const labels = {
    pending: "Pending",
    assigned: "Assigned",
    in_transit: "Transit",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };

  return (
    <span
      className={`badge rounded-pill ${
        styles[status] || "bg-secondary"
      }`}
      style={{
        minWidth: "90px",
        padding: "6px 12px",
      }}
    >
      {labels[status] || "Unknown"}
    </span>
  );
}

function shortOrder(order) {
  if (!order) return "-";
  return "#" + order.replace("ORD-", "").slice(-5);
}

function shortAddress(address) {
  if (!address) return "-";

  if (address.length <= 25) return address;

  return address.substring(0, 25) + "...";
}

function shortDate(date) {
  if (!date) return "Now";

  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function DeliveriesTable({
  deliveries,
  onAssign,
}) {

  if (!deliveries.length) {

    return (

      <div className="text-center py-5">

        <i
          className="bi bi-truck"
          style={{
            fontSize: "3rem",
            color: "#c7ccd3",
          }}
        ></i>

        <h5 className="mt-3">

          No Deliveries Found

        </h5>

      </div>

    );

  }

  return (

    <div className="table-responsive">

      <table className="table table-hover align-middle deliveries-table">

        <thead className="table-light">

          <tr>

            <th style={{width:"90px"}}>Order</th>

            <th style={{minWidth:"180px"}}>Customer</th>

            <th style={{minWidth:"260px"}}>Address</th>

            <th className="text-center" style={{width:"70px"}}>Gal</th>

            <th className="text-center" style={{width:"110px"}}>Status</th>

            <th style={{width:"170px"}}>Driver</th>

            <th style={{width:"90px"}}>Date</th>

            <th className="text-center" style={{width:"140px"}}>Action</th>

          </tr>

        </thead>

        <tbody>

          {deliveries.map((delivery)=>(

            <tr key={delivery.id}>

                              {/* ORDER */}
              <td>
                <span className="badge bg-light text-primary border fw-semibold">
                  {shortOrder(delivery.orderNumber)}
                </span>
              </td>

              {/* CUSTOMER */}
              <td>
                <div className="fw-semibold">
                  {delivery.customerName || "Unknown Customer"}
                </div>

                {delivery.phone && (
                  <small className="text-muted">
                    {delivery.phone}
                  </small>
                )}
              </td>

              {/* ADDRESS */}
              <td title={delivery.address}>
                {shortAddress(delivery.address)}
              </td>

              {/* GALLONS */}
              <td className="text-center fw-semibold">
                {delivery.containers ?? 0}
              </td>

              {/* STATUS */}
              <td className="text-center">
                {getStatusBadge(delivery.status)}
              </td>

              {/* DRIVER */}
              <td>

                {delivery.driver ? (

                  <>
                    <div className="fw-semibold">
                      {delivery.driver.name}
                    </div>

                    <small className="text-muted">
                      {delivery.driver.driver_status || "Assigned"}
                    </small>
                  </>

                ) : (

                  <span className="text-muted">
                    Unassigned
                  </span>

                )}

              </td>

              {/* DATE */}
              <td>
                {shortDate(delivery.scheduledAt)}
              </td>

                              {/* ACTION */}
              <td className="text-center">

                {delivery.status === "pending" && (

                  <button
                    className="btn btn-primary btn-sm px-3"
                    onClick={() => onAssign(delivery)}
                  >
                    <i className="bi bi-person-plus-fill me-1"></i>
                    Assign
                  </button>

                )}

                {delivery.status === "assigned" && (

                  <button
                    className="btn btn-outline-primary btn-sm px-3"
                    onClick={() => onAssign(delivery)}
                  >
                    <i className="bi bi-pencil-square me-1"></i>
                    Change
                  </button>

                )}

                {delivery.status === "in_transit" && (

                  <button
                    className="btn btn-outline-warning btn-sm px-3"
                    disabled
                  >
                    <i className="bi bi-truck me-1"></i>
                    Transit
                  </button>

                )}

                {delivery.status === "delivered" && (

                  <button
                    className="btn btn-outline-success btn-sm px-3"
                    disabled
                  >
                    <i className="bi bi-check-circle-fill me-1"></i>
                    Done
                  </button>

                )}

                {delivery.status === "cancelled" && (

                  <button
                    className="btn btn-outline-danger btn-sm px-3"
                    disabled
                  >
                    <i className="bi bi-x-circle-fill me-1"></i>
                    Cancelled
                  </button>

                )}

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  );

}

export default DeliveriesTable;