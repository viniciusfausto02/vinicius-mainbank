import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { rateLimit, keyForRequest } from "@/lib/rateLimit";

function getMonthYear() {
  const d = new Date();
  return { month: d.getUTCMonth() + 1, year: d.getUTCFullYear() };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { month, year } = getMonthYear();

  const categories = await prisma.category.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
  });

  const budgets = await prisma.budget.findMany({
    where: { userId: user.id, month, year },
  });

  const ids = categories.map((c) => c.id);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));

  const totals = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: {
      categoryId: { in: ids },
      postedAt: { gte: start, lt: end },
    },
    _sum: { amountCents: true },
  });

  const mapSpent = new Map<string, number>();
  for (const t of totals) mapSpent.set(t.categoryId ?? "", Math.abs(t._sum.amountCents ?? 0));

  const result = categories.map((c) => {
    const b = budgets.find((x) => x.categoryId === c.id);
    return {
      id: c.id,
      name: c.name,
      kind: c.kind,
      limitCents: b?.limitCents ?? 0,
      spentCents: mapSpent.get(c.id) ?? 0,
    };
  });

  return NextResponse.json({ month, year, categories: result });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rateKey = keyForRequest(req, (session.user as any)?.id);
  if (!rateLimit({ key: `budget:${rateKey}`, tokensPerInterval: 10, intervalMs: 60_000 })) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const items = Array.isArray(body?.items) ? body.items : [];
  const { month, year } = getMonthYear();

  for (const it of items) {
    const categoryId = String(it.categoryId || "");
    const limitCents = Math.max(0, Number(it.limitCents || 0) | 0);
    if (!categoryId) continue;

    await prisma.budget.upsert({
      where: { userId_categoryId_month_year: { userId: user.id, categoryId, month, year } },
      create: { userId: user.id, categoryId, month, year, limitCents },
      update: { limitCents },
    });
  }

  return NextResponse.json({ ok: true });
}
