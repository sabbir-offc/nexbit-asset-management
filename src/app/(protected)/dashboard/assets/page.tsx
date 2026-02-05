"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { toast } from "react-hot-toast";
import DatePicker from "react-datepicker";
import { format } from "date-fns";

import {
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Pencil,
  Trash2,
  X,
  Package,
  Boxes,
  Wallet,
  AlertTriangle,
  Image as ImageIcon,
  MapPin,
  BadgeCheck,
  Wrench,
  Truck,
  ShieldAlert,
  MinusCircle,
} from "lucide-react";

interface Asset {
  _id: string;
  name: string;
  category: string;
  serial?: string;
  purchaseDate?: string;
  unitPrice: number;
  quantity: number;
  supplier?: string;
  status?: string;
  location?: string;
  imageUrl?: string;
}

interface AssetForm {
  name: string;
  category: string;
  serial: string;
  purchaseDate: string;
  unitPrice: number;
  quantity: number;
  supplier: string;
  status: string;
  location: string;
  imageUrl: string;
}

const fetcher = async (url: string): Promise<Asset[]> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch assets");
  return res.json();
};

function cn(...v: Array<string | false | null | undefined>) {
  return v.filter(Boolean).join(" ");
}

function moneyBDT(n: number) {
  const safe = Number.isFinite(n) ? n : 0;
  // You can replace with Intl.NumberFormat("bn-BD") if you want Bangla digits.
  return `৳ ${safe.toFixed(2)}`;
}

const CATEGORIES = [
  "All",
  "Electronics",
  "Furniture",
  "Kitchen Accessories",
  "Interior",
  "Others",
] as const;

const STATUSES = [
  "all",
  "in stock",
  "issued",
  "moved outside",
  "lost",
  "under repair",
] as const;

const SORTS = [
  { key: "newest", label: "Newest" },
  { key: "oldest", label: "Oldest" },
  { key: "name_asc", label: "Name (A–Z)" },
  { key: "name_desc", label: "Name (Z–A)" },
  { key: "value_desc", label: "Highest Value" },
  { key: "qty_desc", label: "Highest Qty" },
] as const;

function StatusPill({ status }: { status?: string }) {
  const s = (status || "in stock").toLowerCase();

  const meta =
    s === "in stock"
      ? {
          icon: BadgeCheck,
          cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
        }
      : s === "issued"
        ? { icon: Truck, cls: "bg-sky-500/10 text-sky-600 border-sky-500/20" }
        : s === "moved outside"
          ? {
              icon: Package,
              cls: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
            }
          : s === "under repair"
            ? {
                icon: Wrench,
                cls: "bg-amber-500/10 text-amber-700 border-amber-500/20",
              }
            : s === "lost"
              ? {
                  icon: ShieldAlert,
                  cls: "bg-red-500/10 text-red-600 border-red-500/20",
                }
              : {
                  icon: MinusCircle,
                  cls: "bg-zinc-500/10 text-zinc-700 border-zinc-500/20",
                };

  const Icon = meta.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        meta.cls,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="capitalize">{s}</span>
    </span>
  );
}

function CategoryPill({ category }: { category: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-2.5 py-1 text-xs font-medium text-[var(--color-muted)]">
      {category}
    </span>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  sub,
}: {
  title: string;
  value: string;
  icon: any;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--color-muted)]">{title}</p>
          <p className="mt-1 text-xl font-semibold text-[var(--color-foreground)]">
            {value}
          </p>
          {sub ? (
            <p className="mt-1 text-xs text-[var(--color-muted)]">{sub}</p>
          ) : null}
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[color-mix(in srgb, var(--color-accent) 10%, transparent)] p-2">
          <Icon className="h-5 w-5 text-[var(--color-accent)]" />
        </div>
      </div>
    </div>
  );
}

