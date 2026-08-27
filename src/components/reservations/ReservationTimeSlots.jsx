import {
    formatTime,
} from "../../services/reservations.service";

function ReservationTimeSlots({
    reservations = [],
    selectedTime = "",
    onSelectTime,
}) {
    const slots = {};

    reservations.forEach(
        (reservation) => {
            const time =
                reservation.scheduled_time ||
                "Unscheduled";

            if (!slots[time]) {
                slots[time] = 0;
            }

            slots[time]++;
        }
    );


    const sortedSlots =
        Object.entries(
            slots
        ).sort(
            ([a], [b]) =>
                a.localeCompare(b)
        );


    if (sortedSlots.length === 0) {
        return (
            <div className="reservation-empty-small">
                <i className="bi bi-clock" />

                <span>
                    No reservations
                    scheduled.
                </span>
            </div>
        );
    }


    return (
        <div className="reservation-time-slots">

            {sortedSlots.map(
                ([
                    time,
                    count,
                ]) => (
                    <button
                        type="button"
                        key={time}
                        className={`reservation-time-slot ${
                            selectedTime === time
                                ? "selected"
                                : ""
                        }`}
                        onClick={() =>
                            onSelectTime?.(
                                selectedTime === time
                                    ? ""
                                    : time
                            )
                        }
                    >

                        <div>
                            <strong>
                                {formatTime(
                                    time
                                )}
                            </strong>

                            <span>
                                {count}{" "}
                                {count === 1
                                    ? "booking"
                                    : "bookings"}
                            </span>
                        </div>

                        <i className="bi bi-chevron-right" />

                    </button>
                )
            )}

        </div>
    );
}

export default ReservationTimeSlots;