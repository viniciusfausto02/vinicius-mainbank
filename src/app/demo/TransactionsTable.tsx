"use client";

import { useEffect, useMemo, useState } from "react";
import { TransactionKind, Account } from "@prisma/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import type { TransactionWithAccounts } from "./page";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { formatCurrencyWithRates } from "@/lib/currency";
import { useExchangeRates } from "@/lib/useExchangeRates";

type TransactionsTableProps = {
  transactions: TransactionWithAccounts[];
  accounts: Account[];
  compact?: boolean;
  limit?: number;
};

export default function TransactionsTable({ transactions, accounts, compact, limit }: TransactionsTableProps) {
  const { t, locale } = useLanguage();
  const { currency } = useCurrency();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [typeFilter, setTypeFilter] = useState<string>(params.get("tf") ?? "all");
  const [accountFilter, setAccountFilter] = useState<string>(params.get("af") ?? "all");
  const [search, setSearch] = useState<string>(params.get("q") ?? "");
  const [sort, setSort] = useState<string>(params.get("sort") ?? "date_desc");
  const [dateRange, setDateRange] = useState<string>(params.get("dr") ?? "all");
  const [page, setPage] = useState<number>(Number(params.get("p") ?? 1));
  const pageSize = 10;
  const { rates } = useExchangeRates();
  const formatMoney = useMemo(
    () => (amountCents: number, baseCurrency: string = "USD") => formatCurrencyWithRates(amountCents, locale as any, rates, baseCurrency, currency),
    [locale, rates, currency],
  );

  useEffect(() => {
    if (compact) return; // don't sync in compact mode
    const usp = new URLSearchParams(params.toString());
    const setOrDel = (k: string, v: string | number) => {
      const val = String(v);
      if (val === "" || val === "all" || val === "1") usp.delete(k); else usp.set(k, val);
    };
    setOrDel("tf", typeFilter);
    setOrDel("af", accountFilter);
    setOrDel("q", search);
    setOrDel("sort", sort);
    setOrDel("dr", dateRange);
    setOrDel("p", page);
    const qs = usp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, accountFilter, search, sort, dateRange, page]);

  const filtered = useMemo(() => {
    let rows = transactions.slice();

    if (typeFilter !== "all") {
      rows = rows.filter((tx) => tx.kind === typeFilter);
    }

    if (accountFilter !== "all") {
      rows = rows.filter((tx) => tx.fromAccountId === accountFilter || tx.toAccountId === accountFilter);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter((tx) =>
        tx.description.toLowerCase().includes(q) ||
        tx.fromAccount?.name.toLowerCase().includes(q) ||
        tx.toAccount?.name.toLowerCase().includes(q)
      );
    }

    if (dateRange !== "all") {
      const now = new Date();
      const start = new Date(now);
      if (dateRange === "7d") start.setDate(now.getDate() - 7);
      else if (dateRange === "30d") start.setDate(now.getDate() - 30);
      else if (dateRange === "90d") start.setDate(now.getDate() - 90);
      rows = rows.filter((tx) => new Date(tx.postedAt).getTime() >= start.getTime());
    }

    rows.sort((a, b) => {
      switch (sort) {
        case "amount_desc":
          return b.amountCents - a.amountCents;
        case "amount_asc":
          return a.amountCents - b.amountCents;
        case "date_asc":
          return new Date(a.postedAt).getTime() - new Date(b.postedAt).getTime();
        case "date_desc":
        default:
          return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
      }
    });

    if (compact && limit) {
      return rows.slice(0, limit);
    }

    return rows;
  }, [transactions, typeFilter, accountFilter, search, sort, compact, limit]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = useMemo(() => {
    if (compact) return filtered;
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize, compact]);

  const onExport = () => {
    const header = ["id","date","description","from","to","amount","type"]; 
    const rows = filtered.map((tx) => [
      tx.id,
      new Date(tx.postedAt).toISOString(),
      tx.description,
      tx.fromAccount ? `${tx.fromAccount.name} (${tx.fromAccount.mask})` : "",
      tx.toAccount ? `${tx.toAccount.name} (${tx.toAccount.mask})` : "",
      (tx.amountCents / 100).toFixed(2),
      tx.kind,
    ]);
    const csv = [header, ...rows].map(r => r.map(field => `"${String(field).replaceAll('"','""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      {!compact && (
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-widest text-slate-400">{t("txFilterType")}</label>
              <select value={typeFilter} onChange={(e) => { setPage(1); setTypeFilter(e.target.value); }} className="h-9 rounded-xl border border-slate-700/60 bg-slate-950/80 px-3 text-sm text-slate-100">
                <option value="all">{t("txFilterAll")}</option>
                <option value={TransactionKind.DEBIT}>{t("transactionKindDebit")}</option>
                <option value={TransactionKind.CREDIT}>{t("transactionKindCredit")}</option>
                <option value={TransactionKind.TRANSFER}>{t("transactionKindTransfer")}</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-widest text-slate-400">{t("txFilterAccount")}</label>
              <select value={accountFilter} onChange={(e) => { setPage(1); setAccountFilter(e.target.value); }} className="h-9 rounded-xl border border-slate-700/60 bg-slate-950/80 px-3 text-sm text-slate-100">
                <option value="all">{t("txFilterAll")}</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} ({a.mask})</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-widest text-slate-400">{t("txFilterSearch")}</label>
              <input value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} placeholder={t("txFilterSearchPlaceholder")} className="h-9 rounded-xl border border-slate-700/60 bg-slate-950/80 px-3 text-sm text-slate-100" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-widest text-slate-400">{t("txFilterDateRange")}</label>
              <select value={dateRange} onChange={(e) => { setPage(1); setDateRange(e.target.value); }} className="h-9 rounded-xl border border-slate-700/60 bg-slate-950/80 px-3 text-sm text-slate-100">
                <option value="all">{t("txDateAll")}</option>
                <option value="7d">{t("txDate7d")}</option>
                <option value="30d">{t("txDate30d")}</option>
                <option value="90d">{t("txDate90d")}</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] uppercase tracking-widest text-slate-400">{t("txSortBy")}</label>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="h-9 rounded-xl border border-slate-700/60 bg-slate-950/80 px-3 text-sm text-slate-100">
              <option value="date_desc">{t("txSortDate")} ↓</option>
              <option value="date_asc">{t("txSortDate")} ↑</option>
              <option value="amount_desc">{t("txSortAmount")} ↓</option>
              <option value="amount_asc">{t("txSortAmount")} ↑</option>
            </select>
            <button onClick={onExport} className="rounded-xl border border-slate-700/60 bg-slate-900/70 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800/70">{t("txExportCSV")}</button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-900/50 shadow-lg">
        {pageRows.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">{t("txNoResults")}</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800/50 bg-slate-950/50">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">{t("demoTableHeaderDescription")}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">{t("demoTableHeaderFrom")}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">{t("demoTableHeaderTo")}</th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">{t("demoTableHeaderAmount")}</th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">{t("demoTableHeaderType")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {pageRows.map((tx) => {
                const isCredit = tx.kind === TransactionKind.CREDIT || (tx.amountCents > 0 && tx.kind !== TransactionKind.DEBIT);
                const amountColor = isCredit ? "text-emerald-400" : "text-rose-400";
                const currency = tx.toAccount?.currency || tx.fromAccount?.currency || "USD";
                const formattedAmount = formatMoney(tx.amountCents, currency);
                return (
                  <tr key={tx.id} className="transition-colors hover:bg-slate-800/30">
                    <td className="px-6 py-4 text-sm font-medium text-white">{tx.description}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">{tx.fromAccount ? `${tx.fromAccount.name} (${tx.fromAccount.mask})` : "—"}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">{tx.toAccount ? `${tx.toAccount.name} (${tx.toAccount.mask})` : "—"}</td>
                    <td className={`px-6 py-4 text-right text-sm font-semibold ${amountColor}`}>{isCredit ? "+" : ""}{formattedAmount}</td>
                    <td className="px-6 py-4 text-right"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${isCredit ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>{tx.kind.toLowerCase()}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {!compact && totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 text-xs">
          <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p-1))} className="rounded-lg border border-slate-800/70 px-3 py-1 disabled:opacity-50">‹</button>
          <span className="text-slate-400">{page} / {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p+1))} className="rounded-lg border border-slate-800/70 px-3 py-1 disabled:opacity-50">›</button>
        </div>
      )}
    </div>
  );
}
