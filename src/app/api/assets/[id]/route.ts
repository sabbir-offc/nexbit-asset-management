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
   GET - Single Asset
-------------------------------------------------- */
export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await db;

  const asset = await Asset.findById(id);
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(asset);
}

/* --------------------------------------------------
   PATCH - Update Asset
-------------------------------------------------- */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await db;

  const updatesRaw = await req.json();
  const existing = await Asset.findById(id);
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Build safe $set updates
  const $set: Record<string, any> = {};

  if (updatesRaw.name != null) $set.name = normalizeText(updatesRaw.name);
  if (updatesRaw.serial != null) $set.serial = normalizeText(updatesRaw.serial);
  if (updatesRaw.supplier != null)
    $set.supplier = normalizeText(updatesRaw.supplier);
  if (updatesRaw.location != null)
    $set.location = normalizeText(updatesRaw.location);
  if (updatesRaw.imageUrl != null)
    $set.imageUrl = normalizeText(updatesRaw.imageUrl);

  if (updatesRaw.category != null) {
    const cat = normalizeText(updatesRaw.category);
    if (!allowedCategories.includes(cat as any)) {
      return NextResponse.json(
        { error: "Invalid category value" },
        { status: 400 },
      );
    }
    $set.category = cat;
  }

  if (updatesRaw.status != null) {
    const st = normalizeLower(updatesRaw.status);
    if (!allowedStatuses.includes(st as any)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 },
      );
    }
    $set.status = st;
  }

  if (updatesRaw.purchaseDate != null) {
    $set.purchaseDate = updatesRaw.purchaseDate
      ? new Date(updatesRaw.purchaseDate)
      : null;
  }

  if (updatesRaw.unitPrice != null) {
    const p = Number(updatesRaw.unitPrice) || 0;
    if (p < 0)
      return NextResponse.json(
        { error: "Unit price can't be negative" },
        { status: 400 },
      );
    $set.unitPrice = p;
  }

  let qtyChange = 0;
  if (updatesRaw.quantity != null) {
    const q = Number(updatesRaw.quantity) || 0;
    if (q < 0)
      return NextResponse.json(
        { error: "Quantity can't be negative" },
        { status: 400 },
      );
    $set.quantity = q;
    qtyChange = q - (existing.quantity || 0);
  }

  const updated = await Asset.findByIdAndUpdate(id, { $set }, { new: true });
  if (!updated)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Log movement only if quantity changed
  if (qtyChange !== 0) {
    const action = qtyChange > 0 ? "stock_increased" : "stock_decreased";
    const remarks =
      qtyChange > 0
        ? `Stock increased by ${qtyChange} pcs`
        : `Stock decreased by ${Math.abs(qtyChange)} pcs`;

    await Movement.create({
      assetId: updated._id,
      assetName: updated.name,
      action,
      type: "adjustment",
      quantity: Math.abs(qtyChange),
      remarks,
    });
  } else {
    // Optional: keep a minimal "edited" log if you want.
    // If you don't want noise, leave it out.
    await Movement.create({
      assetId: updated._id,
      assetName: updated.name,
      action: "edited",
      type: "adjustment",
      quantity: 0,
      remarks: "Asset details updated",
    });
  }

  return NextResponse.json(updated);
}

/* --------------------------------------------------
   DELETE - Remove Asset
-------------------------------------------------- */
export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await db;

  const asset = await Asset.findById(id);
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await asset.deleteOne();

  await Movement.create({
    assetId: asset._id,
    assetName: asset.name,
    action: "deleted",
    type: "adjustment",
    quantity: asset.quantity,
    remarks: "Asset deleted from inventory",
  });

  return NextResponse.json({ success: true });
}
