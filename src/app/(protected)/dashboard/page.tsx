"use client";

import useSWR from "swr";

/* ---------- Types ---------- */
interface Asset {
  _id: string;
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
  supplier?: string;
  status?: string;
}

interface Invoice {
  _id: string;
  invoiceNumber: string;
  buyer: string;
  grandTotal: number;
  createdAt: string;
}

/* ---------- Fetcher ---------- */
const fetcher = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

export default function Dashboard() {
  const { data: assets = [] } = useSWR<Asset[]>("/api/assets", fetcher);
  const { data: invoices = [] } = useSWR<Invoice[]>("/api/invoices", fetcher);

  // ---------- Calculations ----------
  const totalStock = assets.reduce((t, a) => t + a.quantity, 0);
  const totalValue = assets.reduce((t, a) => t + a.quantity * a.unitPrice, 0);
  const totalInvoices = invoices.length;

  const stats = [
    {
      title: "Total Assets",
      value: assets.length,
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "Total Stock",
      value: totalStock,
      color: "from-sky-500 to-sky-600",
    },
    {
      title: "Stock Value",
      value: `৳ ${totalValue.toFixed(2)}`,
      color: "from-indigo-500 to-indigo-600",
    },
  ];

  // ---------- UI ----------
  return (
    <div className="space-y-8 transition-colors duration-300">
      {/* ===== Header ===== */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          Company asset overview and invoice summary
        </p>
      </div>

      {/* ===== Stat Cards ===== */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm hover:shadow-md transition-all duration-300 group"
          >
            <div
              className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${stat.color}`}
            />
            <div className="p-6">
              <h2 className="text-sm font-medium text-[var(--color-muted)]">
                {stat.title}
              </h2>
              <p className="mt-2 text-2xl font-semibold text-[var(--color-foreground)]">
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ===== Invoice Section ===== */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Total Invoices</h2>
          <a
            href="/dashboard/invoices"
            className="text-sm text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] font-medium"
          >
            View all →
          </a>
        </div>
        <p className="text-3xl font-bold text-[var(--color-foreground)]">
          {totalInvoices}
        </p>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          Invoices generated till today
        </p>
      </div>
    </div>
  );
}
