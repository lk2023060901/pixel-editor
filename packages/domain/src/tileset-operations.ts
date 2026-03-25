import type { TilesetId } from "./id";
import type { EditorMap } from "./map";
import {
  removePropertyDefinition,
  upsertPropertyDefinition,
  type PropertyDefinition
} from "./property";
import {
  createTileDefinition,
  type TileAnimationFrame,
  createTileset,
  type CreateTilesetInput,
  type TileDefinition,
  type TilesetDefinition,
  type TilesetFillMode,
  type TilesetObjectAlignment,
  type TilesetTileRenderSize
} from "./tileset";

function getExplicitTileCount(tileset: TilesetDefinition): number {
  return tileset.tiles.reduce((count, tile) => Math.max(count, tile.localId + 1), 0);
}

function getComputedImageTileCount(tileset: TilesetDefinition): number {
  if (
    tileset.kind !== "image" ||
    !tileset.source ||
    tileset.source.imageWidth === undefined ||
    tileset.source.imageHeight === undefined
  ) {
    return 0;
  }

  const { margin, spacing, columns, imageWidth, imageHeight } = tileset.source;
  const availableWidth = imageWidth - margin * 2 + spacing;
  const availableHeight = imageHeight - margin * 2 + spacing;
  const computedColumns =
    columns ??
    Math.floor(availableWidth / Math.max(1, tileset.tileWidth + spacing));
  const computedRows = Math.floor(
    availableHeight / Math.max(1, tileset.tileHeight + spacing)
  );

  if (computedColumns <= 0 || computedRows <= 0) {
    return 0;
  }

  return computedColumns * computedRows;
}

export interface CreateImageTilesetInput {
  name: string;
  tileWidth: number;
  tileHeight: number;
  imagePath: string;
  imageWidth: number;
  imageHeight: number;
  margin?: number;
  spacing?: number;
  columns?: number;
}

export interface CreateImageCollectionTilesetInput {
  name: string;
  tileWidth: number;
  tileHeight: number;
  imageSources: string[];
}

export interface UpdateTilesetDetailsInput {
  name?: string;
  tileWidth?: number;
  tileHeight?: number;
  tileOffsetX?: number;
  tileOffsetY?: number;
  objectAlignment?: TilesetObjectAlignment;
  tileRenderSize?: TilesetTileRenderSize;
  fillMode?: TilesetFillMode;
  imagePath?: string;
  imageWidth?: number;
  imageHeight?: number;
  margin?: number;
  spacing?: number;
  columns?: number | null;
}

export interface UpdateTileMetadataInput {
  className?: string | null;
  probability?: number;
}

function cloneTileAnimationFrame(frame: TileAnimationFrame): TileAnimationFrame {
  return {
    tileId: frame.tileId,
    durationMs: frame.durationMs
  };
}

function assertPositiveDimension(name: string, value: number): void {
  if (value <= 0) {
    throw new Error(`${name} must be greater than zero`);
  }
}

function assertNonNegative(name: string, value: number): void {
  if (value < 0) {
    throw new Error(`${name} must be greater than or equal to zero`);
  }
}

function createTilesetDefinitions(
  tileset: TilesetDefinition,
  tileCount: number
): TilesetDefinition {
  return {
    ...tileset,
    tiles: Array.from({ length: tileCount }, (_, localId) => createTileDefinition(localId))
  };
}

function createTilesetFromInput(input: CreateTilesetInput): TilesetDefinition {
  return createTileset(input);
}

function syncTilesetDefinitions(
  tileset: TilesetDefinition,
  tileCount: number
): TilesetDefinition {
  const tileByLocalId = new Map(tileset.tiles.map((tile) => [tile.localId, tile]));

  return {
    ...tileset,
    tiles: Array.from({ length: tileCount }, (_, localId) => {
      const existingTile = tileByLocalId.get(localId);

      return existingTile ?? createTileDefinition(localId);
    })
  };
}

function requireValidTileLocalId(
  tileset: TilesetDefinition,
  localId: number
): void {
  if (localId < 0 || localId >= getTilesetTileCount(tileset)) {
    throw new Error(`Tile localId ${localId} is out of range for tileset ${tileset.name}`);
  }
}

