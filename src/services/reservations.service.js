import { supabase } from "./supabase";

/*
|--------------------------------------------------------------------------
| HydroHub Reservation Service
|--------------------------------------------------------------------------
|
| Reservation workflow:
|
| Customer
|    ↓
| Scheduled Order
|    ↓
| Future Reservation
|    ↓
| Scheduled Date + Period Arrives
|    ↓
| Due for Delivery
|    ↓
| Admin Assigns Driver
|    ↓
| Assigned
|    ↓
| On The Way
|    ↓
| Delivered
|
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| A future reservation is NOT an active delivery.
|
| Example:
|
| Today: August 25
| Reservation: August 26 Morning
|
| It stays as a future reservation on August 25.
|
| On August 26 during the Morning period:
|
|     Due for Delivery
|
| Only then can the admin assign a driver.
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| Normalize Order Status
|--------------------------------------------------------------------------
*/

export function normalizeStatus(status = "") {
    const value = String(status || "")
        .toLowerCase()
        .trim();

    switch (value) {
        case "pending":
            return "pending";

        case "assigned":
        case "ready":
        case "ready_for_delivery":
        case "ready for delivery":
            return "assigned";

        case "on_the_way":
        case "on the way":
        case "in_transit":
        case "in transit":
        case "in_progress":
        case "in progress":
            return "on_the_way";

        case "completed":
        case "delivered":
            return "delivered";

        case "cancelled":
        case "canceled":
            return "cancelled";

        default:
            return value || "pending";
    }
}


/*
|--------------------------------------------------------------------------
| Normalize Reservation Status
|--------------------------------------------------------------------------
*/

export function normalizeReservationStatus(status = "") {
    const value = String(status || "")
        .toLowerCase()
        .trim();

    switch (value) {
        case "pending":
            return "pending";

        case "scheduled":
            return "scheduled";

        case "due":
        case "due_for_delivery":
        case "due for delivery":
            return "due";

        case "confirmed":
            return "confirmed";

        case "completed":
        case "delivered":
            return "completed";

        case "cancelled":
        case "canceled":
            return "cancelled";

        default:
            return value || "scheduled";
    }
}


/*
|--------------------------------------------------------------------------
| Normalize Schedule Period
|--------------------------------------------------------------------------
|
| Customer schedule:
|
| Morning
| Afternoon
| Evening
|
|--------------------------------------------------------------------------
*/

export function normalizeSchedulePeriod(period = "") {
    const value = String(period || "")
        .toLowerCase()
        .trim();

    if (value.includes("morning")) {
        return "morning";
    }

    if (value.includes("afternoon")) {
        return "afternoon";
    }

    if (value.includes("evening")) {
        return "evening";
    }

    return "";
}


/*
|--------------------------------------------------------------------------
| Get Schedule Period
|--------------------------------------------------------------------------
|
| Supports several possible field names.
|
|--------------------------------------------------------------------------
*/

export function getSchedulePeriod(order) {
    return normalizeSchedulePeriod(
        order?.scheduled_period ||
        order?.schedule_period ||
        order?.delivery_period ||
        order?.time_period ||
        order?.scheduled_slot ||
        order?.time_slot ||
        order?.delivery_slot ||
        ""
    );
}


/*
|--------------------------------------------------------------------------
| Format Date Key
|--------------------------------------------------------------------------
*/

