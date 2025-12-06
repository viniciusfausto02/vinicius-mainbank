"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

type Props = {
  transactionId: string;
  currentCategoryId?: string | null;
  currentCategoryName?: string;
  onSuccess: () => void;
};

export default function ReclassifyDropdown({ transactionId, currentCategoryId, currentCategoryName, onSuccess }: Props) {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function loadCategories() {
    if (categories.length) return;
    setLoading(true);
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(data.categories || []);
    } catch {}
    setLoading(false);
  }

  async function assign(categoryId: string | null) {
    try {
      const res = await fetch("/api/transactions/categorize", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId, categoryId }),
      });
      if (!res.ok) throw new Error("Failed");
      setOpen(false);
      onSuccess();
    } catch {}
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => {
          setOpen(!open);
          if (!open) loadCategories();
        }}
        className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:border-emerald-400 hover:text-emerald-200"
      >
        {currentCategoryName || "—"}
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-10 w-48 rounded-xl border border-slate-800 bg-slate-950/95 p-2 shadow-xl">
          {loading && <p className="text-xs text-slate-400">{t('reclassifyLoading')}</p>}
          {!loading && (
            <>
              <button
                onClick={() => assign(null)}
                className="w-full rounded px-2 py-1 text-left text-xs text-slate-300 hover:bg-slate-800"
              >
                {t('reclassifyUncategorized')}
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => assign(c.id)}
                  className={`w-full rounded px-2 py-1 text-left text-xs ${
                    c.id === currentCategoryId ? "bg-emerald-500/20 text-emerald-200" : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
