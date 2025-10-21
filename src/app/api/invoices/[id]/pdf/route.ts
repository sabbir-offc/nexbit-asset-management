import { NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { db } from "@/lib/db";
import Invoice from "@/lib/models/Invoice";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await db;

    // ✅ Explicitly narrow type after query
    const invoiceDoc = await Invoice.findById(id).lean();
    if (!invoiceDoc)
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    // ✅ Ensure correct type assertion
    const invoice = invoiceDoc as unknown as {
      _id: string;
      invoiceNumber: string;
      type?: "sale" | "purchase";
    };

    // ✅ Fallback defaults for older invoices
    const invoiceType = invoice?.type ?? "sale";
    const label =
      invoiceType === "purchase" ? "Purchase Invoice" : "Sale Invoice";

    // ✅ Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
      executablePath:
        process.env.PUPPETEER_EXECUTABLE_PATH || puppeteer.executablePath(),
    });

    const page = await browser.newPage();

    // ✅ Load the print layout
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const targetUrl = `${baseUrl}/invoices/${id}?print=1`;

    console.log(`📄 Generating ${label} PDF from:`, targetUrl);
    await page.goto(targetUrl, { waitUntil: "networkidle0" });

    // ✅ Clean print style
    await page.addStyleTag({
      content: `
        @page {
          size: A4;
          margin: 25mm 18mm 22mm 18mm;
        }
        body {
          background: #fff !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color: #111 !important;
          font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
          font-size: 12px;
          line-height: 1.5;
          margin: 0;
          padding: 0;
        }
      `,
    });

    // ✅ Generate PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size:10px; color:#666; text-align:right; width:100%; padding:5px 20px; font-family:sans-serif;">
          ${label} — ${
        invoice.invoiceNumber
      } — Generated ${new Date().toLocaleDateString()}
        </div>`,
      footerTemplate: `
        <div style="font-size:10px; color:#999; text-align:center; width:100%; font-family:sans-serif; padding-bottom:4px;">
          Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>`,
      margin: { top: "25mm", bottom: "18mm", left: "18mm", right: "18mm" },
      preferCSSPageSize: true,
    });

    await browser.close();

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error("❌ PDF generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate invoice PDF" },
      { status: 500 }
    );
  }
}