export function formatDateKey(date) {
    if (!date) {
        return "";
    }

    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


/*
|--------------------------------------------------------------------------
| Parse Date
|--------------------------------------------------------------------------
*/

export function parseDate(value) {
    if (!value) {
        return null;
    }

    if (value instanceof Date) {
        return Number.isNaN(value.getTime())
            ? null
            : value;
    }

    const raw = String(value).trim();

    if (!raw) {
        return null;
    }

    /*
    | YYYY-MM-DD
    |
    | Parse locally so timezone conversion
    | does not shift the selected date.
    */

    const ymdMatch = raw.match(
        /^(\d{4})-(\d{1,2})-(\d{1,2})$/
    );

    if (ymdMatch) {
        const year = Number(ymdMatch[1]);

        const month =
            Number(ymdMatch[2]) - 1;

        const day = Number(ymdMatch[3]);

        const date = new Date(
            year,
            month,
            day
        );

        return Number.isNaN(date.getTime())
            ? null
            : date;
    }

    const parsed = new Date(value);

    return Number.isNaN(parsed.getTime())
        ? null
        : parsed;
}


/*
|--------------------------------------------------------------------------
| Get Scheduled Date
|--------------------------------------------------------------------------
*/

export function getScheduledDate(order) {
    return (
        order?.scheduled_date ||
        order?.schedule_date ||
        order?.delivery_date ||
        ""
    );
}


/*
|--------------------------------------------------------------------------
| Get Today's Date
|--------------------------------------------------------------------------
*/

export function getTodayDate() {
    return formatDateKey(new Date());
}


/*
|--------------------------------------------------------------------------
| Get Current Delivery Period
|--------------------------------------------------------------------------
|
| Default windows:
|
| Morning   = before 12:00 PM
| Afternoon = 12:00 PM - 5:59 PM
| Evening   = 6:00 PM onward
|
| Change these later if the station has
| official delivery hours.
|
|--------------------------------------------------------------------------
*/

function getScheduledDateTime(order) {
    const date = parseDate(getScheduledDate(order));

    if (!date) {
        return null;
    }

    const time = String(order?.scheduled_time || "")
        .trim()
        .match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(AM|PM))?$/i);

    if (!time) {
        return null;
    }

    let hours = Number(time[1]);
    const minutes = Number(time[2]);
    const seconds = Number(time[3] || 0);
    const meridiem = time[4]?.toUpperCase();

    if (
        minutes > 59 ||
        seconds > 59 ||
        hours > (meridiem ? 12 : 23)
    ) {
        return null;
    }

    if (meridiem) {
        if (hours === 12) {
            hours = 0;
        }

        if (meridiem === "PM") {
            hours += 12;
        }
    }

    date.setHours(hours, minutes, seconds, 0);

    return date;
}


export function getCurrentPeriod(date = new Date()) {
    const hour = date.getHours();

    if (hour < 12) {
        return "morning";
    }

    if (hour < 18) {
        return "afternoon";
    }

    return "evening";
}


/*
|--------------------------------------------------------------------------
| Check Whether Reservation Is Due
|--------------------------------------------------------------------------
|
| A scheduled order is due only when:
|
| 1. delivery_type = scheduled
| 2. not cancelled
| 3. not delivered
| 4. scheduled date = today
| 5. customer's period = current period
|
|--------------------------------------------------------------------------
*/

export function isReservationDue(
    order,
    now = new Date()
) {
    if (!order) {
        return false;
    }

    /*
    | Only scheduled orders.
    */

    if (
        String(order.delivery_type || "")
            .toLowerCase()
            .trim() !== "scheduled"
    ) {
        return false;
    }

    /*
    | Reservation status.
    */

    const reservationStatus =
        normalizeReservationStatus(
            order.reservation_status
        );

    if (
        reservationStatus === "cancelled" ||
        reservationStatus === "completed"
    ) {
        return false;
    }

    /*
    | Already delivered.
    */

    if (
        normalizeStatus(order.status) ===
        "delivered"
    ) {
        return false;
    }

    /*
    | Already cancelled.
    */

    if (
        normalizeStatus(order.status) ===
        "cancelled"
    ) {
        return false;
    }

    /*
     * An order that already has a driver is no longer waiting
     * to become due for assignment.
     */
    if (order.driver_id) {
        return false;
    }

    /*
    | Scheduled date.
    */

    const scheduledDateTime =
        getScheduledDateTime(order);

    if (!scheduledDateTime) {
        return false;
    }

    return scheduledDateTime <= now;
}


/*
|--------------------------------------------------------------------------
| Get Reservation State
|--------------------------------------------------------------------------
|
| Returns:
|
| future
| due
| assigned
| on_the_way
| delivered
| cancelled
| unknown
|
|--------------------------------------------------------------------------
*/

