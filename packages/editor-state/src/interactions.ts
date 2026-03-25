import type {
  LayerId,
  MapId,
  ObjectId,
  TileCoordinate,
  TileShapeGestureOptions
} from "@pixel-editor/domain";

import type { ShapeFillMode } from "./index";

export type CanvasGestureModifiers = TileShapeGestureOptions;

export interface ObjectMoveGestureModifiers {
  snapToGrid?: boolean;
}

export interface ShapeFillCanvasPreview {
  kind: "shape-fill";
  mapId: MapId;
  layerId: LayerId;
  mode: ShapeFillMode;
  originX: number;
  originY: number;
  currentX: number;
  currentY: number;
  gid: number | null;
  modifiers: Required<CanvasGestureModifiers>;
  coordinates: TileCoordinate[];
}

export interface TileSelectionCanvasPreview {
  kind: "tile-selection";
  mapId: MapId;
  layerId: LayerId;
  originX: number;
  originY: number;
  currentX: number;
  currentY: number;
  coordinates: TileCoordinate[];
}

export type CanvasPreviewState =
  | { kind: "none" }
  | ShapeFillCanvasPreview
  | TileSelectionCanvasPreview;

export interface ObjectMovePreview {
  kind: "object-move";
  mapId: MapId;
  layerId: LayerId;
  objectIds: ObjectId[];
  anchorX: number;
  anchorY: number;
  referenceX: number;
  referenceY: number;
  currentX: number;
  currentY: number;
  deltaX: number;
  deltaY: number;
  modifiers: Required<ObjectMoveGestureModifiers>;
}

export type ObjectTransformPreviewState = { kind: "none" } | ObjectMovePreview;

export interface EditorInteractionState {
  canvasPreview: CanvasPreviewState;
  objectTransformPreview: ObjectTransformPreviewState;
}

function normalizeCanvasGestureModifiers(
  modifiers: CanvasGestureModifiers = {}
): Required<CanvasGestureModifiers> {
  return {
    lockAspectRatio: modifiers.lockAspectRatio ?? false,
    fromCenter: modifiers.fromCenter ?? false
  };
}

function normalizeObjectMoveGestureModifiers(
  modifiers: ObjectMoveGestureModifiers = {}
): Required<ObjectMoveGestureModifiers> {
  return {
    snapToGrid: modifiers.snapToGrid ?? false
  };
}

export function createEditorInteractionState(
  overrides: Partial<EditorInteractionState> = {}
): EditorInteractionState {
  return {
    canvasPreview: overrides.canvasPreview ?? { kind: "none" },
    objectTransformPreview: overrides.objectTransformPreview ?? { kind: "none" }
  };
}

export function clearCanvasPreview(
  state: EditorInteractionState
): EditorInteractionState {
  if (state.canvasPreview.kind === "none") {
    return state;
  }

  return {
    ...state,
    canvasPreview: { kind: "none" }
  };
}

export function clearObjectTransformPreview(
  state: EditorInteractionState
): EditorInteractionState {
  if (state.objectTransformPreview.kind === "none") {
    return state;
  }

  return {
    ...state,
    objectTransformPreview: { kind: "none" }
  };
}

export function createShapeFillCanvasPreview(input: {
  mapId: MapId;
  layerId: LayerId;
  mode: ShapeFillMode;
  originX: number;
  originY: number;
  gid: number | null;
  modifiers?: CanvasGestureModifiers;
}): ShapeFillCanvasPreview {
  return {
    kind: "shape-fill",
    mapId: input.mapId,
    layerId: input.layerId,
    mode: input.mode,
    originX: input.originX,
    originY: input.originY,
    currentX: input.originX,
    currentY: input.originY,
    gid: input.gid,
    modifiers: normalizeCanvasGestureModifiers(input.modifiers),
    coordinates: []
  };
}

export function updateShapeFillCanvasPreview(
  preview: ShapeFillCanvasPreview,
  nextState: {
    currentX: number;
    currentY: number;
    coordinates: TileCoordinate[];
    modifiers?: CanvasGestureModifiers;
  }
): ShapeFillCanvasPreview {
  return {
    ...preview,
    currentX: nextState.currentX,
    currentY: nextState.currentY,
    coordinates: nextState.coordinates,
    modifiers: normalizeCanvasGestureModifiers(nextState.modifiers)
  };
}

export function createTileSelectionCanvasPreview(input: {
  mapId: MapId;
  layerId: LayerId;
  originX: number;
  originY: number;
}): TileSelectionCanvasPreview {
  return {
    kind: "tile-selection",
    mapId: input.mapId,
    layerId: input.layerId,
    originX: input.originX,
    originY: input.originY,
    currentX: input.originX,
    currentY: input.originY,
    coordinates: []
  };
}

export function createObjectMovePreview(input: {
  mapId: MapId;
  layerId: LayerId;
  objectIds: ObjectId[];
  anchorX: number;
  anchorY: number;
  referenceX: number;
  referenceY: number;
  modifiers?: ObjectMoveGestureModifiers;
}): ObjectMovePreview {
  return {
    kind: "object-move",
    mapId: input.mapId,
    layerId: input.layerId,
    objectIds: [...input.objectIds],
    anchorX: input.anchorX,
    anchorY: input.anchorY,
    referenceX: input.referenceX,
    referenceY: input.referenceY,
    currentX: input.anchorX,
    currentY: input.anchorY,
    deltaX: 0,
    deltaY: 0,
    modifiers: normalizeObjectMoveGestureModifiers(input.modifiers)
  };
}

export function updateObjectMovePreview(
  preview: ObjectMovePreview,
  nextState: {
    currentX: number;
    currentY: number;
    deltaX: number;
    deltaY: number;
    modifiers?: ObjectMoveGestureModifiers;
  }
): ObjectMovePreview {
  return {
    ...preview,
    currentX: nextState.currentX,
    currentY: nextState.currentY,
    deltaX: nextState.deltaX,
    deltaY: nextState.deltaY,
    modifiers: normalizeObjectMoveGestureModifiers(nextState.modifiers)
  };
}

export function updateTileSelectionCanvasPreview(
  preview: TileSelectionCanvasPreview,
  nextState: {
    currentX: number;
    currentY: number;
    coordinates: TileCoordinate[];
  }
): TileSelectionCanvasPreview {
  return {
    ...preview,
    currentX: nextState.currentX,
    currentY: nextState.currentY,
    coordinates: nextState.coordinates
  };
}

export function getCanvasPreviewTiles(
  state: EditorInteractionState
): TileCoordinate[] {
  return state.canvasPreview.kind === "none" ? [] : state.canvasPreview.coordinates;
}
