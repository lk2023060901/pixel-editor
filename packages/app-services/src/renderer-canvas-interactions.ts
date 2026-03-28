import type { ObjectId } from "@pixel-editor/domain";
import type { EditorToolId } from "@pixel-editor/editor-state";

const DEFAULT_OBJECT_DRAG_START_DISTANCE = 4;

export type RendererCanvasObjectTransformHandle =
  | "nw"
  | "n"
  | "ne"
  | "e"
  | "se"
  | "s"
  | "sw"
  | "w"
  | "rotate";

export type RendererCanvasObjectResizeHandle = Exclude<
  RendererCanvasObjectTransformHandle,
  "rotate"
>;

export interface RendererCanvasTileCoordinate {
  x: number;
  y: number;
}

export interface RendererCanvasMapPoint {
  worldX: number;
  worldY: number;
}

export type RendererCanvasPickResult =
  | { kind: "none" }
  | { kind: "layer"; layerId?: string }
  | { kind: "object"; objectId: ObjectId }
  | {
      kind: "object-handle";
      handle: RendererCanvasObjectTransformHandle;
    }
  | RendererCanvasTileCoordinate & { kind: "tile" };

export interface RendererCanvasPendingObjectMoveGestureState {
  kind: "move";
  pointerId: number;
  objectId: ObjectId;
  startClientX: number;
  startClientY: number;
  startWorldX: number;
  startWorldY: number;
  lastWorldX: number;
  lastWorldY: number;
  dragging: boolean;
}

export interface RendererCanvasPendingObjectResizeGestureState {
  kind: "resize";
  pointerId: number;
  objectId: ObjectId;
  handle: RendererCanvasObjectResizeHandle;
  lastWorldX: number;
  lastWorldY: number;
}

export type RendererCanvasPendingObjectGestureState =
  | RendererCanvasPendingObjectMoveGestureState
  | RendererCanvasPendingObjectResizeGestureState;

export type RendererCanvasPointerDownPlan =
  | { kind: "noop" }
  | { kind: "focus" }
  | {
      kind: "stroke";
      tile: RendererCanvasTileCoordinate;
    }
  | {
      kind: "object-move";
      pendingGesture: RendererCanvasPendingObjectMoveGestureState;
    }
  | {
      kind: "object-resize";
      pendingGesture: RendererCanvasPendingObjectResizeGestureState;
    };

export type RendererCanvasPointerMovePlan =
  | { kind: "noop" }
  | {
      kind: "object-move";
      worldX: number;
      worldY: number;
      startDragging: boolean;
    }
  | {
      kind: "object-resize";
      worldX: number;
      worldY: number;
    };

export type RendererCanvasObjectGestureCompletionPlan =
  | { kind: "noop" }
  | {
      kind: "object-move";
      commitLocation?: RendererCanvasMapPoint;
    }
  | {
      kind: "object-resize";
      commitLocation?: RendererCanvasMapPoint;
    }
  | {
      kind: "select-object";
      objectId: ObjectId;
    };

export type RendererCanvasModifierSyncPlan =
  | { kind: "noop" }
  | {
      kind: "object-move";
      worldX: number;
      worldY: number;
    }
  | {
      kind: "object-resize";
      worldX: number;
      worldY: number;
    };

export function resolveRendererCanvasStatusInfo(input: {
  activeTool: EditorToolId;
  tile: RendererCanvasTileCoordinate | undefined;
  mapPoint: RendererCanvasMapPoint | undefined;
}): string {
  if (!input.tile) {
    return "";
  }

  const tileLabel = `${input.tile.x}, ${input.tile.y}`;

  if (input.activeTool !== "object-select" || !input.mapPoint) {
    return tileLabel;
  }

  return `${tileLabel} (${Math.round(input.mapPoint.worldX)}, ${Math.round(input.mapPoint.worldY)})`;
}

