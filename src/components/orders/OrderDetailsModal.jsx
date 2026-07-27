function OrderDetailsModal({ order, onClose }) {
  if (!order) return null;

  return (
    <div
      className="modal fade show d-block"
      style={{
        background: "rgba(15,23,42,.45)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"
        style={{ maxWidth: "760px" }}
      >
        <div className="modal-content order-modal">

          {/* Header */}

          <div className="modal-header order-modal-header">

            <div>

              <h4 className="modal-title order-modal-title">
                Order Details
              </h4>

              <small className="text-muted">
                Review customer and order information
              </small>

            </div>

            <button
              className="btn-close"
              onClick={onClose}
            />

          </div>

          {/* Body */}

          <div className="modal-body order-modal-body">

            {/* Customer Information */}

            <div className="order-section">

              <h5 className="section-title">
                Customer Information
              </h5>

              <table className="table order-table">

                <tbody>

                  <tr>
                    <th width="220">Customer Name</th>
                    <td>{order.customer_name}</td>
                  </tr>

                  <tr>
                    <th>Phone Number</th>
                    <td>{order.phone || "-"}</td>
                  </tr>

                  <tr>
                    <th>Email Address</th>
                    <td>{order.email || "-"}</td>
                  </tr>

                  <tr>
                    <th>Complete Address</th>
                    <td>{order.address || "-"}</td>
                  </tr>

                </tbody>

              </table>

            </div>

            {/* Order Information */}

            <div className="order-section mt-4">

              <h5 className="section-title">
                Order Information
              </h5>

              <table className="table order-table">

                <tbody>

                  <tr>
                    <th width="220">Order ID</th>
                    <td>#{order.id}</td>
                  </tr>

                  <tr>
                    <th>Date Ordered</th>
                    <td>
                      {new Date(order.created_at).toLocaleString()}
                    </td>
                  </tr>

                  <tr>
                    <th>Gallons Ordered</th>
                    <td>{order.gallons}</td>
                  </tr>

                  <tr>
                    <th>Delivery Type</th>
                    <td>{order.delivery_type}</td>
                  </tr>

                  <tr>
                    <th>Exchange Type</th>
                    <td>{order.exchange_type}</td>
                  </tr>

                  <tr>
                    <th>Payment Method</th>
                    <td>{order.payment_method}</td>
                  </tr>

                  <tr>
                    <th>Payment Status</th>
                    <td>
                      <span className="badge bg-light text-dark border">
                        {order.payment_status}
                      </span>
                    </td>
                  </tr>

                  <tr>
                    <th>Order Status</th>
                    <td>
                      <span className="badge bg-primary">
                        {order.status}
                      </span>
                    </td>
                  </tr>

                  <tr className="total-row">

                    <th>Total Amount</th>

                    <td>

                      <span className="order-total">

                        ₱{Number(order.total_price).toLocaleString()}

                      </span>

                    </td>

                  </tr>

                </tbody>

              </table>

            </div>

            {/* Customer Notes */}

            {order.notes && (

              <div className="order-section mt-4">

                <h5 className="section-title">
                  Customer Notes
                </h5>

                <div className="order-notes">

                  {order.notes}

                </div>

              </div>

            )}

          </div>

          {/* Footer */}

          <div className="modal-footer order-modal-footer">

            <button
              className="btn btn-secondary px-4"
              onClick={onClose}
            >
              Close
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}

export default OrderDetailsModal;