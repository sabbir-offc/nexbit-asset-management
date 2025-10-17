import { db } from "@/lib/db";
import Invoice from "@/lib/models/Invoice";
import VerificationLog from "@/lib/models/VerificationLog";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  context: { params: Promise<{ invoiceNumber: string }> }
) {
  const { invoiceNumber } = await context.params;

  await db;

  const invoice = await Invoice.findOne({ invoiceNumber });
  if (!invoice) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Extract client info
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const userAgent = req.headers.get("user-agent") || "unknown";

  // Log verification
  await VerificationLog.create({
    invoiceNumber,
    ip,
    userAgent,
  });

  return NextResponse.json(invoice);
}
