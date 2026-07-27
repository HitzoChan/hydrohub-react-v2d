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
}) {
  const total =
    delivered +
    pending +
    scheduled +
    cancelled;

  const data = {
    labels: [
      "Delivered",
      "Pending",
      "Scheduled",
      "Cancelled",
    ],

    datasets: [
      {
        data:
          total === 0
            ? [1]
            : [
                delivered,
                pending,
                scheduled,
                cancelled,
              ],

        backgroundColor:
          total === 0
            ? ["#e5e7eb"]
            : [
                "#22c55e",
                "#f59e0b",
                "#3b82f6",
                "#ef4444",
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
              color: "#6b7280",
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
          width: "180px",
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

          <strong
            style={{
              fontSize: "14px",
            }}
          >
            {delivered}
          </strong>
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

          <strong
            style={{
              fontSize: "14px",
            }}
          >
            {pending}
          </strong>
        </div>

        <div className="d-flex justify-content-between align-items-center mb-2">
          <span
            style={{
              color: "#3b82f6",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            ● Scheduled
          </span>

          <strong
            style={{
              fontSize: "14px",
            }}
          >
            {scheduled}
          </strong>
        </div>

        <div className="d-flex justify-content-between align-items-center">
          <span
            style={{
              color: "#ef4444",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            ● Cancelled
          </span>

          <strong
            style={{
              fontSize: "14px",
            }}
          >
            {cancelled}
          </strong>
        </div>
      </div>
    </div>
  );
}

export default TodayDeliveriesChart;