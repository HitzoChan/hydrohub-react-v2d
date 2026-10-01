function DashboardCards({ stats = {} }) {
  const totalOrders = Number(
    stats.totalOrders || 0
  );

  const activeOrders = Number(
    stats.activeOrders || 0
  );

  const totalCustomers = Number(
    stats.totalCustomers || 0
  );

  const revenue = Number(
    stats.revenue || 0
  );

  return (
    <div className="row g-4 mb-4 dashboard-metrics">

      {/* =====================================================
          TOTAL ORDERS TODAY
      ===================================================== */}
      <div className="col-6 col-xl-3 dashboard-metric-col">

        <div className="card dashboard-metric-card dashboard-blue h-100">

          <div className="d-flex justify-content-between align-items-start">

            <div className="dashboard-content">

              <small>
                Total Orders
              </small>

              <h3>
                {totalOrders}
              </h3>

              <p className="dashboard-subtitle mb-0">
                Valid customer orders
              </p>

            </div>

            <div className="dashboard-icon">

              <i className="bi bi-box-seam"></i>

            </div>

          </div>

        </div>

      </div>


      {/* =====================================================
          ACTIVE DELIVERIES
      ===================================================== */}
      <div className="col-6 col-xl-3 dashboard-metric-col">

        <div className="card dashboard-metric-card dashboard-green h-100">

          <div className="d-flex justify-content-between align-items-start">

            <div className="dashboard-content">

              <small>
                Active Deliveries
              </small>

              <h3>
                {activeOrders}
              </h3>

              <p className="dashboard-subtitle mb-0">
                Currently active deliveries
              </p>

            </div>

            <div className="dashboard-icon">

              <i className="bi bi-truck"></i>

            </div>

          </div>

        </div>

      </div>


      {/* =====================================================
          TOTAL CUSTOMERS
      ===================================================== */}
      <div className="col-6 col-xl-3 dashboard-metric-col">

        <div className="card dashboard-metric-card dashboard-purple h-100">

          <div className="d-flex justify-content-between align-items-start">

            <div className="dashboard-content">

              <small>
                Total Customers
              </small>

              <h3>
                {totalCustomers}
              </h3>

              <p className="dashboard-subtitle mb-0">
                Customers with valid orders
              </p>

            </div>

            <div className="dashboard-icon">

              <i className="bi bi-people"></i>

            </div>

          </div>

        </div>

      </div>


      {/* =====================================================
          REVENUE TODAY
      ===================================================== */}
      <div className="col-6 col-xl-3 dashboard-metric-col">

        <div className="card dashboard-metric-card dashboard-yellow h-100">

          <div className="d-flex justify-content-between align-items-start">

            <div className="dashboard-content">

              <small>
                Revenue Today
              </small>

              <h3>
                ₱{revenue.toLocaleString()}
              </h3>

              <p className="dashboard-subtitle mb-0">
                Completed sales today
              </p>

            </div>

            <div className="dashboard-icon">

              <i className="bi bi-cash-stack"></i>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default DashboardCards;