export function getReservationState(
    order,
    now = new Date()
) {
    if (!order) {
        return "unknown";
    }

    const status = normalizeStatus(
        order.status
    );

    if (status === "cancelled") {
        return "cancelled";
    }

    if (status === "delivered") {
        return "delivered";
    }

    if (status === "on_the_way") {
        return "on_the_way";
    }

    /*
    | If driver is already assigned.
    */

    if (order.driver_id) {
        return "assigned";
    }

    /*
    | Check whether it is due.
    */

    if (
        isReservationDue(
            order,
            now
        )
    ) {
        return "due";
    }

    /*
    | Otherwise it is still a future reservation.
    */

    return "future";
}


/*
|--------------------------------------------------------------------------
| Normalize Reservation
|--------------------------------------------------------------------------
*/

export function normalizeReservation(order) {
    const orderStatus = normalizeStatus(order?.status);
    const storedReservationStatus =
        normalizeReservationStatus(
            order?.reservation_status ||
            "scheduled"
        );
    const reservationStatus =
        orderStatus === "delivered"
            ? "completed"
            : orderStatus === "cancelled"
                ? "cancelled"
                : orderStatus === "assigned" || orderStatus === "on_the_way"
                    ? "confirmed"
                : storedReservationStatus;

    const schedulePeriod =
        getSchedulePeriod(order);

    return {
        ...order,

        id: order?.id || "",

        customer_id:
            order?.customer_id || null,

        customer_name:
            order?.customer_name ||
            "Unknown Customer",

        address:
            order?.address || "",

        gallons:
            Number(order?.gallons) || 0,

        total_price:
            Number(order?.total_price) || 0,

        delivery_type:
            order?.delivery_type || "",

        scheduled_date:
            getScheduledDate(order),

        scheduled_time:
            order?.scheduled_time || "",

        schedule_period:
            schedulePeriod,

        reservation_status:
            reservationStatus,

        status:
            orderStatus,

        driver_id:
            order?.driver_id || null,

        product_name:
            order?.product_name || "Water",

        capacity:
            order?.capacity || "",

        exchange_required:
            Boolean(
                order?.exchange_required
            ),

        exchange_containers:
            Number(
                order?.exchange_containers
            ) || 0,

        new_containers:
            Number(
                order?.new_containers
            ) || 0,

        borrow_containers:
            Number(
                order?.borrow_containers
            ) || 0,
    };
}


/*
|--------------------------------------------------------------------------
| Get Reservations
|--------------------------------------------------------------------------
|
| Loads all scheduled orders.
|
|--------------------------------------------------------------------------
*/

export async function getReservations() {
    const {
        data,
        error,
    } = await supabase
        .from("orders")
        .select("*")
        .eq(
            "delivery_type",
            "scheduled"
        )
        .order(
            "scheduled_date",
            {
                ascending: true,
            }
        )
        .order(
            "scheduled_time",
            {
                ascending: true,
            }
        );

    if (error) {
        console.error(
            "[Reservations] Failed to load reservations:",
            error
        );

        throw error;
    }

    const reservations = (
        data || []
    ).map(
        normalizeReservation
    );

    /*
    | Load driver names.
    */

    const driverIds = [
        ...new Set(
            reservations
                .map(
                    (reservation) =>
                        reservation.driver_id
                )
                .filter(Boolean)
        ),
    ];

    let employees = [];

    if (driverIds.length > 0) {
        const {
            data: employeeData,
            error: employeeError,
        } = await supabase
            .from("employees")
            .select(
                `
                    id,
                    name,
                    role,
                    status,
                    driver_status
                `
            )
            .in(
                "id",
                driverIds
            );

        if (employeeError) {
            console.error(
                "[Reservations] Failed to load drivers:",
                employeeError
            );
        } else {
            employees =
                employeeData || [];
        }
    }

    const employeeMap = new Map();

    employees.forEach(
        (employee) => {
            employeeMap.set(
                String(employee.id),
                employee
            );
        }
    );

    return reservations.map(
        (reservation) => {
            const employee =
                employeeMap.get(
                    String(
                        reservation.driver_id
                    )
                );

            const state =
                getReservationState(
                    reservation
                );

            return {
                ...reservation,

                driver_name:
                    employee?.name ||
                    "Unassigned",

                driver_role:
                    employee?.role || "",

                driver_status:
                    employee?.driver_status ||
                    employee?.status ||
                    "",

                reservation_state:
                    state,

                is_due:
                    state === "due",

                is_future:
                    state === "future",
            };
        }
    );
}


