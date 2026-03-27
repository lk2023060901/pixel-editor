"use client";

import {
  type ProjectAssetSummary,
  type ProjectDockViewState,
  type ProjectTreeNode
} from "@pixel-editor/app-services/ui";
import { useI18n } from "@pixel-editor/i18n/client";
import { startTransition } from "react";

import { DockPanel } from "./dock-panel";
import { getProjectAssetKindLabel } from "./i18n-helpers";

export interface ProjectDockProps {
  viewState: ProjectDockViewState;
  onAssetActivate: (asset: ProjectAssetSummary) => void;
  embedded?: boolean;
}

function ProjectTreeRow(props: {
  node: ProjectTreeNode;
  depth: number;
  activeDocumentIds: readonly string[];
  onAssetActivate: (asset: ProjectAssetSummary) => void;
}) {
  const { t } = useI18n();

  if (props.node.kind === "folder") {
    return (
      <div>
        <div
          className="grid grid-cols-[1fr_auto] items-center gap-2 border-b border-slate-800 bg-slate-900 px-2 py-1 text-sm text-slate-300"
          style={{ paddingLeft: `${8 + props.depth * 14}px` }}
          title={props.node.path}
        >
          <span className="min-w-0 truncate">
            <span className="mr-1 text-[10px] text-slate-500">▾</span>
            {props.node.name}
          </span>
          <span className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
            {getProjectAssetKindLabel("folder", t)}
          </span>
        </div>
        {props.node.children.map((child) => (
          <ProjectTreeRow
            key={child.id}
            activeDocumentIds={props.activeDocumentIds}
            depth={props.depth + 1}
            node={child}
            onAssetActivate={props.onAssetActivate}
          />
        ))}
      </div>
    );
  }

  const asset = props.node.asset;
  const isActive =
    asset.documentId !== undefined &&
    props.activeDocumentIds.includes(asset.documentId);
  const isInteractive = asset.documentId !== undefined;
  const contentClassName = `grid w-full grid-cols-[1fr_auto] items-center gap-2 border-b border-slate-800 px-2 py-1 text-left text-sm transition ${
    isActive
      ? "bg-slate-800 text-slate-100"
      : isInteractive
        ? "bg-slate-900 text-slate-300 hover:bg-slate-800/70"
        : "bg-slate-900 text-slate-500"
  }`;
  const content = (
    <>
      <span className="min-w-0 truncate">{asset.name}</span>
      <span className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
        {getProjectAssetKindLabel(asset.kind, t)}
      </span>
    </>
  );

  if (!isInteractive) {
    return (
      <div
        className={contentClassName}
        style={{ paddingLeft: `${22 + props.depth * 14}px` }}
        title={asset.path}
      >
        {content}
      </div>
    );
  }

  return (
    <button
      className={contentClassName}
      style={{ paddingLeft: `${22 + props.depth * 14}px` }}
      title={asset.path}
      onClick={() => {
        startTransition(() => {
          props.onAssetActivate(asset);
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

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        {viewState.tree.map((node) => (
          <ProjectTreeRow
            key={node.id}
            activeDocumentIds={viewState.activeDocumentIds}
            depth={0}
            node={node}
            onAssetActivate={onAssetActivate}
          />
        ))}

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
