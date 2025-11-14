"use client";

// src/app/demo/DemoClient.tsx
//
// Client-side UI for the ViniBank demo dashboard.
//
// Responsibilities:
// - Render the dashboard layout (header, account cards, transfer form,
//   recent transactions).
// - Use the custom `useLanguage` hook to translate all visible strings.
// - Stay fully mobile-first and responsive.
// - Receive *data* (user, accounts, transactions) from the server
//   via props. This keeps Prisma on the server and React UI on the client.

import { useState } from "react";
import { Account, TransactionKind, User } from "@prisma/client";
import { useLanguage } from "@/contexts/LanguageContext";
import TransferForm from "./TransferForm";
import UserTransferForm from "./UserTransferForm";
import type { TransactionWithAccounts } from "./page";
import dynamic from "next/dynamic";
const InsightsPanel = dynamic(() => import("./InsightsPanel"), { ssr: false });
const BudgetsPanel = dynamic(() => import("./BudgetsPanel"), { ssr: false });
const CategoryManager = dynamic(() => import("./CategoryManager"), { ssr: false });
import ReclassifyDropdown from "./ReclassifyDropdown";
import Tabs from "@/components/Tabs";
const TransactionsTable = dynamic(() => import("./TransactionsTable"), { ssr: false });

type UserWithAccounts = User & {
  accounts: Account[];
};

