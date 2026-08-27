import { useEffect, useState, useCallback } from "react";

import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

import MapStats from "../components/map/MapStats";
import DeliveryMap from "../components/map/DeliveryMap";
import ActiveDeliveries from "../components/map/ActiveDeliveries";
import DeliveryDetails from "../components/map/DeliveryDetails";

import { getActiveDeliveries } from "../services/map.service";

import "../styles/pages/map.css";

function MapMonitoring() {

    const [deliveries, setDeliveries] = useState([]);
    const [selectedDelivery, setSelectedDelivery] = useState(null);

    const [stats, setStats] = useState({
        activeDrivers: 0,
        activeDeliveries: 0,
        waitingOrders: 0,
        completedToday: 0,
    });

    const normalizeStatus = (status = "") => {

        return String(status)
            .trim()
            .toLowerCase()
            .replaceAll("_", " ");

    };

    const loadDeliveries = useCallback(async () => {

        try {

            const data = await getActiveDeliveries();

            // Remove cancelled deliveries
            const activeData = data.filter((delivery) => {

                const status = normalizeStatus(delivery.status);

                return status !== "cancelled";

            });

            setDeliveries(activeData);

            setSelectedDelivery((current) => {

                if (!current) return null;

                return (

                    activeData.find(
                        (delivery) => delivery.id === current.id
                    ) || null

                );

            });

            //----------------------------------
            // Active Drivers
            //----------------------------------

            const activeDrivers = new Set(

                activeData
                    .filter((delivery) => {

                        const status =
                            normalizeStatus(delivery.status);

                        return (

                            delivery.driver &&

                            status !== "delivered"

                        );

                    })
                    .map((delivery) => delivery.driver.id)

            ).size;

            //----------------------------------
            // Active Deliveries
            //----------------------------------

            const activeDeliveries = activeData.filter((delivery) => {

                const status =
                    normalizeStatus(delivery.status);

                return (

                    status === "assigned" ||

                    status === "in transit"

                );

            }).length;

            //----------------------------------
            // Waiting Orders
            //----------------------------------

            const waitingOrders = activeData.filter((delivery) => {

                const status =
                    normalizeStatus(delivery.status);

                return status === "pending";

            }).length;

            //----------------------------------
            // Completed Today
            //----------------------------------

            const completedToday = activeData.filter((delivery) => {

                const status =
                    normalizeStatus(delivery.status);

                return status === "delivered";

            }).length;

            //----------------------------------

            setStats({

                activeDrivers,

                activeDeliveries,

                waitingOrders,

                completedToday,

            });

        } catch (error) {

            console.error(
                "Failed to load deliveries:",
                error
            );

        }

    }, []);

    useEffect(() => {

        let isMounted = true;

        const fetchDeliveries = async () => {

            if (!isMounted) return;

            await loadDeliveries();

        };

        fetchDeliveries();

        const interval = setInterval(
            fetchDeliveries,
            30000
        );

        return () => {

            isMounted = false;

            clearInterval(interval);

        };

    }, [loadDeliveries]);

    return (

        <div className="app-layout">

            <Sidebar />

            <div className="main-content map-monitoring-main-content">

                <Header />

                <main className="container-fluid py-4">

                    {/* ==========================
                        PAGE HEADER
                    ========================== */}

                    <div className="page-title mb-4">

                        <h2>

                            <i className="bi bi-geo-alt-fill text-primary me-2"></i>

                            Delivery Monitoring

                        </h2>

                        <p>

                            Monitor drivers and customer deliveries in real time.

                        </p>

                    </div>

                    {/* ==========================
                        STATISTICS
                    ========================== */}

                    <div className="mb-4">

                        <MapStats stats={stats} />

                    </div>

                    {/* ==========================
                        MAP
                    ========================== */}

                    <div className="row">

                        <div className="col-12">

                            <DeliveryMap
                                deliveries={deliveries}
                            />

                        </div>

                    </div>

                    {/* ==========================
                        ACTIVE DELIVERIES
                    ========================== */}

                    <div className="row mt-4">

                        <div className="col-12">

                            <ActiveDeliveries

                                deliveries={deliveries}

                                selectedDelivery={selectedDelivery}

                                onSelect={setSelectedDelivery}

                            />

                        </div>

                    </div>

                </main>

                <div className="map-monitoring-footer">
                    <Footer />
                </div>

            </div>

            {/* ==========================
                DELIVERY DETAILS MODAL
            ========================== */}

            <DeliveryDetails

                delivery={selectedDelivery}

                onClose={() => setSelectedDelivery(null)}

            />

        </div>

    );

}

export default MapMonitoring;