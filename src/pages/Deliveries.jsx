import { useEffect, useMemo, useState } from "react";

import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

import DeliveryStats from "../components/deliveries/DeliveryStats";
import DeliveryFilters from "../components/deliveries/DeliveryFilters";
import DeliveriesTable from "../components/deliveries/DeliveriesTable";
import AssignDeliveryModal from "../components/deliveries/AssignDeliveryModal";

import {
  getDeliveries,
  getDeliveryStats,
  filterDeliveries,
  assignDriver,
} from "../services/deliveries.service";

import { supabase } from "../lib/supabase";

import "../styles/pages/deliveries.css";

/* =========================================================
   HELPERS
========================================================= */

/**
 * Normalize statuses so:
 *
 * "Pending"
 * "pending"
 * "PENDING"
 * "pending-review"
 * "pending review"
 *
 * can be handled consistently.
 */
function normalizeStatus(status) {
  return String(status || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

/* =========================================================
   FIND RELATED ORDER
========================================================= */

function findRelatedOrder(delivery, orders) {
  if (!delivery || !Array.isArray(orders)) {
    return null;
  }

  const deliveryOrderId =
    delivery.orderId ||
    delivery.order_id ||
    delivery.order?.id;

  const deliveryOrderNumber =
    delivery.orderNumber ||
    delivery.order_number ||
    delivery.order?.orderNumber ||
    delivery.order?.order_number;

  return (
    orders.find((order) => {
      const orderId =
        order.id ||
        order.orderId ||
        order.order_id;

      const orderNumber =
        order.orderNumber ||
        order.order_number;

      /*
       * Match using UUID/order ID.
       */
      if (
        deliveryOrderId &&
        orderId &&
        String(deliveryOrderId) ===
          String(orderId)
      ) {
        return true;
      }

      /*
       * Match using order number if available.
       */
      if (
        deliveryOrderNumber &&
        orderNumber &&
        String(deliveryOrderNumber) ===
          String(orderNumber)
      ) {
        return true;
      }

      return false;
    }) || null
  );
}

/* =========================================================
   ORDER ELIGIBILITY
========================================================= */

/**
 * Determines whether an order should appear
 * in Delivery Management.
 *
 * IMPORTANT:
 *
 * A NEW CUSTOMER ORDER with status "pending"
 * is now allowed.
 *
 * Flow:
 *
 * pending
 *    ↓
 * assigned
 *    ↓
 * in_transit
 *    ↓
 * delivered
 */
function isOrderEligibleForDelivery(order) {
  if (!order) {
    return false;
  }

  const orderStatus = normalizeStatus(
    order.status
  );

  return [
    "pending",

    "ready_for_delivery",
    "ready",
    "approved",
    "confirmed",

    "assigned",

    "in_transit",
    "on_the_way",
    "in_progress",

    "delivered",
  ].includes(orderStatus);
}

/* =========================================================
   CLEAN DELIVERY RECORDS
========================================================= */

function cleanDeliveries(
  deliveries,
  orders
) {
  if (!Array.isArray(deliveries)) {
    return [];
  }

  return deliveries.filter((delivery) => {
    const deliveryStatus =
      normalizeStatus(
        delivery.status
      );

    /*
     * Keep active delivery records.
     */
    if (
      [
        "pending",
        "assigned",
        "in_transit",
        "on_the_way",
        "in_progress",
        "delivered",
        "cancelled",
      ].includes(deliveryStatus)
    ) {
      return true;
    }

    /*
     * For unknown statuses, check the
     * related order.
     */
    const relatedOrder =
      findRelatedOrder(
        delivery,
        orders
      );

    return isOrderEligibleForDelivery(
      relatedOrder
    );
  });
}

/* =========================================================
   CREATE MISSING PENDING DELIVERIES
========================================================= */

/**
 * Creates a delivery record for a customer order
 * when the order exists but the deliveries table
 * does not yet contain a corresponding record.
 *
 * Example:
 *
 * orders
 * -------------------------
 * id       = ORD-FB27
 * status   = pending
 * gallons  = 10
 *
 * becomes:
 *
 * deliveries
 * -------------------------
 * order_id = ORD-FB27
 * quantity = 10
 * status   = pending
 */
async function createMissingPendingDeliveries(
  orders,
  deliveries
) {
  if (!Array.isArray(orders)) {
    return;
  }

  if (!Array.isArray(deliveries)) {
    deliveries = [];
  }

  /*
   * Build a set of existing delivery order IDs.
   */
  const existingOrderIds =
    new Set(
      deliveries
        .map((delivery) => {
          return String(
            delivery.order_id ||
              delivery.orderId ||
              delivery.order?.id ||
              ""
          );
        })
        .filter(Boolean)
    );

  /*
   * Only create delivery records for
   * eligible orders that don't already
   * have one.
   */
  const ordersWithoutDeliveries =
    orders.filter((order) => {
      if (!isOrderEligibleForDelivery(order)) {
        return false;
      }

      /*
       * Don't create delivery records for
       * cancelled/rejected orders.
       */
      const status =
        normalizeStatus(
          order.status
        );

      if (
        [
          "cancelled",
          "rejected",
          "declined",
        ].includes(status)
      ) {
        return false;
      }

      return !existingOrderIds.has(
        String(order.id)
      );
    });

  if (
    ordersWithoutDeliveries.length === 0
  ) {
    return;
  }

  /*
   * Build delivery records.
   */
  const newDeliveries =
    ordersWithoutDeliveries.map(
      (order) => ({
        order_id: order.id,

        customer_id:
          order.customer_id || null,

        driver_id:
          order.driver_id || null,

        status:
          normalizeStatus(
            order.status
          ) === "pending"
            ? "pending"
            : normalizeStatus(
                order.status
              ),

        /*
         * orders uses "gallons"
         * deliveries uses "quantity".
         */
        quantity:
          Number(order.gallons) || 0,

        delivery_type:
          order.delivery_type ||
          "Deliver Now",
      })
    );

  console.log(
    "Creating missing delivery records:",
    newDeliveries
  );

  const {
    error,
  } = await supabase
    .from("deliveries")
    .insert(newDeliveries);

  if (error) {
    console.error(
      "Unable to create pending delivery records:",
      error
    );

    /*
     * Don't crash the whole page if the
     * automatic delivery creation fails.
     *
     * The error will be visible in console.
     */
    return;
  }

  console.log(
    `Created ${newDeliveries.length} pending delivery record(s).`
  );
}

/* =========================================================
   REJECTED ORDER COUNT
========================================================= */

function getRejectedOrderCount(
  orders
) {
  if (!Array.isArray(orders)) {
    return 0;
  }

  return orders.filter((order) => {
    const status =
      normalizeStatus(
        order.status
      );

    return [
      "rejected",
      "declined",
    ].includes(status);
  }).length;
}

/* =========================================================
   PAGE
========================================================= */

function Deliveries() {
  const [
    deliveries,
    setDeliveries,
  ] = useState([]);

  const [
    drivers,
    setDrivers,
  ] = useState([]);

  const [
    orders,
    setOrders,
  ] = useState([]);

  const [
    selectedDelivery,
    setSelectedDelivery,
  ] = useState(null);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    status,
    setStatus,
  ] = useState("all");

  const [
    deliveryPage,
    setDeliveryPage,
  ] = useState(1);

  const deliveriesPerPage = 10;

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    showAssignModal,
    setShowAssignModal,
  ] = useState(false);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    lastUpdated,
    setLastUpdated,
  ] = useState(null);

  /* =======================================================
     LOAD / REFRESH DELIVERIES
  ======================================================= */

  const refreshDeliveries = async (
    silent = false
  ) => {
    try {
      if (!silent) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      /*
       * First load current data.
       */
      const data =
        await getDeliveries();

      const rawDeliveries =
        Array.isArray(
          data?.deliveries
        )
          ? data.deliveries
          : [];

      const loadedDrivers =
        Array.isArray(
          data?.drivers
        )
          ? data.drivers
          : [];

      const loadedOrders =
        Array.isArray(
          data?.orders
        )
          ? data.orders
          : [];

      /*
       * IMPORTANT:
       *
       * Make sure every eligible order
       * has a delivery record.
       */
      await createMissingPendingDeliveries(
        loadedOrders,
        rawDeliveries
      );

      /*
       * Reload deliveries after creating
       * any missing records.
       */
      const refreshed =
        await getDeliveries();

      const refreshedDeliveries =
        Array.isArray(
          refreshed?.deliveries
        )
          ? refreshed.deliveries
          : rawDeliveries;

      /*
       * Clean the final delivery list.
       */
      const cleanedDeliveries =
        cleanDeliveries(
          refreshedDeliveries,
          loadedOrders
        );

      /*
       * Update React state.
       */
      setDeliveries(
        cleanedDeliveries
      );

      setDrivers(
        loadedDrivers
      );

      setOrders(
        loadedOrders
      );

      setLastUpdated(
        new Date()
      );

    } catch (err) {
      console.error(
        "Unable to load deliveries:",
        err
      );

      alert(
        "Unable to load deliveries."
      );

    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* =======================================================
     INITIAL LOAD + AUTO REFRESH
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);

        /*
         * Load initial data.
         */
        const data =
          await getDeliveries();

        if (!mounted) {
          return;
        }

        const rawDeliveries =
          Array.isArray(
            data?.deliveries
          )
            ? data.deliveries
            : [];

        const loadedDrivers =
          Array.isArray(
            data?.drivers
          )
            ? data.drivers
            : [];

        const loadedOrders =
          Array.isArray(
            data?.orders
          )
            ? data.orders
            : [];

        /*
         * Create delivery records for
         * new pending orders.
         */
        await createMissingPendingDeliveries(
          loadedOrders,
          rawDeliveries
        );

        if (!mounted) {
          return;
        }

        /*
         * Reload after inserting missing
         * delivery records.
         */
        const refreshed =
          await getDeliveries();

        if (!mounted) {
          return;
        }

        const finalDeliveries =
          Array.isArray(
            refreshed?.deliveries
          )
            ? refreshed.deliveries
            : rawDeliveries;

        /*
         * Clean delivery records.
         */
        const cleanedDeliveries =
          cleanDeliveries(
            finalDeliveries,
            loadedOrders
          );

        /*
         * Set state.
         */
        setDeliveries(
          cleanedDeliveries
        );

        setDrivers(
          loadedDrivers
        );

        setOrders(
          loadedOrders
        );

        setLastUpdated(
          new Date()
        );

      } catch (err) {
        console.error(
          "Unable to load deliveries:",
          err
        );

        if (mounted) {
          alert(
            "Unable to load deliveries."
          );
        }

      } finally {
        if (mounted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    load();

    /*
     * Automatically refresh every
     * 30 seconds.
     */
    const interval =
      setInterval(() => {
        refreshDeliveries(true);
      }, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  /* =======================================================
     STATISTICS
  ======================================================= */

  const stats = useMemo(() => {
    const deliveryStats =
      getDeliveryStats(
        deliveries
      ) || {};

    const rejected =
      getRejectedOrderCount(
        orders
      );

    return {
      ...deliveryStats,

      total:
        Number(
          deliveryStats.total
        ) || 0,

      pending:
        Number(
          deliveryStats.pending
        ) || 0,

      assigned:
        Number(
          deliveryStats.assigned
        ) || 0,

      inTransit:
        Number(
          deliveryStats.inTransit
        ) || 0,

      activeDrivers:
        Number(
          deliveryStats.activeDrivers
        ) || 0,

      delivered:
        Number(
          deliveryStats.delivered
        ) || 0,

      rejected,
    };
  }, [
    deliveries,
    orders,
  ]);

  /* =======================================================
     FILTERED DELIVERIES
  ======================================================= */

  const filteredDeliveries =
    useMemo(() => {
      return filterDeliveries(
        deliveries,
        search,
        status
      );
    }, [
      deliveries,
      search,
      status,
    ]);

  const deliveryPageCount = Math.max(
    1,
    Math.ceil(filteredDeliveries.length / deliveriesPerPage)
  );

  const paginatedDeliveries = filteredDeliveries.slice(
    (deliveryPage - 1) * deliveriesPerPage,
    deliveryPage * deliveriesPerPage
  );

  /* =======================================================
     ASSIGN DRIVER
  ======================================================= */

  const handleAssign = (
    delivery
  ) => {
    setSelectedDelivery(
      delivery
    );

    setShowAssignModal(
      true
    );
  };

  /* =======================================================
     DRIVER ASSIGNED
  ======================================================= */

  const handleDriverAssigned =
    async (driverId) => {
      if (!selectedDelivery) {
        return;
      }

      try {
        await assignDriver(
          selectedDelivery.id,
          driverId
        );

        alert(
          "Driver assigned successfully."
        );

        setShowAssignModal(
          false
        );

        setSelectedDelivery(
          null
        );

        /*
         * Refresh the Delivery Management
         * page after assignment.
         */
        await refreshDeliveries(
          true
        );

      } catch (err) {
        console.error(
          "Assign driver error:",
          err
        );

        alert(
          err?.message ||
            "Unable to assign driver."
        );
      }
    };

  /* =======================================================
     RESET FILTERS
  ======================================================= */

  const resetFilters = () => {
    setSearch("");
    setStatus("all");
    setDeliveryPage(1);
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="dashboard-page">

      <div className="d-flex">

        <Sidebar />

        <div className="main-content deliveries-main-content">

          <Header />

          {/* =================================================
              PAGE HEADER
          ================================================= */}

          <div className="page-header delivery-page-header mb-3">

            <div className="d-flex align-items-center justify-content-between">

              {/* LEFT */}

              <div className="grow">

                <h2 className="fw-bold mb-1">

                  <i className="bi bi-truck me-2 text-primary"></i>

                  Delivery Management

                </h2>

                <p className="text-muted mb-0">

                  Assign drivers, monitor deliveries,
                  and manage delivery operations.

                </p>

              </div>

              {/* RIGHT */}

              <div className="d-flex align-items-center gap-3 ms-auto">

                <button
                  className="btn btn-primary px-4"
                  onClick={() =>
                    refreshDeliveries(true)
                  }
                  disabled={refreshing}
                >

                  <i className="bi bi-arrow-clockwise me-2"></i>

                  {refreshing
                    ? "Refreshing..."
                    : "Refresh"}

                </button>

              </div>

            </div>

          </div>

          {/* =================================================
              DELIVERY STATISTICS
          ================================================= */}

          <div className="mt-3">

            <DeliveryStats
              stats={stats}
            />

          </div>

          {/* =================================================
              FILTERS
          ================================================= */}

          <DeliveryFilters
            search={search}
            status={status}
            onSearch={(value) => {
              setSearch(value);
              setDeliveryPage(1);
            }}
            onStatusChange={(value) => {
              setStatus(value);
              setDeliveryPage(1);
            }}
            onReset={resetFilters}
          />

          {/* =================================================
              DELIVERY QUEUE
          ================================================= */}

          <div className="card shadow-sm border-0">

            <div className="card-header bg-white">

              <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">

                <div>

                  <h5 className="mb-1 fw-bold">
                    Delivery Queue
                  </h5>

                  <small className="text-muted">
                    View, assign, and monitor all
                    scheduled deliveries.
                  </small>

                </div>

                <span className="badge bg-primary fs-6 px-3 py-2">

                  {filteredDeliveries.length}{" "}

                  Delivery
                  {filteredDeliveries.length !== 1
                    ? "ies"
                    : ""}

                </span>

              </div>

            </div>

            <div className="card-body">

              {/* =================================================
                  LOADING
              ================================================= */}

              {loading ? (

                <div className="text-center py-5">

                  <div
                    className="spinner-border text-primary"
                    style={{
                      width: "3.5rem",
                      height: "3.5rem",
                    }}
                  ></div>

                  <h5 className="mt-4">
                    Loading Deliveries...
                  </h5>

                  <p className="text-muted">
                    Please wait while HydroHub retrieves
                    the latest delivery information.
                  </p>

                </div>

              ) : filteredDeliveries.length === 0 ? (

                /* =================================================
                   EMPTY
                ================================================= */

                <div className="text-center py-5">

                  <i
                    className="bi bi-truck"
                    style={{
                      fontSize: "4rem",
                      color: "#b5b5b5",
                    }}
                  ></i>

                  <h4 className="mt-4">
                    No Deliveries Found
                  </h4>

                  <p className="text-muted">
                    There are currently no deliveries
                    matching your search criteria.
                  </p>

                  <button
                    className="btn btn-outline-primary"
                    onClick={resetFilters}
                  >

                    <i className="bi bi-arrow-clockwise me-2"></i>

                    Reset Filters

                  </button>

                </div>

              ) : (

                /* =================================================
                   TABLE
                ================================================= */

                <>
                  <DeliveriesTable
                    deliveries={paginatedDeliveries}
                    onAssign={handleAssign}
                  />

                  {filteredDeliveries.length > deliveriesPerPage && (
                    <div className="delivery-pagination">
                      <button
                        type="button"
                        onClick={() => setDeliveryPage((page) => Math.max(1, page - 1))}
                        disabled={deliveryPage === 1}
                      >
                        <i className="bi bi-chevron-left me-1" />
                        Previous
                      </button>
                      <span>
                        Page {Math.min(deliveryPage, deliveryPageCount)} of {deliveryPageCount}
                      </span>
                      <button
                        type="button"
                        onClick={() => setDeliveryPage((page) => Math.min(deliveryPageCount, page + 1))}
                        disabled={deliveryPage >= deliveryPageCount}
                      >
                        Next
                        <i className="bi bi-chevron-right ms-1" />
                      </button>
                    </div>
                  )}
                </>

              )}

            </div>

          </div>

          {/* =================================================
              ASSIGN DRIVER MODAL
          ================================================= */}

          <AssignDeliveryModal
            show={
              showAssignModal
            }

            onClose={() => {
              setShowAssignModal(
                false
              );

              setSelectedDelivery(
                null
              );
            }}

            delivery={
              selectedDelivery
            }

            drivers={
              drivers
            }

            orders={
              orders
            }

            onAssign={
              handleDriverAssigned
            }
          />

          <div className="deliveries-footer">
            <Footer />
          </div>

        </div>

      </div>

    </div>
  );
}

export default Deliveries;