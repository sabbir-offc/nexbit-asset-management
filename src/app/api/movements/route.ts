import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import Movement from "@/lib/models/Movement";
import { Types } from "mongoose";

// 🔹 Define a stricter interface for raw Mongoose documents
interface RawMovement {
  _id: Types.ObjectId;
  assetId?: Types.ObjectId;
  assetName?: string;
  action?: string;
  type?: string;
  quantity?: number;
  invoiceNumber?: string;
  partyName?: string;
  remarks?: string;
  createdAt?: Date;
}

// 🔹 GET /api/movements
export async function GET(req: NextRequest) {
  try {
    await db;

    // Optional filters
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // "sale" | "purchase" | "adjustment"
    const action = searchParams.get("action"); // "sold", "purchased", etc.

    // ✅ Use safer Record<string, string> instead of any
    const query: Record<string, string> = {};
    if (type) query.type = type;
    if (action) query.action = action;

    // Fetch and sort latest movements
    const logs = await Movement.find(query)
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    // ✅ Explicit cast to RawMovement[]
    const formatted = (logs as RawMovement[]).map((m) => ({
      _id: m._id?.toString?.() ?? "",
      assetId: m.assetId?.toString?.() ?? "",
      assetName: m.assetName ?? "",
      action: m.action ?? "",
      type: m.type ?? "adjustment",
      quantity: m.quantity ?? 0,
      invoiceNumber: m.invoiceNumber ?? "",
      partyName: m.partyName ?? "",
      remarks: m.remarks ?? "",
      createdAt: m.createdAt ?? new Date(),
    }));

    return NextResponse.json(formatted, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("GET /api/movements error:", err.message);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    console.error("GET /api/movements unknown error:", err);
    return NextResponse.json(
      { error: "Failed to fetch movement logs" },
      { status: 500 }
    );
  }
}
