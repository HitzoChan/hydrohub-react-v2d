import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";

function RecentTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTransactions() {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .order("created_at", {
            ascending: false,
          });

        if (error) {
          throw error;
        }

        /*
        |--------------------------------------------------------------------------
        | Remove Rejected Orders
        |--------------------------------------------------------------------------
        | Orders with payment_status = "rejected"
        | should not appear in Recent Transactions.
        |--------------------------------------------------------------------------
        */

        const validTransactions = (data || [])
          .filter((order) => {
            const paymentStatus = String(
              order?.payment_status || ""
            )
              .trim()
              .toLowerCase();

            return paymentStatus !== "rejected";
          })
          .slice(0, 10);

        setTransactions(
          validTransactions
        );
      } catch (error) {
        console.error(
          "Unable to load transactions",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadTransactions();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Normalize Status
  |--------------------------------------------------------------------------
  */

  function normalizeStatus(status = "") {
    const value = String(status)
      .trim()
      .toLowerCase();

    switch (value) {
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

      case "delivered":
      case "completed":
        return "delivered";

      case "cancelled":
      case "canceled":
        return "cancelled";

      default:
        return value;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Status Badge
  |--------------------------------------------------------------------------
  */

  function getBadge(status) {
    const normalizedStatus =
      normalizeStatus(status);

    const badgeStyle = {
      fontSize: "11px",
      fontWeight: 500,
      padding: "6px 12px",
    };

    switch (normalizedStatus) {
      case "pending":
        return (
          <span
            className="badge rounded-pill bg-warning text-white"
            style={badgeStyle}
          >
            Pending
          </span>
        );

      case "assigned":
        return (
          <span
            className="badge rounded-pill bg-info text-white"
            style={badgeStyle}
          >
            Assigned
          </span>
        );

      case "on_the_way":
        return (
          <span
            className="badge rounded-pill bg-primary"
            style={badgeStyle}
          >
            In Transit
          </span>
        );

      case "delivered":
        return (
          <span
            className="badge rounded-pill bg-success"
            style={badgeStyle}
          >
            Delivered
          </span>
        );

      case "cancelled":
        return (
          <span
            className="badge rounded-pill bg-danger"
            style={badgeStyle}
          >
            Cancelled
          </span>
        );

      default:
        return (
          <span
            className="badge rounded-pill bg-secondary"
            style={badgeStyle}
          >
            {status || "Unknown"}
          </span>
        );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="card shadow-sm border-0">
        <div className="card-body py-4">

          <h5
            style={{
              fontSize: "22px",
              fontWeight: 600,
            }}
          >
            Recent Transactions
          </h5>

          <p className="text-muted mt-2 mb-0">
            Loading...
          </p>

        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="card shadow-sm border-0">

      <div className="card-body">

        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-3">

          <div>

            <h5
              style={{
                fontWeight: 600,
                fontSize: "22px",
                color: "#1f2937",
                marginBottom: "2px",
              }}
            >
              Recent Transactions
            </h5>

            <small
              className="text-muted"
              style={{
                fontSize: "12px",
              }}
            >
              Latest customer orders
            </small>

          </div>

          <small
            className="text-muted"
            style={{
              fontSize: "12px",
              fontWeight: 500,
            }}
          >
            Latest 10 orders
          </small>

        </div>

        {/* Table */}
        <div
          style={{
            maxHeight: "300px",
            overflowY: "auto",
          }}
        >

          <table className="table table-hover align-middle mb-0">

            <thead>

              <tr>

                <th
                  style={{
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#6b7280",
                    paddingBottom: "12px",
                  }}
                >
                  Customer
                </th>

                <th
                  style={{
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#6b7280",
                    paddingBottom: "12px",
                  }}
                >
                  Date
                </th>

                <th
                  style={{
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#6b7280",
                    paddingBottom: "12px",
                  }}
                >
                  Amount
                </th>

                <th
                  style={{
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#6b7280",
                    paddingBottom: "12px",
                  }}
                >
                  Status
                </th>

              </tr>

            </thead>

            <tbody>

              {transactions.length === 0 ? (

                <tr>

                  <td
                    colSpan="4"
                    className="text-center text-muted py-4"
                  >
                    No recent transactions.
                  </td>

                </tr>

              ) : (

                transactions.map(
                  (order) => (

                    <tr
                      key={order.id}
                    >

                      {/* Customer */}
                      <td
                        style={{
                          fontWeight: 500,
                          fontSize: "14px",
                          color: "#374151",
                          padding:
                            "14px 8px",
                        }}
                      >
                        {order.customer_name ||
                          "N/A"}
                      </td>

                      {/* Date */}
                      <td
                        className="text-muted"
                        style={{
                          fontSize: "13px",
                        }}
                      >
                        {order.created_at
                          ? new Date(
                              order.created_at
                            ).toLocaleDateString()
                          : "N/A"}
                      </td>

                      {/* Amount */}
                      <td
                        style={{
                          color: "#16a34a",
                          fontWeight: 600,
                          fontSize: "14px",
                        }}
                      >
                        ₱
                        {Number(
                          order.total_price ||
                            0
                        ).toLocaleString()}
                      </td>

                      {/* Status */}
                      <td>
                        {getBadge(
                          order.status
                        )}
                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}

export default RecentTransactions;