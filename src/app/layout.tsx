import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { LanguageRoot } from "./LanguageRoot";
import Navbar from "./Navbar";
import PageTransition from "@/components/PageTransition";
import LoadingBar from "@/components/LoadingBar";
import { ToastProvider } from "@/contexts/ToastContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { Suspense } from "react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ViniBank · Demo banking simulation",
  description: "A realistic digital banking simulation built with Next.js.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      {/* Global background + antialiasing + overflow containment */}
      <body className="bg-slate-950 text-slate-50 antialiased overflow-x-hidden relative font-sans">
        {/* LanguageRoot is a small client wrapper that mounts LanguageProvider.
            Navbar + all pages below it will have access to useLanguage(). */}
        <ToastProvider>
          <LanguageRoot>
            <CurrencyProvider>
              <Suspense>
                <LoadingBar />
              </Suspense>
              <Navbar />
              {/* Give room for the fixed navbar. */}
              <PageTransition>
                <div className="pt-16 sm:pt-20">{children}</div>
              </PageTransition>
            </CurrencyProvider>
          </LanguageRoot>
        </ToastProvider>
      </body>
    </html>
  );
}
