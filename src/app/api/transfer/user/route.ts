// src/app/api/transfer/user/route.ts
//
// Transfer money to another ViniBank user by email, phone, or CPF.
// This is the core P2P (person-to-person) transfer feature.
//
// Flow:
// 1. Validate inputs (amount, recipient identifier)
// 2. Find recipient user by email, phone, or CPF
// 3. Find their default receiving account (usually checking)
// 4. Execute atomic transfer between accounts
// 5. Log the operation for audit trail

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TransactionKind } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { rateLimit, keyForRequest } from "@/lib/rateLimit";
import { getIdempotencyKey, requireAllowedOrigin } from "@/lib/security";
import { hashForIndex } from "@/lib/encryption";

type UserTransferPayload = {
  fromAccountId: string;
  recipientEmail?: string;
  recipientPhone?: string;
  recipientCPF?: string;
  amountCents: number;
  description: string;
};

export async function POST(req: NextRequest) {
  try {
    requireAllowedOrigin(req);
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting: 10 user transfers per minute
    const rateKey = keyForRequest(req, (session?.user as any)?.id);
    if (!rateLimit({ key: `transfer:user:${rateKey}`, tokensPerInterval: 10, intervalMs: 60_000 })) {
      return NextResponse.json({ error: "Rate limit exceeded. Try again shortly." }, { status: 429 });
    }

    const body = (await req.json()) as UserTransferPayload;
    const { fromAccountId, recipientEmail, recipientPhone, recipientCPF, amountCents, description } = body;

    // Idempotency: if provided by client, reuse response
    const sender = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!sender) return NextResponse.json({ error: "User not found" }, { status: 404 });
    const idemp = getIdempotencyKey(req);
    if (idemp) {
      // @ts-ignore - will exist after migration
      const found = await prisma.idempotencyKey.findUnique({ where: { userId_endpoint_key: { userId: sender.id, endpoint: "transfer:user", key: idemp } } });
      if (found?.response) return NextResponse.json(found.response as any, { status: 200 });
    }

    // --- Validation ---
    if (!fromAccountId) {
      return NextResponse.json(
        { error: "Source account ID is required." },
        { status: 400 }
      );
    }

    const hasRecipient = recipientEmail || recipientPhone || recipientCPF;
    if (!hasRecipient) {
      return NextResponse.json(
        { error: "Recipient email, phone, or CPF is required." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      return NextResponse.json(
        { error: "Transfer amount must be a positive number." },
        { status: 400 }
      );
    }

    if (!description || description.trim().length === 0) {
      return NextResponse.json(
        { error: "Please provide a short description for this transfer." },
        { status: 400 }
      );
    }

    // --- Core transaction ---
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get sender user
      const senderUser = await tx.user.findUnique({
        where: { email: session.user?.email! },
      });

      if (!senderUser) {
        throw new Error("Sender user not found.");
      }

      // 2. Get sender's from account and verify ownership
      const fromAccount = await tx.account.findFirst({
        where: {
          id: fromAccountId,
          userId: senderUser.id,
        },
      });

      if (!fromAccount) {
        throw new Error("Source account not found or you don't have access to it.");
      }

      // 3. Find recipient user by email, phone, or CPF
      let recipientUser = null;

      if (recipientEmail) {
        recipientUser = await tx.user.findUnique({
          where: { email: recipientEmail },
        });
      }

      if (!recipientUser && recipientPhone) {
        // Search by phone in encrypted data
        const phoneHash = hashForIndex(recipientPhone);
        const encryptedData = await tx.encryptedUserData.findFirst({
          where: {
            phoneHash: phoneHash,
          },
        });
        if (encryptedData) {
          recipientUser = await tx.user.findUnique({
            where: { id: encryptedData.userId },
          });
        }
      }

      if (!recipientUser && recipientCPF) {
        // Search by CPF in encrypted data
        const ssnHash = hashForIndex(recipientCPF);
        const encryptedData = await tx.encryptedUserData.findFirst({
          where: {
            ssnHash: ssnHash,
          },
        });
        if (encryptedData) {
          recipientUser = await tx.user.findUnique({
            where: { id: encryptedData.userId },
          });
        }
      }

      if (!recipientUser) {
        throw new Error("Recipient user not found. Please check the email, phone, or CPF.");
      }

      if (senderUser.id === recipientUser.id) {
        throw new Error("You cannot transfer to yourself.");
      }

      // 4. Find recipient's default receiving account (prefer CHECKING)
      const recipientAccount = await tx.account.findFirst({
        where: {
          userId: recipientUser.id,
          type: "CHECKING", // Default to checking
        },
      });

      if (!recipientAccount) {
        // Fallback: any account of recipient
        const anyAccount = await tx.account.findFirst({
          where: { userId: recipientUser.id },
        });
        if (!anyAccount) {
          throw new Error("Recipient has no bank accounts set up.");
        }
        return processTransfer(tx, fromAccount, anyAccount, amountCents, description, senderUser, recipientUser);
      }

      return processTransfer(tx, fromAccount, recipientAccount, amountCents, description, senderUser, recipientUser);
    });

    const responseBody = { message: "Transfer to user completed successfully.", result };
    if (idemp && sender) {
      try {
        // @ts-ignore - will exist after migration
        await prisma.idempotencyKey.upsert({
          where: { userId_endpoint_key: { userId: sender.id, endpoint: "transfer:user", key: idemp } },
          create: { userId: sender.id, endpoint: "transfer:user", key: idemp, response: responseBody },
          update: { response: responseBody },
        });
      } catch {}
    }
    return NextResponse.json(responseBody, { status: 200 });
  } catch (error: unknown) {
    console.error("[transfer/user] Error:", error);

    const message =
      error instanceof Error ? error.message : "Unexpected server error.";

    return NextResponse.json(
      {
        error: message,
      },
      { status: 400 }
    );
  }
}

