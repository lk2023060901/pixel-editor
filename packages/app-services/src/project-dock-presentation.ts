import type { TranslationFn } from "@pixel-editor/i18n";

import type { ProjectDockViewState, ProjectTreeAssetNode, ProjectTreeNode } from "./ui-models";

export type ProjectDockAssetKindLabelKind = "folder" | ProjectTreeAssetNode["asset"]["kind"];
export const projectDockIconKeys = {
  folder: "folder",
  project: "project",
  map: "map",
  tileset: "tileset",
  template: "template",
  world: "world",
  image: "image",
  file: "file"
} as const;
export type ProjectDockIconKey = (typeof projectDockIconKeys)[keyof typeof projectDockIconKeys];
export type ProjectDockRowTone = "folder" | "active" | "interactive" | "muted";
export type ProjectDockAssetRowInteraction = "activate" | "static";

export interface ProjectDockFolderRowPresentation {
  kind: "folder";
  id: string;
  depth: number;
  paddingLeft: number;
  iconKey: ProjectDockIconKey;
  tone: "folder";
  title: string;
  name: string;
  kindLabel: string;
}

export interface ProjectDockAssetRowPresentation {
  kind: "asset";
  id: string;
  depth: number;
  paddingLeft: number;
  iconKey: ProjectDockIconKey;
  tone: Exclude<ProjectDockRowTone, "folder">;
  interaction: ProjectDockAssetRowInteraction;
  title: string;
  name: string;
  kindLabel: string;
  asset: ProjectTreeAssetNode["asset"];
}

export type ProjectDockRowPresentation =
  | ProjectDockFolderRowPresentation
  | ProjectDockAssetRowPresentation;

export interface ProjectDockActivationStore {
  activateAsset: (asset: ProjectTreeAssetNode["asset"]) => void;
}

export type ProjectDockAssetActivationPlan =
  | { kind: "noop" }
  | {
      kind: "transition";
      run: (store: ProjectDockActivationStore) => void;
    };

function deriveProjectDockAssetTone(input: {
  asset: ProjectTreeAssetNode["asset"];
  activeDocumentIds: readonly string[];
}): ProjectDockAssetRowPresentation["tone"] {
  if (input.asset.documentId === undefined) {
    return "muted";
  }

  return input.activeDocumentIds.includes(input.asset.documentId) ? "active" : "interactive";
}

function deriveProjectDockAssetRowInteraction(
  asset: ProjectTreeAssetNode["asset"]
): ProjectDockAssetRowInteraction {
  return asset.documentId === undefined ? "static" : "activate";
}

export function resolveProjectDockKindIconKey(kind: ProjectDockAssetKindLabelKind): ProjectDockIconKey {
  switch (kind) {
    case "folder":
      return projectDockIconKeys.folder;
    case "project":
      return projectDockIconKeys.project;
    case "map":
      return projectDockIconKeys.map;
    case "tileset":
      return projectDockIconKeys.tileset;
    case "template":
      return projectDockIconKeys.template;
    case "world":
      return projectDockIconKeys.world;
    case "image":
      return projectDockIconKeys.image;
    default:
      return projectDockIconKeys.file;
  }
}

function flattenProjectDockRows(args: {
  nodes: readonly ProjectTreeNode[];
  depth: number;
  activeDocumentIds: readonly string[];
  t: TranslationFn;
}): ProjectDockRowPresentation[] {
  return args.nodes.flatMap((node) => {
    if (node.kind === "folder") {
      return [
        {
          kind: "folder" as const,
          id: node.id,
          depth: args.depth,
          paddingLeft: 8 + args.depth * 14,
          iconKey: resolveProjectDockKindIconKey("folder"),
          tone: "folder",
          title: node.path,
          name: node.name,
          kindLabel: getProjectDockAssetKindLabel("folder", args.t)
        },
        ...flattenProjectDockRows({
          nodes: node.children,
          depth: args.depth + 1,
          activeDocumentIds: args.activeDocumentIds,
          t: args.t
        })
      ];
    }

    return [
      {
        kind: "asset" as const,
        id: node.id,
        depth: args.depth,
        paddingLeft: 22 + args.depth * 14,
        iconKey: resolveProjectDockKindIconKey(node.asset.kind),
        tone: deriveProjectDockAssetTone({
          asset: node.asset,
          activeDocumentIds: args.activeDocumentIds
        }),
        interaction: deriveProjectDockAssetRowInteraction(node.asset),
        title: node.asset.path,
        name: node.asset.name,
        kindLabel: getProjectDockAssetKindLabel(node.asset.kind, args.t),
        asset: node.asset
      }
    ];
  });
}

export function getProjectDockAssetKindLabel(
  kind: ProjectDockAssetKindLabelKind,
  t: TranslationFn
): string {
  switch (kind) {
    case "map":
    case "template":
    case "tileset":
    case "world":
      return t(`documentKind.${kind}`);
    default:
      return t(`project.assetKind.${kind}`);
  }
}

export function deriveProjectDockRowsPresentation(input: {
  viewState: ProjectDockViewState;
  t: TranslationFn;
}): ProjectDockRowPresentation[] {
  return flattenProjectDockRows({
    nodes: input.viewState.tree,
    depth: 0,
    activeDocumentIds: input.viewState.activeDocumentIds,
    t: input.t
  });
}

export function createProjectDockAssetActivationPlan(
  row: ProjectDockAssetRowPresentation
): ProjectDockAssetActivationPlan {
  if (row.interaction !== "activate") {
    return { kind: "noop" };
  }

  return {
    kind: "transition",
    run: (store) => {
      store.activateAsset(row.asset);
    }
  };
}
