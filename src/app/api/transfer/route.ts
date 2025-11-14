// src/app/api/transfer/route.ts
//
// Transfer API endpoint for ViniBank.
//
// This route receives a POST request with:
//   - fromAccountId: string
//   - toAccountId: string
//   - amountCents: number (positive integer)
//   - description: string
//
// It then:
//   1. Validates the payload.
//   2. Runs a database transaction using Prisma.$transaction.
//      - Decrements the balance of the "from" account.
//      - Increments the balance of the "to" account.
//      - Creates a Transaction record of kind TRANSFER.
//   3. Returns the updated balances as JSON.
//
// This is the “backend brain” that the frontend form calls, proving
// to recruiters that you’re doing real full-stack work.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TransactionKind } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { rateLimit, keyForRequest } from "@/lib/rateLimit";
import { getIdempotencyKey, requireAllowedOrigin } from "@/lib/security";

type TransferPayload = {
  fromAccountId: string;
  toAccountId: string;
  amountCents: number;
  description: string;
};

export async function POST(req: NextRequest) {
  try {
    requireAllowedOrigin(req);
    const session = await getServerSession(authOptions);
    const rateKey = keyForRequest(req, (session?.user as any)?.id);
    if (!rateLimit({ key: `transfer:${rateKey}`, tokensPerInterval: 5, intervalMs: 60_000 })) {
      return NextResponse.json({ error: "Rate limit exceeded. Try again shortly." }, { status: 429 });
    }

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const idemp = getIdempotencyKey(req);
    if (idemp) {
      // @ts-ignore - available after Prisma migrate
      const found = await prisma.idempotencyKey.findUnique({
        where: { userId_endpoint_key: { userId: user.id, endpoint: "transfer", key: idemp } },
      });
      if (found?.response) {
        return NextResponse.json(found.response as any, { status: 200 });
      }
    }

    const body = (await req.json()) as TransferPayload;

    const { fromAccountId, toAccountId, amountCents, description } = body;

    // --- Basic validation layer (input sanity) ------------------------

    if (!fromAccountId || !toAccountId) {
      return NextResponse.json(
        { error: "Both source and destination accounts are required." },
        { status: 400 }
      );
    }

    if (fromAccountId === toAccountId) {
      return NextResponse.json(
        { error: "You cannot transfer to the same account." },
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

    // --- Core business logic inside a DB transaction -----------------
    //
    // Using prisma.$transaction ensures all changes happen atomically:
    // - If anything fails in the callback, *nothing* is committed.
    // - This is exactly what you want for banking-style operations.

    const result = await prisma.$transaction(async (tx) => {
      const fromAccount = await tx.account.findUnique({
        where: { id: fromAccountId },
      });

      const toAccount = await tx.account.findUnique({
        where: { id: toAccountId },
      });

      if (!fromAccount || !toAccount) {
        throw new Error("One or both accounts do not exist.");
      }

      // Confirm both accounts belong to the authenticated user
      if (fromAccount.userId !== user.id || toAccount.userId !== user.id) {
        throw new Error("Account ownership verification failed.");
      }

      if (fromAccount.balanceCents < amountCents) {
        throw new Error("Insufficient funds in the source account.");
      }

      // Update balances:
      // - Decrement fromAccount by amountCents
      // - Increment toAccount by amountCents
      const updatedFrom = await tx.account.update({
        where: { id: fromAccountId },
        data: {
          balanceCents: {
            decrement: amountCents,
          },
        },
      });

      const updatedTo = await tx.account.update({
        where: { id: toAccountId },
        data: {
          balanceCents: {
            increment: amountCents,
          },
        },
      });

      // Record the movement in the Transaction table.
      // We store amountCents as a positive number and mark it as TRANSFER.
      const createdTx = await tx.transaction.create({
        data: {
          fromAccountId,
          toAccountId,
          description,
          amountCents: -amountCents, // negative == money leaving the source
          kind: TransactionKind.TRANSFER,
        },
      });

      // Audit log
      const actingUser = session?.user?.email
        ? await tx.user.findUnique({ where: { email: session!.user!.email! } })
        : null;
      if (actingUser) {
        await tx.auditLog.create({
          data: {
            userId: actingUser.id,
            action: "transfer",
            meta: {
              fromAccountId,
              toAccountId,
              amountCents,
              description,
            },
          },
        });
      }

      return {
        fromAccount: {
          id: updatedFrom.id,
          balanceCents: updatedFrom.balanceCents,
        },
        toAccount: {
          id: updatedTo.id,
          balanceCents: updatedTo.balanceCents,
        },
        transactionId: createdTx.id,
      };
    });

    // --- Success response ---------------------------------------------

    const responseBody = { message: "Transfer completed successfully.", result };

    if (idemp) {
      // Store idempotency record for 24h (implicit TTL handled by periodic cleanup in real systems)
      try {
        // @ts-ignore - available after Prisma migrate
        await prisma.idempotencyKey.upsert({
          where: { userId_endpoint_key: { userId: user.id, endpoint: "transfer", key: idemp } },
          create: { userId: user.id, endpoint: "transfer", key: idemp, transactionId: result.transactionId, response: responseBody },
          update: { transactionId: result.transactionId, response: responseBody },
        });
      } catch {}
    }

    return NextResponse.json(responseBody, { status: 200 });
  } catch (error: unknown) {
    console.error("[transfer] Error while processing transfer:", error);

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
