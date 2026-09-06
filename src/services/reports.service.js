import { supabase } from "./supabase";

/*
|--------------------------------------------------------------------------
| REPORTS SERVICE
|--------------------------------------------------------------------------
|
| This service provides the data required by the HydroHub Reports page.
|
| IMPORTANT BUSINESS RULES:
|
| 1. Only delivered/completed orders are counted as revenue.
| 2. Cancelled orders are excluded.
| 3. Rejected payments are excluded.
| 4. Future scheduled orders are NOT counted as revenue.
| 5. Expenses come from the real expenses table.
| 6. No dummy report data is used.
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| GENERAL HELPERS
|--------------------------------------------------------------------------
*/

export function toNumber(value) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return 0;
    }

    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : 0;
}


/*
|--------------------------------------------------------------------------
| DATE HELPERS
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


export function getTodayDate() {
    return formatDateKey(
        new Date()
    );
}


export function parseLocalDate(value) {
    if (!value) {
        return null;
    }

    const raw = String(value).trim();

    const match = raw.match(
        /^(\d{4})-(\d{1,2})-(\d{1,2})$/
    );

    if (match) {
        const year = Number(match[1]);
        const month = Number(match[2]) - 1;
        const day = Number(match[3]);

        const date = new Date(
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

    const date = new Date(value);

    return Number.isNaN(
        date.getTime()
    )
        ? null
        : date;
}


export function getStartDate(days = 7) {
    const date = new Date();

    date.setHours(
        0,
        0,
        0,
        0
    );

    date.setDate(
        date.getDate() -
            (Number(days) - 1)
    );

    return formatDateKey(date);
}


export function getEndDate() {
    return getTodayDate();
}


export function getNextDayDate(
    dateString
) {
    const date =
        parseLocalDate(
            dateString
        );

    if (!date) {
        return "";
    }

    date.setDate(
        date.getDate() + 1
    );

    return formatDateKey(date);
}


/*
|--------------------------------------------------------------------------
| ORDER STATUS
|--------------------------------------------------------------------------
*/

export function normalizeOrderStatus(
    status = ""
) {
    return String(status || "")
        .toLowerCase()
        .trim()
        .replace(
            /[\s-]+/g,
            "_"
        );
}


export function isCompletedOrder(
    order
) {
    const status =
        normalizeOrderStatus(
            order?.status
        );

    return (
        status === "delivered" ||
        status === "completed"
    );
}


export function isCancelledOrder(
    order
) {
    const status =
        normalizeOrderStatus(
            order?.status
        );

    return status === "cancelled";
}


/*
|--------------------------------------------------------------------------
| PAYMENT STATUS
|--------------------------------------------------------------------------
*/

export function normalizePaymentStatus(
    status = ""
) {
    return String(status || "")
        .toLowerCase()
        .trim()
        .replace(
            /[\s-]+/g,
            "_"
        );
}


export function isRejectedPayment(
    order
) {
    return (
        normalizePaymentStatus(
            order?.payment_status
        ) === "rejected"
    );
}


export function isVerifiedPayment(
    order
) {
    const status =
        normalizePaymentStatus(
            order?.payment_status
        );

    return (
        status === "verified" ||
        status === "paid" ||
        status === "completed"
    );
}


/*
|--------------------------------------------------------------------------
| REVENUE ELIGIBILITY
|--------------------------------------------------------------------------
*/

export function isRevenueOrder(
    order
) {
    if (!order) {
        return false;
    }

    /*
     * Cancelled orders do not generate revenue.
     */
    if (
        isCancelledOrder(
            order
        )
    ) {
        return false;
    }

    /*
     * Rejected payments do not generate revenue.
     */
    if (
        isRejectedPayment(
            order
        )
    ) {
        return false;
    }

    /*
     * Only completed/delivered orders
     * are counted as sales.
     */
    if (
        !isCompletedOrder(
            order
        )
    ) {
        return false;
    }

    return true;
}


/*
|--------------------------------------------------------------------------
| CURRENCY
|--------------------------------------------------------------------------
*/

