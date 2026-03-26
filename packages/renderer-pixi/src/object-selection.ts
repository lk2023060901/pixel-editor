import type { ProjectedMapObject } from "./object-layer";
import type { ObjectRenderMetrics } from "./object-layer-render";

export type ProjectedObjectResizeHandle =
  | "nw"
  | "n"
  | "ne"
  | "e"
  | "se"
  | "s"
  | "sw"
  | "w";

export type ProjectedObjectTransformHandle =
  | ProjectedObjectResizeHandle
  | "rotate";

export interface ProjectedSelectionBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export interface ProjectedSelectionControls {
  bounds: ProjectedSelectionBounds;
  handleSize: number;
  handleHalf: number;
  resizeHandles: Array<{
    handle: ProjectedObjectResizeHandle;
    x: number;
    y: number;
  }>;
  rotationHandle: {
    x: number;
    y: number;
    radius: number;
  };
}

function computeMarkerSize(metrics: ObjectRenderMetrics): number {
  return Math.max(
    10,
    Math.min(metrics.tileWidth, metrics.tileHeight) * 0.42
  );
}

function computeSelectionHandleSize(metrics: ObjectRenderMetrics): number {
  return Math.max(
    7,
    Math.min(12, Math.min(metrics.tileWidth, metrics.tileHeight) * 0.24)
  );
}

function toSelectionBounds(input: {
  left: number;
  top: number;
  right: number;
  bottom: number;
}): ProjectedSelectionBounds {
  return {
    left: input.left,
    top: input.top,
    right: input.right,
    bottom: input.bottom,
    width: Math.max(0, input.right - input.left),
    height: Math.max(0, input.bottom - input.top),
    centerX: (input.left + input.right) * 0.5,
    centerY: (input.top + input.bottom) * 0.5
  };
}

export function getProjectedObjectVisualBounds(
  object: ProjectedMapObject,
  metrics: ObjectRenderMetrics
): ProjectedSelectionBounds | undefined {
  const markerSize = computeMarkerSize(metrics);

  if (object.shape === "point") {
    const radius = markerSize * 0.5;

    return toSelectionBounds({
      left: object.screenX - radius,
      top: object.screenY - radius,
      right: object.screenX + radius,
      bottom: object.screenY + radius
    });
  }

  if (
    (object.shape === "polygon" || object.shape === "polyline") &&
    object.screenPoints?.length
  ) {
    const xs = object.screenPoints.map((point) => point.x);
    const ys = object.screenPoints.map((point) => point.y);

    return toSelectionBounds({
      left: Math.min(...xs),
      top: Math.min(...ys),
      right: Math.max(...xs),
      bottom: Math.max(...ys)
    });
  }

  const width = Math.max(object.screenWidth, markerSize);
  const height = Math.max(object.screenHeight, markerSize);

  return toSelectionBounds({
    left: object.screenX,
    top: object.screenY,
    right: object.screenX + width,
    bottom: object.screenY + height
  });
}

export function collectProjectedObjectSelectionBounds(
  objects: readonly ProjectedMapObject[],
  metrics: ObjectRenderMetrics
): ProjectedSelectionBounds | undefined {
  let combinedBounds: ProjectedSelectionBounds | undefined;

  for (const object of objects) {
    if (!object.selected) {
      continue;
    }

    const bounds = getProjectedObjectVisualBounds(object, metrics);

    if (!bounds) {
      continue;
    }

    combinedBounds = combinedBounds
      ? toSelectionBounds({
          left: Math.min(combinedBounds.left, bounds.left),
          top: Math.min(combinedBounds.top, bounds.top),
          right: Math.max(combinedBounds.right, bounds.right),
          bottom: Math.max(combinedBounds.bottom, bounds.bottom)
        })
      : bounds;
  }

  return combinedBounds;
}

export function getProjectedObjectSelectionControls(
  objects: readonly ProjectedMapObject[],
  metrics: ObjectRenderMetrics
): ProjectedSelectionControls | undefined {
  const bounds = collectProjectedObjectSelectionBounds(objects, metrics);

  if (!bounds) {
    return undefined;
  }

  const handleSize = computeSelectionHandleSize(metrics);
  const handleHalf = handleSize * 0.5;
  const rotationOffset = handleSize * 1.75;

  return {
    bounds,
    handleSize,
    handleHalf,
    resizeHandles: [
      { handle: "nw", x: bounds.left, y: bounds.top },
      { handle: "n", x: bounds.centerX, y: bounds.top },
      { handle: "ne", x: bounds.right, y: bounds.top },
      { handle: "e", x: bounds.right, y: bounds.centerY },
      { handle: "se", x: bounds.right, y: bounds.bottom },
      { handle: "s", x: bounds.centerX, y: bounds.bottom },
      { handle: "sw", x: bounds.left, y: bounds.bottom },
      { handle: "w", x: bounds.left, y: bounds.centerY }
    ],
    rotationHandle: {
      x: bounds.centerX,
      y: bounds.top - rotationOffset,
      radius: handleHalf
    }
  };
}

export function pickProjectedObjectSelectionHandle(
  objects: readonly ProjectedMapObject[],
  metrics: ObjectRenderMetrics,
  localX: number,
  localY: number
): ProjectedObjectTransformHandle | undefined {
  const controls = getProjectedObjectSelectionControls(objects, metrics);

  if (!controls) {
    return undefined;
  }

  if (
    Math.hypot(
      localX - controls.rotationHandle.x,
      localY - controls.rotationHandle.y
    ) <= controls.rotationHandle.radius
  ) {
    return "rotate";
  }

  for (const handle of controls.resizeHandles) {
    if (
      localX >= handle.x - controls.handleHalf &&
      localX <= handle.x + controls.handleHalf &&
      localY >= handle.y - controls.handleHalf &&
      localY <= handle.y + controls.handleHalf
    ) {
      return handle.handle;
    }
  }

  return undefined;
}
