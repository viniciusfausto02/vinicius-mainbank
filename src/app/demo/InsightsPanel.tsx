"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatCurrencyWithRates } from "@/lib/currency";
import { useExchangeRates } from "@/lib/useExchangeRates";

type Insights = {
  totals: { income: number; expense: number };
  series: { date: string; netCents: number }[];
};

export default function InsightsPanel() {
  const { locale, t } = useLanguage();
  const { currency } = useCurrency();
  const { rates } = useExchangeRates();
  const [data, setData] = useState<Insights | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/insights/overview")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setError(t("insightsErrorLoad")));
  }, [t]);

  const fmt = useCallback((cents: number) => formatCurrencyWithRates(cents, locale as any, rates, "USD", currency), [locale, rates, currency]);

  // Sparkline constants used by memoized computations
  const width = 360;
  const height = 64;
  const pad = 4;

  const { path, trendPath, trendDirection, projected7d } = useMemo(() => {
    const points = data?.series ?? [];
    if (points.length === 0) {
      return { path: "", trendPath: "", trendDirection: "flat", projected7d: 0 } as const;
    }

    const min = Math.min(0, ...points.map((p) => p.netCents));
    const max = Math.max(0, ...points.map((p) => p.netCents));
    const range = max - min || 1;
    const step = points.length > 1 ? (width - pad * 2) / (points.length - 1) : width - pad * 2;

    const basePath = points
      .map((p, i) => {
        const x = pad + i * step;
        const y = pad + (1 - (p.netCents - min) / range) * (height - pad * 2);
        return `${i === 0 ? "M" : "L"}${x},${y}`;
      })
      .join(" ");

    // Linear regression over (i, netCents)
    const n = points.length;
    let sumX = 0, sumY = 0, sumXX = 0, sumXY = 0;
    for (let i = 0; i < n; i++) {
      const x = i;
      const y = points[i].netCents;
      sumX += x; sumY += y; sumXX += x * x; sumXY += x * y;
    }
    const denom = n * sumXX - sumX * sumX || 1;
    const slope = (n * sumXY - sumX * sumY) / denom;
    const intercept = (sumY - slope * sumX) / n;
    const trendP = Array.from({ length: n }, (_, i) => {
      const x = pad + i * step;
      const yVal = intercept + slope * i;
      const y = pad + (1 - (yVal - min) / range) * (height - pad * 2);
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    }).join(" ");
    const dir: "up" | "down" | "flat" = Math.abs(slope) < 1e-6 ? "flat" : slope > 0 ? "up" : "down";
    const lastY = points[n - 1].netCents;
    const proj = lastY + slope * 7;

    return { path: basePath, trendPath: trendP, trendDirection: dir, projected7d: proj } as const;
  }, [data, height, pad, width]);

  if (error) {
    return (
      <div className="rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/80 via-slate-900/70 to-slate-800/80 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.3)] backdrop-blur-xl">
        <p className="text-sm text-rose-300">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/80 via-slate-900/70 to-slate-800/80 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.3)] backdrop-blur-xl">
        <p className="text-sm text-slate-400">{t("insightsLoading")}</p>
      </div>
    );
  }

  return (
    <div className="group rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/80 via-slate-900/70 to-slate-800/80 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.3)] backdrop-blur-xl transition-all duration-500 hover:border-emerald-400/30 hover:shadow-[0_12px_40px_rgba(16,185,129,0.15)]">
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-slate-400">{t("insightsIncomeLabel")}</p>
          <p className="text-xl font-bold text-emerald-300">{fmt(data.totals.income)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-slate-400">{t("insightsExpensesLabel")}</p>
          <p className="text-xl font-bold text-rose-300">{fmt(data.totals.expense)}</p>
        </div>
      </div>
      <div className="rounded-xl border border-slate-800/50 bg-slate-950/40 p-3">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-300">
          <span className="text-slate-400 uppercase tracking-widest">{t("insightsTrendLabel")}:</span>
          <span className={trendDirection === "up" ? "text-emerald-400" : trendDirection === "down" ? "text-rose-400" : "text-slate-400"}>
            {trendDirection === "up" ? t("insightsTrendUp") : trendDirection === "down" ? t("insightsTrendDown") : t("insightsTrendFlat")}
          </span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-400">{t("insightsProjected7dLabel")}:</span>
          <span className="font-medium">{fmt(projected7d)}</span>
        </div>
        <svg width={width} height={height} className="w-full">
          <path d={path} fill="none" stroke="url(#g)" strokeWidth={2.5} />
          <path d={trendPath} fill="none" stroke="#60a5fa" strokeWidth={2} strokeDasharray="4 4" />
          <defs>
            <linearGradient id="g" x1="0" x2="1">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}