export function formatCurrency(
    value
) {
    const amount =
        toNumber(value);

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
| GET ORDERS
|--------------------------------------------------------------------------
*/

export async function getReportOrders(
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
        .select("*")
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
            "[Reports] Orders query error:",
            error
        );

        throw error;
    }

    return (
        data || []
    ).map(
        (order) => ({
            ...order,

            gallons:
                toNumber(
                    order.gallons
                ),

            total_price:
                toNumber(
                    order.total_price
                ),

            down_payment:
                toNumber(
                    order.down_payment
                ),

            remaining_balance:
                toNumber(
                    order.remaining_balance
                ),
        })
    );
}


/*
|--------------------------------------------------------------------------
| GET EXPENSES
|--------------------------------------------------------------------------
*/

export async function getReportExpenses(
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
        .lt(
            "expense_date",
            getNextDayDate(endDate)
        )
        .order(
            "expense_date",
            {
                ascending: true,
            }
        )
        .order(
            "created_at",
            {
                ascending: true,
            }
        );

    if (error) {
        console.error(
            "[Reports] Expenses query error:",
            error
        );

        throw error;
    }

    return (
        data || []
    ).map(
        (expense) => ({
            ...expense,

            amount:
                toNumber(
                    expense.amount
                ),

            expense_type:
                expense.expense_type ||
                expense.type ||
                "Other",

            description:
                expense.description ||
                "",

            driver_id:
                expense.driver_id ||
                null,

            driver_name:
                expense.driver_name ||
                "",
        })
    );
}


/*
|--------------------------------------------------------------------------
| REVENUE
|--------------------------------------------------------------------------
*/

export function calculateRevenue(
    orders = []
) {
    return orders
        .filter(
            isRevenueOrder
        )
        .reduce(
            (
                total,
                order
            ) =>
                total +
                toNumber(
                    order.total_price
                ),
            0
        );
}


/*
|--------------------------------------------------------------------------
| TOTAL EXPENSES
|--------------------------------------------------------------------------
*/

export function calculateExpenses(
    expenses = []
) {
    return expenses.reduce(
        (
            total,
            expense
        ) =>
            total +
            toNumber(
                expense.amount
            ),
        0
    );
}


/*
|--------------------------------------------------------------------------
| FINANCIAL SUMMARY
|--------------------------------------------------------------------------
*/

export function calculateFinancialSummary(
    orders = [],
    expenses = []
) {
    const revenue =
        calculateRevenue(
            orders
        );

    const totalExpenses =
        calculateExpenses(
            expenses
        );

    const netProfit =
        revenue -
        totalExpenses;

    const profitMargin =
        revenue > 0
            ? (
                  netProfit /
                  revenue
              ) * 100
            : 0;

    return {
        revenue,

        expenses:
            totalExpenses,

        netProfit,

        profitMargin,
    };
}


/*
|--------------------------------------------------------------------------
| EXPENSE BREAKDOWN
|--------------------------------------------------------------------------
*/

export function calculateExpenseBreakdown(
    expenses = []
) {
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
                toNumber(
                    expense.amount
                );
        }
    );

    return Object.entries(
        totals
    ).map(
        ([
            category,
            amount,
        ]) => ({
            category,
            amount,
        })
    );
}


/*
|--------------------------------------------------------------------------
| REVENUE TREND
|--------------------------------------------------------------------------
*/

export function calculateRevenueTrend(
    orders = [],
    startDate,
    endDate
) {
    const start =
        parseLocalDate(
            startDate
        );

    const end =
        parseLocalDate(
            endDate
        );

    if (
        !start ||
        !end
    ) {
        return [];
    }

    const result = [];

    const current =
        new Date(start);

    while (
        current <= end
    ) {
        const dateKey =
            formatDateKey(
                current
            );

        const revenue =
            orders
                .filter(
                    (
                        order
                    ) =>
                        isRevenueOrder(
                            order
                        ) &&
                        String(
                            order.created_at ||
                                ""
                        ).slice(
                            0,
                            10
                        ) ===
                            dateKey
                )
                .reduce(
                    (
                        total,
                        order
                    ) =>
                        total +
                        toNumber(
                            order.total_price
                        ),
                    0
                );

        result.push({
            date:
                dateKey,

            label:
                current.toLocaleDateString(
                    "en-PH",
                    {
                        month: "short",
                        day: "numeric",
                    }
                ),

            revenue,
        });

        current.setDate(
            current.getDate() + 1
        );
    }

    return result;
}


