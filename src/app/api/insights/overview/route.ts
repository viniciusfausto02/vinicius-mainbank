import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { accounts: { select: { id: true } } },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const ids = user.accounts.map((a) => a.id);
  if (ids.length === 0) return NextResponse.json({ totals: { income: 0, expense: 0 }, series: [] });

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const txs = await prisma.transaction.findMany({
    where: {
      postedAt: { gte: since },
      OR: [{ fromAccountId: { in: ids } }, { toAccountId: { in: ids } }],
    },
    orderBy: { postedAt: "asc" },
  });

  let income = 0;
  let expense = 0;
  const byDay = new Map<string, number>();

  for (const tx of txs) {
    const day = tx.postedAt.toISOString().slice(0, 10);
    const sign = tx.amountCents >= 0 ? 1 : -1;
    const current = byDay.get(day) || 0;
    byDay.set(day, current + tx.amountCents);
    if (sign > 0) income += tx.amountCents; else expense += -tx.amountCents;
  }

  const series = Array.from(byDay.entries()).map(([date, netCents]) => ({ date, netCents }));

  return NextResponse.json({
    totals: { income, expense },
    series,
  });
}
