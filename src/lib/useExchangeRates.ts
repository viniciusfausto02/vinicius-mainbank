import { useEffect, useState } from "react";
import type { Rates } from "./currency";

const BASE = "USD";
let cachedRates: Rates | null = null;
let inFlight: Promise<Rates> | null = null;

async function fetchRates(): Promise<Rates> {
  if (cachedRates) return cachedRates;
  if (inFlight) return inFlight;

  inFlight = fetch("/api/rates")
    .then(async (res) => {
      if (!res.ok) {
        throw new Error(`Failed to fetch rates: ${res.status}`);
      }
      
      const json = await res.json();
      
      if (!json.rates) {
        throw new Error("No rates in response");
      }
      
      const rates: Rates = json.rates;
      rates[BASE] = 1;
      cachedRates = rates;
      
      return rates;
    })
    .catch((err) => {
      console.error("[Rates] Error fetching exchange rates:", err);
      cachedRates = { [BASE]: 1 };
      return cachedRates;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

export function useExchangeRates(): { rates: Rates; status: "loading" | "ready" | "error" } {
  const [rates, setRates] = useState<Rates>(cachedRates ?? { [BASE]: 1 });
  const [status, setStatus] = useState<"loading" | "ready" | "error">(cachedRates ? "ready" : "loading");

  useEffect(() => {
    let active = true;
    fetchRates()
      .then((r) => {
        if (!active) return;
        setRates(r);
        setStatus("ready");
      })
      .catch(() => {
        if (!active) return;
        setRates({ [BASE]: 1 });
        setStatus("error");
      });
    return () => {
      active = false;
    };
  }, []);

  return { rates, status };
}