/*
|--------------------------------------------------------------------------
| EXPENSE TREND
|--------------------------------------------------------------------------
*/

export function calculateExpenseTrend(
    expenses = [],
    startDate,
    endDate
) {
    const start =
        parseLocalDate(
            startDate
        );

    const end =
        parseLocalDate(
            endDate
        );

    if (
        !start ||
        !end
    ) {
        return [];
    }

    const result = [];

    const current =
        new Date(start);

    while (
        current <= end
    ) {
        const dateKey =
            formatDateKey(
                current
            );

        const expenseTotal =
            expenses
                .filter(
                    (
                        expense
                    ) =>
                        String(
                            expense.expense_date ||
                                ""
                        ).slice(
                            0,
                            10
                        ) ===
                            dateKey
                )
                .reduce(
                    (
                        total,
                        expense
                    ) =>
                        total +
                        toNumber(
                            expense.amount
                        ),
                    0
                );

        result.push({
            date:
                dateKey,

            label:
                current.toLocaleDateString(
                    "en-PH",
                    {
                        month: "short",
                        day: "numeric",
                    }
                ),

            expenses:
                expenseTotal,
        });

        current.setDate(
            current.getDate() + 1
        );
    }

    return result;
}


/*
|--------------------------------------------------------------------------
| COMBINED FINANCIAL TREND
|--------------------------------------------------------------------------
*/

export function calculateFinancialTrend(
    revenueTrend = [],
    expenseTrend = []
) {
    const map = new Map();

    revenueTrend.forEach(
        (item) => {
            map.set(
                item.date,
                {
                    date:
                        item.date,

                    label:
                        item.label,

                    revenue:
                        toNumber(
                            item.revenue
                        ),

                    expenses: 0,

                    profit:
                        toNumber(
                            item.revenue
                        ),
                }
            );
        }
    );

    expenseTrend.forEach(
        (item) => {
            if (
                !map.has(
                    item.date
                )
            ) {
                map.set(
                    item.date,
                    {
                        date:
                            item.date,

                        label:
                            item.label,

                        revenue: 0,

                        expenses: 0,

                        profit: 0,
                    }
                );
            }

            map.get(
                item.date
            ).expenses =
                toNumber(
                    item.expenses
                );

            map.get(
                item.date
            ).profit =
                map.get(
                    item.date
                ).revenue -
                map.get(
                    item.date
                ).expenses;
        }
    );

    return Array.from(
        map.values()
    ).sort(
        (a, b) =>
            String(a.date)
                .localeCompare(
                    String(b.date)
                )
    );
}


/*
|--------------------------------------------------------------------------
| DELIVERY TYPES
|--------------------------------------------------------------------------
*/

export function calculateDeliveryTypes(
    orders = []
) {
    const totals = {};

    orders
        .filter(
            isRevenueOrder
        )
        .forEach(
            (order) => {
                const type =
                    String(
                        order.delivery_type ||
                            "Unknown"
                    ).trim();

                totals[type] =
                    (
                        totals[type] ||
                        0
                    ) + 1;
            }
        );

    return Object.entries(
        totals
    ).map(
        ([
            type,
            count,
        ]) => ({
            type,
            count,
        })
    );
}


/*
|--------------------------------------------------------------------------
| CASH COLLECTION
|--------------------------------------------------------------------------
*/

export function calculateCashCollection(
    orders = []
) {
    const cashOrders =
        orders.filter(
            (order) =>
                isRevenueOrder(
                    order
                ) &&
                String(
                    order.payment_method ||
                        "Cash"
                )
                    .toLowerCase()
                    .trim() ===
                    "cash"
        );

    const collected =
        cashOrders.reduce(
            (
                total,
                order
            ) =>
                total +
                toNumber(
                    order.total_price
                ),
            0
        );

    const verified =
        cashOrders
            .filter(
                isVerifiedPayment
            )
            .reduce(
                (
                    total,
                    order
                ) =>
                    total +
                    toNumber(
                        order.total_price
                    ),
                0
            );

    const unverified =
        Math.max(
            collected -
                verified,
            0
        );

    return {
        collected,
        verified,
        unverified,
    };
}


