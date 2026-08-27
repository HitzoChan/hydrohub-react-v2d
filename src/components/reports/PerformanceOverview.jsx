import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

export default function PerformanceOverview({
    data = [],
}) {
    const [view, setView] = useState("monthly");

    const chartData = useMemo(() => {
        const grouped = new Map();
        const sortedData = [...data].sort((first, second) =>
            String(first.date).localeCompare(String(second.date))
        );

        sortedData.forEach((item, index) => {
            const date = new Date(`${item.date}T00:00:00`);
            const month = date.toLocaleDateString("en-PH", { month: "short" });
            const year = date.getFullYear();
            const week = Math.floor(index / 7) + 1;
            const key = view === "yearly"
                ? `${year}-${date.getMonth()}`
                : view === "weekly"
                    ? `week-${week}`
                    : item.date;
            const label = view === "yearly"
                ? `${month} ${year}`
                : view === "weekly"
                    ? `Week ${week}`
                    : item.label;
            const current = grouped.get(key) || {
                label,
                revenue: 0,
                expenses: 0,
                profit: 0,
            };

            current.revenue += Number(item.revenue) || 0;
            current.expenses += Number(item.expenses) || 0;
            current.profit += Number(item.profit) || 0;
            grouped.set(key, current);
        });

        return Array.from(grouped.values());
    }, [data, view]);
    const canvasRef =
        useRef(null);

    const chartRef =
        useRef(null);

    useEffect(() => {
        let mounted = true;

        async function renderChart() {
            const ChartModule =
                await import("chart.js/auto");

            if (!mounted) {
                return;
            }

            const Chart =
                ChartModule.default;

            if (!canvasRef.current) {
                return;
            }

            if (chartRef.current) {
                chartRef.current.destroy();
            }

            const context =
                canvasRef.current.getContext(
                    "2d"
                );

            const revenueGradient =
                context.createLinearGradient(
                    0,
                    0,
                    0,
                    360
                );

            revenueGradient.addColorStop(
                0,
                "rgba(37, 99, 235, 0.24)"
            );

            revenueGradient.addColorStop(
                1,
                "rgba(37, 99, 235, 0.02)"
            );

            const expenseGradient =
                context.createLinearGradient(
                    0,
                    0,
                    0,
                    360
                );

            expenseGradient.addColorStop(
                0,
                "rgba(239, 68, 68, 0.18)"
            );

            expenseGradient.addColorStop(
                1,
                "rgba(239, 68, 68, 0.02)"
            );

            const profitGradient =
                context.createLinearGradient(
                    0,
                    0,
                    0,
                    360
                );

            profitGradient.addColorStop(
                0,
                "rgba(245, 158, 11, 0.16)"
            );

            profitGradient.addColorStop(
                1,
                "rgba(245, 158, 11, 0.02)"
            );

            chartRef.current =
                new Chart(context, {
                    type: "line",

                    data: {
                        labels: chartData.map(
                            (item) =>
                                item.label
                        ),

                        datasets: [
                            {
                                label: "Revenue",

                                data: chartData.map(
                                    (item) =>
                                        Number(
                                            item.revenue
                                        ) || 0
                                ),

                                borderColor: "#2563eb",

                                backgroundColor:
                                    revenueGradient,

                                borderWidth: 3,

                                tension: 0.35,

                                fill: true,

                                pointRadius: 4,

                                pointHoverRadius: 5,

                                pointBackgroundColor: "#2563eb",

                                pointBorderColor: "#ffffff",

                                pointBorderWidth: 2,
                            },

                            {
                                label: "Expenses",

                                data: chartData.map(
                                    (item) =>
                                        Number(
                                            item.expenses
                                        ) || 0
                                ),

                                borderColor: "#ef4444",

                                backgroundColor:
                                    expenseGradient,

                                borderWidth: 3,

                                tension: 0.35,

                                fill: true,

                                pointRadius: 4,

                                pointHoverRadius: 5,

                                pointBackgroundColor: "#ef4444",

                                pointBorderColor: "#ffffff",

                                pointBorderWidth: 2,
                            },

                            {
                                label: "Net Profit",

                                data: chartData.map(
                                    (item) =>
                                        Number(
                                            item.profit
                                        ) || 0
                                ),

                                borderColor: "#f59e0b",

                                backgroundColor:
                                    profitGradient,

                                borderWidth: 3,

                                tension: 0.35,

                                fill: true,

                                pointRadius: 4,

                                pointHoverRadius: 5,

                                pointBackgroundColor: "#f59e0b",

                                pointBorderColor: "#ffffff",

                                pointBorderWidth: 2,
                            },
                        ],
                    },

                    options: {
                        responsive: true,

                        maintainAspectRatio: false,

                        interaction: {
                            mode: "index",

                            intersect: false,
                        },

                        plugins: {
                            datalabels: {
                                display: false,
                            },

                            legend: {
                                position: "top",

                                labels: {
                                    usePointStyle: true,

                                    boxWidth: 8,

                                    padding: 18,

                                    font: {
                                        size: 12,
                                    },
                                },
                            },

                            tooltip: {
                                callbacks: {
                                    label(
                                        context
                                    ) {
                                        const value =
                                            Number(
                                                context.raw
                                            ) || 0;

                                        return `${context.dataset.label}: ₱${value.toLocaleString(
                                            "en-PH",
                                            {
                                                minimumFractionDigits: 2,
                                            }
                                        )}`;
                                    },
                                },
                            },
                        },

                        scales: {
                            y: {
                                beginAtZero: true,

                                grid: {
                                    color: "#e8edf3",

                                    borderDash: [
                                        4,
                                        5,
                                    ],
                                },

                                ticks: {
                                    maxTicksLimit: 6,

                                    autoSkip: true,

                                    padding: 5,

                                    font: {
                                        size: 11,
                                    },

                                    callback(value) {
                                        return `₱${Number(
                                            value
                                        ).toLocaleString(
                                            "en-PH"
                                        )}`;
                                    },
                                },
                            },

                            x: {
                                grid: {
                                    color: "rgba(232, 237, 243, 0.65)",
                                },

                                ticks: {
                                    autoSkip: true,

                                    maxTicksLimit: 6,

                                    maxRotation: 0,

                                    minRotation: 0,

                                    font: {
                                        size: 11,
                                    },
                                },
                            },
                        },
                    },
                });
        }

        renderChart();

        return () => {
            mounted = false;

            if (chartRef.current) {
                chartRef.current.destroy();

                chartRef.current = null;
            }
        };
    }, [chartData]);

    return (
        <div className="card report-chart-card mb-4">

            <div className="report-section-header">

                <div>
                    <div className="report-chart-title-row">
                        <h5>
                            Performance Overview
                        </h5>

                        <div className="report-chart-view-switcher">
                            {["weekly", "monthly", "yearly"].map((option) => (
                                <button
                                    type="button"
                                    key={option}
                                    className={view === option ? "active" : ""}
                                    onClick={() => setView(option)}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>

                    <p>
                        Revenue, expenses, and net
                        profit over the selected period.
                    </p>
                </div>

            </div>

            <div className="report-chart-container">

                {chartData.length === 0 ? (
                    <div className="report-empty-state">
                        No financial data available
                        for this period.
                    </div>
                ) : (
                    <canvas
                        ref={canvasRef}
                    />
                )}

            </div>

        </div>
    );
}