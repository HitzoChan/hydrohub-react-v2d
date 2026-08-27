import {
    formatTime,
} from "../../services/reservations.service";

function TodayReservations({
    reservations = [],
}) {
    if (
        reservations.length === 0
    ) {
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
        <div className="today-reservations-list">

            {reservations
                .slice(0, 5)
                .map(
                    (reservation) => (
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
                                    {
                                        reservation.gallons
                                    }{" "}
                                    Gallons
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
                    )
                )}

            {reservations.length >
                5 && (
                <div className="today-reservation-more">
                    +
                    {reservations.length -
                        5}{" "}
                    more reservations
                </div>
            )}

        </div>
    );
}

export default TodayReservations;