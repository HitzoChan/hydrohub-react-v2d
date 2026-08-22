import { supabase } from "../lib/supabase";

/*
|--------------------------------------------------------------------------
| Configuration
|--------------------------------------------------------------------------
*/

const REFILL_MINUTES = 20;
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

      /*
      |--------------------------------------------------------------------------
      | Support several possible ID fields.
      |--------------------------------------------------------------------------
      */

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
  /*
  |--------------------------------------------------------------------------
  | First use an already available driver name.
  |--------------------------------------------------------------------------
  */

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

  /*
  |--------------------------------------------------------------------------
  | Otherwise resolve using the internal driver ID.
  |--------------------------------------------------------------------------
  */

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

  /*
  |--------------------------------------------------------------------------
  | Do NOT expose the complete UUID.
  |--------------------------------------------------------------------------
  |
  | If there is no human-readable order number,
  | use only a short reference.
  |--------------------------------------------------------------------------
  */

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
  cutoffTimestamp = null
) {
  return records
    .filter((record) => {
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
  ] = await Promise.all([
    getInventoryConfiguration(),
    getOrders(),
    getContainerReturns(),
    getDeliveries(),
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

    if (
      !item ||
      amount <= 0 ||
      isCancelled(
        currentStatus
      )
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
        cutoffTimestamp
      );

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
    */

    item.with_customers +=
      Math.max(
        0,
        amount -
          removed
      );

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
  | Normalize
  |--------------------------------------------------------------------------
  */

  inventory.forEach(
    (item) => {
      [
        "full",
        "empty",
        "with_customers",
        "with_drivers",
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

      const accounted =
        item.full +
        item.empty +
        item.with_customers +
        item.with_drivers +
        item.damaged +
        item.missing;

      item.circulation_rate =
        item.total > 0
          ? Math.round(
              (accounted /
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
  ] = await Promise.all([
    getOrders(),
    getContainerReturns(),
    getDeliveries(),
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
  | DELIVERIES
  |--------------------------------------------------------------------------
  */

  orderRows.forEach(
    (order) => {
      const delivery =
        deliveryMap.get(
          String(order.id)
        );

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
  | RETURNS
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

        return {
          customer_id:
            key.slice(
              0,
              separator
            ),

          customer_name:
            names.get(key),

          capacity:
            key.slice(
              separator + 2
            ),

          quantity:
            amount,

          last_transaction:
            dates.get(key),

          status:
            "WITH CUSTOMER",
        };
      }
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
    employees,
  ] = await Promise.all([
    getContainerReturns(),
    getOrders(),
    getDeliveries(),
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

      const driverName =
        resolveDriverName(
          row,
          driverMap
        ) !== "—"
          ? resolveDriverName(
              row,
              driverMap
            )
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
      | DAMAGED
      |--------------------------------------------------------------------------
      */

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

      /*
      |--------------------------------------------------------------------------
      | MISSING
      |--------------------------------------------------------------------------
      */

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
| New terminology:
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
    employees,
  ] = await Promise.all([
    getOrders(),
    getContainerReturns(),
    getDeliveries(),
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
      | Driver name
      |--------------------------------------------------------------------------
      */

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

      /*
      |--------------------------------------------------------------------------
      | Customer name
      |--------------------------------------------------------------------------
      */

      const customerName =
        resolveCustomerName(
          order
        );

      /*
      |--------------------------------------------------------------------------
      | Notes
      |--------------------------------------------------------------------------
      */

      const notes =
        resolveNotes(
          delivery,
          order
        );

      /*
      |--------------------------------------------------------------------------
      | Order number
      |--------------------------------------------------------------------------
      */

      const orderNumber =
        resolveOrderNumber(
          order
        );

      /*
      |--------------------------------------------------------------------------
      | PURPOSE
      |--------------------------------------------------------------------------
      */

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
      |
      | We include this only if it is within
      | the selected period.
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
  | RETURN TRANSACTIONS
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
          ? orderRows.find(
              (item) =>
                String(
                  item.id
                ) ===
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

      /*
      |--------------------------------------------------------------------------
      | The main return movement represents only
      | the containers physically returned.
      |--------------------------------------------------------------------------
      */

      if (
        returned > 0
      ) {
        const driverName =
          resolveDriverName(
            row,
            driverMap
          ) !== "—"
            ? resolveDriverName(
                row,
                driverMap
              )
            : resolveDriverName(
                delivery,
                driverMap
              );

        transactions.push({
          id:
            `${row.id}-return`,

          date:
            row.created_at,

          movement:
            "Returned",

          product:
            row.product_name ||
            order?.product_name ||
            "Mineral Water",

          capacity:
            normalizeCapacity(
              row.capacity ||
                order?.capacity ||
                order?.product_name
            ),

          customer:
            resolveCustomerName(
              row
            ) ||
            resolveCustomerName(
              order
            ),

          driver:
            driverName,

          quantity:
            returned,

          purpose:
            "Empty Return",

          result:
            isRefillReady(row)
              ? "Recovered"
              : "Waiting for Refill",

          notes:
            resolveNotes(
              row,
              delivery,
              order
            ),

          order_number:
            resolveOrderNumber(
              order
            ),

          order_id:
            row.order_id ||
            null,
        });
      }

      /*
      |--------------------------------------------------------------------------
      | DAMAGED
      |--------------------------------------------------------------------------
      |
      | Damage is shown as a separate movement
      | because those containers did NOT return
      | to usable inventory.
      |--------------------------------------------------------------------------
      */

      if (
        damaged > 0
      ) {
        transactions.push({
          id:
            `${row.id}-damaged`,

          date:
            row.created_at,

          movement:
            "Damaged",

          product:
            row.product_name ||
            order?.product_name ||
            "Mineral Water",

          capacity:
            normalizeCapacity(
              row.capacity ||
                order?.capacity ||
                order?.product_name
            ),

          customer:
            resolveCustomerName(
              row
            ) ||
            resolveCustomerName(
              order
            ),

          driver:
            resolveDriverName(
              row,
              driverMap
            ),

          quantity:
            damaged,

          purpose:
            "Return Issue",

          result:
            "Damaged",

          notes:
            resolveNotes(
              row,
              delivery,
              order
            ),

          order_number:
            resolveOrderNumber(
              order
            ),

          order_id:
            row.order_id ||
            null,
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

          date:
            row.created_at,

          movement:
            "Missing",

          product:
            row.product_name ||
            order?.product_name ||
            "Mineral Water",

          capacity:
            normalizeCapacity(
              row.capacity ||
                order?.capacity ||
                order?.product_name
            ),

          customer:
            resolveCustomerName(
              row
            ) ||
            resolveCustomerName(
              order
            ),

          driver:
            resolveDriverName(
              row,
              driverMap
            ),

          quantity:
            missing,

          purpose:
            "Return Issue",

          result:
            "Missing",

          notes:
            resolveNotes(
              row,
              delivery,
              order
            ),

          order_number:
            resolveOrderNumber(
              order
            ),

          order_id:
            row.order_id ||
            null,
        });
      }
    }
  );

  /*
  |--------------------------------------------------------------------------
  | SORT NEWEST FIRST
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
| RECORD CONTAINER RETURN
|--------------------------------------------------------------------------
*/

export async function recordContainerReturn({
  orderId,
  driverId,
  customerId,
  customerName,
  capacity: size,
  expectedQuantity,
  returnedQuantity,
  damagedQuantity = 0,
  notes = "",
}) {
  const expected =
    Number(
      expectedQuantity
    ) || 0;

  const returned =
    Number(
      returnedQuantity
    ) || 0;

  const damaged =
    Number(
      damagedQuantity
    ) || 0;

  if (
    !orderId ||
    !size ||
    expected <= 0 ||
    returned < 0 ||
    damaged < 0 ||
    returned + damaged >
      expected
  ) {
    throw new Error(
      "Invalid container return quantities."
    );
  }

  const missing =
    Math.max(
      0,
      expected -
        returned -
        damaged
    );

  const {
    data,
    error,
  } = await supabase
    .from(
      "container_returns"
    )
    .insert({
      order_id:
        orderId,

      driver_id:
        driverId || null,

      customer_id:
        customerId || null,

      customer_name:
        customerName || null,

      capacity:
        normalizeCapacity(
          size
        ),

      expected_quantity:
        expected,

      returned_quantity:
        returned,

      damaged_quantity:
        damaged,

      missing_quantity:
        missing,

      notes:
        notes || null,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function recordReturn(
  values = {}
) {
  return recordContainerReturn(
    values
  );
}

/*
|--------------------------------------------------------------------------
| SUMMARY
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
      damaged: 0,
      missing: 0,
    }
  );
}

/*
|--------------------------------------------------------------------------
| DISABLED MANUAL INVENTORY FUNCTIONS
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