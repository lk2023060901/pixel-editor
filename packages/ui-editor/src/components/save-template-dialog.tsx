"use client";

import type { SaveTemplateDialogStore } from "@pixel-editor/app-services/ui-store";
import { useI18n } from "@pixel-editor/i18n/client";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";

function slugifyTemplateName(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "template";
}

function createDefaultTemplatePath(name: string): string {
  return `templates/${slugifyTemplateName(name)}.tx`;
}

export function SaveTemplateDialog(props: {
  objectName: string;
  store: SaveTemplateDialogStore;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const defaultTemplateName = useMemo(
    () => props.objectName.trim() || "template",
    [props.objectName]
  );
  const [templateName, setTemplateName] = useState(defaultTemplateName);
  const [templatePath, setTemplatePath] = useState(createDefaultTemplatePath(defaultTemplateName));

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  useEffect(() => {
    setTemplateName(defaultTemplateName);
    setTemplatePath(createDefaultTemplatePath(defaultTemplateName));
  }, [defaultTemplateName]);

  function submit(): void {
    const templateId = props.store.createTemplateFromSelectedObject({
      name: templateName,
      path: templatePath
    });

    if (!templateId) {
      return;
    }

    props.onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-6 py-8">
      <div
        ref={dialogRef}
        className="flex w-[520px] flex-col border border-slate-700 bg-slate-900 shadow-[0_18px_60px_rgba(2,6,23,0.7)] outline-none"
        role="dialog"
        tabIndex={-1}
        aria-modal="true"
        aria-label={t("templateSaveDialog.title")}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            props.onClose();
            return;
          }

          if (event.key !== "Enter") {
            return;
          }

          event.preventDefault();
          submit();
        }}
      >
        <header className="border-b border-slate-700 px-4 py-3">
          <h2 className="text-sm font-medium text-slate-100">
            {t("templateSaveDialog.title")}
          </h2>
        </header>

        <div className="grid gap-4 px-4 py-4">
          <label className="grid gap-1.5 text-sm text-slate-200">
            <span className="text-xs uppercase tracking-[0.08em] text-slate-400">
              {t("templateSaveDialog.templateName")}
            </span>
            <input
              className="h-9 border border-slate-600 bg-slate-950 px-2 text-sm text-slate-100 outline-none transition focus:border-sky-500"
              type="text"
              value={templateName}
              onChange={(event) => {
                const nextName = event.target.value;

                setTemplateName(nextName);
                setTemplatePath((currentPath) => {
                  const defaultPath = createDefaultTemplatePath(templateName);

                  if (currentPath !== defaultPath) {
                    return currentPath;
                  }

                  return createDefaultTemplatePath(nextName);
                });
              }}
            />
          </label>

          <label className="grid gap-1.5 text-sm text-slate-200">
            <span className="text-xs uppercase tracking-[0.08em] text-slate-400">
              {t("templateSaveDialog.templatePath")}
            </span>
            <input
              className="h-9 border border-slate-600 bg-slate-950 px-2 text-sm text-slate-100 outline-none transition focus:border-sky-500"
              type="text"
              value={templatePath}
              onChange={(event) => {
                setTemplatePath(event.target.value);
              }}
            />
          </label>
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-slate-700 px-4 py-3">
          <button
            className="rounded-sm border border-slate-600 bg-slate-800/80 px-3 py-1.5 text-sm text-slate-200 transition hover:border-slate-500 hover:bg-slate-700/90"
            type="button"
            onClick={props.onClose}
          >
            {t("common.cancel")}
          </button>
          <button
            className="rounded-sm border border-emerald-500/70 bg-emerald-500/15 px-3 py-1.5 text-sm text-emerald-100 transition hover:bg-emerald-500/20"
            type="button"
            onClick={() => {
              startTransition(() => {
                submit();
              });
            }}
          >
            {t("templateSaveDialog.save")}
          </button>
        </footer>
      </div>
    </div>
  );
}
