"use client";

import { useState } from "react";
import useSWR from "swr";
import { toast } from "react-hot-toast";
import { Trash2 } from "lucide-react";

/* ---------- Types ---------- */
interface Asset {
  _id: string;
  name: string;
  category: string;
  unitPrice: number;
  quantity: number;
}

interface InvoiceItem {
  assetId: string;
  name: string;
  available: number;
  quantity: number;
  unitPrice: number;
  total: number;
}

const fetcher = async (url: string): Promise<Asset[]> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch assets");
  return res.json();
};

export default function NewInvoicePage() {
  const { data: assets = [] } = useSWR<Asset[]>("/api/assets", fetcher);

  /* ---------- Form States ---------- */
  const [type, setType] = useState<"sale" | "purchase">("sale");
  const [buyer, setBuyer] = useState("");
  const [seller, setSeller] = useState("");
  const [discount, setDiscount] = useState(0);
  const [vat, setVat] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([]);

  /* ---------- Add Item ---------- */
  function addItem(asset: Asset) {
    if (items.find((i) => i.assetId === asset._id))
      return toast.error("Item already added");

    if (type === "sale" && asset.quantity <= 0)
      return toast.error(`No stock available for ${asset.name}`);

    setItems([
      ...items,
      {
        assetId: asset._id,
        name: asset.name,
        available: asset.quantity,
        quantity: 1,
        unitPrice: asset.unitPrice,
        total: asset.unitPrice,
      },
    ]);
  }

  /* ---------- Update Item ---------- */
  function updateItem(index: number, field: keyof InvoiceItem, value: number) {
    const updated = [...items];
    const item = updated[index];

    if (field === "quantity") {
      if (type === "sale" && value > item.available) {
        toast.error(`Only ${item.available} pcs available for ${item.name}`);
        value = item.available;
      }
      if (value < 1) value = 1;
    }

    if (field === "quantity" || field === "unitPrice") {
      updated[index][field] = value;
    }

    updated[index].total = updated[index].quantity * updated[index].unitPrice;
    setItems(updated);
  }

  /* ---------- Remove Item ---------- */
  function removeItem(index: number) {
    const updated = [...items];
    updated.splice(index, 1);
    setItems(updated);
  }

  /* ---------- Calculations ---------- */
  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const vatAmount = (subtotal * vat) / 100;
  const grandTotal = subtotal - discount + vatAmount;
  const returnedAmount = paidAmount - grandTotal;

  /* ---------- Submit ---------- */
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Validation
    if (type === "sale" && !buyer.trim())
      return toast.error("Enter buyer name");
    if (type === "purchase" && !seller.trim())
      return toast.error("Enter seller name");
    if (items.length === 0) return toast.error("Add at least one item");

    const body = {
      type,
      buyer: type === "sale" ? buyer : undefined,
      seller: type === "purchase" ? seller : undefined,
      items,
      subtotal,
      discount,
      vat,
      grandTotal,
      paidAmount,
      returnedAmount,
      paymentMethod,
      notes,
    };

    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      toast.success(`${type === "sale" ? "Sale" : "Purchase"} invoice created`);
      // Reset
      setItems([]);
      setBuyer("");
      setSeller("");
      setNotes("");
    } else {
      const err = await res.json();
      toast.error(err.error || "Error creating invoice");
    }
  }

  /* ---------- UI ---------- */
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">New Invoice</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Create a sale or purchase invoice with automatic stock adjustment.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 border border-[var(--color-border)] bg-[var(--color-card)] p-6 rounded-xl shadow-sm"
      >
        {/* Invoice Type */}
        <div>
          <label className="block text-sm mb-1 font-medium">Invoice Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "sale" | "purchase")}
            className="border border-[var(--color-border)] rounded-md px-3 py-2 bg-transparent text-sm focus:ring-1 focus:ring-[var(--color-accent)]"
          >
            <option value="sale">Sale Invoice (We Sell)</option>
            <option value="purchase">Purchase Invoice (We Buy)</option>
          </select>
        </div>

        {/* Buyer or Seller */}
        {type === "sale" ? (
          <div>
            <label className="block text-sm mb-1 font-medium">Buyer</label>
            <input
              type="text"
              value={buyer}
              onChange={(e) => setBuyer(e.target.value)}
              placeholder="e.g., Department / Vendor"
              className="w-full border border-[var(--color-border)] rounded-md px-3 py-2 bg-transparent focus:ring-1 focus:ring-[var(--color-accent)] outline-none text-sm"
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm mb-1 font-medium">
              Seller / Vendor
            </label>
            <input
              type="text"
              value={seller}
              onChange={(e) => setSeller(e.target.value)}
              placeholder="e.g., TechSource BD"
              className="w-full border border-[var(--color-border)] rounded-md px-3 py-2 bg-transparent focus:ring-1 focus:ring-[var(--color-accent)] outline-none text-sm"
            />
          </div>
        )}

        {/* Asset Selector */}
        <div>
          <label className="block text-sm mb-2 font-medium">Select Items</label>
          <div className="flex gap-2 flex-wrap">
            {assets.map((a) => (
              <button
                key={a._id}
                type="button"
                onClick={() => addItem(a)}
                disabled={type === "sale" && a.quantity <= 0}
                className={`text-sm px-3 py-1 border rounded-md transition ${
                  type === "sale" && a.quantity <= 0
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-[color-mix(in srgb, var(--color-accent) 10%, transparent)]"
                }`}
              >
                {a.name}{" "}
                {type === "sale" && (
                  <span className="text-xs text-gray-500">
                    ({a.quantity} pcs)
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Invoice Table */}
        {items.length > 0 && (
          <div className="overflow-x-auto border border-[var(--color-border)] rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-[color-mix(in srgb, var(--color-accent) 5%, transparent)] text-left">
                <tr>
                  <th className="px-3 py-2">Item</th>
                  {type === "sale" && (
                    <th className="px-3 py-2 text-right">Available</th>
                  )}
                  <th className="px-3 py-2 text-right">Qty</th>
                  <th className="px-3 py-2 text-right">Unit</th>
                  <th className="px-3 py-2 text-right">Total</th>
                  <th className="px-3 py-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i, idx) => (
                  <tr
                    key={idx}
                    className="border-t border-[var(--color-border)] hover:bg-[color-mix(in srgb, var(--color-accent) 6%, transparent)] transition"
                  >
                    <td className="px-3 py-2">{i.name}</td>
                    {type === "sale" && (
                      <td className="px-3 py-2 text-right text-gray-500">
                        {i.available}
                      </td>
                    )}
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        value={i.quantity}
                        min={1}
                        onChange={(e) =>
                          updateItem(idx, "quantity", parseInt(e.target.value))
                        }
                        className="w-16 text-right bg-transparent border border-[var(--color-border)] rounded-md px-2 py-1"
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        value={i.unitPrice}
                        onChange={(e) =>
                          updateItem(
                            idx,
                            "unitPrice",
                            parseFloat(e.target.value)
                          )
                        }
                        className="w-20 text-right bg-transparent border border-[var(--color-border)] rounded-md px-2 py-1"
                      />
                    </td>
                    <td className="px-3 py-2 text-right font-medium">
                      ৳ {i.total.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Totals Section */}
        <div className="flex flex-col sm:flex-row justify-end gap-4 text-sm">
          <div className="sm:w-1/3 space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>৳ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Discount</span>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="w-24 text-right border border-[var(--color-border)] rounded-md px-2 py-1"
              />
            </div>
            <div className="flex justify-between">
              <span>VAT (%)</span>
              <input
                type="number"
                value={vat}
                onChange={(e) => setVat(parseFloat(e.target.value) || 0)}
                className="w-24 text-right border border-[var(--color-border)] rounded-md px-2 py-1"
              />
            </div>
            <div className="flex justify-between font-semibold">
              <span>Grand Total</span>
              <span>৳ {grandTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Paid</span>
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                className="w-24 text-right border border-[var(--color-border)] rounded-md px-2 py-1"
              />
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Return</span>
              <span>৳ {returnedAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment + Notes */}
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="px-3 py-2 border border-[var(--color-border)] rounded-md bg-transparent focus:ring-1 focus:ring-[var(--color-accent)] outline-none text-sm"
          >
            <option value="cash">Cash</option>
            <option value="bank">Bank</option>
            <option value="digital">Digital</option>
            <option value="credit">Credit</option>
          </select>

          <input
            type="text"
            placeholder="Notes / remarks"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="flex-1 px-3 py-2 border border-[var(--color-border)] rounded-md bg-transparent focus:ring-1 focus:ring-[var(--color-accent)] outline-none text-sm"
          />
        </div>

        {/* Submit */}
        <div className="text-right pt-4">
          <button
            type="submit"
            className="px-5 py-2 bg-[var(--color-accent)] text-white rounded-md hover:opacity-90 font-medium transition"
          >
            Save Invoice
          </button>
        </div>
      </form>
    </div>
  );
}
