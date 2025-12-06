"use client";

// src/app/demo/UserTransferForm.tsx
//
// Component for transferring money to another ViniBank user.
// Features:
// - Search recipient by email, phone, or CPF
// - Select source account
// - Enter amount and description
// - Real-time validation

import { useState, FormEvent } from "react";
import { Account } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import { useConfirm } from "@/components/ConfirmDialog";

type UserTransferFormProps = {
  accounts: Account[];
  onTransferSuccess?: () => void;
};

export default function UserTransferForm({ accounts, onTransferSuccess }: UserTransferFormProps) {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const toast = useToast();
  const { confirm, ConfirmDialogComponent } = useConfirm();

  const [fromAccountId, setFromAccountId] = useState<string>(accounts[0]?.id ?? "");
  const [recipientEmail, setRecipientEmail] = useState<string>("");
  const [recipientPhone, setRecipientPhone] = useState<string>("");
  const [recipientCPF, setRecipientCPF] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [recipientInfo, setRecipientInfo] = useState<any>(null);

  const fromAccount = accounts.find(a => a.id === fromAccountId);
  const parsedCents = (() => {
    const n = Number(amount.replace(",", "."));
    if (!Number.isFinite(n)) return null;
    return Math.round(Math.max(0, n) * 100);
  })();
  const insufficientFunds = !!fromAccount && !!parsedCents && parsedCents > fromAccount.balanceCents;

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

    if (!amountCents) {
      toast.error(t("transferErrorAmount"));
      return;
    }

    if (insufficientFunds) {
      toast.error(t("transferInsufficientFunds"));
      return;
    }

    if (!fromAccountId) {
      toast.error(t("userTransferErrorNoAccount"));
      return;
    }

    const hasRecipient = recipientEmail || recipientPhone || recipientCPF;
    if (!hasRecipient) {
      toast.error(t("userTransferErrorNoRecipient"));
      return;
    }

    if (!description.trim()) {
      toast.error(t("userTransferErrorNoDescription"));
      return;
    }

    // Confirmar transferência
    const recipientDisplay = recipientEmail || recipientPhone || recipientCPF;
    const confirmed = await confirm({
      title: t('confirmUserTransfer'),
      message: t('confirmTransferMessage')
        .replace('${amount}', `$${(amountCents / 100).toFixed(2)}`)
        .replace('${from}', fromAccount?.name || 'Account')
        .replace('${to}', recipientDisplay),
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
      const response = await fetch("/api/transfer/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": key,
        },
        body: JSON.stringify({
          fromAccountId,
          recipientEmail: recipientEmail || undefined,
          recipientPhone: recipientPhone || undefined,
          recipientCPF: recipientCPF || undefined,
          amountCents,
          description: description.trim(),
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
      setRecipientEmail("");
      setRecipientPhone("");
      setRecipientCPF("");
      setRecipientInfo(null);

      router.refresh();
      if (onTransferSuccess) {
        onTransferSuccess();
      }
    } catch (err) {
      console.error("[UserTransferForm] error:", err);
      toast.error(t("transferErrorUnexpected"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <ConfirmDialogComponent />
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-sm text-slate-100">
        {/* From account selector */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium uppercase tracking-[0.15em] text-slate-400">
            {t("userTransferFromAccount")}
          </label>
          <select
            value={fromAccountId}
            onChange={(event) => setFromAccountId(event.target.value)}
            className="h-10 w-full rounded-xl border border-slate-700/50 bg-slate-950/80 px-4 text-sm outline-none transition-all duration-300 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-500/20 hover:border-slate-600"
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} · {account.mask}
              </option>
            ))}
          </select>
        </div>

        {/* Recipient identifier */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium uppercase tracking-[0.15em] text-slate-400">
              {t("userTransferRecipientEmail")}
            </label>
            <input
              type="email"
              value={recipientEmail}
              onChange={(event) => setRecipientEmail(event.target.value)}
              placeholder={t("userTransferEmailPlaceholder")}
              className="h-10 w-full rounded-xl border border-slate-700/50 bg-slate-950/80 px-4 text-sm outline-none transition-all duration-300 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-500/20 hover:border-slate-600"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium uppercase tracking-[0.15em] text-slate-400">
              {t("userTransferOrPhone")}
            </label>
            <input
              type="tel"
              value={recipientPhone}
              onChange={(event) => setRecipientPhone(event.target.value)}
              placeholder={t("userTransferPhonePlaceholder")}
              className="h-10 w-full rounded-xl border border-slate-700/50 bg-slate-950/80 px-4 text-sm outline-none transition-all duration-300 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-500/20 hover:border-slate-600"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium uppercase tracking-[0.15em] text-slate-400">
              {t("userTransferOrCPF")}
            </label>
            <input
              type="text"
              value={recipientCPF}
              onChange={(event) => setRecipientCPF(event.target.value)}
              placeholder={t("userTransferCPFPlaceholder")}
              className="h-10 w-full rounded-xl border border-slate-700/50 bg-slate-950/80 px-4 text-sm outline-none transition-all duration-300 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-500/20 hover:border-slate-600"
            />
          </div>
        </div>

        {/* Amount and description */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex flex-1 min-w-0 flex-col gap-2">
            <label className="text-xs font-medium uppercase tracking-[0.15em] text-slate-400">
              {t("userTransferAmount")}
            </label>
            <div className="flex items-center gap-2">
              <span className="rounded-xl bg-slate-900/90 px-3 py-2 text-xs font-medium text-slate-400">
                USD
              </span>
              <input
                type="text"
                inputMode="decimal"
                placeholder={t("userTransferAmountPlaceholder")}
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="h-10 flex-1 w-full rounded-xl border border-slate-700/50 bg-slate-950/80 px-4 text-sm outline-none transition-all duration-300 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-500/20 hover:border-slate-600"
              />
            </div>
          </div>

          <div className="flex flex-1 min-w-0 flex-col gap-2">
            <label className="text-xs font-medium uppercase tracking-[0.15em] text-slate-400">
              {t("userTransferDescription")}
            </label>
            <input
              type="text"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={t("userTransferDescriptionPlaceholder")}
              className="h-10 w-full rounded-xl border border-slate-700/50 bg-slate-950/80 px-4 text-sm outline-none transition-all duration-300 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-500/20 hover:border-slate-600"
            />
          </div>
        </div>

        {/* Submit button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || insufficientFunds}
            className="inline-flex items-center rounded-xl border border-emerald-400/50 bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-2.5 text-xs font-semibold text-white shadow-[0_10px_30px_rgba(16,185,129,0.4)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(16,185,129,0.55)] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            {isSubmitting ? t("userTransferSendingButton") : t("userTransferSendButton")}
          </button>
        </div>
      </form>
    </>
  );
}
