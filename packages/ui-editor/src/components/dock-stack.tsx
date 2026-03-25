"use client";

import type { ReactNode } from "react";

export interface DockStackTab<TTabId extends string> {
  id: TTabId;
  label: string;
}

export interface DockStackProps<TTabId extends string> {
  tabs: DockStackTab<TTabId>[];
  activeTab: TTabId;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  onTabChange: (tabId: TTabId) => void;
}

export function DockStack<TTabId extends string>({
  tabs,
  activeTab,
  children,
  className,
  bodyClassName,
  onTabChange
}: DockStackProps<TTabId>) {
  return (
    <section
      className={`flex min-h-0 flex-col overflow-hidden border border-slate-700 bg-slate-900 ${className ?? ""}`}
    >
      <header className="flex items-end gap-px border-b border-slate-700 bg-slate-800">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;

          return (
            <button
              key={tab.id}
              className={`border border-b-0 px-3 py-1 text-xs transition ${
                isActive
                  ? "border-slate-700 bg-slate-900 text-slate-100"
                  : "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-slate-100"
              }`}
              onClick={() => {
                onTabChange(tab.id);
              }}
            >
              {tab.label}
            </button>
          );
        })}
        <div className="min-w-0 flex-1 border-b border-slate-700 bg-slate-800" />
      </header>
      <div className={`min-h-0 flex-1 overflow-hidden bg-slate-900 ${bodyClassName ?? ""}`}>{children}</div>
    </section>
  );
}
