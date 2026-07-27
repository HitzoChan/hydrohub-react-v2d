function DashboardCards({ stats }) {
  return (
    <div className="row g-4 mb-4">

      {/* Total Orders */}
      <div className="col-xl-3 col-lg-6">

        <div className="card dashboard-blue h-100">

          <div className="card-body d-flex justify-content-between align-items-center">

            <div className="dashboard-content">

              <small>Total Orders Today</small>

              <h3>{stats.totalOrders}</h3>

              <p className="dashboard-subtitle mb-0">
                Customer orders received
              </p>

            </div>

            <div className="dashboard-icon">

              <i className="bi bi-box-seam"></i>

            </div>

          </div>

        </div>

      </div>

      {/* Active Deliveries */}
      <div className="col-xl-3 col-lg-6">

        <div className="card dashboard-green h-100">

          <div className="card-body d-flex justify-content-between align-items-center">

            <div className="dashboard-content">

              <small>Active Deliveries</small>

              <h3>{stats.activeOrders}</h3>

              <p className="dashboard-subtitle mb-0">
                Orders currently in transit
              </p>

            </div>

            <div className="dashboard-icon">

              <i className="bi bi-truck"></i>

            </div>

          </div>

        </div>

      </div>

      {/* Total Customers */}
      <div className="col-xl-3 col-lg-6">

        <div className="card dashboard-purple h-100">

          <div className="card-body d-flex justify-content-between align-items-center">

            <div className="dashboard-content">

              <small>Total Customers</small>

              <h3>{stats.totalCustomers}</h3>

              <p className="dashboard-subtitle mb-0">
                Registered customers
              </p>

            </div>

            <div className="dashboard-icon">

              <i className="bi bi-people"></i>

            </div>

          </div>

        </div>

      </div>

      {/* Revenue */}
      <div className="col-xl-3 col-lg-6">

        <div className="card dashboard-yellow h-100">

          <div className="card-body d-flex justify-content-between align-items-center">

            <div className="dashboard-content">

              <small>Revenue Today</small>

              <h3>₱{stats.revenue.toLocaleString()}</h3>

              <p className="dashboard-subtitle mb-0">
                Total sales collected
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