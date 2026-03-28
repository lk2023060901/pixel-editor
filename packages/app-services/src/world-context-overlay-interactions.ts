import type {
  WorldMapDragPreview,
  WorldContextOverlayMapItemViewState,
  WorldContextOverlayViewState
} from "./ui-models";

const DEFAULT_WORLD_CONTEXT_OVERLAY_DRAG_START_DISTANCE = 4;

export interface WorldContextOverlayMapPresentation {
  appearance: "active" | "idle";
  canActivateOnClick: boolean;
  canStartDrag: boolean;
  isInteractive: boolean;
  cursor: "pointer" | "default";
}

export interface WorldContextOverlayDragState {
  pointerId: number;
  map: WorldContextOverlayMapItemViewState;
  startClientX: number;
  startClientY: number;
  moved: boolean;
}

export type WorldContextOverlayClickPlan =
  | { kind: "noop" }
  | {
      kind: "activate";
      mapId: string;
    };

export type WorldContextOverlayPointerDownPlan =
  | { kind: "noop" }
  | {
      kind: "drag";
      dragState: WorldContextOverlayDragState;
    };

export type WorldContextOverlayCommitPlan =
  | { kind: "noop" }
  | {
      kind: "activate";
      mapId: string;
    }
  | {
      kind: "move";
      worldId: string;
      fileName: string;
      x: number;
      y: number;
    };

export function deriveWorldContextOverlayMapPresentation(input: {
  viewState: WorldContextOverlayViewState;
  map: WorldContextOverlayMapItemViewState;
}): WorldContextOverlayMapPresentation {
  const canStartDrag = input.viewState.activeTool === "world-tool" && input.viewState.modifiable;
  const canActivateOnClick =
    input.viewState.activeTool !== "world-tool" &&
    input.map.mapId !== undefined &&
    input.map.canActivate;
  const isInteractive = canStartDrag || input.map.canActivate;

  return {
    appearance: input.map.active ? "active" : "idle",
    canActivateOnClick,
    canStartDrag,
    isInteractive,
    cursor: isInteractive ? "pointer" : "default"
  };
}

export function createWorldContextOverlayClickPlan(input: {
  presentation: WorldContextOverlayMapPresentation;
  map: WorldContextOverlayMapItemViewState;
}): WorldContextOverlayClickPlan {
  if (!input.presentation.canActivateOnClick || input.map.mapId === undefined) {
    return { kind: "noop" };
  }

  return {
    kind: "activate",
    mapId: input.map.mapId
  };
}

export function createWorldContextOverlayPointerDownPlan(input: {
  presentation: WorldContextOverlayMapPresentation;
  map: WorldContextOverlayMapItemViewState;
  button: number;
  pointerId: number;
  clientX: number;
  clientY: number;
}): WorldContextOverlayPointerDownPlan {
  if (!input.presentation.canStartDrag || input.button !== 0) {
    return { kind: "noop" };
  }

  return {
    kind: "drag",
    dragState: {
      pointerId: input.pointerId,
      map: input.map,
      startClientX: input.clientX,
      startClientY: input.clientY,
      moved: false
    }
  };
}

export function shouldStartWorldContextOverlayDrag(input: {
  startClientX: number;
  startClientY: number;
  clientX: number;
  clientY: number;
  dragStartDistance?: number;
}): boolean {
  return (
    Math.hypot(input.clientX - input.startClientX, input.clientY - input.startClientY) >=
    (input.dragStartDistance ?? DEFAULT_WORLD_CONTEXT_OVERLAY_DRAG_START_DISTANCE)
  );
}

export function createWorldContextOverlayCommitPlan(input: {
  dragState: WorldContextOverlayDragState;
  position: Pick<WorldMapDragPreview, "x" | "y">;
}): WorldContextOverlayCommitPlan {
  if (input.dragState.moved) {
    return {
      kind: "move",
      worldId: input.dragState.map.worldId,
      fileName: input.dragState.map.fileName,
      x: input.position.x,
      y: input.position.y
    };
  }

  if (input.dragState.map.mapId === undefined || !input.dragState.map.canActivate) {
    return { kind: "noop" };
  }

  return {
    kind: "activate",
    mapId: input.dragState.map.mapId
  };
}
