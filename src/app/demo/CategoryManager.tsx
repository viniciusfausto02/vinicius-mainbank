"use client";

import { useEffect, useState, FormEvent } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

type Category = {
  id: string;
  name: string;
  kind: "EXPENSE" | "INCOME";
};

type CategoryManagerProps = {
  onCategoryChange?: () => void;
};

export default function CategoryManager({ onCategoryChange }: CategoryManagerProps) {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newKind, setNewKind] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => {
        setCategories(d.categories || []);
        setLoading(false);
      })
      .catch(() => setError(t("categoriesErrorLoad")));
  }, [t]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setError(null);

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, kind: newKind }),
      });
      if (!res.ok) throw new Error("Failed to add");
      const data = await res.json();
      setCategories((prev) => [...prev, data.category]);
      setNewName("");
      
      // Call the optional callback if provided
      if (onCategoryChange) {
        onCategoryChange();
      }
    } catch {
      setError(t("categoriesErrorAdd"));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t("categoriesDeleteConfirm"))) return;
    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setCategories((prev) => prev.filter((c) => c.id !== id));
      
      // Call the optional callback if provided
      if (onCategoryChange) {
        onCategoryChange();
      }
    } catch {
      setError(t("categoriesErrorDelete"));
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/80 via-slate-900/70 to-slate-800/80 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.3)] backdrop-blur-xl">
        <p className="text-sm text-slate-400">{t("categoriesLoading")}</p>
      </div>
    );
  }

  return (
    <div className="group rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/80 via-slate-900/70 to-slate-800/80 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.3)] backdrop-blur-xl transition-all duration-500 hover:border-cyan-400/30 hover:shadow-[0_12px_40px_rgba(34,211,238,0.15)]">
      <div className="mb-4">
        <p className="text-sm text-slate-300">{t("categoriesDescription")}</p>
      </div>

      {error && <p className="mb-3 text-xs text-rose-300 rounded-lg bg-rose-950/30 border border-rose-800/50 px-3 py-2">{error}</p>}

      <form onSubmit={handleAdd} className="mb-4 flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={t("categoriesNamePlaceholder")}
          className="flex-1 rounded-xl border border-slate-700/50 bg-slate-950/70 px-4 py-2.5 text-sm text-slate-100 outline-none transition-all duration-300 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/20 hover:border-slate-600"
        />
        <select
          value={newKind}
          onChange={(e) => setNewKind(e.target.value as any)}
          className="rounded-xl border border-slate-700/50 bg-slate-950/70 px-4 py-2.5 text-sm text-slate-100 outline-none transition-all duration-300 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/20 hover:border-slate-600"
        >
          <option value="EXPENSE">{t("categoriesKindExpense")}</option>
          <option value="INCOME">{t("categoriesKindIncome")}</option>
        </select>
        <button
          type="submit"
          className="rounded-xl border border-cyan-400/50 bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(34,211,238,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(34,211,238,0.4)]"
        >
          {t("categoriesAddButton")}
        </button>
      </form>

      <div className="grid grid-cols-1 gap-3">
        {categories.map((c) => (
          <div
            key={c.id}
            className="group/cat flex items-center justify-between rounded-xl border border-slate-800/50 bg-slate-950/40 p-4 transition-all duration-300 hover:border-slate-700 hover:bg-slate-950/60"
          >
            <div>
              <p className="text-sm font-medium text-slate-100">{c.name}</p>
              <p className="text-xs text-slate-400">{c.kind === "EXPENSE" ? t("categoriesKindExpense") : t("categoriesKindIncome")}</p>
            </div>
            <button
              onClick={() => handleDelete(c.id)}
              className="rounded-lg border border-slate-700/50 bg-slate-900/50 px-3 py-1.5 text-xs text-slate-300 transition-all duration-300 hover:border-rose-400/50 hover:bg-rose-950/30 hover:text-rose-300"
            >
              {t("categoriesDeleteButton")}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
