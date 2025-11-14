"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

export default function SettingsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch("/api/user/me")
      .then(async (r) => {
        if (!r.ok) throw new Error("Unauthorized");
        const data = await r.json();
        if (mounted) {
          setName(data.user?.name || "");
          setEmail(data.user?.email || "");
          setLoading(false);
        }
      })
      .catch(() => {
        setLoading(false);
        router.push("/login?callbackUrl=%2Fsettings");
      });
    return () => {
      mounted = false;
    };
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const res = await fetch("/api/user/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || t("settingsSaveFailed"));
      return;
    }
    setSuccess(t("settingsSaved"));
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-slate-400 text-sm">{t("settingsLoading")}</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.95)] backdrop-blur-xl">
        <h1 className="text-xl font-semibold text-slate-50">{t("settingsTitle")}</h1>
        <p className="mt-1 text-sm text-slate-400">{t("settingsSubtitle")}</p>

        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">{t("settingsEmailLabel")}</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-400 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">{t("settingsNameLabel")}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-emerald-500/40 focus:border-emerald-400 focus:ring-2"
              placeholder={t("settingsNamePlaceholder")}
            />
          </div>

          {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
          {success && <p className="text-xs text-emerald-300 mt-1">{success}</p>}

          <button
            type="submit"
            className="mt-2 w-full rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400"
          >
            {t("settingsSaveChanges")}
          </button>
        </form>
      </div>
    </main>
  );
}
