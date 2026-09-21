import { useEffect, useRef } from "react";

export default function OperationsOverview({
    operations = {},
    containerAccountability = {},
}) {
    const orderCanvasRef = useRef(null);
    const driverCanvasRef = useRef(null);
    const containerCanvasRef = useRef(null);
    const chartsRef = useRef([]);

    useEffect(() => {
        let mounted = true;

        async function renderCharts() {
            const ChartModule = await import("chart.js/auto");

            if (!mounted) {
                return;
            }

            const Chart = ChartModule.default;
            chartsRef.current.forEach((chart) => chart?.destroy());
            chartsRef.current = [];

            const statusCounts = operations.statusCounts || {};
            const statusLabels = Object.keys(statusCounts);
            const drivers = operations.drivers || [];

            const configs = [
                {
                    canvas: orderCanvasRef.current,
                    type: "bar",
                    labels: statusLabels,
                    label: "Orders",
                    values: statusLabels.map((status) => statusCounts[status]),
                    color: "#2563eb",
                },
                {
                    canvas: driverCanvasRef.current,
                    type: "bar",
                    labels: drivers.map((driver) => driver.driverName),
                    label: "Completed Deliveries",
                    values: drivers.map((driver) => driver.deliveries),
                    color: "#10b981",
                },
                {
                    canvas: containerCanvasRef.current,
                    type: "bar",
                    labels: ["Returned", "Damaged", "Missing", "Borrowed"],
                    label: "Containers",
                    values: [
                        containerAccountability.returned || 0,
                        containerAccountability.damaged || 0,
                        containerAccountability.missing || 0,
                        containerAccountability.borrowed || 0,
                    ],
                    color: ["#10b981", "#f59e0b", "#ef4444", "#7c3aed"],
                },
            ];

            configs.forEach((config) => {
                if (!config.canvas || config.labels.length === 0) {
                    return;
                }

                chartsRef.current.push(new Chart(config.canvas, {
                    type: config.type,
                    data: {
                        labels: config.labels,
                        datasets: [{
                            label: config.label,
                            data: config.values,
                            backgroundColor: config.color,
                            borderRadius: 6,
                            borderSkipped: false,
                        }],
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: { precision: 0 },
                                grid: { color: "#eef2f7" },
                            },
                            x: {
                                grid: { display: false },
                            },
                        },
                    },
                }));
            });
        }

        renderCharts();

        return () => {
            mounted = false;
            chartsRef.current.forEach((chart) => chart?.destroy());
            chartsRef.current = [];
        };
    }, [operations, containerAccountability]);

    return (
        <section className="report-operations-section">
            <div className="report-section-intro">
                <div>
                    <h2>Operations Overview</h2>
                    <p>Orders, driver performance, and container accountability.</p>
                </div>
                <span>{operations.totalOrders || 0} orders in this period</span>
            </div>

            <div className="report-operations-grid">
                <div className="report-operation-chart">
                    <h3>Deliveries by Driver</h3>
                    <div className="report-operation-canvas">
                        {(operations.drivers || []).length > 0
                            ? <canvas ref={driverCanvasRef} />
                            : <span>No completed driver deliveries.</span>}
                    </div>
                </div>

                <div className="report-operation-chart">
                    <h3>Container Accountability</h3>
                    <div className="report-operation-canvas">
                        <canvas ref={containerCanvasRef} />
                    </div>
                </div>
            </div>
        </section>
    );
}
