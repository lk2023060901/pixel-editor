"use client";

import type { DocumentSummary } from "@pixel-editor/contracts";
import { useI18n } from "@pixel-editor/i18n/client";
import { startTransition } from "react";

import { DockPanel } from "./dock-panel";
import { getDocumentKindLabel } from "./i18n-helpers";

export interface ProjectDockDocument {
  id: string;
  kind: DocumentSummary["kind"];
  name: string;
}

export interface ProjectDockProps {
  documents: ProjectDockDocument[];
  activeDocumentId: string | undefined;
  onDocumentActivate: (documentId: string) => void;
  embedded?: boolean;
}

function ProjectDockContent({
  documents,
  activeDocumentId,
  onDocumentActivate
}: Omit<ProjectDockProps, "embedded">) {
  const { t } = useI18n();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        {documents.map((document) => (
          <button
            key={document.id}
            className={`grid w-full grid-cols-[1fr_auto] items-center gap-2 border-b border-slate-800 px-2 py-1.5 text-left text-sm transition ${
              document.id === activeDocumentId
                ? "bg-slate-800 text-slate-100"
                : "bg-slate-900 text-slate-300 hover:bg-slate-800/70"
            }`}
            onClick={() => {
              startTransition(() => {
                onDocumentActivate(document.id);
              });
            }}
          >
            <span className="min-w-0 truncate">{document.name}</span>
            <span className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
              {getDocumentKindLabel(document.kind, t)}
            </span>
          </button>
        ))}

        {documents.length === 0 ? (
          <div className="px-3 py-3 text-sm text-slate-400">{t("project.noFiles")}</div>
        ) : null}
      </div>
    </div>
  );
}

export function ProjectDock({
  embedded = false,
  ...props
}: ProjectDockProps) {
  const { t } = useI18n();
  const content = <ProjectDockContent {...props} />;

  if (embedded) {
    return content;
  }

  return <DockPanel title={t("project.title")}>{content}</DockPanel>;
}