// Helper: format an integer amount in cents as a currency string.
// We use the active locale ("en" or "pt") so numbers display naturally.
function formatCurrency(amountCents: number, locale: string): string {
  const amount = amountCents / 100;

  const currency = "USD"; // could be dynamic per-account in the future

  return new Intl.NumberFormat(locale === "pt" ? "pt-BR" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Helper: compute a simple summary total of all account balances.
function computeNetWorth(accounts: { balanceCents: number }[]): number {
  return accounts.reduce(
    (sum: number, acc: { balanceCents: number }) => sum + acc.balanceCents,
    0
  );
}

type DemoClientProps = {
  user: UserWithAccounts;
  transactions: TransactionWithAccounts[];
};

export default function DemoClient({ user, transactions }: DemoClientProps) {
  const { t, locale } = useLanguage();
  const [refreshKey, setRefreshKey] = useState(0);
  const netWorthCents: number = computeNetWorth(user.accounts);

  function labelAccountType(type: Account["type"]): string {
    switch (type) {
      case "CHECKING":
        return t("accountTypeChecking");
      case "SAVINGS":
        return t("accountTypeSavings");
      case "CREDIT":
        return t("accountTypeCredit");
      default:
        return String(type).toString();
    }
  }

  function labelTxKind(kind: TransactionKind): string {
    switch (kind) {
      case TransactionKind.DEBIT:
        return t("transactionKindDebit");
      case TransactionKind.CREDIT:
        return t("transactionKindCredit");
      case TransactionKind.TRANSFER:
        return t("transactionKindTransfer");
      default:
        return String(kind).toString();
    }
  }

  return (
    <main className="relative h-full overflow-hidden bg-slate-950 text-slate-50">
      {/* Subtle background - more professional */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-[0.2]" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/95 to-slate-900" />
      </div>

      {/* Main content container fills viewport and can internally scroll */}
      <div className="mx-auto max-w-7xl h-full overflow-auto px-4 py-6 md:px-6 md:py-8">
        {/* ====================== HEADER ====================== */}
        <header className="space-y-6">
          {/* Welcome section */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">
                {t("demoHeaderWelcomePrefix")}
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                {user.name ?? t("demoAnonymousUser")}
              </h1>
            </div>
            <div className="hidden md:flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">{t("demoLiveBadge")}</span>
            </div>
          </div>

          {/* Total balance card - prominent */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/95 to-slate-900/80 p-8 shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.1),transparent_70%)]" />
            <div className="relative space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium uppercase tracking-wider text-slate-400">
                  {t("demoTotalBalanceLabel")}
                </p>
                <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-5xl font-bold tracking-tight text-white">
                {formatCurrency(netWorthCents, locale)}
              </p>
              <p className="text-sm text-slate-400">
                {t("demoTotalBalanceHelper")}
              </p>
            </div>
          </div>
        </header>

        {/* ====================== TABBED CONTENT ====================== */}
        <Tabs
          items={[
            { key: "overview", label: (<span className="inline-flex items-center gap-2"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8v-10h-8v10zm0-18v6h8V3h-8z"/></svg>{t("tabsOverview")}</span>) },
            { key: "accounts", label: (<span className="inline-flex items-center gap-2"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3 7l9-4 9 4v2H3V7zm0 4h18v8H3v-8z"/></svg>{t("tabsAccounts")}</span>) },
            { key: "transfer", label: (<span className="inline-flex items-center gap-2"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5-5 5 5H7zm10 4l-5 5-5-5h10z"/></svg>{t("tabsTransfer")}</span>) },
            { key: "insights", label: (<span className="inline-flex items-center gap-2"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17h2v-7H3v7zm4 0h2V7H7v10zm4 0h2v-4h-2v4zm4 0h2V4h-2v13zm4 0h2V9h-2v8z"/></svg>{t("tabsInsights")}</span>) },
            { key: "budgets", label: (<span className="inline-flex items-center gap-2"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M21 7H3V5h18v2zm0 4H3V9h18v2zm0 4H3v-2h18v2zm0 4H3v-2h18v2z"/></svg>{t("tabsBudgets")}</span>) },
            { key: "categories", label: (<span className="inline-flex items-center gap-2"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z"/></svg>{t("tabsCategories")}</span>) },
            { key: "transactions", label: (<span className="inline-flex items-center gap-2"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3 5h18v2H3V5zm0 4h12v2H3V9zm0 4h18v2H3v-2zm0 4h12v2H3v-2z"/></svg>{t("tabsTransactions")}</span>) },
          ]}
          defaultKey="overview"
          persistKey="demo-tabs"
          className="mt-6"
        >
          {/* Overview Panel */}
          <div className="space-y-4">
            <InsightsPanel />
            <TransactionsTable transactions={transactions} accounts={user.accounts} compact limit={5} />
          </div>

          {/* Accounts Panel */}
          <div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {user.accounts.map((account: Account) => (
                <div key={account.id} className="group relative overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/95 to-slate-800/90 p-6 shadow-lg transition-all duration-300 hover:border-slate-700 hover:shadow-xl">
                  <div className="mb-6 flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{labelAccountType(account.type)}</p>
                      <p className="mt-1 text-sm font-semibold text-white">{account.name}</p>
                    </div>
                    <div className="rounded-lg bg-slate-950/50 px-3 py-1.5"><p className="font-mono text-xs text-slate-300">••{account.mask}</p></div>
                  </div>
                  <div className="mb-6">
                    <p className="text-xs text-slate-400">{t("demoAvailableBalanceShort")}</p>
                    <p className="mt-1 text-3xl font-bold tracking-tight text-white">{formatCurrency(account.balanceCents, locale)}</p>
                  </div>
                  <div className="mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-400">{t("demoCardAccount")}</p>
                        <p className="mt-1 font-mono text-sm text-white">{account.mask}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400">{t("demoTypeLabel")}</p>
                        <p className="mt-1 text-sm font-semibold text-emerald-400">{labelAccountType(account.type)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
                    <span className="text-xs font-medium text-slate-500">{account.currency}</span>
                    <button className="text-xs font-medium text-emerald-400 transition-colors hover:text-emerald-300">{t("demoViewDetailsLink")}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transfer Panel */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white">{t("demoQuickTransfer")}</h3>
              <TransferForm accounts={user.accounts} onTransferSuccess={() => setRefreshKey((k) => k + 1)} />
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white">{t("demoSendMoney")}</h3>
              <UserTransferForm accounts={user.accounts} onTransferSuccess={() => setRefreshKey((k) => k + 1)} />
            </div>
          </div>

          {/* Insights Panel */}
          <div>
            <InsightsPanel />
          </div>

          {/* Budgets Panel */}
          <div>
            <BudgetsPanel onBudgetUpdate={() => setRefreshKey((k) => k + 1)} />
          </div>

          {/* Categories Panel */}
          <div>
            <CategoryManager onCategoryChange={() => setRefreshKey((k) => k + 1)} />
          </div>

          {/* Transactions Panel */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">{t("demoRecentTransactions")}</h3>
              <button className="rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-slate-700 hover:text-white">{t("demoExportButton")}</button>
            </div>
            <div>
              <TransactionsTable transactions={transactions} accounts={user.accounts} />
            </div>
          </div>
        </Tabs>
      </div>
    </main>
  );
}
