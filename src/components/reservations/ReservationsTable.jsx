import {
    formatCurrency,
    formatLongDate,
    formatTime,
} from "../../services/reservations.service";

function ReservationsTable({
    reservations = [],
    onAssignDriver,
    onCancel,
}) {
    if (
        reservations.length === 0
    ) {
        return (
            <div className="reservation-table-empty">

                <div className="reservation-empty-icon">
                    <i className="bi bi-calendar-event" />
                </div>

                <h3>
                    No reservations
                    found
                </h3>

                <p>
                    There are no scheduled
                    reservations matching
                    the current selection.
                </p>

            </div>
        );
    }


    return (
        <div className="reservation-table-wrapper">

            <table className="reservation-table">

                <thead>
                    <tr>

                        <th>
                            Customer
                        </th>

                        <th>
                            Product
                        </th>

                        <th>
                            Containers
                        </th>

                        <th>
                            Exchange
                        </th>

                        <th>
                            Schedule
                        </th>

                        <th>
                            Driver
                        </th>

                        <th>
                            Status
                        </th>

                        <th>
                            Amount
                        </th>

                        <th>
                            Actions
                        </th>

                    </tr>
                </thead>


                <tbody>

                    {reservations.map(
                        (reservation) => {

                            const exchange =
                                reservation
                                    .exchange_containers ||
                                0;

                            return (
                                <tr
                                    key={
                                        reservation.id
                                    }
                                >

                                    <td>

                                        <div className="reservation-customer">

                                            <div className="reservation-customer-avatar">
                                                {reservation
                                                    .customer_name
                                                    .charAt(
                                                        0
                                                    )
                                                    .toUpperCase()}
                                            </div>

                                            <div>

                                                <strong>
                                                    {
                                                        reservation.customer_name
                                                    }
                                                </strong>

                                                <span>
                                                    {
                                                        reservation.address ||
                                                        "No address"
                                                    }
                                                </span>

                                            </div>

                                        </div>

                                    </td>


                                    <td>

                                        <div className="reservation-product">

                                            <strong>
                                                {reservation.product_name || "Water"}
                                            </strong>

                                            <span>
                                                {reservation.capacity || "Size unavailable"}
                                            </span>

                                        </div>

                                    </td>


                                    <td>

                                        <strong>
                                            {
                                                reservation.gallons
                                            }
                                        </strong>

                                        <span className="table-subtext">
                                            containers
                                        </span>

                                    </td>


                                    <td>

                                        {exchange >
                                        0 ? (
                                            <span className="exchange-badge">
                                                {exchange}{" "}
                                                returned
                                            </span>
                                        ) : (
                                            <span className="no-exchange">
                                                None
                                            </span>
                                        )}

                                    </td>


                                    <td>

                                        <div className="reservation-schedule">

                                            <strong>
                                                {formatLongDate(
                                                    reservation.scheduled_date
                                                )}
                                            </strong>

                                            <span>
                                                {formatTime(
                                                    reservation.scheduled_time
                                                )}
                                            </span>

                                        </div>

                                    </td>


                                    <td>

                                        <div className="reservation-driver">

                                            <i className="bi bi-person-circle" />

                                            <span>
                                                {
                                                    reservation.driver_name
                                                }
                                            </span>

                                        </div>

                                    </td>


                                    <td>

                                        <span
                                            className={`reservation-status status-${reservation.status}`}
                                        >
                                            {reservation.status.replace(
                                                "_",
                                                " "
                                            )}
                                        </span>

                                    </td>


                                    <td>

                                        <strong>
                                            {formatCurrency(
                                                reservation.total_price
                                            )}
                                        </strong>

                                    </td>


                                    <td>

                                        <div className="reservation-actions">
                                            {!reservation.driver_id &&
                                                reservation.status !==
                                                    "cancelled" && (
                                                    <button
                                                        type="button"
                                                        title="Assign driver"
                                                        onClick={() =>
                                                            onAssignDriver?.(
                                                                reservation
                                                            )
                                                        }
                                                    >
                                                        <i className="bi bi-person-plus" />
                                                    </button>
                                                )}


                                            {reservation.status !==
                                                "cancelled" &&
                                                reservation.status !==
                                                    "delivered" && (
                                                    <button
                                                        type="button"
                                                        className="danger"
                                                        title="Cancel reservation"
                                                        onClick={() =>
                                                            onCancel?.(
                                                                reservation
                                                            )
                                                        }
                                                    >
                                                        <i className="bi bi-x-lg" />
                                                    </button>
                                                )}

                                        </div>

                                    </td>

                                </tr>
                            );
                        }
                    )}

                </tbody>

            </table>

        </div>
    );
}

export default ReservationsTable;