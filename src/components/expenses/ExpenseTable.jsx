import { useEffect, useState } from "react";

const ITEMS_PER_PAGE = 10;

function formatCurrency(value) {
    return `₱${Number(
        value || 0
    ).toLocaleString(
        "en-PH",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }
    )}`;
}


function formatDate(dateValue) {

    if (!dateValue) {
        return "—";
    }

    const date =
        new Date(
            dateValue
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "—";
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


function ExpenseTable({
    expenses = [],
    search = "",
    category = "all",
    onSearchChange,
    onCategoryChange,
    onEdit,
    onDelete,
}) {

    const [currentPage, setCurrentPage] = useState(1);

    const searchValue =
        String(
            search || ""
        )
            .toLowerCase()
            .trim();


    /*
    |--------------------------------------------------------------------------
    | FILTER EXPENSES
    |--------------------------------------------------------------------------
    */

    const filteredExpenses =
        expenses.filter(
            (expense) => {

                const type =
                    expense.expense_type ||
                    expense.type ||
                    "";

                const description =
                    expense.description ||
                    "";

                const driver =
                    expense.driver_name ||
                    expense.driver ||
                    "";

                const notes =
                    expense.notes ||
                    "";


                const matchesSearch =
                    searchValue === "" ||

                    String(
                        type
                    )
                        .toLowerCase()
                        .includes(
                            searchValue
                        ) ||

                    String(
                        description
                    )
                        .toLowerCase()
                        .includes(
                            searchValue
                        ) ||

                    String(
                        driver
                    )
                        .toLowerCase()
                        .includes(
                            searchValue
                        ) ||

                    String(
                        notes
                    )
                        .toLowerCase()
                        .includes(
                            searchValue
                        );


                const matchesCategory =
                    category === "all" ||

                    String(
                        type
                    )
                        .toLowerCase()
                        .trim() ===

                    String(
                        category
                    )
                        .toLowerCase()
                        .trim();


                return (
                    matchesSearch &&
                    matchesCategory
                );
            }
        );

    const totalPages = Math.max(
        1,
        Math.ceil(filteredExpenses.length / ITEMS_PER_PAGE)
    );
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const paginatedExpenses = filteredExpenses.slice(
        (safeCurrentPage - 1) * ITEMS_PER_PAGE,
        safeCurrentPage * ITEMS_PER_PAGE
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [search, category]);


    /*
    |--------------------------------------------------------------------------
    | CATEGORIES
    |--------------------------------------------------------------------------
    */

    const categories = [
        ...new Set(
            expenses
                .map(
                    (expense) =>
                        expense.expense_type ||
                        expense.type
                )
                .filter(Boolean)
        ),
    ];


    /*
    |--------------------------------------------------------------------------
    | RENDER
    |--------------------------------------------------------------------------
    */

    return (

        <section
            className=
                "expense-records-card"
        >

            {/* ==================================================
                HEADER
            ================================================== */}

            <div
                className=
                    "expense-records-header"
            >

                <div>

                    <h2>
                        Expense Records
                    </h2>

                    <p>
                        View and manage recorded
                        operating expenses.
                    </p>

                </div>


                <span
                    className=
                        "expense-record-count"
                >
                    {filteredExpenses.length}{" "}
                    record
                    {filteredExpenses.length !==
                    1
                        ? "s"
                        : ""}
                </span>

            </div>


            {/* ==================================================
                FILTERS
            ================================================== */}

            <div
                className=
                    "expense-table-filters"
            >

                <div
                    className=
                        "expense-search"
                >

                    <span>
                        🔍
                    </span>

                    <input
                        type="text"
                        placeholder=
                            "Search expenses..."
                        value={
                            search
                        }
                        onChange={
                            (event) =>
                                onSearchChange?.(
                                    event.target.value
                                )
                        }
                    />

                </div>


                <select
                    value={
                        category
                    }
                    onChange={
                        (event) =>
                            onCategoryChange?.(
                                event.target.value
                            )
                    }
                >

                    <option value="all">
                        All Categories
                    </option>


                    {categories.map(
                        (item) => (

                            <option
                                key={
                                    item
                                }
                                value={
                                    item
                                }
                            >
                                {item}
                            </option>

                        )
                    )}

                </select>

            </div>


            {/* ==================================================
                TABLE
            ================================================== */}

            <div
                className=
                    "expense-table-wrapper"
            >

                <table
                    className=
                        "expense-table"
                >

                    <thead>

                        <tr>

                            <th>
                                DATE
                            </th>

                            <th>
                                TYPE
                            </th>

                            <th>
                                DESCRIPTION
                            </th>

                            <th>
                                AMOUNT
                            </th>

                            <th>
                                DRIVER
                            </th>

                            <th>
                                NOTES
                            </th>

                            <th>
                                ACTIONS
                            </th>

                        </tr>

                    </thead>


                    <tbody>

                        {filteredExpenses.length ===
                        0 ? (

                            <tr>

                                <td
                                    colSpan="7"
                                    className=
                                        "expense-empty"
                                >

                                    <div>

                                        <div
                                            className=
                                                "expense-empty-icon"
                                        >
                                            ₱
                                        </div>

                                        <strong>
                                            No expenses found
                                        </strong>

                                        <p>
                                            There are no
                                            expense records
                                            for the selected
                                            filters.
                                        </p>

                                    </div>

                                </td>

                            </tr>

                        ) : (

                            paginatedExpenses.map(
                                (expense) => {

                                    const type =
                                        expense.expense_type ||
                                        expense.type ||
                                        "Other";

                                    const driver =
                                        expense.driver_name ||
                                        expense.driver ||
                                        "—";

                                    const date =
                                        expense.expense_date ||
                                        expense.date;


                                    return (

                                        <tr
                                            key={
                                                expense.id
                                            }
                                        >

                                            {/* DATE */}

                                            <td>
                                                {formatDate(
                                                    date
                                                )}
                                            </td>


                                            {/* TYPE */}

                                            <td>

                                                <span
                                                    className=
                                                        "expense-type-badge"
                                                >
                                                    {
                                                        type
                                                    }
                                                </span>

                                            </td>


                                            {/* DESCRIPTION */}

                                            <td>

                                                <span
                                                    className=
                                                        "expense-description"
                                                >
                                                    {
                                                        expense.description ||
                                                        "—"
                                                    }
                                                </span>

                                            </td>


                                            {/* AMOUNT */}

                                            <td>

                                                <strong
                                                    className=
                                                        "expense-amount"
                                                >
                                                    {formatCurrency(
                                                        expense.amount
                                                    )}
                                                </strong>

                                            </td>


                                            {/* DRIVER */}

                                            <td>
                                                {
                                                    driver
                                                }
                                            </td>


                                            {/* NOTES */}

                                            <td>

                                                <span
                                                    className=
                                                        "expense-notes"
                                                    title={
                                                        expense.notes ||
                                                        ""
                                                    }
                                                >
                                                    {
                                                        expense.notes ||
                                                        "—"
                                                    }
                                                </span>

                                            </td>


                                            {/* ACTIONS */}

                                            <td>

                                                <div
                                                    className=
                                                        "expense-actions"
                                                >

                                                    <button
                                                        type="button"
                                                        className=
                                                            "expense-edit-button"
                                                        onClick={() =>
                                                            onEdit?.(
                                                                expense
                                                            )
                                                        }
                                                    >
                                                        Edit
                                                    </button>


                                                    <button
                                                        type="button"
                                                        className=
                                                            "expense-delete-button"
                                                        onClick={() =>
                                                            onDelete?.(
                                                                expense.id
                                                            )
                                                        }
                                                    >
                                                        Delete
                                                    </button>

                                                </div>

                                            </td>

                                        </tr>

                                    );
                                }
                            )

                        )}

                    </tbody>

                </table>

            </div>

            {filteredExpenses.length > 0 && (
                <div className="expense-records-pagination">
                    <button
                        type="button"
                        onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                        disabled={safeCurrentPage === 1}
                    >
                        <i className="bi bi-chevron-left me-1" />
                        Previous
                    </button>

                    <span>
                        Page {safeCurrentPage} of {totalPages}
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            setCurrentPage((page) => Math.min(totalPages, page + 1))
                        }
                        disabled={safeCurrentPage >= totalPages}
                    >
                        Next
                        <i className="bi bi-chevron-right ms-1" />
                    </button>
                </div>
            )}

        </section>
    );
}


export default ExpenseTable;