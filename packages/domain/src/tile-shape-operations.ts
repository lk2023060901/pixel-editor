import type { TileCoordinate } from "./tile-layer-operations";

export interface TileShapeGestureOptions {
  lockAspectRatio?: boolean;
  fromCenter?: boolean;
}

export interface TileShapeBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

function sign(value: number): -1 | 0 | 1 {
  if (value === 0) {
    return 0;
  }

  return value > 0 ? 1 : -1;
}

export function normalizeTileShapeBounds(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  options: TileShapeGestureOptions = {}
): TileShapeBounds {
  let deltaX = endX - startX;
  let deltaY = endY - startY;

  if (options.lockAspectRatio) {
    const magnitude = Math.min(Math.abs(deltaX), Math.abs(deltaY));
    deltaX = sign(deltaX) * magnitude;
    deltaY = sign(deltaY) * magnitude;
  }

  const pointA = options.fromCenter
    ? { x: startX - deltaX, y: startY - deltaY }
    : { x: startX, y: startY };
  const pointB = { x: startX + deltaX, y: startY + deltaY };
  const minX = Math.min(pointA.x, pointB.x);
  const minY = Math.min(pointA.y, pointB.y);
  const maxX = Math.max(pointA.x, pointB.x);
  const maxY = Math.max(pointA.y, pointB.y);

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1
  };
}

export function collectRectangleShapeTiles(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  options: TileShapeGestureOptions = {}
): TileCoordinate[] {
  const bounds = normalizeTileShapeBounds(startX, startY, endX, endY, options);
  const coordinates: TileCoordinate[] = [];

  for (let y = bounds.y; y < bounds.y + bounds.height; y += 1) {
    for (let x = bounds.x; x < bounds.x + bounds.width; x += 1) {
      coordinates.push({ x, y });
    }
  }

  return coordinates;
}

export function collectEllipseShapeTiles(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  options: TileShapeGestureOptions = {}
): TileCoordinate[] {
  const bounds = normalizeTileShapeBounds(startX, startY, endX, endY, options);
  const radiusX = bounds.width / 2;
  const radiusY = bounds.height / 2;
  const centerX = bounds.x + radiusX;
  const centerY = bounds.y + radiusY;
  const coordinates: TileCoordinate[] = [];

  for (let y = bounds.y; y < bounds.y + bounds.height; y += 1) {
    for (let x = bounds.x; x < bounds.x + bounds.width; x += 1) {
      const normalizedX = (x + 0.5 - centerX) / radiusX;
      const normalizedY = (y + 0.5 - centerY) / radiusY;

      if (normalizedX * normalizedX + normalizedY * normalizedY <= 1) {
        coordinates.push({ x, y });
      }
    }
  }

  return coordinates;
}
