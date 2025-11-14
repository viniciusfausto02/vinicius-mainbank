import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  try {
    const passwordHash = await bcryptjs.hash("User@123456", 12);
    const user = await prisma.user.create({
      data: {
        email: "joao@vinibank.dev",
        name: "João Silva",
        passwordHash,
      },
    });

    console.log(`✅ Created user: ${user.email}`);

    const checking = await prisma.account.create({
      data: {
        userId: user.id,
        type: "CHECKING",
        name: "Checking Account",
        mask: "•••• 5678",
        currency: "USD",
        balanceCents: 500000,
        accountNumberHash: "ACCOUNT_5678",
      },
    });

    console.log(`✅ Created account: ${checking.name}`);
    console.log("");
    console.log("New User Credentials:");
    console.log("  Email:    joao@vinibank.dev");
    console.log("  Password: User@123456");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
