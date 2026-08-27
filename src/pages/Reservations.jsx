import {
    useEffect,
    useMemo,
    useState,
} from "react";

import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

import ReservationStats from "../components/reservations/ReservationStats";
import ReservationCalendar from "../components/reservations/ReservationCalendar";
import ReservationTimeSlots from "../components/reservations/ReservationTimeSlots";
import TodayReservations from "../components/reservations/TodayReservations";
import ReservationsTable from "../components/reservations/ReservationsTable";
import NewReservationModal from "../components/reservations/NewReservationModal";

import {
    getReservations,
    calculateReservationStats,
    getReservationsForDate,
    getAvailableDrivers,
    assignDriver,
    cancelReservation,
    createReservation,
} from "../services/reservations.service";

import "../styles/pages/reservations.css";


function Reservations() {

    const [
        reservations,
        setReservations,
    ] = useState([]);


    const [
        loading,
        setLoading,
    ] = useState(true);


    const [
        error,
        setError,
    ] = useState("");


    const [
        selectedDate,
        setSelectedDate,
    ] = useState(
        new Date()
    );


    const [
        currentMonth,
        setCurrentMonth,
    ] = useState(
        new Date()
    );


    const [
        search,
        setSearch,
    ] = useState("");


    const [
        statusFilter,
        setStatusFilter,
    ] = useState("all");


    const [
        selectedReservation,
        setSelectedReservation,
    ] = useState(null);


    const [
        selectedTime,
        setSelectedTime,
    ] = useState("");


    const [
        showDriverModal,
        setShowDriverModal,
    ] = useState(false);


    const [
        drivers,
        setDrivers,
    ] = useState([]);


    const [
        assigning,
        setAssigning,
    ] = useState(false);


    const [
        showNewReservation,
        setShowNewReservation,
    ] = useState(false);


    /*
     |--------------------------------------------------------------------------
     | Load Reservations
     |--------------------------------------------------------------------------
     */

    async function loadReservations() {

        try {

            setLoading(true);
            setError("");

            const data =
                await getReservations();

            setReservations(
                data
            );

        } catch (err) {

            console.error(
                err
            );

            setError(
                err?.message ||
                    "Failed to load reservations."
            );

        } finally {

            setLoading(false);

        }
    }


    useEffect(() => {
        loadReservations();
    }, []);


    /*
     |--------------------------------------------------------------------------
     | Statistics
     |--------------------------------------------------------------------------
     */

    const stats =
        useMemo(
            () =>
                calculateReservationStats(
                    reservations,
                    selectedDate
                ),
            [
                reservations,
                selectedDate,
            ]
        );


    /*
     |--------------------------------------------------------------------------
     | Selected Date Reservations
     |--------------------------------------------------------------------------
     */

    const selectedDateReservations =
        useMemo(
            () =>
                getReservationsForDate(
                    reservations,
                    selectedDate
                ),
            [
                reservations,
                selectedDate,
            ]
        );


    const visibleDateReservations =
        useMemo(
            () =>
                selectedTime
                    ? selectedDateReservations.filter(
                        (reservation) =>
                            reservation.scheduled_time ===
                            selectedTime
                    )
                    : selectedDateReservations,
            [
                selectedDateReservations,
                selectedTime,
            ]
        );


    /*
     |--------------------------------------------------------------------------
     | Search / Status Filter
     |--------------------------------------------------------------------------
     */

    const filteredReservations =
        useMemo(
            () => {

                const searchValue =
                    search
                        .toLowerCase()
                        .trim();

                return reservations.filter(
                    (reservation) => {

                        const matchesSearch =
                            !searchValue ||
                            reservation
                                .customer_name
                                .toLowerCase()
                                .includes(
                                    searchValue
                                ) ||
                            reservation
                                .driver_name
                                .toLowerCase()
                                .includes(
                                    searchValue
                                ) ||
                            reservation
                                .address
                                .toLowerCase()
                                .includes(
                                    searchValue
                                );


                        const matchesStatus =
                            statusFilter ===
                                "all" ||
                            reservation.status ===
                                statusFilter;


                        return (
                            matchesSearch &&
                            matchesStatus
                        );
                    }
                );

            },
            [
                reservations,
                search,
                statusFilter,
            ]
        );


    /*
     |--------------------------------------------------------------------------
     | Month Navigation
     |--------------------------------------------------------------------------
     */

    function previousMonth() {

        setCurrentMonth(
            (previous) =>
                new Date(
                    previous.getFullYear(),
                    previous.getMonth() - 1,
                    1
                )
        );
    }


    function nextMonth() {

        setCurrentMonth(
            (previous) =>
                new Date(
                    previous.getFullYear(),
                    previous.getMonth() + 1,
                    1
                )
        );
    }


    /*
     |--------------------------------------------------------------------------
     | Assign Driver
     |--------------------------------------------------------------------------
     */

    async function handleOpenAssignDriver(
        reservation
    ) {

        try {

            const available =
                await getAvailableDrivers();

            setDrivers(
                available
            );

            setSelectedReservation(
                reservation
            );

            setShowDriverModal(
                true
            );

        } catch (err) {

            alert(
                err?.message ||
                    "Unable to load drivers."
            );
        }
    }


    async function handleAssignDriver(
        driverId
    ) {

        if (
            !selectedReservation ||
            !driverId
        ) {
            return;
        }

        try {

            setAssigning(
                true
            );

            await assignDriver(
                selectedReservation.id,
                driverId
            );

            setShowDriverModal(
                false
            );

            setSelectedReservation(
                null
            );

            await loadReservations();

        } catch (err) {

            alert(
                err?.message ||
                    "Failed to assign driver."
            );

        } finally {

            setAssigning(
                false
            );

        }
    }


    /*
     |--------------------------------------------------------------------------
     | Cancel Reservation
     |--------------------------------------------------------------------------
     */

    async function handleCancel(
        reservation
    ) {

        const confirmed =
            window.confirm(
                `Cancel the reservation for ${reservation.customer_name}?`
            );

        if (!confirmed) {
            return;
        }

        try {

            await cancelReservation(
                reservation.id
            );

            await loadReservations();

        } catch (err) {

            alert(
                err?.message ||
                    "Failed to cancel reservation."
            );
        }
    }


    async function handleCreateReservation(form) {
        await createReservation(form);
        setShowNewReservation(false);
        setSelectedDate(new Date(`${form.scheduledDate}T00:00:00`));
        setCurrentMonth(new Date(`${form.scheduledDate}T00:00:00`));
        await loadReservations();
    }


    return (
        <div className="hydrohub-layout">

            <Sidebar />


            <div className="main-content reservations-main-content">

                <Header />


                <main className="reservations-page">

                    {/* ==================================================
                        HEADER
                    ================================================== */}

                    <div className="reservations-page-header">

                        <div>

                            <h1>
                                Delivery Scheduling
                            </h1>

                            <p>
                                Schedule and manage
                                customer delivery
                                reservations.
                            </p>

                        </div>


                        <button
                            type="button"
                            className="reservation-new-button"
                            onClick={() => setShowNewReservation(true)}
                        >
                            <i className="bi bi-plus-lg" />

                            New Reservation
                        </button>

                    </div>


                    {/* ==================================================
                        ERROR
                    ================================================== */}

                    {error && (
                        <div className="reservation-error">

                            <i className="bi bi-exclamation-circle" />

                            <span>
                                {error}
                            </span>

                            <button
                                type="button"
                                onClick={
                                    loadReservations
                                }
                            >
                                Retry
                            </button>

                        </div>
                    )}


                    {/* ==================================================
                        STATS
                    ================================================== */}

                    <ReservationStats
                        stats={stats}
                    />


                    {/* ==================================================
                        SEARCH / FILTER
                    ================================================== */}

                    <div className="reservation-toolbar">

                        <div className="reservation-search">

                            <i className="bi bi-search" />

                            <input
                                type="text"
                                placeholder="Search customer, driver, or address..."
                                value={search}
                                onChange={(event) =>
                                    setSearch(
                                        event.target.value
                                    )
                                }
                            />

                        </div>


                        <select
                            value={
                                statusFilter
                            }
                            onChange={(event) =>
                                setStatusFilter(
                                    event.target.value
                                )
                            }
                            className="reservation-status-filter"
                        >

                            <option value="all">
                                All Status
                            </option>

                            <option value="pending">
                                Pending
                            </option>

                            <option value="confirmed">
                                Confirmed
                            </option>

                            <option value="assigned">
                                Assigned
                            </option>

                            <option value="on_the_way">
                                On The Way
                            </option>

                            <option value="delivered">
                                Delivered
                            </option>

                            <option value="cancelled">
                                Cancelled
                            </option>

                        </select>


                        <button
                            type="button"
                            className="reservation-refresh-button"
                            onClick={
                                loadReservations
                            }
                            disabled={
                                loading
                            }
                        >
                            <i className="bi bi-arrow-clockwise" />

                            Refresh
                        </button>

                    </div>


                    {/* ==================================================
                        SCHEDULE AREA
                    ================================================== */}

                    <div className="reservation-schedule-grid">

                        {/* CALENDAR */}

                        <section className="reservation-panel">

                            <div className="reservation-panel-header">

                                <div>

                                    <h2>
                                        Calendar
                                    </h2>

                                    <p>
                                        Select a date
                                        to view its
                                        scheduled
                                        deliveries.
                                    </p>

                                </div>

                            </div>


                            <ReservationCalendar
                                currentDate={
                                    currentMonth
                                }
                                selectedDate={
                                    selectedDate
                                }
                                reservations={
                                    reservations
                                }
                                onDateChange={
                                    setSelectedDate
                                }
                                onPreviousMonth={
                                    previousMonth
                                }
                                onNextMonth={
                                    nextMonth
                                }
                            />

                        </section>


                        {/* TIME SLOTS */}

                        <section className="reservation-panel">

                            <div className="reservation-panel-header">

                                <div>

                                    <h2>
                                        Time Slots
                                    </h2>

                                    <p>
                                        {
                                            selectedDate.toLocaleDateString(
                                                "en-US",
                                                {
                                                    month: "short",
                                                    day: "numeric",
                                                }
                                            )
                                        }
                                    </p>

                                </div>

                            </div>


                            <ReservationTimeSlots
                                reservations={
                                    selectedDateReservations
                                }
                                selectedTime={
                                    selectedTime
                                }
                                onSelectTime={
                                    setSelectedTime
                                }
                            />

                        </section>


                        {/* TODAY / SELECTED DATE */}

                        <section className="reservation-panel">

                            <div className="reservation-panel-header">

                                <div>

                                    <h2>
                                        Scheduled
                                        Deliveries
                                    </h2>

                                    <p>
                                        {
                                            selectedDate.toLocaleDateString(
                                                "en-US",
                                                {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric",
                                                }
                                            )
                                        }
                                    </p>

                                </div>

                            </div>


                            <TodayReservations
                                reservations={
                                    visibleDateReservations
                                }
                            />

                        </section>

                    </div>


                    {/* ==================================================
                        ALL RESERVATIONS
                    ================================================== */}

                    <section className="reservation-panel reservation-table-panel">

                        <div className="reservation-panel-header">

                            <div>

                                <h2>
                                    All Reservations
                                </h2>

                                <p>
                                    {
                                        filteredReservations.length
                                    }{" "}
                                    scheduled
                                    reservations
                                </p>

                            </div>

                        </div>


                        {loading ? (

                            <div className="reservation-loading">

                                <div className="reservation-spinner" />

                                <span>
                                    Loading
                                    reservations...
                                </span>

                            </div>

                        ) : (

                            <ReservationsTable
                                reservations={
                                    filteredReservations
                                }
                                onAssignDriver={
                                    handleOpenAssignDriver
                                }
                                onCancel={
                                    handleCancel
                                }
                            />

                        )}

                    </section>


                    {showNewReservation && (
                        <NewReservationModal
                            onClose={() => setShowNewReservation(false)}
                            onCreated={handleCreateReservation}
                        />
                    )}


                    {/* ==================================================
                        DRIVER MODAL
                    ================================================== */}

                    {showDriverModal && (
                        <div
                            className="reservation-modal-overlay"
                            onMouseDown={(event) => {

                                if (
                                    event.target ===
                                    event.currentTarget
                                ) {
                                    setShowDriverModal(
                                        false
                                    );
                                }

                            }}
                        >

                            <div className="reservation-modal">

                                <div className="reservation-modal-header">

                                    <div>

                                        <h2>
                                            Assign Driver
                                        </h2>

                                        <p>
                                            Select a delivery
                                            personnel for{" "}
                                            <strong>
                                                {
                                                    selectedReservation?.customer_name
                                                }
                                            </strong>
                                        </p>

                                    </div>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowDriverModal(
                                                false
                                            )
                                        }
                                    >
                                        ×
                                    </button>

                                </div>


                                <div className="reservation-driver-list">

                                    {drivers.length ===
                                    0 ? (

                                        <div className="reservation-empty-small">

                                            <i className="bi bi-person-x" />

                                            <span>
                                                No drivers
                                                available.
                                            </span>

                                        </div>

                                    ) : (

                                        drivers.map(
                                            (
                                                driver
                                            ) => (
                                                <button
                                                    key={
                                                        driver.id
                                                    }
                                                    type="button"
                                                    className="reservation-driver-option"
                                                    onClick={() =>
                                                        handleAssignDriver(
                                                            driver.id
                                                        )
                                                    }
                                                    disabled={
                                                        assigning
                                                    }
                                                >

                                                    <div className="reservation-driver-avatar">
                                                        {driver.name
                                                            ?.charAt(
                                                                0
                                                            )
                                                            .toUpperCase()}
                                                    </div>

                                                    <div>

                                                        <strong>
                                                            {
                                                                driver.name
                                                            }
                                                        </strong>

                                                        <span>
                                                            {
                                                                driver.driver_status ||
                                                                driver.status ||
                                                                "Available"
                                                            }
                                                        </span>

                                                    </div>

                                                    <i className="bi bi-chevron-right" />

                                                </button>
                                            )
                                        )

                                    )}

                                </div>

                            </div>

                        </div>
                    )}

                </main>


                <div className="reservations-footer">
                    <Footer />
                </div>

            </div>

        </div>
    );
}

export default Reservations;