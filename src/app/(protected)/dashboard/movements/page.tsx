"use client";

import useSWR from "swr";

/* ---------- Types ---------- */
interface Movement {
  _id: string;
  assetId: string;
  assetName: string;
  action: string;
  quantity: number;
  remarks?: string;
  createdAt: string;
}

const fetcher = async (url: string): Promise<Movement[]> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch movements");
  return res.json();
};

export default function MovementsPage() {
  const { data: movements = [] } = useSWR<Movement[]>(
    "/api/movements",
    fetcher
  );

  return (
    <div className="space-y-8 transition-colors duration-300">
      <div>
        <h1 className="text-2xl font-bold">Stock Movements</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Every change in asset quantity or status is recorded here.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-[color-mix(in srgb, var(--color-accent) 5%, transparent)]">
            <tr className="text-left text-[var(--color-muted)] border-b border-[var(--color-border)]">
              <th className="px-4 py-2 font-medium">Asset Name</th>
              <th className="px-4 py-2 font-medium">Action</th>
              <th className="px-4 py-2 font-medium text-right">Quantity</th>
              <th className="px-4 py-2 font-medium">Remarks</th>
              <th className="px-4 py-2 font-medium">Date</th>
            </tr>
          </thead>

          <tbody>
            {movements.length > 0 ? (
              movements.map((m) => (
                <tr
                  key={m._id}
                  className="border-b border-[var(--color-border)] hover:bg-[color-mix(in srgb, var(--color-accent) 5%, transparent)] transition"
                >
                  <td className="px-4 py-2">{m.assetName}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        m.action.includes("added") ||
                        m.action.includes("increased")
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                          : m.action.includes("deleted") ||
                            m.action.includes("decreased")
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                      }`}
                    >
                      {m.action}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">{m.quantity}</td>
                  <td className="px-4 py-2 text-[var(--color-muted)]">
                    {m.remarks || "-"}
                  </td>
                  <td className="px-4 py-2 text-[var(--color-muted)]">
                    {new Date(m.createdAt).toLocaleString("en-BD", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="text-center text-[var(--color-muted)] py-6"
                >
                  No movements logged yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
