import type { TileCell, TileChunk, TileLayer } from "@pixel-editor/domain";

export interface TileVisibilityBounds {
  startTileX: number;
  startTileY: number;
  endTileX: number;
  endTileY: number;
}

export interface VisibleTileCell {
  x: number;
  y: number;
  cell: TileCell & { gid: number };
}

export interface VisibleTileSegment {
  key: string;
  originTileX: number;
  originTileY: number;
  cells: VisibleTileCell[];
}

function getFiniteCellAt(
  layer: TileLayer,
  x: number,
  y: number
): TileCell | undefined {
  if (x < 0 || y < 0 || x >= layer.width || y >= layer.height) {
    return undefined;
  }

  return layer.cells[y * layer.width + x];
}

function isRenderableTileCell(
  cell: TileCell | undefined
): cell is TileCell & { gid: number } {
  return cell?.gid !== null && cell?.gid !== undefined;
}

function intersectChunkWithBounds(
  chunk: TileChunk,
  bounds: TileVisibilityBounds
) {
  const startX = Math.max(bounds.startTileX, chunk.x);
  const startY = Math.max(bounds.startTileY, chunk.y);
  const endX = Math.min(bounds.endTileX, chunk.x + chunk.width - 1);
  const endY = Math.min(bounds.endTileY, chunk.y + chunk.height - 1);

  if (startX > endX || startY > endY) {
    return undefined;
  }

  return {
    startX,
    startY,
    endX,
    endY
  };
}

export function collectVisibleTileCells(
  layer: TileLayer,
  bounds: TileVisibilityBounds
): VisibleTileCell[] {
  return collectVisibleTileSegments(layer, bounds).flatMap((segment) => segment.cells);
}

export function collectVisibleTileSegments(
  layer: TileLayer,
  bounds: TileVisibilityBounds
): VisibleTileSegment[] {
  const visibleSegments: VisibleTileSegment[] = [];

  if (!layer.infinite) {
    const startX = Math.max(0, bounds.startTileX);
    const startY = Math.max(0, bounds.startTileY);
    const endX = Math.min(layer.width - 1, bounds.endTileX);
    const endY = Math.min(layer.height - 1, bounds.endTileY);

    if (startX > endX || startY > endY) {
      return visibleSegments;
    }

    const cells: VisibleTileCell[] = [];

    for (let y = startY; y <= endY; y += 1) {
      for (let x = startX; x <= endX; x += 1) {
        const cell = getFiniteCellAt(layer, x, y);

        if (!isRenderableTileCell(cell)) {
          continue;
        }

        cells.push({ x, y, cell });
      }
    }

    if (cells.length > 0) {
      visibleSegments.push({
        key: "finite",
        originTileX: 0,
        originTileY: 0,
        cells
      });
    }

    return visibleSegments;
  }

  for (const chunk of layer.chunks) {
    const overlap = intersectChunkWithBounds(chunk, bounds);

    if (!overlap) {
      continue;
    }

    const cells: VisibleTileCell[] = [];

    for (let y = overlap.startY; y <= overlap.endY; y += 1) {
      const localY = y - chunk.y;

      for (let x = overlap.startX; x <= overlap.endX; x += 1) {
        const localX = x - chunk.x;
        const cell = chunk.cells[localY * chunk.width + localX];

        if (!isRenderableTileCell(cell)) {
          continue;
        }

        cells.push({ x, y, cell });
      }
    }

    if (cells.length > 0) {
      visibleSegments.push({
        key: `${chunk.x}:${chunk.y}`,
        originTileX: chunk.x,
        originTileY: chunk.y,
        cells
      });
    }
  }

  return visibleSegments;
}
