import type {
  EditorMap,
  LayerDefinition,
  LayerId,
  MapObject,
  ObjectId,
  ObjectShape,
  ObjectLayer
} from "@pixel-editor/domain";
import { translateMapObject, updateMapObject } from "@pixel-editor/domain";

export interface ObjectProjectionGeometry {
  tileWidth: number;
  tileHeight: number;
  gridOriginX: number;
  gridOriginY: number;
}

export interface ObjectProjectionViewport {
  originX: number;
  originY: number;
}

export interface ProjectedPoint {
  x: number;
  y: number;
}

export interface ProjectedMapObject {
  objectId: ObjectId;
  layerId: LayerId;
  name: string;
  shape: ObjectShape;
  opacity: number;
  highlighted: boolean;
  selected: boolean;
  screenX: number;
  screenY: number;
  screenWidth: number;
  screenHeight: number;
  tileGid?: number;
  screenPoints?: ProjectedPoint[];
  textContent?: string;
  textColor?: string;
  textFontFamily?: string;
  textPixelSize?: number;
  textWrap?: boolean;
}

export type ObjectTransformPreview =
  | { kind: "none" }
  | {
      kind: "move";
      objectIds: ObjectId[];
      deltaX: number;
      deltaY: number;
    }
  | {
      kind: "resize";
      objectId: ObjectId;
      x: number;
      y: number;
      width: number;
      height: number;
    };

interface RenderableObjectLayer {
  layer: ObjectLayer;
  opacity: number;
  highlighted: boolean;
}

function worldToScreenX(
  worldX: number,
  map: EditorMap,
  geometry: ObjectProjectionGeometry,
  viewport: ObjectProjectionViewport
): number {
  return (
    geometry.gridOriginX +
    (worldX / map.settings.tileWidth) * geometry.tileWidth -
    viewport.originX
  );
}

function worldToScreenY(
  worldY: number,
  map: EditorMap,
  geometry: ObjectProjectionGeometry,
  viewport: ObjectProjectionViewport
): number {
  return (
    geometry.gridOriginY +
    (worldY / map.settings.tileHeight) * geometry.tileHeight -
    viewport.originY
  );
}

function worldLengthToScreenWidth(
  worldWidth: number,
  map: EditorMap,
  geometry: ObjectProjectionGeometry
): number {
  return (worldWidth / map.settings.tileWidth) * geometry.tileWidth;
}

function worldLengthToScreenHeight(
  worldHeight: number,
  map: EditorMap,
  geometry: ObjectProjectionGeometry
): number {
  return (worldHeight / map.settings.tileHeight) * geometry.tileHeight;
}

function computeWorldToScreenScale(
  map: EditorMap,
  geometry: ObjectProjectionGeometry
): number {
  return Math.min(
    geometry.tileWidth / map.settings.tileWidth,
    geometry.tileHeight / map.settings.tileHeight
  );
}

function pointInPolygon(point: ProjectedPoint, polygon: ProjectedPoint[]): boolean {
  let inside = false;

  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index, index += 1) {
    const currentPoint = polygon[index];
    const previousPoint = polygon[previous];

    if (!currentPoint || !previousPoint) {
      continue;
    }

    const intersects =
      currentPoint.y > point.y !== previousPoint.y > point.y &&
      point.x <
        ((previousPoint.x - currentPoint.x) * (point.y - currentPoint.y)) /
          (previousPoint.y - currentPoint.y) +
          currentPoint.x;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

function distanceToSegment(
  point: ProjectedPoint,
  start: ProjectedPoint,
  end: ProjectedPoint
): number {
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;

  if (deltaX === 0 && deltaY === 0) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }

  const projection =
    ((point.x - start.x) * deltaX + (point.y - start.y) * deltaY) /
    (deltaX * deltaX + deltaY * deltaY);
  const clamped = Math.max(0, Math.min(1, projection));
  const closestX = start.x + clamped * deltaX;
  const closestY = start.y + clamped * deltaY;

  return Math.hypot(point.x - closestX, point.y - closestY);
}

function collectRenderableObjectLayers(
  layers: LayerDefinition[],
  highlightedLayerId?: LayerId,
  inheritedVisible = true,
  inheritedOpacity = 1
): RenderableObjectLayer[] {
  const renderableLayers: RenderableObjectLayer[] = [];

  for (const layer of layers) {
    const isVisible = inheritedVisible && layer.visible;
    const nextOpacity = inheritedOpacity * layer.opacity;

    if (!isVisible) {
      continue;
    }

    if (layer.kind === "group") {
      renderableLayers.push(
        ...collectRenderableObjectLayers(
          layer.layers,
          highlightedLayerId,
          isVisible,
          nextOpacity
        )
      );
      continue;
    }

    if (layer.kind !== "object") {
      continue;
    }

    renderableLayers.push({
      layer,
      opacity: nextOpacity,
      highlighted: layer.id === highlightedLayerId
    });
  }

  return renderableLayers;
}

function orderLayerObjects(layer: ObjectLayer): MapObject[] {
  if (layer.drawOrder === "index") {
    return [...layer.objects];
  }

  return [...layer.objects].sort(
    (left, right) =>
      left.y + left.height - (right.y + right.height) || left.x - right.x
  );
}

