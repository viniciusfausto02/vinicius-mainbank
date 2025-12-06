// prisma/seed.ts
//
// Seed script for ViniBank.
// This fills the database with one demo user,
// three accounts (checking, savings, credit card)
// and a set of realistic transactions.
//
// You run it with: npm run db:seed

import { PrismaClient, AccountType, TransactionKind, Role, CategoryKind } from "@prisma/client";
import bcryptjs from "bcryptjs";
import { createCipheriv, randomBytes, pbkdf2Sync } from "crypto";

const prisma = new PrismaClient();

// Encryption helper (copied to avoid import issues in seed)
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

function getMasterKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || "default-dev-key-change-in-production-or-security-breach";
  const salt = process.env.ENCRYPTION_SALT || "default-dev-salt-change-in-production";
  return pbkdf2Sync(secret, salt, 100000, KEY_LENGTH, "sha256");
}

function encrypt(plaintext: string): string {
  if (!plaintext) return "";
  const key = getMasterKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();
  const combined = Buffer.concat([iv, authTag, Buffer.from(encrypted, "hex")]);
  return combined.toString("base64");
}

function hashForIndex(value: string): string {
  if (!value) return "";
  // Simple hash for index - not cryptographically secure but sufficient for DB search
  return Buffer.from(value).toString("base64").substring(0, 20);
}

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

  // Create demo savings goals
  await prisma.savingsGoal.createMany({
    data: [
      {
        userId: user.id,
        name: "Emergency Fund",
        description: "6 months of expenses for financial security",
        targetCents: 1800000, // $18,000
        currentCents: 720000, // $7,200 (40%)
        targetDate: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000), // 6 months from now
        icon: "🛡️",
        color: "#3b82f6",
        status: "ACTIVE",
      },
      {
        userId: user.id,
        name: "Vacation to Europe",
        description: "Trip to Paris, Rome and Barcelona",
        targetCents: 500000, // $5,000
        currentCents: 320000, // $3,200 (64%)
        targetDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000), // 3 months from now
        icon: "✈️",
        color: "#8b5cf6",
        status: "ACTIVE",
      },
      {
        userId: user.id,
        name: "New Laptop",
        description: "MacBook Pro for work and development",
        targetCents: 250000, // $2,500
        currentCents: 180000, // $1,800 (72%)
        targetDate: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000), // 1.5 months from now
        icon: "💻",
        color: "#10b981",
        status: "ACTIVE",
      },
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
