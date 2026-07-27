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
          .order("created_at", { ascending: false })
          .limit(10);

        if (error) throw error;

        setTransactions(data ?? []);
      } catch (error) {
        console.error("Unable to load transactions", error);
      } finally {
        setLoading(false);
      }
    }

    loadTransactions();
  }, []);

  function getBadge(status) {
    const badgeStyle = {
      fontSize: "11px",
      fontWeight: 500,
      padding: "6px 12px",
    };

    switch (status) {
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
      case "completed":
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
            {status}
          </span>
        );
    }
  }

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

  return (
    <div className="card shadow-sm border-0">

      <div className="card-body">

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

                transactions.map((order) => (

                  <tr key={order.id}>

                    <td
                      style={{
                        fontWeight: 500,
                        fontSize: "14px",
                        color: "#374151",
                        padding: "14px 8px",
                      }}
                    >
                      {order.customer_name || "N/A"}
                    </td>

                    <td
                      className="text-muted"
                      style={{
                        fontSize: "13px",
                      }}
                    >
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>

                    <td
                      style={{
                        color: "#16a34a",
                        fontWeight: 600,
                        fontSize: "14px",
                      }}
                    >
                      ₱{Number(order.total_price || 0).toLocaleString()}
                    </td>

                    <td>
                      {getBadge(order.status)}
                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}

export default RecentTransactions;