import {
    TrendingUp,
    TrendingDown,
    CircleDollarSign,
    Percent,
    ChartNoAxesCombined,
} from "lucide-react";

function formatCurrency(value) {
    return `₱${Number(value || 0).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

function formatPercentage(value) {
    return `${Number(value || 0).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}%`;
}

function SummaryCard({
    title,
    value,
    description,
    type,
    icon,
}) {
    return (
        <div className={`expense-summary-card ${type}`}>
            <div className="expense-summary-card-content">

                <div className="expense-summary-card-top">
                    <span className="expense-summary-title">
                        {title}
                    </span>

                    <div className="expense-summary-icon">
                        {icon}
                    </div>
                </div>

                <div className="expense-summary-value">
                    {value}
                </div>

                <div className="expense-summary-description">
                    {description}
                </div>

            </div>
        </div>
    );
}

function ExpenseSummaryCards({
    data = {},
}) {
    const {
        totalRevenue = 0,
        totalExpenses = 0,
        netProfit = 0,
        roi = 0,
        profitMargin = 0,
    } = data;

    return (
        <section className="expense-summary-section">

            <div className="expense-summary-grid">

                {/* TOTAL REVENUE */}
                <SummaryCard
                    title="Total Revenue"
                    value={formatCurrency(totalRevenue)}
                    description="Completed sales"
                    type="revenue"
                    icon={
                        <TrendingUp
                            size={24}
                            strokeWidth={2.2}
                        />
                    }
                />

                {/* TOTAL EXPENSES */}
                <SummaryCard
                    title="Total Expenses"
                    value={formatCurrency(totalExpenses)}
                    description="Operating costs"
                    type="expenses"
                    icon={
                        <TrendingDown
                            size={24}
                            strokeWidth={2.2}
                        />
                    }
                />

                {/* NET PROFIT */}
                <SummaryCard
                    title="Net Profit"
                    value={formatCurrency(netProfit)}
                    description="Revenue − Expenses"
                    type="profit"
                    icon={
                        <CircleDollarSign
                            size={24}
                            strokeWidth={2.2}
                        />
                    }
                />

                {/* ROI */}
                <SummaryCard
                    title="ROI"
                    value={formatPercentage(roi)}
                    description="Profit ÷ Expenses × 100"
                    type="roi"
                    icon={
                        <Percent
                            size={24}
                            strokeWidth={2.2}
                        />
                    }
                />

                <SummaryCard
                    title="Profit Margin"
                    value={formatPercentage(profitMargin)}
                    description="Profit ÷ Revenue × 100"
                    type="margin"
                    icon={
                        <ChartNoAxesCombined
                            size={24}
                            strokeWidth={2.2}
                        />
                    }
                />

            </div>

        </section>
    );
}

export default ExpenseSummaryCards;