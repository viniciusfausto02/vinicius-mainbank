import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAllowedOrigin } from "@/lib/security";
import { rateLimit, keyForRequest } from "@/lib/rateLimit";

// POST /api/register
// Expected body: { name, email, password }
export async function POST(request: Request) {
  try {
    requireAllowedOrigin(request);
    const rateKey = keyForRequest(request);
    if (!rateLimit({ key: `register:${rateKey}`, tokensPerInterval: 3, intervalMs: 60_000 })) {
      return NextResponse.json(
        { error: "Too many signups from this IP. Please wait." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { name, email, password } = body as {
      name?: string;
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "User with this email already exists." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const created = await prisma.user.create({
      data: {
        name: name ?? "",
        email,
        passwordHash,
      },
    });

    // Audit (may fail silently if schema not migrated yet during dev)
    try {
      await prisma.auditLog.create({
        data: {
          userId: created.id,
          action: "register",
          meta: { email: created.email },
        },
      });
    } catch {}

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error in /api/register:", error);
    return NextResponse.json(
      { error: "Unexpected error while creating user." },
      { status: 500 }
    );
  }
}
