import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createGoalSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  targetCents: z.number().int().positive(),
  targetDate: z.string().datetime().optional(),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  icon: z.string().max(10).optional(),
});

// GET /api/savings-goals - List all goals for authenticated user
export async function GET() {
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

    const goals = await prisma.savingsGoal.findMany({
      where: { userId: user.id },
      orderBy: [
        { status: "asc" }, // ACTIVE first
        { targetDate: "asc" }, // Soonest deadlines first
      ],
    });

    return Response.json({ goals });
  } catch (error) {
    console.error("Error fetching savings goals:", error);
    return Response.json(
      { error: "Failed to fetch savings goals" },
      { status: 500 }
    );
  }
}

// POST /api/savings-goals - Create new savings goal
export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const validatedData = createGoalSchema.parse(body);

    const goal = await prisma.savingsGoal.create({
      data: {
        userId: user.id,
        name: validatedData.name,
        targetCents: validatedData.targetCents,
        targetDate: validatedData.targetDate
          ? new Date(validatedData.targetDate)
          : null,
        description: validatedData.description,
        color: validatedData.color || "#3b82f6", // Default blue
        icon: validatedData.icon || "🎯",
      },
    });

    return Response.json({ goal }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating savings goal:", error);
    return Response.json(
      { error: "Failed to create savings goal" },
      { status: 500 }
    );
  }
}
