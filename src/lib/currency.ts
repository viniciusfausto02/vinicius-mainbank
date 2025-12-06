import { Locale } from "@/contexts/LanguageContext";
import { Currency } from "@/contexts/CurrencyContext";

export type Rates = Record<string, number>;

export function currencyForLocale(locale: Locale): "USD" | "BRL" | "EUR" {
  switch (locale) {
    case "pt":
      return "BRL";
    case "de":
    case "es":
      return "EUR";
    case "en":
    default:
      return "USD";
  }
}

export function localeTagForLocale(locale: Locale): string {
  switch (locale) {
    case "pt":
      return "pt-BR";
    case "de":
      return "de-DE";
    case "es":
      return "es-ES";
    case "en":
    default:
      return "en-US";
  }
}

const fallbackRate = 1;

function getRate(rates: Rates, code: string): number {
  if (!rates) return fallbackRate;
  if (rates[code] !== undefined) return rates[code];
  return fallbackRate;
}

export function convertAmountCents(
  amountCents: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Rates,
): number {
  if (fromCurrency === toCurrency) return amountCents / 100;
  
  // Rates from API are: 1 USD = X currency
  // So rates.BRL = 5.31 means 1 USD = 5.31 BRL
  // To convert FROM any currency TO any currency:
  // 1. Convert source to USD: amount / rates[from]
  // 2. Convert USD to target: result * rates[to]
  
  const fromRate = getRate(rates, fromCurrency);
  const toRate = getRate(rates, toCurrency);
  
  // If rates are not available (both are 1), return the original value in dollars
  if (fromRate === 1 && toRate === 1 && fromCurrency !== toCurrency) {
    console.warn(`[Currency] Rates not loaded yet. From: ${fromCurrency}, To: ${toCurrency}, Rates available:`, Object.keys(rates));
    return amountCents / 100; // Return unconverted value
  }
  
  const valueInUSD = (amountCents / 100) / fromRate;
  const valueInTarget = valueInUSD * toRate;
  
  return valueInTarget;
}

export function formatCurrencyWithRates(
  amountCents: number,
  locale: Locale,
  rates: Rates,
  fromCurrency: string = "USD",
  targetCurrency?: Currency,
): string {
  const target = targetCurrency || currencyForLocale(locale);
  const value = convertAmountCents(amountCents, fromCurrency, target, rates);
  
  return new Intl.NumberFormat(localeTagForLocale(locale), {
    style: "currency",
    currency: target,
    maximumFractionDigits: 2,
  }).format(value);
}

export function parseLocalInputToBaseCents(
  input: string,
  locale: Locale,
  rates: Rates,
  baseCurrency: string = "USD",
): number | null {
  const sanitized = input.replace(/,/g, ".");
  const numeric = Number(sanitized);
  if (!Number.isFinite(numeric) || numeric < 0) return null;
  const target = currencyForLocale(locale);
  const rateTarget = getRate(rates, target);
  const rateBase = getRate(rates, baseCurrency);
  const baseValue = numeric * (rateBase / rateTarget);
  return Math.round(baseValue * 100);
}
