"use client";

import type { ReactNode } from "react";

export interface DockPanelProps {
  title: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function DockPanel({ title, children, className, bodyClassName }: DockPanelProps) {
  return (
    <section
      className={`flex min-h-0 flex-col overflow-hidden border border-slate-700 bg-slate-900 ${className ?? ""}`}
    >
      <header className="border-b border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-100">
        {title}
      </header>
      <div className={`min-h-0 flex-1 overflow-hidden ${bodyClassName ?? ""}`}>{children}</div>
    </section>
  );
}
