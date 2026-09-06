import { supabase } from "../lib/supabase";

/*
|--------------------------------------------------------------------------
| Configuration
|--------------------------------------------------------------------------
*/

const REFILL_MINUTES = 10;
const REFILL_MS =
  REFILL_MINUTES * 60 * 1000;

const DEFAULT_PRODUCTS = [
  {
    id: "default-5-gallon",
    product_name: "Mineral Water",
    capacity: "5 gallons",
    total: 0,
    enabled: true,
  },
];

/*
|--------------------------------------------------------------------------
| BASIC HELPERS
|--------------------------------------------------------------------------
*/

function normalizeCapacity(value) {
  const text = String(value || "")
    .trim()
    .toLowerCase();

  if (text.includes("5")) {
    return "5 gallons";
  }

  if (text.includes("3")) {
    return "3 gallons";
  }

  if (text.includes("2")) {
    return "2 gallons";
  }

  return text;
}

function normalizeStatus(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function isCancelled(value) {
  return [
    "cancelled",
    "canceled",
    "rejected",
    "failed",
  ].includes(
    normalizeStatus(value)
  );
}

function isCompleted(value) {
  return [
    "delivered",
    "completed",
    "complete",
    "finished",
  ].includes(
    normalizeStatus(value)
  );
}

function isActive(value) {
  return [
    "assigned",
    "accepted",
    "out_for_delivery",
    "outfordelivery",
    "on_delivery",
    "in_transit",
    "picked_up",
    "on_the_way",
    "on_way",
    "in_progress",
  ].includes(
    normalizeStatus(value)
  );
}

function isExchange(order) {
  const type = normalizeStatus(
    order?.delivery_type
  );

  return (
    order?.exchange_required === true ||
    String(
      order?.exchange_required || ""
    ).toLowerCase() === "true" ||
    type === "exchange" ||
    type === "with_exchange"
  );
}

/*
|--------------------------------------------------------------------------
| BORROW HELPERS
|--------------------------------------------------------------------------
*/

function isBorrowOrder(order) {
  const type = normalizeStatus(
    order?.delivery_type ||
      order?.order_type ||
      order?.container_type ||
      order?.purpose
  );

  const borrowQuantity = Number(
    order?.borrow_containers ??
      order?.borrowed_containers ??
      order?.borrow_quantity
  );

  const hasBorrowQuantity =
    Number.isFinite(borrowQuantity) &&
    borrowQuantity > 0;

  return (
    type === "borrow" ||
    type === "borrowing" ||
    type === "borrow_container" ||
    type === "borrow_containers" ||
    order?.borrow_required === true ||
    String(
      order?.borrow_required || ""
    ).toLowerCase() === "true" ||
    hasBorrowQuantity
  );
}

function getBorrowOutstanding(borrowing) {
  const quantity = Math.max(
    0,
    Number(borrowing?.quantity) || 0
  );

  const returned = Math.max(
    0,
    Number(borrowing?.returned_quantity) || 0
  );

  const damaged = Math.max(
    0,
    Number(borrowing?.damaged_quantity) || 0
  );

  const missing = Math.max(
    0,
    Number(borrowing?.missing_quantity) || 0
  );

  return Math.max(
    0,
    quantity -
      returned -
      damaged -
      missing
  );
}

function getEffectiveStatus(
  order,
  delivery
) {
  const orderStatus =
    normalizeStatus(order?.status);

  const deliveryStatus =
    normalizeStatus(delivery?.status);

  if (
    isCancelled(orderStatus) ||
    isCancelled(deliveryStatus)
  ) {
    return "cancelled";
  }

  if (
    isCompleted(orderStatus) ||
    isCompleted(deliveryStatus)
  ) {
    return "delivered";
  }

  return (
    deliveryStatus ||
    orderStatus
  );
}

function getQuantity(
  order,
  delivery
) {
  const deliveryQuantity =
    Number(delivery?.quantity);

  if (
    Number.isFinite(
      deliveryQuantity
    ) &&
    deliveryQuantity > 0
  ) {
    return Math.floor(
      deliveryQuantity
    );
  }

  const orderQuantity =
    Number(order?.gallons);

  if (
    Number.isFinite(
      orderQuantity
    ) &&
    orderQuantity > 0
  ) {
    return Math.floor(
      orderQuantity
    );
  }

  const quantity =
    Number(order?.quantity);

  if (
    Number.isFinite(quantity) &&
    quantity > 0
  ) {
    return Math.floor(
      quantity
    );
  }

  return 0;
}

function isRefillReady(record) {
  if (!record?.created_at) {
    return true;
  }

  const createdTime =
    new Date(
      record.created_at
    ).getTime();

  if (
    !Number.isFinite(
      createdTime
    )
  ) {
    return true;
  }

  return (
    Date.now() - createdTime >=
    REFILL_MS
  );
}

/*
|--------------------------------------------------------------------------
| DATE HELPERS
|--------------------------------------------------------------------------
*/

function getStartOfDay(dateValue) {
  if (!dateValue) {
    return null;
  }

  const date = new Date(
    `${dateValue}T00:00:00.000`
  );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date.getTime();
}

function getEndOfDay(dateValue) {
  if (!dateValue) {
    return null;
  }

  const date = new Date(
    `${dateValue}T23:59:59.999`
  );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date.getTime();
}

function isWithinRange(
  dateValue,
  fromDate = "",
  toDate = ""
) {
  if (!dateValue) {
    return false;
  }

  const timestamp =
    new Date(
      dateValue
    ).getTime();

  if (
    !Number.isFinite(
      timestamp
    )
  ) {
    return false;
  }

  const fromTimestamp =
    getStartOfDay(fromDate);

  const toTimestamp =
    getEndOfDay(toDate);

  if (
    fromTimestamp !== null &&
    timestamp < fromTimestamp
  ) {
    return false;
  }

  if (
    toTimestamp !== null &&
    timestamp > toTimestamp
  ) {
    return false;
  }

  return true;
}

/*
|--------------------------------------------------------------------------
| DISPLAY NAME HELPERS
|--------------------------------------------------------------------------
|
| UUIDs are kept internally.
| The UI receives human-readable names only.
|--------------------------------------------------------------------------
*/

function getPersonName(person) {
  if (!person) {
    return "";
  }

  const directName =
    person.full_name ||
    person.fullName ||
    person.name ||
    person.display_name ||
    person.displayName ||
    person.employee_name ||
    person.driver_name;

  if (
    directName &&
    String(directName).trim()
  ) {
    return String(
      directName
    ).trim();
  }

  const firstName =
    person.first_name ||
    person.firstName ||
    "";

  const middleName =
    person.middle_name ||
    person.middleName ||
    "";

  const lastName =
    person.last_name ||
    person.lastName ||
    "";

  const combined = [
    firstName,
    middleName,
    lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return combined;
}

/*
|--------------------------------------------------------------------------
| LOAD EMPLOYEES / DRIVERS
|--------------------------------------------------------------------------
*/

async function getEmployees() {
  try {
    const {
      data,
      error,
    } = await supabase
      .from("employees")
      .select("*");

    if (error) {
      console.warn(
        "Employees could not be loaded:",
        error.message
      );

      return [];
    }

    return Array.isArray(data)
      ? data
      : [];
  } catch (error) {
    console.warn(
      "Employee lookup failed:",
      error
    );

    return [];
  }
}

/*
|--------------------------------------------------------------------------
| DRIVER MAP
|--------------------------------------------------------------------------
*/

function buildDriverMap(
  employees
) {
  const map = new Map();

  employees.forEach(
    (employee) => {
      const name =
        getPersonName(
          employee
        );

      if (!name) {
        return;
      }

      const possibleIds = [
        employee.id,
        employee.user_id,
        employee.auth_user_id,
        employee.employee_id,
        employee.driver_id,
      ].filter(Boolean);

      possibleIds.forEach(
        (id) => {
          map.set(
            String(id),
            name
          );
        }
      );
    }
  );

  return map;
}

/*
|--------------------------------------------------------------------------
| DRIVER NAME RESOLVER
|--------------------------------------------------------------------------
*/

function resolveDriverName(
  row,
  driverMap
) {
  const directName =
    row?.driver_name ||
    row?.driver?.full_name ||
    row?.driver?.name ||
    row?.employee_name ||
    row?.employee?.full_name ||
    row?.employee?.name;

  if (
    directName &&
    String(directName).trim()
  ) {
    return String(
      directName
    ).trim();
  }

  const driverId =
    row?.driver_id ||
    row?.driverId ||
    row?.assigned_driver_id ||
    row?.assignedDriverId;

  if (
    driverId &&
    driverMap.has(
      String(driverId)
    )
  ) {
    return driverMap.get(
      String(driverId)
    );
  }

  return "—";
}

/*
|--------------------------------------------------------------------------
| CUSTOMER NAME RESOLVER
|--------------------------------------------------------------------------
*/

function resolveCustomerName(
  row
) {
  const directName =
    row?.customer_name ||
    row?.customerName ||
    row?.customer?.full_name ||
    row?.customer?.name ||
    row?.customer?.display_name ||
    row?.customer?.first_name;

  if (
    directName &&
    String(directName).trim()
  ) {
    return String(
      directName
    ).trim();
  }

  return "Customer";
}

/*
|--------------------------------------------------------------------------
| NOTES RESOLVER
|--------------------------------------------------------------------------
*/

function resolveNotes(
  ...rows
) {
  const possibleFields = [
    "notes",
    "note",
    "delivery_notes",
    "delivery_note",
    "driver_notes",
    "driver_note",
    "return_notes",
    "return_note",
    "remarks",
    "remark",
    "comments",
    "comment",
  ];

  for (
    const row of rows
  ) {
    if (!row) {
      continue;
    }

    for (
      const field of possibleFields
    ) {
      const value =
        row[field];

      if (
        value !== null &&
        value !== undefined &&
        String(value).trim()
      ) {
        return String(
          value
        ).trim();
      }
    }
  }

  return "—";
}

/*
|--------------------------------------------------------------------------
| HUMAN-READABLE ORDER NUMBER
|--------------------------------------------------------------------------
*/

function resolveOrderNumber(
  order
) {
  if (!order) {
    return "—";
  }

  const value =
    order.order_number ||
    order.orderNumber ||
    order.order_code ||
    order.orderCode ||
    order.reference_number ||
    order.referenceNumber ||
    order.order_no ||
    order.orderNo;

  if (
    value !== null &&
    value !== undefined &&
    String(value).trim()
  ) {
    const text =
      String(value).trim();

    return text.startsWith("#")
      ? text
      : `#${text}`;
  }

  if (order.id) {
    return `#${String(
      order.id
    ).slice(0, 6).toUpperCase()}`;
  }

  return "—";
}

/*
|--------------------------------------------------------------------------
| DATABASE LOADERS
|--------------------------------------------------------------------------
*/

async function getOrders() {
  const {
    data,
    error,
  } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return Array.isArray(data)
    ? data
    : [];
}

async function getDeliveries() {
  const {
    data,
    error,
  } = await supabase
    .from("deliveries")
    .select("*")
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    console.warn(
      "Deliveries unavailable:",
      error.message
    );

    return [];
  }

  return Array.isArray(data)
    ? data
    : [];
}

export async function getContainerReturns() {
  const {
    data,
    error,
  } = await supabase
    .from("container_returns")
    .select("*")
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    console.warn(
      "Container returns unavailable:",
      error.message
    );

    return [];
  }

  return Array.isArray(data)
    ? data
    : [];
}

