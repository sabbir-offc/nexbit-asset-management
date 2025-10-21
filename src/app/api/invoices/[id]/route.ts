import { db } from "@/lib/db";
import Invoice from "@/lib/models/Invoice";
import { NextRequest, NextResponse } from "next/server";

/* ---------- Type ---------- */
interface InvoiceItem {
  assetId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface InvoiceLean {
  _id: string | { toString(): string };
  invoiceNumber: string;
  type?: "sale" | "purchase";
  buyer?: string;
  seller?: string;
  items?: InvoiceItem[];
  subtotal?: number;
  discount?: number;
  vat?: number;
  grandTotal?: number;
  paidAmount?: number;
  returnedAmount?: number;
  paymentMethod?: string;
  notes?: string;
  createdAt?: Date;
}

/* ---------- GET /api/invoices/[id] ---------- */
export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db;

    // ✅ Explicitly tell Mongoose the expected document shape
    const invoiceDoc = await Invoice.findById(id).lean<InvoiceLean | null>();

    if (!invoiceDoc)
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    // ✅ No need for `any` cast — already typed
    const invoiceType = invoiceDoc.type ?? "sale";

    const formatted = {
      _id:
        typeof invoiceDoc._id === "string"
          ? invoiceDoc._id
          : invoiceDoc._id.toString(),
      invoiceNumber: invoiceDoc.invoiceNumber ?? "",
      type: invoiceType,
      buyer: invoiceDoc.buyer ?? "",
      seller: invoiceDoc.seller ?? "",
      items: invoiceDoc.items ?? [],
      subtotal: invoiceDoc.subtotal ?? 0,
      discount: invoiceDoc.discount ?? 0,
      vat: invoiceDoc.vat ?? 0,
      grandTotal: invoiceDoc.grandTotal ?? 0,
      paidAmount: invoiceDoc.paidAmount ?? 0,
      returnedAmount: invoiceDoc.returnedAmount ?? 0,
      paymentMethod: invoiceDoc.paymentMethod ?? "cash",
      notes: invoiceDoc.notes ?? "",
      createdAt: invoiceDoc.createdAt ?? new Date(),
    };

    return NextResponse.json(formatted, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("GET /api/invoices/[id] error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.error("Unknown error in /api/invoices/[id]:", error);
    return NextResponse.json(
      { error: "Failed to load invoice" },
      { status: 500 }
    );
  }
}
