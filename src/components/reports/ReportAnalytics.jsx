import { useEffect, useRef } from "react";
import { formatCurrency } from "../../services/reports.service";

function ChartCard({ title, children, hasData, emptyMessage }) {
    return (
        <section className={`report-analytics-card ${hasData ? "" : "is-empty"}`}>
            <h3>{title}</h3>
            <div className={`report-analytics-canvas ${hasData ? "" : "is-empty"}`}>
                {hasData ? children : (
                    <div className="report-analytics-empty">
                        <i className="bi bi-bar-chart-line" aria-hidden="true" />
                        <span>{emptyMessage}</span>
                    </div>
                )}
            </div>
        </section>
    );
}

function PaymentMethodCard({ data, hasData, chartRef }) {
    return (
        <section className="report-analytics-card">
            <h3>Collected by Payment Method</h3>
            {hasData ? (
                <div className="report-payment-method-layout">
                    <div className="report-payment-method-chart">
                        <canvas ref={chartRef} />
                    </div>
                    <div className="report-payment-method-values">
                        {data.map(([method, amount]) => (
                            <div className="report-payment-method-value" key={method}>
                                <span className={`report-payment-method-dot ${method === "GCash" ? "gcash" : "cod"}`} />
                                <div>
                                    <span>{method}</span>
                                    <strong>{formatCurrency(amount)}</strong>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="report-analytics-canvas is-empty">
                    <div className="report-analytics-empty">
                        <i className="bi bi-bar-chart-line" aria-hidden="true" />
                        <span>No collected payments in this period.</span>
                    </div>
                </div>
            )}
        </section>
    );
}

export default function ReportAnalytics({
    analytics = {},
}) {
    const paymentRef = useRef(null);
    const gallonRef = useRef(null);
    const scheduleRef = useRef(null);
    const chartRefs = useRef([]);
    const payment = analytics.paymentMethods || {};
    const paymentEntries = Object.entries(payment).sort(
        ([first], [second]) => {
            const order = { COD: 0, GCash: 1 };
            return (order[first] ?? 2) - (order[second] ?? 2);
        }
    );
    const gallonEntries = Object.entries(analytics.gallonsByDate || {});
    const schedule = analytics.scheduling || {};
    const scheduleValues = [schedule.morning || 0, schedule.afternoon || 0, schedule.evening || 0];
    const hasPaymentData = paymentEntries.some(([, count]) => Number(count) > 0);
    const hasGallonData = gallonEntries.some(([, gallons]) => Number(gallons) > 0);
    const hasScheduleData = scheduleValues.some((count) => Number(count) > 0);

    useEffect(() => {
        let mounted = true;

        async function draw() {
            chartRefs.current.forEach((chart) => chart?.destroy());
            chartRefs.current = [];

            if (!hasPaymentData && !hasGallonData && !hasScheduleData) {
                return;
            }

            const module = await import("chart.js/auto");
            if (!mounted) return;

            const Chart = module.default;

            const create = (canvas, config) => {
                if (
                    !canvas ||
                    config.labels.length === 0 ||
                    !config.values.some((value) => Number(value) > 0)
                ) return;

                const context = canvas.getContext("2d");
                const areaFill = config.type === "line"
                    ? context.createLinearGradient(0, 0, 0, 220)
                    : config.colors;

                if (areaFill && config.type === "line") {
                    areaFill.addColorStop(0, "rgba(24, 183, 216, 0.24)");
                    areaFill.addColorStop(1, "rgba(24, 183, 216, 0.02)");
                }

                chartRefs.current.push(new Chart(canvas, {
                    type: config.type,
                    data: {
                        labels: config.labels,
                        datasets: [{
                            data: config.values,
                            backgroundColor: areaFill,
                            borderColor: config.borderColor || config.colors,
                            borderWidth: config.type === "line" ? 3 : 2,
                            borderRadius: config.type === "bar" ? 6 : 0,
                            fill: config.type === "line",
                            tension: 0.35,
                            pointRadius: config.type === "line" ? 4 : 0,
                            pointHoverRadius: config.type === "line" ? 6 : 0,
                            pointBackgroundColor: "#18b7d8",
                            pointBorderColor: "#ffffff",
                            pointBorderWidth: 2,
                        }],
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: config.legend !== false } },
                        scales: config.type === "doughnut" ? {} : {
                            y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: "#eef2f7" } },
                            x: { grid: { color: "#eef2f7" } },
                        },
                    },
                }));
            };

            create(paymentRef.current, {
                type: "doughnut",
                labels: paymentEntries.map(([label]) => label),
                values: paymentEntries.map(([, count]) => count),
                colors: paymentEntries.map(([label]) => ({ COD: "#2563eb", GCash: "#18b7d8" })[label] || "#94a3b8"),
                legend: false,
            });
            create(gallonRef.current, {
                type: "line",
                labels: gallonEntries.map(([date]) =>
                    new Date(`${date}T00:00:00`).toLocaleDateString(
                        "en-PH",
                        {
                            month: "short",
                            day: "numeric",
                        }
                    )
                ),
                values: gallonEntries.map(([, value]) => value),
                colors: "#18b7d8",
                borderColor: "#18b7d8",
                legend: false,
            });
            create(scheduleRef.current, {
                type: "bar",
                labels: ["Morning", "Afternoon", "Evening"],
                values: scheduleValues,
                colors: ["#f59e0b", "#2563eb", "#7c3aed"],
                legend: false,
            });
        }

        draw();
        return () => {
            mounted = false;
            chartRefs.current.forEach((chart) => chart?.destroy());
            chartRefs.current = [];
        };
    }, [analytics]);

    return (
        <section className="report-analytics-section">
            <div className="report-section-intro">
                <div>
                    <h2>Business Analytics</h2>
                    <p>Sales, payments, gallon movement, and scheduling activity.</p>
                </div>
            </div>
            <div className="report-analytics-grid">
                <PaymentMethodCard
                    data={paymentEntries}
                    hasData={hasPaymentData}
                    chartRef={paymentRef}
                />
                <ChartCard
                    title="Gallon Sales by Day"
                    hasData={hasGallonData}
                    emptyMessage="No gallons sold in this period."
                >
                    <canvas ref={gallonRef} />
                </ChartCard>
                <ChartCard
                    title="Scheduled Delivery Periods"
                    hasData={hasScheduleData}
                    emptyMessage="No scheduled deliveries in this period."
                >
                    <canvas ref={scheduleRef} />
                </ChartCard>
            </div>
        </section>
    );
}