/*
|--------------------------------------------------------------------------
| Get Due Reservations
|--------------------------------------------------------------------------
|
| These are scheduled orders that are due
| for delivery now and have no driver.
|
|--------------------------------------------------------------------------
*/

export async function getDueReservations(
    now = new Date()
) {
    const reservations =
        await getReservations();

    return reservations.filter(
        (reservation) =>
            isReservationDue(
                reservation,
                now
            ) &&
            !reservation.driver_id
    );
}


/*
|--------------------------------------------------------------------------
| Get Future Reservations
|--------------------------------------------------------------------------
*/

export async function getFutureReservations(
    now = new Date()
) {
    const reservations =
        await getReservations();

    return reservations.filter(
        (reservation) => {
            const state =
                getReservationState(
                    reservation,
                    now
                );

            return (
                state === "future" &&
                !reservation.driver_id
            );
        }
    );
}


/*
|--------------------------------------------------------------------------
| Get Today's Reservations
|--------------------------------------------------------------------------
*/

export async function getTodayReservations(
    now = new Date()
) {
    const todayKey =
        formatDateKey(now);

    const reservations =
        await getReservations();

    return reservations.filter(
        (reservation) =>
            getScheduledDate(
                reservation
            ) === todayKey
    );
}


/*
|--------------------------------------------------------------------------
| Get Reservations For Date
|--------------------------------------------------------------------------
*/

export function getReservationsForDate(
    reservations = [],
    date = new Date()
) {
    const dateKey =
        formatDateKey(
            date instanceof Date
                ? date
                : parseDate(date)
        );

    if (!dateKey) {
        return [];
    }

    return reservations.filter(
        (reservation) =>
            getScheduledDate(
                reservation
            ) === dateKey
    );
}


/*
|--------------------------------------------------------------------------
| Get Reservations By Period
|--------------------------------------------------------------------------
*/

export async function getReservationsByPeriod(
    period,
    date = new Date()
) {
    const normalizedPeriod =
        normalizeSchedulePeriod(
            period
        );

    const dateKey =
        formatDateKey(date);

    const reservations =
        await getReservations();

    return reservations.filter(
        (reservation) =>
            getScheduledDate(
                reservation
            ) === dateKey &&
            reservation.schedule_period ===
                normalizedPeriod
    );
}


/*
|--------------------------------------------------------------------------
| Calculate Reservation Statistics
|--------------------------------------------------------------------------
|
| Used by Reservations.jsx.
|
| Returns:
|
| todayBookings
| confirmed
| pending
| totalContainers
| totalReservations
|
|--------------------------------------------------------------------------
*/

export function calculateReservationStats(
    reservations = [],
    now = new Date()
) {
    const todayKey =
        formatDateKey(now);

    /*
    | Today's scheduled reservations.
    */

    const todayReservations =
        reservations.filter(
            (reservation) =>
                getScheduledDate(
                    reservation
                ) === todayKey
        );

    /*
    | Confirmed reservations.
    */

    const confirmed =
        reservations.filter(
            (reservation) =>
                normalizeReservationStatus(
                    reservation.reservation_status
                ) === "confirmed"
        );

    /*
    | Pending / scheduled reservations.
    |
    | "scheduled" is included because a new
    | future reservation normally has this state.
    */

    const pending =
        reservations.filter(
            (reservation) => {
                const status =
                    normalizeReservationStatus(
                        reservation.reservation_status
                    );

                return (
                    status === "pending" ||
                    status === "scheduled"
                );
            }
        );

    /*
    | Total gallons/containers.
    */

    const totalContainers =
        reservations.reduce(
            (total, reservation) => {
                return (
                    total +
                    (
                        Number(
                            reservation.gallons
                        ) || 0
                    )
                );
            },
            0
        );

    return {
        todayBookings:
            todayReservations.length,

        confirmed:
            confirmed.length,

        pending:
            pending.length,

        totalContainers,

        totalReservations:
            reservations.length,
    };
}


