"use client";

import { useState } from "react";
import useSWR from "swr";
import { toast } from "react-hot-toast";

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

  const filteredAssets = assets.filter((a) =>
    [a.name, a.category, a.supplier]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.name || !form.category)
      return toast.error("Name and category are required");

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
      const err = await res.json();
      toast.error(err.error || "Action failed");
    }
  }

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

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Assets</h1>
          <p className="text-sm text-[var(--color-muted)]">
            Manage all company assets and maintain accurate stock records.
          </p>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border border-[var(--color-border)] rounded-md bg-[var(--color-card)] focus:ring-1 focus:ring-[var(--color-accent)] outline-none text-sm"
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
            className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-md hover:opacity-90 transition text-sm font-medium"
          >
            + Add Asset
          </button>
        </div>
      </div>

      {/* ===== Table ===== */}
      <div className="overflow-x-auto border border-[var(--color-border)] rounded-lg bg-[var(--color-card)] shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-[color-mix(in srgb, var(--color-accent) 5%, transparent)]">
            <tr className="text-left border-b border-[var(--color-border)] text-[var(--color-muted)]">
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2 text-right">Unit Price</th>
              <th className="px-4 py-2 text-right">Qty</th>
              <th className="px-4 py-2 text-right">Total Value</th>
              <th className="px-4 py-2">Supplier</th>
              <th className="px-4 py-2 text-center">Actions</th>
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
                  <td className="px-4 py-2 text-right font-medium">
                    ৳ {(a.unitPrice * a.quantity).toFixed(2)}
                  </td>
                  <td className="px-4 py-2">{a.supplier || "-"}</td>
                  <td className="px-4 py-2 text-center flex justify-center gap-2">
                    <button
                      onClick={() => handleEdit(a)}
                      className="text-[var(--color-accent)] hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(a._id)}
                      className="text-red-500 hover:underline"
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
                  className="text-center py-6 text-[var(--color-muted)]"
                >
                  No assets found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ===== Modal ===== */}
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-[var(--color-card)] rounded-xl w-full max-w-md p-6 border border-[var(--color-border)]">
            <h2 className="text-xl font-semibold mb-4">
              {editMode ? "Edit Asset" : "Add New Asset"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Asset Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="px-3 py-2 border border-[var(--color-border)] rounded-md bg-transparent text-sm"
                />
                <input
                  type="text"
                  placeholder="Category"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className="px-3 py-2 border border-[var(--color-border)] rounded-md bg-transparent text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Unit Price"
                  value={form.unitPrice}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      unitPrice: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="px-3 py-2 border border-[var(--color-border)] rounded-md bg-transparent text-sm"
                />
                <input
                  type="number"
                  placeholder="Quantity"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      quantity: parseInt(e.target.value) || 0,
                    })
                  }
                  className="px-3 py-2 border border-[var(--color-border)] rounded-md bg-transparent text-sm"
                />
              </div>

              <input
                type="text"
                placeholder="Supplier"
                value={form.supplier}
                onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md bg-transparent text-sm"
              />

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 text-sm font-medium rounded-md border border-[var(--color-border)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium rounded-md bg-[var(--color-accent)] text-white hover:opacity-90"
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
