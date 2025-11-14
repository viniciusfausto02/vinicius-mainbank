// src/app/api/maintenance/cleanup-idempotency/route.ts
// Deletes IdempotencyKey rows older than 24h. Protect with CRON_SECRET and admin role.

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const secret = process.env.CRON_SECRET;
    const provided = req.headers.get("x-cron-secret");
    if (!secret || provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    // @ts-ignore - model exists in schema after migration
    const result = await prisma.idempotencyKey.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });

    return NextResponse.json({ deleted: result.count });
  } catch (e) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
