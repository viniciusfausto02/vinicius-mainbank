"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface SensitiveDataToggleProps {
  accountId: string;
  accountName: string;
  maskedValue: string;
  fieldName: "accountNumber" | "routingNumber";
}

export default function SensitiveDataToggle({
  accountId,
  accountName,
  maskedValue,
  fieldName,
}: SensitiveDataToggleProps) {
  const { t } = useLanguage();
  const [isRevealed, setIsRevealed] = useState(false);
  const [decryptedValue, setDecryptedValue] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async () => {
    if (isRevealed) {
      // Hide the value
      setIsRevealed(false);
      setDecryptedValue(null);
      return;
    }

    // Show the value - decrypt it
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/accounts/decrypt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          fieldName,
          reason: `User viewed ${fieldName} for ${accountName}`,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to decrypt data");
      }

      const data = await response.json();
      setDecryptedValue(data.value);
      setIsRevealed(true);
    } catch (err) {
      console.error("Decrypt error:", err);
      setError("Failed to load sensitive data");
    } finally {
      setIsLoading(false);
    }
  };

  const label = fieldName === "accountNumber" ? "Account Number" : "Routing Number";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <span className="text-xs text-slate-400 block mb-1">{label}</span>
        <span className="font-mono text-sm">
          {isRevealed && decryptedValue ? decryptedValue : maskedValue}
        </span>
      </div>
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all disabled:opacity-50
                   bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
      >
        {isLoading ? (
          <span className="flex items-center gap-1">
            <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </span>
        ) : isRevealed ? (
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
              />
            </svg>
            Hide
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            Show
          </span>
        )}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
