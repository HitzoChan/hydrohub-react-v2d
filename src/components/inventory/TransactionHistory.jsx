import React from "react";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function formatDate(dateValue) {
  if (!dateValue) {
    return "—";
  }

  const date =
    new Date(dateValue);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleString(
    [],
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  );
}

/*
|--------------------------------------------------------------------------
| Movement Badge
|--------------------------------------------------------------------------
*/

function MovementBadge({
  movement,
}) {
  const value =
    String(
      movement || ""
    ).toLowerCase();

  if (
    value === "delivered"
  ) {
    return (
      <span className="badge rounded-pill bg-primary-subtle text-primary border border-primary-subtle">
        <i className="bi bi-box-seam me-1" />
        Delivered
      </span>
    );
  }

  if (
    value === "returned"
  ) {
    return (
      <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle">
        <i className="bi bi-arrow-return-left me-1" />
        Returned
      </span>
    );
  }

  if (
    value === "assigned"
  ) {
    return (
      <span className="badge rounded-pill bg-info-subtle text-info-emphasis border border-info-subtle">
        <i className="bi bi-truck me-1" />
        Assigned
      </span>
    );
  }

  if (
    value === "damaged"
  ) {
    return (
      <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis border border-warning-subtle">
        <i className="bi bi-exclamation-triangle me-1" />
        Damaged
      </span>
    );
  }

  if (
    value === "missing"
  ) {
    return (
      <span className="badge rounded-pill bg-danger-subtle text-danger border border-danger-subtle">
        <i className="bi bi-question-circle me-1" />
        Missing
      </span>
    );
  }

  return (
    <span className="badge rounded-pill bg-light text-dark border">
      {movement || "—"}
    </span>
  );
}

/*
|--------------------------------------------------------------------------
| Result Badge
|--------------------------------------------------------------------------
*/

function ResultBadge({
  result,
}) {
  const value =
    String(
      result || ""
    ).toLowerCase();

  if (
    value ===
    "with customer"
  ) {
    return (
      <span className="badge rounded-pill bg-primary-subtle text-primary border border-primary-subtle">
        Sold to Customers
      </span>
    );
  }

  if (
    value === "recovered"
  ) {
    return (
      <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle">
        Recovered
      </span>
    );
  }

  if (
    value ===
    "waiting for refill"
  ) {
    return (
      <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis border border-warning-subtle">
        Waiting for Refill
      </span>
    );
  }

  if (
    value === "with driver"
  ) {
    return (
      <span className="badge rounded-pill bg-info-subtle text-info-emphasis border border-info-subtle">
        With Driver
      </span>
    );
  }

  if (
    value === "damaged"
  ) {
    return (
      <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis border border-warning-subtle">
        Damaged
      </span>
    );
  }

  if (
    value === "missing"
  ) {
    return (
      <span className="badge rounded-pill bg-danger-subtle text-danger border border-danger-subtle">
        Missing
      </span>
    );
  }

  return (
    <span className="badge rounded-pill bg-light text-dark border">
      {result || "—"}
    </span>
  );
}

/*
|--------------------------------------------------------------------------
| Purpose
|--------------------------------------------------------------------------
*/

function PurposeBadge({
  purpose,
}) {
  const value =
    String(
      purpose || ""
    ).toLowerCase();

  if (
    value === "exchange"
  ) {
    return (
      <span className="badge bg-light text-dark border">
        Exchange
      </span>
    );
  }

  if (
    value ===
    "new containers"
  ) {
    return (
      <span className="badge bg-light text-dark border">
        New Containers
      </span>
    );
  }

  if (
    value ===
    "empty return"
  ) {
    return (
      <span className="badge bg-light text-dark border">
        Empty Return
      </span>
    );
  }

  if (
    value ===
    "return issue"
  ) {
    return (
      <span className="badge bg-light text-dark border">
        Return Issue
      </span>
    );
  }

  return (
    <span className="badge bg-light text-dark border">
      {purpose || "—"}
    </span>
  );
}

/*
|--------------------------------------------------------------------------
| MAIN COMPONENT
|--------------------------------------------------------------------------
*/

