import { NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { db } from "@/lib/db";
import Invoice from "@/lib/models/Invoice";

// ✅ Node runtime required for Puppeteer
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  await db;
  const invoice = await Invoice.findById(id);
  if (!invoice)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
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

    // ✅ Load your invoice page
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const targetUrl = `${baseUrl}/invoices/${id}?print=1`;

    console.log("Generating PDF from:", targetUrl);
    await page.goto(targetUrl, { waitUntil: "networkidle0" });

    // ✅ Add print-only enhancements (light background, clean margins)
    await page.addStyleTag({
      content: `
        @page {
          size: A4;
          margin: 25mm 18mm 22mm 18mm;
        }
        body {
          background: #ffffff !important;
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

    // ✅ Generate high-quality PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size:10px; color:#666; text-align:right; width:100%; padding:5px 20px; font-family:sans-serif;">
          ${
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

    // ✅ Convert Uint8Array → Buffer for NextResponse
    const buffer = Buffer.from(pdfBuffer);

    // ✅ Return the generated PDF
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("PDF generation failed:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    console.error("Unknown error during PDF generation:", error);
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}
