import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import Asset from "@/lib/models/Asset";
import Movement from "@/lib/models/Movement";

/* --------------------------------------------------
   GET - List all assets
-------------------------------------------------- */
export async function GET() {
  try {
    await db;
    const assets = await Asset.find().sort({ createdAt: -1 });
    return NextResponse.json(assets);
  } catch (err) {
    console.error("GET /assets error:", err);
    return NextResponse.json(
      { error: "Failed to fetch assets" },
      { status: 500 }
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

    // ✅ Basic validation
    if (!data.name || !data.category) {
      return NextResponse.json(
        { error: "Name and category are required" },
        { status: 400 }
      );
    }

    // ✅ Category validation
    const allowedCategories = [
      "Electronics",
      "Furniture",
      "Kitchen Accessories",
      "Interior",
      "Others",
    ];
    if (!allowedCategories.includes(data.category)) {
      return NextResponse.json(
        { error: "Invalid category value" },
        { status: 400 }
      );
    }

    // ✅ Optional fields (sanitization)
    const assetData = {
      name: data.name,
      category: data.category,
      serial: data.serial || "",
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
      unitPrice: Number(data.unitPrice) || 0,
      quantity: Number(data.quantity) || 0,
      supplier: data.supplier || "",
      status: data.status || "in stock",
      location: data.location || "",
      imageUrl: data.imageUrl || "",
    };

    // Prevent duplicate (same name + category)
    const exists = await Asset.findOne({
      name: assetData.name,
      category: assetData.category,
    });
    if (exists) {
      return NextResponse.json(
        { error: "Asset already exists in this category" },
        { status: 400 }
      );
    }

    const created = await Asset.create(assetData);

    // 🧾 Log movement
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
