"use client";

import type { IssuesPanelViewState } from "@pixel-editor/app-services/ui";
import { useI18n } from "@pixel-editor/i18n/client";

export interface IssuesPanelProps {
  viewState: IssuesPanelViewState;
  onClear: () => void;
  onClose: () => void;
}

function severityClassName(severity: IssuesPanelViewState["issues"][number]["severity"]): string {
  return severity === "error"
    ? "border-rose-500/40 bg-rose-500/10 text-rose-200"
    : "border-amber-500/40 bg-amber-500/10 text-amber-200";
}

function severityLabel(
  severity: IssuesPanelViewState["issues"][number]["severity"],
  translate: ReturnType<typeof useI18n>["t"]
): string {
  return severity === "error"
    ? translate("issuesPanel.severity.error")
    : translate("issuesPanel.severity.warning");
}

export function IssuesPanel({ viewState, onClear, onClose }: IssuesPanelProps) {
  const { t } = useI18n();

  return (
    <section className="flex min-h-0 flex-col border-t border-slate-700 bg-slate-950/95">
      <header className="flex items-center justify-between gap-3 border-b border-slate-700 bg-slate-900/95 px-3 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <h2 className="text-sm font-medium text-slate-100">{t("issuesPanel.title")}</h2>
          <span className="text-xs text-slate-400">
            {t("issuesPanel.summary", { count: viewState.issues.length })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-sm border border-slate-600 bg-slate-800/80 px-2 py-1 text-xs text-slate-200 transition hover:border-slate-500 hover:bg-slate-700/90"
            type="button"
            onClick={onClear}
          >
            {t("issuesPanel.clear")}
          </button>
          <button
            className="rounded-sm border border-slate-600 bg-slate-800/80 px-2 py-1 text-xs text-slate-200 transition hover:border-slate-500 hover:bg-slate-700/90"
            type="button"
            onClick={onClose}
          >
            {t("issuesPanel.close")}
          </button>
        </div>
      </header>

      {viewState.issues.length === 0 ? (
        <div className="flex min-h-[180px] items-center justify-center px-6 text-sm text-slate-400">
          {t("issuesPanel.empty")}
        </div>
      ) : (
        <div className="min-h-0 overflow-auto">
          <ul className="divide-y divide-slate-800">
            {viewState.issues.map((issue) => (
              <li key={issue.id} className="grid gap-2 px-3 py-2 text-sm text-slate-200">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-sm border px-1.5 py-0.5 text-[11px] uppercase tracking-[0.08em] ${severityClassName(issue.severity)}`}
                  >
                    {severityLabel(issue.severity, t)}
                  </span>
                  <span className="rounded-sm border border-slate-700 bg-slate-800/80 px-1.5 py-0.5 text-[11px] uppercase tracking-[0.08em] text-slate-300">
                    {issue.sourceKind}
                  </span>
                  <span className="font-medium text-slate-100">{issue.documentName}</span>
                  {issue.documentPath ? (
                    <span className="text-xs text-slate-500">{issue.documentPath}</span>
                  ) : null}
                </div>

                <div className="text-sm text-slate-100">{issue.message}</div>

                <div className="grid gap-1 text-xs text-slate-400 sm:grid-cols-[120px_minmax(0,1fr)]">
                  <span>{t("issuesPanel.code")}</span>
                  <code className="truncate text-slate-300">{issue.code}</code>
                  <span>{t("issuesPanel.location")}</span>
                  <code className="truncate text-slate-300">{issue.path}</code>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
