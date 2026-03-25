"use client";

import type { CSSProperties } from "react";

import {
  getTilesetTileByLocalId,
  type TilesetDefinition
} from "@pixel-editor/domain";

export const TILESET_VIEW_ZOOM_OPTIONS = [0.5, 1, 2, 4] as const;

export function getImageTilesetColumns(tileset: TilesetDefinition): number | undefined {
  if (tileset.kind !== "image" || !tileset.source) {
    return undefined;
  }

  if (tileset.source.columns !== undefined) {
    return tileset.source.columns;
  }

  if (tileset.source.imageWidth === undefined) {
    return undefined;
  }

  return Math.floor(
    (tileset.source.imageWidth - tileset.source.margin * 2 + tileset.source.spacing) /
      Math.max(1, tileset.tileWidth + tileset.source.spacing)
  );
}

export function buildImageTilesetTileStyle(
  tileset: TilesetDefinition,
  localId: number,
  zoom: number
): CSSProperties | undefined {
  if (
    tileset.kind !== "image" ||
    !tileset.source ||
    tileset.source.imageWidth === undefined ||
    tileset.source.imageHeight === undefined
  ) {
    return undefined;
  }

  const columns = getImageTilesetColumns(tileset);

  if (!columns || columns <= 0) {
    return undefined;
  }

  const column = localId % columns;
  const row = Math.floor(localId / columns);
  const offsetX =
    tileset.source.margin + column * (tileset.tileWidth + tileset.source.spacing);
  const offsetY =
    tileset.source.margin + row * (tileset.tileHeight + tileset.source.spacing);

  return {
    width: `${tileset.tileWidth * zoom}px`,
    height: `${tileset.tileHeight * zoom}px`,
    backgroundImage: `url(${tileset.source.imagePath})`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: `-${offsetX * zoom}px -${offsetY * zoom}px`,
    backgroundSize: `${tileset.source.imageWidth * zoom}px ${tileset.source.imageHeight * zoom}px`
  };
}

export function buildImageCollectionTileStyle(
  tileset: TilesetDefinition,
  localId: number,
  zoom: number
): CSSProperties | undefined {
  if (tileset.kind !== "image-collection") {
    return undefined;
  }

  const tile = getTilesetTileByLocalId(tileset, localId);

  if (!tile?.imageSource) {
    return undefined;
  }

  return {
    width: `${tileset.tileWidth * zoom}px`,
    height: `${tileset.tileHeight * zoom}px`,
    backgroundImage: `url(${tile.imageSource})`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
    backgroundSize: "contain"
  };
}
