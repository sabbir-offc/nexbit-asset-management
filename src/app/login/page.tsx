"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
      callbackUrl: "/dashboard",
    });

    if (res?.error) {
      toast.error("Invalid email or password");
      setLoading(false);
    } else {
      toast.success("Welcome back!");
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] transition-colors duration-300">
      <div className="w-full max-w-sm border border-[var(--color-border)] bg-[var(--color-card)] rounded-xl shadow-sm p-8">
        {/* ===== Logo / Header ===== */}
        <div className="text-center mb-6">
          <div className="text-3xl font-bold text-[var(--color-accent)]">
            Admin Login
          </div>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            Sign in to manage your assets
          </p>
        </div>

        {/* ===== Form ===== */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-[var(--color-foreground)]">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-[var(--color-border)] bg-transparent focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] outline-none transition"
              placeholder="admin@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-[var(--color-foreground)]">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-[var(--color-border)] bg-transparent focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] outline-none transition"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-md bg-[var(--color-accent)] text-white font-medium hover:bg-[var(--color-accent-hover)] transition disabled:opacity-70"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* ===== Footer ===== */}
        <p className="text-xs text-center text-[var(--color-muted)] mt-6">
          © {new Date().getFullYear()} {process.env.NEXT_PUBLIC_COMPANY_NAME}{" "}
          All rights reserved.
        </p>
      </div>
    </div>
  );
}
