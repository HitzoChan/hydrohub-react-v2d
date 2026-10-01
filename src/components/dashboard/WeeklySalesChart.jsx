import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";

import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Filler,
  Tooltip,
  Legend,
);

function WeeklySalesChart({ sales = [], monthlySales = [], period = "weekly", theme = "light" }) {
  const isDark = theme === "dark";
  const chartTextColor = isDark ? "#cbd5e1" : "#64748b";
  const chartGridColor = isDark
    ? "rgba(148, 163, 184, 0.2)"
    : "#edf2f7";
  const chartLineColor = isDark ? "#2dd4bf" : "#0f766e";

  /*
  |--------------------------------------------------------------------------
  | Prepare Weekly Sales Data
  |--------------------------------------------------------------------------
  |
  | getWeeklySales() returns:
  |
  | [
  |   Monday,
  |   Tuesday,
  |   Wednesday,
  |   Thursday,
  |   Friday,
  |   Saturday,
  |   Sunday
  | ]
  |
  | The values come directly from the orders table.
  |
  */

  const weeklySales = Array.from(
    { length: 7 },
    (_, index) => Number(sales?.[index] || 0)
  );

  const monthlyValues = Array.from(
    { length: 12 },
    (_, index) => Number(monthlySales?.[index] || 0)
  );
  const now = new Date();
  const currentMonthIndex = now.getMonth();
  const monthlyLabels = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(now.getFullYear(), currentMonthIndex + index, 1);
    return date.toLocaleDateString("en-US", { month: "short" });
  });
  const values = period === "weekly" ? weeklySales : monthlyValues;
  const labels = period === "weekly"
    ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    : monthlyLabels;
  const totalSales = values.reduce((sum, value) => sum + value, 0);

  /*
  |--------------------------------------------------------------------------
  | Chart Data
  |--------------------------------------------------------------------------
  */

  const data = {
    labels,

    datasets: [
      {
        label: "Revenue",
        data: values,
        borderColor: chartLineColor,
        borderWidth: 3,
        pointBackgroundColor: chartLineColor,
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.42,
        fill: true,
        backgroundColor: (context) => {
          const chart = context.chart;
          const { chartArea } = chart;

          if (!chartArea) {
            return isDark
              ? "rgba(45, 212, 191, 0.2)"
              : "rgba(15, 118, 110, 0.18)";
          }

          const gradient = chart.ctx.createLinearGradient(
            0,
            chartArea.top,
            0,
            chartArea.bottom
          );
          gradient.addColorStop(0, isDark ? "rgba(45, 212, 191, 0.46)" : "rgba(20, 184, 166, 0.72)");
          gradient.addColorStop(0.55, isDark ? "rgba(20, 184, 166, 0.24)" : "rgba(15, 118, 110, 0.34)");
          gradient.addColorStop(1, isDark ? "rgba(15, 118, 110, 0.02)" : "rgba(15, 118, 110, 0.04)");
          return gradient;
        },
      },
    ],
  };

  /*
  |--------------------------------------------------------------------------
  | Chart Options
  |--------------------------------------------------------------------------
  */

  const options = {
    responsive: true,

    maintainAspectRatio: false,

    layout: {
      padding: {
        top: 25,
        bottom: 5,
        left: 10,
        right: 10,
      },
    },

    animation: {
      duration: 800,
    },

    plugins: {

      legend: {
        display: false,
      },

      tooltip: {

        backgroundColor: "#1e293b",

        padding: 12,

        titleColor: "#fff",

        bodyColor: "#fff",

        callbacks: {

          label(context) {

            const value = Number(
              context.raw || 0
            );

            return `₱${value.toLocaleString(
              "en-PH",
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }
            )}`;

          },

        },

      },

    },

    scales: {

      x: {

        grid: {
          display: false,
        },

        ticks: {

          color: chartTextColor,

          autoSkip: false,
          maxRotation: 0,
          minRotation: 0,

          callback(value, index) {
            return labels[index];
          },

          font: {
            weight: "600",
          },

        },

      },

      y: {

        beginAtZero: true,

        ticks: {

          color: chartTextColor,

          callback(value) {

            return (
              "₱" +
              Number(value).toLocaleString(
                "en-PH",
                {
                  maximumFractionDigits: 0,
                }
              )
            );

          },

        },

        grid: {
          color: chartGridColor,
        },

      },

    },

  };

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (

    <div>

      {/* Weekly total */}

      <div
        className="d-flex justify-content-between align-items-center mb-2"
        style={{
          padding: "0 10px",
        }}
      >

        <div>

          <small
            className="text-muted"
            style={{
              fontSize: "12px",
            }}
          >
            Total Revenue This {period === "weekly" ? "Week" : "Year"}
          </small>

          <div
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: isDark ? "#f1f5f9" : "#1f2937",
            }}
          >
            ₱
            {totalSales.toLocaleString(
              "en-PH",
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }
            )}
          </div>

        </div>

      </div>

      {/* Chart */}

      <div
        style={{
          height: "250px",
          paddingTop: "10px",
        }}
      >

        <Line
          data={data}
          options={options}
        />

      </div>

    </div>

  );
}

export default WeeklySalesChart;