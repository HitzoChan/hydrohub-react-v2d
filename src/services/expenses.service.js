import { supabase } from "./supabase";

/*
|--------------------------------------------------------------------------
| EXPENSE CATEGORIES
|--------------------------------------------------------------------------
*/

export const EXPENSE_CATEGORIES = [
  "Fuel",
  "Water Supply",
  "Electricity",
  "Maintenance",
  "Container / Gallon",
  "Delivery",
  "Employee",
  "Equipment",
  "Other",
];


/*
|--------------------------------------------------------------------------
| NORMALIZE EXPENSE
|--------------------------------------------------------------------------
*/

function normalizeExpense(expense) {
  return {
    ...expense,

    id: expense?.id || null,

    date:
      expense?.expense_date ||
      expense?.date ||
      expense?.created_at ||
      null,

    expense_date:
      expense?.expense_date ||
      null,

    type:
      expense?.expense_type ||
      expense?.type ||
      "Other",

    expense_type:
      expense?.expense_type ||
      expense?.type ||
      "Other",

    description:
      expense?.description ||
      "",

    amount:
      expense?.amount !== null &&
      expense?.amount !== undefined
        ? Number(expense.amount)
        : 0,

    driver_id:
      expense?.driver_id ||
      null,

    driver_name:
      expense?.driver_name ||
      "",

    notes:
      expense?.notes ||
      "",
  };
}


/*
|--------------------------------------------------------------------------
| NORMALIZE ORDER STATUS
|--------------------------------------------------------------------------
*/

function normalizeOrderStatus(status) {
  return String(status || "")
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_");
}


/*
|--------------------------------------------------------------------------
| NORMALIZE PAYMENT STATUS
|--------------------------------------------------------------------------
*/

function normalizePaymentStatus(status) {
  return String(status || "")
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_");
}


/*
|--------------------------------------------------------------------------
| CHECK COMPLETED ORDER
|--------------------------------------------------------------------------
*/

function isCompletedOrder(order) {
  const status =
    normalizeOrderStatus(
      order?.status
    );

  return (
    status === "delivered" ||
    status === "completed"
  );
}


/*
|--------------------------------------------------------------------------
| CHECK REJECTED PAYMENT
|--------------------------------------------------------------------------
*/

function isRejectedPayment(order) {
  const paymentStatus =
    normalizePaymentStatus(
      order?.payment_status
    );

  return (
    paymentStatus === "rejected"
  );
}


/*
|--------------------------------------------------------------------------
| CHECK VALID REVENUE ORDER
|--------------------------------------------------------------------------
*/

function isRevenueOrder(order) {
  return (
    isCompletedOrder(order) &&
    !isRejectedPayment(order)
  );
}


/*
|--------------------------------------------------------------------------
| CURRENCY
|--------------------------------------------------------------------------
*/

