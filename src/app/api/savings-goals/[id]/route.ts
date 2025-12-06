import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateGoalSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  targetCents: z.number().int().positive().optional(),
  currentCents: z.number().int().nonnegative().optional(),
  targetDate: z.string().datetime().optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  icon: z.string().max(10).optional(),
  status: z.enum(["ACTIVE", "COMPLETED", "CANCELLED"]).optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/savings-goals/[id] - Get single goal
export async function GET(
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

    const goal = await prisma.savingsGoal.findUnique({
      where: { id },
    });

    if (!goal) {
      return Response.json({ error: "Goal not found" }, { status: 404 });
    }

    if (goal.userId !== user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    return Response.json({ goal });
  } catch (error) {
    console.error("Error fetching savings goal:", error);
    return Response.json(
      { error: "Failed to fetch savings goal" },
      { status: 500 }
    );
  }
}

// PUT /api/savings-goals/[id] - Update goal
export async function PUT(
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

    const body = await req.json();
    const validatedData = updateGoalSchema.parse(body);

    // Check if goal is being completed
    const isCompleting =
      validatedData.status === "COMPLETED" &&
      existingGoal.status !== "COMPLETED";

    const goal = await prisma.savingsGoal.update({
      where: { id },
      data: {
        ...validatedData,
        targetDate: validatedData.targetDate
          ? new Date(validatedData.targetDate)
          : validatedData.targetDate === null
          ? null
          : undefined,
        completedAt: isCompleting ? new Date() : undefined,
      },
    });

    return Response.json({ goal });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating savings goal:", error);
    return Response.json(
      { error: "Failed to update savings goal" },
      { status: 500 }
    );
  }
}

// DELETE /api/savings-goals/[id] - Delete goal
export async function DELETE(
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

    await prisma.savingsGoal.delete({
      where: { id },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting savings goal:", error);
    return Response.json(
      { error: "Failed to delete savings goal" },
      { status: 500 }
    );
  }
}
