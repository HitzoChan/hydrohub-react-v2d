import { useEffect, useRef } from "react";
import L from "leaflet";
import { reverseGeocode } from "../../utils/geocode";
import "leaflet/dist/leaflet.css";

const CATBALOGAN_CENTER = [11.775, 124.886];

function isValidCoordinate(value, minimum, maximum) {
    if (value === "" || value === null || value === undefined) {
        return false;
    }

    const number = Number(value);
    return Number.isFinite(number) && number >= minimum && number <= maximum;
}

const locationIcon = L.divIcon({
    className: "reservation-location-marker",
    html: '<div class="reservation-location-pin"><i class="bi bi-geo-alt-fill" /></div>',
    iconSize: [34, 42],
    iconAnchor: [17, 42],
});

export default function ReservationLocationPicker({
    latitude,
    longitude,
    onLocationChange,
}) {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const initialLatitudeRef = useRef(latitude);
    const initialLongitudeRef = useRef(longitude);
    const onLocationChangeRef = useRef(onLocationChange);

    useEffect(() => {
        onLocationChangeRef.current = onLocationChange;
    }, [onLocationChange]);

    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return undefined;

        const hasInitialLocation =
            isValidCoordinate(initialLatitudeRef.current, -90, 90) &&
            isValidCoordinate(initialLongitudeRef.current, -180, 180);

        const initialLocation = hasInitialLocation
            ? [Number(initialLatitudeRef.current), Number(initialLongitudeRef.current)]
            : CATBALOGAN_CENTER;

        const map = L.map(mapContainerRef.current, {
            zoomControl: true,
        }).setView(initialLocation, 13);

        const openStreetMapLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; OpenStreetMap contributors",
            maxZoom: 19,
        }).addTo(map);

        const fallbackLayer = L.tileLayer(
            "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
            {
                attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
                maxZoom: 19,
            }
        );

        let tileErrorCount = 0;
        openStreetMapLayer.on("tileerror", () => {
            tileErrorCount += 1;

            if (tileErrorCount >= 2 && !map.hasLayer(fallbackLayer)) {
                map.removeLayer(openStreetMapLayer);
                fallbackLayer.addTo(map);
            }
        });

        const setMarker = async (event) => {
            const nextLatitude = Number(event.latlng.lat.toFixed(6));
            const nextLongitude = Number(event.latlng.lng.toFixed(6));

            if (markerRef.current) {
                markerRef.current.setLatLng(event.latlng);
            } else {
                markerRef.current = L.marker(event.latlng, { icon: locationIcon }).addTo(map);
            }

            onLocationChangeRef.current({
                latitude: nextLatitude,
                longitude: nextLongitude,
                address: "Loading selected address...",
            });

            const address = await reverseGeocode(nextLatitude, nextLongitude);
            onLocationChangeRef.current({
                latitude: nextLatitude,
                longitude: nextLongitude,
                address,
            });
        };

        map.on("click", setMarker);
        mapRef.current = map;

        if (hasInitialLocation) {
            markerRef.current = L.marker(initialLocation, { icon: locationIcon }).addTo(map);
        }

        const resizeTimers = [100, 500, 1000].map((delay) =>
            window.setTimeout(() => map.invalidateSize(), delay)
        );

        return () => {
            resizeTimers.forEach((timer) => window.clearTimeout(timer));
            map.remove();
            mapRef.current = null;
            markerRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (
            !mapRef.current ||
            !isValidCoordinate(latitude, -90, 90) ||
            !isValidCoordinate(longitude, -180, 180)
        ) {
            return;
        }

        const location = [Number(latitude), Number(longitude)];
        mapRef.current.setView(location, Math.max(mapRef.current.getZoom(), 15));

        if (markerRef.current) {
            markerRef.current.setLatLng(location);
        } else {
            markerRef.current = L.marker(location, { icon: locationIcon }).addTo(mapRef.current);
        }
    }, [latitude, longitude]);

    return (
        <div className="reservation-location-picker">
            <div className="reservation-location-picker-header">
                <div>
                    <strong>Pin delivery location</strong>
                    <span>Click the map where the customer wants the delivery.</span>
                </div>
                {latitude && longitude && (
                    <span className="reservation-location-coordinates">
                        {Number(latitude).toFixed(5)}, {Number(longitude).toFixed(5)}
                    </span>
                )}
            </div>
            <div
                ref={mapContainerRef}
                className="reservation-location-map"
                style={{ width: "100%", height: "420px" }}
            />
        </div>
    );
}