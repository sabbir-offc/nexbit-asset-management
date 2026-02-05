import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Toaster } from "react-hot-toast";

export const metadata = {
  title: "Admin Asset Management",
  description: "Company asset and invoice management dashboard",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 🧩 Server-side session check
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <html lang="en">
      <body className="bg-[var(--color-background)] text-[var(--color-foreground)] transition-colors duration-300">
        <div className="flex min-h-screen">
          {/* ===== Sidebar ===== */}
          <aside className="w-60 border-r border-[var(--color-border)] bg-[var(--color-card)] shadow-sm flex flex-col">
            {/* Logo/Header */}
            <div className="p-4 text-lg font-semibold border-b border-[var(--color-border)] text-[var(--color-foreground)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--color-accent)]"></span>
              <span>Assets Admin</span>
            </div>

            {/* Navigation */}
            <nav className="flex flex-col p-2 text-sm space-y-1 mt-2">
              {[
                { href: "/dashboard", label: "Dashboard" },
                { href: "/dashboard/assets", label: "Assets" },
                { href: "/dashboard/invoices", label: "Invoices" },
                { href: "/dashboard/movements", label: "Movements" },
                { href: "/dashboard/reports", label: "Reports" },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="p-2 rounded-md transition-colors duration-200 hover:bg-[color-mix(in srgb, var(--color-accent) 10%, transparent)] hover:text-[var(--color-accent)]"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            {/* Footer note */}
            <div className="mt-auto p-3 text-xs text-[var(--color-muted)] border-t border-[var(--color-border)]">
              © {new Date().getFullYear()}{" "}
              {process.env.NEXT_PUBLIC_COMPANY_NAME}
            </div>
          </aside>

          {/* ===== Main Area ===== */}
          <main className="flex-1 p-6 bg-[var(--color-background)] overflow-y-auto">
            {children}
          </main>
        </div>

        {/* Toasts */}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "var(--color-card)",
              color: "var(--color-foreground)",
              border: "1px solid var(--color-border)",
            },
          }}
        />
      </body>
    </html>
  );
}
