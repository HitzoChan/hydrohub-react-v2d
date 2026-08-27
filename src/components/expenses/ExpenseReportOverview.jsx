function formatCurrency(value) {
    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 2,
    }).format(Number(value) || 0);
}


function calculateROI(
    revenue,
    expenses
) {
    const revenueValue =
        Number(revenue) || 0;

    const expenseValue =
        Number(expenses) || 0;

    if (expenseValue === 0) {
        return 0;
    }

    return (
        (
            revenueValue -
            expenseValue
        ) /
        expenseValue
    ) * 100;
}


function ReportCard({
    title,
    period,
    revenue,
    expenses,
}) {

    const profit =
        Number(revenue || 0) -
        Number(expenses || 0);

    const roi =
        calculateROI(
            revenue,
            expenses
        );


    return (
        <article className="expense-report-card">

            <div className="expense-report-card-header">

                <div>

                    <span className="expense-report-card-title">
                        {title}
                    </span>

                    <span className="expense-report-card-period">
                        {period}
                    </span>

                </div>


                <div className="expense-report-card-icon">
                    ₱
                </div>

            </div>


            <div className="expense-report-card-revenue">

                <span>
                    Revenue
                </span>

                <strong>
                    {formatCurrency(
                        revenue
                    )}
                </strong>

            </div>


            <div className="expense-report-card-row">

                <span>
                    Expenses
                </span>

                <strong>
                    {formatCurrency(
                        expenses
                    )}
                </strong>

            </div>


            <div className="expense-report-card-row">

                <span>
                    Net Profit
                </span>

                <strong
                    className={
                        profit < 0
                            ? "loss"
                            : "profit"
                    }
                >
                    {formatCurrency(
                        profit
                    )}
                </strong>

            </div>


            <div className="expense-report-card-footer">

                <span>
                    ROI
                </span>

                <strong
                    className={
                        roi < 0
                            ? "loss"
                            : "roi"
                    }
                >
                    {roi.toFixed(2)}%
                </strong>

            </div>

        </article>
    );
}


function ExpenseReportOverview({
    daily,
    monthly,
    yearly,
}) {

    return (
        <section className="expense-report-overview">

            <div className="expense-section-heading">

                <div>

                    <span className="expense-section-eyebrow">
                        PERFORMANCE SUMMARY
                    </span>

                    <h2>
                        Financial Reports
                    </h2>

                    <p>
                        Compare financial performance
                        across daily, monthly, and
                        yearly reporting periods.
                    </p>

                </div>

            </div>


            <div className="expense-report-grid">

                <ReportCard
                    title="Daily Report"
                    period="Today"
                    revenue={
                        daily?.revenue
                    }
                    expenses={
                        daily?.expenses
                    }
                />


                <ReportCard
                    title="Monthly Report"
                    period="Current Month"
                    revenue={
                        monthly?.revenue
                    }
                    expenses={
                        monthly?.expenses
                    }
                />


                <ReportCard
                    title="Yearly Report"
                    period="Current Year"
                    revenue={
                        yearly?.revenue
                    }
                    expenses={
                        yearly?.expenses
                    }
                />

            </div>

        </section>
    );
}


export default ExpenseReportOverview;