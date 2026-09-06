function MapStats({ stats }) {

    const cards = [
        {
            title: "Active Drivers",
            value: stats.activeDrivers,
            subtitle: "Online Drivers",
            icon: "bi-truck",
            color: "success",
            bg: "bg-success-subtle",
        },
        {
            title: "Active Deliveries",
            value: stats.activeDeliveries,
            subtitle: "On The Road",
            icon: "bi-box-seam",
            color: "primary",
            bg: "bg-primary-subtle",
        },
        {
            title: "Waiting Orders",
            value: stats.waitingOrders,
            subtitle: "Pending Orders",
            icon: "bi-hourglass-split",
            color: "warning",
            bg: "bg-warning-subtle",
        },
        {
            title: "Completed Today",
            value: stats.completedToday,
            subtitle: "Successfully Delivered",
            icon: "bi-check-circle",
            color: "success",
            bg: "bg-success-subtle",
        },
    ];

    return (

        <div className="row g-4 mb-4 map-stats-grid">

            {cards.map((card) => (

                <div
                    key={card.title}
                    className="col-6 col-xl-3 col-lg-6 col-md-6 map-stat-col"
                >

                    <div className="map-stat-card h-100">

                        <div className="map-stat-content">

                            <h2 className="map-stat-value">

                                {card.value}

                            </h2>

                            <span
                                className={`map-stat-subtitle text-${card.color}`}
                            >

                                {card.subtitle}

                            </span>

                        </div>

                        <div className="map-stat-visual">

                            <div
                                className={`map-stat-icon ${card.bg}`}
                            >

                                <i
                                    className={`bi ${card.icon} text-${card.color}`}
                                ></i>

                            </div>

                            <p className="map-stat-title">

                                {card.title}

                            </p>

                        </div>

                    </div>

                </div>

            ))}

        </div>

    );

}

export default MapStats;