function MapLegend() {
    return (
        <div className="map-legend">

            <div className="legend-item">
                <span className="legend-driver">
                    🚚
                </span>

                <span>
                    Driver
                </span>
            </div>

            <div className="legend-item">
                <span className="legend-customer">
                    🏠
                </span>

                <span>
                    Customer
                </span>
            </div>

            <div className="legend-item">
                <span className="legend-route"></span>

                <span>
                    Delivery Route
                </span>
            </div>

        </div>
    );
}

export default MapLegend;