import { useEffect, useRef } from "react";
import L from "leaflet";

import LiveBadge from "./LiveBadge";
import MapLegend from "./MapLegend";

import "leaflet/dist/leaflet.css";

/* ==========================================
   DRIVER PIN
========================================== */

const driverIcon = L.divIcon({
    className: "driver-marker",
    html: `
        <div class="map-pin driver-pin">
            <i class="bi bi-truck"></i>
        </div>
    `,
    iconSize: [34, 44],
    iconAnchor: [17, 44],
    popupAnchor: [0, -40],
});

/* ==========================================
   CUSTOMER PIN
========================================== */

const customerIcon = L.divIcon({
    className: "customer-marker",
    html: `
        <div class="map-pin customer-pin">
            <i class="bi bi-house-fill"></i>
        </div>
    `,
    iconSize: [34, 44],
    iconAnchor: [17, 44],
    popupAnchor: [0, -40],
});

function escapePopupValue(value) {
    return String(value ?? "--").replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
    })[character]);
}

function DeliveryMap({ deliveries = [] }) {

    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);

    const markersRef = useRef([]);
    const routesRef = useRef([]);

    /* ==========================================
       CREATE MAP
    ========================================== */

    useEffect(() => {

        if (!mapContainerRef.current || mapRef.current) return;

        const map = L.map(mapContainerRef.current, {
            zoomControl: true,
        }).setView([11.775, 124.886], 13);

        L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
                attribution: "&copy; OpenStreetMap contributors",
                maxZoom: 19,
            }
        ).addTo(map);

        mapRef.current = map;

        setTimeout(() => {
            map.invalidateSize();
        }, 100);

        return () => {
            map.remove();
            mapRef.current = null;
        };

    }, []);

    /* ==========================================
       DRAW MARKERS & ROUTES
    ========================================== */

    useEffect(() => {

        if (!mapRef.current) return;

        const map = mapRef.current;

        console.log("========== DELIVERY MAP ==========");
        console.log("Deliveries received:", deliveries);

        markersRef.current.forEach(marker => {
            if (map.hasLayer(marker)) {
                map.removeLayer(marker);
            }
        });

        routesRef.current.forEach(route => {
            if (map.hasLayer(route)) {
                map.removeLayer(route);
            }
        });

        markersRef.current = [];
        routesRef.current = [];

        const bounds = [];

        deliveries.forEach((delivery, index) => {

            console.log(`Delivery #${index + 1}`, delivery);

            const driverLat = Number(delivery.driver_lat);
            const driverLng = Number(delivery.driver_lng);

            const customerLat = Number(delivery.customer_lat);
            const customerLng = Number(delivery.customer_lng);

            console.table({
                status: delivery.status,
                driverLat,
                driverLng,
                customerLat,
                customerLng,
            });

            /* ======================================
            VALIDATE PHILIPPINE COORDINATES
            ====================================== */

            const hasValidDriverLocation =
                !isNaN(driverLat) &&
                !isNaN(driverLng) &&
                driverLat > 5 &&
                driverLat < 21 &&
                driverLng > 116 &&
                driverLng < 127;

            const hasValidCustomerLocation =
                !isNaN(customerLat) &&
                !isNaN(customerLng) &&
                customerLat > 5 &&
                customerLat < 21 &&
                customerLng > 116 &&
                customerLng < 127;

            console.log("Driver Valid:", hasValidDriverLocation);
            console.log("Customer Valid:", hasValidCustomerLocation);

            /* ======================================
            DRIVER MARKER
            ====================================== */

            if (hasValidDriverLocation) {

                const driverPopup = `
                    <div class="popup-card">

                        <h6 class="popup-title">
                            🚚 Driver Information
                        </h6>

                        <table class="popup-table">

                            <tr>
                                <td><strong>Driver</strong></td>
                                <td>${delivery.driver?.name ?? "Unassigned"}</td>
                            </tr>

                            <tr>
                                <td><strong>Status</strong></td>
                                <td>${delivery.status ?? "--"}</td>
                            </tr>

                            <tr>
                                <td><strong>Customer</strong></td>
                                <td>${delivery.customer_name ?? "--"}</td>
                            </tr>

                            <tr>
                                <td><strong>ETA</strong></td>
                                <td>${delivery.eta ?? "--"}</td>
                            </tr>

                        </table>

                    </div>
                `;

                const marker = L.marker(
                    [driverLat, driverLng],
                    {
                        icon: driverIcon,
                    }
                )
                    .addTo(map)
                    .bindPopup(driverPopup);

                markersRef.current.push(marker);

                bounds.push([driverLat, driverLng]);

            }

            /* ======================================
            CUSTOMER MARKER
            ====================================== */

            if (hasValidCustomerLocation) {

                const customerName = delivery.customer_name || "Customer";
                const customerAvatar = delivery.customer_avatar_url
                    ? `<img class="popup-customer-avatar" src="${escapePopupValue(delivery.customer_avatar_url)}" alt="">`
                    : `<span class="popup-customer-avatar popup-customer-avatar-fallback">${escapePopupValue(customerName.charAt(0).toUpperCase())}</span>`;
                const status = String(delivery.status || "--").replaceAll("_", " ");

                const customerPopup = `
                    <div class="popup-card">

                        <div class="popup-customer-heading">
                            ${customerAvatar}
                            <div class="popup-customer-identity">
                                <strong>${escapePopupValue(customerName)}</strong>
                                <span>Customer profile</span>
                            </div>
                        </div>

                        <table class="popup-table">

                            <tr>
                                <td><strong>Product</strong></td>
                                <td>${escapePopupValue(delivery.product_name || "Water")}</td>
                            </tr>

                            <tr>
                                <td><strong>Size</strong></td>
                                <td>${escapePopupValue(delivery.capacity || "--")}</td>
                            </tr>

                            <tr>
                                <td><strong>Containers</strong></td>
                                <td>${escapePopupValue(delivery.gallons ?? "--")}</td>
                            </tr>

                            <tr>
                                <td><strong>Address</strong></td>
                                <td class="popup-address">${escapePopupValue(delivery.address || "--")}</td>
                            </tr>

                            <tr>
                                <td><strong>Payment</strong></td>
                                <td>${escapePopupValue(delivery.payment_method || "Cash")}</td>
                            </tr>

                            <tr>
                                <td><strong>Status</strong></td>
                                <td><span class="popup-status">${escapePopupValue(status)}</span></td>
                            </tr>

                        </table>

                    </div>
                `;

                const marker = L.marker(
                    [customerLat, customerLng],
                    {
                        icon: customerIcon,
                    }
                )
                    .addTo(map)
                    .bindPopup(customerPopup);

                markersRef.current.push(marker);

                bounds.push([customerLat, customerLng]);

            }

            /* ======================================
            ROUTE
            ====================================== */

            if (
                hasValidDriverLocation &&
                hasValidCustomerLocation
            ) {

                const outline = L.polyline(
                    [
                        [driverLat, driverLng],
                        [customerLat, customerLng],
                    ],
                    {
                        color: "#ffffff",
                        weight: 8,
                        opacity: 1,
                        lineCap: "round",
                        lineJoin: "round",
                    }
                ).addTo(map);

                const route = L.polyline(
                    [
                        [driverLat, driverLng],
                        [customerLat, customerLng],
                    ],
                    {
                        color: "#2563eb",
                        weight: 5,
                        opacity: 0.95,
                        dashArray: "10 8",
                        lineCap: "round",
                        lineJoin: "round",
                    }
                ).addTo(map);

                routesRef.current.push(outline);
                routesRef.current.push(route);

            }

        });

        if (bounds.length > 0) {

            map.fitBounds(bounds, {
                padding: [60, 60],
                maxZoom: 17,
            });

        } else {

            console.warn("No valid markers found.");

            map.setView([11.775, 124.886], 13);

        }

        setTimeout(() => {
            map.invalidateSize();
        }, 100);

    }, [deliveries]);
        return (

        <div className="card shadow-sm map-card">

            <div className="card-header map-card-header">

                <div className="d-flex justify-content-between align-items-center">

                    <div>

                        <h5 className="mb-1">

                            <i className="bi bi-map-fill text-primary me-2"></i>

                            Live Delivery Map

                        </h5>

                        <small className="text-muted">

                            Track all active deliveries in real time.

                        </small>

                    </div>

                    <LiveBadge />

                </div>

            </div>

            <div className="card-body p-0">

                <div
                    ref={mapContainerRef}
                    className="delivery-map"
                    style={{
                        width: "100%",
                        height: "420px",
                    }}
                />

            </div>

            <div className="card-footer bg-white">

                <MapLegend />

            </div>

        </div>

    );

}

export default DeliveryMap;