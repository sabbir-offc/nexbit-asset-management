"use client";

import useSWR from "swr";
import Link from "next/link";
import { FileDown, Eye, Plus } from "lucide-react";

/* ---------- Types ---------- */
interface InvoiceItem {
  assetId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Invoice {
  _id: string;
  invoiceNumber: string;
  buyer: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  vat: number;
  grandTotal: number;
  paidAmount: number;
  returnedAmount: number;
  paymentMethod: string;
  notes?: string;
  createdAt: string;
}

const fetcher = async (url: string): Promise<Invoice[]> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch invoices");
  return res.json();
};

export default function InvoicesPage() {
  const { data: invoices = [] } = useSWR<Invoice[]>("/api/invoices", fetcher);

  return (
    <div className="space-y-8">
      {/* ===== Header ===== */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-strong)]">
            Invoices
          </h1>
          <p className="text-sm text-[var(--color-muted)]">
            View, download, or verify all generated invoices.
          </p>
        </div>
        <div>
          <Link href="/dashboard/invoices/new">
            <button className="flex items-center bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 transition">
              <Plus className="w-4 h-4 mr-1" />
              Create Invoice
            </button>
          </Link>
        </div>
      </div>

      {/* ===== Table Container ===== */}
      <div className="overflow-x-auto border border-[var(--color-border)] bg-[var(--color-card)] rounded-xl shadow-sm transition-colors">
        <table className="w-full text-sm">
          <thead className="bg-[color-mix(in srgb, var(--color-accent) 6%, transparent)]">
            <tr className="text-left text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
              <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wide">
                Invoice No
              </th>
              <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wide">
                Buyer
              </th>
              <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wide text-right">
                Grand Total
              </th>
              <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wide">
                Date
              </th>
              <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wide text-center">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {invoices.length > 0 ? (
              invoices.map((inv) => (
                <tr
                  key={inv._id}
                  className="border-b border-[var(--color-border)] hover:bg-[color-mix(in srgb, var(--color-accent) 6%, transparent)] transition-colors duration-150"
                >
                  <td className="px-5 py-3 font-medium text-[var(--color-text)]">
                    {inv.invoiceNumber}
                  </td>
                  <td className="px-5 py-3 text-[var(--color-text-soft)]">
                    {inv.buyer}
                  </td>
                  <td className="px-5 py-3 text-right font-medium text-[var(--color-text)]">
                    ৳ {inv.grandTotal.toFixed(2)}
                  </td>
                  <td className="px-5 py-3 text-[var(--color-text-soft)]">
                    {new Date(inv.createdAt).toLocaleDateString("en-GB")}
                  </td>
                  <td className="px-5 py-3 text-center flex justify-center gap-3">
                    <Link
                      href={`/invoices/${inv._id}`}
                      className="inline-flex items-center gap-1 text-[var(--color-accent)] hover:underline text-sm font-medium"
                    >
                      <Eye className="w-4 h-4" /> View
                    </Link>
                    <button
                      onClick={() =>
                        window.open(`/api/invoices/${inv._id}/pdf`, "_blank")
                      }
                      className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
                    >
                      <FileDown className="w-4 h-4" /> PDF
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="text-center text-[var(--color-muted)] py-8 italic"
                >
                  No invoices found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
