"use client";

import { useState } from "react";
import type { Locale } from "@/contexts/LanguageContext";

type CreateGoalModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (goal: {
    name: string;
    targetCents: number;
    targetDate?: string;
    description?: string;
    icon?: string;
    color?: string;
  }) => Promise<void>;
  locale: Locale;
};

const ICONS = ["🎯", "🛡️", "✈️", "💻", "🏠", "📚", "🚗", "💎", "🎮", "⌚"];
const COLORS = [
  "#3b82f6", // Blue
  "#8b5cf6", // Purple
  "#10b981", // Green
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#ec4899", // Pink
  "#6366f1", // Indigo
  "#14b8a6", // Teal
];

export default function CreateGoalModal({
  isOpen,
  onClose,
  onSubmit,
  locale,
}: CreateGoalModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    targetAmount: "",
    targetDate: "",
    description: "",
    icon: "🎯",
    color: "#3b82f6",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.targetAmount) {
      return;
    }

    setLoading(true);
    try {
      const targetCents = Math.round(parseFloat(formData.targetAmount) * 100);
      await onSubmit({
        name: formData.name,
        targetCents,
        targetDate: formData.targetDate || undefined,
        description: formData.description || undefined,
        icon: formData.icon,
        color: formData.color,
      });
      
      setFormData({
        name: "",
        targetAmount: "",
        targetDate: "",
        description: "",
        icon: "🎯",
        color: "#3b82f6",
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-md w-full border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">
            {locale === "pt" ? "Nova Meta" : "New Goal"}
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Icon Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {locale === "pt" ? "Ícone" : "Icon"}
            </label>
            <div className="grid grid-cols-5 gap-2">
              {ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon })}
                  className={`py-2 text-2xl transition-all rounded-lg ${
                    formData.icon === icon
                      ? "bg-blue-500 scale-110"
                      : "bg-gray-700 hover:bg-gray-600"
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {locale === "pt" ? "Cor" : "Color"}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`h-10 rounded-lg transition-all border-2 ${
                    formData.color === color
                      ? "border-white scale-110"
                      : "border-transparent"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Goal Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              {locale === "pt" ? "Nome da Meta" : "Goal Name"}
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder={
                locale === "pt"
                  ? "ex: Férias, Carro"
                  : "ex: Vacation, Car"
              }
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
              disabled={loading}
            />
          </div>

          {/* Target Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              {locale === "pt" ? "Valor da Meta" : "Target Amount"} ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.targetAmount}
              onChange={(e) =>
                setFormData({ ...formData, targetAmount: e.target.value })
              }
              placeholder="0.00"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
              disabled={loading}
            />
          </div>

          {/* Target Date */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              {locale === "pt" ? "Data Limite (opcional)" : "Target Date (optional)"}
            </label>
            <input
              type="date"
              value={formData.targetDate}
              onChange={(e) =>
                setFormData({ ...formData, targetDate: e.target.value })
              }
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              {locale === "pt" ? "Descrição (opcional)" : "Description (optional)"}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder={locale === "pt" ? "Detalhes..." : "Details..."}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors resize-none"
              rows={3}
              disabled={loading}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              {locale === "pt" ? "Cancelar" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim() || !formData.targetAmount}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? locale === "pt"
                  ? "Criando..."
                  : "Creating..."
                : locale === "pt"
                ? "Criar Meta"
                : "Create Goal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
