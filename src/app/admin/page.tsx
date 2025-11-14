import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login?callbackUrl=%2Fadmin");

  const me = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!me || me.role !== "ADMIN") redirect("/");

  const [users, accounts, transactions, logs] = await Promise.all([
    prisma.user.count(),
    prisma.account.count(),
    prisma.transaction.count(),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { user: { select: { email: true, name: true } } },
    }),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 text-slate-100">
      <h1 className="text-2xl font-semibold">Admin dashboard</h1>
      <p className="mt-1 text-sm text-slate-400">Quick stats and recent audit logs.</p>

      <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <p className="text-xs text-slate-400">Users</p>
          <p className="text-xl font-semibold">{users}</p>
        </article>
        <article className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <p className="text-xs text-slate-400">Accounts</p>
          <p className="text-xl font-semibold">{accounts}</p>
        </article>
        <article className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <p className="text-xs text-slate-400">Transactions</p>
          <p className="text-xl font-semibold">{transactions}</p>
        </article>
      </section>

      <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Recent audit logs</p>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-[0.18em] text-slate-400 border-b border-slate-800">
                <th className="py-2 pr-4">When</th>
                <th className="py-2 pr-4">User</th>
                <th className="py-2 pr-4">Action</th>
                <th className="py-2">Meta</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-slate-800 last:border-0">
                  <td className="py-2 pr-4">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="py-2 pr-4">{log.user?.name || log.user?.email}</td>
                  <td className="py-2 pr-4">{log.action}</td>
                  <td className="py-2">
                    <pre className="text-xs text-slate-300 whitespace-pre-wrap">{JSON.stringify(log.meta ?? {}, null, 2)}</pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
