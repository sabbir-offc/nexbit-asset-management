import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import Asset from "@/lib/models/Asset";
import Movement from "@/lib/models/Movement";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // 👈 await the params
  await db;
  const asset = await Asset.findById(id);
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(asset);
}

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

  const updated = await Asset.findByIdAndUpdate(id, updates, { new: true });

  // Log movement
  const qtyChange = updates.quantity - existing.quantity;
  let action = "edited";
  if (qtyChange > 0) action = "stock increased";
  else if (qtyChange < 0) action = "stock decreased";

  await Movement.create({
    assetId: updated._id,
    assetName: updated.name,
    action,
    quantity: Math.abs(qtyChange),
    remarks: "Asset updated",
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    quantity: asset.quantity,
    remarks: "Asset deleted from inventory",
  });

  return NextResponse.json({ success: true });
}
