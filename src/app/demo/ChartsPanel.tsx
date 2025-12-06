"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Account, Transaction } from "@prisma/client";
import { useState, useMemo } from "react";
import { convertAmountCents, formatCurrencyWithRates, localeTagForLocale } from "@/lib/currency";
import { useExchangeRates } from "@/lib/useExchangeRates";

type ChartsPanelProps = {
  accounts: Account[];
  transactions: Transaction[];
};

export default function ChartsPanel({ accounts, transactions }: ChartsPanelProps) {
  const { t, locale } = useLanguage();
  const { currency } = useCurrency();
  const { rates } = useExchangeRates();
  const localeTag = localeTagForLocale(locale);

  const formatMoney = useMemo(
    () => (amountCents: number, baseCurrency: string = "USD") => formatCurrencyWithRates(amountCents, locale as any, rates, baseCurrency, currency),
    [locale, rates, currency],
  );

  const convert = useMemo(
    () => (amountCents: number, baseCurrency: string = "USD") => convertAmountCents(amountCents, baseCurrency, currency, rates),
    [currency, rates],
  );

  const formatTargetUnits = useMemo(
    () =>
      (value: number, fractionDigits = 0) =>
        new Intl.NumberFormat(localeTag, {
          style: "currency",
          currency,
          maximumFractionDigits: fractionDigits,
          minimumFractionDigits: fractionDigits,
        }).format(value),
    [currency, localeTag],
  );
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  // Calculate account distribution
  const accountBalances = useMemo(() => {
    return accounts.map((acc) => {
      const value = convert(acc.balanceCents, acc.currency || "USD");
      return {
        id: acc.id,
        name: acc.name,
        value,
        type: acc.type,
        formatted: formatMoney(acc.balanceCents, acc.currency || "USD"),
      };
    });
  }, [accounts, convert, formatMoney]);

  const totalBalance = useMemo(() => {
    return accountBalances.reduce((sum, acc) => sum + acc.value, 0);
  }, [accountBalances]);

  // Calculate transaction stats (last 30 days)
  const { recentTxs, income, expenses, txByDay, days } = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recent = transactions.filter((tx) => new Date(tx.createdAt) > thirtyDaysAgo);

    let totalIncome = 0;
    let totalExpenses = 0;
    const byDay: Record<string, number> = {};

    recent.forEach((tx) => {
      const converted = convert(tx.amountCents, "USD");
      if (tx.kind === "CREDIT") {
        totalIncome += converted;
      } else if (tx.kind === "DEBIT") {
        totalExpenses += converted;
      }

      const day = new Date(tx.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      byDay[day] = (byDay[day] || 0) + Math.abs(converted);
    });

    const daysList = Object.entries(byDay)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .slice(-7);

    return { recentTxs: recent, income: totalIncome, expenses: totalExpenses, txByDay: byDay, days: daysList };
  }, [transactions]);

  const maxDayValue = useMemo(() => Math.max(...days.map(([, v]) => v), 1), [days]);

  const netFlow = income - expenses;
  const incomeExpenseRatio = expenses > 0 ? (income / expenses) * 100 : 100;

  return (
    <div className="space-y-4 md:space-y-6 pb-6">
      {/* ==================== ACCOUNT DISTRIBUTION CARD ==================== */}
      <div className="rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/80 via-slate-900/70 to-slate-800/80 p-4 sm:p-5 md:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.3)] backdrop-blur-xl overflow-hidden">
        <h3 className="mb-4 md:mb-6 text-sm font-semibold text-white">{t("chartsAccountDistribution")}</h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Pie Chart SVG - Responsive */}
          <div className="flex items-center justify-center min-h-[280px] md:min-h-[320px]">
            <svg viewBox="0 0 200 200" className="h-56 w-56 sm:h-64 sm:w-64 md:h-72 md:w-72">
              {(() => {
                let currentAngle = -90;
                return accountBalances.map((acc, idx) => {
                  const percentage = (acc.value / totalBalance) * 100;
                  const sliceAngle = (percentage / 100) * 360;
                  const radius = 60;
                  const cx = 100;
                  const cy = 100;

                  const startAngleRad = (currentAngle * Math.PI) / 180;
                  const endAngleRad = ((currentAngle + sliceAngle) * Math.PI) / 180;

                  const x1 = cx + radius * Math.cos(startAngleRad);
                  const y1 = cy + radius * Math.sin(startAngleRad);
                  const x2 = cx + radius * Math.cos(endAngleRad);
                  const y2 = cy + radius * Math.sin(endAngleRad);

                  const largeArc = sliceAngle > 180 ? 1 : 0;

                  const pathData = [
                    `M ${cx} ${cy}`,
                    `L ${x1} ${y1}`,
                    `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
                    "Z",
                  ].join(" ");

                  const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];
                  const color = colors[idx % colors.length];

                  currentAngle += sliceAngle;

                  return (
                    <path
                      key={idx}
                      d={pathData}
                      fill={color}
                      stroke="#0f172a"
                      strokeWidth="2"
                      opacity={selectedAccount === null || selectedAccount === acc.id ? "0.85" : "0.3"}
                      className="transition-opacity duration-200 cursor-pointer hover:opacity-100"
                      onClick={() => setSelectedAccount(selectedAccount === acc.id ? null : acc.id)}
                    />
                  );
                });
              })()}
              <circle cx="100" cy="100" r="40" fill="#0f172a" />
              <text x="100" y="105" textAnchor="middle" className="font-mono text-xs md:text-sm" fill="#e2e8f0">
                {formatTargetUnits(totalBalance, 0)}
              </text>
            </svg>
          </div>

          {/* Legend - Scrollable on mobile */}
          <div className="space-y-2 md:space-y-3 overflow-y-auto max-h-96">
            {accountBalances.map((acc, idx) => {
              const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];
              const color = colors[idx % colors.length];
              const percentage = ((acc.value / totalBalance) * 100).toFixed(1);
              const isSelected = selectedAccount === null || selectedAccount === acc.id;

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedAccount(selectedAccount === acc.id ? null : acc.id)}
                  className={`w-full text-left rounded-lg px-3 py-2.5 transition-all duration-200 ${
                    isSelected
                      ? "bg-slate-800/60 border border-slate-700/60"
                      : "bg-slate-800/20 border border-transparent opacity-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-3 w-3 flex-shrink-0 rounded-full" style={{ backgroundColor: color }} />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-300 truncate">{acc.name}</p>
                        <p className="text-xs text-slate-500">{acc.type}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-semibold text-slate-200">{acc.formatted}</p>
                      <p className="text-xs text-slate-500">{percentage}%</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ==================== INCOME VS EXPENSES CARD ==================== */}
      <div className="rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/80 via-slate-900/70 to-slate-800/80 p-4 sm:p-5 md:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.3)] backdrop-blur-xl">
        <h3 className="mb-4 md:mb-6 text-sm font-semibold text-white">{t("chartsIncomeExpenses")}</h3>

        <div className="space-y-5 md:space-y-6">
          {/* Income Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-emerald-300 truncate">{t("chartsIncome")}</span>
              <span className="font-mono text-sm font-semibold text-emerald-400 flex-shrink-0">{formatTargetUnits(income, 2)}</span>
            </div>
            <div className="h-10 md:h-12 w-full overflow-hidden rounded-lg bg-slate-800/50">
              <div
                className="h-full rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500 flex items-center justify-end px-3"
                style={{ width: `${Math.min(100, (income / (Math.max(income, expenses) || 1)) * 100)}%` }}
              >
                {income > 0 && <span className="text-xs font-semibold text-emerald-950 hidden sm:inline">{((income / (Math.max(income, expenses) || 1)) * 100).toFixed(0)}%</span>}
              </div>
            </div>
          </div>

          {/* Expenses Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-rose-300 truncate">{t("chartsExpenses")}</span>
              <span className="font-mono text-sm font-semibold text-rose-400 flex-shrink-0">{formatTargetUnits(expenses, 2)}</span>
            </div>
            <div className="h-10 md:h-12 w-full overflow-hidden rounded-lg bg-slate-800/50">
              <div
                className="h-full rounded-lg bg-gradient-to-r from-rose-500 to-rose-400 transition-all duration-500 flex items-center justify-end px-3"
                style={{ width: `${Math.min(100, (expenses / (Math.max(income, expenses) || 1)) * 100)}%` }}
              >
                {expenses > 0 && <span className="text-xs font-semibold text-rose-950 hidden sm:inline">{((expenses / (Math.max(income, expenses) || 1)) * 100).toFixed(0)}%</span>}
              </div>
            </div>
          </div>

          {/* Summary Cards - Grid responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3 pt-4">
            <div className="rounded-lg bg-emerald-500/10 px-3 py-3 md:py-4 border border-emerald-500/20 hover:border-emerald-500/40 transition-colors">
              <p className="text-xs text-emerald-300 font-medium truncate">{t("chartsNetFlow")}</p>
              <p className={`mt-1 font-bold text-sm md:text-base ${netFlow >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {formatTargetUnits(netFlow, 2)}
              </p>
            </div>
            <div className="rounded-lg bg-blue-500/10 px-3 py-3 md:py-4 border border-blue-500/20 hover:border-blue-500/40 transition-colors">
              <p className="text-xs text-blue-300 font-medium truncate">{t("chartsRatio")}</p>
              <p className="mt-1 font-bold text-sm md:text-base text-blue-400">{incomeExpenseRatio.toFixed(0)}%</p>
            </div>
            <div className="rounded-lg bg-slate-500/10 px-3 py-3 md:py-4 border border-slate-500/20 hover:border-slate-500/40 transition-colors">
              <p className="text-xs text-slate-300 font-medium truncate">{t("chartsTxCount")}</p>
              <p className="mt-1 font-bold text-sm md:text-base text-slate-400">{recentTxs.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== ACTIVITY TREND CARD ==================== */}
      <div className="rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/80 via-slate-900/70 to-slate-800/80 p-4 sm:p-5 md:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.3)] backdrop-blur-xl">
        <h3 className="mb-4 md:mb-6 text-sm font-semibold text-white">{t("chartsActivity7d")}</h3>

        <div className="space-y-4">
          {days.length === 0 ? (
            <div className="flex items-center justify-center py-16 md:py-20 text-slate-400 text-sm">
              {t("chartsNoData")}
            </div>
          ) : (
            <>
              {/* Bar Chart Container - Horizontal scroll on mobile */}
              <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                <div className="flex items-end justify-between gap-1 md:gap-2 min-w-fit md:min-w-full h-40 md:h-56 pb-2">
                  {days.map(([day, value], idx) => {
                    const heightPercent = (value / maxDayValue) * 100;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center justify-end gap-1.5 group min-w-[45px] md:min-w-0">
                        <div
                          className="w-full rounded-t-lg bg-gradient-to-t from-cyan-500 to-cyan-400 transition-all duration-300 hover:from-cyan-400 hover:to-cyan-300 cursor-pointer relative group/bar shadow-md hover:shadow-lg"
                          style={{ height: `${heightPercent}%`, minHeight: heightPercent > 0 ? "8px" : "2px" }}
                        >
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-opacity duration-200 text-xs bg-slate-900 text-slate-300 px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none font-semibold border border-slate-700">
                            {formatTargetUnits(value, 0)}
                          </div>
                        </div>
                        <span className="text-xs text-slate-500 text-center font-medium mt-1">{day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Summary stats */}
              <div className="mt-6 pt-4 border-t border-slate-800/50">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                  <div className="rounded-lg bg-slate-800/30 px-3 py-2 md:py-3">
                    <p className="text-xs text-slate-500">{t("chartsAverage")}</p>
                    <p className="mt-1 font-semibold text-slate-300">{formatTargetUnits((Object.values(txByDay).reduce((a, b) => a + b, 0) / Object.keys(txByDay).length) || 0, 0)}</p>
                  </div>
                  <div className="rounded-lg bg-slate-800/30 px-3 py-2 md:py-3">
                    <p className="text-xs text-slate-500">{t("chartsHighest")}</p>
                    <p className="mt-1 font-semibold text-slate-300">{formatTargetUnits(maxDayValue, 0)}</p>
                  </div>
                  <div className="rounded-lg bg-slate-800/30 px-3 py-2 md:py-3">
                    <p className="text-xs text-slate-500">{t("chartsLowest")}</p>
                    <p className="mt-1 font-semibold text-slate-300">{formatTargetUnits(Math.min(...Object.values(txByDay), maxDayValue), 0)}</p>
                  </div>
                  <div className="rounded-lg bg-slate-800/30 px-3 py-2 md:py-3">
                    <p className="text-xs text-slate-500">{t("chartsTotal7d")}</p>
                    <p className="mt-1 font-semibold text-slate-300">{formatTargetUnits(Object.values(txByDay).reduce((a, b) => a + b, 0), 0)}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

