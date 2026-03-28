import { getTileViewZoomOptionItems, type TileViewZoomOptionItem } from "./tile-view-presentation";
import type { TileAnimationEditorViewState } from "./ui-models";

export const defaultTileAnimationEditorZoom = 1;
export const tileAnimationFrameListActionIds = {
  selectFrame: "select-frame",
  startFrameDrag: "start-frame-drag",
  endFrameDrag: "end-frame-drag",
  dropFrameAt: "drop-frame-at"
} as const;
export const tileAnimationSourceTilesActionIds = {
  selectSourceTile: "select-source-tile",
  addFrame: "add-frame"
} as const;
export type TileAnimationFrameListActionId =
  (typeof tileAnimationFrameListActionIds)[keyof typeof tileAnimationFrameListActionIds];
export type TileAnimationSourceTilesActionId =
  (typeof tileAnimationSourceTilesActionIds)[keyof typeof tileAnimationSourceTilesActionIds];

export interface TileAnimationEditorHeaderPresentation {
  applyFrameDurationDisabled: boolean;
  zoomOptions: TileViewZoomOptionItem[];
}

export interface TileAnimationFrameListStore {
  selectFrame: (frameIndex: number) => void;
  startFrameDrag: (frameIndex: number) => void;
  endFrameDrag: () => void;
  reorderFrameAt: (frameIndex: number) => void;
}

export interface TileAnimationSourceTilesStore {
  selectSourceTile: (localId: number) => void;
  addFrame: (localId: number) => void;
}

export interface TileAnimationEditorDialogStore {
  closeDialog: () => void;
  removeSelectedFrame: () => void;
}

export type TileAnimationFrameListActionPlan =
  | { kind: "noop" }
  | {
      kind: "transition";
      run: (store: TileAnimationFrameListStore) => void;
    };

export type TileAnimationSourceTilesActionPlan =
  | { kind: "noop" }
  | {
      kind: "transition";
      run: (store: TileAnimationSourceTilesStore) => void;
    };

export type TileAnimationEditorDialogActionPlan =
  | { kind: "noop" }
  | {
      kind: "transition";
      run: (store: TileAnimationEditorDialogStore) => void;
    };

export interface TileAnimationFrameListItemPresentation {
  key: string;
  frameIndex: number;
  tileId: number;
  durationMs: number;
  preview: TileAnimationEditorViewState["frames"][number]["preview"];
  isSelected: boolean;
  isDragging: boolean;
  draggable: boolean;
  dropDisabled: boolean;
}

export type TileAnimationFrameListPresentation =
  | { kind: "empty" }
  | {
      kind: "list";
      hasDraggingFrame: boolean;
      items: TileAnimationFrameListItemPresentation[];
    };

export interface TileAnimationSourceTileItemPresentation {
  key: string;
  localId: number;
  preview: TileAnimationEditorViewState["sourceTiles"][number]["preview"];
  isSelected: boolean;
}

export type TileAnimationSourceTilesPresentation =
  | {
      kind: "image-grid";
      items: TileAnimationSourceTileItemPresentation[];
      tileWidth: number;
      tileHeight: number;
      imageColumns: number;
    }
  | {
      kind: "collection-grid";
      items: TileAnimationSourceTileItemPresentation[];
    };

export type TileAnimationEditorKeyDownPlan =
  | { kind: "noop" }
  | { kind: "close-dialog" }
  | { kind: "remove-selected-frame" };

export function deriveTileAnimationEditorHeaderPresentation(input: {
  selectedFrameIndex: number | null;
}): TileAnimationEditorHeaderPresentation {
  return {
    applyFrameDurationDisabled: input.selectedFrameIndex === null,
    zoomOptions: getTileViewZoomOptionItems()
  };
}

export function deriveTileAnimationFrameListPresentation(input: {
  frames: readonly TileAnimationEditorViewState["frames"][number][];
  selectedFrameIndex: number | null;
  dragFrameIndex: number | null;
}): TileAnimationFrameListPresentation {
  if (input.frames.length === 0) {
    return { kind: "empty" };
  }

  return {
    kind: "list",
    hasDraggingFrame: input.dragFrameIndex !== null,
    items: input.frames.map((frame, frameIndex) => ({
      key: `${frameIndex}:${frame.tileId}:${frame.durationMs}`,
      frameIndex,
      tileId: frame.tileId,
      durationMs: frame.durationMs,
      preview: frame.preview,
      isSelected: input.selectedFrameIndex === frameIndex,
      isDragging: input.dragFrameIndex === frameIndex,
      draggable: true,
      dropDisabled: input.dragFrameIndex === null || input.dragFrameIndex === frameIndex
    }))
  };
}

