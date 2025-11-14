"use client";

// Landing page for ViniBank.
// Goal: simulate the look & feel of a real digital bank onboarding page,
// while also showcasing modern front-end techniques (gradients, glassmorphism,
// responsive layout and a custom i18n system).

import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Home() {
  const { t, locale, setLocale } = useLanguage();

  return (
    // Main container: fills the viewport height and applies a dark background theme.
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-50">
      {/* Content wrapper:
          - Centers the content vertically and horizontally.
          - Constrains max width for readable text.
          - Leaves padding on small screens.
          - Relative z-index ensures content sits above background. */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-9xl flex-col items-center justify-center px-4 py-12 sm:px-6 sm:py-16 md:px-8 md:py-5">
        {/* LANGUAGE TOGGLER – removed, now in navbar */}

        {/* HERO HEADER */}
        <header className="mb-8 sm:mb-12 md:mb-16 text-center space-y-4 sm:space-y-6 max-w-4xl">
          <div className="inline-flex items-center gap-2 sm:gap-2.5 rounded-full border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 px-3 sm:px-5 py-1.5 sm:py-2 backdrop-blur-sm shadow-lg">
            <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] sm:tracking-[0.25em] text-emerald-300">
              {t("headerBadge")}
            </p>
          </div>

          <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-none px-2">
            <span className="bg-gradient-to-b from-slate-50 to-slate-300 bg-clip-text text-transparent">ViniBank</span>
            <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-300 bg-clip-text text-transparent animate-gradient" style={{ backgroundSize: '200% auto', animation: 'gradient 8s linear infinite' }}>
              {t("headerTitleHighlight")}
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-sm sm:text-base md:text-lg lg:text-xl text-slate-300 leading-relaxed font-normal px-4">
            {t("headerDescription")}
          </p>
        </header>

        {/* FEATURED PANEL (glassmorphism) */}
        <section className="group relative w-full max-w-4xl overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-800/60 bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-slate-800/90 p-6 sm:p-8 md:p-10 shadow-[0_30px_100px_rgba(0,0,0,0.5)] backdrop-blur-3xl transition-all duration-500 hover:border-emerald-500/40 hover:shadow-[0_40px_120px_rgba(16,185,129,0.2)]">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          
          <div className="relative flex flex-col items-center gap-5 sm:gap-6 sm:flex-row sm:justify-between">
            <div className="space-y-1.5 sm:space-y-2 text-center sm:text-left">
              <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.25em] sm:tracking-[0.3em] text-emerald-400">
                {t("heroLabel")}
              </p>
              <p className="text-sm sm:text-base text-slate-200">{t("heroDescription")}</p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col w-full sm:w-auto gap-2.5 sm:gap-3 sm:flex-row">
              <Link
                href="/demo"
                className="group/cta relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-cyan-500 px-6 sm:px-8 md:px-10 py-3 sm:py-3.5 md:py-4 text-sm sm:text-base font-bold text-slate-950 shadow-[0_20px_60px_rgba(16,185,129,0.4)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(16,185,129,0.5)] active:translate-y-0"
              >
                <span className="relative z-10">{t("ctaPrimary")}</span>
                <svg className="relative z-10 w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover/cta:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-emerald-500 opacity-0 transition-opacity duration-500 group-hover/cta:opacity-100" />
              </Link>

              <button className="group/sec inline-flex items-center justify-center gap-2 rounded-xl border-2 border-slate-700/80 bg-slate-900/60 px-6 sm:px-8 md:px-10 py-3 sm:py-3.5 md:py-4 text-sm sm:text-base font-semibold text-slate-200 backdrop-blur-xl transition-all duration-500 hover:border-slate-600 hover:bg-slate-800/80 hover:text-slate-50">
                {t("ctaSecondary")}
                <svg className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover/sec:rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </button>
            </div>
          </div>
        </section>

        {/* FEATURE CARDS GRID */}
        <section className="mt-8 sm:mt-12 md:mt-16 grid w-full max-w-6xl grid-cols-1 gap-4 sm:gap-5 md:gap-6 md:grid-cols-3">
          <article className="group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-800/60 bg-gradient-to-br from-slate-900/80 via-slate-900/70 to-slate-800/80 p-6 sm:p-7 md:p-8 text-left shadow-[0_20px_70px_rgba(0,0,0,0.4)] backdrop-blur-2xl transition-all duration-700 hover:-translate-y-2 sm:hover:-translate-y-3 hover:border-emerald-400/60 hover:shadow-[0_30px_90px_rgba(16,185,129,0.3)] before:absolute before:inset-0 before:rounded-2xl sm:before:rounded-3xl before:bg-gradient-to-br before:from-emerald-500/0 before:via-emerald-500/0 before:to-emerald-500/0 before:opacity-0 before:transition-all before:duration-700 hover:before:from-emerald-500/10 hover:before:via-transparent hover:before:to-transparent hover:before:opacity-100">
            <div className="relative z-10 space-y-2.5 sm:space-y-3">
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 transition-all duration-700 group-hover:scale-110 group-hover:border-emerald-400/50">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
              </div>
              <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] sm:tracking-[0.25em] text-emerald-300 transition-colors group-hover:text-emerald-200">
                {t("cardTechTitle")}
              </p>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed transition-colors group-hover:text-slate-200">{t("cardTechBody")}</p>
            </div>
          </article>

          <article className="group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-800/60 bg-gradient-to-br from-slate-900/80 via-slate-900/70 to-slate-800/80 p-6 sm:p-7 md:p-8 text-left shadow-[0_20px_70px_rgba(0,0,0,0.4)] backdrop-blur-2xl transition-all duration-700 hover:-translate-y-2 sm:hover:-translate-y-3 hover:border-cyan-400/60 hover:shadow-[0_30px_90px_rgba(34,211,238,0.3)] before:absolute before:inset-0 before:rounded-2xl sm:before:rounded-3xl before:bg-gradient-to-br before:from-cyan-500/0 before:via-cyan-500/0 before:to-cyan-500/0 before:opacity-0 before:transition-all before:duration-700 hover:before:from-cyan-500/10 hover:before:via-transparent hover:before:to-transparent hover:before:opacity-100">
            <div className="relative z-10 space-y-2.5 sm:space-y-3">
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 border border-cyan-500/30 transition-all duration-700 group-hover:scale-110 group-hover:border-cyan-400/50">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
              </div>
              <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] sm:tracking-[0.25em] text-cyan-300 transition-colors group-hover:text-cyan-200">
                {t("cardExperienceTitle")}
              </p>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed transition-colors group-hover:text-slate-200">{t("cardExperienceBody")}</p>
            </div>
          </article>

          <article className="group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-800/60 bg-gradient-to-br from-slate-900/80 via-slate-900/70 to-slate-800/80 p-6 sm:p-7 md:p-8 text-left shadow-[0_20px_70px_rgba(0,0,0,0.4)] backdrop-blur-2xl transition-all duration-700 hover:-translate-y-2 sm:hover:-translate-y-3 hover:border-purple-400/60 hover:shadow-[0_30px_90px_rgba(168,85,247,0.3)] before:absolute before:inset-0 before:rounded-2xl sm:before:rounded-3xl before:bg-gradient-to-br before:from-purple-500/0 before:via-purple-500/0 before:to-purple-500/0 before:opacity-0 before:transition-all before:duration-700 hover:before:from-purple-500/10 hover:before:via-transparent hover:before:to-transparent hover:before:opacity-100">
            <div className="relative z-10 space-y-2.5 sm:space-y-3">
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/30 transition-all duration-700 group-hover:scale-110 group-hover:border-purple-400/50">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] sm:tracking-[0.25em] text-purple-300 transition-colors group-hover:text-purple-200">
                {t("cardObjectiveTitle")}
              </p>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed transition-colors group-hover:text-slate-200">{t("cardObjectiveBody")}</p>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
