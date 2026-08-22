import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

import ChartDataLabels from "chartjs-plugin-datalabels";

import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  ChartDataLabels
);

function WeeklySalesChart({ sales = [] }) {

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

  const totalWeeklySales = weeklySales.reduce(
    (sum, value) => sum + value,
    0
  );

  /*
  |--------------------------------------------------------------------------
  | Chart Data
  |--------------------------------------------------------------------------
  */

  const data = {
    labels: [
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
      "Sun",
    ],

    datasets: [
      {
        label: "Revenue",

        data: weeklySales,

        backgroundColor: [
          "#2563eb",
          "#3b82f6",
          "#60a5fa",
          "#2563eb",
          "#3b82f6",
          "#60a5fa",
          "#2563eb",
        ],

        borderRadius: 12,

        borderSkipped: false,

        maxBarThickness: 42,
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

      datalabels: {

        anchor: "end",

        align: "top",

        color: "#2563eb",

        font: {
          weight: "bold",
          size: 11,
        },

        formatter(value) {

          if (!value || value <= 0) {
            return "";
          }

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

    },

    scales: {

      x: {

        grid: {
          display: false,
        },

        ticks: {

          color: "#64748b",

          font: {
            weight: "600",
          },

        },

      },

      y: {

        beginAtZero: true,

        ticks: {

          color: "#64748b",

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
          color: "#edf2f7",
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
            Total Revenue This Week
          </small>

          <div
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "#1f2937",
            }}
          >
            ₱
            {totalWeeklySales.toLocaleString(
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

        <Bar
          data={data}
          options={options}
        />

      </div>

    </div>

  );
}

export default WeeklySalesChart;