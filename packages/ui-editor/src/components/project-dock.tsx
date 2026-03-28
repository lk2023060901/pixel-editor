"use client";

import {
  createProjectDockAssetActivationPlan,
  deriveProjectDockRowsPresentation,
  type ProjectDockActivationStore,
  type ProjectDockAssetRowPresentation,
  type ProjectDockFolderRowPresentation,
  type ProjectDockIconKey,
  type ProjectDockViewState,
  type ProjectTreeAssetNode
} from "@pixel-editor/app-services/ui";
import { useI18n } from "@pixel-editor/i18n/client";
import { startTransition } from "react";

import { DockPanel } from "./dock-panel";

type ProjectDockAsset = ProjectTreeAssetNode["asset"];

export interface ProjectDockProps {
  viewState: ProjectDockViewState;
  onAssetActivate: (asset: ProjectDockAsset) => void;
  embedded?: boolean;
}

function ProjectDockRowIcon(props: { iconKey: ProjectDockIconKey }) {
  switch (props.iconKey) {
    case "folder":
      return (
        <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 16 16">
          <path d="M2.5 5h4l1 1.5h6v5.5H2.5z" stroke="currentColor" />
          <path d="M2.5 5.5V4h4l1 1.5" stroke="currentColor" />
        </svg>
      );
    case "project":
      return (
        <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 16 16">
          <path d="M3 4.5h10v8H3z" stroke="currentColor" />
          <path d="M6 4.5V3h4v1.5" stroke="currentColor" />
        </svg>
      );
    case "map":
      return (
        <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 16 16">
          <path d="M3 3.5h10v9H3z" stroke="currentColor" />
          <path d="M6.5 3.5v9M9.5 3.5v9M3 6.5h10M3 9.5h10" stroke="currentColor" />
        </svg>
      );
    case "tileset":
      return (
        <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 16 16">
          <path d="M3 3h4v4H3zM9 3h4v4H9zM3 9h4v4H3zM9 9h4v4H9z" stroke="currentColor" />
        </svg>
      );
    case "template":
      return (
        <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 16 16">
          <path d="M4 2.5h6l2 2v9H4z" stroke="currentColor" />
          <path d="M10 2.5V5h2" stroke="currentColor" />
          <path d="M6 8h4M6 10.5h4" stroke="currentColor" />
        </svg>
      );
    case "world":
      return (
        <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 16 16">
          <circle cx="8" cy="8" r="5.5" stroke="currentColor" />
          <path d="M2.5 8h11M8 2.5c1.7 1.7 2.6 3.5 2.6 5.5S9.7 11.8 8 13.5C6.3 11.8 5.4 10 5.4 8S6.3 4.2 8 2.5Z" stroke="currentColor" />
        </svg>
      );
    case "image":
      return (
        <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 16 16">
          <path d="M3 3.5h10v9H3z" stroke="currentColor" />
          <circle cx="6" cy="6" r="1" fill="currentColor" />
          <path d="m4.5 11 2.5-2.5L9 10l1.5-1.5L12.5 11" stroke="currentColor" />
        </svg>
      );
    default:
      return (
        <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 16 16">
          <path d="M4 2.5h6l2 2v9H4z" stroke="currentColor" />
          <path d="M10 2.5V5h2" stroke="currentColor" />
        </svg>
      );
  }
}

function ProjectDockFolderRow(props: {
  row: ProjectDockFolderRowPresentation;
}) {
  return (
    <div
      className="grid grid-cols-[1fr_auto] items-center gap-2 border-b border-slate-800 bg-slate-900 px-2 py-1 text-sm text-slate-300"
      style={{ paddingLeft: `${props.row.paddingLeft}px` }}
      title={props.row.title}
    >
      <span className="flex min-w-0 items-center gap-2 truncate">
        <span className="shrink-0 text-slate-500">
          <ProjectDockRowIcon iconKey={props.row.iconKey} />
        </span>
        {props.row.name}
      </span>
      <span className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
        {props.row.kindLabel}
      </span>
    </div>
  );
}

function ProjectDockAssetRow(props: {
  row: ProjectDockAssetRowPresentation;
  onAssetActivate: (asset: ProjectDockAsset) => void;
}) {
  const activationStore: ProjectDockActivationStore = {
    activateAsset: props.onAssetActivate
  };
  const activationPlan = createProjectDockAssetActivationPlan(props.row);
  const contentClassName = `grid w-full grid-cols-[1fr_auto] items-center gap-2 border-b border-slate-800 px-2 py-1 text-left text-sm transition ${
    props.row.tone === "active"
      ? "bg-slate-800 text-slate-100"
      : props.row.tone === "interactive"
        ? "bg-slate-900 text-slate-300 hover:bg-slate-800/70"
        : "bg-slate-900 text-slate-500"
  }`;
  const content = (
    <>
      <span className="flex min-w-0 items-center gap-2 truncate">
        <span className="shrink-0 text-slate-500">
          <ProjectDockRowIcon iconKey={props.row.iconKey} />
        </span>
        <span className="truncate">{props.row.name}</span>
      </span>
      <span className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
        {props.row.kindLabel}
      </span>
    </>
  );

  if (props.row.interaction !== "activate" || activationPlan.kind !== "transition") {
    return (
      <div
        className={contentClassName}
        style={{ paddingLeft: `${props.row.paddingLeft}px` }}
        title={props.row.title}
      >
        {content}
      </div>
    );
  }

  return (
    <button
      className={contentClassName}
      style={{ paddingLeft: `${props.row.paddingLeft}px` }}
      title={props.row.title}
      onClick={() => {
        startTransition(() => {
          activationPlan.run(activationStore);
        });
      }}
    >
      {content}
    </button>
  );
}

function ProjectDockContent({
  viewState,
  onAssetActivate
}: Omit<ProjectDockProps, "embedded">) {
  const { t } = useI18n();
  const rows = deriveProjectDockRowsPresentation({
    viewState,
    t
  });

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        {rows.map((row) =>
          row.kind === "folder" ? (
            <ProjectDockFolderRow key={row.id} row={row} />
          ) : (
            <ProjectDockAssetRow key={row.id} row={row} onAssetActivate={onAssetActivate} />
          )
        )}

        {viewState.tree.length === 0 ? (
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
