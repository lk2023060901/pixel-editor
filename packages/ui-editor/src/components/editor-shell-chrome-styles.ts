"use client";

export const editorShellMenuBarContainerClass =
  "border-b border-slate-700 bg-slate-800/95 px-3 py-1.5";
export const editorShellMenuBarRowClass = "flex items-center gap-1";
export const editorShellMenuPopupClass =
  "border border-slate-700 bg-slate-900/98 shadow-[0_12px_32px_rgba(2,6,23,0.6)]";
export const editorShellMenuSeparatorClass = "my-1 border-t border-slate-800";
export const editorShellMenuSubmenuButtonClass =
  "flex w-full items-center justify-between gap-4 px-3 py-1.5 text-left text-sm text-slate-200 transition hover:bg-slate-800/90";
export const editorShellMenuCheckmarkClass = "w-4 text-xs text-slate-300";
export const editorShellMenuLabelClass = "min-w-0 truncate";
export const editorShellMenuShortcutClass = "pl-6 text-[11px] text-slate-500";
export const editorShellSubmenuChevronClass = "text-[11px] text-slate-500";
export const editorShellToolbarContainerClass =
  "border-b border-slate-700 bg-slate-900/95 px-3 py-1.5";
export const editorShellToolbarRowClass = "flex items-center gap-1 overflow-x-auto";
export const editorShellToolbarSeparatorClass = "mx-1 h-8 w-px bg-slate-600/80";
export const editorShellToolbarSplitWrapperClass = "relative flex";
export const editorShellToolbarSplitToggleClass =
  "flex h-8 w-4 items-center justify-center rounded-r-sm border border-transparent bg-transparent text-[9px] text-slate-300 transition hover:border-slate-500 hover:bg-slate-700/70";
export const editorShellToolbarSplitMenuClass =
  "absolute top-9 z-20 min-w-[168px] overflow-hidden rounded-sm border border-slate-700 bg-slate-900/98 shadow-[0_12px_32px_rgba(2,6,23,0.6)]";
export const editorShellToolbarSplitMenuItemClass =
  "flex w-full items-center justify-between gap-4 border-b border-slate-800 px-3 py-2 text-left text-sm text-slate-200 transition last:border-b-0 hover:bg-slate-800/90 disabled:cursor-not-allowed disabled:text-slate-500";
export const editorShellToolbarSoonBadgeClass =
  "text-[10px] uppercase tracking-[0.14em] text-slate-500";

export function editorShellMenuBarButtonClass(open: boolean): string {
  return `rounded-sm px-2 py-1 text-sm transition ${
    open
      ? "bg-slate-700/90 text-slate-50"
      : "text-slate-200 hover:bg-slate-700/70"
  }`;
}

export function editorShellMenuActionButtonClass(enabled: boolean): string {
  return `grid w-full grid-cols-[16px_minmax(0,1fr)_auto] items-center gap-3 px-3 py-1.5 text-left text-sm transition ${
    enabled
      ? "text-slate-200 hover:bg-slate-800/90"
      : "cursor-not-allowed text-slate-500"
  }`;
}

export function editorShellToolbarButtonClass(active: boolean): string {
  return `flex h-8 w-8 items-center justify-center rounded-sm border transition disabled:cursor-not-allowed disabled:opacity-40 ${
    active
      ? "border-emerald-500/80 bg-emerald-500/15"
      : "border-transparent bg-transparent hover:border-slate-500 hover:bg-slate-700/70"
  }`;
}
