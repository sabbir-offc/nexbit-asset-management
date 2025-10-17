"use client";

import useSWR from "swr";

/* ---------- Types ---------- */
interface VerificationLog {
  _id: string;
  invoiceNumber: string;
  ip?: string;
  userAgent?: string;
  verifiedAt: string;
}

/* ---------- Fetcher ---------- */
const fetcher = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

export default function VerificationLogsPage() {
  const { data: logs = [] } = useSWR<VerificationLog[]>(
    "/api/verify/logs",
    fetcher
  );

  return (
    <div className="space-y-8">
      {/* ===== Header ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)] tracking-tight">
            QR Verification Logs
          </h1>
          <p className="text-sm text-[var(--color-muted)]">
            Every QR scan record with time, IP, and device info.
          </p>
        </div>
        <div className="text-sm px-4 py-2 rounded-md bg-[color-mix(in srgb, var(--color-accent) 10%, transparent)] text-[var(--color-accent)] font-medium border border-[color-mix(in srgb, var(--color-accent) 30%, transparent)]">
          Total Verifications: {logs.length}
        </div>
      </div>

      {/* ===== Table Wrapper ===== */}
      <div className="relative overflow-x-auto border border-[var(--color-border)] rounded-xl shadow-sm bg-[var(--color-card)]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-[color-mix(in srgb, var(--color-accent) 6%, transparent)] text-[var(--color-foreground)] border-b border-[var(--color-border)] uppercase text-[11px] tracking-wider">
            <tr>
              <th className="py-3 px-4 text-left font-semibold">Invoice No</th>
              <th className="py-3 px-4 text-left font-semibold">IP Address</th>
              <th className="py-3 px-4 text-left font-semibold">
                Device / Browser
              </th>
              <th className="py-3 px-4 text-right font-semibold">
                Verified At
              </th>
            </tr>
          </thead>
          <tbody>
            {logs.length > 0 ? (
              logs.map((log, idx) => (
                <tr
                  key={log._id}
                  className={`border-b border-[var(--color-border)] transition-colors ${
                    idx % 2 === 0
                      ? "bg-[color-mix(in srgb, var(--color-accent) 3%, transparent)]"
                      : ""
                  } hover:bg-[color-mix(in srgb, var(--color-accent) 10%, transparent)]`}
                >
                  <td className="py-3 px-4 font-medium text-[var(--color-foreground)]">
                    {log.invoiceNumber}
                  </td>
                  <td className="py-3 px-4 text-[var(--color-muted)]">
                    {log.ip || "Unknown"}
                  </td>
                  <td className="py-3 px-4 text-[var(--color-muted)] truncate max-w-[260px]">
                    {log.userAgent || "—"}
                  </td>
                  <td className="py-3 px-4 text-right text-[var(--color-foreground)] whitespace-nowrap">
                    {new Date(log.verifiedAt).toLocaleString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="text-center py-8 text-[var(--color-muted)] italic"
                >
                  No verifications yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ===== Subtle Footer ===== */}
      <div className="pt-2 text-xs text-[var(--color-muted)] text-center">
        Showing last 100 verifications • Auto-updated via SWR
      </div>
    </div>
  );
}
