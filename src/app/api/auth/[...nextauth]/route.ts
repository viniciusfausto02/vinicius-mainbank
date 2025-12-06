import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { AccountType, TransactionKind, CategoryKind } from "@prisma/client";

// Support both canonical NEXTAUTH_* and legacy AUTH_/GOOGLE_ env names
const authSecret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET ?? "";
const googleClientId = process.env.GOOGLE_CLIENT_ID ?? process.env.GOOGLE_ID ?? "";
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET ?? process.env.GOOGLE_SECRET ?? "";
const googleProviderEnabled = Boolean(googleClientId && googleClientSecret);

if (!googleProviderEnabled) {
  console.warn("Google OAuth disabled: set GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET (or GOOGLE_ID/GOOGLE_SECRET) to enable.");
}

if (!authSecret) {
  console.warn("NEXTAUTH_SECRET (or AUTH_SECRET) is missing; set it to enable stable session signing.");
}

async function ensureDemoDataForUser(userId: string) {
  const accountCount = await prisma.account.count({ where: { userId } });
  if (accountCount > 0) return;

  const checking = await prisma.account.create({
    data: {
      userId,
      type: AccountType.CHECKING,
      name: "Primary Checking",
      mask: "•••• 1023",
      currency: "USD",
      balanceCents: 342018,
      encryptedAccountNumber: "demo",
      encryptedRoutingNumber: "demo",
      accountNumberHash: "demo-checking-1023",
    },
  });

  const savings = await prisma.account.create({
    data: {
      userId,
      type: AccountType.SAVINGS,
      name: "Savings",
      mask: "•••• 8841",
      currency: "USD",
      balanceCents: 1289000,
      encryptedAccountNumber: "demo",
      encryptedRoutingNumber: "demo",
      accountNumberHash: "demo-savings-8841",
    },
  });

  const credit = await prisma.account.create({
    data: {
      userId,
      type: AccountType.CREDIT,
      name: "Credit Card",
      mask: "•••• 5529",
      currency: "USD",
      balanceCents: -64022,
      encryptedAccountNumber: "demo",
      accountNumberHash: "demo-credit-5529",
    },
  });

  const now = new Date();
  const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);

  await prisma.transaction.createMany({
    data: [
      {
        fromAccountId: checking.id,
        toAccountId: null,
        description: "Groceries · Market Nova Vida",
        amountCents: -8245,
        kind: TransactionKind.DEBIT,
        postedAt: daysAgo(2),
      },
      {
        fromAccountId: null,
        toAccountId: checking.id,
        description: "Salary · ViniTech Studio",
        amountCents: 420000,
        kind: TransactionKind.CREDIT,
        postedAt: daysAgo(5),
      },
      {
        fromAccountId: credit.id,
        toAccountId: null,
        description: "Streaming subscription",
        amountCents: -1990,
        kind: TransactionKind.DEBIT,
        postedAt: daysAgo(9),
      },
      {
        fromAccountId: checking.id,
        toAccountId: savings.id,
        description: "Transfer to savings",
        amountCents: -50000,
        kind: TransactionKind.TRANSFER,
        postedAt: daysAgo(12),
      },
      {
        fromAccountId: checking.id,
        toAccountId: null,
        description: "Coffee · Espresso Bar",
        amountCents: -650,
        kind: TransactionKind.DEBIT,
        postedAt: daysAgo(1),
      },
      {
        fromAccountId: null,
        toAccountId: credit.id,
        description: "Cashback reward",
        amountCents: 2500,
        kind: TransactionKind.CREDIT,
        postedAt: daysAgo(7),
      },
      {
        fromAccountId: savings.id,
        toAccountId: checking.id,
        description: "Transfer from savings",
        amountCents: 20000,
        kind: TransactionKind.TRANSFER,
        postedAt: daysAgo(3),
      },
      {
        fromAccountId: credit.id,
        toAccountId: null,
        description: "Restaurant dinner",
        amountCents: -7450,
        kind: TransactionKind.DEBIT,
        postedAt: daysAgo(4),
      },
    ],
  });

  // Minimal categories and budgets so dashboards don't look empty
  const food = await prisma.category.create({ data: { userId, name: "Food", kind: CategoryKind.EXPENSE } });
  const housing = await prisma.category.create({ data: { userId, name: "Housing", kind: CategoryKind.EXPENSE } });
  const salary = await prisma.category.create({ data: { userId, name: "Salary", kind: CategoryKind.INCOME } });

  const today = new Date();
  const month = today.getUTCMonth() + 1;
  const year = today.getUTCFullYear();

  await prisma.budget.createMany({
    data: [
      { userId, categoryId: food.id, month, year, limitCents: 60000 },
      { userId, categoryId: housing.id, month, year, limitCents: 120000 },
      { userId, categoryId: salary.id, month, year, limitCents: 0 },
    ],
  });

  // Create demo savings goals
  await prisma.savingsGoal.createMany({
    data: [
      {
        userId,
        name: "Emergency Fund",
        description: "6 months of expenses for financial security",
        targetCents: 1800000, // $18,000
        currentCents: 720000, // $7,200 (40%)
        targetDate: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000), // 6 months from now
        icon: "🛡️",
        color: "#3b82f6",
        status: "ACTIVE",
      },
      {
        userId,
        name: "Vacation to Europe",
        description: "Trip to Paris, Rome and Barcelona",
        targetCents: 500000, // $5,000
        currentCents: 320000, // $3,200 (64%)
        targetDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000), // 3 months from now
        icon: "✈️",
        color: "#8b5cf6",
        status: "ACTIVE",
      },
      {
        userId,
        name: "New Laptop",
        description: "MacBook Pro for work and development",
        targetCents: 250000, // $2,500
        currentCents: 180000, // $1,800 (72%)
        targetDate: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000), // 1.5 months from now
        icon: "💻",
        color: "#10b981",
        status: "ACTIVE",
      },
    ],
  });
}

// NextAuth configuration:
// - JWT-based sessions (no extra tables needed).
// - Google OAuth provider.
// - Credentials provider using Prisma + bcrypt.
export const authOptions: NextAuthOptions = {
  secret: authSecret,
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
    ...(googleClientId && googleClientSecret
      ? [GoogleProvider({ clientId: googleClientId, clientSecret: googleClientSecret })]
      : []),
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

      let dbUser = await prisma.user.findUnique({ where: { email: user.email } });

      if (!dbUser) {
        dbUser = await prisma.user.create({
          data: {
            email: user.email,
            name: user.name ?? "",
            // passwordHash stays null for Google users
          },
        });
      }

      await ensureDemoDataForUser(dbUser.id);

      return true;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
