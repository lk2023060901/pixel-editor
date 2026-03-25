import {
  getLayerById,
  getTilesetTileCount,
  type EditorMap,
  type EditorProject,
  type EditorWorld,
  type LayerDefinition,
  type LayerId,
  type MapId,
  type ObjectId,
  type ObjectTemplate,
  type TilesetDefinition,
  type TilesetId
} from "@pixel-editor/domain";
import {
  createSingleTileStamp,
  getTileStampPrimaryGid,
  type TileStamp
} from "./stamp";
import type { SelectionState } from "./selection";

export type EditorToolId =
  | "stamp"
  | "eraser"
  | "bucket-fill"
  | "shape-fill"
  | "select"
  | "object-select";

export type ShapeFillMode = "rectangle" | "ellipse";

export interface ViewportState {
  zoom: number;
  originX: number;
  originY: number;
  showGrid: boolean;
}

export interface EditorSessionState {
  activeMapId?: MapId;
  activeLayerId?: LayerId;
  activeTilesetId?: TilesetId;
  activeTilesetTileLocalId: number | null;
  activeTool: EditorToolId;
  shapeFillMode: ShapeFillMode;
  activeStamp: TileStamp;
  selection: SelectionState;
  viewport: ViewportState;
  hasUnsavedChanges: boolean;
}

export interface EditorWorkspaceState {
  project: EditorProject;
  maps: EditorMap[];
  tilesets: TilesetDefinition[];
  templates: ObjectTemplate[];
  worlds: EditorWorld[];
  session: EditorSessionState;
}

export function createEditorSessionState(
  overrides: Partial<EditorSessionState> = {}
): EditorSessionState {
  return {
    activeTool: overrides.activeTool ?? "stamp",
    shapeFillMode: overrides.shapeFillMode ?? "rectangle",
    activeTilesetTileLocalId: overrides.activeTilesetTileLocalId ?? null,
    activeStamp: overrides.activeStamp ?? createSingleTileStamp(1),
    selection: overrides.selection ?? { kind: "none" },
    viewport: overrides.viewport ?? {
      zoom: 1,
      originX: 0,
      originY: 0,
      showGrid: true
    },
    hasUnsavedChanges: overrides.hasUnsavedChanges ?? false,
    ...(overrides.activeMapId !== undefined ? { activeMapId: overrides.activeMapId } : {}),
    ...(overrides.activeLayerId !== undefined
      ? { activeLayerId: overrides.activeLayerId }
      : {}),
    ...(overrides.activeTilesetId !== undefined
      ? { activeTilesetId: overrides.activeTilesetId }
      : {})
  };
}

export function createEditorWorkspaceState(input: {
  project: EditorProject;
  maps?: EditorMap[];
  tilesets?: TilesetDefinition[];
  templates?: ObjectTemplate[];
  worlds?: EditorWorld[];
  session?: Partial<EditorSessionState>;
}): EditorWorkspaceState {
  const maps = input.maps ?? [];
  const tilesets = input.tilesets ?? [];
  const sessionOverrides = input.session ?? {};

  return {
    project: input.project,
    maps,
    tilesets,
    templates: input.templates ?? [],
    worlds: input.worlds ?? [],
    session: createEditorSessionState({
      ...sessionOverrides,
      ...(sessionOverrides.activeMapId === undefined && maps[0]
        ? { activeMapId: maps[0].id }
        : {}),
      ...(sessionOverrides.activeTilesetId === undefined && tilesets[0]
        ? { activeTilesetId: tilesets[0].id }
        : {}),
      ...(sessionOverrides.activeTilesetTileLocalId === undefined && tilesets[0]
        ? {
            activeTilesetTileLocalId:
              getTilesetTileCount(tilesets[0]) > 0 ? 0 : null
          }
        : {})
    })
  };
}

export function getActiveMap(state: EditorWorkspaceState): EditorMap | undefined {
  return state.maps.find((map) => map.id === state.session.activeMapId);
}

export function getActiveLayer(
  state: EditorWorkspaceState
): LayerDefinition | undefined {
  const map = getActiveMap(state);

  if (!map || !state.session.activeLayerId) {
    return undefined;
  }

  return getLayerById(map.layers, state.session.activeLayerId);
}

export function getActiveTileset(
  state: EditorWorkspaceState
): TilesetDefinition | undefined {
  return state.tilesets.find((tileset) => tileset.id === state.session.activeTilesetId);
}

export function getActiveStampPrimaryGid(
  state: EditorWorkspaceState
): number | null {
  return getTileStampPrimaryGid(state.session.activeStamp);
}

export function getDocumentCount(state: EditorWorkspaceState): number {
  return state.maps.length + state.tilesets.length + state.templates.length + state.worlds.length;
}

export type { ClipboardState } from "./clipboard";
export {
  createEmptyClipboardState,
  createObjectClipboardState,
  createTileClipboardState,
  hasClipboardContent
} from "./clipboard";
export type { EditorRuntimeState } from "./runtime";
export {
  clearEditorRuntimeInteractions,
  createEditorRuntimeState,
  setEditorRuntimeClipboard
} from "./runtime";
export type {
  CanvasGestureModifiers,
  CanvasPreviewState,
  EditorInteractionState,
  ObjectMoveGestureModifiers,
  ObjectMovePreview,
  ObjectTransformPreviewState,
  ShapeFillCanvasPreview,
  TileSelectionCanvasPreview
} from "./interactions";
export {
  clearCanvasPreview,
  clearObjectTransformPreview,
  createEditorInteractionState,
  createObjectMovePreview,
  createShapeFillCanvasPreview,
  createTileSelectionCanvasPreview,
  getCanvasPreviewTiles,
  updateObjectMovePreview,
  updateShapeFillCanvasPreview,
  updateTileSelectionCanvasPreview
} from "./interactions";
export type { SelectionState } from "./selection";
export {
  isObjectSelectionState,
  getTileSelectionBounds,
  isTileSelectionState
} from "./selection";
export type { TileStamp, TileStampCell } from "./stamp";
export {
  createPatternTileStamp,
  createSingleTileStamp,
  getTileStampFootprint,
  getTileStampPrimaryGid,
  materializeTileStampCells
} from "./stamp";
