"use client";

import type { EditorShellDialogsViewState } from "@pixel-editor/app-services/ui-shell";
import type { ProjectPropertiesDialogStore } from "@pixel-editor/app-services/ui-store";
import { useI18n } from "@pixel-editor/i18n/client";
import { startTransition, type ReactNode, useEffect, useRef, useState } from "react";

interface ProjectPropertiesDraft {
  compatibilityVersion: string;
  extensionsDirectory: string;
  automappingRulesFile: string;
  embedTilesets: boolean;
  detachTemplateInstances: boolean;
  resolveObjectTypesAndProperties: boolean;
  exportMinimized: boolean;
}

const COMPATIBILITY_VERSION_OPTIONS = [
  {
    value: "1.8",
    labelKey: "projectPropertiesDialog.compatibilityVersion.v1_8"
  },
  {
    value: "1.9",
    labelKey: "projectPropertiesDialog.compatibilityVersion.v1_9"
  },
  {
    value: "1.10",
    labelKey: "projectPropertiesDialog.compatibilityVersion.v1_10"
  },
  {
    value: "1.11",
    labelKey: "projectPropertiesDialog.compatibilityVersion.v1_11"
  },
  {
    value: "1.12",
    labelKey: "projectPropertiesDialog.compatibilityVersion.v1_12"
  },
  {
    value: "latest",
    labelKey: "projectPropertiesDialog.compatibilityVersion.latest"
  }
] as const;

function createDraftFromProject(project: EditorShellDialogsViewState["project"]): ProjectPropertiesDraft {
  return {
    compatibilityVersion: project.compatibilityVersion,
    extensionsDirectory: project.extensionsDirectory,
    automappingRulesFile: project.automappingRulesFile ?? "",
    embedTilesets: project.exportOptions.embedTilesets,
    detachTemplateInstances: project.exportOptions.detachTemplateInstances,
    resolveObjectTypesAndProperties: project.exportOptions.resolveObjectTypesAndProperties,
    exportMinimized: project.exportOptions.exportMinimized
  };
}

function Section(props: { title: string; children: ReactNode }) {
  return (
    <section className="border border-slate-700 bg-slate-950/80">
      <header className="border-b border-slate-700 bg-slate-900/95 px-3 py-2 text-sm font-medium text-slate-100">
        {props.title}
      </header>
      <div className="grid gap-3 p-3">{props.children}</div>
    </section>
  );
}

function FieldRow(props: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm text-slate-200">
      <span className="text-xs uppercase tracking-[0.08em] text-slate-400">{props.label}</span>
      {props.children}
    </label>
  );
}

function inputClassName() {
  return "h-9 border border-slate-600 bg-slate-950 px-2 text-sm text-slate-100 outline-none transition focus:border-sky-500";
}

