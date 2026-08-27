import {
    CalendarDays,
    Clock3,
} from "lucide-react";

function ExpensePeriodFilter({
    period,
    referenceDate,
    onPeriodChange,
    onDateChange,
}) {
    const periodLabel =
        period === "daily"
            ? "Daily"
            : period === "monthly"
                ? "Monthly"
                : "Yearly";

    return (
        <section className="expense-period-section">

            <div className="expense-period-header">

                <div className="expense-period-title-area">

                    <div className="expense-period-icon">
                        <CalendarDays
                            size={21}
                            strokeWidth={2}
                        />
                    </div>

                    <div>
                        <h3>
                            Report Period
                        </h3>

                        <p>
                            Select the reporting period and reference date.
                        </p>
                    </div>

                </div>

                <div className="expense-period-status">
                    <Clock3 size={17} />

                    <span>
                        Showing
                    </span>

                    <strong>
                        {periodLabel}
                    </strong>

                    <span>
                        report
                    </span>
                </div>

            </div>

            <div className="expense-period-controls">

                {/* PERIOD */}
                <div className="expense-period-group">

                    <span className="expense-period-label">
                        Period
                    </span>

                    <div className="expense-period-buttons">

                        <button
                            type="button"
                            className={
                                period === "daily"
                                    ? "active"
                                    : ""
                            }
                            onClick={() =>
                                onPeriodChange("daily")
                            }
                        >
                            Daily
                        </button>

                        <button
                            type="button"
                            className={
                                period === "monthly"
                                    ? "active"
                                    : ""
                            }
                            onClick={() =>
                                onPeriodChange("monthly")
                            }
                        >
                            Monthly
                        </button>

                        <button
                            type="button"
                            className={
                                period === "yearly"
                                    ? "active"
                                    : ""
                            }
                            onClick={() =>
                                onPeriodChange("yearly")
                            }
                        >
                            Yearly
                        </button>

                    </div>

                </div>

                {/* REFERENCE DATE */}
                <div className="expense-reference-group">

                    <label
                        htmlFor="expense-reference-date"
                    >
                        Reference Date
                    </label>

                    <div className="expense-date-input">

                        <CalendarDays
                            size={18}
                        />

                        <input
                            id="expense-reference-date"
                            type="date"
                            value={referenceDate}
                            onChange={(event) =>
                                onDateChange(
                                    event.target.value
                                )
                            }
                        />

                    </div>

                </div>

            </div>

        </section>
    );
}

export default ExpensePeriodFilter;