import { supabase } from "./supabase";

/*
|--------------------------------------------------------------------------
| HydroHub Orders Service
|--------------------------------------------------------------------------
|
| Order workflow:
|
| NORMAL ORDER
|     ↓
| pending
|     ↓
| assigned
|     ↓
| on_the_way
|     ↓
| delivered
|
|
| SCHEDULED ORDER
|     ↓
| Future Reservation
|     ↓
| Scheduled Date + Period
|     ↓
| Due for Delivery
|     ↓
| Admin Assigns Driver
|     ↓
| assigned
|     ↓
| on_the_way
|     ↓
| delivered
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| Normalize Order Status
|--------------------------------------------------------------------------
*/

export function normalizeStatus(
  status = ""
) {
  const value = String(
    status || ""
  )
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

export function normalizeReservationStatus(
  status = ""
) {
  const value = String(
    status || ""
  )
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
| Customer can choose:
|
| Morning
| Afternoon
| Evening
|
|--------------------------------------------------------------------------
*/

export function normalizeSchedulePeriod(
  period = ""
) {
  const value = String(
    period || ""
  )
    .toLowerCase()
    .trim();

  if (
    value.includes(
      "morning"
    )
  ) {
    return "morning";
  }

  if (
    value.includes(
      "afternoon"
    )
  ) {
    return "afternoon";
  }

  if (
    value.includes(
      "evening"
    )
  ) {
    return "evening";
  }

  return "";
}


/*
|--------------------------------------------------------------------------
| Get Schedule Period
|--------------------------------------------------------------------------
*/

export function getSchedulePeriod(
  order
) {
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
| Get Scheduled Date
|--------------------------------------------------------------------------
*/

export function getScheduledDate(
  order
) {
  return (
    order?.scheduled_date ||
    order?.schedule_date ||
    order?.delivery_date ||
    ""
  );
}


/*
|--------------------------------------------------------------------------
| Parse Local Date
|--------------------------------------------------------------------------
|
| Prevents YYYY-MM-DD from being shifted by timezone.
|
|--------------------------------------------------------------------------
*/

export function parseDate(
  value
) {
  if (!value) {
    return null;
  }

  if (
    value instanceof Date
  ) {
    return Number.isNaN(
      value.getTime()
    )
      ? null
      : value;
  }

  const raw = String(
    value
  ).trim();

  if (!raw) {
    return null;
  }

  const match =
    raw.match(
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/
    );

  if (match) {
    const year =
      Number(
        match[1]
      );

    const month =
      Number(
        match[2]
      ) - 1;

    const day =
      Number(
        match[3]
      );

    const date =
      new Date(
        year,
        month,
        day
      );

    return Number.isNaN(
      date.getTime()
    )
      ? null
      : date;
  }

  const parsed =
    new Date(
      value
    );

  return Number.isNaN(
    parsed.getTime()
  )
    ? null
    : parsed;
}


/*
|--------------------------------------------------------------------------
| Format Date Key
|--------------------------------------------------------------------------
*/

export function formatDateKey(
  date
) {
  if (!date) {
    return "";
  }

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
}


/*
|--------------------------------------------------------------------------
| Get Today Date
|--------------------------------------------------------------------------
*/

export function getTodayDate() {
  return formatDateKey(
    new Date()
  );
}


/*
|--------------------------------------------------------------------------
| Get Current Delivery Period
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| These are default periods.
|
| Morning   = before 12 PM
| Afternoon = 12 PM - before 6 PM
| Evening   = 6 PM onward
|
| If your actual station hours are different,
| we can change them later.
|
|--------------------------------------------------------------------------
*/

export function getCurrentPeriod(
  date = new Date()
) {
  const hour =
    date.getHours();

  if (
    hour < 12
  ) {
    return "morning";
  }

  if (
    hour < 18
  ) {
    return "afternoon";
  }

  return "evening";
}


/*
|--------------------------------------------------------------------------
| Is Scheduled Order
|--------------------------------------------------------------------------
*/

export function isScheduledOrder(
  order
) {
  return (
    String(
      order?.delivery_type ||
        ""
    )
      .toLowerCase()
      .trim() ===
    "scheduled"
  );
}


/*
|--------------------------------------------------------------------------
| Is Reservation Due
|--------------------------------------------------------------------------
|
| Example:
|
| Today = August 25
| Scheduled = August 26 Morning
|
| Result:
|
| false
|
|
| Today = August 26
| Current period = Morning
|
| Result:
|
| true
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

  if (
    !isScheduledOrder(
      order
    )
  ) {
    return false;
  }

  const reservationStatus =
    normalizeReservationStatus(
      order?.reservation_status
    );

  /*
   * Cancelled or completed reservations
   * are never due.
   */
  if (
    reservationStatus ===
      "cancelled" ||
    reservationStatus ===
      "completed"
  ) {
    return false;
  }

  /*
   * Already delivered.
   */
  if (
    normalizeStatus(
      order?.status
    ) === "delivered"
  ) {
    return false;
  }

  /*
   * Already cancelled.
   */
  if (
    normalizeStatus(
      order?.status
    ) === "cancelled"
  ) {
    return false;
  }

  const scheduledDate =
    parseDate(
      getScheduledDate(
        order
      )
    );

  if (!scheduledDate) {
    return false;
  }

  const todayKey =
    formatDateKey(
      now
    );

  const scheduledKey =
    formatDateKey(
      scheduledDate
    );

  /*
   * The scheduled date must be today.
   */
  if (
    todayKey !==
    scheduledKey
  ) {
    return false;
  }

  const scheduledPeriod =
    getSchedulePeriod(
      order
    );

  if (!scheduledPeriod) {
    return false;
  }

  const currentPeriod =
    getCurrentPeriod(
      now
    );

  return (
    scheduledPeriod ===
    currentPeriod
  );
}


/*
|--------------------------------------------------------------------------
| Get Order Delivery State
|--------------------------------------------------------------------------
|
| Returns:
|
| future
| due
| pending
| assigned
| on_the_way
| delivered
| cancelled
|
|--------------------------------------------------------------------------
*/

export function getOrderDeliveryState(
  order,
  now = new Date()
) {
  if (!order) {
    return "unknown";
  }

  const status =
    normalizeStatus(
      order.status
    );

  /*
   * Completed delivery.
   */
  if (
    status === "delivered"
  ) {
    return "delivered";
  }

  /*
   * Cancelled.
   */
  if (
    status === "cancelled"
  ) {
    return "cancelled";
  }

  /*
   * Active delivery.
   */
  if (
    status === "on_the_way"
  ) {
    return "on_the_way";
  }

  /*
   * Assigned delivery.
   */
  if (
    status === "assigned" &&
    order.driver_id
  ) {
    return "assigned";
  }

  /*
   * Scheduled order.
   */
  if (
    isScheduledOrder(
      order
    )
  ) {
    /*
     * Already has a driver.
     */
    if (
      order.driver_id
    ) {
      return "assigned";
    }

    /*
     * Check whether it is due.
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
     * Otherwise it is still a future
     * reservation.
     */
    return "future";
  }

  /*
   * Normal non-scheduled order.
   */
  return status;
}


/*
|--------------------------------------------------------------------------
| Get Reservation Label
|--------------------------------------------------------------------------
*/

export function getReservationLabel(
  order,
  now = new Date()
) {
  const state =
    getOrderDeliveryState(
      order,
      now
    );

  switch (state) {
    case "future":
      return "Scheduled";

    case "due":
      return "Due for Delivery";

    case "assigned":
      return "Driver Assigned";

    case "on_the_way":
      return "On The Way";

    case "delivered":
      return "Delivered";

    case "cancelled":
      return "Cancelled";

    case "pending":
      return "Pending";

    default:
      return "Pending";
  }
}


/*
|--------------------------------------------------------------------------
| Get All Orders
|--------------------------------------------------------------------------
*/

export async function getOrders() {
  console.log(
    "[Orders] Loading orders from Supabase..."
  );

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "orders"
      )
      .select(
        "*"
      )
      .order(
        "created_at",
        {
          ascending:
            false,
        }
      );

  if (error) {
    console.error(
      "[Orders] Supabase error:",
      error
    );

    throw error;
  }

  const {
    data: customerProfiles,
    error: customerProfilesError,
  } = await supabase
    .from("customer_profiles")
    .select("id, user_id, avatar_url, phone");

  if (customerProfilesError) {
    console.warn(
      "[Orders] Customer profile photos could not be loaded:",
      customerProfilesError
    );
  }

  const customerAvatarById = new Map();
  const customerPhoneById = new Map();

  (customerProfiles || []).forEach((profile) => {
    if (profile.id) {
      customerAvatarById.set(String(profile.id), profile.avatar_url || "");
      customerPhoneById.set(String(profile.id), profile.phone || "");
    }

    if (profile.user_id) {
      customerAvatarById.set(String(profile.user_id), profile.avatar_url || "");
      customerPhoneById.set(String(profile.user_id), profile.phone || "");
    }
  });

  console.log(
    `[Orders] ${
      data?.length || 0
    } records loaded`
  );

  const now =
    new Date();

  return (
    data || []
  ).map(
    (
      order
    ) => {

      const normalizedStatus =
        normalizeStatus(
          order.status
        );

      const reservationStatus =
        normalizeReservationStatus(
          order.reservation_status ||
            (
              isScheduledOrder(
                order
              )
                ? "scheduled"
                : ""
            )
        );

      const schedulePeriod =
        getSchedulePeriod(
          order
        );

      const deliveryState =
        getOrderDeliveryState(
          {
            ...order,
            reservation_status:
              reservationStatus,
          },
          now
        );

      return {

        ...order,

        customer_avatar_url:
          customerAvatarById.get(String(order.customer_id)) || "",

        customer_phone:
          customerPhoneById.get(String(order.customer_id)) ||
          order.customer_phone ||
          order.phone ||
          "",

        /*
         * Normal order status.
         */
        status:
          normalizedStatus,

        original_status:
          order.status,

        /*
         * Reservation status.
         */
        reservation_status:
          reservationStatus,

        /*
         * Delivery state calculated from
         * date + period + status.
         */
        delivery_state:
          deliveryState,

        reservation_label:
          getReservationLabel(
            {
              ...order,
              reservation_status:
                reservationStatus,
            },
            now
          ),

        /*
         * Schedule information.
         */
        scheduled_period:
          schedulePeriod,

        scheduled_date:
          order.scheduled_date ||
          "",

        scheduled_time:
          order.scheduled_time ||
          "",

        /*
         * Safe numeric values.
         */
        gallons:
          order.gallons !==
            null &&
          order.gallons !==
            undefined
            ? Number(
                order.gallons
              )
            : 0,

        total_price:
          order.total_price !==
            null &&
          order.total_price !==
            undefined
            ? Number(
                order.total_price
              )
            : 0,

        /*
         * Product information.
         */
        product_name:
          order.product_name ||
          "Product",

        capacity:
          order.capacity ||
          "",

        /*
         * Customer information.
         */
        customer_name:
          order.customer_name ||
          "Unknown Customer",

        /*
         * Delivery type.
         */
        delivery_type:
          order.delivery_type ||
          "",

        /*
         * Payment information.
         */
        payment_status:
          order.payment_status ||
          "Pending",

        payment_method:
          order.payment_method ||
          "Cash",

        /*
         * Driver.
         */
        driver_id:
          order.driver_id ||
          null,

        /*
         * Useful booleans for React UI.
         */
        is_scheduled:
          isScheduledOrder(
            order
          ),

        is_future_reservation:
          isScheduledOrder(
            order
          ) &&
          deliveryState ===
            "future",

        is_due_for_delivery:
          isScheduledOrder(
            order
          ) &&
          deliveryState ===
            "due",

        is_active_delivery:
          deliveryState ===
            "assigned" ||
          deliveryState ===
            "on_the_way",

        is_delivered:
          deliveryState ===
          "delivered",
      };
    }
  );
}


/*
|--------------------------------------------------------------------------
| Get Visible Orders
|--------------------------------------------------------------------------
|
| Rejected payments are hidden from the normal Orders page.
|
|--------------------------------------------------------------------------
*/

export async function getVisibleOrders() {
  const orders =
    await getOrders();

  return orders.filter(
    (
      order
    ) =>
      !isRejectedPayment(
        order
      )
  );
}


/*
|--------------------------------------------------------------------------
| Check Rejected Payment
|--------------------------------------------------------------------------
*/

function isRejectedPayment(
  order
) {
  return (
    String(
      order?.payment_status ||
        ""
    )
      .toLowerCase()
      .trim() ===
    "rejected"
  );
}


/*
|--------------------------------------------------------------------------
| Get Single Order
|--------------------------------------------------------------------------
*/

export async function getOrderById(
  orderId
) {
  if (!orderId) {
    throw new Error(
      "Order ID is required."
    );
  }

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "orders"
      )
      .select(
        "*"
      )
      .eq(
        "id",
        orderId
      )
      .maybeSingle();

  if (error) {
    console.error(
      "[Orders] Failed to load order:",
      error
    );

    throw error;
  }

  if (!data) {
    return null;
  }

  const normalized =
    normalizeStatus(
      data.status
    );

  const reservationStatus =
    normalizeReservationStatus(
      data.reservation_status ||
        (
          isScheduledOrder(
            data
          )
            ? "scheduled"
            : ""
        )
    );

  const now =
    new Date();

  const deliveryState =
    getOrderDeliveryState(
      {
        ...data,
        reservation_status:
          reservationStatus,
      },
      now
    );

  return {

    ...data,

    status:
      normalized,

    original_status:
      data.status,

    reservation_status:
      reservationStatus,

    delivery_state:
      deliveryState,

    reservation_label:
      getReservationLabel(
        {
          ...data,
          reservation_status:
            reservationStatus,
        },
        now
      ),

    scheduled_period:
      getSchedulePeriod(
        data
      ),

    scheduled_date:
      data.scheduled_date ||
      "",

    scheduled_time:
      data.scheduled_time ||
      "",

    gallons:
      data.gallons !==
        null &&
      data.gallons !==
        undefined
        ? Number(
            data.gallons
          )
        : 0,

    total_price:
      data.total_price !==
        null &&
      data.total_price !==
        undefined
        ? Number(
            data.total_price
          )
        : 0,

    product_name:
      data.product_name ||
      "Product",

    capacity:
      data.capacity ||
      "",

    customer_name:
      data.customer_name ||
      "Unknown Customer",

    delivery_type:
      data.delivery_type ||
      "",

    payment_status:
      data.payment_status ||
      "Pending",

    payment_method:
      data.payment_method ||
      "Cash",

    driver_id:
      data.driver_id ||
      null,

    is_scheduled:
      isScheduledOrder(
        data
      ),

    is_future_reservation:
      isScheduledOrder(
        data
      ) &&
      deliveryState ===
        "future",

    is_due_for_delivery:
      isScheduledOrder(
        data
      ) &&
      deliveryState ===
        "due",

    is_active_delivery:
      deliveryState ===
        "assigned" ||
      deliveryState ===
        "on_the_way",

    is_delivered:
      deliveryState ===
        "delivered",
  };
}


