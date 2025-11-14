import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanup() {
  const user = await prisma.user.findUnique({
    where: { email: "viniciusfbrehm@gmail.com" },
  });
  
  if (user) {
    await prisma.auditLog.deleteMany({ where: { userId: user.id } });
    await prisma.budget.deleteMany({ where: { userId: user.id } });
    await prisma.category.deleteMany({ where: { userId: user.id } });
    await prisma.account.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
    console.log("User and related data deleted");
  } else {
    console.log("User not found");
  }
  
  await prisma.$disconnect();
}

cleanup();
