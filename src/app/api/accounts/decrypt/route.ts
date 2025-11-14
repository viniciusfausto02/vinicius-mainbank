// src/app/api/accounts/decrypt/route.ts
//
// API endpoint for decrypting sensitive account data with audit logging.
// Requires authentication and logs all decryption operations for compliance.

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { accountId, fieldName, reason } = body;

    if (!accountId || !fieldName || !reason) {
      return NextResponse.json(
        { error: "Missing required fields: accountId, fieldName, reason" },
        { status: 400 }
      );
    }

    // Verify account belongs to user
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId: user.id,
      },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Account not found or access denied" },
        { status: 404 }
      );
    }

    // Get the encrypted field value
    let encryptedValue: string | null = null;
    if (fieldName === "accountNumber" && account.encryptedAccountNumber) {
      encryptedValue = account.encryptedAccountNumber;
    } else if (fieldName === "routingNumber" && account.encryptedRoutingNumber) {
      encryptedValue = account.encryptedRoutingNumber;
    }

    if (!encryptedValue) {
      return NextResponse.json(
        { error: "Field not found or not encrypted" },
        { status: 404 }
      );
    }

    // Decrypt the value
    const decryptedValue = decrypt(encryptedValue);

    // Log the decryption operation for audit trail
    await prisma.encryptionAuditLog.create({
      data: {
        userId: user.id,
        fieldName: `Account.encrypted${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}`,
        reason,
        ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
        userAgent: req.headers.get("user-agent") || "unknown",
        meta: {
          accountId,
          accountName: account.name,
        },
      },
    });

    return NextResponse.json({
      success: true,
      value: decryptedValue,
    });
  } catch (error) {
    console.error("❌ Decrypt API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