function projectObjectPoints(
  object: MapObject,
  map: EditorMap,
  geometry: ObjectProjectionGeometry,
  viewport: ObjectProjectionViewport
): ProjectedPoint[] | undefined {
  if (!object.points?.length) {
    return undefined;
  }

  return object.points.map((point) => ({
    x: worldToScreenX(object.x + point.x, map, geometry, viewport),
    y: worldToScreenY(object.y + point.y, map, geometry, viewport)
  }));
}

export function collectProjectedMapObjects(input: {
  map: EditorMap;
  geometry: ObjectProjectionGeometry;
  viewport: ObjectProjectionViewport;
  highlightedLayerId?: LayerId;
  selectedObjectIds?: ObjectId[];
  objectTransformPreview?: ObjectTransformPreview;
}): ProjectedMapObject[] {
  const selectedObjectIds = new Set(input.selectedObjectIds ?? []);
  const movedObjectIds =
    input.objectTransformPreview?.kind === "move"
      ? new Set(input.objectTransformPreview.objectIds)
      : undefined;
  const projectedObjects: ProjectedMapObject[] = [];

  for (const entry of collectRenderableObjectLayers(
    input.map.layers,
    input.highlightedLayerId
    )) {
    for (const object of orderLayerObjects(entry.layer)) {
      if (!object.visible) {
        continue;
      }

      const projectedSource =
        input.objectTransformPreview?.kind === "move" && movedObjectIds?.has(object.id)
          ? translateMapObject(
              object,
              input.objectTransformPreview.deltaX,
              input.objectTransformPreview.deltaY
            )
          : input.objectTransformPreview?.kind === "resize" &&
              input.objectTransformPreview.objectId === object.id
            ? updateMapObject(object, {
                x: input.objectTransformPreview.x,
                y: input.objectTransformPreview.y,
                width: input.objectTransformPreview.width,
                height: input.objectTransformPreview.height
              })
          : object;

      const screenPoints = projectObjectPoints(
        projectedSource,
        input.map,
        input.geometry,
        input.viewport
      );

      projectedObjects.push({
        objectId: object.id,
        layerId: entry.layer.id,
        name: projectedSource.name,
        shape: projectedSource.shape,
        opacity: entry.opacity,
        highlighted: entry.highlighted,
        selected: selectedObjectIds.has(projectedSource.id),
        screenX: worldToScreenX(
          projectedSource.x,
          input.map,
          input.geometry,
          input.viewport
        ),
        screenY: worldToScreenY(
          projectedSource.y,
          input.map,
          input.geometry,
          input.viewport
        ),
        screenWidth: worldLengthToScreenWidth(
          projectedSource.width,
          input.map,
          input.geometry
        ),
        screenHeight: worldLengthToScreenHeight(
          projectedSource.height,
          input.map,
          input.geometry
        ),
        ...(projectedSource.tile?.gid !== undefined
          ? { tileGid: projectedSource.tile.gid }
          : {}),
        ...(projectedSource.text
          ? {
              textContent: projectedSource.text.content,
              textColor: projectedSource.text.color,
              textFontFamily: projectedSource.text.fontFamily,
              textPixelSize:
                projectedSource.text.pixelSize *
                computeWorldToScreenScale(input.map, input.geometry),
              textWrap: projectedSource.text.wrap
            }
          : {}),
        ...(screenPoints ? { screenPoints } : {})
      });
    }
  }

  return projectedObjects;
}

export function pickProjectedObject(
  objects: readonly ProjectedMapObject[],
  localX: number,
  localY: number
): ObjectId | undefined {
  const point = { x: localX, y: localY };

  for (const object of [...objects].reverse()) {
    const markerSize = Math.max(
      8,
      Math.min(
        object.screenWidth || 14,
        object.screenHeight || 14,
        18
      )
    );

    if (object.shape === "point") {
      if (Math.hypot(localX - object.screenX, localY - object.screenY) <= markerSize * 0.5) {
        return object.objectId;
      }

      continue;
    }

    if (object.shape === "ellipse") {
      const radiusX = Math.max(object.screenWidth / 2, markerSize * 0.5);
      const radiusY = Math.max(object.screenHeight / 2, markerSize * 0.5);
      const centerX = object.screenX + radiusX;
      const centerY = object.screenY + radiusY;
      const normalizedX = (localX - centerX) / radiusX;
      const normalizedY = (localY - centerY) / radiusY;

      if (normalizedX * normalizedX + normalizedY * normalizedY <= 1) {
        return object.objectId;
      }

      continue;
    }

    if (object.shape === "polygon" && object.screenPoints && pointInPolygon(point, object.screenPoints)) {
      return object.objectId;
    }

    if (object.shape === "polyline" && object.screenPoints && object.screenPoints.length > 1) {
      const tolerance = Math.max(4, markerSize * 0.4);

      for (let index = 1; index < object.screenPoints.length; index += 1) {
        const start = object.screenPoints[index - 1];
        const end = object.screenPoints[index];

        if (!start || !end) {
          continue;
        }

        if (distanceToSegment(point, start, end) <= tolerance) {
          return object.objectId;
        }
      }

      continue;
    }

    const width = Math.max(object.screenWidth, markerSize);
    const height = Math.max(object.screenHeight, markerSize);

    if (
      localX >= object.screenX &&
      localY >= object.screenY &&
      localX <= object.screenX + width &&
      localY <= object.screenY + height
    ) {
      return object.objectId;
    }
  }

  return undefined;
}
