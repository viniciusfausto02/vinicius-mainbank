"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

type BudgetRow = {
  id: string;
  name: string;
  kind: "EXPENSE" | "INCOME";
  limitCents: number;
  spentCents: number;
};

type BudgetsPanelProps = {
  onBudgetUpdate?: () => void;
};

export default function BudgetsPanel({ onBudgetUpdate }: BudgetsPanelProps) {
  const { t } = useLanguage();
  const [rows, setRows] = useState<BudgetRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/budgets/current")
      .then((r) => r.json())
      .then((d) => setRows(d.categories))
      .catch(() => setError(t("budgetsErrorLoad")));
  }, [t]);

  const expenseRows = useMemo(() => (rows || []).filter((r) => r.kind === "EXPENSE"), [rows]);
  const incomeRows = useMemo(() => (rows || []).filter((r) => r.kind === "INCOME"), [rows]);

  async function save() {
    if (!rows) return;
    setSaving(true);
    try {
      const body = { items: rows.map((r) => ({ categoryId: r.id, limitCents: r.limitCents })) };
      const res = await fetch("/api/budgets/current", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Save failed");
      
      // Call the optional callback if provided
      if (onBudgetUpdate) {
        onBudgetUpdate();
      }
    } catch (e) {
      setError(t("budgetsErrorSave"));
    } finally {
      setSaving(false);
    }
  }

  function format(cents: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
  }

  function Row({ r }: { r: BudgetRow }) {
    const pct = r.limitCents > 0 ? Math.min(100, Math.round((r.spentCents / r.limitCents) * 100)) : 0;
    return (
      <div className="group/row rounded-xl border border-slate-800/50 bg-slate-950/40 p-4 transition-all duration-300 hover:border-slate-700 hover:bg-slate-950/60">
        <div className="flex items-center justify-between text-sm">
          <div className="font-medium text-slate-100">{r.name}</div>
          <div className="text-xs text-slate-400">{format(r.spentCents)} / {format(r.limitCents)}</div>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-800/60">
          <div
            className={`h-2 transition-all duration-500 ${pct >= 90 ? "bg-gradient-to-r from-rose-500 to-pink-500" : pct >= 70 ? "bg-gradient-to-r from-amber-500 to-orange-500" : "bg-gradient-to-r from-emerald-500 to-teal-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input
            value={(r.limitCents / 100).toString()}
            onChange={(e) => {
              const next = Number(e.target.value.replace(/,/g, "."));
              if (!Number.isFinite(next) || next < 0) return;
              setRows((prev) => prev && prev.map((x) => (x.id === r.id ? { ...x, limitCents: Math.round(next * 100) } : x)));
            }}
            className="w-28 rounded-lg border border-slate-700/50 bg-slate-950/70 px-3 py-1.5 text-xs text-slate-200 outline-none transition-all duration-300 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/20"
          />
          <span className="text-xs text-slate-400">{t("budgetsMonthlyLimit")}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/80 via-slate-900/70 to-slate-800/80 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.3)] backdrop-blur-xl">
        <p className="text-sm text-rose-300">{error}</p>
      </div>
    );
  }

  if (!rows) {
    return (
      <div className="rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/80 via-slate-900/70 to-slate-800/80 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.3)] backdrop-blur-xl">
        <p className="text-sm text-slate-400">{t("budgetsLoading")}</p>
      </div>
    );
  }

  return (
    <div className="group rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/80 via-slate-900/70 to-slate-800/80 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.3)] backdrop-blur-xl transition-all duration-500 hover:border-cyan-400/30 hover:shadow-[0_12px_40px_rgba(34,211,238,0.15)]">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-300">{t("budgetsDescription")}</p>
        <button
          onClick={save}
          disabled={saving}
          className="rounded-xl border border-cyan-400/50 bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-[0_8px_20px_rgba(34,211,238,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(34,211,238,0.4)] disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {saving ? t("budgetsSavingButton") : t("budgetsSaveButton")}
        </button>
      </div>

      {!!incomeRows.length && (
        <div className="mb-4">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.15em] text-slate-400">{t("budgetsIncomeLabel")}</p>
          <div className="grid grid-cols-1 gap-3">
            {incomeRows.map((r) => (
              <Row key={r.id} r={r} />
            ))}
          </div>
        </div>
      )}

      <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.15em] text-slate-400">{t("budgetsExpensesLabel")}</p>
      <div className="grid grid-cols-1 gap-3">
        {expenseRows.map((r) => (
          <Row key={r.id} r={r} />
        ))}
      </div>
    </div>
  );
}
