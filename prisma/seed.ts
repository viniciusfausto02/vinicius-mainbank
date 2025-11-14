// prisma/seed.ts
//
// Seed script for ViniBank.
// This fills the database with one demo user,
// three accounts (checking, savings, credit card)
// and a set of realistic transactions.
//
// You run it with: npm run db:seed

import { PrismaClient, AccountType, TransactionKind, Role, CategoryKind } from "@prisma/client";
import { encrypt, hashForIndex } from "../src/lib/encryption.js";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Clean existing data (safe for local dev / demo).
  // In production you would NOT blindly delete everything like this.
  await prisma.transaction.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // Create a demo user (you) with hashed password.
  // Email: vinicius@vinibank.dev
  // Password: Admin@123456
  const passwordHash = await bcryptjs.hash("Admin@123456", 12);
  const user = await prisma.user.create({
    data: {
      email: "vinicius@vinibank.dev",
      name: "Vinicius Fausto",
      role: Role.ADMIN,
      passwordHash,
    },
  });

  // Create encrypted sensitive user data
  await prisma.encryptedUserData.create({
    data: {
      userId: user.id,
      encryptedSSN: encrypt("123-45-6789"),
      ssnHash: hashForIndex("123-45-6789"),
      encryptedLegalName: encrypt("Vinicius Fausto Silva"),
      encryptedDateOfBirth: encrypt("1995-03-15"),
      encryptedPhoneNumber: encrypt("+1-555-0123"),
      phoneHash: hashForIndex("+1-555-0123"),
      encryptedAddress: encrypt("123 Main Street, San Francisco, CA 94102"),
    },
  });

  // Create accounts for this user.
  const checking = await prisma.account.create({
    data: {
      userId: user.id,
      type: AccountType.CHECKING,
      name: "Primary checking",
      mask: "•••• 1023",
      currency: "USD",
      balanceCents: 342018, // $3,420.18
      encryptedAccountNumber: encrypt("4532756279451023"),
      encryptedRoutingNumber: encrypt("021000021"),
      accountNumberHash: hashForIndex("4532756279451023"),
    },
  });

  const savings = await prisma.account.create({
    data: {
      userId: user.id,
      type: AccountType.SAVINGS,
      name: "Savings",
      mask: "•••• 8841",
      currency: "USD",
      balanceCents: 1289000, // $12,890.00
      encryptedAccountNumber: encrypt("4532756279458841"),
      encryptedRoutingNumber: encrypt("021000021"),
      accountNumberHash: hashForIndex("4532756279458841"),
    },
  });

  const credit = await prisma.account.create({
    data: {
      userId: user.id,
      type: AccountType.CREDIT,
      name: "Credit card",
      mask: "•••• 5529",
      currency: "USD",
      balanceCents: -64022, // -$640.22
      encryptedAccountNumber: encrypt("4532756279455529"),
      accountNumberHash: hashForIndex("4532756279455529"),
    },
  });

  // Create some transactions so the demo dashboard feels alive.
  await prisma.transaction.createMany({
    data: [
      {
        fromAccountId: checking.id,
        toAccountId: null,
        description: "Groceries · Market Nova Vida",
        amountCents: -8245,
        kind: TransactionKind.DEBIT,
      },
      {
        fromAccountId: null,
        toAccountId: checking.id,
        description: "Salary · ViniTech Studio",
        amountCents: 420000,
        kind: TransactionKind.CREDIT,
      },
      {
        fromAccountId: credit.id,
        toAccountId: null,
        description: "Streaming subscription",
        amountCents: -1990,
        kind: TransactionKind.DEBIT,
      },
      {
        fromAccountId: checking.id,
        toAccountId: savings.id,
        description: "Transfer to savings",
        amountCents: -50000,
        kind: TransactionKind.TRANSFER,
      },
      {
        fromAccountId: checking.id,
        toAccountId: null,
        description: "Coffee shop · Bairro Central",
        amountCents: -1575,
        kind: TransactionKind.DEBIT,
      },
      {
        fromAccountId: null,
        toAccountId: savings.id,
        description: "Bonus · Year-end payout",
        amountCents: 250000,
        kind: TransactionKind.CREDIT,
      },
    ],
  });

  // Categories (basic set)
  const groceries = await prisma.category.create({
    data: { userId: user.id, name: "Groceries", kind: CategoryKind.EXPENSE },
  });
  const entertainment = await prisma.category.create({
    data: { userId: user.id, name: "Entertainment", kind: CategoryKind.EXPENSE },
  });
  const subscriptions = await prisma.category.create({
    data: { userId: user.id, name: "Subscriptions", kind: CategoryKind.EXPENSE },
  });
  const income = await prisma.category.create({
    data: { userId: user.id, name: "Income", kind: CategoryKind.INCOME },
  });

  // Attach categories to a few existing transactions
  await prisma.transaction.updateMany({
    where: { description: { contains: "Groceries" } },
    data: { categoryId: groceries.id },
  });
  await prisma.transaction.updateMany({
    where: { description: { contains: "Streaming subscription" } },
    data: { categoryId: subscriptions.id },
  });
  await prisma.transaction.updateMany({
    where: { description: { contains: "Salary" } },
    data: { categoryId: income.id },
  });

  // Budgets for current month
  const now = new Date();
  const month = now.getUTCMonth() + 1;
  const year = now.getUTCFullYear();
  await prisma.budget.createMany({
    data: [
      { userId: user.id, categoryId: groceries.id, month, year, limitCents: 40000 },
      { userId: user.id, categoryId: entertainment.id, month, year, limitCents: 15000 },
      { userId: user.id, categoryId: subscriptions.id, month, year, limitCents: 10000 },
    ],
  });

  console.log("✅ Seed completed successfully.");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
