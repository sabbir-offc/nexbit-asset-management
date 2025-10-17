import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import Asset from "@/lib/models/Asset";
import Movement from "@/lib/models/Movement";

export async function GET() {
  await db;
  const assets = await Asset.find().sort({ createdAt: -1 });
  return NextResponse.json(assets);
}

export async function POST(req: NextRequest) {
  await db;
  const data = await req.json();
  const created = await Asset.create(data);

  // Log movement
  await Movement.create({
    assetId: created._id,
    assetName: created.name,
    action: "added",
    quantity: created.quantity,
    remarks: "New asset added",
  });

  return NextResponse.json(created, { status: 201 });
}
