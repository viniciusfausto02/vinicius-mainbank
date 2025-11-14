// src/app/demo/page.tsx
//
// Server component for the ViniBank demo dashboard.
// Responsibility:
// - Fetch data from PostgreSQL via Prisma (user, accounts, transactions).
// - Pass that data into the client-side DemoClient component.

import { prisma } from "@/lib/prisma";
import { Account, Transaction, User } from "@prisma/client";
import DemoClient from "./DemoClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

// Helper type: transaction including its related accounts (for table display).
export type TransactionWithAccounts = Transaction & {
  fromAccount: Account | null;
  toAccount: Account | null;
};

type UserWithAccounts = User & {
  accounts: Account[];
};

export default async function DemoPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login?callbackUrl=%2Fdemo");
  }

  const user = (await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { accounts: true },
  })) as UserWithAccounts | null;

  // If there is no user, it usually means the seed has not been run.
  if (!user) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-2xl font-semibold">ViniBank demo</h1>
          <p className="text-sm text-slate-300">
            No data was found in the database. Make sure you ran the seed
            script:
          </p>
          <pre className="mt-2 rounded-lg bg-slate-900/80 px-4 py-2 text-xs text-emerald-300">
            npm run db:seed
          </pre>
        </div>
      </main>
    );
  }

  // 2) Collect the IDs of all user accounts.
  const userAccountIds: string[] = user.accounts.map(
    (account: Account) => account.id
  );

  // 3) Load recent transactions that involve any of those accounts.
  const transactions = (await prisma.transaction.findMany({
    where: {
      OR: [
        {
          fromAccountId: {
            in: userAccountIds,
          },
        },
        {
          toAccountId: {
            in: userAccountIds,
          },
        },
      ],
    },
    include: {
      fromAccount: true,
      toAccount: true,
    },
    orderBy: {
      postedAt: "desc",
    },
    take: 10,
  })) as TransactionWithAccounts[];

  // 4) Render the client-side dashboard with this server-fetched data.
  return <DemoClient user={user} transactions={transactions} />;
}
