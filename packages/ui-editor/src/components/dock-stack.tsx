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
  tabPosition?: "top" | "bottom";
  onTabChange: (tabId: TTabId) => void;
}

export function DockStack<TTabId extends string>({
  tabs,
  activeTab,
  children,
  className,
  bodyClassName,
  tabPosition = "top",
  onTabChange
}: DockStackProps<TTabId>) {
  const tabBar = (
    <header
      className={`flex items-end gap-px bg-slate-800 ${
        tabPosition === "top"
          ? "border-b border-slate-700"
          : "border-t border-slate-700"
      }`}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;

        return (
          <button
            key={tab.id}
            className={`border px-3 py-1 text-xs transition ${
              isActive
                ? "border-slate-700 bg-slate-900 text-slate-100"
                : "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-slate-100"
            } ${
              tabPosition === "top"
                ? "border-b-0"
                : "border-t-0"
            }`}
            onClick={() => {
              onTabChange(tab.id);
            }}
          >
            {tab.label}
          </button>
        );
      })}
      <div
        className={`min-w-0 flex-1 bg-slate-800 ${
          tabPosition === "top"
            ? "border-b border-slate-700"
            : "border-t border-slate-700"
        }`}
      />
    </header>
  );

  return (
    <section
      className={`flex min-h-0 flex-col overflow-hidden border border-slate-700 bg-slate-900 ${className ?? ""}`}
    >
      {tabPosition === "top" ? tabBar : null}
      <div className={`min-h-0 flex-1 overflow-hidden bg-slate-900 ${bodyClassName ?? ""}`}>{children}</div>
      {tabPosition === "bottom" ? tabBar : null}
    </section>
  );
}
