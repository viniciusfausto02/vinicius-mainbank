import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const addFundsSchema = z.object({
  amountCents: z.number().int().positive(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

// POST /api/savings-goals/[id]/add-funds - Add money to goal
export async function POST(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const { id } = await context.params;

    const existingGoal = await prisma.savingsGoal.findUnique({
      where: { id },
    });

    if (!existingGoal) {
      return Response.json({ error: "Goal not found" }, { status: 404 });
    }

    if (existingGoal.userId !== user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    if (existingGoal.status !== "ACTIVE") {
      return Response.json(
        { error: "Cannot add funds to inactive goal" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { amountCents } = addFundsSchema.parse(body);

    const newCurrentCents = existingGoal.currentCents + amountCents;

    // Check if goal is now completed
    const isCompleted = newCurrentCents >= existingGoal.targetCents;

    const goal = await prisma.savingsGoal.update({
      where: { id },
      data: {
        currentCents: newCurrentCents,
        status: isCompleted ? "COMPLETED" : "ACTIVE",
        completedAt: isCompleted ? new Date() : null,
      },
    });

    return Response.json({
      goal,
      completed: isCompleted,
      progress: (newCurrentCents / existingGoal.targetCents) * 100,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error adding funds to savings goal:", error);
    return Response.json(
      { error: "Failed to add funds to savings goal" },
      { status: 500 }
    );
  }
}
