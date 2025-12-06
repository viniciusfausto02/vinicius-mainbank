"use client";

// src/app/demo/TransferForm.tsx
//
// Client-side component responsible for:
// - Letting the user choose source and destination accounts.
// - Entering an amount and description.
// - Calling the /api/transfer endpoint.
// - Triggering a refresh of the server component so balances +
//   transactions update live.
//
// This separation (server page + client form) shows you understand
// the Next.js App Router mental model.

import { useState, FormEvent } from "react";
import { Account } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import { useConfirm } from "@/components/ConfirmDialog";

type TransferFormProps = {
  accounts: Account[];
  onTransferSuccess?: () => void;
};

export default function TransferForm({ accounts, onTransferSuccess }: TransferFormProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const toast = useToast();
  const { confirm, ConfirmDialogComponent } = useConfirm();

  // Local form state. Storing ids as strings and amount as string
  // so we can easily capture the raw input and then normalize.
  const [fromAccountId, setFromAccountId] = useState<string>(
    accounts[0]?.id ?? ""
  );
  const [toAccountId, setToAccountId] = useState<string>(
    accounts[1]?.id ?? accounts[0]?.id ?? ""
  );
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  const fromAccount = accounts.find(a => a.id === fromAccountId) || null;
  const toAccount = accounts.find(a => a.id === toAccountId) || null;
  const parsedCents = (() => {
    const n = Number(amount.replace(",", "."));
    if (!Number.isFinite(n)) return null;
    return Math.round(Math.max(0, n) * 100);
  })();
  const insufficientFunds = !!fromAccount && !!parsedCents && parsedCents > fromAccount.balanceCents;

  // Helper: convert "123.45" (user input) into integer cents (12345).
  function parseAmountToCents(raw: string): number | null {
    const numeric = Number(raw.replace(",", "."));
    if (!Number.isFinite(numeric) || numeric <= 0) {
      return null;
    }
    return Math.round(numeric * 100);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const amountCents = parseAmountToCents(amount);

    // Validações
    if (!amountCents) {
      toast.error(t("transferErrorAmount"));
      return;
    }
    
    if (insufficientFunds) {
      toast.error(t("transferInsufficientFunds"));
      return;
    }

    if (!fromAccountId || !toAccountId) {
      toast.error(t("transferErrorAccounts"));
      return;
    }

    if (fromAccountId === toAccountId) {
      toast.error(t("transferErrorSameAccount"));
      return;
    }

    // Confirmar transferência
    const confirmed = await confirm({
      title: t('confirmTransfer'),
      message: t('confirmTransferMessage')
        .replace('${amount}', `$${(amountCents / 100).toFixed(2)}`)
        .replace('${from}', fromAccount?.name || 'Account')
        .replace('${to}', toAccount?.name || 'Account'),
      confirmText: t('confirmTransferButton'),
      cancelText: t('confirmCancelButton'),
      variant: 'warning',
    });

    if (!confirmed) return;

    setIsSubmitting(true);

    try {
      const key = (typeof crypto !== "undefined" && 'randomUUID' in crypto)
        ? (crypto as any).randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36);
      const response = await fetch("/api/transfer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": key,
        },
        body: JSON.stringify({
          fromAccountId,
          toAccountId,
          amountCents,
          description: description.trim() || t("transferDefaultDescription"),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data?.error ?? t("transferErrorFailed"));
        return;
      }

      toast.success(t("transferSuccess"));
      setAmount("");
      setDescription("");

      // Trigger a refresh of the server component so that the
      // latest balances + transactions are re-fetched from the DB.
      router.refresh();
      
      // Call the optional callback if provided
      if (onTransferSuccess) {
        onTransferSuccess();
      }
    } catch (err) {
      console.error("[TransferForm] error:", err);
      toast.error(t("transferErrorUnexpected"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <ConfirmDialogComponent />
      {/* The form itself – designed mobile-first:
          - On small screens everything is stacked.
          - On larger screens, fields align side by side where it helps. */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 text-sm text-slate-100"
      >
        {/* From account selector */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium uppercase tracking-[0.15em] text-slate-400">
            {t("transferFromLabel")}
          </label>
          <select
            value={fromAccountId}
            onChange={(event) => setFromAccountId(event.target.value)}
            className="h-10 w-full rounded-xl border border-slate-700/50 bg-slate-950/80 px-4 text-sm outline-none transition-all duration-300 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/20 hover:border-slate-600"
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} · {account.mask}
              </option>
            ))}
          </select>
        </div>

        {/* To account selector */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium uppercase tracking-[0.15em] text-slate-400">
            {t("transferToLabel")}
          </label>
          <select
            value={toAccountId}
            onChange={(event) => setToAccountId(event.target.value)}
            className="h-10 w-full rounded-xl border border-slate-700/50 bg-slate-950/80 px-4 text-sm outline-none transition-all duration-300 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/20 hover:border-slate-600"
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} · {account.mask}
              </option>
            ))}
          </select>
        </div>

        {/* Amount + description – become side-by-side on larger screens */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex flex-1 min-w-0 flex-col gap-2">
            <label className="text-xs font-medium uppercase tracking-[0.15em] text-slate-400">
              {t("transferAmountLabel")}
            </label>
            <div className="flex items-center gap-2">
              <span className="rounded-xl bg-slate-900/90 px-3 py-2 text-xs font-medium text-slate-400">
                USD
              </span>
              <input
                type="text"
                inputMode="decimal"
                placeholder={t("transferAmountPlaceholder")}
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="h-10 flex-1 w-full rounded-xl border border-slate-700/50 bg-slate-950/80 px-4 text-sm outline-none transition-all duration-300 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/20 hover:border-slate-600"
              />
            </div>
          </div>

          <div className="flex flex-1 min-w-0 flex-col gap-2">
            <label className="text-xs font-medium uppercase tracking-[0.15em] text-slate-400">
              {t("transferDescriptionLabel")}
            </label>
            <input
              type="text"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="h-10 w-full rounded-xl border border-slate-700/50 bg-slate-950/80 px-4 text-sm outline-none transition-all duration-300 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/20 hover:border-slate-600"
              placeholder={t("transferDescriptionPlaceholder")}
            />
          </div>
        </div>

        {/* Submit button: low height, more horizontal than vertical */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || insufficientFunds}
            className="inline-flex items-center rounded-xl border border-violet-400/50 bg-gradient-to-r from-violet-500 to-purple-600 px-6 py-2.5 text-xs font-semibold text-white shadow-[0_10px_30px_rgba(139,92,246,0.4)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(139,92,246,0.55)] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            {isSubmitting ? t("transferSubmittingButton") : t("transferSubmitButton")}
          </button>
        </div>
      </form>
    </>
  );
}
