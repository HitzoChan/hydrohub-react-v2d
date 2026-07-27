import OrderActions from "./OrderActions";

function OrdersTable({
  orders,
  onView,
}) {
  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <span className="badge rounded-pill bg-warning text-dark">
            Pending
          </span>
        );

      case "assigned":
        return (
          <span className="badge rounded-pill bg-info">
            Assigned
          </span>
        );

      case "on_the_way":
        return (
          <span className="badge rounded-pill bg-primary">
            On the Way
          </span>
        );

      case "delivered":
        return (
          <span className="badge rounded-pill bg-success">
            Delivered
          </span>
        );

      case "cancelled":
        return (
          <span className="badge rounded-pill bg-danger">
            Cancelled
          </span>
        );

      default:
        return (
          <span className="badge rounded-pill bg-secondary">
            Unknown
          </span>
        );
    }
  };

  const shortOrderId = (id) => {
    if (!id) return "N/A";
    return `ORD-${String(id).slice(-4).toUpperCase()}`;
  };

  const formatDeliveryType = (type) => {
    switch (type) {
      case "scheduled":
        return "Scheduled";
      case "now":
        return "Deliver Now";
      default:
        return "N/A";
    }
  };

  const formatAmount = (amount) => {
    return `₱${Number(amount || 0).toLocaleString()}`;
  };

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div
      className="table-responsive"
      style={{ maxHeight: "600px" }}
    >
      <table className="table table-hover align-middle">

        <thead className="table-light">

          <tr>

            <th>Order ID</th>

            <th>Customer</th>

            <th>Gallons</th>

            <th>Total</th>

            <th>Delivery Type</th>

            <th>Status</th>

            <th>Created</th>

            <th className="text-center" width="140">
              Actions
            </th>

          </tr>

        </thead>

        <tbody>

          {orders.length === 0 ? (
            <tr>
              <td
                colSpan="8"
                className="text-center py-5 text-muted"
              >
                No orders found.
              </td>
            </tr>
          ) : (
            orders.map((order) => (
              <tr key={order.id}>

                <td>
                  <span className="badge bg-light text-primary border">
                    {shortOrderId(order.id)}
                  </span>
                </td>

                <td>
                  <div className="fw-semibold">
                    {order.customer_name || "Unknown Customer"}
                  </div>

                  {order.phone && (
                    <small className="text-muted">
                      {order.phone}
                    </small>
                  )}
                </td>

                <td>
                  {order.gallons ?? 0}
                </td>

                <td className="fw-semibold text-success">
                  {formatAmount(order.total_price)}
                </td>

                <td>
                  {formatDeliveryType(order.delivery_type)}
                </td>

                <td>
                  {getStatusBadge(order.status)}
                </td>

                <td>
                  {formatDate(order.created_at)}
                </td>

                <td className="text-center">

                  <OrderActions
                    order={order}
                    onView={onView}
                  />

                </td>

              </tr>
            ))
          )}

        </tbody>

      </table>
    </div>
  );
}

export default OrdersTable;