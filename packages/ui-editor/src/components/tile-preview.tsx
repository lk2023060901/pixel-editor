"use client";

import {
  getTilesetTileByLocalId,
  type TilesetDefinition
} from "@pixel-editor/domain";
import type { CSSProperties } from "react";

function clampPreviewScale(tileWidth: number, tileHeight: number): number {
  return Math.min(1, 32 / Math.max(tileWidth, tileHeight));
}

function getImageTilesetColumns(tileset: TilesetDefinition): number | undefined {
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

function getSpriteTileStyle(
  tileset: TilesetDefinition,
  localId: number
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
  const scale = clampPreviewScale(tileset.tileWidth, tileset.tileHeight);

  return {
    width: `${tileset.tileWidth * scale}px`,
    height: `${tileset.tileHeight * scale}px`,
    backgroundImage: `url(${tileset.source.imagePath})`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: `-${offsetX * scale}px -${offsetY * scale}px`,
    backgroundSize: `${tileset.source.imageWidth * scale}px ${tileset.source.imageHeight * scale}px`
  };
}

function getCollectionTileStyle(
  tileset: TilesetDefinition,
  localId: number
): CSSProperties | undefined {
  if (tileset.kind !== "image-collection") {
    return undefined;
  }

  const tile = getTilesetTileByLocalId(tileset, localId);

  if (!tile?.imageSource) {
    return undefined;
  }

  const scale = clampPreviewScale(tileset.tileWidth, tileset.tileHeight);

  return {
    width: `${tileset.tileWidth * scale}px`,
    height: `${tileset.tileHeight * scale}px`,
    backgroundImage: `url(${tile.imageSource})`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
    backgroundSize: "contain"
  };
}

export function TilePreview(props: {
  tileset: TilesetDefinition;
  localId: number;
  gid?: number;
}) {
  const style =
    props.tileset.kind === "image"
      ? getSpriteTileStyle(props.tileset, props.localId)
      : getCollectionTileStyle(props.tileset, props.localId);

  return (
    <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-md border border-white/15 bg-slate-950/80">
      <span
        className="rounded-sm"
        style={
          style ?? {
            width: "24px",
            height: "24px",
            backgroundColor: props.gid
              ? `hsl(${(props.gid * 47) % 360} 62% 52%)`
              : "#334155"
          }
        }
      />
    </span>
  );
}
