"use client";

import useSWR from "swr";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Package, FileText, ArrowRightLeft, DollarSign } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

/* ---------- Types ---------- */
interface Asset {
  _id: string;
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
}

interface Invoice {
  _id: string;
  buyer: string;
  grandTotal: number;
  createdAt: string;
}

interface Movement {
  _id: string;
  assetName: string;
  action: string;
  quantity: number;
  createdAt: string;
}

/* ---------- Fetcher ---------- */
const fetcher = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

export default function ReportsPage() {
  const { data: assets = [] } = useSWR<Asset[]>("/api/assets", fetcher);
  const { data: invoices = [] } = useSWR<Invoice[]>("/api/invoices", fetcher);
  const { data: movements = [] } = useSWR<Movement[]>(
    "/api/movements",
    fetcher
  );

  const totalValue = assets.reduce(
    (sum, a) => sum + a.quantity * a.unitPrice,
    0
  );
  const totalInvoices = invoices.length;
  const totalMovements = movements.length;

  // ===== Chart Data =====
  const monthlyData = invoices.reduce<Record<string, number>>((acc, inv) => {
    const month = new Date(inv.createdAt).toLocaleString("default", {
      month: "short",
    });
    acc[month] = (acc[month] || 0) + inv.grandTotal;
    return acc;
  }, {});

  const chartData = {
    labels: Object.keys(monthlyData),
    datasets: [
      {
        label: "Monthly Invoice Total (৳)",
        data: Object.values(monthlyData),
        backgroundColor: "#2563eb",
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "rgba(0,0,0,0.05)" },
        ticks: { color: "#666" },
      },
      x: {
        ticks: { color: "#666" },
      },
    },
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-strong)]">
        Reports & Analytics
      </h1>

      {/* ===== Summary Cards ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          icon={<Package className="w-6 h-6 text-blue-500" />}
          title="Total Assets"
          value={assets.length}
        />
        <SummaryCard
          icon={<FileText className="w-6 h-6 text-green-500" />}
          title="Total Invoices"
          value={totalInvoices}
        />
        <SummaryCard
          icon={<DollarSign className="w-6 h-6 text-amber-500" />}
          title="Stock Value"
          value={`৳ ${totalValue.toFixed(2)}`}
        />
        <SummaryCard
          icon={<ArrowRightLeft className="w-6 h-6 text-purple-500" />}
          title="Movements"
          value={totalMovements}
        />
      </div>

      {/* ===== Chart Section ===== */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4 text-[var(--color-text-strong)]">
          Monthly Invoice Overview
        </h2>
        {invoices.length > 0 ? (
          <Bar data={chartData} options={chartOptions} height={80} />
        ) : (
          <p className="text-gray-500 text-sm text-center py-6">
            No invoice data available yet
          </p>
        )}
      </div>
    </div>
  );
}

/* ---------- Reusable Summary Card ---------- */
function SummaryCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-4 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
        <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {value}
        </p>
      </div>
    </div>
  );
}
