import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Verify Invoice | NeXbit Ltd.",
};

export default async function VerifyInvoicePage({
  params,
}: {
  params: { invoiceNumber: string };
}) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const res = await fetch(
    `${baseUrl}/api/invoices/verify/${params.invoiceNumber}`,
    {
      cache: "no-store",
    }
  );

  if (!res.ok) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-neutral-900 px-4">
        <div className="max-w-md w-full bg-white dark:bg-neutral-800 rounded-2xl shadow-lg border border-gray-200 dark:border-neutral-700 p-8 text-center space-y-5">
          <div className="flex flex-col items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-14 w-14 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-.01-6a9 9 0 110 18 9 9 0 010-18z"
              />
            </svg>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              Invalid or Not Found
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              This invoice number does not exist or may have been deleted.
            </p>
          </div>

          <div className="bg-gray-100 dark:bg-neutral-700 rounded-lg p-4 text-left space-y-2 text-sm border border-gray-200 dark:border-neutral-600">
            <p>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                Invoice No:
              </span>{" "}
              {params.invoiceNumber}
            </p>
            <p className="text-gray-500 dark:text-gray-400">
              Please verify the QR code source or contact NeXbit Ltd.
            </p>
          </div>

          <Link
            href="/"
            className="inline-block mt-4 px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition"
          >
            Back to Dashboard
          </Link>

          <p className="text-xs text-gray-500 dark:text-gray-500 mt-6">
            © {new Date().getFullYear()} NeXbit Ltd. All rights reserved.
          </p>
        </div>
      </div>
    );
  }

  const invoice = await res.json();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-neutral-900 px-4 py-10">
      <div className="max-w-md w-full bg-white dark:bg-neutral-800 rounded-2xl shadow-lg border border-gray-200 dark:border-neutral-700 p-8 text-center space-y-5">
        <div className="flex flex-col items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-14 w-14 text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Verified Invoice
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            This invoice is verified and issued by NeXbit Ltd.
          </p>
        </div>

        <div className="bg-gray-100 dark:bg-neutral-700 rounded-lg p-4 text-left space-y-2 text-sm border border-gray-200 dark:border-neutral-600">
          <p>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Invoice No:
            </span>{" "}
            {invoice.invoiceNumber}
          </p>
          <p>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Buyer:
            </span>{" "}
            {invoice.buyer}
          </p>
          <p>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Grand Total:
            </span>{" "}
            ৳ {invoice.grandTotal.toFixed(2)}
          </p>
          <p>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Date:
            </span>{" "}
            {new Date(invoice.createdAt).toLocaleDateString()}
          </p>
        </div>

        <a
          href={`/invoices/${invoice._id}`}
          className="inline-block mt-4 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition"
        >
          View Full Invoice
        </a>

        <p className="text-xs text-gray-500 dark:text-gray-500 mt-6">
          © {new Date().getFullYear()} NeXbit Ltd. All rights reserved.
        </p>
      </div>
    </div>
  );
}
