"use client";

import type { ReactNode } from "react";

export interface PanelProps {
  title: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function Panel({ title, children, className, bodyClassName }: PanelProps) {
  return (
    <section
      className={`rounded-md border border-slate-700 bg-slate-900/95 shadow-[0_8px_24px_rgba(2,6,23,0.35)] ${className ?? ""}`}
    >
      <header className="flex items-center justify-between border-b border-slate-700 bg-slate-800/80 px-3 py-2">
        <h2 className="text-sm font-medium text-slate-200">
          {title}
        </h2>
      </header>
      <div className={`min-h-0 p-3 ${bodyClassName ?? ""}`}>{children}</div>
    </section>
  );
}