export function formatCurrency(value) {
  const amount =
    Number(value) || 0;

  return new Intl.NumberFormat(
    "en-PH",
    {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(amount);
}


/*
|--------------------------------------------------------------------------
| TODAY
|--------------------------------------------------------------------------
*/

export function getToday() {
  const date = new Date();

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


/*
|--------------------------------------------------------------------------
| DATABASE DATE FORMAT
|--------------------------------------------------------------------------
*/

export function formatDateForDatabase(
  date
) {
  if (!(date instanceof Date)) {
    return "";
  }

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


/*
|--------------------------------------------------------------------------
| DISPLAY DATE
|--------------------------------------------------------------------------
*/

export function formatDisplayDate(
  value
) {
  if (!value) {
    return "-";
  }

  const date =
    new Date(
      `${value}T00:00:00`
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleDateString(
    "en-PH",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );
}


/*
|--------------------------------------------------------------------------
| PERIOD RANGE
|--------------------------------------------------------------------------
|
| daily   = selected date
| monthly = selected month
| yearly  = selected year
|--------------------------------------------------------------------------
*/

export function getPeriodRange(
  period,
  selectedDate
) {
  const fallback =
    getToday();

  const dateString =
    selectedDate ||
    fallback;

  const date =
    new Date(
      `${dateString}T00:00:00`
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return {
      start: fallback,
      end: fallback,
    };
  }

  let start;
  let end;


  /*
  |--------------------------------------------------------------------------
  | DAILY
  |--------------------------------------------------------------------------
  */

  if (
    period === "daily"
  ) {
    start =
      new Date(date);

    end =
      new Date(date);
  }


  /*
  |--------------------------------------------------------------------------
  | YEARLY
  |--------------------------------------------------------------------------
  */

  else if (
    period === "yearly"
  ) {
    start =
      new Date(
        date.getFullYear(),
        0,
        1
      );

    end =
      new Date(
        date.getFullYear(),
        11,
        31
      );
  }


  /*
  |--------------------------------------------------------------------------
  | MONTHLY
  |--------------------------------------------------------------------------
  */

  else {
    start =
      new Date(
        date.getFullYear(),
        date.getMonth(),
        1
      );

    end =
      new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0
      );
  }


  return {
    start:
      formatDateForDatabase(
        start
      ),

    end:
      formatDateForDatabase(
        end
      ),
  };
}


/*
|--------------------------------------------------------------------------
| PERIOD LABEL
|--------------------------------------------------------------------------
*/

export function getPeriodLabel(
  period,
  selectedDate
) {
  if (!selectedDate) {
    return "";
  }

  const date =
    new Date(
      `${selectedDate}T00:00:00`
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }


  if (
    period === "daily"
  ) {
    return date.toLocaleDateString(
      "en-PH",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
  }


  if (
    period === "yearly"
  ) {
    return String(
      date.getFullYear()
    );
  }


  return date.toLocaleDateString(
    "en-PH",
    {
      year: "numeric",
      month: "long",
    }
  );
}


/*
|--------------------------------------------------------------------------
| GET ALL EXPENSES
|--------------------------------------------------------------------------
*/

export async function getExpenses() {
  const {
    data,
    error,
  } = await supabase
    .from("expenses")
    .select("*")
    .order(
      "expense_date",
      {
        ascending: false,
      }
    )
    .order(
      "created_at",
      {
        ascending: false,
      }
    );


  if (error) {
    console.error(
      "[Expenses] Failed to load expenses:",
      error
    );

    throw error;
  }


  return (
    data || []
  ).map(
    normalizeExpense
  );
}


/*
|--------------------------------------------------------------------------
| GET EXPENSE BY ID
|--------------------------------------------------------------------------
*/

export async function getExpenseById(
  expenseId
) {
  if (!expenseId) {
    throw new Error(
      "Expense ID is required."
    );
  }


  const {
    data,
    error,
  } = await supabase
    .from("expenses")
    .select("*")
    .eq(
      "id",
      expenseId
    )
    .maybeSingle();


  if (error) {
    throw error;
  }


  return data
    ? normalizeExpense(data)
    : null;
}


/*
|--------------------------------------------------------------------------
| GET EXPENSES BY DATE RANGE
|--------------------------------------------------------------------------
*/

export async function getExpensesByDateRange(
  startDate,
  endDate
) {
  if (
    !startDate ||
    !endDate
  ) {
    throw new Error(
      "Start date and end date are required."
    );
  }


  const {
    data,
    error,
  } = await supabase
    .from("expenses")
    .select("*")
    .gte(
      "expense_date",
      startDate
    )
    .lte(
      "expense_date",
      endDate
    )
    .order(
      "expense_date",
      {
        ascending: false,
      }
    )
    .order(
      "created_at",
      {
        ascending: false,
      }
    );


  if (error) {
    throw error;
  }


  return (
    data || []
  ).map(
    normalizeExpense
  );
}


/*
|--------------------------------------------------------------------------
| CREATE EXPENSE
|--------------------------------------------------------------------------
*/

export async function addExpense({
  expense_date,
  expense_type,
  description = "",
  amount,
  driver_id = null,
  driver_name = "",
  notes = "",
}) {
  if (!expense_date) {
    throw new Error(
      "Expense date is required."
    );
  }


  if (
    !expense_type ||
    !expense_type.trim()
  ) {
    throw new Error(
      "Expense type is required."
    );
  }


  const numericAmount =
    Number(amount);


  if (
    !Number.isFinite(
      numericAmount
    ) ||
    numericAmount < 0
  ) {
    throw new Error(
      "Please enter a valid expense amount."
    );
  }


  const {
    data,
    error,
  } = await supabase
    .from("expenses")
    .insert({
      expense_date,

      expense_type:
        expense_type.trim(),

      description:
        description.trim() ||
        null,

      amount:
        numericAmount,

      driver_id:
        driver_id || null,

      driver_name:
        driver_name.trim() ||
        null,

      notes:
        notes.trim() ||
        null,
    })
    .select("*")
    .single();


  if (error) {
    console.error(
      "[Expenses] Failed to add expense:",
      error
    );

    throw error;
  }


  return normalizeExpense(
    data
  );
}


/*
|--------------------------------------------------------------------------
| CREATE EXPENSE ALIAS
|--------------------------------------------------------------------------
|
| Keeps compatibility with Expenses.jsx
|--------------------------------------------------------------------------
*/

export async function createExpense(
  values
) {
  return addExpense(
    values
  );
}


/*
|--------------------------------------------------------------------------
| UPDATE EXPENSE
|--------------------------------------------------------------------------
*/

export async function updateExpense(
  expenseId,
  {
    expense_date,
    expense_type,
    description = "",
    amount,
    driver_id = null,
    driver_name = "",
    notes = "",
  }
) {
  if (!expenseId) {
    throw new Error(
      "Expense ID is required."
    );
  }


  if (!expense_date) {
    throw new Error(
      "Expense date is required."
    );
  }


  if (
    !expense_type ||
    !expense_type.trim()
  ) {
    throw new Error(
      "Expense type is required."
    );
  }


  const numericAmount =
    Number(amount);


  if (
    !Number.isFinite(
      numericAmount
    ) ||
    numericAmount < 0
  ) {
    throw new Error(
      "Please enter a valid expense amount."
    );
  }


  const {
    data,
    error,
  } = await supabase
    .from("expenses")
    .update({
      expense_date,

      expense_type:
        expense_type.trim(),

      description:
        description.trim() ||
        null,

      amount:
        numericAmount,

      driver_id:
        driver_id || null,

      driver_name:
        driver_name.trim() ||
        null,

      notes:
        notes.trim() ||
        null,

      updated_at:
        new Date().toISOString(),
    })
    .eq(
      "id",
      expenseId
    )
    .select("*")
    .single();


  if (error) {
    console.error(
      "[Expenses] Failed to update expense:",
      error
    );

    throw error;
  }


  return normalizeExpense(
    data
  );
}


/*
|--------------------------------------------------------------------------
| DELETE EXPENSE
|--------------------------------------------------------------------------
*/

export async function deleteExpense(
  expenseId
) {
  if (!expenseId) {
    throw new Error(
      "Expense ID is required."
    );
  }


  const {
    error,
  } = await supabase
    .from("expenses")
    .delete()
    .eq(
      "id",
      expenseId
    );


  if (error) {
    console.error(
      "[Expenses] Failed to delete expense:",
      error
    );

    throw error;
  }


  return true;
}


/*
|--------------------------------------------------------------------------
| TOTAL EXPENSES
|--------------------------------------------------------------------------
*/

export async function getTotalExpenses(
  startDate,
  endDate
) {
  const expenses =
    await getExpensesByDateRange(
      startDate,
      endDate
    );


  return expenses.reduce(
    (
      total,
      expense
    ) =>
      total +
      Number(
        expense.amount || 0
      ),
    0
  );
}


/*
|--------------------------------------------------------------------------
| GET REVENUE ORDERS
|--------------------------------------------------------------------------
|
| Revenue is taken directly from the REAL orders table.
|
| Included:
|   delivered
|   completed
|
| Excluded:
|   rejected payments
|
| We intentionally retrieve the records first and normalize the
| status/payment values in JavaScript so values such as:
|
|   Delivered
|   DELIVERED
|   delivered
|
| are treated consistently.
|--------------------------------------------------------------------------
*/

export async function getRevenueOrdersByDateRange(
  startDate,
  endDate
) {
  if (
    !startDate ||
    !endDate
  ) {
    throw new Error(
      "Start date and end date are required."
    );
  }


  const nextDay =
    getNextDayDate(
      endDate
    );


  const {
    data,
    error,
  } = await supabase
    .from("orders")
    .select(`
      id,
      total_price,
      status,
      payment_status,
      payment_method,
      created_at
    `)
    .gte(
      "created_at",
      `${startDate}T00:00:00`
    )
    .lt(
      "created_at",
      `${nextDay}T00:00:00`
    )
    .order(
      "created_at",
      {
        ascending: true,
      }
    );


  if (error) {
    console.error(
      "[Expenses] Revenue query error:",
      error
    );

    throw error;
  }


  const validOrders =
    (data || []).filter(
      isRevenueOrder
    );


  console.log(
    `[Expenses] Revenue orders: ${validOrders.length}`
  );


  return validOrders.map(
    (order) => ({
      ...order,

      amount:
        Number(
          order.total_price || 0
        ),

      revenue:
        Number(
          order.total_price || 0
        ),
    })
  );
}


/*
|--------------------------------------------------------------------------
| REVENUE FROM REAL ORDERS
|--------------------------------------------------------------------------
*/

export async function getRevenueByDateRange(
  startDate,
  endDate
) {
  const orders =
    await getRevenueOrdersByDateRange(
      startDate,
      endDate
    );


  return orders.reduce(
    (
      total,
      order
    ) =>
      total +
      Number(
        order.total_price || 0
      ),
    0
  );
}


/*
|--------------------------------------------------------------------------
| REVENUE TREND
|--------------------------------------------------------------------------
|
| This is used by the Revenue vs Expenses graph.
|
| The graph now receives REAL revenue values from completed/delivered
| orders rather than a dummy zero value.
|
| daily:
|   one point per hour
|
| monthly:
|   one point per day
|
| yearly:
|   one point per month
|--------------------------------------------------------------------------
*/

export async function getRevenueTrendByDateRange(
  startDate,
  endDate,
  period = "monthly"
) {
  const orders =
    await getRevenueOrdersByDateRange(
      startDate,
      endDate
    );


  const grouped = {};


  orders.forEach(
    (order) => {

      const date =
        new Date(
          order.created_at
        );


      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return;
      }


      let key;


      /*
      |--------------------------------------------------------------------------
      | DAILY
      |--------------------------------------------------------------------------
      */

      if (
        period === "daily"
      ) {

        key =
          String(
            date.getHours()
          ).padStart(
            2,
            "0"
          ) + ":00";

      }


      /*
      |--------------------------------------------------------------------------
      | MONTHLY
      |--------------------------------------------------------------------------
      */

      else if (
        period === "monthly"
      ) {

        key =
          date.toLocaleDateString(
            "en-PH",
            {
              month: "short",
              day: "numeric",
            }
          );

      }


      /*
      |--------------------------------------------------------------------------
      | YEARLY
      |--------------------------------------------------------------------------
      */

      else {

        key =
          date.toLocaleDateString(
            "en-PH",
            {
              month: "short",
            }
          );

      }


      if (
        !grouped[key]
      ) {

        grouped[key] = {
          label: key,
          revenue: 0,
          expenses: 0,
        };

      }


      grouped[key].revenue +=
        Number(
          order.total_price || 0
        );

    }
  );


  return Object.values(
    grouped
  );
}


/*
|--------------------------------------------------------------------------
| FINANCIAL SUMMARY
|--------------------------------------------------------------------------
*/

export async function getFinancialSummary(
  startDate,
  endDate
) {
  const [
    revenue,
    expenses,
  ] = await Promise.all([

    getRevenueByDateRange(
      startDate,
      endDate
    ),

    getTotalExpenses(
      startDate,
      endDate
    ),

  ]);


  const netProfit =
    revenue -
    expenses;


  const roi =
    expenses > 0
      ? (
          (
            netProfit /
            expenses
          ) * 100
        )
      : 0;


  const profitMargin =
    revenue > 0
      ? (
          (
            netProfit /
            revenue
          ) * 100
        )
      : 0;


  return {

    revenue,

    expenses,

    netProfit,

    roi,

    profitMargin,

  };
}


/*
|--------------------------------------------------------------------------
| EXPENSE CATEGORY TOTALS
|--------------------------------------------------------------------------
*/

export async function getExpenseCategoryTotals(
  startDate,
  endDate
) {
  const expenses =
    await getExpensesByDateRange(
      startDate,
      endDate
    );


  const totals = {};


  expenses.forEach(
    (expense) => {

      const category =
        expense.expense_type ||
        "Other";


      totals[category] =
        (
          totals[category] ||
          0
        ) +
        Number(
          expense.amount || 0
        );

    }
  );


  return totals;
}


/*
|--------------------------------------------------------------------------
| EXPENSE COUNT
|--------------------------------------------------------------------------
*/

export async function getExpenseCount(
  startDate,
  endDate
) {
  const expenses =
    await getExpensesByDateRange(
      startDate,
      endDate
    );


  return expenses.length;
}


/*
|--------------------------------------------------------------------------
| INVENTORY LOSS
|--------------------------------------------------------------------------
|
| Source:
| container_returns
|
| Tracks:
|   expected_quantity
|   returned_quantity
|   damaged_quantity
|   missing_quantity
|--------------------------------------------------------------------------
*/

export async function getInventoryLossByDateRange(
  startDate,
  endDate
) {
  if (
    !startDate ||
    !endDate
  ) {
    throw new Error(
      "Start date and end date are required."
    );
  }


  const nextDay =
    getNextDayDate(
      endDate
    );


  const {
    data,
    error,
  } = await supabase
    .from("container_returns")
    .select(`
      id,
      order_id,
      driver_id,
      customer_id,
      customer_name,
      capacity,
      expected_quantity,
      returned_quantity,
      damaged_quantity,
      missing_quantity,
      returned_at,
      created_at
    `)
    .gte(
      "created_at",
      `${startDate}T00:00:00`
    )
    .lt(
      "created_at",
      `${nextDay}T00:00:00`
    )
    .order(
      "created_at",
      {
        ascending: false,
      }
    );


  if (error) {
    console.error(
      "[Expenses] Inventory loss query error:",
      error
    );

    throw error;
  }


  const records =
    data || [];


  const summary = {

    totalExpected: 0,

    totalReturned: 0,

    totalDamaged: 0,

    totalMissing: 0,

    records: [],

  };


  records.forEach(
    (record) => {

      const expected =
        Number(
          record.expected_quantity
        ) || 0;

      const returned =
        Number(
          record.returned_quantity
        ) || 0;

      const damaged =
        Number(
          record.damaged_quantity
        ) || 0;

      const missing =
        Number(
          record.missing_quantity
        ) || 0;


      summary.totalExpected +=
        expected;

      summary.totalReturned +=
        returned;

      summary.totalDamaged +=
        damaged;

      summary.totalMissing +=
        missing;


      summary.records.push({

        ...record,

        expected_quantity:
          expected,

        returned_quantity:
          returned,

        damaged_quantity:
          damaged,

        missing_quantity:
          missing,

      });

    }
  );


  return summary;
}


/*
|--------------------------------------------------------------------------
| INVENTORY ACCOUNTABILITY SUMMARY
|--------------------------------------------------------------------------
*/

export async function getInventoryAccountability(
  startDate,
  endDate
) {
  const [
    loss,
    borrowings,
  ] = await Promise.all([

    getInventoryLossByDateRange(
      startDate,
      endDate
    ),

    getContainerBorrowingsByDateRange(
      startDate,
      endDate
    ),

  ]);


  let outstandingBorrowed =
    0;

  let borrowingReturned =
    0;

  let borrowingDamaged =
    0;

  let borrowingMissing =
    0;


  borrowings.forEach(
    (record) => {

      const quantity =
        Number(
          record.quantity
        ) || 0;

      const returned =
        Number(
          record.returned_quantity
        ) || 0;

      const damaged =
        Number(
          record.damaged_quantity
        ) || 0;

      const missing =
        Number(
          record.missing_quantity
        ) || 0;


      borrowingReturned +=
        returned;

      borrowingDamaged +=
        damaged;

      borrowingMissing +=
        missing;


      const outstanding =
        Math.max(
          0,
          quantity -
          returned -
          damaged -
          missing
        );


      const status =
        String(
          record.status ||
          ""
        )
          .toLowerCase()
          .trim();


      if (
        [
          "borrowed",
          "partially_returned",
        ].includes(
          status
        )
      ) {

        outstandingBorrowed +=
          outstanding;

      }

    }
  );


  return {

    expected:
      loss.totalExpected,

    returned:
      loss.totalReturned,

    damaged:
      loss.totalDamaged,

    missing:
      loss.totalMissing,

    borrowed:
      outstandingBorrowed,

    borrowingReturned,

    borrowingDamaged,

    borrowingMissing,

    returnRecords:
      loss.records,

    borrowingRecords:
      borrowings,

  };
}


/*
|--------------------------------------------------------------------------
| CONTAINER BORROWINGS BY DATE RANGE
|--------------------------------------------------------------------------
*/

export async function getContainerBorrowingsByDateRange(
  startDate,
  endDate
) {
  if (
    !startDate ||
    !endDate
  ) {
    return [];
  }


  const nextDay =
    getNextDayDate(
      endDate
    );


  const {
    data,
    error,
  } = await supabase
    .from("container_borrowings")
    .select(`
      id,
      order_id,
      delivery_id,
      customer_id,
      customer_name,
      capacity,
      quantity,
      returned_quantity,
      damaged_quantity,
      missing_quantity,
      status,
      notes,
      borrowed_at,
      returned_at,
      created_at,
      updated_at
    `)
    .gte(
      "created_at",
      `${startDate}T00:00:00`
    )
    .lt(
      "created_at",
      `${nextDay}T00:00:00`
    )
    .order(
      "created_at",
      {
        ascending: false,
      }
    );


  if (error) {

    console.error(
      "[Expenses] Borrowing query error:",
      error
    );

    throw error;
  }


  return data || [];
}


/*
|--------------------------------------------------------------------------
| COMPLETE EXPENSE REPORT
|--------------------------------------------------------------------------
|
| Main report function.
|
| Returns:
|
| financial
| expenses
| categories
| inventory
| revenueTrend
|--------------------------------------------------------------------------
*/

export async function getExpenseReport(
  period = "monthly",
  selectedDate = getToday()
) {
  const {
    start,
    end,
  } =
    getPeriodRange(
      period,
      selectedDate
    );


  const [
    financial,
    expenses,
    categories,
    inventory,
    revenueTrend,
  ] = await Promise.all([

    getFinancialSummary(
      start,
      end
    ),

    getExpensesByDateRange(
      start,
      end
    ),

    getExpenseCategoryTotals(
      start,
      end
    ),

    getInventoryAccountability(
      start,
      end
    ),

    getRevenueTrendByDateRange(
      start,
      end,
      period
    ),

  ]);


  /*
  |--------------------------------------------------------------------------
  | Add expense values to the trend
  |--------------------------------------------------------------------------
  */

  const trend =
    buildFinancialTrend(
      revenueTrend,
      expenses,
      period
    );


  return {

    period,

    selectedDate,

    startDate:
      start,

    endDate:
      end,

    periodLabel:
      getPeriodLabel(
        period,
        selectedDate
      ),

    financial,

    expenses,

    categories,

    inventory,

    revenueTrend,

    trend,

  };
}


/*
|--------------------------------------------------------------------------
| BUILD FINANCIAL TREND
|--------------------------------------------------------------------------
|
| Combines REAL revenue + REAL expenses.
|
| This is the data that should be passed to your
| Revenue vs Expenses chart.
|--------------------------------------------------------------------------
*/

function buildFinancialTrend(
  revenueTrend,
  expenses,
  period
) {
  const grouped = {};


  /*
  |--------------------------------------------------------------------------
  | Revenue
  |--------------------------------------------------------------------------
  */

  (
    revenueTrend || []
  ).forEach(
    (item) => {

      const key =
        item.label;


      if (
        !grouped[key]
      ) {

        grouped[key] = {

          label: key,

          revenue: 0,

          expenses: 0,

        };

      }


      grouped[key].revenue +=
        Number(
          item.revenue || 0
        );

    }
  );


  /*
  |--------------------------------------------------------------------------
  | Expenses
  |--------------------------------------------------------------------------
  */

  (
    expenses || []
  ).forEach(
    (expense) => {

      const rawDate =
        expense.expense_date ||
        expense.date;


      if (!rawDate) {
        return;
      }


      const date =
        new Date(
          `${rawDate}T00:00:00`
        );


      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return;
      }


      let key;


      if (
        period === "daily"
      ) {

        /*
         * Expense records normally only have a date,
         * so daily expenses are grouped under 00:00.
         */

        key = "00:00";

      }

      else if (
        period === "monthly"
      ) {

        key =
          String(
            date.getDate()
          );

      }

      else {

        key =
          date.toLocaleDateString(
            "en-PH",
            {
              month: "short",
            }
          );

      }


      if (
        !grouped[key]
      ) {

        grouped[key] = {

          label: key,

          revenue: 0,

          expenses: 0,

        };

      }


      grouped[key].expenses +=
        Number(
          expense.amount || 0
        );

    }
  );


  /*
  |--------------------------------------------------------------------------
  | SORT TREND
  |--------------------------------------------------------------------------
  */

  const result =
    Object.values(
      grouped
    );


  if (
    period === "monthly"
  ) {

    return result.sort(
      (a, b) =>
        Number(a.label) -
        Number(b.label)
    );

  }


  if (
    period === "daily"
  ) {

    return result.sort(
      (a, b) =>
        String(a.label)
          .localeCompare(
            String(b.label)
          )
    );

  }


  return result;
}


/*
|--------------------------------------------------------------------------
| NEXT DAY
|--------------------------------------------------------------------------
*/

function getNextDayDate(
  dateString
) {
  const date =
    new Date(
      `${dateString}T00:00:00`
    );


  date.setDate(
    date.getDate() + 1
  );


  return formatDateForDatabase(
    date
  );
}