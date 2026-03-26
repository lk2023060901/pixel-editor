"use client";

import type { ProjectAssetSummary } from "@pixel-editor/contracts";
import { useI18n } from "@pixel-editor/i18n/client";
import { startTransition } from "react";

import { DockPanel } from "./dock-panel";
import { getProjectAssetKindLabel } from "./i18n-helpers";

function normalizeProjectPath(path: string): string {
  return path.replaceAll("\\", "/").trim().replace(/^\.\/+/, "");
}

interface FolderNode {
  id: string;
  kind: "folder";
  name: string;
  path: string;
  children: TreeNode[];
}

interface AssetNode {
  id: string;
  kind: "asset";
  asset: ProjectAssetSummary;
}

type TreeNode = FolderNode | AssetNode;

function basename(path: string): string {
  const normalized = normalizeProjectPath(path);
  return normalized.split("/").at(-1) ?? normalized;
}

function createFolderNode(path: string): FolderNode {
  return {
    id: `folder:${path || "."}`,
    kind: "folder",
    name: path.length > 0 ? basename(path) : ".",
    path,
    children: []
  };
}

function sortTreeNodes(nodes: TreeNode[]): TreeNode[] {
  return nodes
    .map((node) =>
      node.kind === "folder"
        ? {
            ...node,
            children: sortTreeNodes(node.children)
          }
        : node
    )
    .sort((left, right) => {
      if (left.kind !== right.kind) {
        return left.kind === "folder" ? -1 : 1;
      }

      const leftName = left.kind === "folder" ? left.name : left.asset.name;
      const rightName = right.kind === "folder" ? right.name : right.asset.name;

      return leftName.localeCompare(rightName);
    });
}

function buildProjectTree(
  assetRoots: readonly string[],
  assets: readonly ProjectAssetSummary[]
): TreeNode[] {
  const rootNodes: TreeNode[] = [];
  const folders = new Map<string, FolderNode>();

  function ensureFolder(path: string): FolderNode {
    const normalizedPath = normalizeProjectPath(path);
    const existing = folders.get(normalizedPath);

    if (existing) {
      return existing;
    }

    const folder = createFolderNode(normalizedPath);
    folders.set(normalizedPath, folder);

    const segments = normalizedPath.split("/").filter((segment) => segment.length > 0);

    if (segments.length <= 1) {
      rootNodes.push(folder);
      return folder;
    }

    const parentPath = segments.slice(0, -1).join("/");
    ensureFolder(parentPath).children.push(folder);
    return folder;
  }

  for (const assetRoot of assetRoots) {
    const normalizedRoot = normalizeProjectPath(assetRoot);

    if (normalizedRoot.length === 0 || normalizedRoot === ".") {
      continue;
    }

    ensureFolder(normalizedRoot);
  }

  for (const asset of assets) {
    const normalizedPath = normalizeProjectPath(asset.path);
    const segments = normalizedPath.split("/").filter((segment) => segment.length > 0);
    const assetNode: AssetNode = {
      id: asset.id,
      kind: "asset",
      asset: {
        ...asset,
        path: normalizedPath
      }
    };

    if (segments.length <= 1) {
      rootNodes.push(assetNode);
      continue;
    }

    const parentPath = segments.slice(0, -1).join("/");
    ensureFolder(parentPath).children.push(assetNode);
  }

  return sortTreeNodes(rootNodes);
}

export interface ProjectDockProps {
  assetRoots: string[];
  assets: ProjectAssetSummary[];
  activeDocumentIds: string[];
  onAssetActivate: (asset: ProjectAssetSummary) => void;
  embedded?: boolean;
}

function ProjectTreeRow(props: {
  node: TreeNode;
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
  assetRoots,
  assets,
  activeDocumentIds,
  onAssetActivate
}: Omit<ProjectDockProps, "embedded">) {
  const { t } = useI18n();
  const tree = buildProjectTree(assetRoots, assets);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        {tree.map((node) => (
          <ProjectTreeRow
            key={node.id}
            activeDocumentIds={activeDocumentIds}
            depth={0}
            node={node}
            onAssetActivate={onAssetActivate}
          />
        ))}

        {tree.length === 0 ? (
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