/*
|--------------------------------------------------------------------------
| CONTAINER BORROWINGS
|--------------------------------------------------------------------------
*/

export async function getContainerBorrowings(
  filters = {}
) {
  const {
    fromDate = "",
    toDate = "",
    customerId = "",
    status = "",
  } = filters;

  let query = supabase
    .from("container_borrowings")
    .select("*")
    .order("created_at", {
      ascending: true,
    });

  if (customerId) {
    query = query.eq(
      "customer_id",
      String(customerId)
    );
  }

  if (status) {
    query = query.eq(
      "status",
      normalizeStatus(status)
    );
  }

  const {
    data,
    error,
  } = await query;

  if (error) {
    console.warn(
      "Container borrowings unavailable:",
      error.message
    );

    return [];
  }

  let rows = Array.isArray(data)
    ? data
    : [];

  if (
    fromDate ||
    toDate
  ) {
    rows = rows.filter(
      (row) =>
        isWithinRange(
          row.borrowed_at ||
            row.created_at,
          fromDate,
          toDate
        )
    );
  }

  return rows;
}

export async function getContainerBorrowSettings() {
  const {
    data,
    error,
  } = await supabase
    .from(
      "container_borrow_settings"
    )
    .select("*")
    .order("created_at", {
      ascending: true,
    })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn(
      "Container borrow settings unavailable:",
      error.message
    );

    return {
      enabled: true,
      maximum_per_customer: 10,
      allow_partial_return: true,
    };
  }

  return (
    data || {
      enabled: true,
      maximum_per_customer: 10,
      allow_partial_return: true,
    }
  );
}

/*
|--------------------------------------------------------------------------
| PRODUCTS
|--------------------------------------------------------------------------
*/

export async function getInventoryConfiguration() {
  const {
    data,
    error,
  } = await supabase
    .from("products")
    .select("*")
    .eq("enabled", true)
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  if (
    !Array.isArray(data) ||
    data.length === 0
  ) {
    return DEFAULT_PRODUCTS;
  }

  return data.map(
    (item) => ({
      id: item.id,

      product_name:
        item.product_name ||
        "Mineral Water",

      capacity:
        normalizeCapacity(
          item.capacity
        ),

      total: Math.max(
        0,
        Number(
          item.initial_containers
        ) || 0
      ),

      enabled:
        item.enabled !== false,
    })
  );
}

/*
|--------------------------------------------------------------------------
| RETURN TOTALS
|--------------------------------------------------------------------------
*/

function getReturnTotals(
  records,
  orderId,
  cutoffTimestamp = null,
  excludedReturnIds = new Set()
) {
  return records
    .filter((record) => {
      if (
        excludedReturnIds.has(
          record?.id
        )
      ) {
        return false;
      }

      if (
        String(
          record?.order_id
        ) !== String(orderId)
      ) {
        return false;
      }

      if (
        cutoffTimestamp === null
      ) {
        return true;
      }

      const recordTime =
        new Date(
          record.created_at
        ).getTime();

      return (
        Number.isFinite(
          recordTime
        ) &&
        recordTime <=
          cutoffTimestamp
      );
    })
    .reduce(
      (
        result,
        record
      ) => {
        const returned =
          Math.max(
            0,
            Number(
              record?.returned_quantity
            ) || 0
          );

        result.returned +=
          returned;

        result.damaged +=
          Math.max(
            0,
            Number(
              record?.damaged_quantity
            ) || 0
          );

        result.missing +=
          Math.max(
            0,
            Number(
              record?.missing_quantity
            ) || 0
          );

        if (
          isRefillReady(
            record
          )
        ) {
          result.ready +=
            returned;
        } else {
          result.pending +=
            returned;
        }

        return result;
      },
      {
        returned: 0,
        ready: 0,
        pending: 0,
        damaged: 0,
        missing: 0,
      }
    );
}

function getBorrowingReturnMap(
  returnRows,
  borrowingRows
) {
  const map = new Map();

  borrowingRows.forEach(
    (borrowing) => {
      const borrowingStatus =
        normalizeStatus(
          borrowing.status
        );

      if (
        [
          "cancelled",
          "requested",
        ].includes(
          borrowingStatus
        )
      ) {
        return;
      }

      const totalReturned =
        Math.max(
          0,
          Number(
            borrowing.returned_quantity
          ) || 0
        );

      const totalDamaged =
        Math.max(
          0,
          Number(
            borrowing.damaged_quantity
          ) || 0
        );

      const totalMissing =
        Math.max(
          0,
          Number(
            borrowing.missing_quantity
          ) || 0
        );

      if (
        totalReturned +
          totalDamaged +
          totalMissing <= 0
      ) {
        return;
      }

      const customerId =
        String(
          borrowing.customer_id ||
            ""
        ).trim();

      const borrowingCapacity =
        normalizeCapacity(
          borrowing.capacity
        );

      let remaining =
        totalReturned +
        totalDamaged +
        totalMissing;

      returnRows.forEach(
        (row) => {
          if (
            remaining <= 0
          ) {
            return;
          }

          const explicitBorrowingId =
            row.borrowing_id ||
            row.borrow_id ||
            row.container_borrowing_id;

          const sameBorrowing =
            explicitBorrowingId &&
            String(
              explicitBorrowingId
            ) ===
              String(borrowing.id);

          const sameBorrowingOrder =
            borrowing.order_id &&
            row.order_id &&
            String(
              borrowing.order_id
            ) ===
              String(row.order_id);

          const sameCustomerAndCapacity =
            customerId &&
            String(
              row.customer_id ||
                ""
            ).trim() === customerId &&
            normalizeCapacity(
              row.capacity
            ) === borrowingCapacity &&
            String(
              row.notes ||
                ""
            ).toLowerCase().includes("borrow");

          if (
            !sameBorrowing &&
            !sameBorrowingOrder &&
            !sameCustomerAndCapacity
          ) {
            return;
          }

          const rowQuantity =
            Math.max(
              0,
              Number(
                row.returned_quantity
              ) || 0
            ) +
            Math.max(
              0,
              Number(
                row.damaged_quantity
              ) || 0
            ) +
            Math.max(
              0,
              Number(
                row.missing_quantity
              ) || 0
            );

          if (
            rowQuantity <= 0
          ) {
            return;
          }

          map.set(
            row.id,
            Math.min(
              rowQuantity,
              remaining
            )
          );

          remaining -= Math.min(
            rowQuantity,
            remaining
          );
        }
      );
    }
  );

  return map;
}

function getBorrowingReturnTotals(
  returnRows,
  borrowing,
  borrowingReturnIds
) {
  const matchedRows = returnRows.filter(
    (row) =>
      borrowingReturnIds.has(row?.id) &&
      (
        String(row?.borrowing_id || row?.borrow_id || row?.container_borrowing_id) ===
          String(borrowing.id) ||
        (
          borrowing.order_id &&
          String(row?.order_id) === String(borrowing.order_id)
        )
      )
  );

  if (matchedRows.length === 0) {
    const returned = Math.max(
      0,
      Number(borrowing.returned_quantity) || 0
    );

    return {
      pending: isRefillReady({
        created_at:
          borrowing.returned_at ||
          borrowing.updated_at,
      })
        ? 0
        : returned,
      ready: isRefillReady({
        created_at:
          borrowing.returned_at ||
          borrowing.updated_at,
      })
        ? returned
        : 0,
    };
  }

  return matchedRows.reduce(
    (result, row) => {
      const returned = Math.max(
        0,
        Number(row?.returned_quantity) || 0
      );

      if (isRefillReady(row)) {
        result.ready += returned;
      } else {
        result.pending += returned;
      }

      return result;
    },
    {
      pending: 0,
      ready: 0,
    }
  );
}

/*
|--------------------------------------------------------------------------
| INVENTORY
|--------------------------------------------------------------------------
*/

