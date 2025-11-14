import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// NextAuth configuration:
// - JWT-based sessions (no extra tables needed).
// - Google OAuth provider.
// - Credentials provider using Prisma + bcrypt.
export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" ? "__Secure-vinibank.session-token" : "vinibank.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        // Find user by email in Prisma
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.passwordHash) {
          // No user or no passwordHash (maybe a Google-only account)
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValid) {
          return null;
        }

        // NextAuth expects a minimal user object here
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    // Persist the Prisma user ID in the JWT
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
      }

      if (!token.id && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
        });

        if (dbUser) {
          token.id = dbUser.id;
          ;(token as any).role = dbUser.role;
        }
      }
      if (token.id && !('role' in token)) {
        const dbUser = await prisma.user.findUnique({ where: { id: token.id as string } });
        if (dbUser) (token as any).role = dbUser.role;
      }
      return token;
    },
    // Expose that ID in the session object for client-side use
    async session({ session, token }) {
      if (session.user && token.id) {
        (session.user as any).id = token.id;
      }
      if (session.user && (token as any).role) {
        (session.user as any).role = (token as any).role;
      }
      return session;
    },
    // When a user signs in (Google or others), ensure a Prisma User exists.
    async signIn({ user, account }) {
      if (!user?.email) {
        return false;
      }

      const existing = await prisma.user.findUnique({
        where: { email: user.email },
      });

      if (!existing) {
        await prisma.user.create({
          data: {
            email: user.email,
            name: user.name ?? "",
            // passwordHash stays null for Google users
          },
        });
      }

      return true;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
