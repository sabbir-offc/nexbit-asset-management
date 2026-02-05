"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import QRCode from "qrcode";
import Image from "next/image";
import { toast } from "react-hot-toast";

/* ---------- Types ---------- */
interface InvoiceItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Invoice {
  _id: string;
  invoiceNumber: string;
  type: "sale" | "purchase";
  buyer?: string;
  seller?: string;
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

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const isPrint = searchParams.get("print") === "1";

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/invoices/${id}`);
      if (!res.ok) {
        toast.error("Invoice not found");
        return;
      }

      const inv: Invoice = await res.json();
      setInvoice(inv);

      const origin =
        typeof window !== "undefined" && window.location.origin
          ? window.location.origin
          : process.env.NEXT_PUBLIC_BASE_URL || "https://yourdomain.com";

      const verifyUrl = `${origin}/verify/${inv.invoiceNumber}`;
      const url = await QRCode.toDataURL(verifyUrl);
      setQrDataUrl(url);
    }
    load();
  }, [id]);

  if (!invoice)
    return (
      <p className="text-center text-[var(--color-muted)] py-10">
        Loading invoice...
      </p>
    );

  const {
    invoiceNumber,
    type,
    buyer,
    seller,
    items,
    subtotal,
    discount,
    vat,
    grandTotal,
    paidAmount,
    returnedAmount,
    paymentMethod,
    notes,
    createdAt,
  } = invoice;

  const companyName = process.env.NEXT_PUBLIC_COMPANY_NAME;
  const companyAddress =
    "Level 6, House 35, Gausul Azam Ave, Sector 14, Uttara, Dhaka - 1230";
  const companyLogo =
    process.env.COMPANY_LOGO ||
    "https://res.cloudinary.com/dub59giiq/image/upload/v1760741463/logo_uqti5m.png";

  const baseClasses = isPrint
    ? "max-w-4xl mx-auto bg-white text-black p-10 border border-gray-200 shadow-none"
    : "max-w-4xl mx-auto bg-white dark:bg-neutral-900 rounded-xl shadow-md border border-gray-100 dark:border-neutral-700 transition-all duration-300";

  const counterpartLabel = type === "sale" ? "Bill To" : "Supplier / Seller";
  const counterpartValue = type === "sale" ? buyer : seller;
  const titleColor =
    type === "purchase"
      ? "text-green-600 dark:text-green-400"
      : "text-blue-600 dark:text-blue-400";

  return (
    <div
      className={`${
        isPrint
          ? "bg-white text-black"
          : "bg-[var(--color-bg)] text-[var(--color-text)]"
      } min-h-screen py-6`}
    >
      {/* Header - hide in print */}
      {!isPrint && (
        <div className="flex justify-between items-center mb-6 max-w-4xl mx-auto">
          <h1 className="text-2xl font-semibold text-[var(--color-text-strong)] tracking-tight">
            {type === "sale" ? "Sale Invoice" : "Purchase Invoice"} Details
          </h1>
          <button
            onClick={() => window.open(`/api/invoices/${id}/pdf`, "_blank")}
            className="px-4 py-2 rounded-md bg-[var(--color-accent)] text-white font-medium text-sm hover:opacity-90 transition-all"
          >
            Download PDF
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className={baseClasses}>
        {/* ===== Header Section ===== */}
        <div
          className={`flex justify-between items-center ${
            isPrint
              ? "pb-4 mb-4 border-b border-gray-300"
              : "p-8 border-b border-gray-100 dark:border-neutral-700"
          }`}
        >
          <div className="flex items-center gap-4">
            <Image
              src={companyLogo}
              alt="Company Logo"
              width={64}
              height={64}
              className="rounded-md object-contain"
            />
            <div>
              <h2 className={`text-2xl font-bold leading-tight ${titleColor}`}>
                {companyName}
              </h2>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-0.5">
                <p>{companyAddress}</p>
                <p>Phone: +880 1711-778126</p>
                <p>Email: info@nexbitltd.com</p>
              </div>
            </div>
          </div>
          {qrDataUrl && (
            <Image
              src={qrDataUrl}
              alt="QR Code"
              width={80}
              height={80}
              className="rounded-md border border-gray-300 dark:border-neutral-700 shadow-sm"
            />
          )}
        </div>

        {/* ===== Meta Info ===== */}
        <div
          className={`grid grid-cols-1 md:grid-cols-2 gap-8 ${
            isPrint
              ? "pb-4 mb-4 border-b border-gray-300"
              : "p-8 border-b border-gray-100 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800/60"
          }`}
        >
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1">
              Invoice Info
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>No:</strong> {invoiceNumber}
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Date:</strong>{" "}
              {new Date(createdAt).toLocaleDateString("en-GB")}
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Type:</strong> {type === "sale" ? "Sale" : "Purchase"}
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Payment:</strong> {paymentMethod}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1">
              {counterpartLabel}
            </h3>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
              {counterpartValue || "-"}
            </p>
            {notes && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 italic">
                {notes}
              </p>
            )}
          </div>
        </div>

        {/* ===== Items Table ===== */}
        <div className={`${isPrint ? "py-4" : "p-8"} overflow-x-auto`}>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 uppercase text-xs border-b border-gray-200 dark:border-neutral-700">
                <th className="py-3 px-4 text-left font-semibold">Item</th>
                <th className="py-3 px-4 text-right font-semibold">Qty</th>
                <th className="py-3 px-4 text-right font-semibold">
                  Unit Price
                </th>
                <th className="py-3 px-4 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i, idx) => (
                <tr
                  key={idx}
                  className="border-b border-gray-100 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800/60 transition-colors"
                >
                  <td className="py-3 px-4 text-gray-800 dark:text-gray-200">
                    {i.name}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                    {i.quantity}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                    ৳ {i.unitPrice.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-gray-900 dark:text-gray-100">
                    ৳ {i.total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ===== Totals Section ===== */}
        <div
          className={`${
            isPrint
              ? "border-t border-gray-300 bg-white pt-4"
              : "px-8 pb-8 border-t border-gray-100 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800/60"
          }`}
        >
          <div className="flex flex-col items-end text-sm mt-4 space-y-1.5">
            <div className="flex justify-between w-64">
              <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                ৳ {subtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between w-64">
              <span className="text-gray-600 dark:text-gray-400">Discount</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                ৳ {discount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between w-64">
              <span className="text-gray-600 dark:text-gray-400">VAT</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {vat.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between w-64 border-t border-gray-400 dark:border-neutral-600 pt-2 mt-1">
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                Grand Total
              </span>
              <span className={`font-bold ${titleColor}`}>
                ৳ {grandTotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between w-64">
              <span className="text-gray-600 dark:text-gray-400">Paid</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                ৳ {paidAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between w-64">
              <span className="text-gray-600 dark:text-gray-400">Return</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                ৳ {returnedAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* ===== Footer ===== */}
        <div
          className={`text-center ${
            isPrint
              ? "bg-white border-t border-gray-300 pt-6"
              : "p-8 bg-gray-100 dark:bg-neutral-800 border-t border-gray-100 dark:border-neutral-700"
          }`}
        >
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {type === "sale"
              ? "Thank you for your business."
              : "Thank you for your purchase record."}
          </p>
          <div className="mt-6 flex justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                ______________________________
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Prepared By
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                ______________________________
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Authorized Signature
              </p>
            </div>
          </div>
          <p className="mt-6 text-xs text-gray-500 dark:text-gray-400">
            This is a system-generated {type} invoice. Verify using the QR code
            above.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} {companyName}. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
