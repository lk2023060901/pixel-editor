import type { RendererCanvasObjectTransformPreviewViewState, TileCollisionCanvasViewState } from "./ui-models";

export type TileCollisionCanvasObjectId = TileCollisionCanvasViewState["objects"][number]["id"];

export interface TileCollisionCanvasLocalPoint {
  x: number;
  y: number;
}

export interface TileCollisionCanvasDimensions {
  canvasWidth: number;
  canvasHeight: number;
  canvasPadding: number;
}

export interface TileCollisionCanvasLayout extends TileCollisionCanvasDimensions {
  scale: number;
  tileWidth: number;
  tileHeight: number;
  originX: number;
  originY: number;
}

export interface TileCollisionCanvasDragState {
  pointerId: number;
  objectIds: TileCollisionCanvasObjectId[];
  startLocalX: number;
  startLocalY: number;
  deltaX: number;
  deltaY: number;
}

export type TileCollisionCanvasPointerDownPlan =
  | { kind: "clear-selection" }
  | {
      kind: "select-and-drag";
      nextSelectedObjectIds: TileCollisionCanvasObjectId[];
      dragState: TileCollisionCanvasDragState;
    };

export type TileCollisionCanvasPointerMovePlan =
  | { kind: "noop" }
  | {
      kind: "drag";
      dragState: TileCollisionCanvasDragState;
    };

export type TileCollisionCanvasPointerUpPlan =
  | { kind: "noop" }
  | {
      kind: "finish-drag";
      commit?: {
        objectIds: readonly TileCollisionCanvasObjectId[];
        deltaX: number;
        deltaY: number;
      };
    };

export const defaultTileCollisionCanvasDimensions: TileCollisionCanvasDimensions = {
  canvasWidth: 360,
  canvasHeight: 360,
  canvasPadding: 24
};

export function deriveTileCollisionCanvasLayout(input: {
  viewState: TileCollisionCanvasViewState;
  dimensions?: TileCollisionCanvasDimensions;
}): TileCollisionCanvasLayout {
  const dimensions = input.dimensions ?? defaultTileCollisionCanvasDimensions;
  const scale = Math.min(
    (dimensions.canvasWidth - dimensions.canvasPadding * 2) / input.viewState.tileWidth,
    (dimensions.canvasHeight - dimensions.canvasPadding * 2) / input.viewState.tileHeight
  );
  const tileWidth = input.viewState.tileWidth * scale;
  const tileHeight = input.viewState.tileHeight * scale;

  return {
    ...dimensions,
    scale,
    tileWidth,
    tileHeight,
    originX: Math.round((dimensions.canvasWidth - tileWidth) * 0.5),
    originY: Math.round((dimensions.canvasHeight - tileHeight) * 0.5)
  };
}

export function createTileCollisionCanvasObjectTransformPreview(
  dragState: TileCollisionCanvasDragState | undefined
): RendererCanvasObjectTransformPreviewViewState | undefined {
  if (!dragState) {
    return undefined;
  }

  return {
    kind: "move",
    objectIds: dragState.objectIds,
    deltaX: dragState.deltaX,
    deltaY: dragState.deltaY
  };
}

export function createTileCollisionCanvasPointerDownPlan(input: {
  pointerId: number;
  point: TileCollisionCanvasLocalPoint;
  pickedObjectId: TileCollisionCanvasObjectId | undefined;
  selectedObjectIds: readonly TileCollisionCanvasObjectId[];
}): TileCollisionCanvasPointerDownPlan {
  if (!input.pickedObjectId) {
    return { kind: "clear-selection" };
  }

  const nextSelectedObjectIds = input.selectedObjectIds.includes(input.pickedObjectId)
    ? [...input.selectedObjectIds]
    : [input.pickedObjectId];

  return {
    kind: "select-and-drag",
    nextSelectedObjectIds,
    dragState: {
      pointerId: input.pointerId,
      objectIds: nextSelectedObjectIds,
      startLocalX: input.point.x,
      startLocalY: input.point.y,
      deltaX: 0,
      deltaY: 0
    }
  };
}

export function createTileCollisionCanvasPointerMovePlan(input: {
  dragState: TileCollisionCanvasDragState | undefined;
  pointerId: number;
  point: TileCollisionCanvasLocalPoint;
  scale: number;
}): TileCollisionCanvasPointerMovePlan {
  if (!input.dragState || input.dragState.pointerId !== input.pointerId) {
    return { kind: "noop" };
  }

  return {
    kind: "drag",
    dragState: {
      ...input.dragState,
      deltaX: Math.round((input.point.x - input.dragState.startLocalX) / input.scale),
      deltaY: Math.round((input.point.y - input.dragState.startLocalY) / input.scale)
    }
  };
}

export function createTileCollisionCanvasPointerUpPlan(input: {
  dragState: TileCollisionCanvasDragState | undefined;
  pointerId: number;
}): TileCollisionCanvasPointerUpPlan {
  if (!input.dragState || input.dragState.pointerId !== input.pointerId) {
    return { kind: "noop" };
  }

  return {
    kind: "finish-drag",
    ...(input.dragState.deltaX !== 0 || input.dragState.deltaY !== 0
      ? {
          commit: {
            objectIds: input.dragState.objectIds,
            deltaX: input.dragState.deltaX,
            deltaY: input.dragState.deltaY
          }
        }
      : {})
  };
}
