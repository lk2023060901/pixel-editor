import type { TranslationFn } from "@pixel-editor/i18n";

import { getTileViewZoomOptionItems, type TileViewZoomOptionItem } from "./tile-view-presentation";
import type { TilesetsPanelViewState } from "./ui-models";
import type { TilesetsPanelStore } from "./ui-store";

export const defaultTilesetsPanelZoom = 1;

export const tilesetsPanelStoreActionIds = {
  activateTileset: "activate-tileset",
  selectStampTile: "select-stamp-tile"
} as const;

export const tilesetsPanelToolbarActionIds = {
  newTileset: "new-tileset",
  addExternalTileset: "add-external-tileset",
  exportJson: "export-json",
  tilesetProperties: "tileset-properties",
  rearrangeTiles: "rearrange-tiles",
  openTerrainSets: "open-terrain-sets",
  openTileCollisionEditor: "open-tile-collision-editor",
  openTileAnimationEditor: "open-tile-animation-editor",
  removeTiles: "remove-tiles"
} as const;

export type TilesetsPanelStoreActionId =
  (typeof tilesetsPanelStoreActionIds)[keyof typeof tilesetsPanelStoreActionIds];
export type TilesetsPanelToolbarActionId =
  (typeof tilesetsPanelToolbarActionIds)[keyof typeof tilesetsPanelToolbarActionIds];

export interface TilesetsPanelToolbarActionItem {
  actionId: TilesetsPanelToolbarActionId;
  title: string;
  disabled: boolean;
}

export interface TilesetsPanelToolbarPresentation {
  actionItems: TilesetsPanelToolbarActionItem[];
  zoomOptions: TileViewZoomOptionItem[];
}

export interface TilesetsPanelActiveStampPresentation {
  summary: TilesetsPanelViewState["stampSummary"];
  selectedTile:
    | {
        localId: number;
        className?: string;
        preview?: TilesetsPanelViewState["selectedTilePreview"];
      }
    | undefined;
}

export interface TilesetsPanelTileGridItemPresentation {
  key: string;
  localId: number;
  preview: TilesetsPanelViewState["activeTileEntries"][number]["preview"];
  isSelected: boolean;
  disabled: boolean;
}

export type TilesetsPanelTileGridPresentation =
  | { kind: "none" }
  | {
      kind: "grid";
      tilesetId: string;
      items: TilesetsPanelTileGridItemPresentation[];
    };

export type TilesetsPanelPalettePresentation =
  | { kind: "none" }
  | {
      kind: "image-grid";
      activeTilesetId: string;
      activeTileEntries: TilesetsPanelViewState["activeTileEntries"];
      tileWidth: number;
      tileHeight: number;
      imageColumns: number;
    }
  | {
      kind: "collection-grid";
      activeTilesetId: string;
      activeTileEntries: TilesetsPanelViewState["activeTileEntries"];
    };

export type TilesetsPanelStoreActionPlan =
  | { kind: "noop" }
  | {
      kind: "transition";
      run: (store: TilesetsPanelStore) => void;
    };

export interface TilesetsPanelSurfaceStore {
  exportJson: () => void;
  openTerrainSets: () => void;
  openTileCollisionEditor: () => void;
  openTileAnimationEditor: () => void;
}

export type TilesetsPanelSurfaceActionPlan =
  | { kind: "noop" }
  | {
      kind: "transition";
      run: (store: TilesetsPanelSurfaceStore) => void;
    };

export function deriveTilesetsPanelPalettePresentation(
  viewState: TilesetsPanelViewState
): TilesetsPanelPalettePresentation {
  if (
    !viewState.activeTilesetId ||
    viewState.activeTileWidth === undefined ||
    viewState.activeTileHeight === undefined
  ) {
    return { kind: "none" };
  }

  if (viewState.activeTilesetKind === "image" && viewState.activeImageColumns !== undefined) {
    return {
      kind: "image-grid",
      activeTilesetId: viewState.activeTilesetId,
      activeTileEntries: viewState.activeTileEntries,
      tileWidth: viewState.activeTileWidth,
      tileHeight: viewState.activeTileHeight,
      imageColumns: viewState.activeImageColumns
    };
  }

  return {
    kind: "collection-grid",
    activeTilesetId: viewState.activeTilesetId,
    activeTileEntries: viewState.activeTileEntries
  };
}

export function deriveTilesetsPanelActiveStampPresentation(
  viewState: TilesetsPanelViewState
): TilesetsPanelActiveStampPresentation {
  return {
    summary: viewState.stampSummary,
    selectedTile:
      viewState.selectedLocalId !== null
        ? {
            localId: viewState.selectedLocalId,
            ...(viewState.selectedTileClassName !== undefined
              ? {
                  className: viewState.selectedTileClassName
                }
              : {}),
            ...(viewState.selectedTilePreview !== undefined
              ? {
                  preview: viewState.selectedTilePreview
                }
              : {})
          }
        : undefined
  };
}