/*
|--------------------------------------------------------------------------
| Get Available Drivers
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| This function DOES NOT automatically assign
| a driver.
|
| It only loads drivers for the admin assignment UI.
|
|--------------------------------------------------------------------------
*/

export async function getAvailableDrivers() {
    const {
        data,
        error,
    } = await supabase
        .from("employees")
        .select(
            `
                id,
                name,
                role,
                status,
                driver_status
            `
        )
        .or(
            "role.eq.Driver,role.eq.driver"
        )
        .order(
            "name",
            {
                ascending: true,
            }
        );

    if (error) {
        console.error(
            "[Reservations] Failed to load drivers:",
            error
        );

        throw error;
    }

    return data || [];
}


/*
|--------------------------------------------------------------------------
| Assign Driver
|--------------------------------------------------------------------------
|
| A driver can ONLY be assigned when the
| reservation is currently due.
|
|--------------------------------------------------------------------------
*/

export async function assignDriver(
    reservationId,
    driverId
) {
    if (!reservationId) {
        throw new Error(
            "Reservation ID is required."
        );
    }

    if (!driverId) {
        throw new Error(
            "Driver ID is required."
        );
    }

    /*
    | Load reservation.
    */

    const {
        data: reservation,
        error: reservationError,
    } = await supabase
        .from("orders")
        .select(
            `
                id,
                customer_name,
                gallons,
                delivery_type,
                reservation_status,
                status,
                driver_id,
                scheduled_date,
                scheduled_time,
                scheduled_period
            `
        )
        .eq(
            "id",
            reservationId
        )
        .single();

    if (reservationError) {
        console.error(
            "[Reservations] Failed to load reservation:",
            reservationError
        );

        throw reservationError;
    }

    const normalized =
        normalizeReservation(
            reservation
        );

    /*
    | Only scheduled orders.
    */

    if (
        String(
            normalized.delivery_type || ""
        )
            .toLowerCase()
            .trim() !== "scheduled"
    ) {
        throw new Error(
            "Only scheduled orders can be assigned from Reservations."
        );
    }

    /*
    | Reservation must be due.
    */

    if (
        !isReservationDue(
            normalized
        )
    ) {
        throw new Error(
            "This reservation is not due for delivery yet."
        );
    }

    /*
    | Prevent duplicate assignment.
    */

    if (normalized.driver_id) {
        throw new Error(
            "A driver is already assigned to this reservation."
        );
    }

    /*
    | Verify selected driver.
    */

    const {
        data: driver,
        error: driverError,
    } = await supabase
        .from("employees")
        .select(
            `
                id,
                name,
                role,
                status,
                driver_status
            `
        )
        .eq(
            "id",
            driverId
        )
        .maybeSingle();

    if (driverError) {
        console.error(
            "[Reservations] Failed to verify driver:",
            driverError
        );

        throw driverError;
    }

    if (!driver) {
        throw new Error(
            "Selected driver was not found."
        );
    }

    /*
    | Verify role.
    */

    if (
        String(
            driver.role || ""
        )
            .trim()
            .toLowerCase() !==
        "driver"
    ) {
        throw new Error(
            "Selected employee is not a driver."
        );
    }

    /*
    | Assign driver.
    |
    | reservation_status → confirmed
    | status → assigned
    */

    const {
        data,
        error,
    } = await supabase
        .from("orders")
        .update({
            driver_id:
                driverId,

            reservation_status:
                "confirmed",

            status:
                "assigned",
        })
        .eq(
            "id",
            reservationId
        )
        .is(
            "driver_id",
            null
        )
        .select("*")
        .single();

    if (error) {
        console.error(
            "[Reservations] Driver assignment failed:",
            error
        );

        throw error;
    }

    return {
        ...normalizeReservation(data),

        driver_name:
            driver.name,

        reservation_state:
            "assigned",

        is_due:
            true,

        is_future:
            false,
    };
}


