import { useEffect, useMemo, useState } from "react";

import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

import OrdersTable from "../components/orders/OrdersTable";
import OrderDetailsModal from "../components/orders/OrderDetailsModal";

import {
  getOrders,
  getOrderStats,
  filterOrders,
} from "../services/orders.service";

import "../styles/pages/orders.css";

function Orders() {

  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    onTheWay: 0,
    delivered: 0,
  });

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [deliveryType, setDeliveryType] = useState("all");

  const [loading, setLoading] = useState(true);

  /* ==========================================
      PAGINATION
  ========================================== */

  const ITEMS_PER_PAGE = 10;

  const [currentPage, setCurrentPage] = useState(1);

  /* ==========================================
      LOAD ORDERS
  ========================================== */

  useEffect(() => {

    let cancelled = false;

    const fetchOrders = async () => {

      try {

        const [ordersData, statsData] = await Promise.all([
          getOrders(),
          getOrderStats(),
        ]);

        if (cancelled) return;

        setOrders(ordersData);
        setStats(statsData);

      } catch (err) {

        console.error("Failed to load orders:", err);

      } finally {

        if (!cancelled) {
          setLoading(false);
        }

      }

    };

    fetchOrders();

    const timer = setInterval(fetchOrders, 30000);

    return () => {

      cancelled = true;
      clearInterval(timer);

    };

  }, []);

  /* ==========================================
      FILTER ORDERS
  ========================================== */

  const filteredOrders = useMemo(() => {

    return filterOrders(
      orders,
      search,
      status,
      deliveryType
    );

  }, [orders, search, status, deliveryType]);

  /* ==========================================
      RESET PAGE WHEN FILTER CHANGES
  ========================================== */

  /* ==========================================
      PAGINATION
  ========================================== */

  const totalPages = Math.ceil(
    filteredOrders.length / ITEMS_PER_PAGE
  );

  const paginatedOrders = useMemo(() => {

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;

    return filteredOrders.slice(startIndex, endIndex);

  }, [filteredOrders, currentPage]);

  /* ==========================================
      VIEW ORDER
  ========================================== */

  const handleView = (order) => {

    setSelectedOrder(order);

  };

    return (
    <div className="dashboard-page">
      <div className="d-flex">

        <Sidebar />

        <div className="main-content orders-main-content">

          <Header />

          {/* ===========================
              PAGE HEADER
          ============================ */}

          <div className="page-header mb-4">

            <h2 className="fw-bold mb-2">
              <i className="bi bi-box-seam me-2 text-primary"></i>
              Order Management
            </h2>

            <p className="text-muted mb-0">
              Review customer orders before assigning them for delivery.
            </p>

          </div>

          {/* ===========================
              STATISTICS
          ============================ */}

          <div className="row g-4 mb-4 orders-stat-grid">

            <div className="col-6 col-xl-3 orders-stat-col">

              <div className="stat-card card-total">

                <div className="d-flex justify-content-between align-items-start">

                  <div>

                    <small>Total Orders</small>

                    <h2>{stats.total}</h2>

                    <span className="text-muted">
                      All customer orders
                    </span>

                  </div>

                  <div className="stat-icon">

                    <i className="bi bi-box-seam"></i>

                  </div>

                </div>

              </div>

            </div>

            <div className="col-6 col-xl-3 orders-stat-col">

              <div className="stat-card card-pending">

                <div className="d-flex justify-content-between align-items-start">

                  <div>

                    <small>Pending Review</small>

                    <h2>{stats.pending}</h2>

                    <span className="text-muted">
                      Waiting for confirmation
                    </span>

                  </div>

                  <div className="stat-icon">

                    <i className="bi bi-hourglass-split"></i>

                  </div>

                </div>

              </div>

            </div>

            <div className="col-6 col-xl-3 orders-stat-col">

              <div className="stat-card card-ready">

                <div className="d-flex justify-content-between align-items-start">

                  <div>

                    <small>Ready for Delivery</small>

                    <h2>{stats.onTheWay}</h2>

                    <span className="text-muted">
                      Awaiting driver assignment
                    </span>

                  </div>

                  <div className="stat-icon">

                    <i className="bi bi-truck"></i>

                  </div>

                </div>

              </div>

            </div>

            <div className="col-6 col-xl-3 orders-stat-col">

              <div className="stat-card card-delivered">

                <div className="d-flex justify-content-between align-items-start">

                  <div>

                    <small>Completed</small>

                    <h2>{stats.delivered}</h2>

                    <span className="text-muted">
                      Successfully delivered
                    </span>

                  </div>

                  <div className="stat-icon">

                    <i className="bi bi-check-circle"></i>

                  </div>

                </div>

              </div>

            </div>

          </div>

          {/* ===========================
              FILTERS
          ============================ */}

          <div className="card shadow-sm border-0 mb-4">

            <div className="card-body">

              <div className="row g-3 align-items-center">

                <div className="col-lg">

                  <div className="input-group">

                    <span className="input-group-text bg-white border-end-0">

                      <i className="bi bi-search"></i>

                    </span>

                    <input
                      type="text"
                      className="form-control border-start-0"
                      placeholder="Search Order ID or Customer..."
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setCurrentPage(1);
                      }}
                    />

                  </div>

                </div>

                <div className="col-lg-2">

                  <select
                    className="form-select"
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value);
                      setCurrentPage(1);
                    }}
                  >

                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="on_the_way">On the Way</option>
                    <option value="delivered">Delivered</option>

                  </select>

                </div>

                <div className="col-lg-2">

                  <select
                    className="form-select"
                    value={deliveryType}
                    onChange={(e) => {
                      setDeliveryType(e.target.value);
                      setCurrentPage(1);
                    }}
                  >

                    <option value="all">All Delivery Types</option>
                    <option value="now">Deliver Now</option>
                    <option value="scheduled">Scheduled</option>

                  </select>

                </div>

                <div className="col-lg-auto">

                  <button
                    className="btn btn-outline-secondary w-100"
                    onClick={() => {
                      setSearch("");
                      setStatus("all");
                      setDeliveryType("all");
                      setCurrentPage(1);
                    }}
                  >

                    <i className="bi bi-arrow-clockwise me-2"></i>

                    Reset

                  </button>

                </div>

              </div>

            </div>

          </div>

          {/* ===========================
              ORDERS TABLE
          ============================ */}
                    <div className="card shadow-sm border-0">

            <div className="card-header bg-white border-0 py-3">

              <div className="d-flex justify-content-between align-items-center">

                <h5 className="mb-0 fw-semibold">

                  Customer Orders

                </h5>

                <span className="badge bg-primary fs-6">

                  {filteredOrders.length} Total Orders

                </span>

              </div>

            </div>

            <div className="card-body">

              {loading ? (

                <div className="text-center py-5">

                  <div
                    className="spinner-border text-primary mb-3"
                    style={{ width: "3rem", height: "3rem" }}
                  ></div>

                  <p className="text-muted mb-0">

                    Loading orders...

                  </p>

                </div>

              ) : (

                <>

                  <OrdersTable
                    orders={paginatedOrders}
                    onView={handleView}
                  />

                  {totalPages > 1 && (

                    <div className="d-flex justify-content-between align-items-center mt-4">

                      <small className="text-muted">

                        Showing{" "}
                        {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                        {" - "}
                        {Math.min(
                          currentPage * ITEMS_PER_PAGE,
                          filteredOrders.length
                        )}
                        {" of "}
                        {filteredOrders.length}
                        {" orders"}

                      </small>

                      <nav>

                        <ul className="pagination pagination-sm mb-0">

                          <li
                            className={`page-item ${
                              currentPage === 1 ? "disabled" : ""
                            }`}
                          >

                            <button
                              className="page-link"
                              onClick={() =>
                                setCurrentPage((page) => page - 1)
                              }
                            >

                              <i className="bi bi-chevron-left"></i>

                            </button>

                          </li>

                          {Array.from(
                            { length: totalPages },
                            (_, index) => (

                              <li
                                key={index + 1}
                                className={`page-item ${
                                  currentPage === index + 1
                                    ? "active"
                                    : ""
                                }`}
                              >

                                <button
                                  className="page-link"
                                  onClick={() =>
                                    setCurrentPage(index + 1)
                                  }
                                >

                                  {index + 1}

                                </button>

                              </li>

                            )
                          )}

                          <li
                            className={`page-item ${
                              currentPage === totalPages
                                ? "disabled"
                                : ""
                            }`}
                          >

                            <button
                              className="page-link"
                              onClick={() =>
                                setCurrentPage((page) => page + 1)
                              }
                            >

                              <i className="bi bi-chevron-right"></i>

                            </button>

                          </li>

                        </ul>

                      </nav>

                    </div>

                  )}

                </>

              )}

            </div>

          </div>

          <OrderDetailsModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
          />

          <div className="orders-footer">
            <Footer />
          </div>

        </div>

      </div>

    </div>

  );

}

export default Orders;