export default function AssetsPage() {
  const {
    data: assets = [],
    mutate,
    isLoading,
  } = useSWR<Asset[]>("/api/assets", fetcher);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("all");
  const [sort, setSort] = useState<(typeof SORTS)[number]["key"]>("newest");

  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [form, setForm] = useState<AssetForm>({
    name: "",
    category: "",
    serial: "",
    purchaseDate: "",
    unitPrice: 0,
    quantity: 0,
    supplier: "",
    status: "in stock",
    location: "",
    imageUrl: "",
  });

  const stats = useMemo(() => {
    const totalItems = assets.length;
    const totalQty = assets.reduce((sum, a) => sum + (a.quantity || 0), 0);
    const totalValue = assets.reduce(
      (sum, a) => sum + (a.unitPrice || 0) * (a.quantity || 0),
      0,
    );
    const lowStock = assets.filter(
      (a) => (a.quantity || 0) > 0 && (a.quantity || 0) <= 2,
    ).length;

    return {
      totalItems,
      totalQty,
      totalValue,
      lowStock,
    };
  }, [assets]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();

    let list = assets.filter((a) => {
      const hay = [
        a.name,
        a.category,
        a.serial,
        a.supplier,
        a.location,
        a.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchSearch = q ? hay.includes(q) : true;
      const matchCategory = category === "All" ? true : a.category === category;
      const matchStatus =
        status === "all"
          ? true
          : (a.status || "in stock").toLowerCase() === status;

      return matchSearch && matchCategory && matchStatus;
    });

    const getDate = (d?: string) => (d ? new Date(d).getTime() : 0);
    const getValue = (a: Asset) => (a.unitPrice || 0) * (a.quantity || 0);

    list.sort((a, b) => {
      if (sort === "newest")
        return getDate(b.purchaseDate) - getDate(a.purchaseDate);
      if (sort === "oldest")
        return getDate(a.purchaseDate) - getDate(b.purchaseDate);
      if (sort === "name_asc") return a.name.localeCompare(b.name);
      if (sort === "name_desc") return b.name.localeCompare(a.name);
      if (sort === "value_desc") return getValue(b) - getValue(a);
      if (sort === "qty_desc") return (b.quantity || 0) - (a.quantity || 0);
      return 0;
    });

    return list;
  }, [assets, search, category, status, sort]);

  const totalPreview = useMemo(() => {
    return (form.unitPrice || 0) * (form.quantity || 0);
  }, [form.unitPrice, form.quantity]);

  function resetForm() {
    setForm({
      name: "",
      category: "",
      serial: "",
      purchaseDate: "",
      unitPrice: 0,
      quantity: 0,
      supplier: "",
      status: "in stock",
      location: "",
      imageUrl: "",
    });
  }

  function openCreate() {
    setEditMode(false);
    setSelectedId(null);
    resetForm();
    setOpen(true);
  }

  function handleEdit(asset: Asset) {
    setEditMode(true);
    setSelectedId(asset._id);
    setForm({
      name: asset.name,
      category: asset.category,
      serial: asset.serial || "",
      purchaseDate: asset.purchaseDate ? asset.purchaseDate.split("T")[0] : "",
      unitPrice: asset.unitPrice,
      quantity: asset.quantity,
      supplier: asset.supplier || "",
      status: asset.status || "in stock",
      location: asset.location || "",
      imageUrl: asset.imageUrl || "",
    });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!form.name.trim()) return toast.error("Asset name is required");
    if (!form.category.trim()) return toast.error("Category is required");
    if ((form.quantity ?? 0) < 0)
      return toast.error("Quantity can't be negative");
    if ((form.unitPrice ?? 0) < 0)
      return toast.error("Unit price can't be negative");

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
      resetForm();
      mutate();
    } else {
      const err = await res.json().catch(() => ({}));
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
            Assets
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Track stock, value, and lifecycle status of company assets.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-95"
          >
            <Plus className="h-4 w-4" />
            Add Asset
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Assets"
          value={String(stats.totalItems)}
          icon={Boxes}
          sub="Unique items"
        />
        <StatCard
          title="Total Quantity"
          value={String(stats.totalQty)}
          icon={Package}
          sub="All units combined"
        />
        <StatCard
          title="Total Stock Value"
          value={moneyBDT(stats.totalValue)}
          icon={Wallet}
          sub="Unit price × quantity"
        />
        <StatCard
          title="Low Stock"
          value={String(stats.lowStock)}
          icon={AlertTriangle}
          sub="Qty ≤ 2"
        />
      </div>

      {/* Toolbar */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, serial, supplier, location..."
                className="w-full rounded-xl border border-[var(--color-border)] bg-transparent py-2 pl-9 pr-3 text-sm outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              />
            </div>

            {/* Filters */}
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <div className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[color-mix(in srgb, var(--color-accent) 6%, transparent)] px-3 py-2">
                <Filter className="h-4 w-4 text-[var(--color-muted)]" />
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as (typeof CATEGORIES)[number])
                  }
                  className="bg-transparent text-sm outline-none"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[color-mix(in srgb, var(--color-accent) 6%, transparent)] px-3 py-2">
                <Filter className="h-4 w-4 text-[var(--color-muted)]" />
                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as (typeof STATUSES)[number])
                  }
                  className="bg-transparent text-sm outline-none"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s === "all" ? "All Status" : s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Sort + Count */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between lg:justify-end">
            <div className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[color-mix(in srgb, var(--color-accent) 6%, transparent)] px-3 py-2">
              <ArrowUpDown className="h-4 w-4 text-[var(--color-muted)]" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as any)}
                className="bg-transparent text-sm outline-none"
              >
                {SORTS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-sm text-[var(--color-muted)]">
              Showing{" "}
              <span className="font-medium text-[var(--color-foreground)]">
                {rows.length}
              </span>{" "}
              assets
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-sm">
            <thead className="sticky top-0 z-10 bg-[color-mix(in srgb, var(--color-accent) 6%, var(--color-card))]">
              <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-muted)]">
                {/* widths are key */}
                <th className="w-[340px] px-4 py-3">Asset</th>
                <th className="w-[220px] px-4 py-3">Meta</th>
                <th className="w-[120px] px-4 py-3">Purchase</th>
                <th className="w-[110px] px-4 py-3 text-right">Unit</th>
                <th className="w-[70px] px-4 py-3 text-right">Qty</th>
                <th className="w-[120px] px-4 py-3 text-right">Value</th>
                <th className="w-[160px] px-4 py-3">Supplier</th>
                <th className="w-[160px] px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--color-border)]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 animate-pulse rounded-xl border border-[var(--color-border)] bg-[color-mix(in srgb, var(--color-accent) 8%, transparent)]" />
                        <div className="min-w-0 space-y-2">
                          <div className="h-3 w-44 animate-pulse rounded bg-[color-mix(in srgb, var(--color-accent) 8%, transparent)]" />
                          <div className="h-3 w-28 animate-pulse rounded bg-[color-mix(in srgb, var(--color-accent) 8%, transparent)]" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-3 w-44 animate-pulse rounded bg-[color-mix(in srgb, var(--color-accent) 8%, transparent)]" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-3 w-20 animate-pulse rounded bg-[color-mix(in srgb, var(--color-accent) 8%, transparent)]" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="ml-auto h-3 w-16 animate-pulse rounded bg-[color-mix(in srgb, var(--color-accent) 8%, transparent)]" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="ml-auto h-3 w-8 animate-pulse rounded bg-[color-mix(in srgb, var(--color-accent) 8%, transparent)]" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="ml-auto h-3 w-20 animate-pulse rounded bg-[color-mix(in srgb, var(--color-accent) 8%, transparent)]" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-3 w-28 animate-pulse rounded bg-[color-mix(in srgb, var(--color-accent) 8%, transparent)]" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="mx-auto h-8 w-20 animate-pulse rounded-xl bg-[color-mix(in srgb, var(--color-accent) 8%, transparent)]" />
                    </td>
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-14 text-center">
                    {/* keep your empty state */}
                    <div className="mx-auto flex max-w-md flex-col items-center gap-3">
                      <div className="rounded-2xl border border-[var(--color-border)] bg-[color-mix(in srgb, var(--color-accent) 10%, transparent)] p-3">
                        <Boxes className="h-6 w-6 text-[var(--color-accent)]" />
                      </div>
                      <div>
                        <p className="text-base font-semibold text-[var(--color-foreground)]">
                          No assets found
                        </p>
                        <p className="mt-1 text-sm text-[var(--color-muted)]">
                          Try changing filters or add a new asset to get
                          started.
                        </p>
                      </div>
                      <button
                        onClick={openCreate}
                        className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-95"
                      >
                        <Plus className="h-4 w-4" />
                        Add Asset
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((a) => {
                  const value = (a.unitPrice || 0) * (a.quantity || 0);

                  return (
                    <tr
                      key={a._id}
                      className="border-b border-[var(--color-border)] transition hover:bg-[color-mix(in srgb, var(--color-accent) 5%, transparent)]"
                    >
                      {/* Asset */}
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[color-mix(in srgb, var(--color-accent) 8%, transparent)]">
                            {a.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={a.imageUrl}
                                alt={a.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <ImageIcon className="h-5 w-5 text-[var(--color-muted)]" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            {/* wrap instead of expanding */}
                            <p className="break-words font-semibold leading-5 text-[var(--color-foreground)] line-clamp-2">
                              {a.name}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <CategoryPill category={a.category} />
                              <StatusPill status={a.status} />
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Meta */}
                      <td className="px-4 py-3 align-top">
                        <div className="space-y-1 text-[var(--color-muted)]">
                          <div className="min-w-0">
                            <span className="text-[11px] font-medium text-[var(--color-muted)]">
                              Serial
                            </span>
                            <div className="break-words text-[13px] text-[var(--color-foreground)] line-clamp-2">
                              {a.serial || "-"}
                            </div>
                          </div>
                          <div className="flex min-w-0 items-start gap-2">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                            <span className="break-words line-clamp-2">
                              {a.location || "-"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Purchase */}
                      <td className="px-4 py-3 align-top text-[var(--color-muted)]">
                        <span className="whitespace-normal">
                          {a.purchaseDate
                            ? new Date(a.purchaseDate).toLocaleDateString(
                                "en-GB",
                              )
                            : "-"}
                        </span>
                      </td>

                      {/* Unit */}
                      <td className="px-4 py-3 align-top text-right font-medium text-[var(--color-foreground)]">
                        {moneyBDT(a.unitPrice || 0)}
                      </td>

                      {/* Qty */}
                      <td className="px-4 py-3 align-top text-right text-[var(--color-foreground)]">
                        {a.quantity}
                      </td>

                      {/* Value */}
                      <td className="px-4 py-3 align-top text-right font-semibold text-[var(--color-foreground)]">
                        {moneyBDT(value)}
                      </td>

                      {/* Supplier */}
                      <td className="px-4 py-3 align-top text-[var(--color-muted)]">
                        <span className="break-words line-clamp-2">
                          {a.supplier || "-"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(a)}
                            className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-xs font-medium text-[var(--color-foreground)] shadow-sm hover:bg-[color-mix(in srgb, var(--color-accent) 6%, transparent)]"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="hidden sm:inline">Edit</span>
                          </button>

                          <button
                            onClick={() => handleDelete(a._id)}
                            className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-500/15"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />

          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-xl">
              {/* Modal header */}
              <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
                <div>
                  <p className="text-lg font-semibold text-[var(--color-foreground)]">
                    {editMode ? "Edit Asset" : "Add New Asset"}
                  </p>
                  <p className="mt-0.5 text-sm text-[var(--color-muted)]">
                    Keep records consistent for stock and invoice history.
                  </p>
                </div>

                <button
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-2 hover:bg-[color-mix(in srgb, var(--color-accent) 6%, transparent)]"
                  aria-label="Close"
                >
                  <X className="h-4 w-4 text-[var(--color-muted)]" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="px-5 py-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Name */}
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-[var(--color-muted)]">
                      Asset Name
                    </label>
                    <input
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      placeholder="Example: Dell OptiPlex 7090"
                      className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="text-xs font-medium text-[var(--color-muted)]">
                      Category
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) =>
                        setForm({ ...form, category: e.target.value })
                      }
                      className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                    >
                      <option value="">Select category</option>
                      {CATEGORIES.filter((c) => c !== "All").map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="text-xs font-medium text-[var(--color-muted)]">
                      Status
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) =>
                        setForm({ ...form, status: e.target.value })
                      }
                      className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                    >
                      {STATUSES.filter((s) => s !== "all").map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Serial */}
                  <div>
                    <label className="text-xs font-medium text-[var(--color-muted)]">
                      Serial / Asset ID
                    </label>
                    <input
                      value={form.serial}
                      onChange={(e) =>
                        setForm({ ...form, serial: e.target.value })
                      }
                      placeholder="Example: DV-IT-00021"
                      className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                    />
                  </div>

                  {/* Purchase Date */}
                  <div>
                    <label className="text-xs font-medium text-[var(--color-muted)]">
                      Purchase Date
                    </label>
                    <DatePicker
                      selected={
                        form.purchaseDate ? new Date(form.purchaseDate) : null
                      }
                      onChange={(date: Date | null) =>
                        setForm({
                          ...form,
                          purchaseDate: date ? format(date, "yyyy-MM-dd") : "",
                        })
                      }
                      dateFormat="dd/MM/yy"
                      placeholderText="Select date"
                      className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                      showPopperArrow={false}
                      maxDate={new Date()}
                    />
                  </div>

                  {/* Unit Price */}
                  <div>
                    <label className="text-xs font-medium text-[var(--color-muted)]">
                      Unit Price (BDT)
                    </label>
                    <input
                      type="number"
                      value={form.unitPrice}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          unitPrice: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                    />
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="text-xs font-medium text-[var(--color-muted)]">
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={form.quantity}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          quantity: parseInt(e.target.value) || 0,
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                    />
                  </div>

                  {/* Supplier */}
                  <div>
                    <label className="text-xs font-medium text-[var(--color-muted)]">
                      Supplier
                    </label>
                    <input
                      value={form.supplier}
                      onChange={(e) =>
                        setForm({ ...form, supplier: e.target.value })
                      }
                      placeholder="Example: Star Tech"
                      className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <label className="text-xs font-medium text-[var(--color-muted)]">
                      Location
                    </label>
                    <input
                      value={form.location}
                      onChange={(e) =>
                        setForm({ ...form, location: e.target.value })
                      }
                      placeholder="Example: Store Room / Office"
                      className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                    />
                  </div>

                  {/* Image URL */}
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-[var(--color-muted)]">
                      Image URL (optional)
                    </label>
                    <input
                      value={form.imageUrl}
                      onChange={(e) =>
                        setForm({ ...form, imageUrl: e.target.value })
                      }
                      placeholder="Cloudinary URL"
                      className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                    />
                  </div>
                </div>

                {/* Value preview */}
                <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-[var(--color-border)] bg-[color-mix(in srgb, var(--color-accent) 6%, transparent)] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
                    <Wallet className="h-4 w-4 text-[var(--color-accent)]" />
                    Total Value Preview
                  </div>
                  <div className="text-base font-semibold text-[var(--color-foreground)]">
                    {moneyBDT(totalPreview)}
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2 text-sm font-medium text-[var(--color-foreground)] hover:bg-[color-mix(in srgb, var(--color-accent) 6%, transparent)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-95"
                  >
                    {editMode ? "Update Asset" : "Save Asset"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
