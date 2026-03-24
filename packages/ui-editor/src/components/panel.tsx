"use client";

import type { ReactNode } from "react";

export interface PanelProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function Panel({ title, children, className }: PanelProps) {
  return (
    <section
      className={`rounded-2xl border border-slate-800 bg-slate-950/70 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.35)] ${className ?? ""}`}
    >
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-[0.14em] text-slate-300 uppercase">
          {title}
        </h2>
      </header>
      {children}
    </section>
  );
}
