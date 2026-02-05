import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import Asset from "@/lib/models/Asset";
import Movement from "@/lib/models/Movement";

const allowedCategories = [
  "Electronics",
  "Furniture",
  "Kitchen Accessories",
  "Interior",
  "Others",
] as const;

const allowedStatuses = [
  "in stock",
  "issued",
  "moved outside",
  "lost",
  "under repair",
] as const;

function normalizeText(v: unknown) {
  return String(v ?? "").trim();
}

function normalizeLower(v: unknown) {
  return normalizeText(v).toLowerCase();
}

/* --------------------------------------------------
   GET - List assets (supports search/filter/sort)
   /api/assets?q=&category=&status=&sort=
   sort: newest | oldest | name_asc | name_desc | value_desc | qty_desc
-------------------------------------------------- */
export async function GET(req: NextRequest) {
  try {
    await db;

    const { searchParams } = new URL(req.url);
    const q = normalizeText(searchParams.get("q"));
    const category = normalizeText(searchParams.get("category"));
    const status = normalizeLower(searchParams.get("status"));
    const sort = normalizeText(searchParams.get("sort")) || "newest";

    const filter: Record<string, any> = {};

    if (category && category !== "All") {
      if (!allowedCategories.includes(category as any)) {
        return NextResponse.json(
          { error: "Invalid category value" },
          { status: 400 },
        );
      }
      filter.category = category;
    }

    if (status && status !== "all") {
      if (!allowedStatuses.includes(status as any)) {
        return NextResponse.json(
          { error: "Invalid status value" },
          { status: 400 },
        );
      }
      // store db status as exact string (your data uses "in stock")
      filter.status = status;
    }

    if (q) {
      // Search across common fields
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
        { serial: { $regex: q, $options: "i" } },
        { supplier: { $regex: q, $options: "i" } },
        { location: { $regex: q, $options: "i" } },
        { status: { $regex: q, $options: "i" } },
      ];
    }

    // Sorting
    let sortSpec: Record<string, 1 | -1> = { createdAt: -1 };

    if (sort === "oldest") sortSpec = { createdAt: 1 };
    if (sort === "name_asc") sortSpec = { name: 1 };
    if (sort === "name_desc") sortSpec = { name: -1 };
    if (sort === "qty_desc") sortSpec = { quantity: -1 };
    if (sort === "value_desc") {
      // We'll sort in-memory if you don't have computed field.
      // Still fetch with createdAt sort to keep stable.
      sortSpec = { createdAt: -1 };
    }

    let assets = await Asset.find(filter).sort(sortSpec);

    if (sort === "value_desc") {
      assets = assets.sort(
        (a: any, b: any) =>
          (Number(b.unitPrice) || 0) * (Number(b.quantity) || 0) -
          (Number(a.unitPrice) || 0) * (Number(a.quantity) || 0),
      );
    }

    return NextResponse.json(assets);
  } catch (err) {
    console.error("GET /assets error:", err);
    return NextResponse.json(
      { error: "Failed to fetch assets" },
      { status: 500 },
    );
  }
}

/* --------------------------------------------------
   POST - Add new asset
-------------------------------------------------- */
export async function POST(req: NextRequest) {
  try {
    await db;
    const data = await req.json();

    const name = normalizeText(data?.name);
    const category = normalizeText(data?.category);

    if (!name || !category) {
      return NextResponse.json(
        { error: "Name and category are required" },
        { status: 400 },
      );
    }

    if (!allowedCategories.includes(category as any)) {
      return NextResponse.json(
        { error: "Invalid category value" },
        { status: 400 },
      );
    }

    const status = normalizeLower(data?.status) || "in stock";
    if (!allowedStatuses.includes(status as any)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 },
      );
    }

    const unitPrice = Number(data?.unitPrice) || 0;
    const quantity = Number(data?.quantity) || 0;

    if (unitPrice < 0)
      return NextResponse.json(
        { error: "Unit price can't be negative" },
        { status: 400 },
      );
    if (quantity < 0)
      return NextResponse.json(
        { error: "Quantity can't be negative" },
        { status: 400 },
      );

    const serial = normalizeText(data?.serial);

    const assetData = {
      name,
      category,
      serial,
      purchaseDate: data?.purchaseDate ? new Date(data.purchaseDate) : null,
      unitPrice,
      quantity,
      supplier: normalizeText(data?.supplier),
      status, // normalized
      location: normalizeText(data?.location),
      imageUrl: normalizeText(data?.imageUrl),
    };

    // Prevent duplicate:
    // - If serial exists => unique by serial
    // - Else => unique by (name + category)
    const exists = serial
      ? await Asset.findOne({ serial })
      : await Asset.findOne({
          name: assetData.name,
          category: assetData.category,
        });

    if (exists) {
      return NextResponse.json(
        {
          error: serial
            ? "Asset with this serial already exists"
            : "Asset already exists in this category",
        },
        { status: 400 },
      );
    }

    const created = await Asset.create(assetData);

    await Movement.create({
      assetId: created._id,
      assetName: created.name,
      action: "added",
      type: "adjustment",
      quantity: created.quantity,
      remarks: "New asset added to inventory",
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("POST /assets error:", err);
    return NextResponse.json({ error: "Failed to add asset" }, { status: 500 });
  }
}
