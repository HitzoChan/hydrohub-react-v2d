import {
    useEffect,
    useMemo,
    useState,
} from "react";

import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

import ExpenseHeader from "../components/expenses/ExpenseHeader";
import ExpenseSummaryCards from "../components/expenses/ExpenseSummaryCards";
import ExpenseCharts from "../components/expenses/ExpenseCharts";
import ExpenseTable from "../components/expenses/ExpenseTable";
import ExpenseModal from "../components/expenses/ExpenseModal";

import {
    EXPENSE_CATEGORIES,
    getExpenses,
    getRevenueOrdersByDateRange,
    addExpense,
    updateExpense,
    deleteExpense,
} from "../services/expenses.service";

import "../styles/pages/expenses.css";


/* ============================================================
   HELPERS
============================================================ */

function formatDateForInput(date) {
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


function getToday() {
    return formatDateForInput(
        new Date()
    );
}


/* ============================================================
   GET EXPENSE DATE
============================================================ */

function getExpenseDate(expense) {

    return (
        expense?.expense_date ||
        expense?.date ||
        expense?.created_at ||
        null
    );
}


/* ============================================================
   GET EXPENSE TYPE
============================================================ */

function getExpenseType(expense) {

    return (
        expense?.expense_type ||
        expense?.type ||
        expense?.category ||
        "Other"
    );
}


/* ============================================================
   GET EXPENSE AMOUNT
============================================================ */

function getExpenseAmount(expense) {

    return Number(
        expense?.amount || 0
    );
}


/* ============================================================
   EXPENSES PAGE
============================================================ */

function Expenses() {

    /* ========================================================
       REPORT STATE
    ======================================================== */

    const [
        reportPeriod,
        setReportPeriod,
    ] = useState("monthly");


    const [
        referenceDate,
        setReferenceDate,
    ] = useState(getToday());


    const [
        customStartDate,
        setCustomStartDate,
    ] = useState(getToday());


    const [
        customEndDate,
        setCustomEndDate,
    ] = useState(getToday());


    const [
        categoryFilter,
        setCategoryFilter,
    ] = useState("all");


    const [
        tableSearch,
        setTableSearch,
    ] = useState("");


    const [
        tableCategory,
        setTableCategory,
    ] = useState("all");


    /* ========================================================
       EXPENSE DATA
    ======================================================== */

    const [
        expenses,
        setExpenses,
    ] = useState([]);


    const [
        loading,
        setLoading,
    ] = useState(true);


    const [
        error,
        setError,
    ] = useState("");


    const [
        revenueOrders,
        setRevenueOrders,
    ] = useState([]);


    const [
        revenueError,
        setRevenueError,
    ] = useState("");


    const [
        revenueRefreshKey,
        setRevenueRefreshKey,
    ] = useState(0);


    /* ========================================================
       MODAL STATE
    ======================================================== */

    const [
        showModal,
        setShowModal,
    ] = useState(false);


    const [
        editingExpense,
        setEditingExpense,
    ] = useState(null);


    const [
        saving,
        setSaving,
    ] = useState(false);


    /* ========================================================
       LOAD EXPENSES
    ======================================================== */

    useEffect(() => {

        loadExpenses();

    }, []);


    /* ========================================================
       REFRESH CURRENT REPORT DATA
    ======================================================== */

    useEffect(() => {

        const refreshCurrentData = () => {
            loadExpenses();
            setRevenueRefreshKey(
                (value) => value + 1
            );
        };

        const refreshTimer =
            window.setInterval(
                refreshCurrentData,
                30000
            );

        window.addEventListener(
            "focus",
            refreshCurrentData
        );

        return () => {
            window.clearInterval(
                refreshTimer
            );
            window.removeEventListener(
                "focus",
                refreshCurrentData
            );
        };

    }, []);


    async function loadExpenses() {

        try {

            setLoading(true);

            setError("");

            const data =
                await getExpenses();

            setExpenses(
                Array.isArray(data)
                    ? data
                    : []
            );

        } catch (err) {

            console.error(
                "Failed to load expenses:",
                err
            );

            setError(
                err?.message ||
                "Unable to load expense records."
            );

            setExpenses([]);

        } finally {

            setLoading(false);

        }
    }


    /* ========================================================
       REPORT DATE RANGE
    ======================================================== */

    const reportRange =
        useMemo(() => {

            if (
                reportPeriod === "custom"
            ) {
                if (!customStartDate || !customEndDate) {
                    return { start: null, end: null };
                }

                const start = new Date(`${customStartDate}T00:00:00`);
                const end = new Date(`${customEndDate}T23:59:59.999`);

                return end >= start
                    ? { start, end }
                    : { start: null, end: null };
            }

            if (!referenceDate) {

                return {
                    start: null,
                    end: null,
                };

            }


            const selected =
                new Date(
                    `${referenceDate}T00:00:00`
                );


            let start;
            let end;


            /* ------------------------------------------------
               DAILY
            ------------------------------------------------ */

            if (
                reportPeriod ===
                "daily"
            ) {

                start =
                    new Date(
                        selected
                    );

                start.setHours(
                    0,
                    0,
                    0,
                    0
                );


                end =
                    new Date(
                        selected
                    );

                end.setHours(
                    23,
                    59,
                    59,
                    999
                );

            }


            /* ------------------------------------------------
               MONTHLY
            ------------------------------------------------ */

            else if (
                reportPeriod ===
                "monthly"
            ) {

                start =
                    new Date(
                        selected.getFullYear(),
                        selected.getMonth(),
                        1
                    );


                end =
                    new Date(
                        selected.getFullYear(),
                        selected.getMonth() + 1,
                        0,
                        23,
                        59,
                        59,
                        999
                    );

            }


            /* ------------------------------------------------
               YEARLY
            ------------------------------------------------ */

            else {

                start =
                    new Date(
                        selected.getFullYear(),
                        0,
                        1
                    );


                end =
                    new Date(
                        selected.getFullYear(),
                        11,
                        31,
                        23,
                        59,
                        59,
                        999
                    );

            }


            return {
                start,
                end,
            };

        }, [
            reportPeriod,
            referenceDate,
            customStartDate,
            customEndDate,
        ]);


    /* ========================================================
       FILTER EXPENSES BY REPORT PERIOD
    ======================================================== */

    const reportExpenses =
        useMemo(() => {

            if (
                !reportRange.start ||
                !reportRange.end
            ) {

                return [];

            }


            return expenses.filter(
                (expense) => {

                    const rawDate =
                        getExpenseDate(
                            expense
                        );


                    if (!rawDate) {
                        return false;
                    }


                    const date =
                        new Date(
                            rawDate
                        );


                    if (
                        Number.isNaN(
                            date.getTime()
                        )
                    ) {

                        return false;

                    }


                    return (
                        date >=
                            reportRange.start &&
                        date <=
                            reportRange.end &&
                        (
                            categoryFilter === "all" ||
                            getExpenseType(expense) === categoryFilter
                        )
                    );

                }
            );

        }, [
            expenses,
            reportRange,
            categoryFilter,
        ]);


    /* ========================================================
       TOTAL EXPENSES
    ======================================================== */

    const totalExpenses =
        useMemo(() => {

            return reportExpenses.reduce(
                (
                    total,
                    expense
                ) => {

                    return (
                        total +
                        getExpenseAmount(
                            expense
                        )
                    );

                },
                0
            );

        }, [
            reportExpenses,
        ]);


    /* ========================================================
       LOAD REVENUE ORDERS
    ======================================================== */

    useEffect(() => {

        async function loadRevenue() {

            if (
                !reportRange.start ||
                !reportRange.end
            ) {
                setRevenueOrders([]);
                return;
            }


            try {

                setRevenueError("");

                const orders =
                    await getRevenueOrdersByDateRange(
                        formatDateForInput(reportRange.start),
                        formatDateForInput(reportRange.end)
                    );

                setRevenueOrders(
                    Array.isArray(orders)
                        ? orders
                        : []
                );

                console.log(
                    `[Expenses] Revenue query succeeded: ${orders.length} valid orders`
                );

            } catch (err) {

                console.error(
                    "[Expenses] Revenue query failed:",
                    err
                );

                setRevenueOrders([]);
                setRevenueError(
                    "Unable to load revenue for this report period."
                );

            }
        }


        loadRevenue();

    }, [
        reportRange,
        revenueRefreshKey,
    ]);


    /* ========================================================
       EXPENSE CATEGORY DATA
    ======================================================== */

    const categoryData =
        useMemo(() => {

            const categories = {};


            reportExpenses.forEach(
                (expense) => {

                    const category =
                        getExpenseType(
                            expense
                        );


                    const amount =
                        getExpenseAmount(
                            expense
                        );


                    if (
                        !categories[
                            category
                        ]
                    ) {

                        categories[
                            category
                        ] = 0;

                    }


                    categories[
                        category
                    ] += amount;

                }
            );


            return Object.entries(
                categories
            )
                .map(
                    ([
                        category,
                        amount,
                    ]) => ({
                        category,
                        amount,
                    })
                )
                .sort(
                    (a, b) =>
                        b.amount -
                        a.amount
                );

        }, [
            reportExpenses,
        ]);


    /* ========================================================
       PERIOD LABEL
    ======================================================== */

    const periodLabel =
        reportPeriod ===
        "daily"
            ? "Daily"
            : reportPeriod ===
                "monthly"
                ? "Monthly"
                : reportPeriod === "yearly"
                    ? "Yearly"
                    : "Custom";


    /* ========================================================
       REVENUE
    ======================================================== */

    const totalRevenue =
        useMemo(() =>
            revenueOrders.reduce(
                (total, order) =>
                    total + Number(
                        order.total_price || 0
                    ),
                0
            ),
            [
                revenueOrders,
            ]
        );


    /* ========================================================
       NET PROFIT
    ======================================================== */

    const netProfit =
        totalRevenue -
        totalExpenses;


    /* ========================================================
       ROI
    ======================================================== */

    const roi =
        totalExpenses > 0
            ? (
                (
                    netProfit /
                    totalExpenses
                ) * 100
            )
            : 0;


    /* ========================================================
       PROFIT MARGIN
    ======================================================== */

    const profitMargin =
        totalRevenue > 0
            ? (
                (
                    netProfit /
                    totalRevenue
                ) * 100
            )
            : 0;


    /* ========================================================
       REVENUE VS EXPENSE DATA
    ======================================================== */

    const revenueExpenseData =
        useMemo(() => {

            if (
                !reportRange.start ||
                !reportRange.end
            ) {

                return [];

            }


            const grouped = {};


            revenueOrders.forEach(
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


                    if (
                        reportPeriod ===
                        "daily"
                    ) {
                        key =
                            date.toLocaleDateString(
                                "en-PH",
                                {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                }
                            );
                    } else if (
                        reportPeriod ===
                        "monthly"
                    ) {
                        key =
                            date.toLocaleDateString(
                                "en-PH",
                                {
                                    month: "short",
                                    day: "numeric",
                                }
                            );
                    } else {
                        key =
                            date.toLocaleDateString(
                                "en-PH",
                                {
                                    month: "short",
                                }
                            );
                    }


                    if (!grouped[key]) {
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


            reportExpenses.forEach(
                (expense) => {

                    const rawDate =
                        getExpenseDate(
                            expense
                        );


                    if (!rawDate) {
                        return;
                    }


                    const date =
                        new Date(
                            rawDate
                        );


                    if (
                        Number.isNaN(
                            date.getTime()
                        )
                    ) {

                        return;

                    }


                    let key;


                    /* ----------------------------------------
                       DAILY
                    ---------------------------------------- */

                    if (
                        reportPeriod ===
                        "daily"
                    ) {

                        key =
                            date.toLocaleDateString(
                                "en-PH",
                                {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                }
                            );

                    }


                    /* ----------------------------------------
                       MONTHLY
                    ---------------------------------------- */

                    else if (
                        reportPeriod ===
                        "monthly"
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


                    /* ----------------------------------------
                       YEARLY
                    ---------------------------------------- */

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


                    grouped[key]
                        .expenses +=
                        getExpenseAmount(
                            expense
                        );

                }
            );


            return Object.values(
                grouped
            );

        }, [
            reportExpenses,
            revenueOrders,
            reportPeriod,
            reportRange,
        ]);


    /* ========================================================
       OPEN ADD MODAL
    ======================================================== */

    function handleOpenAddExpense() {

        setEditingExpense(
            null
        );

        setError("");

        setShowModal(
            true
        );
    }


    /* ========================================================
       OPEN EDIT MODAL
    ======================================================== */

    function handleEditExpense(
        expense
    ) {

        if (!expense?.id) {

            console.error(
                "Cannot edit expense without ID."
            );

            return;
        }


        setEditingExpense(
            expense
        );

        setError("");

        setShowModal(
            true
        );
    }


    /* ========================================================
       CLOSE MODAL
    ======================================================== */

    function handleCloseModal() {

        if (saving) {
            return;
        }


        setShowModal(
            false
        );

        setEditingExpense(
            null
        );

        setError("");
    }


    /* ========================================================
       ADD EXPENSE
    ======================================================== */

    async function handleAddExpense(
        expense
    ) {

        try {

            setSaving(true);

            setError("");


            await addExpense(
                expense
            );


            setShowModal(
                false
            );

            setEditingExpense(
                null
            );


            await loadExpenses();

        } catch (err) {

            console.error(
                "Failed to create expense:",
                err
            );


            setError(
                err?.message ||
                "Unable to create expense."
            );


            throw err;

        } finally {

            setSaving(false);

        }
    }


    /* ========================================================
       UPDATE EXPENSE
    ======================================================== */

    async function handleUpdateExpense(
        expense
    ) {

        if (!editingExpense?.id) {

            console.error(
                "Cannot update expense without ID."
            );

            return;

        }


        try {

            setSaving(true);

            setError("");


            await updateExpense(
                editingExpense.id,
                expense
            );


            setShowModal(
                false
            );

            setEditingExpense(
                null
            );


            await loadExpenses();

        } catch (err) {

            console.error(
                "Failed to update expense:",
                err
            );


            setError(
                err?.message ||
                "Unable to update expense."
            );


            throw err;

        } finally {

            setSaving(false);

        }
    }


    /* ========================================================
       DELETE EXPENSE
    ======================================================== */

    async function handleDeleteExpense(
        id
    ) {

        if (!id) {

            console.error(
                "Cannot delete expense without ID."
            );

            return;

        }


        const confirmed =
            window.confirm(
                "Are you sure you want to delete this expense?"
            );


        if (!confirmed) {
            return;
        }


        try {

            setError("");


            await deleteExpense(
                id
            );


            await loadExpenses();

        } catch (err) {

            console.error(
                "Failed to delete expense:",
                err
            );


            setError(
                err?.message ||
                "Unable to delete expense."
            );

        }
    }


    /* ========================================================
       SUMMARY DATA
    ======================================================== */

    const summaryData = {

        totalRevenue,

        totalExpenses,

        netProfit,

        roi,

        profitMargin,

    };


    /* ========================================================
       RENDER
    ======================================================== */

    return (

        <div
            className="app-layout"
        >

            {/* ==================================================
                SIDEBAR
            ================================================== */}

            <Sidebar />


            {/* ==================================================
                MAIN AREA
            ================================================== */}

            <main
                className="main-content expenses-main-content"
            >

                {/* ==================================================
                    HEADER
                ================================================== */}

                <Header />


                {/* ==================================================
                    EXPENSE PAGE
                ================================================== */}

                <div
                    className="expenses-page"
                >

                    {/* ==================================================
                        PAGE HEADER
                    ================================================== */}

                    <ExpenseHeader
                        onAddExpense={
                            handleOpenAddExpense
                        }
                    />


                    {/* ==================================================
                        ERROR MESSAGE
                    ================================================== */}

                    {(error || revenueError) && (

                        <div
                            className=
                                "expense-page-error"
                        >

                            <strong>
                                Unable to complete request
                            </strong>

                            <span>
                                {error || revenueError}
                            </span>

                            <button
                                type="button"
                                onClick={
                                    () =>
                                        setError(
                                            ""
                                        )
                                }
                            >
                                ×
                            </button>

                        </div>

                    )}


                    {/* ==================================================
                        REPORT PERIOD
                    ================================================== */}

                    <section
                        className=
                            {
                                `expense-period-filter ${
                                    reportPeriod === "custom"
                                        ? "custom-period"
                                        : ""
                                }`
                            }
                    >

                        <div
                            className=
                                "expense-period-filter-inner"
                        >

                            {/* REPORT PERIOD */}

                            <div
                                className=
                                    "expense-filter-group"
                            >

                                <label
                                    className=
                                        "expense-filter-label"
                                >
                                    Report Period
                                </label>


                                <div
                                    className=
                                        "expense-period-buttons"
                                >

                                    <button
                                        type="button"
                                        className={
                                            reportPeriod ===
                                            "daily"
                                                ? "active"
                                                : ""
                                        }
                                        onClick={() =>
                                            setReportPeriod(
                                                "daily"
                                            )
                                        }
                                    >
                                        Daily
                                    </button>


                                    <button
                                        type="button"
                                        className={
                                            reportPeriod ===
                                            "monthly"
                                                ? "active"
                                                : ""
                                        }
                                        onClick={() =>
                                            setReportPeriod(
                                                "monthly"
                                            )
                                        }
                                    >
                                        Monthly
                                    </button>


                                    <button
                                        type="button"
                                        className={
                                            reportPeriod ===
                                            "yearly"
                                                ? "active"
                                                : ""
                                        }
                                        onClick={() =>
                                            setReportPeriod(
                                                "yearly"
                                            )
                                        }
                                    >
                                        Yearly
                                    </button>


                                    <button
                                        type="button"
                                        className={
                                            reportPeriod ===
                                            "custom"
                                                ? "active"
                                                : ""
                                        }
                                        onClick={() =>
                                            setReportPeriod(
                                                "custom"
                                            )
                                        }
                                    >
                                        Custom
                                    </button>

                                </div>

                            </div>


                            {/* REFERENCE DATE */}

                            <div
                                className=
                                    "expense-filter-group"
                            >

                                <label
                                    htmlFor=
                                        {
                                            reportPeriod === "custom"
                                                ? "expense-custom-start-date"
                                                : "expense-reference-date"
                                        }
                                    className=
                                        "expense-filter-label"
                                >
                                    {reportPeriod === "custom"
                                        ? "Start Date"
                                        : "Reference Date"}
                                </label>


                                <input
                                    id=
                                        {
                                            reportPeriod === "custom"
                                                ? "expense-custom-start-date"
                                                : "expense-reference-date"
                                        }
                                    type="date"
                                    className=
                                        "expense-reference-date"
                                    value={
                                        reportPeriod === "custom"
                                            ? customStartDate
                                            : referenceDate
                                    }
                                    onChange={
                                        (event) =>
                                            reportPeriod === "custom"
                                                ? setCustomStartDate(
                                                    event.target.value
                                                )
                                                : setReferenceDate(
                                                    event.target.value
                                                )
                                    }
                                />

                            </div>


                            {reportPeriod === "custom" && (
                                <div className="expense-filter-group">
                                    <label
                                        htmlFor="expense-custom-end-date"
                                        className="expense-filter-label"
                                    >
                                        End Date
                                    </label>

                                    <input
                                        id="expense-custom-end-date"
                                        type="date"
                                        className="expense-reference-date"
                                        value={customEndDate}
                                        onChange={(event) =>
                                            setCustomEndDate(
                                                event.target.value
                                            )
                                        }
                                    />
                                </div>
                            )}


                            {/* CATEGORY FILTER */}

                            <div className="expense-filter-group">
                                <label
                                    htmlFor="expense-category-filter"
                                    className="expense-filter-label"
                                >
                                    Expense Category
                                </label>

                                <select
                                    id="expense-category-filter"
                                    className="expense-reference-date"
                                    value={categoryFilter}
                                    onChange={(event) =>
                                        setCategoryFilter(
                                            event.target.value
                                        )
                                    }
                                >
                                    <option value="all">
                                        All Categories
                                    </option>

                                    {EXPENSE_CATEGORIES.map((category) => (
                                        <option
                                            key={category}
                                            value={category}
                                        >
                                            {category}
                                        </option>
                                    ))}
                                </select>
                            </div>


                            {/* REPORT STATUS */}

                            <div
                                className=
                                    "expense-report-status"
                            >

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

                    </section>


                    {/* ==================================================
                        SUMMARY CARDS
                    ================================================== */}

                    <ExpenseSummaryCards
                        data={
                            summaryData
                        }
                    />


                    {/* ==================================================
                        CHARTS
                    ================================================== */}

                    <ExpenseCharts
                        revenueExpenseData={
                            revenueExpenseData
                        }
                        categoryData={
                            categoryData
                        }
                    />


                    {/* ==================================================
                        EXPENSE TABLE
                    ================================================== */}

                    <ExpenseTable
                        expenses={
                            reportExpenses
                        }
                        search={
                            tableSearch
                        }
                        category={
                            tableCategory
                        }
                        onSearchChange={
                            setTableSearch
                        }
                        onCategoryChange={
                            setTableCategory
                        }
                        loading={
                            loading
                        }
                        error={
                            error
                        }
                        onEdit={
                            handleEditExpense
                        }
                        onDelete={
                            handleDeleteExpense
                        }
                    />


                    {/* ==================================================
                        ADD / EDIT MODAL
                    ================================================== */}

                    <ExpenseModal
                        isOpen={
                            showModal
                        }
                        onClose={
                            handleCloseModal
                        }
                        onSave={
                            editingExpense
                                ? handleUpdateExpense
                                : handleAddExpense
                        }
                        expense={
                            editingExpense
                        }
                    />

                </div>


                {/* ==================================================
                    FOOTER
                ================================================== */}

                <Footer />

            </main>

        </div>
    );
}


export default Expenses;