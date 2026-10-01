import { formatCurrency } from "../../services/reports.service";

function formatNumber(value) {
    if (typeof value === "string") {
        return value;
    }

    return new Intl.NumberFormat("en-PH").format(
        Number(value) || 0
    );
}

function Trend({ value }) {
    if (value === null || value === undefined) {
        return (
            <span className="kpi-trend neutral">
                No previous data
            </span>
        );
    }

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
    valueFormatter,
}) {
    return (
        <div className="col-6 col-xl-3 col-lg-4 col-md-6 report-kpi-col">

            <div className="report-kpi-card">

                <div className="report-kpi-top">

                    <div>
                        <span className="report-kpi-title">
                            {title}
                        </span>

                        <h3 className="report-kpi-value">
                            {valueFormatter
                                ? valueFormatter(value)
                                : isCurrency
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

export default function ReportKpiCards({ financial = {}, roi = 0 }) {
    return (
        <section className="report-focus-section">
            <div className="report-focus-heading">
                <span>01</span>
                <div>
                    <h2>Financial Performance &amp; Efficiency</h2>
                    <p>Revenue from completed orders, recorded costs, and returns.</p>
                </div>
            </div>

            <div className="row g-3 mb-4">
                <KpiCard
                    title="Gross Revenue"
                    value={financial.revenue}
                    description="Completed, revenue-eligible orders"
                    trend={financial.revenueChange}
                    icon="bi-cash-stack"
                    iconClass="revenue"
                    isCurrency
                />
                <KpiCard
                    title="Operating Expenses"
                    value={financial.expenses}
                    description="Recorded expenses in this period"
                    trend={financial.expenseChange}
                    icon="bi-wallet2"
                    iconClass="expense"
                    isCurrency
                />
                <KpiCard
                    title="Net Profit"
                    value={financial.netProfit}
                    description="Gross revenue minus expenses"
                    trend={financial.profitChange}
                    icon="bi-piggy-bank"
                    iconClass="profit"
                    isCurrency
                />
                <KpiCard
                    title="Return on Investment"
                    value={roi}
                    description="Net profit ÷ operating expenses"
                    icon="bi-percent"
                    iconClass="growth"
                    valueFormatter={(value) => `${(Number(value) || 0).toFixed(1)}%`}
                />
            </div>
        </section>
    );
}