function TransactionHistory({
  transactions = [],
}) {
  const rows =
    Array.isArray(
      transactions
    )
      ? transactions
      : [];

  /*
  |--------------------------------------------------------------------------
  | Summary
  |--------------------------------------------------------------------------
  */

  const totalDelivered =
    rows
      .filter(
        (row) =>
          row.movement ===
          "Delivered"
      )
      .reduce(
        (sum, row) =>
          sum +
          Number(
            row.quantity || 0
          ),
        0
      );

  const totalReturned =
    rows
      .filter(
        (row) =>
          row.movement ===
          "Returned"
      )
      .reduce(
        (sum, row) =>
          sum +
          Number(
            row.quantity || 0
          ),
        0
      );

  const totalDamaged =
    rows
      .filter(
        (row) =>
          row.movement ===
          "Damaged"
      )
      .reduce(
        (sum, row) =>
          sum +
          Number(
            row.quantity || 0
          ),
        0
      );

  const totalMissing =
    rows
      .filter(
        (row) =>
          row.movement ===
          "Missing"
      )
      .reduce(
        (sum, row) =>
          sum +
          Number(
            row.quantity || 0
          ),
        0
      );

  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-body p-4">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
          <div>
            <h5 className="fw-bold mb-1">
              Transaction History
            </h5>

            <p className="text-muted mb-0">
              Record of container
              deliveries, returns,
              and container issues.
            </p>
          </div>

          <span className="badge bg-light text-dark border px-3 py-2">
            {rows.length} Records
          </span>
        </div>

        {/* =================================================
            QUICK SUMMARY
        ================================================= */}

        <div className="row g-3 mb-4 inventory-transaction-stats">
          {/* DELIVERED */}

          <div className="col-6 col-md-3 inventory-transaction-stat-col">
            <div className="inventory-transaction-stat border rounded-3 p-3 h-100">
              <div className="small text-muted mb-1">
                Delivered
              </div>

              <div className="fs-4 fw-bold text-primary">
                {totalDelivered}
              </div>

              <small className="text-muted">
                containers
              </small>
            </div>
          </div>

          {/* RETURNED */}

          <div className="col-6 col-md-3 inventory-transaction-stat-col">
            <div className="inventory-transaction-stat border rounded-3 p-3 h-100">
              <div className="small text-muted mb-1">
                Returned
              </div>

              <div className="fs-4 fw-bold text-success">
                {totalReturned}
              </div>

              <small className="text-muted">
                containers
              </small>
            </div>
          </div>

          {/* DAMAGED */}

          <div className="col-6 col-md-3 inventory-transaction-stat-col">
            <div className="inventory-transaction-stat border rounded-3 p-3 h-100">
              <div className="small text-muted mb-1">
                Damaged
              </div>

              <div className="fs-4 fw-bold text-warning">
                {totalDamaged}
              </div>

              <small className="text-muted">
                containers
              </small>
            </div>
          </div>

          {/* MISSING */}

          <div className="col-6 col-md-3 inventory-transaction-stat-col">
            <div className="inventory-transaction-stat border rounded-3 p-3 h-100">
              <div className="small text-muted mb-1">
                Missing
              </div>

              <div className="fs-4 fw-bold text-danger">
                {totalMissing}
              </div>

              <small className="text-muted">
                containers
              </small>
            </div>
          </div>
        </div>

        {/* =================================================
            EXPLANATION
        ================================================= */}

        <div className="alert alert-light border mb-4">
          <div className="d-flex gap-2">
            <i className="bi bi-info-circle text-primary mt-1" />

            <div>
              <strong>
                How to read this history
              </strong>

              <div className="small text-muted mt-1">
                <strong>
                  Delivered
                </strong>{" "}
                means filled containers
                were given to the
                customer.
                {" "}

                <strong>
                  Returned
                </strong>{" "}
                means empty containers
                were brought back.
                {" "}

                <strong>
                  Damaged
                </strong>{" "}
                and{" "}
                <strong>
                  Missing
                </strong>{" "}
                record containers that
                cannot return to normal
                inventory.
              </div>
            </div>
          </div>
        </div>

        {/* =================================================
            TABLE
        ================================================= */}

        <div
          className="table-responsive"
          style={{
            maxHeight: "650px",
            overflowY: "auto",
          }}
        >
          <table className="table align-middle mb-0">
            <thead
              className="table-light"
              style={{
                position: "sticky",
                top: 0,
                zIndex: 2,
              }}
            >
              <tr>
                <th>
                  DATE
                </th>

                <th>
                  MOVEMENT
                </th>

                <th>
                  PRODUCT
                </th>

                <th>
                  CUSTOMER
                </th>

                <th>
                  DRIVER
                </th>

                <th>
                  QUANTITY
                </th>

                <th>
                  PURPOSE
                </th>

                <th>
                  RESULT
                </th>

                <th>
                  NOTES
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.length ===
              0 ? (
                <tr>
                  <td
                    colSpan="9"
                    className="text-center text-muted py-5"
                  >
                    <i className="bi bi-inbox fs-2 d-block mb-2" />

                    No transaction
                    records found for
                    the selected period.
                  </td>
                </tr>
              ) : (
                rows.map(
                  (
                    transaction
                  ) => (
                    <tr
                      key={
                        transaction.id
                      }
                    >
                      {/* DATE */}

                      <td>
                        <span className="small text-nowrap">
                          {formatDate(
                            transaction.date
                          )}
                        </span>
                      </td>

                      {/* MOVEMENT */}

                      <td>
                        <MovementBadge
                          movement={
                            transaction.movement
                          }
                        />
                      </td>

                      {/* PRODUCT */}

                      <td>
                        <div className="fw-semibold">
                          {
                            transaction.product
                          }
                        </div>

                        <small className="text-muted">
                          {
                            transaction.capacity
                          }
                        </small>
                      </td>

                      {/* CUSTOMER */}

                      <td>
                        <span className="fw-semibold">
                          {
                            transaction.customer
                          }
                        </span>
                      </td>

                      {/* DRIVER */}

                      <td>
                        <span className="small">
                          {
                            transaction.driver ||
                            "—"
                          }
                        </span>
                      </td>

                      {/* QUANTITY */}

                      <td>
                        <strong>
                          {
                            transaction.quantity
                          }
                        </strong>
                      </td>

                      {/* PURPOSE */}

                      <td>
                        <PurposeBadge
                          purpose={
                            transaction.purpose
                          }
                        />
                      </td>

                      {/* RESULT */}

                      <td>
                        <ResultBadge
                          result={
                            transaction.result
                          }
                        />
                      </td>

                      {/* NOTES */}

                      <td
                        style={{
                          minWidth:
                            "260px",
                        }}
                      >
                        <span
                          className="small text-muted"
                          title={
                            transaction.notes ||
                            ""
                          }
                        >
                          {
                            transaction.notes ||
                            "—"
                          }
                        </span>
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

export default TransactionHistory;