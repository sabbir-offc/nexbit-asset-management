"use client";

import { useState } from "react";
import useSWR from "swr";
import { toast } from "react-hot-toast";

// ---------- Types ----------
interface Asset {
  _id: string;
  name: string;
  category: string;
  unitPrice: number;
  quantity: number;
  supplier?: string;
  status?: string;
}

interface AssetForm {
  name: string;
  category: string;
  unitPrice: number;
  quantity: number;
  supplier: string;
  status: string;
}

const fetcher = async (url: string): Promise<Asset[]> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch assets");
  return res.json();
};

export default function AssetsPage() {
  const { data: assets = [], mutate } = useSWR<Asset[]>("/api/assets", fetcher);

  // ---------- State ----------
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [form, setForm] = useState<AssetForm>({
    name: "",
    category: "",
    unitPrice: 0,
    quantity: 0,
    supplier: "",
    status: "in stock",
  });

  // ---------- Filter ----------
  const filteredAssets = assets.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  // ---------- ADD or EDIT ----------
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!form.name || !form.category) {
      toast.error("Name and category are required");
      return;
    }

    const method = editMode ? "PATCH" : "POST";
    const url = editMode ? `/api/assets/${selectedId}` : "/api/assets";

    const res = await fetch(url, {
      method,
      body: JSON.stringify(form),
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      toast.success(editMode ? "Asset updated" : "Asset added");
      setOpen(false);
      setEditMode(false);
      setForm({
        name: "",
        category: "",
        unitPrice: 0,
        quantity: 0,
        supplier: "",
        status: "in stock",
      });
      mutate();
    } else {
      toast.error("Action failed");
    }
  }

  // ---------- DELETE ----------
  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this asset?")) return;
    const res = await fetch(`/api/assets/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Asset deleted");
      mutate();
    } else {
      toast.error("Delete failed");
    }
  }

  // ---------- OPEN EDIT MODAL ----------
  function handleEdit(asset: Asset) {
    setEditMode(true);
    setSelectedId(asset._id);
    setForm({
      name: asset.name,
      category: asset.category,
      unitPrice: asset.unitPrice,
      quantity: asset.quantity,
      supplier: asset.supplier || "",
      status: asset.status || "in stock",
    });
    setOpen(true);
  }

  // ---------- UI ----------
  return (
    <div className="space-y-8 transition-colors duration-300">
      {/* ===== Header ===== */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Assets</h1>
          <p className="text-sm text-[var(--color-muted)]">
            Manage company assets and update or remove items easily.
          </p>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border border-[var(--color-border)] rounded-md bg-[var(--color-card)] focus:ring-1 focus:ring-[var(--color-accent)] outline-none transition text-sm"
          />
          <button
            onClick={() => {
              setForm({
                name: "",
                category: "",
                unitPrice: 0,
                quantity: 0,
                supplier: "",
                status: "in stock",
              });
              setEditMode(false);
              setOpen(true);
            }}
            className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-md hover:bg-[var(--color-accent-hover)] transition text-sm font-medium"
          >
            + Add Asset
          </button>
        </div>
      </div>

      {/* ===== Table ===== */}
      <div className="overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-[color-mix(in srgb, var(--color-accent) 5%, transparent)]">
            <tr className="text-left text-[var(--color-muted)] border-b border-[var(--color-border)]">
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Category</th>
              <th className="px-4 py-2 font-medium text-right">Unit Price</th>
              <th className="px-4 py-2 font-medium text-right">Qty</th>
              <th className="px-4 py-2 font-medium text-right">Total</th>
              <th className="px-4 py-2 font-medium">Supplier</th>
              <th className="px-4 py-2 font-medium text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssets.length > 0 ? (
              filteredAssets.map((a) => (
                <tr
                  key={a._id}
                  className="border-b border-[var(--color-border)] hover:bg-[color-mix(in srgb, var(--color-accent) 5%, transparent)] transition"
                >
                  <td className="px-4 py-2">{a.name}</td>
                  <td className="px-4 py-2">{a.category}</td>
                  <td className="px-4 py-2 text-right">
                    ৳ {a.unitPrice.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-right">{a.quantity}</td>
                  <td className="px-4 py-2 text-right">
                    ৳ {(a.unitPrice * a.quantity).toFixed(2)}
                  </td>
                  <td className="px-4 py-2">{a.supplier || "-"}</td>
                  <td className="px-4 py-2 text-center flex justify-center gap-2">
                    <button
                      onClick={() => handleEdit(a)}
                      className="text-[var(--color-accent)] hover:underline text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(a._id)}
                      className="text-red-500 hover:underline text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={7}
                  className="text-center text-[var(--color-muted)] py-6"
                >
                  No assets found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ===== Add/Edit Modal ===== */}
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-[var(--color-card)] rounded-xl shadow-lg w-full max-w-md p-6 border border-[var(--color-border)] animate-fadeIn">
            <h2 className="text-xl font-semibold mb-4 text-[var(--color-foreground)]">
              {editMode ? "Edit Asset" : "Add New Asset"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Asset Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="px-3 py-2 border border-[var(--color-border)] rounded-md bg-transparent focus:ring-1 focus:ring-[var(--color-accent)] outline-none text-sm"
                />
                <input
                  type="text"
                  placeholder="Category"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className="px-3 py-2 border border-[var(--color-border)] rounded-md bg-transparent focus:ring-1 focus:ring-[var(--color-accent)] outline-none text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Unit Price"
                  value={form.unitPrice}
                  onChange={(e) =>
                    setForm({ ...form, unitPrice: parseFloat(e.target.value) })
                  }
                  className="px-3 py-2 border border-[var(--color-border)] rounded-md bg-transparent focus:ring-1 focus:ring-[var(--color-accent)] outline-none text-sm"
                />
                <input
                  type="number"
                  placeholder="Quantity"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: parseInt(e.target.value) })
                  }
                  className="px-3 py-2 border border-[var(--color-border)] rounded-md bg-transparent focus:ring-1 focus:ring-[var(--color-accent)] outline-none text-sm"
                />
              </div>
              <input
                type="text"
                placeholder="Supplier"
                value={form.supplier}
                onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md bg-transparent focus:ring-1 focus:ring-[var(--color-accent)] outline-none text-sm"
              />

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 text-sm font-medium rounded-md border border-[var(--color-border)] hover:bg-[color-mix(in srgb, var(--color-accent) 10%, transparent)] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition"
                >
                  {editMode ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
