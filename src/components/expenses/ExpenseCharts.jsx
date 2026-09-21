import {
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from "recharts";


/*
|--------------------------------------------------------------------------
| Currency Formatter
|--------------------------------------------------------------------------
*/

function formatCurrency(value) {

    return `₱${Number(value || 0).toLocaleString(
        "en-PH",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }
    )}`;
}


/*
|--------------------------------------------------------------------------
| Compact Currency Formatter
|--------------------------------------------------------------------------
|
| Used for Y-axis labels so the graph does not become crowded.
|
*/

function formatCompactCurrency(value) {

    const amount =
        Number(value) || 0;


    if (amount >= 1000000) {

        return `₱${(
            amount / 1000000
        ).toFixed(1)}M`;

    }


    if (amount >= 1000) {

        return `₱${(
            amount / 1000
        ).toFixed(1)}K`;

    }


    return `₱${amount}`;
}


/*
|--------------------------------------------------------------------------
| Custom Tooltip
|--------------------------------------------------------------------------
*/

function RevenueExpenseTooltip({
    active,
    payload,
    label,
}) {

    if (
        !active ||
        !payload ||
        !payload.length
    ) {
        return null;
    }


    return (
        <div className="expense-custom-tooltip">

            <div className="expense-tooltip-date">
                {label}
            </div>


            {payload.map(
                (item, index) => (

                    <div
                        className="expense-tooltip-row"
                        key={`${item.dataKey}-${index}`}
                    >

                        <div className="expense-tooltip-label">

                            <span
                                className="expense-tooltip-dot"
                                style={{
                                    backgroundColor:
                                        item.color,
                                }}
                            />

                            <span>
                                {item.name}
                            </span>

                        </div>


                        <strong>
                            {formatCurrency(
                                item.value
                            )}
                        </strong>

                    </div>

                )
            )}

        </div>
    );
}


/*
|--------------------------------------------------------------------------
| Custom Category Tooltip
|--------------------------------------------------------------------------
*/

function CategoryTooltip({
    active,
    payload,
}) {

    if (
        !active ||
        !payload ||
        !payload.length
    ) {
        return null;
    }


    const item =
        payload[0];


    const data =
        item?.payload;


    return (
        <div className="expense-custom-tooltip">

            <div className="expense-tooltip-date">
                {data?.category || "Other"}
            </div>


            <div className="expense-tooltip-row">

                <span>
                    Amount
                </span>

                <strong>
                    {formatCurrency(
                        data?.amount
                    )}
                </strong>

            </div>


            {data?.percentage !== undefined && (

                <div className="expense-tooltip-row">

                    <span>
                        Share
                    </span>

                    <strong>
                        {Number(
                            data.percentage
                        ).toFixed(1)}
                        %
                    </strong>

                </div>

            )}

        </div>
    );
}


/*
|--------------------------------------------------------------------------
| Chart Empty State
|--------------------------------------------------------------------------
*/

function ChartEmptyState({
    message,
}) {

    return (
        <div className="expense-chart-empty">

            <div className="expense-chart-empty-icon">
                ∿
            </div>

            <strong>
                No data available
            </strong>

            <span>
                {message}
            </span>

        </div>
    );
}


/*
|--------------------------------------------------------------------------
| Revenue vs Expenses
|--------------------------------------------------------------------------
*/

function RevenueExpenseChart({
    data = [],
}) {

    const hasData =
        Array.isArray(data) &&
        data.length > 0;


    return (
        <div className="expense-chart-card expense-revenue-chart">

            <div className="expense-chart-header">

                <div>

                    <span className="expense-chart-eyebrow">
                        FINANCIAL TREND
                    </span>

                    <h2>
                        Revenue vs Expenses
                    </h2>

                    <p>
                        Compare sales revenue
                        against operating costs
                        over time.
                    </p>

                </div>


                <div className="expense-chart-legend">

                    <div>

                        <span className="legend-dot revenue-dot" />

                        <span>
                            Revenue
                        </span>

                    </div>


                    <div>

                        <span className="legend-dot expense-dot" />

                        <span>
                            Expenses
                        </span>

                    </div>

                </div>

            </div>


            <div className="expense-chart-container">

                {!hasData ? (

                    <ChartEmptyState
                        message="Revenue and expense activity will appear here."
                    />

                ) : (

                    <ResponsiveContainer
                        width="100%"
                        height="100%"
                    >

                        <AreaChart
                            data={data}
                            margin={{
                                top: 15,
                                right: 10,
                                left: 5,
                                bottom: 5,
                            }}
                        >

                            <defs>

                                {/* Revenue gradient */}

                                <linearGradient
                                    id="revenueGradient"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >

                                    <stop
                                        offset="0%"
                                        stopColor="#2563eb"
                                        stopOpacity={0.22}
                                    />

                                    <stop
                                        offset="100%"
                                        stopColor="#2563eb"
                                        stopOpacity={0.01}
                                    />

                                </linearGradient>


                                {/* Expense gradient */}

                                <linearGradient
                                    id="expenseGradient"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >

                                    <stop
                                        offset="0%"
                                        stopColor="#ef4444"
                                        stopOpacity={0.34}
                                    />

                                    <stop
                                        offset="45%"
                                        stopColor="#f97316"
                                        stopOpacity={0.16}
                                    />

                                    <stop
                                        offset="100%"
                                        stopColor="#ef4444"
                                        stopOpacity={0.01}
                                    />

                                </linearGradient>

                            </defs>


                            <CartesianGrid
                                vertical={false}
                                stroke="#e8edf3"
                                strokeDasharray="3 5"
                            />


                            <XAxis
                                dataKey="label"
                                axisLine={false}
                                tickLine={false}
                                tick={{
                                    fill: "#64748b",
                                    fontSize: 10,
                                }}
                                tickMargin={10}
                            />


                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                domain={[0, "auto"]}
                                tick={{
                                    fill: "#64748b",
                                    fontSize: 10,
                                }}
                                tickFormatter={
                                    formatCompactCurrency
                                }
                                width={52}
                            />


                            <Tooltip
                                content={
                                    <RevenueExpenseTooltip />
                                }

                                cursor={{
                                    stroke: "#cbd5e1",
                                    strokeDasharray:
                                        "4 4",
                                }}
                            />


                            {/* Revenue */}

                            <Area
                                type="basis"
                                dataKey="revenue"
                                name="Revenue"
                                stroke="#2563eb"
                                strokeWidth={3}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                fill="url(#revenueGradient)"
                                fillOpacity={1}
                                activeDot={{
                                    r: 5,
                                    strokeWidth: 3,
                                    stroke: "#ffffff",
                                }}
                                dot={false}
                                connectNulls
                            />


                            {/* Expenses */}

                            <Area
                                type="basis"
                                dataKey="expenses"
                                name="Expenses"
                                stroke="#ef4444"
                                strokeWidth={3}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                fill="url(#expenseGradient)"
                                fillOpacity={1}
                                activeDot={{
                                    r: 5,
                                    strokeWidth: 3,
                                    stroke: "#ffffff",
                                }}
                                dot={{
                                    r: 2.5,
                                    fill: "#ef4444",
                                    stroke: "#ffffff",
                                    strokeWidth: 1.5,
                                }}
                                connectNulls
                            />

                        </AreaChart>

                    </ResponsiveContainer>

                )}

            </div>

        </div>
    );
}


/*
|--------------------------------------------------------------------------
| Expense Category Chart
|--------------------------------------------------------------------------
*/

function ExpenseCategoryChart({
    data = [],
}) {

    const hasData =
        Array.isArray(data) &&
        data.length > 0;


    /*
     * Calculate total expenses.
     */

    const total =
        data.reduce(
            (sum, item) =>
                sum +
                Number(
                    item?.amount || 0
                ),
            0
        );


    /*
     * Add percentage information.
     */

    const chartData =
        data.map(
            (item) => ({

                ...item,

                percentage:
                    total > 0
                        ? (
                            (
                                Number(
                                    item?.amount || 0
                                ) /
                                total
                            ) *
                            100
                        )
                        : 0,

            })
        );


    return (
        <div className="expense-chart-card expense-category-chart">

            <div className="expense-chart-header">

                <div>

                    <span className="expense-chart-eyebrow">
                        COST ANALYSIS
                    </span>

                    <h2>
                        Expense Breakdown
                    </h2>

                    <p>
                        Operating expenses
                        grouped by category.
                    </p>

                </div>


                {total > 0 && (

                    <div className="expense-chart-total">

                        <span>
                            Total
                        </span>

                        <strong>
                            {formatCurrency(
                                total
                            )}
                        </strong>

                    </div>

                )}

            </div>


            <div className="expense-chart-container">

                {!hasData ? (

                    <ChartEmptyState
                        message="Expense categories will appear here once records are added."
                    />

                ) : (

                    <ResponsiveContainer
                        width="100%"
                        height="100%"
                    >

                        <BarChart
                            data={chartData}
                            margin={{
                                top: 15,
                                right: 10,
                                left: 5,
                                bottom: 10,
                            }}
                            barCategoryGap="25%"
                        >

                            <CartesianGrid
                                vertical={false}
                                stroke="#e8edf3"
                                strokeDasharray="3 5"
                            />


                            <XAxis
                                dataKey="category"
                                axisLine={false}
                                tickLine={false}
                                tick={{
                                    fill: "#64748b",
                                    fontSize: 10,
                                }}
                                tickMargin={10}
                            />


                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{
                                    fill: "#64748b",
                                    fontSize: 10,
                                }}
                                tickFormatter={
                                    formatCompactCurrency
                                }
                                width={52}
                            />


                            <Tooltip
                                content={
                                    <CategoryTooltip />
                                }

                                cursor={{
                                    fill: "rgba(37, 99, 235, 0.04)",
                                }}
                            />


                            <Bar
                                dataKey="amount"
                                name="Expenses"
                                fill="#7c3aed"
                                radius={[
                                    7,
                                    7,
                                    2,
                                    2,
                                ]}
                                maxBarSize={48}
                            />

                        </BarChart>

                    </ResponsiveContainer>

                )}

            </div>

        </div>
    );
}


/*
|--------------------------------------------------------------------------
| Main Expense Charts
|--------------------------------------------------------------------------
*/

function ExpenseCharts({
    revenueExpenseData = [],
    categoryData = [],
}) {

    return (
        <section className="expense-charts-section">

            <div className="expense-charts-grid">

                <RevenueExpenseChart
                    data={
                        revenueExpenseData
                    }
                />


                <ExpenseCategoryChart
                    data={
                        categoryData
                    }
                />

            </div>

        </section>
    );
}


export default ExpenseCharts;