function updateTileDefinition(
  tileset: TilesetDefinition,
  localId: number,
  updater: (tile: TileDefinition) => TileDefinition
): TilesetDefinition {
  requireValidTileLocalId(tileset, localId);

  let updated = false;
  const nextTiles = tileset.tiles.map((tile) => {
    if (tile.localId !== localId) {
      return tile;
    }

    updated = true;
    return updater(tile);
  });

  if (!updated) {
    nextTiles.push(updater(createTileDefinition(localId)));
    nextTiles.sort((left, right) => left.localId - right.localId);
  }

  return {
    ...tileset,
    tiles: nextTiles
  };
}

export function createImageTileset(
  input: CreateImageTilesetInput
): TilesetDefinition {
  const tileset = createTilesetFromInput({
    name: input.name,
    kind: "image",
    tileWidth: input.tileWidth,
    tileHeight: input.tileHeight,
    source: {
      imagePath: input.imagePath,
      imageWidth: input.imageWidth,
      imageHeight: input.imageHeight,
      margin: input.margin ?? 0,
      spacing: input.spacing ?? 0,
      ...(input.columns !== undefined ? { columns: input.columns } : {})
    }
  });

  return createTilesetDefinitions(tileset, getComputedImageTileCount(tileset));
}

export function createImageCollectionTileset(
  input: CreateImageCollectionTilesetInput
): TilesetDefinition {
  const tileset = createTilesetFromInput({
    name: input.name,
    kind: "image-collection",
    tileWidth: input.tileWidth,
    tileHeight: input.tileHeight
  });

  return {
    ...tileset,
    tiles: input.imageSources.map((imageSource, localId) => ({
      ...createTileDefinition(localId),
      imageSource
    }))
  };
}

export function updateTilesetDetails(
  tileset: TilesetDefinition,
  patch: UpdateTilesetDetailsInput
): TilesetDefinition {
  const nextTileWidth = patch.tileWidth ?? tileset.tileWidth;
  const nextTileHeight = patch.tileHeight ?? tileset.tileHeight;

  assertPositiveDimension("tileWidth", nextTileWidth);
  assertPositiveDimension("tileHeight", nextTileHeight);

  const nextTilesetBase: TilesetDefinition = {
    ...tileset,
    name: patch.name ?? tileset.name,
    tileWidth: nextTileWidth,
    tileHeight: nextTileHeight,
    tileOffsetX: patch.tileOffsetX ?? tileset.tileOffsetX,
    tileOffsetY: patch.tileOffsetY ?? tileset.tileOffsetY,
    objectAlignment: patch.objectAlignment ?? tileset.objectAlignment,
    tileRenderSize: patch.tileRenderSize ?? tileset.tileRenderSize,
    fillMode: patch.fillMode ?? tileset.fillMode
  };

  if (tileset.kind !== "image" || !tileset.source) {
    return nextTilesetBase;
  }

  const nextImageWidth = patch.imageWidth ?? tileset.source.imageWidth;
  const nextImageHeight = patch.imageHeight ?? tileset.source.imageHeight;
  const nextMargin = patch.margin ?? tileset.source.margin;
  const nextSpacing = patch.spacing ?? tileset.source.spacing;

  assertNonNegative("margin", nextMargin);
  assertNonNegative("spacing", nextSpacing);

  if (nextImageWidth !== undefined) {
    assertPositiveDimension("imageWidth", nextImageWidth);
  }

  if (nextImageHeight !== undefined) {
    assertPositiveDimension("imageHeight", nextImageHeight);
  }

  const nextColumns = patch.columns === undefined ? tileset.source.columns : patch.columns;

  if (typeof nextColumns === "number") {
    assertPositiveDimension("columns", nextColumns);
  }

  const nextTileset: TilesetDefinition = {
    ...nextTilesetBase,
    source: {
      imagePath: patch.imagePath ?? tileset.source.imagePath,
      margin: nextMargin,
      spacing: nextSpacing,
      ...(nextImageWidth !== undefined ? { imageWidth: nextImageWidth } : {}),
      ...(nextImageHeight !== undefined ? { imageHeight: nextImageHeight } : {}),
      ...(nextColumns !== undefined && nextColumns !== null ? { columns: nextColumns } : {})
    }
  };

  return syncTilesetDefinitions(nextTileset, getComputedImageTileCount(nextTileset));
}

