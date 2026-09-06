import { useEffect, useState } from "react";

// =====================================================
// LAYOUT
// =====================================================

import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

// =====================================================
// INVENTORY COMPONENTS
// =====================================================

import InventoryStats from "../components/inventory/InventoryStats";
import InventoryManagement from "../components/inventory/InventoryManagement";
import CustomerContainerTracking from "../components/inventory/CustomerContainerTracking";
import TransactionHistory from "../components/inventory/TransactionHistory";

// =====================================================
// SERVICE
// =====================================================

import {
  getInventory,
  getCustomerContainers,
  getTransactionHistory,
  getContainerIssueRecords,
} from "../services/inventory.service";

// =====================================================
// CSS
// =====================================================

import "../styles/pages/inventory.css";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function formatIssueDate(
  dateValue
) {
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
| Global Date Filter
|--------------------------------------------------------------------------
*/

function InventoryDateFilter({
  filters,
  setFilters,
  onApply,
  onReset,
  loading,
}) {
  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-body p-3">
        <div className="row g-3 align-items-end">
          {/* FROM */}

          <div className="col-md-4">
            <label
              htmlFor="inventory-from-date"
              className="form-label small fw-semibold mb-1"
            >
              From Date
            </label>

            <input
              id="inventory-from-date"
              type="date"
              className="form-control"
              value={
                filters.fromDate
              }
              onChange={(event) =>
                setFilters(
                  (previous) => ({
                    ...previous,
                    fromDate:
                      event.target
                        .value,
                  })
                )
              }
            />
          </div>

          {/* TO */}

          <div className="col-md-4">
            <label
              htmlFor="inventory-to-date"
              className="form-label small fw-semibold mb-1"
            >
              To Date
            </label>

            <input
              id="inventory-to-date"
              type="date"
              className="form-control"
              value={
                filters.toDate
              }
              onChange={(event) =>
                setFilters(
                  (previous) => ({
                    ...previous,
                    toDate:
                      event.target
                        .value,
                  })
                )
              }
            />
          </div>

          {/* BUTTONS */}

          <div className="col-md-4">
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-primary flex-grow-1"
                onClick={onApply}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                    />
                    Loading...
                  </>
                ) : (
                  <>
                    <i className="bi bi-funnel me-2" />
                    Apply Filter
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onReset}
                disabled={loading}
              >
                <i className="bi bi-arrow-counterclockwise me-1" />
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* FILTER STATUS */}

        <div className="mt-3 small text-muted">
          <i className="bi bi-info-circle me-1" />

          {!filters.fromDate &&
          !filters.toDate ? (
            <span>
              Showing{" "}
              <strong>
                All Time
              </strong>{" "}
              inventory and records.
            </span>
          ) : (
            <span>
              Showing inventory and
              records for the selected
              date range.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Container Issue Records
|--------------------------------------------------------------------------
*/

function ContainerIssueRecords({
  issueData,
}) {
  const records =
    Array.isArray(
      issueData?.records
    )
      ? issueData.records
      : [];

  const summary =
    issueData?.summary || {
      total_records: 0,
      total_issues: 0,
      total_missing: 0,
      total_damaged: 0,
      customers_affected: 0,
      missing_records: 0,
      damaged_records: 0,
    };

  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-body p-4">
        {/* HEADER */}

        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-4">
          <div>
            <h5 className="fw-bold mb-1">
              Container Issue Records
            </h5>

            <p className="text-muted mb-0">
              Complete record of damaged
              and missing containers.
            </p>
          </div>

          <span className="badge bg-light text-dark border px-3 py-2">
            {summary.total_records} Records
          </span>
        </div>

        {/* SUMMARY */}

        <div className="row g-3 mb-4 inventory-issue-summary">
          {/* TOTAL RECORDS */}

          <div className="col-6 col-md-3 inventory-issue-col">
            <div className="border rounded-3 p-3 h-100 inventory-issue-card">
              <div className="small text-muted">
                Total Issue Records
              </div>

              <div className="fs-4 fw-bold mt-1">
                {summary.total_records}
              </div>
            </div>
          </div>

          {/* TOTAL ISSUES */}

          <div className="col-6 col-md-3 inventory-issue-col">
            <div className="border rounded-3 p-3 h-100 inventory-issue-card">
              <div className="small text-muted">
                Total Issues
              </div>

              <div className="fs-4 fw-bold mt-1">
                {summary.total_issues}
              </div>
            </div>
          </div>

          {/* MISSING */}

          <div className="col-6 col-md-3 inventory-issue-col">
            <div className="border rounded-3 p-3 h-100 inventory-issue-card">
              <div className="small text-muted">
                Missing Containers
              </div>

              <div className="fs-4 fw-bold text-danger mt-1">
                {summary.total_missing}
              </div>
            </div>
          </div>

          {/* DAMAGED */}

          <div className="col-6 col-md-3 inventory-issue-col">
            <div className="border rounded-3 p-3 h-100 inventory-issue-card">
              <div className="small text-muted">
                Damaged Containers
              </div>

              <div className="fs-4 fw-bold text-warning mt-1">
                {summary.total_damaged}
              </div>
            </div>
          </div>
        </div>

        {/* SECONDARY SUMMARY */}

        <div className="d-flex flex-wrap gap-2 mb-4">
          <span className="badge bg-light text-dark border px-3 py-2">
            <i className="bi bi-people me-1" />
            Customers Affected:{" "}
            {
              summary.customers_affected
            }
          </span>

          <span className="badge bg-light text-dark border px-3 py-2">
            <i className="bi bi-question-circle text-danger me-1" />
            Missing Records:{" "}
            {
              summary.missing_records
            }
          </span>

          <span className="badge bg-light text-dark border px-3 py-2">
            <i className="bi bi-exclamation-triangle text-warning me-1" />
            Damaged Records:{" "}
            {
              summary.damaged_records
            }
          </span>
        </div>

        {/* TABLE */}

        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>DATE</th>
                <th>CUSTOMER</th>
                <th>CONTAINER</th>
                <th>ISSUE</th>
                <th>QTY</th>
                <th>DRIVER</th>
                <th>ORDER</th>
                <th>RETURN</th>
                <th>NOTES</th>
              </tr>
            </thead>

            <tbody>
              {records.length ===
              0 ? (
                <tr>
                  <td
                    colSpan="9"
                    className="text-center text-muted py-5"
                  >
                    <i className="bi bi-inbox fs-2 d-block mb-2" />

                    No container issue
                    records found for
                    the selected period.
                  </td>
                </tr>
              ) : (
                records.map(
                  (record) => (
                    <tr
                      key={
                        record.id
                      }
                    >
                      {/* DATE */}

                      <td>
                        <span className="small fw-semibold text-nowrap">
                          {formatIssueDate(
                            record.date
                          )}
                        </span>
                      </td>

                      {/* CUSTOMER */}

                      <td>
                        <span className="fw-semibold">
                          {
                            record.customer_name
                          }
                        </span>
                      </td>

                      {/* CONTAINER */}

                      <td>
                        <div className="fw-semibold">
                          {
                            record.capacity
                          }
                        </div>

                        <small className="text-muted">
                          {
                            record.product_name
                          }
                        </small>
                      </td>

                      {/* ISSUE */}

                      <td>
                        {record.issue_type ===
                        "MISSING" ? (
                          <span className="badge rounded-pill bg-danger-subtle text-danger border border-danger-subtle">
                            <i className="bi bi-question-circle me-1" />
                            Missing
                          </span>
                        ) : (
                          <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis border border-warning-subtle">
                            <i className="bi bi-exclamation-triangle me-1" />
                            Damaged
                          </span>
                        )}
                      </td>

                      {/* QUANTITY */}

                      <td>
                        <strong>
                          {
                            record.quantity
                          }
                        </strong>
                      </td>

                      {/* DRIVER */}

                      <td>
                        <span className="small">
                          {
                            record.driver_name
                          }
                        </span>
                      </td>

                      {/* ORDER */}

                      <td>
                        <span className="badge bg-light text-dark border">
                          {
                            record.order_number
                          }
                        </span>
                      </td>

                      {/* RETURN */}

                      <td>
                        <span className="small text-nowrap">
                          {
                            record.returned_quantity
                          }{" "}
                          /{" "}
                          {
                            record.expected_quantity
                          }
                        </span>

                        <div className="small text-muted">
                          returned / expected
                        </div>
                      </td>

                      {/* NOTES */}

                      <td>
                        <span
                          className="small text-muted"
                          title={
                            record.notes ||
                            ""
                          }
                        >
                          {
                            record.notes ||
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

/*
|--------------------------------------------------------------------------
| MAIN INVENTORY PAGE
|--------------------------------------------------------------------------
*/

function Inventory() {
  /*
  |--------------------------------------------------------------------------
  | State
  |--------------------------------------------------------------------------
  */

  const [
    inventory,
    setInventory,
  ] = useState([]);

  const [
    customers,
    setCustomers,
  ] = useState([]);

  const [
    transactions,
    setTransactions,
  ] = useState([]);

  const [
    issueData,
    setIssueData,
  ] = useState({
    records: [],
    summary: {
      total_records: 0,
      total_issues: 0,
      total_missing: 0,
      total_damaged: 0,
      customers_affected: 0,
      missing_records: 0,
      damaged_records: 0,
    },
  });

  /*
  |--------------------------------------------------------------------------
  | Date filter
  |--------------------------------------------------------------------------
  */

  const [
    dateFilters,
    setDateFilters,
  ] = useState({
    fromDate: "",
    toDate: "",
  });

  /*
  |--------------------------------------------------------------------------
  | Applied filter
  |--------------------------------------------------------------------------
  |
  | This is important.
  |
  | The page does not reload every time the user
  | changes a date field.
  |
  | It only changes when Apply Filter is clicked.
  |--------------------------------------------------------------------------
  */

  const [
    appliedFilters,
    setAppliedFilters,
  ] = useState({
    fromDate: "",
    toDate: "",
  });

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    filterLoading,
    setFilterLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    lastUpdated,
    setLastUpdated,
  ] = useState(
    new Date()
  );

  /*
  |--------------------------------------------------------------------------
  | Load all inventory data
  |--------------------------------------------------------------------------
  */

  async function loadInventory(
    filters = appliedFilters,
    silent = false
  ) {
    try {
      if (!silent) {
        setLoading(true);
      }

      setError("");

      const [
        inventoryData,
        customerData,
        transactionData,
        issueDataResult,
      ] = await Promise.all([
        getInventory({
          toDate:
            filters.toDate,
        }),

        getCustomerContainers({
          toDate:
            filters.toDate,
        }),

        getTransactionHistory(
          filters
        ),

        getContainerIssueRecords(
          filters
        ),
      ]);

      setInventory(
        Array.isArray(
          inventoryData
        )
          ? inventoryData
          : []
      );

      setCustomers(
        Array.isArray(
          customerData
        )
          ? customerData
          : []
      );

      setTransactions(
        Array.isArray(
          transactionData
        )
          ? transactionData
          : []
      );

      setIssueData(
        issueDataResult || {
          records: [],
          summary: {
            total_records: 0,
            total_issues: 0,
            total_missing: 0,
            total_damaged: 0,
            customers_affected: 0,
            missing_records: 0,
            damaged_records: 0,
          },
        }
      );

      setLastUpdated(
        new Date()
      );
    } catch (err) {
      console.error(
        "Inventory load error:",
        err
      );

      setError(
        err?.message ||
          "Failed to load inventory."
      );
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Apply global filter
  |--------------------------------------------------------------------------
  */

  async function applyDateFilter() {
    if (
      dateFilters.fromDate &&
      dateFilters.toDate &&
      dateFilters.fromDate >
        dateFilters.toDate
    ) {
      window.alert(
        "From Date cannot be later than To Date."
      );

      return;
    }

    setFilterLoading(true);

    try {
      setAppliedFilters(
        dateFilters
      );

      await loadInventory(
        dateFilters,
        true
      );
    } finally {
      setFilterLoading(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Reset global filter
  |--------------------------------------------------------------------------
  */

  async function resetDateFilter() {
    const reset = {
      fromDate: "",
      toDate: "",
    };

    setDateFilters(
      reset
    );

    setAppliedFilters(
      reset
    );

    setFilterLoading(true);

    try {
      await loadInventory(
        reset,
        true
      );
    } finally {
      setFilterLoading(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Initial load + automatic refresh
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let mounted = true;

    loadInventory();

    /*
    |--------------------------------------------------------------------------
    | Refresh every 30 seconds.
    |--------------------------------------------------------------------------
    |
    | Important:
    | It keeps the currently selected global date
    | filter.
    |--------------------------------------------------------------------------
    */

    const interval =
      setInterval(() => {
        if (mounted) {
          loadInventory(
            appliedFilters,
            true
          );
        }
      }, 30000);

    return () => {
      mounted = false;

      clearInterval(
        interval
      );
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="inventory-page">
        <div className="d-flex">
          <Sidebar />

          <div className="main-content inventory-main-content">
            <Header />

            <div
              className="d-flex justify-content-center align-items-center"
              style={{
                height: "80vh",
              }}
            >
              <div className="text-center">
                <div
                  className="spinner-border text-primary mb-3"
                  role="status"
                >
                  <span className="visually-hidden">
                    Loading...
                  </span>
                </div>

                <p className="text-muted mb-0">
                  Loading inventory...
                </p>
              </div>
            </div>

            <Footer />
          </div>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Error
  |--------------------------------------------------------------------------
  */

  if (error) {
    return (
      <div className="inventory-page">
        <div className="d-flex">
          <Sidebar />

          <div className="main-content inventory-main-content">
            <Header />

            <div className="container-fluid py-4">
              <div className="alert alert-danger">
                <strong>
                  Inventory Error
                </strong>

                <div className="mt-1">
                  {error}
                </div>

                <button
                  type="button"
                  className="btn btn-danger mt-3"
                  onClick={() =>
                    loadInventory()
                  }
                >
                  Try Again
                </button>
              </div>
            </div>

            <Footer />
          </div>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | MAIN PAGE
  |--------------------------------------------------------------------------
  */

  return (
    <div className="inventory-page">
      <div className="d-flex">
        {/* SIDEBAR */}

        <Sidebar />

        {/* MAIN CONTENT */}

        <div className="main-content inventory-main-content">
          {/* HEADER */}

          <Header />

          {/* CONTENT */}

          <div className="inventory-content">
            {/* =================================================
                PAGE HEADER
            ================================================= */}

            <div className="inventory-header">
              <div>
                <h4 className="mb-2">
                  Container Inventory
                  Management
                </h4>

                <p className="text-muted mb-1">
                  Monitor gallon circulation
                  based on orders,
                  deliveries, returns,
                  and container status.
                </p>

                <small className="text-muted">
                  Last updated:{" "}
                  {lastUpdated.toLocaleTimeString()}
                </small>
              </div>

              <button
                type="button"
                className="btn btn-outline-dark"
                onClick={() =>
                  loadInventory()
                }
                title="Refresh inventory"
              >
                <i className="bi bi-arrow-clockwise me-2" />
                Refresh
              </button>
            </div>

            {/* =================================================
                GLOBAL DATE FILTER
            ================================================= */}

            <InventoryDateFilter
              filters={
                dateFilters
              }
              setFilters={
                setDateFilters
              }
              onApply={
                applyDateFilter
              }
              onReset={
                resetDateFilter
              }
              loading={
                filterLoading
              }
            />

            {/* =================================================
                INVENTORY STATISTICS
            ================================================= */}

            <InventoryStats
              inventory={inventory}
            />

            {/* =================================================
                CONTAINER MANAGEMENT
            ================================================= */}

            <InventoryManagement
              inventory={inventory}
              onRefresh={() =>
                loadInventory(
                  appliedFilters,
                  true
                )
              }
            />

            {/* =================================================
                CUSTOMER CONTAINER TRACKING
            ================================================= */}

            <CustomerContainerTracking
              customers={
                customers
              }
            />

            {/* =================================================
                CONTAINER ISSUE RECORDS
            ================================================= */}

            <ContainerIssueRecords
              issueData={
                issueData
              }
            />

            {/* =================================================
                TRANSACTION HISTORY
            ================================================= */}

            <TransactionHistory
              transactions={
                transactions
              }
            />
          </div>

          {/* FOOTER */}

          <Footer />
        </div>
      </div>
    </div>
  );
}

export default Inventory;