import {
    useCallback,
    useEffect,
    useState,
} from "react";

import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

import ReportHeader from "../components/reports/ReportHeader";
import ReportFilters from "../components/reports/ReportFilters";
import ReportKpiCards from "../components/reports/ReportKpiCards";
import PerformanceOverview from "../components/reports/PerformanceOverview";
import OperationsOverview from "../components/reports/OperationsOverview";
import ReportAnalytics from "../components/reports/ReportAnalytics";

import {
    formatCurrency,
    getReportData,
} from "../services/reports.service";
import {
    getPreviousEquivalentRange,
    getRangeForPreset,
    formatPeriodLabel,
} from "../utils/reportDateUtils";
import { calculatePercentageChange } from "../utils/reportCalculations";

import "../styles/pages/reports.css";

export default function Reports() {

    /*
    |--------------------------------------------------------------------------
    | DATE RANGE
    |--------------------------------------------------------------------------
    */

    const [period, setPeriod] =
        useState("current-month");

    const initialRange = getRangeForPreset("current-month");

    const [startDate, setStartDate] = useState(initialRange.startDate);
    const [endDate, setEndDate] = useState(initialRange.endDate);


    /*
    |--------------------------------------------------------------------------
    | REPORT DATA
    |--------------------------------------------------------------------------
    */

    const [report, setReport] =
        useState(null);

    const [comparisonReport, setComparisonReport] = useState(null);


    /*
    |--------------------------------------------------------------------------
    | LOADING
    |--------------------------------------------------------------------------
    */

    const [loading, setLoading] =
        useState(true);


    /*
    |--------------------------------------------------------------------------
    | ERROR
    |--------------------------------------------------------------------------
    */

    const [error, setError] =
        useState("");


    /*
    |--------------------------------------------------------------------------
    | LOAD REPORT
    |--------------------------------------------------------------------------
    */

    const loadReport =
        useCallback(
            async (
                selectedStart,
                selectedEnd
            ) => {

                try {

                    setLoading(
                        true
                    );

                    setError("");

                    const comparisonRange = getPreviousEquivalentRange(selectedStart, selectedEnd);
                    const [data, previousData] = await Promise.all([
                        getReportData({ startDate: selectedStart, endDate: selectedEnd }),
                        getReportData(comparisonRange),
                    ]);

                    setReport(
                        data
                    );

                    setComparisonReport(previousData);

                } catch (
                    reportError
                ) {

                    console.error(
                        "[Reports] Failed to load report:",
                        reportError
                    );

                    setError(
                        reportError?.message ||
                            "Failed to load report data."
                    );

                } finally {

                    setLoading(
                        false
                    );
                }

            },
            []
        );


    /*
    |--------------------------------------------------------------------------
    | LOAD WHEN DATE CHANGES
    |--------------------------------------------------------------------------
    */

    useEffect(
        () => {

            // This effect synchronizes the selected range with Supabase data.
            // eslint-disable-next-line react-hooks/set-state-in-effect
            loadReport(
                startDate,
                endDate
            );

        },
        [
            loadReport,
            startDate,
            endDate,
        ]
    );


    /*
    |--------------------------------------------------------------------------
    | RANGE CHANGE
    |--------------------------------------------------------------------------
    */

    function handlePeriodChange(selectedPeriod) {
        const nextRange = getRangeForPreset(selectedPeriod);

        setPeriod(selectedPeriod);

        setStartDate(nextRange.startDate);

        setEndDate(nextRange.endDate);
    }


    /*
    |--------------------------------------------------------------------------
    | CUSTOM RANGE
    |--------------------------------------------------------------------------
    */

    function handleCustomRange(
        customStart,
        customEnd
    ) {
        setPeriod("custom");

        setStartDate(
            customStart
        );

        setEndDate(
            customEnd
        );
    }


    /*
    |--------------------------------------------------------------------------
    | FINANCIAL DATA
    |--------------------------------------------------------------------------
    */

    const financial =
        report?.financial || {};


    /*
    |--------------------------------------------------------------------------
    | OPERATIONAL DATA
    |--------------------------------------------------------------------------
    */

    const operations =
        report?.operations || {};


    /*
    |--------------------------------------------------------------------------
    | PERFORMANCE TREND
    |--------------------------------------------------------------------------
    */

    const performanceTrend =
        report?.financialTrend || [];

    const expenseBreakdown =
        report?.expenseBreakdown || [];

    const salesLogbook =
        report?.salesLogbook || [];

    const deliveryTypes =
        report?.deliveryTypes || [];

    const cashCollection =
        report?.cashCollection || {};

    const containerAccountability =
        report?.containerAccountability || {};

    const analytics =
        report?.analytics || {};

    const attentionItems =
        analytics.alerts || [];

    const roi =
        Number(financial.expenses) > 0
            ? (Number(financial.netProfit || 0) /
                Number(financial.expenses)) * 100
            : 0;

    const previousFinancial = comparisonReport?.financial || {};
    const previousOperations = comparisonReport?.operations || {};
    const financialWithComparison = {
        ...financial,
        revenueGrowth: calculatePercentageChange(financial.revenue, previousFinancial.revenue),
        revenueChange: calculatePercentageChange(financial.revenue, previousFinancial.revenue),
        expenseChange: calculatePercentageChange(financial.expenses, previousFinancial.expenses),
        profitChange: calculatePercentageChange(financial.netProfit, previousFinancial.netProfit),
    };
    const operationsWithComparison = {
        ...operations,
        orderChange: calculatePercentageChange(operations.totalOrders, previousOperations.totalOrders),
        gallonsChange: calculatePercentageChange(operations.gallonsSold, previousOperations.gallonsSold),
    };


    /*
    |--------------------------------------------------------------------------
    | RENDER
    |--------------------------------------------------------------------------
    */

    return (
        <div className="d-flex">

            <Sidebar />

            <div className="main-content reports-main-content bg-light p-4 w-100">

                <div
                    className="container-fluid"
                    style={{
                        maxWidth:
                            "1400px",
                    }}
                >

                    <Header />


                    {/* ==================================================
                        PAGE HEADER
                    ================================================== */}

                    <div className="report-page-header">

                        <ReportHeader />

                        <ReportFilters
                            period={period}
                            onPeriodChange={handlePeriodChange}
                            startDate={
                                startDate
                            }
                            endDate={
                                endDate
                            }
                            onCustomRange={
                                handleCustomRange
                            }
                        />

                    </div>


                    {/* ==================================================
                        ACTIVE DATE RANGE
                    ================================================== */}

                    <p className="text-muted small mb-4">

                        <span className="report-period-label">{formatPeriodLabel(startDate, endDate)}</span>{" "}
                        <span className="report-period-detail">Showing report data from{" "}</span>

                        <strong>
                            {startDate}
                        </strong>

                        {" "}to{" "}

                        <strong>
                            {endDate}
                        </strong>

                    </p>


                    {/* ==================================================
                        LOADING
                    ================================================== */}

                    {loading && (
                        <div className="card p-4 text-center mb-4">

                            <div
                                className="spinner-border spinner-border-sm me-2"
                                role="status"
                            />

                            Loading report data...

                        </div>
                    )}


                    {/* ==================================================
                        ERROR
                    ================================================== */}

                    {!loading &&
                        error && (
                            <div
                                className="alert alert-danger mb-4"
                                role="alert"
                            >

                                <strong>
                                    Unable to load reports.
                                </strong>

                                <div className="small mt-1">
                                    {error}
                                </div>

                            </div>
                        )}


                    {/* ==================================================
                        REPORT CONTENT
                    ================================================== */}

                    {!loading &&
                        !error &&
                        report && (
                            <>

                                {/* KPI CARDS */}

                                <ReportKpiCards
                                    financial={financialWithComparison}
                                    operations={
                                        operationsWithComparison
                                    }
                                    containerAccountability={
                                        containerAccountability
                                    }
                                />


                                {/* PERFORMANCE GRAPH */}

                                <PerformanceOverview
                                    data={
                                        performanceTrend
                                    }
                                />

                                <ReportAnalytics
                                    analytics={
                                        analytics
                                    }
                                    deliveryTypes={
                                        deliveryTypes
                                    }
                                />

                                <div className="row g-3 mb-4">
                                    <div className="col-xl-4 col-md-6">
                                        <section className="card report-detail-card h-100">
                                            <div className="report-section-header">
                                                <h5>Payment Overview</h5>
                                                <p>Collected and verification status.</p>
                                            </div>

                                            <div className="report-snapshot-list">
                                                <div><span>COD Collected</span><strong>{formatCurrency(analytics.payments?.cod?.collected)}</strong></div>
                                                <div><span>COD Unverified</span><strong>{formatCurrency(analytics.payments?.cod?.unverified)}</strong></div>
                                                <div><span>GCash Received</span><strong>{formatCurrency(analytics.payments?.gcash?.received)}</strong></div>
                                                <div><span>GCash Pending</span><strong className="negative">{analytics.payments?.gcash?.pending || 0}</strong></div>
                                            </div>
                                        </section>
                                    </div>

                                    <div className="col-xl-4 col-md-6">
                                        <section className="card report-detail-card h-100">
                                            <div className="report-section-header">
                                                <h5>Top Customers</h5>
                                                <p>Highest completed sales in this period.</p>
                                            </div>

                                            <div className="report-sales-list">
                                                {analytics.customers?.top?.length ? (
                                                    analytics.customers.top.map((customer) => (
                                                        <div className="report-sale-item" key={customer.id}>
                                                            <div>
                                                                <strong>{customer.name}</strong>
                                                                <span>{customer.orders} orders · {customer.gallons} gallons</span>
                                                            </div>
                                                            <strong>{formatCurrency(customer.spent)}</strong>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="report-empty-inline">No completed customers.</div>
                                                )}
                                            </div>
                                        </section>
                                    </div>

                                    <div className="col-xl-4 col-md-12">
                                        <section className="card report-detail-card report-attention-card h-100">
                                            <div className="report-section-header">
                                                <h5>Needs Attention</h5>
                                                <p>Items requiring administrator review.</p>
                                            </div>

                                            <div className="report-alert-list">
                                                {attentionItems.length ? (
                                                    attentionItems.map((item) => (
                                                        <div className="report-alert-item" key={item}>
                                                            <span className="report-alert-dot" />
                                                            <span>{item}</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="report-alert-item clear">
                                                        <span className="report-alert-dot" />
                                                        <span>No urgent items for this period.</span>
                                                    </div>
                                                )}
                                            </div>
                                        </section>
                                    </div>
                                </div>

                                <OperationsOverview
                                    operations={
                                        operations
                                    }
                                    containerAccountability={
                                        containerAccountability
                                    }
                                />


                                <div className="row g-3 mb-4">

                                    <div className="col-xl-5">
                                        <section className="card report-detail-card h-100">
                                            <div className="report-section-header">
                                                <h5>Expenses by Category</h5>
                                                <p>Where operating costs went during this period.</p>
                                            </div>

                                            <div className="report-breakdown-list">
                                                {expenseBreakdown.length === 0 ? (
                                                    <div className="report-empty-inline">
                                                        No expenses recorded for this period.
                                                    </div>
                                                ) : (
                                                    expenseBreakdown
                                                        .sort((a, b) => b.amount - a.amount)
                                                        .map((item) => {
                                                            const total = Number(financial.expenses) || 0;
                                                            const percentage = total > 0
                                                                ? (Number(item.amount) / total) * 100
                                                                : 0;

                                                            return (
                                                                <div className="report-breakdown-item" key={item.category}>
                                                                    <div className="report-breakdown-label">
                                                                        <span>{item.category}</span>
                                                                        <strong>{formatCurrency(item.amount)}</strong>
                                                                    </div>
                                                                    <div className="report-breakdown-track">
                                                                        <span style={{ width: `${percentage}%` }} />
                                                                    </div>
                                                                </div>
                                                            );
                                                        })
                                                )}
                                            </div>
                                        </section>
                                    </div>

                                    <div className="col-xl-3 col-md-6">
                                        <section className="card report-detail-card h-100">
                                            <div className="report-section-header">
                                                <h5>Business Snapshot</h5>
                                                <p>Key operational totals.</p>
                                            </div>

                                            <div className="report-snapshot-list">
                                                <div>
                                                    <span>Profit Margin</span>
                                                    <strong className={Number(financial.profitMargin) < 0 ? "negative" : "positive"}>
                                                        {Number(financial.profitMargin || 0).toFixed(1)}%
                                                    </strong>
                                                </div>
                                                <div>
                                                    <span>ROI</span>
                                                    <strong className={roi < 0 ? "negative" : "positive"}>
                                                        {roi.toFixed(1)}%
                                                    </strong>
                                                </div>
                                                <div>
                                                    <span>Cash Collected</span>
                                                    <strong>{formatCurrency(cashCollection.collected)}</strong>
                                                </div>
                                                <div>
                                                    <span>Delivery Types</span>
                                                    <strong>{deliveryTypes.length}</strong>
                                                </div>
                                                <div>
                                                    <span>Active Customers</span>
                                                    <strong>{operations.activeCustomers || 0}</strong>
                                                </div>
                                                <div>
                                                    <span>Delivered Orders</span>
                                                    <strong>{operations.statusCounts?.delivered || 0}</strong>
                                                </div>
                                            </div>
                                        </section>
                                    </div>

                                    <div className="col-xl-4 col-md-6">
                                        <section className="card report-detail-card h-100">
                                            <div className="report-section-header">
                                                <h5>Recent Sales</h5>
                                                <p>Completed orders in the selected period.</p>
                                            </div>

                                            <div className="report-sales-list">
                                                {salesLogbook.length === 0 ? (
                                                    <div className="report-empty-inline">
                                                        No completed sales recorded.
                                                    </div>
                                                ) : (
                                                    salesLogbook.slice(-5).reverse().map((sale) => (
                                                        <div className="report-sale-item" key={sale.id}>
                                                            <div>
                                                                <strong>{sale.customer}</strong>
                                                                <span>{sale.date} · {sale.containers} gallons</span>
                                                            </div>
                                                            <strong>{formatCurrency(sale.amount)}</strong>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </section>
                                    </div>

                                    <div className="col-xl-4 col-md-6">
                                        <section className="card report-detail-card h-100">
                                            <div className="report-section-header">
                                                <h5>Driver Performance</h5>
                                                <p>Completed deliveries in this period.</p>
                                            </div>

                                            <div className="report-driver-list">
                                                {operations.drivers?.length ? (
                                                    operations.drivers.slice(0, 5).map((driver) => (
                                                        <div className="report-driver-item" key={driver.driverId}>
                                                            <div>
                                                                <strong>{driver.driverName}</strong>
                                                                <span>{driver.gallons} gallons delivered</span>
                                                            </div>
                                                            <strong>{driver.deliveries}</strong>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="report-empty-inline">No driver deliveries recorded.</div>
                                                )}
                                            </div>
                                        </section>
                                    </div>

                                    <div className="col-xl-4 col-md-6">
                                        <section className="card report-detail-card h-100">
                                            <div className="report-section-header">
                                                <h5>Container Accountability</h5>
                                                <p>Returns and losses recorded in this period.</p>
                                            </div>

                                            <div className="report-snapshot-list">
                                                <div><span>Returned</span><strong>{containerAccountability.returned || 0}</strong></div>
                                                <div><span>Damaged</span><strong className="negative">{containerAccountability.damaged || 0}</strong></div>
                                                <div><span>Missing</span><strong className="negative">{containerAccountability.missing || 0}</strong></div>
                                                <div><span>Borrowed Outstanding</span><strong>{containerAccountability.borrowed || 0}</strong></div>
                                            </div>
                                        </section>
                                    </div>

                                </div>

                            </>
                        )}


                    <div className="reports-footer">
                        <Footer />
                    </div>

                </div>

            </div>

        </div>
    );
}