export function createRendererCanvasPointerDownPlan(input: {
  activeTool: EditorToolId;
  selectedObjectIds: ObjectId[];
  pointerId: number;
  clientX: number;
  clientY: number;
  pickResult: RendererCanvasPickResult;
  mapPoint: RendererCanvasMapPoint | undefined;
  tile: RendererCanvasTileCoordinate | undefined;
  canStartStroke: boolean;
  canStartObjectResize: boolean;
}): RendererCanvasPointerDownPlan {
  if (input.activeTool === "world-tool") {
    return { kind: "focus" };
  }

  if (input.activeTool === "object-select") {
    if (input.pickResult.kind === "object-handle") {
      if (input.pickResult.handle === "rotate") {
        return { kind: "focus" };
      }

      if (
        !input.canStartObjectResize ||
        input.selectedObjectIds.length !== 1 ||
        input.mapPoint === undefined
      ) {
        return { kind: "noop" };
      }

      return {
        kind: "object-resize",
        pendingGesture: {
          kind: "resize",
          pointerId: input.pointerId,
          objectId: input.selectedObjectIds[0]!,
          handle: input.pickResult.handle,
          lastWorldX: input.mapPoint.worldX,
          lastWorldY: input.mapPoint.worldY
        }
      };
    }

    if (input.pickResult.kind !== "object" || input.mapPoint === undefined) {
      return { kind: "noop" };
    }

    return {
      kind: "object-move",
      pendingGesture: {
        kind: "move",
        pointerId: input.pointerId,
        objectId: input.pickResult.objectId,
        startClientX: input.clientX,
        startClientY: input.clientY,
        startWorldX: input.mapPoint.worldX,
        startWorldY: input.mapPoint.worldY,
        lastWorldX: input.mapPoint.worldX,
        lastWorldY: input.mapPoint.worldY,
        dragging: false
      }
    };
  }

  if (!input.canStartStroke || input.tile === undefined) {
    return { kind: "noop" };
  }

  return {
    kind: "stroke",
    tile: input.tile
  };
}

export function createRendererCanvasPointerMovePlan(input: {
  activeTool: EditorToolId;
  pendingGesture: RendererCanvasPendingObjectGestureState | undefined;
  mapPoint: RendererCanvasMapPoint | undefined;
  clientX: number;
  clientY: number;
  canStartObjectMove: boolean;
  objectDragStartDistance?: number;
}): RendererCanvasPointerMovePlan {
  const pendingGesture = input.pendingGesture;

  if (
    input.activeTool !== "object-select" ||
    pendingGesture === undefined ||
    input.mapPoint === undefined
  ) {
    return { kind: "noop" };
  }

  if (pendingGesture.kind === "resize") {
    return {
      kind: "object-resize",
      worldX: input.mapPoint.worldX,
      worldY: input.mapPoint.worldY
    };
  }

  const startDragging =
    !pendingGesture.dragging &&
    input.canStartObjectMove &&
    Math.hypot(
      input.clientX - pendingGesture.startClientX,
      input.clientY - pendingGesture.startClientY
    ) >= (input.objectDragStartDistance ?? DEFAULT_OBJECT_DRAG_START_DISTANCE);

  if (!pendingGesture.dragging && !startDragging) {
    return { kind: "noop" };
  }

  return {
    kind: "object-move",
    worldX: input.mapPoint.worldX,
    worldY: input.mapPoint.worldY,
    startDragging
  };
}

export function createRendererCanvasObjectGestureCompletionPlan(input: {
  pendingGesture: RendererCanvasPendingObjectGestureState | undefined;
  selectedObjectIds: ObjectId[];
  mapPoint: RendererCanvasMapPoint | undefined;
}): RendererCanvasObjectGestureCompletionPlan {
  const pendingGesture = input.pendingGesture;

  if (pendingGesture === undefined) {
    return { kind: "noop" };
  }

  if (pendingGesture.kind === "resize") {
    return {
      kind: "object-resize",
      ...(input.mapPoint !== undefined ? { commitLocation: input.mapPoint } : {})
    };
  }

  if (pendingGesture.dragging) {
    return {
      kind: "object-move",
      ...(input.mapPoint !== undefined ? { commitLocation: input.mapPoint } : {})
    };
  }

  if (input.selectedObjectIds.includes(pendingGesture.objectId)) {
    return { kind: "noop" };
  }

  return {
    kind: "select-object",
    objectId: pendingGesture.objectId
  };
}

export function createRendererCanvasModifierSyncPlan(input: {
  activeTool: EditorToolId;
  pendingGesture: RendererCanvasPendingObjectGestureState | undefined;
}): RendererCanvasModifierSyncPlan {
  const pendingGesture = input.pendingGesture;

  if (input.activeTool !== "object-select" || pendingGesture === undefined) {
    return { kind: "noop" };
  }

  if (pendingGesture.kind === "resize") {
    return {
      kind: "object-resize",
      worldX: pendingGesture.lastWorldX,
      worldY: pendingGesture.lastWorldY
    };
  }

  if (!pendingGesture.dragging) {
    return { kind: "noop" };
  }

  return {
    kind: "object-move",
    worldX: pendingGesture.lastWorldX,
    worldY: pendingGesture.lastWorldY
  };
}
