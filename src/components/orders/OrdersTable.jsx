import OrderActions from "./OrderActions";

function OrdersTable({
  orders = [],
  onView,
}) {
  /*
  |--------------------------------------------------------------------------
  | Get Order Status
  |--------------------------------------------------------------------------
  |
  | Rejected GCash payments are handled separately from the normal
  | delivery/order status.
  |
  | If payment_status === "rejected", the order will ALWAYS display
  | "Rejected" instead of "Unknown", "Pending", or "Cancelled".
  |
  */

  const getDisplayStatus = (order) => {
    const paymentStatus = String(
      order?.payment_status || ""
    )
      .toLowerCase()
      .trim();

    const orderStatus = String(
      order?.status || ""
    )
      .toLowerCase()
      .trim();

    /*
     * IMPORTANT:
     * Payment rejection has priority.
     */
    if (
      paymentStatus === "rejected" ||
      paymentStatus === "declined"
    ) {
      return "rejected";
    }

    /*
     * Normal order status
     */
    switch (orderStatus) {
      case "pending":
        return "pending";

      case "assigned":
        return "assigned";

      case "on_the_way":
      case "on the way":
      case "in_transit":
      case "in transit":
      case "in_progress":
      case "in progress":
        return "on_the_way";

      case "completed":
      case "delivered":
        return "delivered";

      case "cancelled":
      case "canceled":
        return "cancelled";

      case "ready":
      case "ready_for_delivery":
      case "ready for delivery":
        return "assigned";

      case "rejected":
        return "rejected";

      default:
        return "unknown";
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Status Badge
  |--------------------------------------------------------------------------
  */

  const getStatusBadge = (order) => {
    const status = getDisplayStatus(order);

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

      case "rejected":
        return (
          <span className="badge rounded-pill bg-danger">
            Rejected
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

  /*
  |--------------------------------------------------------------------------
  | Short Order ID
  |--------------------------------------------------------------------------
  */

  const shortOrderId = (id) => {
    if (!id) return "N/A";

    return `ORD-${String(id)
      .slice(-4)
      .toUpperCase()}`;
  };

  /*
  |--------------------------------------------------------------------------
  | Delivery Type
  |--------------------------------------------------------------------------
  */

  const formatDeliveryType = (type) => {
    const deliveryType = String(type || "")
      .toLowerCase()
      .trim();

    switch (deliveryType) {
      case "scheduled":
        return "Scheduled";

      case "now":
        return "Deliver Now";

      default:
        return "N/A";
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Amount
  |--------------------------------------------------------------------------
  */

  const formatAmount = (amount) => {
    return `₱${Number(amount || 0).toLocaleString("en-PH")}`;
  };

  /*
  |--------------------------------------------------------------------------
  | Date
  |--------------------------------------------------------------------------
  */

  const formatDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

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

            <th
              className="text-center"
              width="140"
            >
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
            orders.map((order) => {

              /*
               * Calculate the display status here so we can also
               * use it for debugging if necessary.
               */
              const displayStatus = getDisplayStatus(order);

              return (
                <tr key={order.id}>

                  {/* ORDER ID */}
                  <td>
                    <span className="badge bg-light text-primary border">
                      {shortOrderId(order.id)}
                    </span>
                  </td>

                  {/* CUSTOMER */}
                  <td>
                    <div className="fw-semibold">
                      {order.customer_name ||
                        "Unknown Customer"}
                    </div>

                    {order.phone && (
                      <small className="text-muted">
                        {order.phone}
                      </small>
                    )}
                  </td>

                  {/* GALLONS */}
                  <td>
                    {order.gallons ?? 0}
                  </td>

                  {/* TOTAL */}
                  <td className="fw-semibold text-success">
                    {formatAmount(order.total_price)}
                  </td>

                  {/* DELIVERY TYPE */}
                  <td>
                    {formatDeliveryType(
                      order.delivery_type
                    )}
                  </td>

                  {/* STATUS */}
                  <td>
                    {getStatusBadge(order)}
                  </td>

                  {/* CREATED */}
                  <td>
                    {formatDate(order.created_at)}
                  </td>

                  {/* ACTIONS */}
                  <td className="text-center">

                    <OrderActions
                      order={{
                        ...order,
                        status: displayStatus,
                      }}
                      onView={onView}
                    />

                  </td>

                </tr>
              );
            })
          )}

        </tbody>

      </table>
    </div>
  );
}

export default OrdersTable;