/*
|--------------------------------------------------------------------------
| Dashboard Stats
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| Future scheduled reservations are NOT counted as
| active deliveries.
|
|--------------------------------------------------------------------------
*/

export async function getOrderStats() {
  const orders =
    await getVisibleOrders();

  const pending =
    orders.filter(
      (
        order
      ) =>
        order.status === "pending" ||
        order.delivery_state === "pending" ||
        order.delivery_state === "future"
    ).length;

  const due =
    orders.filter(
      (
        order
      ) =>
        order.is_due_for_delivery
    ).length;

  const assigned =
    orders.filter(
      (
        order
      ) =>
        order.delivery_state ===
        "assigned"
    ).length;

  const onTheWay =
    orders.filter(
      (
        order
      ) =>
        order.delivery_state ===
        "on_the_way"
    ).length;

  const delivered =
    orders.filter(
      (
        order
      ) =>
        order.delivery_state ===
        "delivered"
    ).length;

  const futureReservations =
    orders.filter(
      (
        order
      ) =>
        order.is_future_reservation
    ).length;

  return {

    total:
      orders.length,

    pending,

    due,

    assigned,

    onTheWay,

    delivered,

    futureReservations,
  };
}


/*
|--------------------------------------------------------------------------
| Get Due Orders
|--------------------------------------------------------------------------
|
| These are scheduled orders that are actually due NOW.
|
| These are the orders that should be available
| for driver assignment.
|
|--------------------------------------------------------------------------
*/