/*
|--------------------------------------------------------------------------
| CASH PER DRIVER
|--------------------------------------------------------------------------
*/

export function calculateDriverCash(
    orders = []
) {
    const driverMap =
        new Map();

    orders
        .filter(
            (order) =>
                isRevenueOrder(
                    order
                ) &&
                String(
                    order.payment_method ||
                        "Cash"
                )
                    .toLowerCase()
                    .trim() ===
                    "cash"
        )
        .forEach(
            (order) => {
                const driverId =
                    order.driver_id ||
                    "unassigned";

                const driverName =
                    order.driver_name ||
                    "Unassigned";

                if (
                    !driverMap.has(
                        driverId
                    )
                ) {
                    driverMap.set(
                        driverId,
                        {
                            driverId,

                            driverName,

                            amount: 0,

                            orders: 0,
                        }
                    );
                }

                const driver =
                    driverMap.get(
                        driverId
                    );

                driver.amount +=
                    toNumber(
                        order.total_price
                    );

                driver.orders += 1;
            }
        );

    return Array.from(
        driverMap.values()
    );
}


/*
|--------------------------------------------------------------------------
| SALES LOGBOOK
|--------------------------------------------------------------------------
*/

export function createSalesLogbook(
    orders = []
) {
    return orders
        .filter(
            isRevenueOrder
        )
        .map(
            (order) => ({
                id:
                    order.id,

                date:
                    String(
                        order.created_at ||
                            ""
                    ).slice(
                        0,
                        10
                    ),

                customer:
                    order.customer_name ||
                    "Unknown Customer",

                containers:
                    toNumber(
                        order.gallons
                    ),

                type:
                    order.delivery_type ||
                    "N/A",

                amount:
                    toNumber(
                        order.total_price
                    ),

                driver:
                    order.driver_name ||
                    "Unassigned",
            })
        );
}


export function calculateOperationalSummary(
    orders = [],
    drivers = []
) {
    const customerIds = new Set();
    const driverMap = new Map();
    const statusCounts = {};

    orders.forEach((order) => {
        if (order.customer_id) {
            customerIds.add(String(order.customer_id));
        }

        const status = normalizeOrderStatus(order.status) || "unknown";
        statusCounts[status] = (statusCounts[status] || 0) + 1;

        if (!order.driver_id) {
            return;
        }

        const driverId = String(order.driver_id);
        const current = driverMap.get(driverId) || {
            driverId,
            driverName: order.driver_name || "Assigned Driver",
            deliveries: 0,
            gallons: 0,
            revenue: 0,
        };

        current.deliveries += isCompletedOrder(order) ? 1 : 0;
        current.gallons += toNumber(order.gallons);
        current.revenue += isRevenueOrder(order)
            ? toNumber(order.total_price)
            : 0;
        driverMap.set(driverId, current);
    });

    return {
        totalOrders: orders.length,
        activeCustomers: customerIds.size,
        gallonsSold: orders
            .filter(isRevenueOrder)
            .reduce((total, order) => total + toNumber(order.gallons), 0),
        statusCounts,
        drivers: Array.from(driverMap.values()).sort(
            (a, b) => b.deliveries - a.deliveries
        ),
        registeredDrivers: drivers.length,
    };
}


export function calculateContainerAccountability(
    returns = [],
    borrowings = []
) {
    const totals = {
        returned: 0,
        damaged: 0,
        missing: 0,
        borrowed: 0,
    };

    returns.forEach((record) => {
        totals.returned += toNumber(record.returned_quantity);
        totals.damaged += toNumber(record.damaged_quantity);
        totals.missing += toNumber(record.missing_quantity);
    });

    borrowings.forEach((record) => {
        totals.borrowed += Math.max(
            toNumber(record.quantity || record.borrowed_quantity) -
                toNumber(record.returned_quantity) -
                toNumber(record.damaged_quantity) -
                toNumber(record.missing_quantity),
            0
        );
    });

    return totals;
}


