import { useEffect, useState } from "react";

import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

import DashboardCards from "../components/dashboard/DashboardCards";
import WeeklySalesChart from "../components/dashboard/WeeklySalesChart";
import TodayDeliveriesChart from "../components/dashboard/TodayDeliveriesChart";
import ContainerFlowChart from "../components/dashboard/ContainerFlowChart";
import RecentTransactions from "../components/dashboard/RecentTransactions";

import {
  getDashboardStats,
  getWeeklySales,
  getMonthlySales,
  getDeliveryStatusOverview,
  getContainerFlowStats,
} from "../services/dashboard.service";

import "../styles/pages/dashboard.css";

function Dashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeOrders: 0,
    totalCustomers: 0,
    revenue: 0,
  });

  const [weeklySales, setWeeklySales] = useState([]);
  const [monthlySales, setMonthlySales] = useState([]);

  const [deliveryStats, setDeliveryStats] = useState({
    delivered: 0,
    pending: 0,
    scheduled: 0,
    cancelled: 0,
    rejected: 0,
  });
  const [containerFlowStats, setContainerFlowStats] = useState({ weekly: {}, monthly: {} });

  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [theme, setTheme] = useState(() =>
    document.documentElement.dataset.theme ||
    localStorage.getItem("hydrohub-theme") ||
    "light"
  );

  useEffect(() => {
    const handleThemeChange = (event) => {
      setTheme(event.detail?.theme || "light");
    };

    document.addEventListener("hydrohub:theme-change", handleThemeChange);
    return () => {
      document.removeEventListener("hydrohub:theme-change", handleThemeChange);
    };
  }, []);

  useEffect(() => {
    let interval;

    async function loadDashboard() {
      try {
        setLoading(true);

const [dashboardStats, sales, monthly, deliveries, weeklyFlow, monthlyFlow] = await Promise.all([
  getDashboardStats(),
  getWeeklySales(),
  getMonthlySales(),
  getDeliveryStatusOverview(),
  getContainerFlowStats("weekly"),
  getContainerFlowStats("monthly"),
]);

console.log("Dashboard Stats:", dashboardStats);
console.log("Weekly Sales:", sales);
console.log("Today's Deliveries:", deliveries);

setStats(dashboardStats);
setWeeklySales(sales);
setMonthlySales(monthly);
setDeliveryStats(deliveries);
setContainerFlowStats({ weekly: weeklyFlow, monthly: monthlyFlow });

        setStats(dashboardStats);
        setWeeklySales(sales);
        setMonthlySales(monthly);
        setDeliveryStats(deliveries);
        setContainerFlowStats({ weekly: weeklyFlow, monthly: monthlyFlow });
        setLastUpdated(new Date());
      } catch (error) {
        console.error("Failed to load dashboard:", error);
      } finally {
        setLoading(false);
      }
    }

    // Load immediately
    loadDashboard();

    // Refresh every 30 seconds
    interval = setInterval(loadDashboard, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="d-flex">
          <Sidebar />

          <div className="main-content">
            <Header />

            <div
              className="d-flex justify-content-center align-items-center"
              style={{ height: "80vh" }}
            >
              <div className="text-center">
                <div
                  className="spinner-border text-primary mb-3"
                  role="status"
                >
                  <span className="visually-hidden">Loading...</span>
                </div>

                <p className="text-muted mb-0">
                  Loading dashboard...
                </p>
              </div>
            </div>

            <div className="dashboard-footer">
              <Footer />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="d-flex">
        <Sidebar />

        <div className="main-content">
          <Header />

          <div className="mb-4">
            <h4 className="mb-2">Dashboard Overview</h4>

            <p className="text-muted mb-1">
              Welcome back! Here's what's happening today.
            </p>

            <small className="text-muted">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </small>
          </div>

          <DashboardCards stats={stats} />

          {/* Charts */}
          <div className="row g-4 mb-4">

            {/* Weekly Sales */}
            <div className="col-lg-6 d-flex">
              <div className="card chart-box p-3 shadow-sm w-100">

                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                        <h6 className="mb-0">Weekly Sales</h6>

                    <small className="text-muted">
                      Revenue this week
                    </small>
                  </div>
                </div>

                <WeeklySalesChart sales={weeklySales} monthlySales={monthlySales} period="weekly" theme={theme} />

              </div>
            </div>

            {/* Monthly Sales */}
            <div className="col-lg-6 d-flex">
              <div className="card chart-box p-3 shadow-sm w-100">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h6 className="mb-0">Monthly Sales</h6>
                    <small className="text-muted">Revenue over the last 12 months</small>
                  </div>
                </div>
                <WeeklySalesChart sales={weeklySales} monthlySales={monthlySales} period="monthly" theme={theme} />
              </div>
            </div>

            {/* Today's Deliveries */}
            <div className="col-lg-6 d-flex">
              <div className="card chart-box p-3 shadow-sm w-100">

                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h6 className="mb-0">This Month Delivery Status</h6>

                    <small className="text-muted">
                      Orders created or scheduled this month
                    </small>
                  </div>
                </div>

                <TodayDeliveriesChart
                  delivered={deliveryStats.delivered}
                  pending={deliveryStats.pending}
                  scheduled={deliveryStats.scheduled}
                  cancelled={deliveryStats.cancelled}
                  rejected={deliveryStats.rejected}
                  theme={theme}
                />

              </div>
            </div>

            <div className="col-lg-6 d-flex">
              <div className="card chart-box p-3 shadow-sm w-100">
                <div className="mb-3"><h6 className="mb-0">Container Movement</h6><small className="text-muted">Gallons by activity</small></div>
                <ContainerFlowChart stats={containerFlowStats} period="weekly" theme={theme} />
              </div>
            </div>

          </div>

          <RecentTransactions />

          <div className="dashboard-footer">
            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;