export function deriveTileAnimationSourceTilesPresentation(input: {
  viewState: TileAnimationEditorViewState;
  sourceLocalId: number | null;
}): TileAnimationSourceTilesPresentation {
  const items = input.viewState.sourceTiles.map((tile) => ({
    key: `${input.viewState.tilesetId}:${tile.localId}`,
    localId: tile.localId,
    preview: tile.preview,
    isSelected: input.sourceLocalId === tile.localId
  }));

  if (input.viewState.tilesetKind === "image" && input.viewState.imageColumns !== undefined) {
    return {
      kind: "image-grid",
      items,
      tileWidth: input.viewState.tileWidth,
      tileHeight: input.viewState.tileHeight,
      imageColumns: input.viewState.imageColumns
    };
  }

  return {
    kind: "collection-grid",
    items
  };
}

export function createTileAnimationEditorKeyDownPlan(input: {
  key: string;
  selectedFrameIndex: number | null;
  isEditableTarget: boolean;
}): TileAnimationEditorKeyDownPlan {
  if (input.key === "Escape") {
    return { kind: "close-dialog" };
  }

  if (
    (input.key === "Delete" || input.key === "Backspace") &&
    !input.isEditableTarget &&
    input.selectedFrameIndex !== null
  ) {
    return { kind: "remove-selected-frame" };
  }

  return { kind: "noop" };
}

export function createTileAnimationEditorKeyDownActionPlan(input: {
  key: string;
  selectedFrameIndex: number | null;
  isEditableTarget: boolean;
}): TileAnimationEditorDialogActionPlan {
  const plan = createTileAnimationEditorKeyDownPlan(input);

  switch (plan.kind) {
    case "close-dialog":
      return {
        kind: "transition",
        run: (store) => {
          store.closeDialog();
        }
      };
    case "remove-selected-frame":
      return {
        kind: "transition",
        run: (store) => {
          store.removeSelectedFrame();
        }
      };
    default:
      return { kind: "noop" };
  }
}

export function createTileAnimationFrameListActionPlan(input: {
  actionId: TileAnimationFrameListActionId;
  frameIndex?: number | undefined;
  hasDraggingFrame?: boolean | undefined;
  dropDisabled?: boolean | undefined;
}): TileAnimationFrameListActionPlan {
  switch (input.actionId) {
    case tileAnimationFrameListActionIds.selectFrame:
      return input.frameIndex === undefined
        ? { kind: "noop" }
        : {
            kind: "transition",
            run: (store) => {
              store.selectFrame(input.frameIndex!);
            }
          };
    case tileAnimationFrameListActionIds.startFrameDrag:
      return input.frameIndex === undefined
        ? { kind: "noop" }
        : {
            kind: "transition",
            run: (store) => {
              store.startFrameDrag(input.frameIndex!);
            }
          };
    case tileAnimationFrameListActionIds.endFrameDrag:
      return input.hasDraggingFrame
        ? {
            kind: "transition",
            run: (store) => {
              store.endFrameDrag();
            }
          }
        : { kind: "noop" };
    case tileAnimationFrameListActionIds.dropFrameAt:
      return input.frameIndex !== undefined && input.dropDisabled === false
        ? {
            kind: "transition",
            run: (store) => {
              store.reorderFrameAt(input.frameIndex!);
            }
          }
        : { kind: "noop" };
    default:
      return { kind: "noop" };
  }
}

export function createTileAnimationSourceTilesActionPlan(input: {
  actionId: TileAnimationSourceTilesActionId;
  localId?: number | undefined;
}): TileAnimationSourceTilesActionPlan {
  switch (input.actionId) {
    case tileAnimationSourceTilesActionIds.selectSourceTile:
      return input.localId === undefined
        ? { kind: "noop" }
        : {
            kind: "transition",
            run: (store) => {
              store.selectSourceTile(input.localId!);
            }
          };
    case tileAnimationSourceTilesActionIds.addFrame:
      return input.localId === undefined
        ? { kind: "noop" }
        : {
            kind: "transition",
            run: (store) => {
              store.addFrame(input.localId!);
            }
          };
    default:
      return { kind: "noop" };
  }
}
