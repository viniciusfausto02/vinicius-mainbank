import { prisma } from "@/lib/prisma";

async function main() {
  const email = process.env.ADMIN_EMAIL;
  if (!email) {
    console.error("ADMIN_EMAIL is required");
    process.exit(1);
  }
  const user = await prisma.user.update({ where: { email }, data: { role: "ADMIN" as any } });
  console.log("Updated user to ADMIN:", user.email);
}

main().then(()=>process.exit(0)).catch((e)=>{ console.error(e); process.exit(1); });
