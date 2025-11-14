"use client";

// src/app/login/page.tsx
//
// Login page for existing users.
// - Uses NextAuth credentials provider for email/password.
// - Also offers "Continue with Google".
// - On success, redirects to /demo.

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/demo";

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
      callbackUrl,
    });

    if (result?.error) {
      setError(t("loginErrorInvalid"));
      setSubmitting(false);
      return;
    }

    router.push(callbackUrl);
  }

  return (
    <main className="relative min-h-[calc(100vh-64px)] sm:min-h-[calc(100vh-80px)] flex items-center justify-center px-4 bg-slate-950 overflow-hidden">
      <div className="w-full max-w-md">
        {/* Main card */}
        <div className="group relative rounded-3xl border border-slate-800/50 bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-800/95 p-8 shadow-[0_20px_70px_rgba(0,0,0,0.6)] backdrop-blur-2xl transition-all duration-500 hover:border-emerald-500/30 hover:shadow-[0_25px_90px_rgba(16,185,129,0.25)]">
          {/* Glow effect */}
          <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-br from-emerald-500/20 via-cyan-500/10 to-violet-500/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
          {/* Content */}
          <div className="relative">
            <h1 className="text-3xl font-black tracking-tight text-white">
              {t("loginTitle")}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              {t("loginDescription")}
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-300">
                  {t("loginEmailLabel")}
                </label>
                <div className="group/input relative">
                  <input
                    type="email"
                    className="w-full rounded-xl border border-slate-700/50 bg-slate-950/80 px-4 py-3.5 text-sm text-slate-100 outline-none ring-2 ring-transparent transition-all duration-300 placeholder:text-slate-500 hover:border-slate-600 focus:border-emerald-400/60 focus:bg-slate-950/90 focus:ring-emerald-500/20"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder={t("loginEmailPlaceholder")}
                  />
                  <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-cyan-500/0 opacity-0 blur-xl transition-opacity duration-300 group-focus-within/input:opacity-100" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-300">
                  {t("loginPasswordLabel")}
                </label>
                <div className="group/input relative">
                  <input
                    type="password"
                    className="w-full rounded-xl border border-slate-700/50 bg-slate-950/80 px-4 py-3.5 text-sm text-slate-100 outline-none ring-2 ring-transparent transition-all duration-300 placeholder:text-slate-500 hover:border-slate-600 focus:border-emerald-400/60 focus:bg-slate-950/90 focus:ring-emerald-500/20"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder={t("loginPasswordPlaceholder")}
                  />
                  <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-cyan-500/0 opacity-0 blur-xl transition-opacity duration-300 group-focus-within/input:opacity-100" />
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-rose-500/30 bg-gradient-to-br from-rose-950/40 to-rose-900/30 p-4 backdrop-blur-sm">
                  <p className="text-xs font-medium text-rose-300">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="group/btn relative mt-6 w-full overflow-hidden rounded-xl border border-emerald-400/50 bg-gradient-to-r from-emerald-500 via-emerald-400 to-cyan-500 px-6 py-4 text-sm font-bold text-black shadow-[0_10px_40px_rgba(16,185,129,0.4)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_15px_50px_rgba(16,185,129,0.6)] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-[0_10px_40px_rgba(16,185,129,0.4)]"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {submitting ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {t("loginSubmittingButton")}
                    </>
                  ) : (
                    t("loginSubmitButton")
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-emerald-500 opacity-0 transition-opacity duration-300 group-hover/btn:opacity-100" />
              </button>
            </form>

            {/* Divider */}
            <div className="my-8 flex items-center gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">{t("loginDivider")}</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
            </div>

            {/* Google button */}
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl })}
              className="group/google relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl border border-slate-700/50 bg-slate-950/80 px-6 py-4 text-sm font-semibold text-slate-100 backdrop-blur-sm transition-all duration-300 hover:border-slate-600 hover:bg-slate-900/90 hover:shadow-[0_8px_30px_rgba(148,163,184,0.15)]"
            >
              <span className="text-xl transition-transform duration-300 group-hover/google:scale-110">🔐</span>
              <span>{t("loginGoogleButton")}</span>
              <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-800/0 via-slate-700/50 to-slate-800/0 opacity-0 transition-opacity duration-300 group-hover/google:opacity-100" />
            </button>

            <p className="mt-8 text-center text-sm text-slate-400">
              {t("loginNoAccount")} {" "}
              <Link
                href="/register"
                className="font-semibold text-emerald-400 transition-colors duration-300 hover:text-emerald-300"
              >
                {t("loginCreateLink")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
