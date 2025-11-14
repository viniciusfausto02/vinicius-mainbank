"use client";

import { ReactNode, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

export type TabItem = {
  key: string;
  label: ReactNode;
  icon?: ReactNode;
};

type TabsProps = {
  items: TabItem[];
  defaultKey?: string;
  value?: string;
  onValueChange?: (key: string) => void;
  className?: string;
  children: ReactNode[] | ReactNode;
  persistKey?: string;
};

export default function Tabs({ items, defaultKey, value, onValueChange, className, children, persistKey }: TabsProps) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState<string>(defaultKey ?? items[0]?.key);
  const active = isControlled ? (value as string) : internal;

  const setActive = useCallback((k: string) => {
    if (isControlled) onValueChange?.(k);
    else setInternal(k);
    if (persistKey && typeof window !== "undefined") {
      try { window.localStorage.setItem(`tabs:${persistKey}`, k); } catch {}
    }
  }, [isControlled, onValueChange, persistKey]);

  const listRef = useRef<HTMLDivElement>(null);
  const baseId = useId();

  useEffect(() => {
    if (!items.find(i => i.key === active) && items.length > 0) {
      setActive(items[0].key);
    }
  }, [items, active, setActive]);

  // After mount, sync with persisted tab to avoid SSR hydration mismatches
  useEffect(() => {
    if (!persistKey) return;
    try {
      const saved = window.localStorage.getItem(`tabs:${persistKey}`);
      if (saved && items.find(i => i.key === saved)) {
        setActive(saved);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persistKey, items.length]);

  const panels = useMemo(() => {
    const arr = Array.isArray(children) ? children : [children];
    return arr;
  }, [children]);

  return (
    <div className={className}>
      <div
        ref={listRef}
        role="tablist"
        aria-orientation="horizontal"
        className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-900/60 p-1"
        onKeyDown={(e) => {
          const idx = items.findIndex(i => i.key === active);
          if (idx === -1) return;
          if (e.key === "ArrowRight") {
            e.preventDefault();
            const next = (idx + 1) % items.length;
            setActive(items[next].key);
          } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            const prev = (idx - 1 + items.length) % items.length;
            setActive(items[prev].key);
          } else if (e.key === "Home") {
            e.preventDefault();
            setActive(items[0].key);
          } else if (e.key === "End") {
            e.preventDefault();
            setActive(items[items.length - 1].key);
          }
        }}
      >
        {items.map((item) => {
          const selected = item.key === active;
          const tabId = `${baseId}-tab-${item.key}`;
          const panelId = `${baseId}-panel-${item.key}`;
          return (
            <button
              key={item.key}
              id={tabId}
              role="tab"
              aria-selected={selected}
              aria-controls={panelId}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(item.key)}
              className={
                `inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all ` +
                (selected
                  ? "bg-slate-800 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60")
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        {items.map((item, idx) => {
          const selected = item.key === active;
          const tabId = `${baseId}-tab-${item.key}`;
          const panelId = `${baseId}-panel-${item.key}`;
          return (
            <div
              key={item.key}
              id={panelId}
              role="tabpanel"
              aria-labelledby={tabId}
              hidden={!selected}
              className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4"
            >
              {panels[idx]}
            </div>
          );
        })}
      </div>
    </div>
  );
}
