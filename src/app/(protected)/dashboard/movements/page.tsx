"use client";

import useSWR from "swr";
import Link from "next/link";

/* ---------- Types ---------- */
interface Movement {
  referenceInvoice: string;
  _id: string;
  assetId: string;
  assetName: string;
  action: string;
  type: "sale" | "purchase" | "adjustment";
  quantity: number;
  invoiceNumber?: string;
  partyName?: string;
  remarks?: string;
  createdAt: string;
}

const fetcher = async (url: string): Promise<Movement[]> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch movements");
  return res.json();
};

export default function MovementsPage() {
  const { data: movements = [] } = useSWR<Movement[]>(
    "/api/movements",
    fetcher
  );

  return (
    <div className="space-y-8 transition-colors duration-300">
      <div>
        <h1 className="text-2xl font-bold">Stock Movements</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Every addition, sale, purchase, or adjustment to company assets is
          tracked below.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-[color-mix(in srgb, var(--color-accent) 5%, transparent)]">
            <tr className="text-left text-[var(--color-muted)] border-b border-[var(--color-border)]">
              <th className="px-4 py-2 font-medium">Asset Name</th>
              <th className="px-4 py-2 font-medium">Action</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Party</th>
              <th className="px-4 py-2 font-medium">Invoice</th>
              <th className="px-4 py-2 font-medium text-right">Quantity</th>
              <th className="px-4 py-2 font-medium">Remarks</th>
              <th className="px-4 py-2 font-medium">Date</th>
            </tr>
          </thead>

          <tbody>
            {movements.length > 0 ? (
              movements.map((m) => (
                <tr
                  key={m._id}
                  className="border-b border-[var(--color-border)] hover:bg-[color-mix(in srgb, var(--color-accent) 5%, transparent)] transition"
                >
                  <td className="px-4 py-2 font-medium">{m.assetName}</td>

                  {/* ---------- Action Badge ---------- */}
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        m.action === "purchased"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                          : m.action === "sold"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                          : m.action === "lost"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                          : m.action === "under_repair"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      }`}
                    >
                      {m.action}
                    </span>
                  </td>

                  {/* ---------- Type Badge ---------- */}
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        m.type === "sale"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                          : m.type === "purchase"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      }`}
                    >
                      {m.type}
                    </span>
                  </td>

                  {/* ---------- Party Name ---------- */}
                  <td className="px-4 py-2 text-[var(--color-text)]">
                    {m.partyName || "-"}
                  </td>

                  {/* ---------- Invoice Link ---------- */}
                  <td className="px-4 py-2">
                    {m.invoiceNumber ? (
                      <Link
                        href={`/invoices/${m.referenceInvoice ?? ""}`}
                        className="text-[var(--color-accent)] hover:underline"
                      >
                        {m.invoiceNumber}
                      </Link>
                    ) : (
                      "-"
                    )}
                  </td>

                  {/* ---------- Quantity ---------- */}
                  <td className="px-4 py-2 text-right font-medium text-[var(--color-text)]">
                    {m.quantity}
                  </td>

                  {/* ---------- Remarks ---------- */}
                  <td className="px-4 py-2 text-[var(--color-muted)] max-w-xs truncate">
                    {m.remarks || "-"}
                  </td>

                  {/* ---------- Date ---------- */}
                  <td className="px-4 py-2 text-[var(--color-muted)] whitespace-nowrap">
                    {new Date(m.createdAt).toLocaleString("en-BD", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={8}
                  className="text-center text-[var(--color-muted)] py-6"
                >
                  No movements logged yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