export async function getInventory(
  filters = {}
) {
  const {
    toDate = "",
  } = filters;

  const [
    products,
    allOrders,
    allReturns,
    allDeliveries,
    allBorrowings,
  ] = await Promise.all([
    getInventoryConfiguration(),
    getOrders(),
    getContainerReturns(),
    getDeliveries(),
    getContainerBorrowings(),
  ]);

  const cutoffTimestamp =
    getEndOfDay(toDate);

  const orderRows =
    allOrders.filter(
      (order) => {
        if (
          cutoffTimestamp ===
          null
        ) {
          return true;
        }

        const time =
          new Date(
            order.created_at
          ).getTime();

        return (
          Number.isFinite(
            time
          ) &&
          time <=
            cutoffTimestamp
        );
      }
    );

  const returnRows =
    allReturns.filter(
      (record) => {
        if (
          cutoffTimestamp ===
          null
        ) {
          return true;
        }

        const time =
          new Date(
            record.created_at
          ).getTime();

        return (
          Number.isFinite(
            time
          ) &&
          time <=
            cutoffTimestamp
        );
      }
    );

  const deliveryRows =
    allDeliveries.filter(
      (delivery) => {
        if (
          cutoffTimestamp ===
          null
        ) {
          return true;
        }

        const time =
          new Date(
            delivery.created_at
          ).getTime();

        return (
          Number.isFinite(
            time
          ) &&
          time <=
            cutoffTimestamp
        );
      }
    );

  const borrowingRows =
    allBorrowings.filter(
      (borrowing) => {
        if (
          cutoffTimestamp ===
          null
        ) {
          return true;
        }

        const time =
          new Date(
            borrowing.borrowed_at ||
              borrowing.created_at
          ).getTime();

        return (
          Number.isFinite(
            time
          ) &&
          time <=
            cutoffTimestamp
        );
      }
    );

  const deliveryMap =
    new Map(
      deliveryRows.map(
        (row) => [
          String(
            row.order_id
          ),
          row,
        ]
      )
    );

  const linkedBorrowingKeys =
    new Set(
      borrowingRows
        .filter(
          (borrowing) =>
            borrowing.order_id &&
            ![
              "cancelled",
              "requested",
            ].includes(
              normalizeStatus(
                borrowing.status
              )
            )
        )
        .map(
          (borrowing) =>
            `${borrowing.order_id}::${normalizeCapacity(
              borrowing.capacity
            )}`
        )
    );

  const borrowingReturnIds =
    getBorrowingReturnMap(
      returnRows,
      borrowingRows
    );

  /*
  |--------------------------------------------------------------------------
  | INVENTORY OBJECTS
  |--------------------------------------------------------------------------
  |
  | `with_customers` is the actual physical location.
  |
  | Borrowed containers are included inside
  | `with_customers`.
  |
  | `borrowed` is kept only as a breakdown/reference
  | value for the UI and reports.
  |
  | `with_borrowers` is retained as 0 for backwards
  | compatibility with older UI code.
  |--------------------------------------------------------------------------
  */

  const inventory =
    products.map(
      (item) => ({
        id: item.id,

        product_id:
          item.id,

        product_name:
          item.product_name,

        capacity:
          item.capacity,

        total:
          item.total,

        initial_containers:
          item.total,

        full:
          item.total,

        empty: 0,

        with_customers: 0,

        with_drivers: 0,

        /*
        |--------------------------------------------------------------------------
        | Deprecated compatibility field.
        |
        | Borrowed containers are NOT a separate
        | physical inventory location.
        |--------------------------------------------------------------------------
        */

        with_borrowers: 0,

        /*
        |--------------------------------------------------------------------------
        | Borrowed is a breakdown of With Customers.
        |--------------------------------------------------------------------------
        */

        borrowed: 0,

        damaged: 0,

        missing: 0,

        circulation_rate: 0,
      })
    );

  const findInventory =
    (value) =>
      inventory.find(
        (item) =>
          normalizeCapacity(
            item.capacity
          ) ===
          normalizeCapacity(
            value
          )
      );

  /*
  |--------------------------------------------------------------------------
  | PROCESS ORDERS
  |--------------------------------------------------------------------------
  */

  for (
    const order of orderRows
  ) {
    const delivery =
      deliveryMap.get(
        String(order.id)
      );

    const currentStatus =
      getEffectiveStatus(
        order,
        delivery
      );

    const amount =
      getQuantity(
        order,
        delivery
      );

    const item =
      findInventory(
        order.capacity ||
          order.product_name
      );

    const hasLinkedBorrowing =
      linkedBorrowingKeys.has(
        `${order.id}::${normalizeCapacity(
          order.capacity ||
            order.product_name
        )}`
      );

    if (
      !item ||
      amount <= 0 ||
      hasLinkedBorrowing ||
      isCancelled(
        currentStatus
      )
    ) {
      continue;
    }

    /*
    |--------------------------------------------------------------------------
    | BORROW ORDER
    |--------------------------------------------------------------------------
    |
    | Borrowing inventory is handled by the
    | container_borrowings table.
    |
    | Do not process it as a normal order here,
    | otherwise the same containers could be counted
    | twice.
    |--------------------------------------------------------------------------
    */

    if (
      isBorrowOrder(order)
    ) {
      continue;
    }

    /*
    |--------------------------------------------------------------------------
    | ACTIVE DELIVERY
    |--------------------------------------------------------------------------
    */

    if (
      isActive(
        currentStatus
      )
    ) {
      item.full =
        Math.max(
          0,
          item.full -
            amount
        );

      item.with_drivers +=
        amount;

      continue;
    }

    /*
    |--------------------------------------------------------------------------
    | COMPLETED DELIVERY
    |--------------------------------------------------------------------------
    */

    if (
      !isCompleted(
        currentStatus
      )
    ) {
      continue;
    }

    const returned =
      getReturnTotals(
        returnRows,
        order.id,
        cutoffTimestamp,
        borrowingReturnIds
      );

    if (
      isExchange(order) &&
      returned.returned +
        returned.damaged +
        returned.missing ===
        0
    ) {
      const exchangeReturnDate =
        delivery?.delivered_at ||
        delivery?.updated_at ||
        delivery?.returned_at ||
        order.delivered_at ||
        order.completed_at ||
        order.updated_at ||
        order.created_at;

      if (
        isRefillReady({
          created_at:
            exchangeReturnDate,
        })
      ) {
        returned.ready =
          amount;
      } else {
        returned.pending =
          amount;
      }

      returned.returned =
        amount;
    }

    const removed =
      returned.returned +
      returned.damaged +
      returned.missing;

    /*
    |--------------------------------------------------------------------------
    | Filled containers
    |--------------------------------------------------------------------------
    */

    item.full =
      Math.max(
        0,
        item.full -
          amount
      ) +
      returned.ready;

    /*
    |--------------------------------------------------------------------------
    | Empty recovered
    |--------------------------------------------------------------------------
    */

    item.empty +=
      returned.pending;

    /*
    |--------------------------------------------------------------------------
    | Customer balance
    |--------------------------------------------------------------------------
    |
    | Normal completed orders that are not returned
    | remain with the customer.
    |--------------------------------------------------------------------------
    */

    if (
      !isExchange(order)
    ) {
      item.with_customers +=
        Math.max(
          0,
          amount -
            removed
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Damaged
    |--------------------------------------------------------------------------
    */

    item.damaged +=
      returned.damaged;

    /*
    |--------------------------------------------------------------------------
    | Missing
    |--------------------------------------------------------------------------
    */

    item.missing +=
      returned.missing;
  }

  /*
  |--------------------------------------------------------------------------
  | PROCESS BORROWINGS
  |--------------------------------------------------------------------------
  |
  | IMPORTANT INVENTORY MODEL:
  |
  | Borrowed containers are WITH CUSTOMERS.
  |
  | They are NOT a separate physical inventory
  | location called "With Borrowers".
  |
  | Example:
  |
  | 5 borrowed
  | 2 returned
  |
  | Outstanding = 3
  |
  | Full / Available       -3
  | With Customers         +3
  | Borrowed               +3
  | Empty                  +2
  |
  | The `borrowed` field is simply a breakdown
  | of the `with_customers` amount.
  |--------------------------------------------------------------------------
  */

  borrowingRows.forEach(
    (borrowing) => {
      const item =
        findInventory(
          borrowing.capacity
        );

      if (
        !item
      ) {
        return;
      }

      const status =
        normalizeStatus(
          borrowing.status
        );

      /*
      |--------------------------------------------------------------------------
      | Cancelled / requested borrowings do not
      | affect physical inventory.
      |--------------------------------------------------------------------------
      */

      if (
        [
          "cancelled",
          "requested",
        ].includes(
          status
        )
      ) {
        return;
      }

      /*
      |--------------------------------------------------------------------------
      | Only approved / borrowed / returned
      | records affect inventory.
      |--------------------------------------------------------------------------
      */

      if (
        ![
          "approved",
          "borrowed",
          "partially_returned",
          "returned",
        ].includes(
          status
        )
      ) {
        return;
      }

      const quantity =
        Math.max(
          0,
          Number(
            borrowing.quantity
          ) || 0
        );

      if (
        quantity <= 0
      ) {
        return;
      }

      const returned =
        Math.max(
          0,
          Number(
            borrowing.returned_quantity
          ) || 0
        );

      const damaged =
        Math.max(
          0,
          Number(
            borrowing.damaged_quantity
          ) || 0
        );

      const missing =
        Math.max(
          0,
          Number(
            borrowing.missing_quantity
          ) || 0
        );

      /*
      |--------------------------------------------------------------------------
      | ONLY THE OUTSTANDING QUANTITY IS STILL
      | PHYSICALLY WITH THE CUSTOMER.
      |--------------------------------------------------------------------------
      */

      const outstanding =
        Math.max(
          0,
          quantity -
            returned -
            damaged -
            missing
        );

      /*
      |--------------------------------------------------------------------------
      | Remove ONLY outstanding borrowed containers
      | from Full / Available.
      |
      | This fixes the previous problem where the
      | entire original borrowed quantity was removed
      | even after some/all containers were returned.
      |--------------------------------------------------------------------------
      */

      item.full =
        Math.max(
          0,
          item.full -
            outstanding
        );

      /*
      |--------------------------------------------------------------------------
      | BORROWED = WITH CUSTOMER
      |--------------------------------------------------------------------------
      |
      | This is the key inventory rule.
      |--------------------------------------------------------------------------
      */

      item.with_customers +=
        outstanding;

      /*
      |--------------------------------------------------------------------------
      | Borrowed is a breakdown/reference value.
      |
      | It should match the borrowed portion of
      | With Customers.
      |--------------------------------------------------------------------------
      */

      item.borrowed +=
        outstanding;

      /*
      |--------------------------------------------------------------------------
      | Returned borrowed containers become EMPTY.
      |
      | They are not immediately counted as full because
      | they need to go through the normal refill process.
      |--------------------------------------------------------------------------
      */

      const borrowingReturns =
        getBorrowingReturnTotals(
          returnRows,
          borrowing,
          borrowingReturnIds
        );

      item.empty +=
        borrowingReturns.pending;

      item.full +=
        borrowingReturns.ready;

      /*
      |--------------------------------------------------------------------------
      | Damaged borrowed containers.
      |--------------------------------------------------------------------------
      */

      item.damaged +=
        damaged;

      /*
      |--------------------------------------------------------------------------
      | Missing borrowed containers.
      |--------------------------------------------------------------------------
      */

      item.missing +=
        missing;

      /*
      |--------------------------------------------------------------------------
      | IMPORTANT:
      |
      | Do NOT do this:
      |
      | item.with_borrowers += outstanding;
      |
      | because With Borrowers would duplicate the same
      | containers already counted in With Customers.
      |--------------------------------------------------------------------------
      */
    }
  );

  /*
  |--------------------------------------------------------------------------
  | NORMALIZE
  |--------------------------------------------------------------------------
  */

  inventory.forEach(
    (item) => {
      [
        "full",
        "empty",
        "with_customers",
        "with_drivers",
        "borrowed",
        "damaged",
        "missing",
      ].forEach(
        (key) => {
          item[key] =
            Math.max(
              0,
              Math.floor(
                Number(
                  item[key]
                ) || 0
              )
            );
        }
      );

      /*
      |--------------------------------------------------------------------------
      | Keep deprecated compatibility field at zero.
      |--------------------------------------------------------------------------
      */

      item.with_borrowers = 0;

      /*
      |--------------------------------------------------------------------------
      | Physical inventory accounting
      |--------------------------------------------------------------------------
      |
      | `with_customers` already includes borrowed
      | containers, so `borrowed` must NOT be added
      | separately here.
      |--------------------------------------------------------------------------
      */

      const accounted =
        item.full +
        item.empty +
        item.with_customers +
        item.with_drivers +
        item.damaged +
        item.missing;

      if (
        accounted >
        item.total
      ) {
        let excess =
          accounted -
          item.total;

        const reduceFromBucket = (
          bucket,
          amount
        ) => {
          if (
            amount <= 0 ||
            bucket <= 0
          ) {
            return 0;
          }

          const removed =
            Math.min(
              bucket,
              amount
            );

          return removed;
        };

        if (
          excess > 0
        ) {
          const customerReduction =
            reduceFromBucket(
              item.with_customers,
              excess
            );

          item.with_customers =
            Math.max(
              0,
              item.with_customers -
                customerReduction
            );

          excess -=
            customerReduction;
        }

        if (
          excess > 0
        ) {
          const driverReduction =
            reduceFromBucket(
              item.with_drivers,
              excess
            );

          item.with_drivers =
            Math.max(
              0,
              item.with_drivers -
                driverReduction
            );

          excess -=
            driverReduction;
        }

        if (
          excess > 0
        ) {
          const emptyReduction =
            reduceFromBucket(
              item.empty,
              excess
            );

          item.empty =
            Math.max(
              0,
              item.empty -
                emptyReduction
            );

          excess -=
            emptyReduction;
        }

        if (
          excess > 0
        ) {
          item.full = Math.max(
            0,
            item.full -
              excess
          );
        }
      }

      const reconciledAccounted =
        item.full +
        item.empty +
        item.with_customers +
        item.with_drivers +
        item.damaged +
        item.missing;

      item.circulation_rate =
        item.total > 0
          ? Math.round(
              (Math.min(
                reconciledAccounted,
                item.total
              ) /
                item.total) *
                100
            )
          : 0;
    }
  );

  return inventory;
}

/*
|--------------------------------------------------------------------------
| CUSTOMER CONTAINER TRACKING
|--------------------------------------------------------------------------
*/

export async function getCustomerContainers(
  filters = {}
) {
  const {
    toDate = "",
  } = filters;

  const [
    allOrders,
    allReturns,
    allDeliveries,
    allBorrowings,
  ] = await Promise.all([
    getOrders(),
    getContainerReturns(),
    getDeliveries(),
    getContainerBorrowings(),
  ]);

  const cutoffTimestamp =
    getEndOfDay(toDate);

  const orderRows =
    allOrders.filter(
      (order) => {
        if (
          cutoffTimestamp ===
          null
        ) {
          return true;
        }

        const time =
          new Date(
            order.created_at
          ).getTime();

        return (
          Number.isFinite(
            time
          ) &&
          time <=
            cutoffTimestamp
        );
      }
    );

  const returnRows =
    allReturns.filter(
      (record) => {
        if (
          cutoffTimestamp ===
          null
        ) {
          return true;
        }

        const time =
          new Date(
            record.created_at
          ).getTime();

        return (
          Number.isFinite(
            time
          ) &&
          time <=
            cutoffTimestamp
        );
      }
    );

  const deliveryRows =
    allDeliveries.filter(
      (delivery) => {
        if (
          cutoffTimestamp ===
          null
        ) {
          return true;
        }

        const time =
          new Date(
            delivery.created_at
          ).getTime();

        return (
          Number.isFinite(
            time
          ) &&
          time <=
            cutoffTimestamp
        );
      }
    );

  const borrowingRows =
    allBorrowings.filter(
      (borrowing) => {
        if (
          cutoffTimestamp ===
          null
        ) {
          return true;
        }

        const time =
          new Date(
            borrowing.borrowed_at ||
              borrowing.created_at
          ).getTime();

        return (
          Number.isFinite(
            time
          ) &&
          time <=
            cutoffTimestamp
        );
      }
    );

  const deliveryMap =
    new Map(
      deliveryRows.map(
        (row) => [
          String(
            row.order_id
          ),
          row,
        ]
      )
    );

  const linkedBorrowingKeys =
    new Set(
      borrowingRows
        .filter(
          (borrowing) =>
            borrowing.order_id &&
            ![
              "cancelled",
              "requested",
            ].includes(
              normalizeStatus(
                borrowing.status
              )
            )
        )
        .map(
          (borrowing) =>
            `${borrowing.order_id}::${normalizeCapacity(
              borrowing.capacity
            )}`
        )
    );

  const balances =
    new Map();

  const names =
    new Map();

  const dates =
    new Map();

  function addBalance({
    customerId,
    size,
    amount,
    name,
    date,
  }) {
    if (
      !customerId ||
      !size ||
      !amount
    ) {
      return;
    }

    const key =
      `${customerId}::${size}`;

    balances.set(
      key,
      (balances.get(key) || 0) +
        amount
    );

    names.set(
      key,
      name ||
        names.get(key) ||
        "Unknown Customer"
    );

    const oldDate =
      dates.get(key);

    if (
      !oldDate ||
      new Date(
        date || 0
      ) >
        new Date(
          oldDate
        )
    ) {
      dates.set(
        key,
        date
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | NORMAL DELIVERIES
  |--------------------------------------------------------------------------
  */

  orderRows.forEach(
    (order) => {
      const delivery =
        deliveryMap.get(
          String(order.id)
        );

      /*
      |--------------------------------------------------------------------------
      | Borrow orders are tracked through
      | container_borrowings instead.
      |--------------------------------------------------------------------------
      */

      if (
        isBorrowOrder(order) ||
        isExchange(order) ||
        linkedBorrowingKeys.has(
          `${order.id}::${normalizeCapacity(
            order.capacity ||
              order.product_name
          )}`
        )
      ) {
        return;
      }

      if (
        isCompleted(
          getEffectiveStatus(
            order,
            delivery
          )
        ) &&
        !isCancelled(
          order.status
        )
      ) {
        addBalance({
          customerId:
            order.customer_id,

          size:
            normalizeCapacity(
              order.capacity ||
                order.product_name
            ),

          amount:
            getQuantity(
              order,
              delivery
            ),

          name:
            resolveCustomerName(
              order
            ),

          date:
            delivery?.delivered_at ||
            order.created_at,
        });
      }
    }
  );

  /*
  |--------------------------------------------------------------------------
  | NORMAL RETURNS
  |--------------------------------------------------------------------------
  */

  returnRows.forEach(
    (row) => {
      const order =
        orderRows.find(
          (item) =>
            String(
              item.id
            ) ===
            String(
              row.order_id
            )
        );

      const removed =
        (Number(
          row.returned_quantity
        ) || 0) +
        (Number(
          row.damaged_quantity
        ) || 0) +
        (Number(
          row.missing_quantity
        ) || 0);

      addBalance({
        customerId:
          row.customer_id ||
          order?.customer_id,

        size:
          normalizeCapacity(
            row.capacity ||
              order?.capacity ||
              order?.product_name
          ),

        amount:
          -Math.max(
            0,
            removed
          ),

        name:
          resolveCustomerName(
            row
          ) ||
          resolveCustomerName(
            order
          ),

        date:
          row.created_at,
      });
    }
  );

  /*
  |--------------------------------------------------------------------------
  | BORROWINGS
  |--------------------------------------------------------------------------
  |
  | Borrowed containers are part of the customer's
  | container balance.
  |
  | The amount added here is ONLY the outstanding
  | borrowed quantity.
  |--------------------------------------------------------------------------
  */

  borrowingRows.forEach(
    (borrowing) => {
      const status =
        normalizeStatus(
          borrowing.status
        );

      if (
        ![
          "approved",
          "borrowed",
          "partially_returned",
          "returned",
        ].includes(
          status
        )
      ) {
        return;
      }

      const outstanding =
        getBorrowOutstanding(
          borrowing
        );

      if (
        outstanding <= 0
      ) {
        return;
      }

      addBalance({
        customerId:
          borrowing.customer_id,

        size:
          normalizeCapacity(
            borrowing.capacity
          ),

        amount:
          outstanding,

        name:
          resolveCustomerName(
            borrowing
          ),

        date:
          borrowing.borrowed_at ||
          borrowing.created_at,
      });
    }
  );

  return [
    ...balances.entries(),
  ]
    .filter(
      ([, amount]) =>
        amount > 0
    )
    .map(
      ([key, amount]) => {
        const separator =
          key.indexOf("::");

        const capacity =
          key.slice(
            separator + 2
          );

        /*
        |--------------------------------------------------------------------------
        | Determine whether this customer/capacity
        | currently has an outstanding borrowing.
        |--------------------------------------------------------------------------
        */

        const customerId =
          key.slice(
            0,
            separator
          );

        const hasBorrowing =
          borrowingRows.some(
            (borrowing) =>
              String(
                borrowing.customer_id
              ) ===
                String(
                  customerId
                ) &&
              normalizeCapacity(
                borrowing.capacity
              ) ===
                capacity &&
              getBorrowOutstanding(
                borrowing
              ) > 0
          );

        return {
          customer_id:
            customerId,

          customer_name:
            names.get(key),

          capacity,

          quantity:
            amount,

          last_transaction:
            dates.get(key),

          /*
          |--------------------------------------------------------------------------
          | Borrow is shown as a customer-held
          | container status.
          |--------------------------------------------------------------------------
          */

          status:
            hasBorrowing
              ? "BORROWED"
              : "WITH CUSTOMER",
        };
      }
    );
}

/*
|--------------------------------------------------------------------------
| CONTAINER BORROWING CUSTOMER SUMMARY
|--------------------------------------------------------------------------
*/

export async function getCustomerBorrowings(
  customerId,
  filters = {}
) {
  if (!customerId) {
    return [];
  }

  const rows =
    await getContainerBorrowings({
      ...filters,
      customerId,
    });

  return rows
    .map(
      (row) => ({
        ...row,

        capacity:
          normalizeCapacity(
            row.capacity
          ),

        quantity:
          Math.max(
            0,
            Number(
              row.quantity
            ) || 0
          ),

        returned_quantity:
          Math.max(
            0,
            Number(
              row.returned_quantity
            ) || 0
          ),

        damaged_quantity:
          Math.max(
            0,
            Number(
              row.damaged_quantity
            ) || 0
          ),

        missing_quantity:
          Math.max(
            0,
            Number(
              row.missing_quantity
            ) || 0
          ),

        outstanding_quantity:
          getBorrowOutstanding(
            row
          ),
      })
    );
}

/*
|--------------------------------------------------------------------------
| CONTAINER ISSUE RECORDS
|--------------------------------------------------------------------------
*/

export async function getContainerIssueRecords(
  filters = {}
) {
  const {
    fromDate = "",
    toDate = "",
  } = filters;

  const [
    returnRows,
    orderRows,
    deliveryRows,
    borrowingRows,
    employees,
  ] = await Promise.all([
    getContainerReturns(),
    getOrders(),
    getDeliveries(),
    getContainerBorrowings(),
    getEmployees(),
  ]);

  const driverMap =
    buildDriverMap(
      employees
    );

  const orderMap =
    new Map(
      orderRows.map(
        (row) => [
          String(row.id),
          row,
        ]
      )
    );

  const deliveryMap =
    new Map(
      deliveryRows.map(
        (row) => [
          String(
            row.order_id
          ),
          row,
        ]
      )
    );

  const records = [];

  /*
  |--------------------------------------------------------------------------
  | NORMAL RETURN ISSUES
  |--------------------------------------------------------------------------
  */

  returnRows.forEach(
    (row) => {
      if (
        !isWithinRange(
          row.created_at,
          fromDate,
          toDate
        )
      ) {
        return;
      }

      const order =
        row.order_id
          ? orderMap.get(
              String(
                row.order_id
              )
            )
          : null;

      const delivery =
        row.order_id
          ? deliveryMap.get(
              String(
                row.order_id
              )
            )
          : null;

      const damaged =
        Math.max(
          0,
          Number(
            row.damaged_quantity
          ) || 0
        );

      const missing =
        Math.max(
          0,
          Number(
            row.missing_quantity
          ) || 0
        );

      const expected =
        Math.max(
          0,
          Number(
            row.expected_quantity
          ) || 0
        );

      const returned =
        Math.max(
          0,
          Number(
            row.returned_quantity
          ) || 0
        );

      const customerName =
        resolveCustomerName(
          row
        ) ||
        resolveCustomerName(
          order
        );

      const resolvedDriverName =
        resolveDriverName(
          row,
          driverMap
        );

      const driverName =
        resolvedDriverName !== "—"
          ? resolvedDriverName
          : resolveDriverName(
              delivery,
              driverMap
            );

      const orderNumber =
        resolveOrderNumber(
          order
        );

      if (
        damaged > 0
      ) {
        records.push({
          id:
            `${row.id}-damaged`,

          return_id:
            row.id,

          issue_type:
            "DAMAGED",

          quantity:
            damaged,

          expected_quantity:
            expected,

          returned_quantity:
            returned,

          customer_name:
            customerName,

          capacity:
            normalizeCapacity(
              row.capacity ||
                order?.capacity ||
                order?.product_name
            ),

          product_name:
            row.product_name ||
            order?.product_name ||
            "Mineral Water",

          driver_name:
            driverName,

          order_number:
            orderNumber,

          date:
            row.created_at,

          notes:
            resolveNotes(
              row,
              delivery,
              order
            ),

          status:
            "DAMAGED",
        });
      }

      if (
        missing > 0
      ) {
        records.push({
          id:
            `${row.id}-missing`,

          return_id:
            row.id,

          issue_type:
            "MISSING",

          quantity:
            missing,

          expected_quantity:
            expected,

          returned_quantity:
            returned,

          customer_name:
            customerName,

          capacity:
            normalizeCapacity(
              row.capacity ||
                order?.capacity ||
                order?.product_name
            ),

          product_name:
            row.product_name ||
            order?.product_name ||
            "Mineral Water",

          driver_name:
            driverName,

          order_number:
            orderNumber,

          date:
            row.created_at,

          notes:
            resolveNotes(
              row,
              delivery,
              order
            ),

          status:
            "MISSING",
        });
      }
    }
  );

  /*
  |--------------------------------------------------------------------------
  | BORROWING ISSUES
  |--------------------------------------------------------------------------
  |
  | Damaged or missing borrowed containers are
  | treated as inventory issues.
  |--------------------------------------------------------------------------
  */

  borrowingRows.forEach(
    (row) => {
      const date =
        row.updated_at ||
        row.returned_at ||
        row.borrowed_at ||
        row.created_at;

      if (
        !isWithinRange(
          date,
          fromDate,
          toDate
        )
      ) {
        return;
      }

      const damaged =
        Math.max(
          0,
          Number(
            row.damaged_quantity
          ) || 0
        );

      const missing =
        Math.max(
          0,
          Number(
            row.missing_quantity
          ) || 0
        );

      if (
        damaged > 0
      ) {
        records.push({
          id:
            `${row.id}-borrow-damaged`,

          return_id:
            row.id,

          borrowing_id:
            row.id,

          issue_type:
            "DAMAGED",

          quantity:
            damaged,

          expected_quantity:
            Number(
              row.quantity
            ) || 0,

          returned_quantity:
            Number(
              row.returned_quantity
            ) || 0,

          customer_name:
            resolveCustomerName(
              row
            ),

          capacity:
            normalizeCapacity(
              row.capacity
            ),

          product_name:
            "Mineral Water",

          driver_name:
            "—",

          order_number:
            row.order_id
              ? resolveOrderNumber(
                  orderMap.get(
                    String(
                      row.order_id
                    )
                  )
                )
              : "—",

          date,

          notes:
            resolveNotes(
              row
            ),

          status:
            "DAMAGED",
        });
      }

      if (
        missing > 0
      ) {
        records.push({
          id:
            `${row.id}-borrow-missing`,

          return_id:
            row.id,

          borrowing_id:
            row.id,

          issue_type:
            "MISSING",

          quantity:
            missing,

          expected_quantity:
            Number(
              row.quantity
            ) || 0,

          returned_quantity:
            Number(
              row.returned_quantity
            ) || 0,

          customer_name:
            resolveCustomerName(
              row
            ),

          capacity:
            normalizeCapacity(
              row.capacity
            ),

          product_name:
            "Mineral Water",

          driver_name:
            "—",

          order_number:
            row.order_id
              ? resolveOrderNumber(
                  orderMap.get(
                    String(
                      row.order_id
                    )
                  )
                )
              : "—",

          date,

          notes:
            resolveNotes(
              row
            ),

          status:
            "MISSING",
        });
      }
    }
  );

  records.sort(
    (a, b) =>
      new Date(
        b.date || 0
      ) -
      new Date(
        a.date || 0
      )
  );

  const totalMissing =
    records
      .filter(
        (record) =>
          record.issue_type ===
          "MISSING"
      )
      .reduce(
        (sum, record) =>
          sum +
          Number(
            record.quantity || 0
          ),
        0
      );

  const totalDamaged =
    records
      .filter(
        (record) =>
          record.issue_type ===
          "DAMAGED"
      )
      .reduce(
        (sum, record) =>
          sum +
          Number(
            record.quantity || 0
          ),
        0
      );

  const customers =
    new Set(
      records
        .map(
          (record) =>
            record.customer_name
        )
        .filter(Boolean)
    );

  return {
    records,

    summary: {
      total_records:
        records.length,

      total_issues:
        totalMissing +
        totalDamaged,

      total_missing:
        totalMissing,

      total_damaged:
        totalDamaged,

      customers_affected:
        customers.size,

      missing_records:
        records.filter(
          (record) =>
            record.issue_type ===
            "MISSING"
        ).length,

      damaged_records:
        records.filter(
          (record) =>
            record.issue_type ===
            "DAMAGED"
        ).length,
    },
  };
}

/*
|--------------------------------------------------------------------------
| TRANSACTION HISTORY
|--------------------------------------------------------------------------
|
| Movement
|   = What physically happened?
|
| Product
|   = What container was involved?
|
| Customer
|   = Who received/returned it?
|
| Driver
|   = Who handled the delivery/return?
|
| Quantity
|   = How many containers?
|
| Purpose
|   = Why did the movement happen?
|
| Result
|   = Where did the containers end up?
|--------------------------------------------------------------------------
*/

export async function getTransactionHistory(
  filters = {}
) {
  const {
    fromDate = "",
    toDate = "",
  } = filters;

  const [
    orderRows,
    returnRows,
    deliveryRows,
    borrowingRows,
    employees,
  ] = await Promise.all([
    getOrders(),
    getContainerReturns(),
    getDeliveries(),
    getContainerBorrowings(),
    getEmployees(),
  ]);

  const driverMap =
    buildDriverMap(
      employees
    );

  const deliveryMap =
    new Map(
      deliveryRows.map(
        (row) => [
          String(
            row.order_id
          ),
          row,
        ]
      )
    );

  const orderMap =
    new Map(
      orderRows.map(
        (row) => [
          String(row.id),
          row,
        ]
      )
    );

  const transactions = [];

  /*
  |--------------------------------------------------------------------------
  | DELIVERY TRANSACTIONS
  |--------------------------------------------------------------------------
  */

  orderRows.forEach(
    (order) => {
      const delivery =
        deliveryMap.get(
          String(order.id)
        );

      const currentStatus =
        getEffectiveStatus(
          order,
          delivery
        );

      const amount =
        getQuantity(
          order,
          delivery
        );

      if (
        !amount ||
        isCancelled(
          currentStatus
        )
      ) {
        return;
      }

      /*
      |--------------------------------------------------------------------------
      | Borrow orders are handled separately below.
      |--------------------------------------------------------------------------
      */

      if (
        isBorrowOrder(order)
      ) {
        return;
      }

      const resolvedDriverName =
        resolveDriverName(
          order,
          driverMap
        );

      const driverName =
        resolvedDriverName !== "—"
          ? resolvedDriverName
          : resolveDriverName(
              delivery,
              driverMap
            );

      const customerName =
        resolveCustomerName(
          order
        );

      const notes =
        resolveNotes(
          delivery,
          order
        );

      const orderNumber =
        resolveOrderNumber(
          order
        );

      const purpose =
        isExchange(order)
          ? "Exchange"
          : "New Containers";

      /*
      |--------------------------------------------------------------------------
      | DELIVERED
      |--------------------------------------------------------------------------
      */

      if (
        isCompleted(
          currentStatus
        )
      ) {
        const date =
          delivery?.delivered_at ||
          order.delivered_at ||
          order.completed_at ||
          order.created_at;

        if (
          isWithinRange(
            date,
            fromDate,
            toDate
          )
        ) {
          transactions.push({
            id:
              `${order.id}-delivered`,

            date,

            movement:
              "Delivered",

            product:
              order.product_name ||
              "Mineral Water",

            capacity:
              normalizeCapacity(
                order.capacity ||
                  order.product_name
              ),

            customer:
              customerName,

            driver:
              driverName,

            quantity:
              amount,

            purpose,

            result:
              "With Customer",

            notes,

            order_number:
              orderNumber,

            order_id:
              order.id,
          });
        }
      }

      /*
      |--------------------------------------------------------------------------
      | ACTIVE DELIVERY
      |--------------------------------------------------------------------------
      */

      else if (
        isActive(
          currentStatus
        )
      ) {
        const date =
          delivery?.accepted_at ||
          delivery?.updated_at ||
          order.updated_at ||
          order.created_at;

        if (
          isWithinRange(
            date,
            fromDate,
            toDate
          )
        ) {
          transactions.push({
            id:
              `${order.id}-active`,

            date,

            movement:
              "Assigned",

            product:
              order.product_name ||
              "Mineral Water",

            capacity:
              normalizeCapacity(
                order.capacity ||
                  order.product_name
              ),

            customer:
              customerName,

            driver:
              driverName,

            quantity:
              amount,

            purpose,

            result:
              "With Driver",

            notes,

            order_number:
              orderNumber,

            order_id:
              order.id,
          });
        }
      }
    }
  );

  /*
  |--------------------------------------------------------------------------
  | BORROWING TRANSACTIONS
  |--------------------------------------------------------------------------
  */

  borrowingRows.forEach(
    (row) => {
      const status =
        normalizeStatus(
          row.status
        );

      /*
      |--------------------------------------------------------------------------
      | Ignore cancelled/requested records.
      |--------------------------------------------------------------------------
      */

      if (
        [
          "cancelled",
          "requested",
        ].includes(
          status
        )
      ) {
        return;
      }

      const quantity =
        Math.max(
          0,
          Number(
            row.quantity
          ) || 0
        );

      if (
        quantity <= 0
      ) {
        return;
      }

      const returned =
        Math.max(
          0,
          Number(
            row.returned_quantity
          ) || 0
        );

      const damaged =
        Math.max(
          0,
          Number(
            row.damaged_quantity
          ) || 0
        );

      const missing =
        Math.max(
          0,
          Number(
            row.missing_quantity
          ) || 0
        );

      const outstanding =
        Math.max(
          0,
          quantity -
            returned -
            damaged -
            missing
        );

      const order =
        row.order_id
          ? orderMap.get(
              String(
                row.order_id
              )
            )
          : null;

      const delivery =
        row.delivery_id
          ? deliveryRows.find(
              (item) =>
                String(
                  item.id
                ) ===
                String(
                  row.delivery_id
                )
            )
          : row.order_id
            ? deliveryMap.get(
                String(
                  row.order_id
                )
              )
            : null;

      const customerName =
        resolveCustomerName(
          row
        ) ||
        resolveCustomerName(
          order
        );

      const resolvedBorrowDriver =
        resolveDriverName(
          row,
          driverMap
        );

      const driverName =
        resolvedBorrowDriver !== "—"
          ? resolvedBorrowDriver
          : resolveDriverName(
              delivery,
              driverMap
            );

      const orderNumber =
        resolveOrderNumber(
          order
        );

      /*
      |--------------------------------------------------------------------------
      | BORROWED
      |--------------------------------------------------------------------------
      */

      const borrowedDate =
        row.borrowed_at ||
        row.created_at;

      if (
        [
          "approved",
          "borrowed",
          "partially_returned",
          "returned",
        ].includes(
          status
        ) &&
        isWithinRange(
          borrowedDate,
          fromDate,
          toDate
        )
      ) {
        transactions.push({
          id:
            `${row.id}-borrowed`,

          date:
            borrowedDate,

          movement:
            "Borrowed",

          product:
            "Mineral Water",

          capacity:
            normalizeCapacity(
              row.capacity
            ),

          customer:
            customerName,

          driver:
            driverName,

          quantity:
            quantity,

          purpose:
            "Borrow",

          result:
            outstanding > 0
              ? "With Customer"
              : "Returned",

          notes:
            resolveNotes(
              row,
              delivery,
              order
            ),

          order_number:
            orderNumber,

          order_id:
            row.order_id ||
            null,

          borrowing_id:
            row.id,

          borrowing_status:
            status,
        });
      }

      /*
      |--------------------------------------------------------------------------
      | BORROW RETURN
      |--------------------------------------------------------------------------
      */

      if (
        returned > 0
      ) {
        const returnDate =
          row.returned_at ||
          row.updated_at ||
          row.created_at;

        if (
          isWithinRange(
            returnDate,
            fromDate,
            toDate
          )
        ) {
          transactions.push({
            id:
              `${row.id}-borrow-return`,

            date:
              returnDate,

            movement:
              "Returned",

            product:
              "Mineral Water",

            capacity:
              normalizeCapacity(
                row.capacity
              ),

            customer:
              customerName,

            driver:
              driverName,

            quantity:
              returned,

            purpose:
              "Borrow Return",

            result:
              "Recovered",

            notes:
              resolveNotes(
                row,
                delivery,
                order
              ),

            order_number:
              orderNumber,

            order_id:
              row.order_id ||
              null,

            borrowing_id:
              row.id,

            borrowing_status:
              status,
          });
        }
      }

      /*
      |--------------------------------------------------------------------------
      | BORROW DAMAGED
      |--------------------------------------------------------------------------
      */

      if (
        damaged > 0
      ) {
        const issueDate =
          row.returned_at ||
          row.updated_at ||
          row.created_at;

        if (
          isWithinRange(
            issueDate,
            fromDate,
            toDate
          )
        ) {
          transactions.push({
            id:
              `${row.id}-borrow-damaged`,

            date:
              issueDate,

            movement:
              "Damaged",

            product:
              "Mineral Water",

            capacity:
              normalizeCapacity(
                row.capacity
              ),

            customer:
              customerName,

            driver:
              driverName,

            quantity:
              damaged,

            purpose:
              "Borrow Return Issue",

            result:
              "Damaged",

            notes:
              resolveNotes(
                row,
                delivery,
                order
              ),

            order_number:
              orderNumber,

            order_id:
              row.order_id ||
              null,

            borrowing_id:
              row.id,

            borrowing_status:
              status,
          });
        }
      }

      /*
      |--------------------------------------------------------------------------
      | BORROW MISSING
      |--------------------------------------------------------------------------
      */

      if (
        missing > 0
      ) {
        const issueDate =
          row.returned_at ||
          row.updated_at ||
          row.created_at;

        if (
          isWithinRange(
            issueDate,
            fromDate,
            toDate
          )
        ) {
          transactions.push({
            id:
              `${row.id}-borrow-missing`,

            date:
              issueDate,

            movement:
              "Missing",

            product:
              "Mineral Water",

            capacity:
              normalizeCapacity(
                row.capacity
              ),

            customer:
              customerName,

            driver:
              driverName,

            quantity:
              missing,

            purpose:
              "Borrow Return Issue",

            result:
              "Missing",

            notes:
              resolveNotes(
                row,
                delivery,
                order
              ),

            order_number:
              orderNumber,

            order_id:
              row.order_id ||
              null,

            borrowing_id:
              row.id,

            borrowing_status:
              status,
          });
        }
      }
    }
  );

  {
    if (false) {
        const driverName =
        resolveDriverName(
          order,
          driverMap
        ) !== "—"
          ? resolveDriverName(
              order,
              driverMap
            )
          : resolveDriverName(
              delivery,
              driverMap
            );

      const customerName =
        resolveCustomerName(
          order
        );

      const capacity =
        normalizeCapacity(
          order.capacity ||
            order.product_name
        );

      const productName =
        order.product_name ||
        "Mineral Water";

      const orderNumber =
        resolveOrderNumber(
          order
        );

      const purpose =
        isExchange(order)
          ? "Exchange"
          : "New";

      /*
      |--------------------------------------------------------------------------
      | COMPLETED DELIVERY
      |--------------------------------------------------------------------------
      */

      if (
        isCompleted(
          currentStatus
        )
      ) {
        const deliveredDate =
          delivery?.delivered_at ||
          order.delivered_at ||
          order.completed_at ||
          order.updated_at ||
          order.created_at;

        if (
          isWithinRange(
            deliveredDate,
            fromDate,
            toDate
          )
        ) {
          transactions.push({
            id:
              `${order.id}-delivery`,

            date:
              deliveredDate,

            movement:
              "DELIVERY",

            product:
              productName,

            capacity,

            customer:
              customerName,

            driver:
              driverName,

            quantity:
              amount,

            purpose,

            result:
              isExchange(order)
                ? "Customer Exchange"
                : "With Customer",

            notes:
              resolveNotes(
                delivery,
                order
              ),

            order_number:
              orderNumber,

            order_id:
              order.id,
          });
        }
      }

      /*
      |--------------------------------------------------------------------------
      | ACTIVE DELIVERY
      |--------------------------------------------------------------------------
      */

      else if (
        isActive(
          currentStatus
        )
      ) {
        const activeDate =
          delivery?.updated_at ||
          order.updated_at ||
          order.created_at;

        if (
          isWithinRange(
            activeDate,
            fromDate,
            toDate
          )
        ) {
          transactions.push({
            id:
              `${order.id}-delivery-active`,

            date:
              activeDate,

            movement:
              "DELIVERY",

            product:
              productName,

            capacity,

            customer:
              customerName,

            driver:
              driverName,

            quantity:
              amount,

            purpose,

            result:
              "With Driver",

            notes:
              resolveNotes(
                delivery,
                order
              ),

            order_number:
              orderNumber,

            order_id:
              order.id,
          });
        }
      }
    }
  }

  /*
  |--------------------------------------------------------------------------
  | NORMAL CONTAINER RETURNS
  |--------------------------------------------------------------------------
  */

  returnRows.forEach(
    (row) => {
      const date =
        row.created_at ||
        row.updated_at;

      if (
        !isWithinRange(
          date,
          fromDate,
          toDate
        )
      ) {
        return;
      }

      const order =
        row.order_id
          ? orderMap.get(
              String(
                row.order_id
              )
            )
          : null;

      const delivery =
        row.order_id
          ? deliveryMap.get(
              String(
                row.order_id
              )
            )
          : null;

      const returned =
        Math.max(
          0,
          Number(
            row.returned_quantity
          ) || 0
        );

      const damaged =
        Math.max(
          0,
          Number(
            row.damaged_quantity
          ) || 0
        );

      const missing =
        Math.max(
          0,
          Number(
            row.missing_quantity
          ) || 0
        );

      const customerName =
        resolveCustomerName(
          row
        ) ||
        resolveCustomerName(
          order
        );

      const resolvedDriver =
        resolveDriverName(
          row,
          driverMap
        );

      const driverName =
        resolvedDriver !== "—"
          ? resolvedDriver
          : resolveDriverName(
              delivery,
              driverMap
            );

      const capacity =
        normalizeCapacity(
          row.capacity ||
            order?.capacity ||
            order?.product_name
        );

      const productName =
        row.product_name ||
        order?.product_name ||
        "Mineral Water";

      const orderNumber =
        resolveOrderNumber(
          order
        );

      /*
      |--------------------------------------------------------------------------
      | RETURNED
      |--------------------------------------------------------------------------
      */

      if (
        returned > 0
      ) {
        transactions.push({
          id:
            `${row.id}-return`,

          date,

          movement:
            "RETURN",

          product:
            productName,

          capacity,

          customer:
            customerName,

          driver:
            driverName,

          quantity:
            returned,

          purpose:
            "Container Return",

          result:
            "Empty / For Refill",

          notes:
            resolveNotes(
              row,
              delivery,
              order
            ),

          order_number:
            orderNumber,

          order_id:
            row.order_id ||
            null,

          return_id:
            row.id,
        });
      }

      /*
      |--------------------------------------------------------------------------
      | DAMAGED
      |--------------------------------------------------------------------------
      */

      if (
        damaged > 0
      ) {
        transactions.push({
          id:
            `${row.id}-damaged`,

          date,

          movement:
            "DAMAGED",

          product:
            productName,

          capacity,

          customer:
            customerName,

          driver:
            driverName,

          quantity:
            damaged,

          purpose:
            "Container Return",

          result:
            "Damaged",

          notes:
            resolveNotes(
              row,
              delivery,
              order
            ),

          order_number:
            orderNumber,

          order_id:
            row.order_id ||
            null,

          return_id:
            row.id,
        });
      }

      /*
      |--------------------------------------------------------------------------
      | MISSING
      |--------------------------------------------------------------------------
      */

      if (
        missing > 0
      ) {
        transactions.push({
          id:
            `${row.id}-missing`,

          date,

          movement:
            "MISSING",

          product:
            productName,

          capacity,

          customer:
            customerName,

          driver:
            driverName,

          quantity:
            missing,

          purpose:
            "Container Return",

          result:
            "Missing",

          notes:
            resolveNotes(
              row,
              delivery,
              order
            ),

          order_number:
            orderNumber,

          order_id:
            row.order_id ||
            null,

          return_id:
            row.id,
        });
      }
    }
  );

  /*
  |--------------------------------------------------------------------------
  | SORT TRANSACTIONS
  |--------------------------------------------------------------------------
  */

  transactions.sort(
    (a, b) =>
      new Date(
        b.date || 0
      ) -
      new Date(
        a.date || 0
      )
  );

  return transactions;
}

/*
|--------------------------------------------------------------------------
| BORROWING VALIDATION
|--------------------------------------------------------------------------
*/

export async function validateContainerBorrowing(
  {
    customerId,
    capacity,
    quantity,
    borrowingId = null,
  } = {}
) {
  if (!customerId) {
    return {
      valid: false,
      message:
        "Customer is required.",
    };
  }

  const normalizedCapacity =
    normalizeCapacity(
      capacity
    );

  const requestedQuantity =
    Math.max(
      0,
      Math.floor(
        Number(
          quantity
        ) || 0
      )
    );

  if (
    requestedQuantity <= 0
  ) {
    return {
      valid: false,
      message:
        "Borrow quantity must be greater than zero.",
    };
  }

  const settings =
    await getContainerBorrowSettings();

  if (
    settings.enabled === false
  ) {
    return {
      valid: false,
      message:
        "Container borrowing is currently disabled.",
    };
  }

  /*
  |--------------------------------------------------------------------------
  | CUSTOMER'S CURRENT OUTSTANDING BORROWED
  |--------------------------------------------------------------------------
  */

  const existingRows =
    await getContainerBorrowings({
      customerId,
    });

  const currentBorrowed =
    existingRows
      .filter(
        (row) => {
          if (
            borrowingId &&
            String(
              row.id
            ) ===
              String(
                borrowingId
              )
          ) {
            return false;
          }

          const rowCapacity =
            normalizeCapacity(
              row.capacity
            );

          if (
            rowCapacity !==
            normalizedCapacity
          ) {
            return false;
          }

          const status =
            normalizeStatus(
              row.status
            );

          return [
            "approved",
            "borrowed",
            "partially_returned",
          ].includes(
            status
          );
        }
      )
      .reduce(
        (
          total,
          row
        ) =>
          total +
          getBorrowOutstanding(
            row
          ),
        0
      );

  const maximum =
    Math.max(
      1,
      Number(
        settings.maximum_per_customer
      ) || 10
    );

  const availableLimit =
    Math.max(
      0,
      maximum -
        currentBorrowed
    );

  if (
    requestedQuantity >
    availableLimit
  ) {
    return {
      valid: false,

      message:
        availableLimit <= 0
          ? `Customer has reached the maximum of ${maximum} borrowed containers.`
          : `Customer can only borrow ${availableLimit} more container(s).`,

      current_borrowed:
        currentBorrowed,

      maximum_per_customer:
        maximum,

      available_limit:
        availableLimit,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | CHECK AVAILABLE INVENTORY
  |--------------------------------------------------------------------------
  */

  const inventory =
    await getInventory();

  const item =
    inventory.find(
      (inventoryItem) =>
        normalizeCapacity(
          inventoryItem.capacity
        ) ===
        normalizedCapacity
    );

  if (!item) {
    return {
      valid: false,
      message:
        `No inventory configuration was found for ${normalizedCapacity}.`,
    };
  }

  if (
    item.full <
    requestedQuantity
  ) {
    return {
      valid: false,

      message:
        `Only ${item.full} container(s) are currently available for borrowing.`,

      available:
        item.full,
    };
  }

  return {
    valid: true,

    current_borrowed:
      currentBorrowed,

    requested:
      requestedQuantity,

    maximum_per_customer:
      maximum,

    available_limit:
      availableLimit,

    inventory_available:
      item.full,
  };
}

/*
|--------------------------------------------------------------------------
| CREATE CONTAINER BORROWING
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| CREATE CONTAINER BORROWING
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| A NEW borrowing can ONLY be created from a real order.
|
| Example:
|
| Customer orders 10 gallons
| Delivery Type = Borrow
|
| THEN:
|
| container_borrowings:
| quantity = 10
| order_id = the real order ID
|
| A customer returning an OLD borrowing must NOT call this function.
| The existing borrowing record must be updated instead.
|
|--------------------------------------------------------------------------
*/

export async function createContainerBorrowing(
  {
    orderId = null,
    deliveryId = null,
    customerId,
    customerName = null,
    capacity,
    quantity,
    notes = null,
    status = "requested",
  } = {}
) {

  /*
  |--------------------------------------------------------------------------
  | 1. ORDER IS REQUIRED
  |--------------------------------------------------------------------------
  */

  if (!orderId) {
    throw new Error(
      "A valid order is required to create a new container borrowing. " +
      "For an old borrowed container return, update the existing borrowing."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | 2. LOAD THE ORDER
  |--------------------------------------------------------------------------
  */

  const {
    data: order,
    error: orderError,
  } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError) {
    throw orderError;
  }

  if (!order) {
    throw new Error(
      "Cannot create container borrowing because the related order does not exist."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | 3. DO NOT CREATE BORROWING FOR CANCELLED / REJECTED ORDERS
  |--------------------------------------------------------------------------
  */

  const orderStatus =
    normalizeStatus(order.status);

  if (isCancelled(orderStatus)) {
    throw new Error(
      "Cannot create a container borrowing for a cancelled or rejected order."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | 4. MAKE SURE THIS IS REALLY A BORROW ORDER
  |--------------------------------------------------------------------------
  */

  if (!isBorrowOrder(order)) {
    throw new Error(
      "Cannot create a container borrowing because this order is not marked as a borrow order."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | 5. VERIFY CUSTOMER
  |--------------------------------------------------------------------------
  */

  const orderCustomerId =
    order.customer_id !== null &&
    order.customer_id !== undefined
      ? String(order.customer_id).trim()
      : "";

  const suppliedCustomerId =
    customerId !== null &&
    customerId !== undefined
      ? String(customerId).trim()
      : "";

  /*
  |--------------------------------------------------------------------------
  | The supplied customer and order customer must match.
  |--------------------------------------------------------------------------
  */

  if (
    orderCustomerId &&
    suppliedCustomerId &&
    orderCustomerId !== suppliedCustomerId
  ) {
    throw new Error(
      "The borrowing customer does not match the customer on the order."
    );
  }

  const effectiveCustomerId =
    suppliedCustomerId ||
    orderCustomerId;

  if (!effectiveCustomerId) {
    throw new Error(
      "Customer is required to create a container borrowing."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | 6. VALIDATE BORROWING
  |--------------------------------------------------------------------------
  */

  const validation =
    await validateContainerBorrowing({
      customerId:
        effectiveCustomerId,

      capacity,

      quantity,
    });

  if (!validation.valid) {
    throw new Error(
      validation.message
    );
  }

  /*
  |--------------------------------------------------------------------------
  | 7. NORMALIZE CAPACITY
  |--------------------------------------------------------------------------
  */

  const normalizedCapacity =
    normalizeCapacity(capacity);

  /*
  |--------------------------------------------------------------------------
  | 8. NORMALIZE QUANTITY
  |--------------------------------------------------------------------------
  */

  const requestedQuantity =
    Math.max(
      0,
      Math.floor(
        Number(quantity) || 0
      )
    );

  if (requestedQuantity <= 0) {
    throw new Error(
      "Borrowing quantity must be greater than zero."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | 9. VALIDATE STATUS
  |--------------------------------------------------------------------------
  */

  const normalizedStatus =
    normalizeStatus(status);

  const allowedStatuses = [
    "requested",
    "approved",
    "borrowed",
    "partially_returned",
    "returned",
    "cancelled",
  ];

  if (
    !allowedStatuses.includes(
      normalizedStatus
    )
  ) {
    throw new Error(
      `Invalid borrowing status: ${status}`
    );
  }

  /*
  |--------------------------------------------------------------------------
  | 10. PREVENT DUPLICATE BORROWING
  |--------------------------------------------------------------------------
  |
  | The same order + same container capacity should not create
  | multiple active borrowing records.
  |
  |--------------------------------------------------------------------------
  */

  const {
    data: existingRows,
    error: existingError,
  } = await supabase
    .from("container_borrowings")
    .select(
      "id, order_id, capacity, quantity, status"
    )
    .eq(
      "order_id",
      orderId
    )
    .eq(
      "capacity",
      normalizedCapacity
    )
    .not(
      "status",
      "in",
      "(returned,cancelled)"
    );

  if (existingError) {
    throw existingError;
  }

  if (
    Array.isArray(existingRows) &&
    existingRows.length > 0
  ) {
    throw new Error(
      "A borrowing record already exists for this order and container capacity. " +
      "The system will not create a duplicate borrowing."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | 11. CREATE THE BORROWING
  |--------------------------------------------------------------------------
  */

  const now =
    new Date().toISOString();

  const insertData = {
    order_id:
      orderId,

    delivery_id:
      deliveryId || null,

    customer_id:
      effectiveCustomerId,

    customer_name:
      customerName ||
      order.customer_name ||
      null,

    capacity:
      normalizedCapacity,

    quantity:
      requestedQuantity,

    returned_quantity:
      0,

    damaged_quantity:
      0,

    missing_quantity:
      0,

    status:
      normalizedStatus,

    notes:
      notes || null,

    borrowed_at:
      normalizedStatus === "borrowed" ||
      normalizedStatus === "partially_returned" ||
      normalizedStatus === "returned"
        ? now
        : null,

    returned_at:
      normalizedStatus === "returned"
        ? now
        : null,

    created_at:
      now,

    updated_at:
      now,
  };

  const {
    data,
    error,
  } = await supabase
    .from("container_borrowings")
    .insert(insertData)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/*
|--------------------------------------------------------------------------
| FIND ORPHAN BORROWINGS
|--------------------------------------------------------------------------
|
| An orphan borrowing is a borrowing that has no order_id.
|
| We DO NOT automatically delete these because an old legitimate
| borrowing might have been created before the new order-linking
| rule was implemented.
|
|--------------------------------------------------------------------------
*/

export async function getOrphanContainerBorrowings() {
  const {
    data,
    error,
  } = await supabase
    .from("container_borrowings")
    .select("*")
    .is(
      "order_id",
      null
    )
    .order(
      "created_at",
      {
        ascending: true,
      }
    );

  if (error) {
    throw error;
  }

  return Array.isArray(data)
    ? data
    : [];
}


/*
|--------------------------------------------------------------------------
| CANCEL ACCIDENTAL ORPHAN BORROWING
|--------------------------------------------------------------------------
|
| Use this ONLY when you confirm that the borrowing was accidentally
| created without an order.
|
|--------------------------------------------------------------------------
*/

export async function cancelOrphanContainerBorrowing(
  borrowingId,
  notes =
    "Cancelled because this borrowing was created without a valid order."
) {

  if (!borrowingId) {
    throw new Error(
      "Borrowing ID is required."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Find the borrowing
  |--------------------------------------------------------------------------
  */

  const {
    data: borrowing,
    error: fetchError,
  } = await supabase
    .from("container_borrowings")
    .select("*")
    .eq(
      "id",
      borrowingId
    )
    .maybeSingle();

  if (fetchError) {
    throw fetchError;
  }

  if (!borrowing) {
    throw new Error(
      "Borrowing record not found."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Only allow this function for records WITHOUT an order.
  |--------------------------------------------------------------------------
  */

  if (borrowing.order_id) {
    throw new Error(
      "This borrowing has a valid order and is not an orphan record."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Cancel instead of deleting.
  |--------------------------------------------------------------------------
  |
  | This keeps the history intact while removing it from the active
  | inventory calculation.
  |
  |--------------------------------------------------------------------------
  */

  const {
    data,
    error,
  } = await supabase
    .from("container_borrowings")
    .update({
      status:
        "cancelled",

      notes:
        notes,

      returned_at:
        null,

      updated_at:
        new Date().toISOString(),
    })
    .eq(
      "id",
      borrowingId
    )
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/*
|--------------------------------------------------------------------------
| APPROVE BORROWING
|--------------------------------------------------------------------------
*/

export async function approveContainerBorrowing(
  borrowingId
) {
  if (!borrowingId) {
    throw new Error(
      "Borrowing ID is required."
    );
  }

  const {
    data: existing,
    error:
      fetchError,
  } = await supabase
    .from(
      "container_borrowings"
    )
    .select("*")
    .eq(
      "id",
      borrowingId
    )
    .single();

  if (fetchError) {
    throw fetchError;
  }

  const status =
    normalizeStatus(
      existing.status
    );

  if (
    status !== "requested"
  ) {
    throw new Error(
      `Only requested borrowings can be approved. Current status: ${existing.status}`
    );
  }

  const validation =
    await validateContainerBorrowing({
      customerId:
        existing.customer_id,

      capacity:
        existing.capacity,

      quantity:
        existing.quantity,

      borrowingId:
        existing.id,
    });

  if (
    !validation.valid
  ) {
    throw new Error(
      validation.message
    );
  }

  const {
    data,
    error,
  } = await supabase
    .from(
      "container_borrowings"
    )
    .update({
      status:
        "approved",

      updated_at:
        new Date().toISOString(),
    })
    .eq(
      "id",
      borrowingId
    )
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/*
|--------------------------------------------------------------------------
| MARK BORROWING AS BORROWED
|--------------------------------------------------------------------------
*/

export async function markContainerBorrowed(
  borrowingId
) {
  if (!borrowingId) {
    throw new Error(
      "Borrowing ID is required."
    );
  }

  const {
    data: existing,
    error:
      fetchError,
  } = await supabase
    .from(
      "container_borrowings"
    )
    .select("*")
    .eq(
      "id",
      borrowingId
    )
    .single();

  if (fetchError) {
    throw fetchError;
  }

  const status =
    normalizeStatus(
      existing.status
    );

  if (
    ![
      "approved",
      "requested",
    ].includes(
      status
    )
  ) {
    throw new Error(
      `Borrowing cannot be marked as borrowed from status: ${existing.status}`
    );
  }

  const validation =
    await validateContainerBorrowing({
      customerId:
        existing.customer_id,

      capacity:
        existing.capacity,

      quantity:
        existing.quantity,

      borrowingId:
        existing.id,
    });

  if (
    !validation.valid
  ) {
    throw new Error(
      validation.message
    );
  }

  const now =
    new Date().toISOString();

  const {
    data,
    error,
  } = await supabase
    .from(
      "container_borrowings"
    )
    .update({
      status:
        "borrowed",

      borrowed_at:
        existing.borrowed_at ||
        now,

      updated_at:
        now,
    })
    .eq(
      "id",
      borrowingId
    )
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateContainerBorrowingStatus(
  borrowingId,
  nextStatus,
  notes = null,
  quantities = {}
) {
  if (!borrowingId) {
    throw new Error("Borrowing ID is required.");
  }

  const { data: borrowing, error: fetchError } = await supabase
    .from("container_borrowings")
    .select("*")
    .eq("id", borrowingId)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  const returned = Math.max(0, Number(quantities.returned) || 0);
  const damaged = Math.max(0, Number(quantities.damaged) || 0);
  const missing = Math.max(0, Number(quantities.missing) || 0);
  const newReturned = (Number(borrowing.returned_quantity) || 0) + returned;
  const newDamaged = (Number(borrowing.damaged_quantity) || 0) + damaged;
  const newMissing = (Number(borrowing.missing_quantity) || 0) + missing;
  const total = Number(borrowing.quantity) || 0;
  const requestedStatus = normalizeStatus(nextStatus);

  if (
    requestedStatus !== "cancelled" &&
    returned === 0 &&
    damaged === 0 &&
    missing === 0
  ) {
    throw new Error("Please enter a returned, damaged, or missing quantity.");
  }

  if (newReturned + newDamaged + newMissing > total) {
    throw new Error("The return quantity exceeds the borrowed quantity.");
  }

  const normalizedStatus =
    requestedStatus === "cancelled"
      ? "cancelled"
      : newReturned + newDamaged + newMissing >= total
        ? "returned"
        : newReturned + newDamaged + newMissing > 0
          ? "partially_returned"
          : "borrowed";

  if (
    requestedStatus !== "cancelled" &&
    normalizedStatus === "borrowed" &&
    returned === 0 &&
    damaged === 0 &&
    missing === 0
  ) {
    throw new Error(
      "Please enter a returned, damaged, or missing quantity."
    );
  }

  const now = new Date().toISOString();
  const updateData = {
    returned_quantity: newReturned,
    damaged_quantity: newDamaged,
    missing_quantity: newMissing,
    status: normalizedStatus,
    updated_at: now,
    notes: notes || borrowing.notes || null,
  };

  if (
    normalizedStatus === "returned"
  ) {
    updateData.returned_at = now;
  }

  const { data, error } = await supabase
    .from("container_borrowings")
    .update(updateData)
    .eq("id", borrowingId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/*
|--------------------------------------------------------------------------
| CANCEL CONTAINER BORROWING
|--------------------------------------------------------------------------
*/

export async function cancelContainerBorrowing(
  borrowingId,
  notes = null
) {
  if (!borrowingId) {
    throw new Error(
      "Borrowing ID is required."
    );
  }

  const {
    data: borrowing,
    error,
  } = await supabase
    .from(
      "container_borrowings"
    )
    .select("*")
    .eq(
      "id",
      borrowingId
    )
    .single();

  if (error) {
    throw error;
  }

  const status =
    normalizeStatus(
      borrowing.status
    );

  if (
    [
      "returned",
      "cancelled",
    ].includes(
      status
    )
  ) {
    throw new Error(
      "This borrowing is already closed."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Active borrowings cannot simply be cancelled.
  |
  | If the customer already received the containers,
  | the containers must be accounted for through:
  |
  | - returned
  | - damaged
  | - missing
  |--------------------------------------------------------------------------
  */

  if (
    status ===
      "borrowed" ||
    status ===
      "partially_returned"
  ) {
    throw new Error(
      "An active borrowing cannot be cancelled. Please record the returned, damaged, or missing containers instead."
    );
  }

  return updateContainerBorrowingStatus(
    borrowingId,
    "cancelled",
    notes
  );
}

/*
|--------------------------------------------------------------------------
| GET ACTIVE BORROWINGS
|--------------------------------------------------------------------------
*/

export async function getActiveContainerBorrowings(
  filters = {}
) {
  const rows =
    await getContainerBorrowings(
      filters
    );

  return rows.filter(
    (row) => {
      const status =
        normalizeStatus(
          row.status
        );

      return (
        [
          "approved",
          "borrowed",
          "partially_returned",
        ].includes(
          status
        ) &&
        getBorrowOutstanding(
          row
        ) > 0
      );
    }
  );
}

/*
|--------------------------------------------------------------------------
| BORROWING SUMMARY
|--------------------------------------------------------------------------
*/

export async function getContainerBorrowingSummary(
  filters = {}
) {
  const rows =
    await getContainerBorrowings(
      filters
    );

  return rows.reduce(
    (
      summary,
      row
    ) => {
      const quantity =
        Math.max(
          0,
          Number(
            row.quantity
          ) || 0
        );

      const returned =
        Math.max(
          0,
          Number(
            row.returned_quantity
          ) || 0
        );

      const damaged =
        Math.max(
          0,
          Number(
            row.damaged_quantity
          ) || 0
        );

      const missing =
        Math.max(
          0,
          Number(
            row.missing_quantity
          ) || 0
        );

      const outstanding =
        Math.max(
          0,
          quantity -
            returned -
            damaged -
            missing
        );

      const status =
        normalizeStatus(
          row.status
        );

      summary.total_records +=
        1;

      summary.total_borrowed +=
        quantity;

      summary.total_returned +=
        returned;

      summary.total_damaged +=
        damaged;

      summary.total_missing +=
        missing;

      summary.total_outstanding +=
        outstanding;

      if (
        status ===
        "requested"
      ) {
        summary.requested +=
          1;
      }

      if (
        status ===
        "approved"
      ) {
        summary.approved +=
          1;
      }

      if (
        status ===
        "borrowed"
      ) {
        summary.borrowed +=
          1;
      }

      if (
        status ===
        "partially_returned"
      ) {
        summary.partially_returned +=
          1;
      }

      if (
        status ===
        "returned"
      ) {
        summary.returned +=
          1;
      }

      if (
        status ===
        "cancelled"
      ) {
        summary.cancelled +=
          1;
      }

      return summary;
    },
    {
      total_records: 0,

      total_borrowed: 0,

      total_returned: 0,

      total_damaged: 0,

      total_missing: 0,

      total_outstanding: 0,

      requested: 0,

      approved: 0,

      borrowed: 0,

      partially_returned: 0,

      returned: 0,

      cancelled: 0,
    }
  );
}

/*
|--------------------------------------------------------------------------
| INVENTORY SUMMARY
|--------------------------------------------------------------------------
*/

export async function getInventorySummary(
  filters = {}
) {
  const inventory =
    await getInventory(
      filters
    );

  return inventory.reduce(
    (
      result,
      item
    ) => {
      [
        "total",
        "full",
        "empty",
        "with_customers",
        "with_drivers",

        /*
        |--------------------------------------------------------------------------
        | Kept for backwards compatibility.
        | This remains 0 because Borrowed is already
        | included inside With Customers.
        |--------------------------------------------------------------------------
        */

        "with_borrowers",

        /*
        |--------------------------------------------------------------------------
        | Borrowed is a breakdown of With Customers.
        |--------------------------------------------------------------------------
        */

        "borrowed",

        "damaged",
        "missing",
      ].forEach(
        (key) => {
          result[key] +=
            Number(
              item[key]
            ) || 0;
        }
      );

      return result;
    },
    {
      total: 0,

      full: 0,

      empty: 0,

      with_customers: 0,

      with_drivers: 0,

      /*
      |--------------------------------------------------------------------------
      | Deprecated compatibility field.
      |--------------------------------------------------------------------------
      */

      with_borrowers: 0,

      /*
      |--------------------------------------------------------------------------
      | Borrowed customer-container breakdown.
      |--------------------------------------------------------------------------
      */

      borrowed: 0,

      damaged: 0,

      missing: 0,
    }
  );
}

/*
|--------------------------------------------------------------------------
| DISABLED MANUAL INVENTORY FUNCTIONS
|--------------------------------------------------------------------------
|
| Inventory is calculated from:
|
| - Orders
| - Deliveries
| - Container Returns
| - Container Borrowings
|
| Therefore, manual inventory adjustments are not
| allowed through these functions.
|--------------------------------------------------------------------------
*/

export async function recordDelivery() {
  throw new Error(
    "Inventory is calculated automatically from orders and deliveries."
  );
}

export async function adjustInventory() {
  throw new Error(
    "Manual inventory adjustment is disabled."
  );
}