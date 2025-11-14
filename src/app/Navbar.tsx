"use client";

// src/app/Navbar.tsx
//
// Global navigation bar for ViniBank.
// Responsibilities:
// - Show brand link and basic navigation links (Home, Demo, Login, Register).
// - Expose language dropdown, backed by LanguageContext.
// - Be mobile-friendly and fixed to the top of the viewport.

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const { locale, setLocale, t } = useLanguage();
  const { data: session, status } = useSession();

  // Local UI state for the language dropdown open/close.
  const [open, setOpen] = useState<boolean>(false);
  // Mobile menu toggle (single navbar, no second bar)
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close the dropdown when clicking outside.
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  // Current flag and label
  const currentFlag = (() => {
    switch (locale) {
      case "en": return { src: "/flags/us.svg", alt: "EN" };
      case "pt": return { src: "/flags/br.svg", alt: "PT" };
      case "es": return { src: "/flags/es.svg", alt: "ES" };
      case "de": return { src: "/flags/de.svg", alt: "DE" };
      default: return { src: "/flags/us.svg", alt: "EN" };
    }
  })();

  return (
    <nav className="fixed inset-x-0 top-0 z-[500] bg-slate-950 border-b border-emerald-500/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 sm:h-20 items-center justify-between">
          {/* Left: Brand */}
          <Link href="/" className="group flex items-center gap-2 sm:gap-3 transition-opacity hover:opacity-80">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-400/40 to-cyan-500/40 blur-lg sm:blur-xl opacity-70 transition-opacity group-hover:opacity-100" />
              <div className="relative flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-400 to-cyan-500 shadow-lg sm:shadow-2xl shadow-emerald-500/30">
                <span className="text-base sm:text-lg font-black text-white">V</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-black tracking-tight bg-gradient-to-r from-white to-emerald-100 bg-clip-text text-transparent">ViniBank</span>
              <span className="hidden xs:block text-[9px] sm:text-[10px] font-medium uppercase tracking-[0.15em] sm:tracking-[0.2em] text-emerald-400/80">Digital Banking</span>
            </div>
          </Link>

          {/* Center: Nav links (hidden on small, shown inline on large) */}
          <div className="hidden lg:flex items-center gap-2">
            <Link href="/demo" className="group relative px-5 py-2.5 text-sm font-semibold text-emerald-100 transition-all duration-300 hover:text-emerald-300">
              <span className="relative z-10">{t("navDashboard")}</span>
              <div className="absolute inset-0 rounded-xl bg-emerald-500/0 transition-all duration-300 group-hover:bg-emerald-500/10" />
            </Link>
            {status === "authenticated" && (session.user as any)?.role === "ADMIN" && (
              <Link href="/admin" className="group relative px-5 py-2.5 text-sm font-semibold text-emerald-100 transition-all duration-300 hover:text-cyan-300">
                <span className="relative z-10">{t("navAdmin")}</span>
                <div className="absolute inset-0 rounded-xl bg-cyan-500/0 transition-all duration-300 group-hover:bg-cyan-500/10" />
              </Link>
            )}
          </div>

          {/* Right: Auth + Language */}
          <div className="flex items-center gap-2 sm:gap-3">
            {status === "authenticated" ? (
              <>
                <div className="hidden lg:flex items-center gap-2.5 rounded-xl bg-emerald-500/10 px-4 py-2.5 border border-emerald-500/30 backdrop-blur-sm">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,1)] animate-pulse" />
                  <span className="text-sm font-medium text-emerald-100">
                    {session.user?.name || session.user?.email}
                  </span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="hidden lg:flex items-center gap-2 rounded-xl bg-rose-500/10 px-5 py-2.5 text-sm font-semibold text-rose-200 border border-rose-500/30 backdrop-blur-sm transition-all duration-300 hover:bg-rose-500/20 hover:text-rose-100 hover:border-rose-500/50"
                >
                  {t("navSignOut")}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden lg:flex rounded-xl px-5 py-2.5 text-sm font-semibold text-emerald-100 transition-all duration-300 hover:text-emerald-300"
                >
                  {t("navLogin")}
                </Link>
                <Link
                  href="/register"
                  className="group relative overflow-hidden rounded-lg sm:rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-cyan-500 px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-black shadow-[0_8px_30px_rgba(16,185,129,0.4)] transition-all duration-300 hover:shadow-[0_12px_40px_rgba(16,185,129,0.6)] hover:scale-105 whitespace-nowrap"
                >
                  <span className="relative z-10">{t("navGetStarted")}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-emerald-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </Link>
              </>
            )}

            {/* Language dropdown */}
            <div ref={dropdownRef} className="relative z-[550]">
              <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className="group flex items-center gap-1 sm:gap-1.5 rounded-lg sm:rounded-xl bg-emerald-500/10 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 border border-emerald-500/30 backdrop-blur-sm transition-all duration-300 hover:bg-emerald-500/20 hover:border-emerald-500/50 whitespace-nowrap"
              >
                <img src={currentFlag.src} alt={currentFlag.alt} width={24} height={16} className="rounded-[2px]" />
                <ChevronDown className={`h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-white transition-all duration-300 ${open ? 'rotate-180' : ''}`} />
              </button>

              {open && (
                <div className="absolute right-0 top-11 sm:top-12 md:top-14 z-[560] w-40 sm:w-48 md:w-56 rounded-lg sm:rounded-xl md:rounded-2xl border border-emerald-500/20 bg-slate-900/98 p-1 sm:p-1.5 md:p-2 shadow-[0_20px_70px_rgba(16,185,129,0.3)] backdrop-blur-2xl">
                  {/* English */}
                  <button
                    type="button"
                    onClick={() => { setLocale("en"); setOpen(false); }}
                    className={`flex w-full items-center justify-between rounded-lg sm:rounded-lg md:rounded-xl px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-left transition-all duration-300 ${
                      locale === "en"
                        ? "bg-gradient-to-r from-emerald-500/30 to-cyan-500/30 text-white shadow-lg shadow-emerald-500/20"
                        : "text-slate-200 hover:bg-emerald-500/10 hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
                      <img src="/flags/us.svg" alt="EN" width={20} height={14} className="rounded-[2px]"/>
                      <span className="text-xs sm:text-xs md:text-sm font-semibold">{t("languageToggleEnglish")}</span>
                    </span>
                    {locale === "en" && (
                      <span className="rounded-full bg-emerald-400/30 px-1.5 sm:px-2 md:px-2.5 py-0.5 text-[8px] sm:text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-emerald-200 border border-emerald-400/40 flex-shrink-0">
                        {t("languageToggleActive")}
                      </span>
                    )}
                  </button>

                  {/* Portuguese */}
                  <button
                    type="button"
                    onClick={() => { setLocale("pt"); setOpen(false); }}
                    className={`mt-0.5 sm:mt-1 flex w-full items-center justify-between rounded-lg sm:rounded-lg md:rounded-xl px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-left transition-all duration-300 ${
                      locale === "pt"
                        ? "bg-gradient-to-r from-emerald-500/30 to-cyan-500/30 text-white shadow-lg shadow-emerald-500/20"
                        : "text-slate-200 hover:bg-emerald-500/10 hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
                      <img src="/flags/br.svg" alt="PT" width={20} height={14} className="rounded-[2px]"/>
                      <span className="text-xs sm:text-xs md:text-sm font-semibold">{t("languageTogglePortuguese")}</span>
                    </span>
                    {locale === "pt" && (
                      <span className="rounded-full bg-emerald-400/30 px-1.5 sm:px-2 md:px-2.5 py-0.5 text-[8px] sm:text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-emerald-200 border border-emerald-400/40 flex-shrink-0">
                        {t("languageToggleActive")}
                      </span>
                    )}
                  </button>

                  {/* Spanish */}
                  <button
                    type="button"
                    onClick={() => { setLocale("es"); setOpen(false); }}
                    className={`mt-0.5 sm:mt-1 flex w-full items-center justify-between rounded-lg sm:rounded-lg md:rounded-xl px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-left transition-all duration-300 ${
                      locale === "es"
                        ? "bg-gradient-to-r from-emerald-500/30 to-cyan-500/30 text-white shadow-lg shadow-emerald-500/20"
                        : "text-slate-200 hover:bg-emerald-500/10 hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
                      <img src="/flags/es.svg" alt="ES" width={20} height={14} className="rounded-[2px]"/>
                      <span className="text-xs sm:text-xs md:text-sm font-semibold">{t("languageToggleSpanish")}</span>
                    </span>
                    {locale === "es" && (
                      <span className="rounded-full bg-emerald-400/30 px-1.5 sm:px-2 md:px-2.5 py-0.5 text-[8px] sm:text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-emerald-200 border border-emerald-400/40 flex-shrink-0">
                        {t("languageToggleActive")}
                      </span>
                    )}
                  </button>

                  {/* German */}
                  <button
                    type="button"
                    onClick={() => { setLocale("de"); setOpen(false); }}
                    className={`mt-0.5 sm:mt-1 flex w-full items-center justify-between rounded-lg sm:rounded-lg md:rounded-xl px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-left transition-all duration-300 ${
                      locale === "de"
                        ? "bg-gradient-to-r from-emerald-500/30 to-cyan-500/30 text-white shadow-lg shadow-emerald-500/20"
                        : "text-slate-200 hover:bg-emerald-500/10 hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
                      <img src="/flags/de.svg" alt="DE" width={20} height={14} className="rounded-[2px]"/>
                      <span className="text-xs sm:text-xs md:text-sm font-semibold">{t("languageToggleGerman")}</span>
                    </span>
                    {locale === "de" && (
                      <span className="rounded-full bg-emerald-400/30 px-1.5 sm:px-2 md:px-2.5 py-0.5 text-[8px] sm:text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-emerald-200 border border-emerald-400/40 flex-shrink-0">
                        {t("languageToggleActive")}
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>
            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setMobileOpen((m) => !m)}
              className="lg:hidden rounded-lg border border-slate-700/60 bg-slate-800/50 px-2.5 sm:px-3 py-1.5 sm:py-2 text-slate-200 text-xs font-medium backdrop-blur-sm active:scale-95 transition flex items-center gap-1 whitespace-nowrap"
              aria-label="Toggle navigation"
            >
              <span className="hidden sm:inline">{mobileOpen ? 'Close' : 'Menu'}</span>
              <span className="sm:hidden">{mobileOpen ? '✕' : '☰'}</span>
              <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {mobileOpen ? (
                  <path d="M18 6L6 18M6 6l12 12" />
                ) : (
                  <path d="M3 6h18M3 12h18M3 18h18" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>
      {/* Mobile overlay panel */}
      {mobileOpen && (
        <div className="lg:hidden absolute inset-x-0 top-full z-[510] bg-slate-950/98 backdrop-blur-xl border-b border-emerald-500/20 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-4">
            {/* Navigation section */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400/70 px-1">Navigation</p>
              <Link href="/demo" onClick={() => setMobileOpen(false)} className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold text-emerald-100 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all duration-300">
                <span className="text-lg">📊</span>
                {t("navDashboard")}
              </Link>
              {status === "authenticated" && (session.user as any)?.role === "ADMIN" && (
                <Link href="/admin" onClick={() => setMobileOpen(false)} className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold text-cyan-100 bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all duration-300">
                  <span className="text-lg">⚙️</span>
                  {t("navAdmin")}
                </Link>
              )}
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />

            {/* Auth section */}
            {status === "authenticated" ? (
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400/70 px-1">Account</p>
                <div className="rounded-xl bg-emerald-500/10 px-4 py-3.5 border border-emerald-500/30 flex items-center gap-3">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)] animate-pulse" />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-emerald-300 font-medium uppercase tracking-wider block">Logged in as</span>
                    <span className="text-sm font-semibold text-emerald-100 truncate block">{session.user?.name || session.user?.email}</span>
                  </div>
                </div>
                <button 
                  onClick={() => { setMobileOpen(false); signOut({ callbackUrl: "/" }); }} 
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-500/10 px-4 py-3.5 text-sm font-semibold text-rose-200 border border-rose-500/30 hover:bg-rose-500/20 hover:border-rose-500/50 transition-all duration-300"
                >
                  <span>🚪</span>
                  {t("navSignOut")}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400/70 px-1">Authentication</p>
                <Link 
                  href="/login" 
                  onClick={() => setMobileOpen(false)} 
                  className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold text-emerald-100 border border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/15 hover:border-emerald-500/50 transition-all duration-300"
                >
                  <span>🔓</span>
                  {t("navLogin")}
                </Link>
                <Link 
                  href="/register" 
                  onClick={() => setMobileOpen(false)} 
                  className="group relative overflow-hidden flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-cyan-500 px-4 py-3.5 text-sm font-bold text-black shadow-[0_8px_30px_rgba(16,185,129,0.4)] hover:shadow-[0_12px_40px_rgba(16,185,129,0.6)] transition-all duration-300"
                >
                  <span className="relative z-10">✨</span>
                  <span className="relative z-10">{t("navGetStarted")}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-emerald-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