/*
|--------------------------------------------------------------------------
| Cancel Reservation
|--------------------------------------------------------------------------
*/

export async function cancelReservation(
    reservationId
) {
    if (!reservationId) {
        throw new Error(
            "Reservation ID is required."
        );
    }

    const {
        data,
        error,
    } = await supabase
        .from("orders")
        .update({
            reservation_status:
                "cancelled",

            status:
                "cancelled",
        })
        .eq(
            "id",
            reservationId
        )
        .select("*")
        .single();

    if (error) {
        console.error(
            "[Reservations] Failed to cancel reservation:",
            error
        );

        throw error;
    }

    return normalizeReservation(
        data
    );
}


/*
|--------------------------------------------------------------------------
| Calendar Days
|--------------------------------------------------------------------------
*/

export function getCalendarDays(
    year,
    month
) {
    const firstDay =
        new Date(
            year,
            month,
            1
        );

    const lastDay =
        new Date(
            year,
            month + 1,
            0
        );

    const daysInMonth =
        lastDay.getDate();

    const startOffset =
        firstDay.getDay();

    const days = [];

    /*
    | Empty cells before first day.
    */

    for (
        let index = 0;
        index < startOffset;
        index++
    ) {
        days.push(null);
    }

    /*
    | Actual days.
    */

    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {
        days.push(
            new Date(
                year,
                month,
                day
            )
        );
    }

    return days;
}


/*
|--------------------------------------------------------------------------
| Format Time
|--------------------------------------------------------------------------
*/

export function formatTime(time) {
    if (!time) {
        return "";
    }

    const [
        hours,
        minutes,
    ] = String(time).split(":");

    const hour = Number(hours);

    if (!Number.isFinite(hour)) {
        return time;
    }

    const suffix =
        hour >= 12
            ? "PM"
            : "AM";

    const displayHour =
        hour % 12 || 12;

    return `${displayHour}:${
        minutes || "00"
    } ${suffix}`;
}


/*
|--------------------------------------------------------------------------
| Format Currency
|--------------------------------------------------------------------------
*/

export function formatCurrency(value) {
    return new Intl.NumberFormat(
        "en-PH",
        {
            style: "currency",
            currency: "PHP",
            minimumFractionDigits: 2,
        }
    ).format(
        Number(value) || 0
    );
}


/*
|--------------------------------------------------------------------------
| Format Long Date
|--------------------------------------------------------------------------
*/

export function formatLongDate(date) {
    if (!date) {
        return "";
    }

    return new Date(
        `${date}T00:00:00`
    ).toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric",
        }
    );
}


/*
|--------------------------------------------------------------------------
| Create Reservation
|--------------------------------------------------------------------------
*/