export function deriveTilesetsPanelTileGridPresentation(
  viewState: TilesetsPanelViewState
): TilesetsPanelTileGridPresentation {
  if (viewState.activeTilesetId === undefined) {
    return { kind: "none" };
  }

  return {
    kind: "grid",
    tilesetId: viewState.activeTilesetId,
    items: viewState.activeTileEntries.map((tileEntry) => ({
      key: `${viewState.activeTilesetId}:${tileEntry.localId}`,
      localId: tileEntry.localId,
      preview: tileEntry.preview,
      isSelected: tileEntry.isSelected,
      disabled: tileEntry.preview.gid === undefined
    }))
  };
}

export function deriveTilesetsPanelToolbarPresentation(input: {
  viewState: TilesetsPanelViewState;
  hasExportJsonAction: boolean;
  hasOpenTerrainSetsAction: boolean;
  hasOpenTileCollisionEditorAction: boolean;
  hasOpenTileAnimationEditorAction: boolean;
  t: TranslationFn;
}): TilesetsPanelToolbarPresentation {
  const hasActiveTileset = input.viewState.activeTilesetId !== undefined;
  const hasSelectedTile = input.viewState.selectedLocalId !== null;

  return {
    actionItems: [
      {
        actionId: tilesetsPanelToolbarActionIds.newTileset,
        title: input.t("action.newTileset"),
        disabled: false
      },
      {
        actionId: tilesetsPanelToolbarActionIds.addExternalTileset,
        title: input.t("action.addExternalTileset"),
        disabled: false
      },
      {
        actionId: tilesetsPanelToolbarActionIds.exportJson,
        title: input.t("action.export"),
        disabled: !hasActiveTileset || !input.hasExportJsonAction
      },
      {
        actionId: tilesetsPanelToolbarActionIds.tilesetProperties,
        title: input.t("action.tilesetProperties"),
        disabled: false
      },
      {
        actionId: tilesetsPanelToolbarActionIds.rearrangeTiles,
        title: input.t("action.rearrangeTiles"),
        disabled: false
      },
      {
        actionId: tilesetsPanelToolbarActionIds.openTerrainSets,
        title: input.t("action.editWangSets"),
        disabled: !hasActiveTileset || !input.hasOpenTerrainSetsAction
      },
      {
        actionId: tilesetsPanelToolbarActionIds.openTileCollisionEditor,
        title: input.t("action.editCollision"),
        disabled: !hasSelectedTile || !input.hasOpenTileCollisionEditorAction
      },
      {
        actionId: tilesetsPanelToolbarActionIds.openTileAnimationEditor,
        title: input.t("action.tileAnimationEditor"),
        disabled: !hasSelectedTile || !input.hasOpenTileAnimationEditorAction
      },
      {
        actionId: tilesetsPanelToolbarActionIds.removeTiles,
        title: input.t("action.removeTiles"),
        disabled: false
      }
    ],
    zoomOptions: getTileViewZoomOptionItems()
  };
}

export function createTilesetsPanelStoreActionPlan(input: {
  actionId: TilesetsPanelStoreActionId;
  tilesetId?: string | undefined;
  localId?: number | undefined;
}): TilesetsPanelStoreActionPlan {
  switch (input.actionId) {
    case tilesetsPanelStoreActionIds.activateTileset:
      if (input.tilesetId === undefined) {
        return { kind: "noop" };
      }

      return {
        kind: "transition",
        run: (store) => {
          store.setActiveTileset(input.tilesetId!);
        }
      };
    case tilesetsPanelStoreActionIds.selectStampTile:
      if (input.tilesetId === undefined || input.localId === undefined) {
        return { kind: "noop" };
      }

      return {
        kind: "transition",
        run: (store) => {
          store.selectStampTile(input.tilesetId!, input.localId!);
        }
      };
    default:
      return { kind: "noop" };
  }
}

export function createTilesetsPanelSurfaceActionPlan(input: {
  actionId: TilesetsPanelToolbarActionId;
  viewState: TilesetsPanelViewState;
  hasExportJsonAction: boolean;
  hasOpenTerrainSetsAction: boolean;
  hasOpenTileCollisionEditorAction: boolean;
  hasOpenTileAnimationEditorAction: boolean;
}): TilesetsPanelSurfaceActionPlan {
  switch (input.actionId) {
    case tilesetsPanelToolbarActionIds.exportJson:
      return input.viewState.activeTilesetId !== undefined && input.hasExportJsonAction
        ? {
            kind: "transition",
            run: (store) => {
              store.exportJson();
            }
          }
        : { kind: "noop" };
    case tilesetsPanelToolbarActionIds.openTerrainSets:
      return input.viewState.activeTilesetId !== undefined && input.hasOpenTerrainSetsAction
        ? {
            kind: "transition",
            run: (store) => {
              store.openTerrainSets();
            }
          }
        : { kind: "noop" };
    case tilesetsPanelToolbarActionIds.openTileCollisionEditor:
      return input.viewState.selectedLocalId !== null && input.hasOpenTileCollisionEditorAction
        ? {
            kind: "transition",
            run: (store) => {
              store.openTileCollisionEditor();
            }
          }
        : { kind: "noop" };
    case tilesetsPanelToolbarActionIds.openTileAnimationEditor:
      return input.viewState.selectedLocalId !== null && input.hasOpenTileAnimationEditorAction
        ? {
            kind: "transition",
            run: (store) => {
              store.openTileAnimationEditor();
            }
          }
        : { kind: "noop" };
    default:
      return { kind: "noop" };
  }
}
