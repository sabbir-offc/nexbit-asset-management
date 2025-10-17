import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import Invoice from "@/lib/models/Invoice";
import Asset from "@/lib/models/Asset";
import Movement from "@/lib/models/Movement";
import Counter from "@/lib/models/Counter";
import { calcTotals } from "@/lib/utils/calc";

// 🔹 Generate sequential invoice numbers
async function nextInvoiceNumber() {
  const year = new Date().getFullYear();
  const key = `INV-${year}`;
  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  return `${key}-${String(counter.seq).padStart(4, "0")}`;
}

// 🔹 List all invoices
export async function GET() {
  await db;
  const invoices = await Invoice.find().sort({ createdAt: -1 });
  return NextResponse.json(invoices);
}

// 🔹 Create new invoice
export async function POST(req: NextRequest) {
  await db;
  const data = await req.json();
  const invoiceNumber = await nextInvoiceNumber();
  const totals = calcTotals(
    data.items,
    data.discount,
    data.vat,
    data.paidAmount
  );

  const invoice = await Invoice.create({
    ...data,
    invoiceNumber,
    ...totals,
  });

  // 🔸 Update stock + create movement log
  for (const item of data.items) {
    await Asset.updateOne(
      { _id: item.assetId },
      { $inc: { quantity: -item.quantity } }
    );
    await Movement.create({
      assetId: item.assetId,
      assetName: item.name,
      action: "sold",
      quantity: item.quantity,
      referenceInvoice: invoice._id,
      remarks: `Sold via ${invoiceNumber}`,
    });
  }

  return NextResponse.json(invoice, { status: 201 });
}
