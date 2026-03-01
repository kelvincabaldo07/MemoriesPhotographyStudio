import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Only allow specific email(s)
      const allowedEmails = [
        "smile@memories-studio.com",
        "kelvin.cabaldo@gmail.com",
        "mojica.johannamay@gmail.com",
      ];
      return allowedEmails.includes(user.email || "");
    },
    async session({ session, token }) {
      return session;
    },
  },
  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },
};