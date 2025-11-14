"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsTransitioning(true);
    const timeout = setTimeout(() => setIsTransitioning(false), 150);
    return () => clearTimeout(timeout);
  }, [pathname]);

  return (
    <>
      {/* Loading overlay */}
      <div
        className={`fixed inset-0 z-[9999] bg-slate-950 transition-opacity duration-150 pointer-events-none ${
          isTransitioning ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex h-full items-center justify-center">
          <div className="relative">
            {/* Spinning gradient ring */}
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-800 border-t-emerald-500" />
            {/* Inner glow */}
            <div className="absolute inset-0 h-12 w-12 animate-pulse rounded-full bg-emerald-500/20 blur-xl" />
          </div>
        </div>
      </div>

      {/* Content with fade transition */}
      <div
        className={`transition-opacity duration-150 ${
          isTransitioning ? "opacity-0" : "opacity-100"
        }`}
      >
        {children}
      </div>
    </>
  );
}
