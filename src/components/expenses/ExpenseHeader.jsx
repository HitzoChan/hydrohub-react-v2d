function ExpenseHeader({
    onAddExpense,
}) {
    return (
        <section className="expense-header">

            <div className="expense-header-left">

                <div className="expense-header-icon">
                    ₱
                </div>

                <div className="expense-header-text">

                    <h1>
                        Expense Management
                    </h1>

                    <p>
                        Track operational costs,
                        monitor profitability, and
                        analyze your return on
                        investment.
                    </p>

                </div>

            </div>

            <button
                type="button"
                className="expense-add-button"
                onClick={onAddExpense}
            >
                <span aria-hidden="true">
                    +
                </span>

                <span>
                    Add Expense
                </span>
            </button>

        </section>
    );
}

export default ExpenseHeader;