export function calculateReportAnalytics(
    orders = [],
    expenses = [],
    drivers = []
) {
    const completedOrders = orders.filter(isRevenueOrder);
    const customerMap = new Map();
    const paymentMethods = {};
    const gallonsByDate = {};
    const schedulePeriods = {
        morning: 0,
        afternoon: 0,
        evening: 0,
    };

    orders.forEach((order) => {
        const customerKey = String(
            order.customer_id || order.customer_name || "unknown"
        );
        const customer = customerMap.get(customerKey) || {
            id: customerKey,
            name: order.customer_name || "Unknown Customer",
            orders: 0,
            gallons: 0,
            spent: 0,
        };

        if (isRevenueOrder(order)) {
            customer.orders += 1;
            customer.gallons += toNumber(order.gallons);
            customer.spent += toNumber(order.total_price);

            const dateKey = String(order.created_at || "").slice(0, 10);
            if (dateKey) {
                gallonsByDate[dateKey] =
                    (gallonsByDate[dateKey] || 0) + toNumber(order.gallons);
            }
        }

        customerMap.set(customerKey, customer);

        const method = String(order.payment_method || "Unknown")
            .trim()
            .toLowerCase();
        paymentMethods[method] = (paymentMethods[method] || 0) + 1;

        if (String(order.delivery_type || "").toLowerCase() === "scheduled") {
            const period = String(
                order.scheduled_period || order.schedule_period || ""
            ).toLowerCase().trim();

            if (schedulePeriods[period] !== undefined) {
                schedulePeriods[period] += 1;
            }
        }
    });

    const gcashOrders = orders.filter((order) =>
        String(order.payment_method || "").toLowerCase().includes("gcash")
    );
    const codOrders = orders.filter((order) => {
        const method = String(order.payment_method || "cash").toLowerCase();
        return method === "cash" || method === "cod" || method.includes("cash");
    });

    const completedDeliveries = completedOrders.length;
    const pendingDeliveries = orders.filter(
        (order) => normalizeOrderStatus(order.status) === "pending"
    ).length;
    const assignedDeliveries = orders.filter(
        (order) => Boolean(order.driver_id) && !isCompletedOrder(order)
    ).length;
    const inTransitDeliveries = orders.filter((order) =>
        ["on_the_way", "in_transit", "in_progress"].includes(
            normalizeOrderStatus(order.status)
        )
    ).length;

    return {
        completedOrders,
        averageOrderValue: completedDeliveries > 0
            ? calculateRevenue(orders) / completedDeliveries
            : 0,
        averageGallonsPerOrder: completedDeliveries > 0
            ? completedOrders.reduce((total, order) => total + toNumber(order.gallons), 0) /
                completedDeliveries
            : 0,
        paymentMethods,
        payments: {
            cod: {
                collected: calculateRevenue(codOrders),
                verified: codOrders.filter(isVerifiedPayment).reduce(
                    (total, order) => total + toNumber(order.total_price), 0
                ),
                unverified: codOrders.filter((order) => !isVerifiedPayment(order)).reduce(
                    (total, order) => total + toNumber(order.total_price), 0
                ),
            },
            gcash: {
                received: calculateRevenue(gcashOrders),
                verified: gcashOrders.filter(isVerifiedPayment).reduce(
                    (total, order) => total + toNumber(order.total_price), 0
                ),
                pending: gcashOrders.filter((order) =>
                    !isRejectedPayment(order) && !isVerifiedPayment(order)
                ).length,
            },
        },
        delivery: {
            completed: completedDeliveries,
            pending: pendingDeliveries,
            assigned: assignedDeliveries,
            inTransit: inTransitDeliveries,
            unassigned: orders.filter(
                (order) => !order.driver_id && !isCompletedOrder(order)
            ).length,
        },
        scheduling: schedulePeriods,
        gallonsByDate,
        customers: {
            unique: Array.from(customerMap.values()).filter((customer) => customer.orders > 0).length,
            active: Array.from(customerMap.values()).filter((customer) => customer.orders > 0).length,
            returning: Array.from(customerMap.values()).filter((customer) => customer.orders > 1).length,
            top: Array.from(customerMap.values())
                .filter((customer) => customer.orders > 0)
                .sort((a, b) => b.spent - a.spent)
                .slice(0, 5),
        },
        drivers: drivers.map((driver) => {
            const driverOrders = completedOrders.filter(
                (order) => String(order.driver_id) === String(driver.id)
            );

            return {
                id: driver.id,
                name: driver.name || "Unknown Driver",
                deliveries: driverOrders.length,
                gallons: driverOrders.reduce(
                    (total, order) => total + toNumber(order.gallons), 0
                ),
            };
        }).sort((a, b) => b.gallons - a.gallons),
        alerts: [
            gcashOrders.filter((order) =>
                !isRejectedPayment(order) && !isVerifiedPayment(order)
            ).length > 0
                ? `${gcashOrders.filter((order) => !isRejectedPayment(order) && !isVerifiedPayment(order)).length} GCash payment(s) awaiting verification`
                : null,
            pendingDeliveries > 0
                ? `${pendingDeliveries} pending order(s) need attention`
                : null,
            orders.filter((order) => !order.driver_id && String(order.delivery_type).toLowerCase() === "scheduled").length > 0
                ? "Scheduled deliveries still need a driver"
                : null,
            toNumber(expenses.length) === 0 ? null : null,
        ].filter(Boolean),
    };
}


