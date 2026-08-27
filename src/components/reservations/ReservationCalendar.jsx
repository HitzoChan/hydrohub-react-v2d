import {
    getCalendarDays,
} from "../../services/reservations.service";

function ReservationCalendar({
    currentDate,
    selectedDate,
    reservations,
    onDateChange,
    onPreviousMonth,
    onNextMonth,
}) {
    const year =
        currentDate.getFullYear();

    const month =
        currentDate.getMonth();

    const days =
        getCalendarDays(
            year,
            month
        );

    const monthName =
        currentDate.toLocaleDateString(
            "en-US",
            {
                month: "long",
                year: "numeric",
            }
        );


    const selectedKey =
        selectedDate
            .toISOString()
            .slice(0, 10);


    function dateKey(date) {
        return date
            .toISOString()
            .slice(0, 10);
    }


    function hasReservation(
        date
    ) {
        const key =
            dateKey(date);

        return reservations.some(
            (reservation) =>
                reservation
                    .scheduled_date ===
                key
        );
    }


    return (
        <div className="reservation-calendar">

            <div className="reservation-calendar-header">

                <button
                    type="button"
                    onClick={
                        onPreviousMonth
                    }
                    aria-label="Previous month"
                >
                    <i className="bi bi-chevron-left" />
                </button>

                <strong>
                    {monthName}
                </strong>

                <button
                    type="button"
                    onClick={
                        onNextMonth
                    }
                    aria-label="Next month"
                >
                    <i className="bi bi-chevron-right" />
                </button>

            </div>


            <div className="reservation-calendar-weekdays">

                {[
                    "Sun",
                    "Mon",
                    "Tue",
                    "Wed",
                    "Thu",
                    "Fri",
                    "Sat",
                ].map(
                    (day) => (
                        <span
                            key={day}
                        >
                            {day}
                        </span>
                    )
                )}

            </div>


            <div className="reservation-calendar-grid">

                {days.map(
                    (
                        date,
                        index
                    ) => {

                        if (!date) {
                            return (
                                <span
                                    key={`empty-${index}`}
                                    className="calendar-empty"
                                />
                            );
                        }

                        const key =
                            dateKey(
                                date
                            );

                        const isSelected =
                            key ===
                            selectedKey;

                        const isToday =
                            key ===
                            new Date()
                                .toISOString()
                                .slice(
                                    0,
                                    10
                                );

                        const hasBookings =
                            hasReservation(
                                date
                            );

                        return (
                            <button
                                type="button"
                                key={key}
                                className={`
                                    reservation-calendar-day
                                    ${
                                        isSelected
                                            ? "selected"
                                            : ""
                                    }
                                    ${
                                        isToday
                                            ? "today"
                                            : ""
                                    }
                                `}
                                onClick={() =>
                                    onDateChange(
                                        date
                                    )
                                }
                            >

                                <span>
                                    {
                                        date.getDate()
                                    }
                                </span>

                                {hasBookings && (
                                    <i className="reservation-calendar-dot" />
                                )}

                            </button>
                        );
                    }
                )}

            </div>

        </div>
    );
}

export default ReservationCalendar;