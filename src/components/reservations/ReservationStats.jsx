function ReservationStats({
    stats,
}) {
    const cards = [
        {
            label: "Today's Bookings",
            value:
                stats?.todayBookings || 0,
            icon: "bi-calendar-check",
            className:
                "reservation-stat-blue",
        },
        {
            label: "Confirmed",
            value:
                stats?.confirmed || 0,
            icon: "bi-check-circle",
            className:
                "reservation-stat-green",
        },
        {
            label: "Pending",
            value:
                stats?.pending || 0,
            icon: "bi-clock",
            className:
                "reservation-stat-orange",
        },
        {
            label: "Total Gallons",
            value:
                stats?.totalContainers || 0,
            icon: "bi-droplet",
            className:
                "reservation-stat-purple",
        },
    ];

    return (
        <div className="reservation-stats-grid">

            {cards.map((card) => (
                <div
                    key={card.label}
                    className="reservation-stat-card"
                >

                    <div
                        className={`reservation-stat-icon ${card.className}`}
                    >
                        <i
                            className={`bi ${card.icon}`}
                        />
                    </div>

                    <div className="reservation-stat-content">

                        <span>
                            {card.label}
                        </span>

                        <strong>
                            {card.value}
                        </strong>

                    </div>

                </div>
            ))}

        </div>
    );
}

export default ReservationStats;