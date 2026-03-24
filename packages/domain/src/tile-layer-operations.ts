import {
  createEmptyTileCell,
  type TileCell,
  type TileChunk,
  type TileLayer
} from "./layer";

function chunkKey(x: number, y: number): string {
  return `${x}:${y}`;
}

function tileCoordinateKey(x: number, y: number): string {
  return `${x}:${y}`;
}

function cloneCell(cell: TileCell): TileCell {
  return {
    gid: cell.gid,
    flipHorizontally: cell.flipHorizontally,
    flipVertically: cell.flipVertically,
    flipDiagonally: cell.flipDiagonally
  };
}

function getFiniteCellIndex(layer: TileLayer, x: number, y: number): number | undefined {
  if (x < 0 || y < 0 || x >= layer.width || y >= layer.height) {
    return undefined;
  }

  return y * layer.width + x;
}

function getChunkOrigin(coordinate: number, chunkSize: number): number {
  return Math.floor(coordinate / chunkSize) * chunkSize;
}

export interface TileCoordinate {
  x: number;
  y: number;
}

export interface TileLayerBoundsRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function getChunkCellIndex(chunk: TileChunk, x: number, y: number): number | undefined {
  const localX = x - chunk.x;
  const localY = y - chunk.y;

  if (localX < 0 || localY < 0 || localX >= chunk.width || localY >= chunk.height) {
    return undefined;
  }

  return localY * chunk.width + localX;
}

function createChunk(layer: TileLayer, x: number, y: number): TileChunk {
  return {
    x,
    y,
    width: layer.chunkWidth,
    height: layer.chunkHeight,
    cells: Array.from(
      { length: layer.chunkWidth * layer.chunkHeight },
      () => createEmptyTileCell()
    )
  };
}

export function isTileCellEmpty(cell: TileCell): boolean {
  return (
    cell.gid === null &&
    !cell.flipHorizontally &&
    !cell.flipVertically &&
    !cell.flipDiagonally
  );
}

export function createTileCell(gid: number | null): TileCell {
  return {
    gid,
    flipHorizontally: false,
    flipVertically: false,
    flipDiagonally: false
  };
}

export function areTileCellsEqual(left: TileCell, right: TileCell): boolean {
  return (
    left.gid === right.gid &&
    left.flipHorizontally === right.flipHorizontally &&
    left.flipVertically === right.flipVertically &&
    left.flipDiagonally === right.flipDiagonally
  );
}

export function getTileLayerBounds(layer: TileLayer): TileLayerBoundsRect[] {
  if (!layer.infinite) {
    return layer.width > 0 && layer.height > 0
      ? [
          {
            x: 0,
            y: 0,
            width: layer.width,
            height: layer.height
          }
        ]
      : [];
  }

  return layer.chunks.map((chunk) => ({
    x: chunk.x,
    y: chunk.y,
    width: chunk.width,
    height: chunk.height
  }));
}

function isWithinTileLayerBounds(
  bounds: TileLayerBoundsRect[],
  x: number,
  y: number
): boolean {
  return bounds.some(
    (rect) =>
      x >= rect.x &&
      y >= rect.y &&
      x < rect.x + rect.width &&
      y < rect.y + rect.height
  );
}

export function collectConnectedTileRegion(
  layer: TileLayer,
  originX: number,
  originY: number,
  condition: (cell: TileCell) => boolean
): TileCoordinate[] {
  const bounds = getTileLayerBounds(layer);

  if (!isWithinTileLayerBounds(bounds, originX, originY)) {
    return [];
  }

  const originCell = getTileLayerCell(layer, originX, originY);

  if (!originCell || !condition(originCell)) {
    return [];
  }

  const queue: TileCoordinate[] = [{ x: originX, y: originY }];
  const visited = new Set<string>([tileCoordinateKey(originX, originY)]);
  const region: TileCoordinate[] = [];

  for (let index = 0; index < queue.length; index += 1) {
    const point = queue[index];

    if (!point) {
      continue;
    }

    const cell = getTileLayerCell(layer, point.x, point.y);

    if (!cell || !condition(cell)) {
      continue;
    }

    region.push(point);

    const neighbors: TileCoordinate[] = [
      { x: point.x - 1, y: point.y },
      { x: point.x + 1, y: point.y },
      { x: point.x, y: point.y - 1 },
      { x: point.x, y: point.y + 1 }
    ];

    for (const neighbor of neighbors) {
      if (!isWithinTileLayerBounds(bounds, neighbor.x, neighbor.y)) {
        continue;
      }

      const key = tileCoordinateKey(neighbor.x, neighbor.y);

      if (visited.has(key)) {
        continue;
      }

      visited.add(key);
      queue.push(neighbor);
    }
  }

  return region;
}

