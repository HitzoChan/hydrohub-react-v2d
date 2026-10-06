import {
    formatTime,
} from "../../services/reservations.service";

function TodayReservations({
    reservations = [],
}) {
    const groups = [
        {
            key: "pending",
            label: "Pending",
            icon: "bi-clock",
            className: "pending",
            statuses: ["pending", "scheduled"],
        },
        {
            key: "assigned",
            label: "Assigned / In Transit",
            icon: "bi-truck",
            className: "assigned",
            statuses: ["assigned", "on_the_way", "on the way", "in_transit"],
        },
        {
            key: "completed",
            label: "Completed",
            icon: "bi-check-circle",
            className: "completed",
            statuses: ["completed", "delivered"],
        },
    ].map((group) => ({
        ...group,
        reservations: reservations.filter((reservation) =>
            group.statuses.includes(
                String(reservation.status || reservation.reservation_status || "")
                    .trim()
                    .toLowerCase()
            )
        ),
    }));

    if (reservations.length === 0) {
        return (
            <div className="reservation-empty-small">

                <i className="bi bi-calendar2-x" />

                <span>
                    No reservations
                    for this date.
                </span>

            </div>
        );
    }


    return (
        <div className="reservation-status-groups">
            {groups.map((group) => (
                <section
                    key={group.key}
                    className={`reservation-status-group ${group.className}`}
                >
                    <div className="reservation-status-group-header">
                        <strong>
                            <i className={`bi ${group.icon}`} />
                            {group.label}
                        </strong>
                        <span>{group.reservations.length}</span>
                    </div>

                    {group.reservations.length === 0 ? (
                        <p className="reservation-status-group-empty">No reservations</p>
                    ) : (
                        group.reservations.map((reservation) => (
                        <div
                            key={
                                reservation.id
                            }
                            className="today-reservation"
                        >

                            <div className="today-reservation-time">

                                {formatTime(
                                    reservation.scheduled_time
                                )}

                            </div>

                            <div className="today-reservation-info">

                                <strong>
                                    {
                                        reservation.customer_name
                                    }
                                </strong>

                                <span>
                                    {reservation.product_name || "Water"} · {reservation.capacity || "Size unavailable"}
                                </span>

                                <span>
                                    {
                                        reservation.gallons
                                    }{" "}
                                    Containers
                                </span>

                            </div>

                            <span
                                className={`reservation-status status-${reservation.status}`}
                            >
                                {
                                    reservation.status
                                }
                            </span>

                        </div>
                        ))
                    )}
                </section>
            ))}
        </div>
    );
}

export default TodayReservations;