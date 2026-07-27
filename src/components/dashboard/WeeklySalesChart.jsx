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

function WeeklySalesChart({ sales }) {
  const data = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],

    datasets: [
      {
        label: "Revenue",

        data: sales,

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

  const options = {
    responsive: true,

    maintainAspectRatio: false,

    layout: {
        padding: {
            top: 10,
            bottom: 5,
            left: 10,
            right: 10,
        },
    },

    animation: {
      duration: 1200,
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
            return `₱${context.raw.toLocaleString()}`;
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
          return "₱" + value.toLocaleString();
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
            return "₱" + value;
          },
        },

        grid: {
          color: "#edf2f7",
        },
      },
    },
  };

  return (
    <div style={{ height: "280px", paddingTop: "20px" }}>
      <Bar data={data} options={options} />
    </div>
  );
}

export default WeeklySalesChart;