export function ProjectPropertiesDialog(props: {
  project: EditorShellDialogsViewState["project"];
  store: ProjectPropertiesDialogStore;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const [draft, setDraft] = useState<ProjectPropertiesDraft>(() =>
    createDraftFromProject(props.project)
  );

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  useEffect(() => {
    setDraft(createDraftFromProject(props.project));
  }, [props.project]);

  function applyChanges(): void {
    const extensionsDirectory = draft.extensionsDirectory.trim();
    const automappingRulesFile = draft.automappingRulesFile.trim();

    startTransition(() => {
      props.store.updateProjectDetails({
        compatibilityVersion: draft.compatibilityVersion,
        extensionsDirectory:
          extensionsDirectory.length > 0 ? extensionsDirectory : "extensions",
        automappingRulesFile:
          automappingRulesFile.length > 0 ? automappingRulesFile : null,
        exportOptions: {
          embedTilesets: draft.embedTilesets,
          detachTemplateInstances: draft.detachTemplateInstances,
          resolveObjectTypesAndProperties: draft.resolveObjectTypesAndProperties,
          exportMinimized: draft.exportMinimized
        }
      });
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-6 py-8">
      <div
        ref={dialogRef}
        className="flex h-[560px] w-[720px] flex-col border border-slate-700 bg-slate-900 shadow-[0_18px_60px_rgba(2,6,23,0.7)] outline-none"
        role="dialog"
        tabIndex={-1}
        aria-modal="true"
        aria-label={t("action.projectProperties")}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            props.onClose();
          }
        }}
      >
        <header className="border-b border-slate-700 px-4 py-3">
          <h2 className="text-sm font-medium text-slate-100">
            {t("projectPropertiesDialog.title")}
          </h2>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="grid gap-4">
            <Section title={t("projectPropertiesDialog.general")}>
              <FieldRow label={t("projectPropertiesDialog.compatibilityVersion")}>
                <select
                  className={inputClassName()}
                  value={draft.compatibilityVersion}
                  onChange={(event) => {
                    setDraft((current) => ({
                      ...current,
                      compatibilityVersion: event.target.value
                    }));
                  }}
                >
                  {COMPATIBILITY_VERSION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </option>
                  ))}
                </select>
              </FieldRow>
            </Section>

            <Section title={t("projectPropertiesDialog.pathsAndFiles")}>
              <FieldRow label={t("projectPropertiesDialog.extensionsDirectory")}>
                <input
                  className={inputClassName()}
                  type="text"
                  value={draft.extensionsDirectory}
                  onChange={(event) => {
                    setDraft((current) => ({
                      ...current,
                      extensionsDirectory: event.target.value
                    }));
                  }}
                />
              </FieldRow>
              <FieldRow label={t("projectPropertiesDialog.automappingRulesFile")}>
                <input
                  className={inputClassName()}
                  type="text"
                  value={draft.automappingRulesFile}
                  onChange={(event) => {
                    setDraft((current) => ({
                      ...current,
                      automappingRulesFile: event.target.value
                    }));
                  }}
                />
              </FieldRow>
            </Section>

            <Section title={t("projectPropertiesDialog.export")}>
              <label className="flex items-center gap-3 text-sm text-slate-200">
                <input
                  checked={draft.embedTilesets}
                  className="h-4 w-4 accent-sky-500"
                  type="checkbox"
                  onChange={(event) => {
                    setDraft((current) => ({
                      ...current,
                      embedTilesets: event.target.checked
                    }));
                  }}
                />
                <span>{t("projectPropertiesDialog.embedTilesets")}</span>
              </label>
              <label className="flex items-center gap-3 text-sm text-slate-200">
                <input
                  checked={draft.detachTemplateInstances}
                  className="h-4 w-4 accent-sky-500"
                  type="checkbox"
                  onChange={(event) => {
                    setDraft((current) => ({
                      ...current,
                      detachTemplateInstances: event.target.checked
                    }));
                  }}
                />
                <span>{t("projectPropertiesDialog.detachTemplateInstances")}</span>
              </label>
              <label className="flex items-center gap-3 text-sm text-slate-200">
                <input
                  checked={draft.resolveObjectTypesAndProperties}
                  className="h-4 w-4 accent-sky-500"
                  type="checkbox"
                  onChange={(event) => {
                    setDraft((current) => ({
                      ...current,
                      resolveObjectTypesAndProperties: event.target.checked
                    }));
                  }}
                />
                <span>{t("projectPropertiesDialog.resolveObjectTypesAndProperties")}</span>
              </label>
              <label className="flex items-center gap-3 text-sm text-slate-200">
                <input
                  checked={draft.exportMinimized}
                  className="h-4 w-4 accent-sky-500"
                  type="checkbox"
                  onChange={(event) => {
                    setDraft((current) => ({
                      ...current,
                      exportMinimized: event.target.checked
                    }));
                  }}
                />
                <span>{t("projectPropertiesDialog.exportMinimized")}</span>
              </label>
            </Section>
          </div>
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-slate-700 px-4 py-3">
          <button
            className="rounded-sm border border-slate-600 bg-slate-800/80 px-3 py-1.5 text-sm text-slate-200 transition hover:border-slate-500 hover:bg-slate-700/90"
            type="button"
            onClick={props.onClose}
          >
            {t("common.close")}
          </button>
          <button
            className="rounded-sm border border-sky-500/80 bg-sky-500/15 px-3 py-1.5 text-sm text-sky-100 transition hover:bg-sky-500/25"
            type="button"
            onClick={applyChanges}
          >
            {t("common.apply")}
          </button>
        </footer>
      </div>
    </div>
  );
}
