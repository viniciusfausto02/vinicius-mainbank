"use client";

import React, { createContext, useContext, useMemo, useState, useEffect, ReactNode } from "react";

export type Currency = "USD" | "BRL" | "EUR" | "GBP" | "JPY" | "CAD" | "AUD" | "CHF";

type CurrencyContextValue = {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
};

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("USD");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("vinibank-currency");
      if (saved === "USD" || saved === "BRL" || saved === "EUR" || saved === "GBP" || saved === "JPY" || saved === "CAD" || saved === "AUD" || saved === "CHF") {
        setCurrencyState(saved);
      }
    }
  }, []);

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    if (typeof window !== "undefined") {
      localStorage.setItem("vinibank-currency", newCurrency);
    }
  };

  const value = useMemo<CurrencyContextValue>(
    () => ({
      currency,
      setCurrency,
    }),
    [currency]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextValue {
  const context = useContext(CurrencyContext);
  if (!context) {
    if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
      console.warn("useCurrency fallback: CurrencyProvider not mounted yet. Using default 'USD'.");
    }
    return {
      currency: "USD",
      setCurrency: () => {},
    };
  }
  return context;
}
