import { useEffect, useRef } from "react";

function ChartCard({ title, children }) {
    return (
        <section className="report-analytics-card">
            <h3>{title}</h3>
            <div className="report-analytics-canvas">{children}</div>
        </section>
    );
}

export default function ReportAnalytics({
    analytics = {},
    deliveryTypes = [],
}) {
    const orderRef = useRef(null);
    const paymentRef = useRef(null);
    const gallonRef = useRef(null);
    const scheduleRef = useRef(null);
    const chartRefs = useRef([]);

    useEffect(() => {
        let mounted = true;

        async function draw() {
            const module = await import("chart.js/auto");
            if (!mounted) return;

            chartRefs.current.forEach((chart) => chart?.destroy());
            chartRefs.current = [];
            const Chart = module.default;
            const status = analytics.statusCounts || {};
            const statusLabels = Object.keys(status);
            const payment = analytics.paymentMethods || {};
            const gallonEntries = Object.entries(analytics.gallonsByDate || {});
            const schedule = analytics.scheduling || {};

            const create = (canvas, config) => {
                if (!canvas || config.labels.length === 0) return;

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

            create(orderRef.current, {
                type: "doughnut",
                labels: statusLabels,
                values: statusLabels.map((label) => status[label]),
                colors: ["#16a36a", "#f59e0b", "#2563eb", "#7c3aed", "#dc3545"],
            });
            create(paymentRef.current, {
                type: "doughnut",
                labels: Object.keys(payment),
                values: Object.values(payment),
                colors: ["#2563eb", "#18b7d8", "#f59e0b", "#94a3b8"],
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
                values: [schedule.morning || 0, schedule.afternoon || 0, schedule.evening || 0],
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
                <ChartCard title="Order Status"><canvas ref={orderRef} /></ChartCard>
                <ChartCard title="Payment Methods"><canvas ref={paymentRef} /></ChartCard>
                <ChartCard title="Gallon Sales by Day"><canvas ref={gallonRef} /></ChartCard>
                <ChartCard title="Scheduled Delivery Periods"><canvas ref={scheduleRef} /></ChartCard>
            </div>
            <div className="report-analytics-summary" aria-label="Report quick metrics">
                <div className="report-quick-metric">
                    <i className="bi bi-receipt-cutoff" aria-hidden="true" />
                    <span>Average order value</span>
                    <strong>₱{Number(analytics.averageOrderValue || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</strong>
                </div>
                <div className="report-quick-metric">
                    <i className="bi bi-droplet-half" aria-hidden="true" />
                    <span>Average gallons per order</span>
                    <strong>{Number(analytics.averageGallonsPerOrder || 0).toFixed(1)}</strong>
                </div>
                <div className="report-quick-metric attention">
                    <i className="bi bi-person-exclamation" aria-hidden="true" />
                    <span>Unassigned deliveries</span>
                    <strong>{analytics.delivery?.unassigned || 0}</strong>
                </div>
            </div>
            {deliveryTypes.length > 0 && (
                <div className="report-type-summary" aria-label="Delivery type summary">
                    <span className="report-type-summary-label">Delivery types</span>
                    {deliveryTypes.map((type) => <span key={type.type}>{type.type}: <strong>{type.count}</strong></span>)}
                </div>
            )}
        </section>
    );
}