async function getReportOperationalRecords(
    startDate,
    endDate
) {
    const nextDay = getNextDayDate(endDate);
    const dateFilter = (query) =>
        query
            .gte("created_at", `${startDate}T00:00:00`)
            .lt("created_at", `${nextDay}T00:00:00`);

    const [driversResult, returnsResult, borrowingsResult] =
        await Promise.all([
            supabase.from("employees").select("id, name, role").ilike("role", "driver"),
            dateFilter(supabase.from("container_returns").select("*")),
            dateFilter(supabase.from("container_borrowings").select("*")),
        ]);

    if (driversResult.error) throw driversResult.error;
    if (returnsResult.error) throw returnsResult.error;
    if (borrowingsResult.error) throw borrowingsResult.error;

    return {
        drivers: driversResult.data || [],
        returns: returnsResult.data || [],
        borrowings: borrowingsResult.data || [],
    };
}


/*
|--------------------------------------------------------------------------
| MAIN REPORT DATA
|--------------------------------------------------------------------------
*/

export async function getReportData({
    startDate,
    endDate,
} = {}) {
    if (
        !startDate ||
        !endDate
    ) {
        throw new Error(
            "Report date range is required."
        );
    }

    console.log(
        "[Reports] Loading report:",
        startDate,
        endDate
    );

    const [
        orders,
        expenses,
        operationalRecords,
    ] = await Promise.all([
        getReportOrders(
            startDate,
            endDate
        ),

        getReportExpenses(
            startDate,
            endDate
        ),

        getReportOperationalRecords(
            startDate,
            endDate
        ),
    ]);

    const financial =
        calculateFinancialSummary(
            orders,
            expenses
        );

    const revenueTrend =
        calculateRevenueTrend(
            orders,
            startDate,
            endDate
        );

    const expenseTrend =
        calculateExpenseTrend(
            expenses,
            startDate,
            endDate
        );

    const financialTrend =
        calculateFinancialTrend(
            revenueTrend,
            expenseTrend
        );

    const deliveryTypes =
        calculateDeliveryTypes(
            orders
        );

    const expenseBreakdown =
        calculateExpenseBreakdown(
            expenses
        );

    const cashCollection =
        calculateCashCollection(
            orders
        );

    const driverCash =
        calculateDriverCash(
            orders
        );

    const salesLogbook =
        createSalesLogbook(
            orders
        );

    const operations =
        calculateOperationalSummary(
            orders,
            operationalRecords.drivers
        );

    const containerAccountability =
        calculateContainerAccountability(
            operationalRecords.returns,
            operationalRecords.borrowings
        );

    const analytics =
        calculateReportAnalytics(
            orders,
            expenses,
            operationalRecords.drivers
        );

    return {
        startDate,

        endDate,

        orders,

        expenses,

        financial,

        revenueTrend,

        expenseTrend,

        financialTrend,

        deliveryTypes,

        expenseBreakdown,

        cashCollection,

        driverCash,

        salesLogbook,

        operations,

        containerAccountability,

        analytics,
    };
}


/*
|--------------------------------------------------------------------------
| DEFAULT REPORT RANGE
|--------------------------------------------------------------------------
*/

export function getDefaultReportRange(
    days = 7
) {
    return {
        startDate:
            getStartDate(days),

        endDate:
            getEndDate(),
    };
}