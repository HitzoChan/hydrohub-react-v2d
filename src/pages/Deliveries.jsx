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

import "../styles/pages/deliveries.css";

function Deliveries() {

  const [deliveries, setDeliveries] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [orders, setOrders] = useState([]);

  const [selectedDelivery, setSelectedDelivery] =
    useState(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const [loading, setLoading] = useState(true);

  const [showAssignModal, setShowAssignModal] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  const [lastUpdated, setLastUpdated] =
    useState(null);

  //------------------------------------------

  const refreshDeliveries = async (
    silent = false
  ) => {

    try {

      if (!silent) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const data =
        await getDeliveries();

      setDeliveries(data.deliveries);
      setDrivers(data.drivers);
      setOrders(data.orders);

      setLastUpdated(new Date());

    } catch (err) {

      console.error(err);

      alert(
        "Unable to load deliveries."
      );

    } finally {

      setLoading(false);
      setRefreshing(false);

    }

  };

  //------------------------------------------

useEffect(() => {
  let mounted = true;

  const loadDeliveries = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const data = await getDeliveries();

      if (!mounted) return;

      setDeliveries(data.deliveries);
      setDrivers(data.drivers);
      setOrders(data.orders);
      setLastUpdated(new Date());

    } catch (err) {
      console.error(err);

      if (mounted) {
        alert("Unable to load deliveries.");
      }

    } finally {
      if (mounted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  loadDeliveries();

  const interval = setInterval(() => {
    loadDeliveries(true);
  }, 30000);

  return () => {
    mounted = false;
    clearInterval(interval);
  };
}, []);

  //------------------------------------------

  const stats = useMemo(() => {

    return getDeliveryStats(
      deliveries
    );

  }, [deliveries]);

  //------------------------------------------

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

  //------------------------------------------

  const handleAssign =
    (delivery) => {

      setSelectedDelivery(
        delivery
      );

      setShowAssignModal(
        true
      );

    };

  //------------------------------------------

  const handleDriverAssigned =
    async (driverId) => {

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

        refreshDeliveries(true);

      } catch (err) {

        console.error(err);

        alert(
          err.message
        );

      }

    };

  //------------------------------------------

  return (

    <div className="dashboard-page">

      <div className="d-flex">

        <Sidebar />

        <div className="main-content">

          <Header />

{/* PAGE HEADER */}

<div className="page-header mb-3">

  <div className="d-flex align-items-center justify-content-between">

    {/* LEFT */}
    <div className="grow">

      <h2 className="fw-bold mb-1">
        <i className="bi bi-truck me-2 text-primary"></i>
        Delivery Management
      </h2>

      <p className="text-muted mb-0">
        Assign drivers, monitor deliveries, and manage delivery operations.
      </p>

    </div>

    {/* RIGHT */}
    <div className="d-flex align-items-center gap-3 ms-auto">

      {lastUpdated && (
        <div className="text-end">

          <small className="text-muted d-block">
            Updated
          </small>

          <strong>
            {lastUpdated.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </strong>

        </div>
      )}

      <button
        className="btn btn-primary px-4"
        onClick={() => refreshDeliveries(true)}
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

                    {/* DELIVERY STATISTICS */}

          <div className="mt-3">
                <DeliveryStats stats={stats} />
            </div>

          {/* FILTERS */}

          <DeliveryFilters
            search={search}
            status={status}
            onSearch={setSearch}
            onStatusChange={setStatus}
            onReset={() => {
              setSearch("");
              setStatus("all");
            }}
          />

          {/* DELIVERY TABLE */}

          <div className="card shadow-sm border-0">

            <div className="card-header bg-white">

              <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">

                <div>

                  <h5 className="mb-1 fw-bold">

                    Delivery Queue

                  </h5>

                  <small className="text-muted">

                    View, assign, and monitor all scheduled deliveries.

                  </small>

                </div>

                <span className="badge bg-primary fs-6 px-3 py-2">

                  {filteredDeliveries.length} Delivery
                  {filteredDeliveries.length !== 1 ? "ies" : ""}

                </span>

              </div>

            </div>

            <div className="card-body">

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
                    onClick={() => {
                      setSearch("");
                      setStatus("all");
                    }}
                  >

                    Reset Filters

                  </button>

                </div>

              ) : (

                <DeliveriesTable
                  deliveries={filteredDeliveries}
                  onAssign={handleAssign}
                />

              )}

            </div>

          </div>

          {/* ASSIGN DRIVER MODAL */}

          <AssignDeliveryModal
            show={showAssignModal}
            onClose={() => {
              setShowAssignModal(false);
              setSelectedDelivery(null);
            }}
            delivery={selectedDelivery}
            drivers={drivers}
            orders={orders}
            onAssign={handleDriverAssigned}
          />

          <Footer />

        </div>

      </div>

    </div>

  );
}

export default Deliveries;