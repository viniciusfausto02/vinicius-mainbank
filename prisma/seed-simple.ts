import { PrismaClient, AccountType, TransactionKind } from "@prisma/client";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

// Simple string encryption placeholder (for seed only)
function encrypt(text: string): string {
  // In production, this would use real encryption
  // For now, just return the text (seed is local only)
  return text;
}

function hashForIndex(text: string): string {
  // For seed, just return text
  return text;
}

async function main() {
  // Clean existing data (must delete in correct order due to foreign keys)
  await prisma.transaction.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.category.deleteMany();
  await prisma.encryptedUserData.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  console.log("Cleaned existing data...");

  // Create admin user with password
  // Email: vinicius@vinibank.dev
  // Password: Admin@123456
  const passwordHash = await bcryptjs.hash("Admin@123456", 12);
  const user = await prisma.user.create({
    data: {
      email: "vinicius@vinibank.dev",
      name: "Vinicius Fausto",
      passwordHash,
    },
  });

  console.log(`✅ Created user: ${user.email}`);

  // Create checking account
  const checking = await prisma.account.create({
    data: {
      userId: user.id,
      type: AccountType.CHECKING,
      name: "Primary Checking",
      mask: "•••• 1023",
      currency: "USD",
      balanceCents: 342018, // $3,420.18
      encryptedAccountNumber: encrypt("4532756279451023"),
      encryptedRoutingNumber: encrypt("021000021"),
      accountNumberHash: hashForIndex("4532756279451023"),
    },
  });

  console.log(`✅ Created checking account: ${checking.name}`);

  // Create savings account
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

  console.log(`✅ Created savings account: ${savings.name}`);

  // Create credit account
  const credit = await prisma.account.create({
    data: {
      userId: user.id,
      type: AccountType.CREDIT,
      name: "Credit Card",
      mask: "•••• 5529",
      currency: "USD",
      balanceCents: -64022, // -$640.22
      encryptedAccountNumber: encrypt("4532756279455529"),
      accountNumberHash: hashForIndex("4532756279455529"),
    },
  });

  console.log(`✅ Created credit account: ${credit.name}`);

  // Add some transactions
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
    ],
  });

  console.log(`✅ Created 4 transactions`);
  console.log("");
  console.log("🎉 SEED COMPLETED!");
  console.log("");
  console.log("Admin Login Credentials:");
  console.log("  Email:    vinicius@vinibank.dev");
  console.log("  Password: Admin@123456");
  console.log("");
  console.log("URL: http://localhost:3000/admin");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