export async function createReservation({
    customerId = null,
    customerType = "existing",
    customerName,
    customerPhone = "",
    exchange_containers = 0,
    new_containers = 0,
    borrow_containers = 0,
    locationAddress = "",
    latitude = null,
    longitude = null,
    address = "",
    province = "",
    city = "",
    barangay = "",
    street = "",
    gallons,
    productId = null,
    productName = "",
    capacity = "",
    basePrice = 0,
    totalPrice = 0,
    paymentMethod = "COD",
    scheduledDate,
    scheduledTime,
}) {
    if (!customerName?.trim()) {
        throw new Error("Customer name is required.");
    }

    if (customerType === "walkin" && !customerPhone?.trim()) {
        throw new Error("Walk-in customer phone is required.");
    }

    if (!scheduledDate || !scheduledTime) {
        throw new Error("A reservation date and time are required.");
    }

    const quantity = Number(gallons);

    if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new Error("Gallons must be greater than zero.");
    }

    const composedAddress = locationAddress || [
        address,
        street,
        barangay,
        city,
        province,
    ]
        .filter(Boolean)
        .join(", ")
        .replace(/,\s*,/g, ",")
        .replace(/\s{2,}/g, " ")
        .trim();

    const resolvedBasePrice = Number(basePrice || 0);
    const computedTotal = Number(totalPrice) ||
        (Number.isFinite(resolvedBasePrice) && resolvedBasePrice > 0
            ? quantity * resolvedBasePrice
            : 0);

    const normalizedPaymentMethod = String(paymentMethod || "COD")
        .trim()
        .toLowerCase();
    const paymentMethodMap = {
        cash: "Cash",
        cod: "COD",
        gcash: "GCash",
    };
    const resolvedPaymentMethod = paymentMethodMap[normalizedPaymentMethod];

    if (!resolvedPaymentMethod) {
        throw new Error("Select a valid payment method.");
    }

    let resolvedCustomerId = customerId;

    if (!resolvedCustomerId && customerType !== "walkin") {
        const { data: profile, error: profileError } = await supabase
            .from("customer_profiles")
            .select("id, user_id, name")
            .ilike("name", customerName.trim())
            .limit(1)
            .maybeSingle();

        if (profileError) {
            throw profileError;
        }

        resolvedCustomerId = profile?.user_id || profile?.id || null;
    }

    if (!resolvedCustomerId && customerType !== "walkin") {
        throw new Error(
            "Select an existing customer account or choose Walk-in customer."
        );
    }

    const { data: settings, error: settingsError } = await supabase
        .from("system_settings")
        .select("max_active_orders_per_customer")
        .limit(1)
        .maybeSingle();

    if (settingsError && settingsError.code !== "42703") {
        throw settingsError;
    }

    const orderLimit = Math.max(
        1,
        Number(settings?.max_active_orders_per_customer) || 3
    );

    let existingOrders = [];
    let ordersError = null;

    if (resolvedCustomerId) {
        const result = await supabase
            .from("orders")
            .select("status, reservation_status")
            .eq("customer_id", resolvedCustomerId);

        existingOrders = result.data || [];
        ordersError = result.error;
    }

    if (ordersError) {
        throw ordersError;
    }

    const pendingStatuses = new Set([
        "pending",
        "scheduled",
    ]);

    const activeOrderCount = (existingOrders || []).filter((order) => {
        const statuses = [
            order.status,
            order.reservation_status,
        ].map((status) => String(status || "").trim().toLowerCase());

        return statuses.some((status) => pendingStatuses.has(status));
    }).length;

    if (activeOrderCount >= orderLimit) {
        throw new Error(
            `This customer already has ${orderLimit} active orders. ` +
            "The station must accept one of the existing orders before placing another."
        );
    }

    const { data, error } = await supabase
        .from("orders")
        .insert({
            customer_id: resolvedCustomerId,
            customer_name: customerName.trim(),
            customer_phone: customerPhone.trim() || null,
            exchange_containers: Number(exchange_containers) || 0,
            new_containers: Number(new_containers) || 0,
            borrow_containers: Number(borrow_containers) || 0,
            with_exchange: Number(exchange_containers) > 0,
            borrow_status: Number(borrow_containers) > 0 ? "requested" : "none",
            borrow_notes: null,
            exchange_required: Number(exchange_containers) > 0,
            latitude: Number.isFinite(Number(latitude)) ? Number(latitude) : null,
            longitude: Number.isFinite(Number(longitude)) ? Number(longitude) : null,
            payment_method: resolvedPaymentMethod,
            payment_status:
                resolvedPaymentMethod === "Cash"
                    ? "Paid"
                    : "Pending",
            address: composedAddress || address.trim(),
            gallons: quantity,
            product_id: productId || null,
            product_name: productName?.trim() || "",
            capacity: capacity || "",
            base_price: resolvedBasePrice,
            total_price: Number(computedTotal.toFixed(2)),
            delivery_type: "scheduled",
            reservation_status: "pending",
            status: "pending",
            scheduled_date: scheduledDate,
            scheduled_time: scheduledTime,
        })
        .select("*")
        .single();

    if (error) {
        console.error(
            "[Reservations] Failed to create reservation:",
            error
        );

        throw error;
    }

    return normalizeReservation(data);
}