export function getTileLayerCell(
  layer: TileLayer,
  x: number,
  y: number
): TileCell | undefined {
  if (!layer.infinite) {
    const index = getFiniteCellIndex(layer, x, y);

    if (index === undefined) {
      return undefined;
    }

    return cloneCell(layer.cells[index] ?? createEmptyTileCell());
  }

  const originX = getChunkOrigin(x, layer.chunkWidth);
  const originY = getChunkOrigin(y, layer.chunkHeight);
  const chunk = layer.chunks.find((entry) => entry.x === originX && entry.y === originY);

  if (!chunk) {
    return createEmptyTileCell();
  }

  const index = getChunkCellIndex(chunk, x, y);

  if (index === undefined) {
    return undefined;
  }

  return cloneCell(chunk.cells[index] ?? createEmptyTileCell());
}

export function setTileLayerCell(
  layer: TileLayer,
  x: number,
  y: number,
  cell: TileCell
): TileLayer {
  if (!layer.infinite) {
    const index = getFiniteCellIndex(layer, x, y);

    if (index === undefined) {
      return layer;
    }

    const nextCells = layer.cells.map((entry) => cloneCell(entry));
    nextCells[index] = cloneCell(cell);

    return {
      ...layer,
      cells: nextCells
    };
  }

  const originX = getChunkOrigin(x, layer.chunkWidth);
  const originY = getChunkOrigin(y, layer.chunkHeight);
  const existingChunkIndex = layer.chunks.findIndex(
    (entry) => entry.x === originX && entry.y === originY
  );

  if (existingChunkIndex < 0 && isTileCellEmpty(cell)) {
    return layer;
  }

  const nextChunks = layer.chunks.map((chunk) => ({
    ...chunk,
    cells: chunk.cells.map((entry) => cloneCell(entry))
  }));
  const targetChunk =
    existingChunkIndex >= 0
      ? nextChunks[existingChunkIndex]
      : createChunk(layer, originX, originY);

  if (!targetChunk) {
    return layer;
  }

  const cellIndex = getChunkCellIndex(targetChunk, x, y);

  if (cellIndex === undefined) {
    return layer;
  }

  targetChunk.cells[cellIndex] = cloneCell(cell);

  if (existingChunkIndex >= 0) {
    nextChunks[existingChunkIndex] = targetChunk;
  } else if (!isTileCellEmpty(cell)) {
    nextChunks.push(targetChunk);
  }

  const compactedChunks = nextChunks.filter((chunk) =>
    chunk.cells.some((entry) => !isTileCellEmpty(entry))
  );

  return {
    ...layer,
    chunks: compactedChunks
  };
}

export function resizeTileLayer(
  layer: TileLayer,
  nextWidth: number,
  nextHeight: number
): TileLayer {
  if (nextWidth <= 0 || nextHeight <= 0) {
    throw new Error("Tile layer width and height must be greater than zero");
  }

  const nextCells = Array.from({ length: nextWidth * nextHeight }, () => createEmptyTileCell());

  for (let y = 0; y < nextHeight; y += 1) {
    for (let x = 0; x < nextWidth; x += 1) {
      const cell = getTileLayerCell(layer, x, y);

      if (!cell) {
        continue;
      }

      nextCells[y * nextWidth + x] = cloneCell(cell);
    }
  }

  return {
    ...layer,
    width: nextWidth,
    height: nextHeight,
    infinite: false,
    cells: nextCells,
    chunks: []
  };
}

export function convertTileLayerToInfinite(layer: TileLayer): TileLayer {
  if (layer.infinite) {
    return layer;
  }

  const chunkMap = new Map<string, TileChunk>();

  for (let y = 0; y < layer.height; y += 1) {
    for (let x = 0; x < layer.width; x += 1) {
      const index = y * layer.width + x;
      const cell = layer.cells[index];

      if (!cell || isTileCellEmpty(cell)) {
        continue;
      }

      const originX = getChunkOrigin(x, layer.chunkWidth);
      const originY = getChunkOrigin(y, layer.chunkHeight);
      const key = chunkKey(originX, originY);
      const chunk = chunkMap.get(key) ?? createChunk(layer, originX, originY);
      const chunkIndex = getChunkCellIndex(chunk, x, y);

      if (chunkIndex !== undefined) {
        chunk.cells[chunkIndex] = cloneCell(cell);
      }

      chunkMap.set(key, chunk);
    }
  }

  return {
    ...layer,
    width: 0,
    height: 0,
    infinite: true,
    cells: [],
    chunks: [...chunkMap.values()]
  };
}

export function convertTileLayerToFinite(
  layer: TileLayer,
  nextWidth: number,
  nextHeight: number
): TileLayer {
  return resizeTileLayer(layer, nextWidth, nextHeight);
}
