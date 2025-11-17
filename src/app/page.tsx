import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  // 🔐 Check session on server
  const session = await getServerSession(authOptions);

  // If logged-in → redirect to dashboard
  if (session) {
    redirect("/dashboard");
  }

  // Else → redirect to login
  redirect("/login");
}