export async function getDueOrders() {
  const orders =
    await getVisibleOrders();

  return orders.filter(
    (
      order
    ) =>
      order.is_due_for_delivery &&
      !order.driver_id
  );
}


/*
|--------------------------------------------------------------------------
| Get Future Scheduled Orders
|--------------------------------------------------------------------------
|
| Future reservations are kept separate from
| active delivery orders.
|
|--------------------------------------------------------------------------
*/

export async function getFutureScheduledOrders() {
  const orders =
    await getVisibleOrders();

  return orders.filter(
    (
      order
    ) =>
      order.is_future_reservation
  );
}


/*
|--------------------------------------------------------------------------
| Get Active Deliveries
|--------------------------------------------------------------------------
*/

export async function getActiveDeliveryOrders() {
  const orders =
    await getVisibleOrders();

  return orders.filter(
    (
      order
    ) =>
      order.delivery_state ===
        "assigned" ||
      order.delivery_state ===
        "on_the_way"
  );
}


/*
|--------------------------------------------------------------------------
| Filter Orders
|--------------------------------------------------------------------------
*/

export function filterOrders(
  orders = [],
  search = "",
  status = "all",
  deliveryType = "all"
) {
  const searchValue =
    String(
      search || ""
    )
      .toLowerCase()
      .trim();

  return orders.filter(
    (
      order
    ) => {

      /*
       * Hide rejected payments.
       */
      if (
        isRejectedPayment(
          order
        )
      ) {
        return false;
      }

      /*
       * Search.
       */
      const matchesSearch =
        searchValue === "" ||

        String(
          order.customer_name ||
            ""
        )
          .toLowerCase()
          .includes(
            searchValue
          ) ||

        String(
          order.id ||
            ""
        )
          .toLowerCase()
          .includes(
            searchValue
          ) ||

        String(
          order.product_name ||
            ""
        )
          .toLowerCase()
          .includes(
            searchValue
          ) ||

        String(
          order.capacity ||
            ""
        )
          .toLowerCase()
          .includes(
            searchValue
          );

      /*
       * Status filtering.
       */
      let matchesStatus =
        true;

      if (
        status !==
        "all"
      ) {

        /*
         * "on_the_way" in the existing
         * Orders UI includes assigned + on the way.
         */
        if (
          status ===
          "on_the_way"
        ) {

          matchesStatus =
            order.delivery_state ===
              "assigned" ||
            order.delivery_state ===
              "on_the_way";

        } else if (
          status ===
          "due"
        ) {

          matchesStatus =
            order.is_due_for_delivery;

        } else if (
          status ===
          "scheduled"
        ) {

          matchesStatus =
            order.is_future_reservation;

        } else {

          matchesStatus =
            order.delivery_state ===
              status ||
            order.status ===
              status;
        }
      }

      /*
       * Delivery type.
       */
      const matchesDelivery =
        deliveryType ===
          "all" ||
        String(
          order.delivery_type ||
            ""
        )
          .toLowerCase()
          .trim() ===
          String(
            deliveryType ||
              ""
          )
            .toLowerCase()
            .trim();

      return (
        matchesSearch &&
        matchesStatus &&
        matchesDelivery
      );
    }
  );
}


