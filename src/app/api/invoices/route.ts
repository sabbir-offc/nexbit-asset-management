import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import Invoice from "@/lib/models/Invoice";
import Asset from "@/lib/models/Asset";
import Movement from "@/lib/models/Movement";
import crypto from "crypto";
import { calcTotals } from "@/lib/utils/calc";

/* --------------------------------------------------
   Generate Secure Random Invoice Number
-------------------------------------------------- */
function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const randomPart = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `INV-${year}-${randomPart}`;
}

/* --------------------------------------------------
   GET - List all invoices
-------------------------------------------------- */
export async function GET() {
  try {
    await db;
    const invoices = await Invoice.find().sort({ createdAt: -1 });
    return NextResponse.json(invoices);
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("GET /invoices error:", err.message);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    console.error("GET /invoices unknown error:", err);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}

/* --------------------------------------------------
   POST - Create new invoice
-------------------------------------------------- */
export async function POST(req: NextRequest) {
  try {
    await db;
    const data = await req.json();

    if (!data.items?.length) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }

    const invoiceNumber = generateInvoiceNumber();

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

    for (const item of data.items) {
      const quantityChange =
        data.type === "purchase" ? item.quantity : -item.quantity;
      const action = data.type === "purchase" ? "purchased" : "sold";

      // Update asset stock
      await Asset.updateOne(
        { _id: item.assetId },
        { $inc: { quantity: quantityChange } }
      );

      // Record movement
      await Movement.create({
        assetId: item.assetId,
        assetName: item.name,
        action,
        type: data.type, // sale / purchase
        quantity: item.quantity,
        referenceInvoice: invoice._id,
        invoiceNumber,
        partyName: data.type === "sale" ? data.buyer : data.seller,
        remarks: `${
          action === "sold" ? "Sold" : "Purchased"
        } via ${invoiceNumber}`,
      });
    }

    return NextResponse.json(invoice, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("POST /invoices error:", err.message);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    console.error("POST /invoices unknown error:", err);
    return NextResponse.json(
      { error: "Error creating invoice" },
      { status: 500 }
    );
  }
}
