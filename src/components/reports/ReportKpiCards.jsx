import { formatCurrency } from "../../services/reports.service";

function formatNumber(value) {
    return new Intl.NumberFormat("en-PH").format(
        Number(value) || 0
    );
}

function Trend({ value }) {
    const number = Number(value) || 0;

    if (number === 0) {
        return (
            <span className="kpi-trend neutral">
                No change
            </span>
        );
    }

    return (
        <span
            className={`kpi-trend ${
                number > 0 ? "up" : "down"
            }`}
        >
            {number > 0 ? "↑" : "↓"}{" "}
            {Math.abs(number).toFixed(1)}%
        </span>
    );
}

function KpiCard({
    title,
    value,
    description,
    trend,
    icon,
    iconClass = "",
    isCurrency = false,
}) {
    return (
        <div className="col-xl-2 col-lg-4 col-md-6">

            <div className="report-kpi-card">

                <div className="report-kpi-top">

                    <div>
                        <span className="report-kpi-title">
                            {title}
                        </span>

                        <h3 className="report-kpi-value">
                            {isCurrency
                                ? formatCurrency(value)
                                : formatNumber(value)}
                        </h3>
                    </div>

                    <div
                        className={`report-kpi-icon ${iconClass}`}
                    >
                        <i
                            className={`bi ${icon}`}
                        />
                    </div>

                </div>

                <div className="report-kpi-bottom">

                    {trend !== undefined && (
                        <Trend value={trend} />
                    )}

                    {description && (
                        <span className="report-kpi-description">
                            {description}
                        </span>
                    )}

                </div>

            </div>

        </div>
    );
}

export default function ReportKpiCards({
    financial = {},
    operations = {},
    containerAccountability = {},
}) {
    return (
        <div className="row g-3 mb-4">

            {/* TOTAL REVENUE */}

            <KpiCard
                title="Total Revenue"
                value={
                    financial.revenue
                }
                description="Completed sales"
                trend={
                    financial.revenueChange
                }
                icon="bi-cash-stack"
                iconClass="revenue"
                isCurrency
            />


            {/* REVENUE GROWTH */}

            <KpiCard
                title="Revenue Growth"
                value={
                    financial.revenueGrowth || 0
                }
                description="Compared with previous period"
                trend={
                    financial.revenueGrowth
                }
                icon="bi-graph-up-arrow"
                iconClass="growth"
            />


            {/* EXPENSES */}

            <KpiCard
                title="Total Expenses"
                value={
                    financial.expenses
                }
                description="Recorded expenses"
                trend={
                    financial.expenseChange
                }
                icon="bi-wallet2"
                iconClass="expense"
                isCurrency
            />


            {/* NET PROFIT */}

            <KpiCard
                title="Net Profit"
                value={
                    financial.netProfit
                }
                description="Revenue minus expenses"
                trend={
                    financial.profitChange
                }
                icon="bi-piggy-bank"
                iconClass="profit"
                isCurrency
            />


            {/* TOTAL ORDERS */}

            <KpiCard
                title="Total Orders"
                value={
                    operations.totalOrders
                }
                description="Orders in selected period"
                trend={
                    operations.orderChange
                }
                icon="bi-box-seam"
                iconClass="orders"
            />


            {/* GALLONS SOLD */}

            <KpiCard
                title="Gallons Sold"
                value={
                    operations.gallonsSold
                }
                description="5-gallon containers"
                trend={
                    operations.gallonsChange
                }
                icon="bi-droplet-half"
                iconClass="gallons"
            />

            <KpiCard
                title="Active Customers"
                value={operations.activeCustomers}
                description="Customers with orders"
                icon="bi-people"
                iconClass="growth"
            />

            <KpiCard
                title="Damaged / Missing"
                value={
                    Number(containerAccountability.damaged || 0) +
                    Number(containerAccountability.missing || 0)
                }
                description="Container losses"
                icon="bi-exclamation-triangle"
                iconClass="expense"
            />

        </div>
    );
}