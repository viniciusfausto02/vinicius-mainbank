// src/lib/prisma.ts
//
// PrismaClient singleton for ViniBank.
//
// In Next.js (especially in dev mode with hot reload),
// you should not create a new PrismaClient on every request,
// or you will hit the "Too many Prisma clients" warning.
//
// This file creates a single global PrismaClient instance
// and reuses it across requests.

import { PrismaClient } from "@prisma/client";

// Extend the globalThis type so we can attach prisma in dev.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// Create the PrismaClient if it does not exist yet.
// In production, this will run once per server process.
// In development, we store it on globalThis to avoid multiple instances.
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["warn", "error"], // Add "query" here while debugging if you want.
  });

// In development, attach the client to the global object
// so that hot reloads reuse the same instance.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
