import Credentials from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "AdminLogin",
      credentials: { email: {}, password: {} },
      async authorize(creds) {
        const email = process.env.ADMIN_EMAIL!;
        const pass = process.env.ADMIN_PASSWORD!;
        if (creds?.email === email && creds?.password === pass)
          return { id: "1", name: "Admin", email };
        return null;
      },
    }),
  ],
  pages: { signIn: "/login" },
};
