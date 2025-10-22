import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import Asset from "@/lib/models/Asset";
import Movement from "@/lib/models/Movement";

/* --------------------------------------------------
   GET - Single Asset
-------------------------------------------------- */
export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db;

  const updates = await req.json();
  const existing = await Asset.findById(id);
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  // ✅ sanitize and validate category
  if (updates.category) {
    const allowedCategories = [
      "Electronics",
      "Furniture",
      "Kitchen Accessories",
      "Others",
    ];
    if (!allowedCategories.includes(updates.category)) {
      return NextResponse.json(
        { error: "Invalid category value" },
        { status: 400 }
      );
    }
  }

  // ✅ sanitize purchaseDate
  if (updates.purchaseDate)
    updates.purchaseDate = new Date(updates.purchaseDate);

  const updated = await Asset.findByIdAndUpdate(id, updates, { new: true });

  // 🧩 Determine quantity change
  const qtyChange = (updates.quantity ?? existing.quantity) - existing.quantity;
  let action = "edited";
  let remarks = "Asset details updated";

  if (qtyChange > 0) {
    action = "stock_increased";
    remarks = `Stock increased by ${qtyChange} pcs`;
  } else if (qtyChange < 0) {
    action = "stock_decreased";
    remarks = `Stock decreased by ${Math.abs(qtyChange)} pcs`;
  }

  // 🧾 Log movement entry
  await Movement.create({
    assetId: updated._id,
    assetName: updated.name,
    action,
    type: "adjustment",
    quantity: Math.abs(qtyChange) || 0,
    remarks,
  });

  return NextResponse.json(updated);
}

/* --------------------------------------------------
   DELETE - Remove Asset
-------------------------------------------------- */
export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db;

  const asset = await Asset.findById(id);
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await asset.deleteOne();

  // 🧾 Log deletion
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