export function updateTilesetTileMetadata(
  tileset: TilesetDefinition,
  localId: number,
  patch: UpdateTileMetadataInput
): TilesetDefinition {
  if (patch.probability !== undefined) {
    assertNonNegative("probability", patch.probability);
  }

  return updateTileDefinition(tileset, localId, (tile) => {
    const nextClassName =
      patch.className === null
        ? undefined
        : patch.className !== undefined
          ? patch.className.trim() || undefined
          : tile.className;

    return {
      ...tile,
      probability: patch.probability ?? tile.probability,
      ...(nextClassName !== undefined ? { className: nextClassName } : {})
    };
  });
}

export function upsertTilesetTileProperty(
  tileset: TilesetDefinition,
  localId: number,
  property: PropertyDefinition,
  previousName = property.name
): TilesetDefinition {
  return updateTileDefinition(tileset, localId, (tile) => ({
    ...tile,
    properties: upsertPropertyDefinition(tile.properties, property, previousName)
  }));
}

export function removeTilesetTileProperty(
  tileset: TilesetDefinition,
  localId: number,
  propertyName: string
): TilesetDefinition {
  return updateTileDefinition(tileset, localId, (tile) => ({
    ...tile,
    properties: removePropertyDefinition(tile.properties, propertyName)
  }));
}

export function updateTilesetTileAnimation(
  tileset: TilesetDefinition,
  localId: number,
  animation: readonly TileAnimationFrame[]
): TilesetDefinition {
  animation.forEach((frame, frameIndex) => {
    requireValidTileLocalId(tileset, frame.tileId);
    assertNonNegative(`animation[${frameIndex}].durationMs`, frame.durationMs);
  });

  return updateTileDefinition(tileset, localId, (tile) => ({
    ...tile,
    animation: animation.map(cloneTileAnimationFrame)
  }));
}

export function attachTilesetToMap(
  map: EditorMap,
  tilesetId: TilesetId
): EditorMap {
  if (map.tilesetIds.includes(tilesetId)) {
    return map;
  }

  return {
    ...map,
    tilesetIds: [...map.tilesetIds, tilesetId]
  };
}

export function getTilesetTileCount(tileset: TilesetDefinition): number {
  return Math.max(getExplicitTileCount(tileset), getComputedImageTileCount(tileset));
}

export function listTilesetLocalIds(tileset: TilesetDefinition): number[] {
  return Array.from({ length: getTilesetTileCount(tileset) }, (_, localId) => localId);
}

export function getTilesetTileByLocalId(
  tileset: TilesetDefinition,
  localId: number
): TileDefinition | undefined {
  return tileset.tiles.find((tile) => tile.localId === localId);
}

export function getMapGlobalTileGid(
  map: EditorMap,
  tilesets: TilesetDefinition[],
  tilesetId: TilesetId,
  localId: number
): number | undefined {
  if (localId < 0) {
    return undefined;
  }

  let firstGid = 1;

  for (const mapTilesetId of map.tilesetIds) {
    const tileset = tilesets.find((entry) => entry.id === mapTilesetId);

    if (!tileset) {
      continue;
    }

    const tileCount = getTilesetTileCount(tileset);

    if (mapTilesetId === tilesetId) {
      if (localId >= tileCount) {
        return undefined;
      }

      return firstGid + localId;
    }

    firstGid += tileCount;
  }

  return undefined;
}

export function resolveMapTileGid(
  map: EditorMap,
  tilesets: TilesetDefinition[],
  gid: number
):
  | {
      firstGid: number;
      localId: number;
      tile?: TileDefinition;
      tileset: TilesetDefinition;
    }
  | undefined {
  if (gid <= 0) {
    return undefined;
  }

  let firstGid = 1;

  for (const tilesetId of map.tilesetIds) {
    const tileset = tilesets.find((entry) => entry.id === tilesetId);

    if (!tileset) {
      continue;
    }

    const tileCount = getTilesetTileCount(tileset);
    const lastExclusiveGid = firstGid + tileCount;

    if (gid >= firstGid && gid < lastExclusiveGid) {
      const localId = gid - firstGid;
      const tile = getTilesetTileByLocalId(tileset, localId);

      return {
        firstGid,
        localId,
        tileset,
        ...(tile ? { tile } : {})
      };
    }

    firstGid = lastExclusiveGid;
  }

  return undefined;
}
