import {
  resolveMapTileGid,
  type EditorMap,
  type TilesetDefinition
} from "@pixel-editor/domain";

export interface TileTextureFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ResolvedTileTexture {
  imagePath: string;
  frame?: TileTextureFrame;
}

function getImageTilesetColumnCount(
  tileset: TilesetDefinition
): number | undefined {
  if (
    tileset.kind !== "image" ||
    !tileset.source ||
    tileset.source.imageWidth === undefined
  ) {
    return undefined;
  }

  const { margin, spacing, columns, imageWidth } = tileset.source;

  if (columns !== undefined) {
    return columns > 0 ? columns : undefined;
  }

  const step = Math.max(1, tileset.tileWidth + spacing);
  const availableWidth = imageWidth - margin * 2 + spacing;
  const computedColumns = Math.floor(availableWidth / step);

  return computedColumns > 0 ? computedColumns : undefined;
}

export function getTilesetTileTextureFrame(
  tileset: TilesetDefinition,
  localId: number
): TileTextureFrame | undefined {
  if (tileset.kind !== "image" || !tileset.source || localId < 0) {
    return undefined;
  }

  const columns = getImageTilesetColumnCount(tileset);

  if (!columns) {
    return undefined;
  }

  const { margin, spacing } = tileset.source;
  const columnIndex = localId % columns;
  const rowIndex = Math.floor(localId / columns);

  return {
    x: margin + columnIndex * (tileset.tileWidth + spacing),
    y: margin + rowIndex * (tileset.tileHeight + spacing),
    width: tileset.tileWidth,
    height: tileset.tileHeight
  };
}

export function resolveTileTexture(
  map: EditorMap,
  tilesets: readonly TilesetDefinition[],
  gid: number
): ResolvedTileTexture | undefined {
  const resolvedTile = resolveMapTileGid(map, [...tilesets], gid);

  if (!resolvedTile) {
    return undefined;
  }

  if (resolvedTile.tileset.kind === "image-collection") {
    if (!resolvedTile.tile?.imageSource) {
      return undefined;
    }

    return {
      imagePath: resolvedTile.tile.imageSource
    };
  }

  if (!resolvedTile.tileset.source) {
    return undefined;
  }

  const frame = getTilesetTileTextureFrame(
    resolvedTile.tileset,
    resolvedTile.localId
  );

  if (!frame) {
    return undefined;
  }

  return {
    imagePath: resolvedTile.tileset.source.imagePath,
    frame
  };
}

export function supportsRenderedMapOrientation(map: EditorMap): boolean {
  return map.settings.orientation === "orthogonal";
}
