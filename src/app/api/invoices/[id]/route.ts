import { db } from "@/lib/db";
import Invoice from "@/lib/models/Invoice";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // 👈 await the params (new Next.js 15 style)

  await db;

  const invoice = await Invoice.findById(id);
  if (!invoice)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(invoice);
}