// Helper to process the actual transfer
async function processTransfer(tx: any, fromAccount: any, toAccount: any, amountCents: number, description: string, senderUser: any, recipientUser: any) {
  // Check balance
  if (fromAccount.balanceCents < amountCents) {
    throw new Error("Insufficient funds in the source account.");
  }

  // Update balances
  const updatedFrom = await tx.account.update({
    where: { id: fromAccount.id },
    data: { balanceCents: { decrement: amountCents } },
  });

  const updatedTo = await tx.account.update({
    where: { id: toAccount.id },
    data: { balanceCents: { increment: amountCents } },
  });

  // Create transaction records for both accounts
  // For sender: negative amount (money out)
  await tx.transaction.create({
    data: {
      fromAccountId: fromAccount.id,
      toAccountId: toAccount.id,
      description: `${description} → ${recipientUser.name || recipientUser.email}`,
      amountCents: -amountCents,
      kind: TransactionKind.TRANSFER,
    },
  });

  // For recipient: positive amount (money in)
  await tx.transaction.create({
    data: {
      fromAccountId: fromAccount.id,
      toAccountId: toAccount.id,
      description: `Transfer from ${senderUser.name || senderUser.email}: ${description}`,
      amountCents: amountCents,
      kind: TransactionKind.TRANSFER,
    },
  });

  // Audit logs
  await tx.auditLog.create({
    data: {
      userId: senderUser.id,
      action: "transfer_to_user",
      meta: {
        recipientId: recipientUser.id,
        recipientEmail: recipientUser.email,
        fromAccountId: fromAccount.id,
        toAccountId: toAccount.id,
        amountCents,
        description,
      },
    },
  });

  await tx.auditLog.create({
    data: {
      userId: recipientUser.id,
      action: "transfer_received",
      meta: {
        senderId: senderUser.id,
        senderEmail: senderUser.email,
        fromAccountId: fromAccount.id,
        toAccountId: toAccount.id,
        amountCents,
        description,
      },
    },
  });

  return {
    senderAccount: {
      id: updatedFrom.id,
      balanceCents: updatedFrom.balanceCents,
    },
    recipientAccount: {
      id: updatedTo.id,
      balanceCents: updatedTo.balanceCents,
    },
    recipientUser: {
      id: recipientUser.id,
      name: recipientUser.name,
      email: recipientUser.email,
    },
  };
}