/*
|--------------------------------------------------------------------------
| Get Orders By Customer
|--------------------------------------------------------------------------
*/

export async function getOrdersByCustomer(
  customerId
) {
  if (!customerId) {
    return [];
  }

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "orders"
      )
      .select(
        "*"
      )
      .eq(
        "customer_id",
        customerId
      )
      .order(
        "created_at",
        {
          ascending:
            false,
        }
      );

  if (error) {
    console.error(
      "[Orders] Customer orders error:",
      error
    );

    throw error;
  }

  const now =
    new Date();

  return (
    data || []
  ).map(
    (
      order
    ) => {

      const reservationStatus =
        normalizeReservationStatus(
          order.reservation_status ||
            (
              isScheduledOrder(
                order
              )
                ? "scheduled"
                : ""
            )
        );

      const deliveryState =
        getOrderDeliveryState(
          {
            ...order,
            reservation_status:
              reservationStatus,
          },
          now
        );

      return {

        ...order,

        status:
          normalizeStatus(
            order.status
          ),

        reservation_status:
          reservationStatus,

        delivery_state:
          deliveryState,

        reservation_label:
          getReservationLabel(
            {
              ...order,
              reservation_status:
                reservationStatus,
            },
            now
          ),

        scheduled_period:
          getSchedulePeriod(
            order
          ),

        gallons:
          order.gallons !==
            null &&
          order.gallons !==
            undefined
            ? Number(
                order.gallons
              )
            : 0,

        total_price:
          order.total_price !==
            null &&
          order.total_price !==
            undefined
            ? Number(
                order.total_price
              )
            : 0,
      };
    }
  );
}