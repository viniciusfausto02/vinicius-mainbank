import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { rateLimit, keyForRequest } from "@/lib/rateLimit";

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rateKey = keyForRequest(req, (session.user as any)?.id);
  if (!rateLimit({ key: `txcategory:${rateKey}`, tokensPerInterval: 20, intervalMs: 60_000 })) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { accounts: { select: { id: true } } },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const transactionId = String(body.transactionId || "");
  const categoryId = body.categoryId ? String(body.categoryId) : null;

  if (!transactionId) {
    return NextResponse.json({ error: "Transaction ID required" }, { status: 400 });
  }

  const accountIds = user.accounts.map((a) => a.id);
  const tx = await prisma.transaction.findUnique({ where: { id: transactionId } });

  if (!tx) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  const owned =
    (tx.fromAccountId && accountIds.includes(tx.fromAccountId)) ||
    (tx.toAccountId && accountIds.includes(tx.toAccountId));

  if (!owned) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (categoryId) {
    const cat = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!cat || cat.userId !== user.id) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }
  }

  const updated = await prisma.transaction.update({
    where: { id: transactionId },
    data: { categoryId },
  });

  return NextResponse.json({ transaction: updated });
}
