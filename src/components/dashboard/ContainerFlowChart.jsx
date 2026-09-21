import { useEffect, useState } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

const groups = [
    {
        title: "New / Borrowed / Exchange",
        items: [
            ["newContainers", "New", "#2563eb"],
            ["borrowed", "Borrowed", "#8b5cf6"],
            ["exchange", "Exchange", "#14b8a6"],
        ],
    },
    {
        title: "Returned / Damaged / Missing",
        items: [
            ["returned", "Returned", "#22c55e"],
            ["damaged", "Damaged", "#f59e0b"],
            ["missing", "Missing", "#ef4444"],
        ],
    },
];

export default function ContainerFlowChart({ stats = {}, period = "weekly" }) {
    const [activePeriod, setActivePeriod] = useState(period);

    useEffect(() => {
        setActivePeriod(period);
    }, [period]);

    return (
        <div className="container-flow-chart">
            <div className="container-flow-toolbar">
                <span>Container gallons</span>
                <div className="container-flow-period-toggle">
                    <button
                        type="button"
                        className={activePeriod === "weekly" ? "active" : ""}
                        onClick={() => setActivePeriod("weekly")}
                    >
                        Weekly
                    </button>
                    <button
                        type="button"
                        className={activePeriod === "monthly" ? "active" : ""}
                        onClick={() => setActivePeriod("monthly")}
                    >
                        Monthly
                    </button>
                </div>
            </div>

            <div className="container-flow-groups">
                {groups.map((group) => {
                    const values = group.items.map(([key]) => Number(stats?.[activePeriod]?.[key] || 0));
                    const total = values.reduce((sum, value) => sum + value, 0);
                    const chartData = {
                        labels: group.items.map(([, label]) => label),
                        datasets: [{
                            data: total ? values : [1],
                            backgroundColor: total ? group.items.map(([, , color]) => color) : ["#e5e7eb"],
                            borderWidth: 0,
                            hoverOffset: 5,
                        }],
                    };

                    return (
                        <div key={group.title} className="container-flow-group">
                            <div className="container-flow-group-header">{group.title}</div>
                            <div className="container-flow-content">
                                <div className="container-flow-doughnut">
                                    <Doughnut
                                        data={chartData}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            cutout: "48%",
                                            plugins: {
                                                legend: { display: false },
                                                tooltip: {
                                                    callbacks: {
                                                        label: (context) => `${context.label}: ${context.raw} gallons`,
                                                    },
                                                },
                                            },
                                        }}
                                    />
                                </div>
                                <div className="container-flow-legend">
                                    {group.items.map(([key, label, color], index) => (
                                        <div key={key}>
                                            <span><i style={{ backgroundColor: color }} />{label}</span>
                                            <strong>{total ? values[index] : 0}</strong>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}