"use client";

import { useState, useEffect, useCallback } from "react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useExchangeRates } from "@/lib/useExchangeRates";
import { formatCurrencyWithRates } from "@/lib/currency";
import type { Locale } from "@/contexts/LanguageContext";
import CreateGoalModal from "./CreateGoalModal";
import Confetti from "./Confetti";

type SavingsGoalStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";

type SavingsGoal = {
  id: string;
  name: string;
  targetCents: number;
  currentCents: number;
  targetDate: string | null;
  description: string | null;
  color: string | null;
  icon: string | null;
  status: SavingsGoalStatus;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type Props = {
  locale: Locale;
};

export default function SavingsGoalsPanel({ locale }: Props) {
  const { currency } = useCurrency();
  const { rates } = useExchangeRates();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [addingFundsId, setAddingFundsId] = useState<string | null>(null);
  const [addingAmount, setAddingAmount] = useState("");
  const [celebratingId, setCelebratingId] = useState<string | null>(null);

  const formatMoney = useCallback(
    (amountCents: number) =>
      formatCurrencyWithRates(amountCents, locale, rates, "USD", currency),
    [locale, rates, currency]
  );

  const loadGoals = async () => {
    try {
      const res = await fetch("/api/savings-goals");
      const data = await res.json();
      if (res.ok) {
        setGoals(data.goals);
      }
    } catch (error) {
      console.error("Failed to load savings goals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async (formData: {
    name: string;
    targetCents: number;
    targetDate?: string;
    description?: string;
    icon?: string;
    color?: string;
  }) => {
    try {
      const res = await fetch("/api/savings-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        await loadGoals();
      }
    } catch (error) {
      console.error("Failed to create goal:", error);
    }
  };

  const handleAddFunds = async (goalId: string) => {
    if (!addingAmount || parseFloat(addingAmount) <= 0) return;

    try {
      const amountCents = Math.round(parseFloat(addingAmount) * 100);
      const res = await fetch(`/api/savings-goals/${goalId}/add-funds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountCents }),
      });

      if (res.ok) {
        const { completed } = await res.json();
        if (completed) {
          setCelebratingId(goalId);
          setTimeout(() => setCelebratingId(null), 3000);
        }
        setAddingAmount("");
        setAddingFundsId(null);
        await loadGoals();
      }
    } catch (error) {
      console.error("Failed to add funds:", error);
    }
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getDaysRemaining = (targetDate: string | null) => {
    if (!targetDate) return null;
    const today = new Date();
    const target = new Date(targetDate);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDailySavingsNeeded = (goal: SavingsGoal) => {
    const daysRemaining = getDaysRemaining(goal.targetDate);
    if (!daysRemaining || daysRemaining <= 0) return 0;
    const remainingCents = goal.targetCents - goal.currentCents;
    return Math.ceil(remainingCents / daysRemaining);
  };

  const activeGoals = goals.filter((g) => g.status === "ACTIVE");
  const completedGoals = goals.filter((g) => g.status === "COMPLETED");

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-400">
          {locale === "pt" ? "Carregando metas..." : "Loading goals..."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Confetti trigger={celebratingId !== null} />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {locale === "pt" ? "Metas de Poupança" : "Savings Goals"}
          </h2>
          <p className="text-gray-400 text-sm">
            {locale === "pt"
              ? "Defina e acompanhe seus objetivos financeiros"
              : "Set and track your financial objectives"}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
        >
          {locale === "pt" ? "+ Nova Meta" : "+ New Goal"}
        </button>
      </div>

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-300">
            {locale === "pt" ? "Metas Ativas" : "Active Goals"}
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {activeGoals.map((goal) => {
              const progress = calculateProgress(
                goal.currentCents,
                goal.targetCents
              );
              const daysRemaining = getDaysRemaining(goal.targetDate);
              const dailySavings = getDailySavingsNeeded(goal);

              return (
                <div
                  key={goal.id}
                  className="bg-gray-800 rounded-lg p-5 border border-gray-700 hover:border-gray-600 transition-all"
                >
                  {/* Goal Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{goal.icon || "🎯"}</span>
                      <div>
                        <h4 className="text-lg font-semibold text-white">
                          {goal.name}
                        </h4>
                        {goal.description && (
                          <p className="text-sm text-gray-400">
                            {goal.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-400">
                        {locale === "pt" ? "Progresso" : "Progress"}
                      </span>
                      <span className="font-semibold text-white">
                        {progress.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-500 rounded-full"
                        style={{
                          width: `${progress}%`,
                          background:
                            goal.color ||
                            "linear-gradient(to right, #3b82f6, #8b5cf6)",
                        }}
                      />
                    </div>
                  </div>

                  {/* Amount Info */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">
                        {locale === "pt" ? "Economizado" : "Saved"}
                      </p>
                      <p className="text-lg font-bold text-green-400">
                        {formatMoney(goal.currentCents)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">
                        {locale === "pt" ? "Meta" : "Target"}
                      </p>
                      <p className="text-lg font-bold text-white">
                        {formatMoney(goal.targetCents)}
                      </p>
                    </div>
                  </div>

                  {/* Timeline Info */}
                  {goal.targetDate && (
                    <div className="border-t border-gray-700 pt-3 mt-3 space-y-2">
                      {daysRemaining !== null && daysRemaining > 0 && (
                        <>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">
                              {locale === "pt" ? "Dias restantes" : "Days left"}
                            </span>
                            <span className="font-semibold text-blue-400">
                              {daysRemaining}{" "}
                              {locale === "pt" ? "dias" : "days"}
                            </span>
                          </div>
                          {dailySavings > 0 && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-400">
                                {locale === "pt"
                                  ? "Economizar por dia"
                                  : "Save per day"}
                              </span>
                              <span className="font-semibold text-purple-400">
                                {formatMoney(dailySavings)}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                      {daysRemaining !== null && daysRemaining <= 0 && (
                        <p className="text-sm text-orange-400 font-semibold">
                          {locale === "pt" ? "⏰ Prazo expirado" : "⏰ Overdue"}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Add Funds Section */}
                  <div className="border-t border-gray-700 pt-3 mt-3">
                    {addingFundsId === goal.id ? (
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={addingAmount}
                          onChange={(e) => setAddingAmount(e.target.value)}
                          placeholder="0.00"
                          autoFocus
                          className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        />
                        <button
                          onClick={() => handleAddFunds(goal.id)}
                          disabled={!addingAmount || parseFloat(addingAmount) <= 0}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => {
                            setAddingFundsId(null);
                            setAddingAmount("");
                          }}
                          className="px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setAddingFundsId(goal.id)}
                          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          {locale === "pt" ? "+ Adicionar" : "+ Add"}
                        </button>
                        <button
                          onClick={() => handleAddFunds(goal.id)}
                          disabled={addingFundsId !== goal.id}
                          className="px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-xs"
                        >
                          {locale === "pt" ? "Rápido" : "Quick"}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Celebration Animation */}
                  {celebratingId === goal.id && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-6xl animate-bounce">🎉</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-300">
            {locale === "pt" ? "Metas Concluídas" : "Completed Goals"} 🎉
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {completedGoals.map((goal) => (
              <div
                key={goal.id}
                className="bg-green-900/20 rounded-lg p-5 border border-green-700/50"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{goal.icon || "✅"}</span>
                  <div>
                    <h4 className="text-lg font-semibold text-white">
                      {goal.name}
                    </h4>
                    {goal.completedAt && (
                      <p className="text-xs text-green-400">
                        {locale === "pt" ? "Concluído em" : "Completed on"}{" "}
                        {new Date(goal.completedAt).toLocaleDateString(
                          locale === "pt" ? "pt-BR" : "en-US"
                        )}
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-2xl font-bold text-green-400">
                  {formatMoney(goal.targetCents)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {goals.length === 0 && (
        <div className="text-center py-12">
          <span className="text-6xl mb-4 block">🎯</span>
          <h3 className="text-xl font-semibold text-white mb-2">
            {locale === "pt"
              ? "Nenhuma meta ainda"
              : "No goals yet"}
          </h3>
          <p className="text-gray-400 mb-6">
            {locale === "pt"
              ? "Crie sua primeira meta de poupança para começar a economizar!"
              : "Create your first savings goal to start saving!"}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
          >
            {locale === "pt" ? "Criar Primeira Meta" : "Create First Goal"}
          </button>
        </div>
      )}

      {/* Create Modal - Now Using Real Component */}
      <CreateGoalModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateGoal}
        locale={locale}
      />
    </div>
  );
}
