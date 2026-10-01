import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

import { Pie } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

function TodayDeliveriesChart({
  delivered = 0,
  pending = 0,
  scheduled = 0,
  cancelled = 0,
  rejected = 0,
  theme = "light",
}) {
  const isDark = theme === "dark";
  const pendingTotal = pending + scheduled;
  const total =
    delivered +
    pendingTotal +
    cancelled +
    rejected;

  const data = {
    labels: [
      "Delivered",
      "Pending",
      "Cancelled",
      "Rejected",
    ],

    datasets: [
      {
        data:
          total === 0
            ? [1]
            : [
                delivered,
                pendingTotal,
                cancelled,
                rejected,
              ],

        backgroundColor:
          total === 0
            ? [isDark ? "#334155" : "#e5e7eb"]
            : [
                "#22c55e", // Delivered
                "#f59e0b", // Pending
                "#ef4444", // Cancelled
                "#8b5cf6", // Rejected
              ],

        borderWidth: 0,
        hoverOffset: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
      legend: {
        display: false,
      },

      tooltip: {
        callbacks: {
          label: (context) => {
            if (total === 0) {
              return "No deliveries";
            }

            return `${context.label}: ${context.raw}`;
          },
        },
      },
    },
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{
        height: "220px",
        gap: "22px",
        marginTop: "18px",
      }}
    >
      {/* Pie Chart */}
      <div
        style={{
          width: "145px",
          height: "145px",
          position: "relative",
        }}
      >
        <Pie
          data={data}
          options={options}
        />

        {total === 0 && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              fontSize: "12px",
              color: isDark ? "#cbd5e1" : "#6b7280",
              textAlign: "center",
              width: "80px",
              lineHeight: "16px",
              fontWeight: 500,
            }}
          >
            No deliveries
          </div>
        )}
      </div>

      {/* Legend */}
      <div
        style={{
          width: "190px",
        }}
      >
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span
            style={{
              color: "#22c55e",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            ● Delivered
          </span>

          <strong>{delivered}</strong>
        </div>

        <div className="d-flex justify-content-between align-items-center mb-2">
          <span
            style={{
              color: "#f59e0b",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            ● Pending
          </span>

          <strong>{pendingTotal}</strong>
        </div>

        <div className="d-flex justify-content-between align-items-center mb-2">
          <span
            style={{
              color: "#ef4444",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            ● Cancelled
          </span>

          <strong>{cancelled}</strong>
        </div>

        <div className="d-flex justify-content-between align-items-center">
          <span
            style={{
              color: "#8b5cf6",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            ● Rejected
          </span>

          <strong>{rejected}</strong>
        </div>
      </div>
    </div>
  );
}

export default TodayDeliveriesChart;