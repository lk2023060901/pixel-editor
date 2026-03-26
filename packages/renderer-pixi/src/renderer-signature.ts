import type { LayerId, ObjectId } from "@pixel-editor/domain";

import type { ProjectedMapObject } from "./object-layer";
import type { ResolvedTileTexture } from "./tile-texture";

export interface TileLayerRenderCellToken {
  x: number;
  y: number;
  gid: number;
  flipHorizontally: boolean;
  flipVertically: boolean;
  flipDiagonally: boolean;
  texture: ResolvedTileTexture | undefined;
}

export interface TileLayerRenderSegmentToken {
  key: string;
  cells: TileLayerRenderCellToken[];
}

export interface TileLayerRenderGroupToken {
  layerId: LayerId;
  opacity: number;
  highlighted: boolean;
  segments: TileLayerRenderSegmentToken[];
}

export interface TileOverlayCoordinate {
  x: number;
  y: number;
}

export interface TileOverlaySignatureInput {
  coordinates: TileOverlayCoordinate[] | undefined;
  gridOriginX: number;
  gridOriginY: number;
  tileWidth: number;
  tileHeight: number;
}

export interface GridSignatureInput {
  showGrid: boolean;
  gridOriginX: number;
  gridOriginY: number;
  canvasWidth: number;
  canvasHeight: number;
  tileWidth: number;
  tileHeight: number;
  startTileX: number;
  startTileY: number;
  endTileX: number;
  endTileY: number;
}

export interface BoundsSignatureInput {
  infinite: boolean;
  gridOriginX: number;
  gridOriginY: number;
  originX: number;
  originY: number;
  width: number;
  height: number;
  tileWidth: number;
  tileHeight: number;
}

function createTextureToken(texture?: ResolvedTileTexture): string {
  if (!texture) {
    return "missing";
  }

  if (!texture.frame) {
    return `${texture.imagePath}:collection`;
  }

  return `${texture.imagePath}:${texture.frame.x},${texture.frame.y},${texture.frame.width},${texture.frame.height}`;
}

export function createTileLayerSegmentRenderSignature(input: {
  opacity: number;
  highlighted: boolean;
  tileWidth: number;
  tileHeight: number;
  assetVersion: number;
  cells: TileLayerRenderCellToken[];
}): string {
  return [
    input.opacity,
    input.highlighted ? 1 : 0,
    input.tileWidth,
    input.tileHeight,
    input.assetVersion,
    input.cells
      .map((cell) =>
        [
          cell.x,
          cell.y,
          cell.gid,
          cell.flipHorizontally ? 1 : 0,
          cell.flipVertically ? 1 : 0,
          cell.flipDiagonally ? 1 : 0,
          createTextureToken(cell.texture)
        ].join(":")
      )
      .join("|")
  ].join("::");
}

export function createTileLayersRenderSignature(input: {
  layers: TileLayerRenderGroupToken[];
  zoom: number;
  originX: number;
  originY: number;
  tileWidth: number;
  tileHeight: number;
  assetVersion: number;
}): string {
  return [
    input.zoom,
    input.originX,
    input.originY,
    input.tileWidth,
    input.tileHeight,
    input.assetVersion,
    input.layers
      .map((layer) =>
        [
          layer.layerId,
          layer.opacity,
          layer.highlighted ? 1 : 0,
          layer.segments
            .map((segment) =>
              [
                segment.key,
                createTileLayerSegmentRenderSignature({
                  opacity: layer.opacity,
                  highlighted: layer.highlighted,
                  tileWidth: input.tileWidth,
                  tileHeight: input.tileHeight,
                  assetVersion: input.assetVersion,
                  cells: segment.cells
                })
              ].join("~")
            )
            .join("|")
        ].join("~")
      )
      .join("||")
  ].join("::");
}

export function createProjectedObjectsRenderSignature(
  objects: readonly ProjectedMapObject[]
): string {
  return objects
    .map((object) =>
      [
        object.objectId,
        object.layerId,
        object.shape,
        object.opacity,
        object.highlighted ? 1 : 0,
        object.selected ? 1 : 0,
        object.screenX,
        object.screenY,
        object.screenWidth,
        object.screenHeight,
        object.textContent ?? "",
        object.screenPoints?.map((point) => `${point.x},${point.y}`).join(";") ?? ""
      ].join(":")
    )
    .join("|");
}

export function createTileOverlayRenderSignature(
  input: TileOverlaySignatureInput
): string {
  return [
    input.gridOriginX,
    input.gridOriginY,
    input.tileWidth,
    input.tileHeight,
    input.coordinates?.map((coordinate) => `${coordinate.x},${coordinate.y}`).join("|") ?? ""
  ].join("::");
}

export function createGridRenderSignature(
  input: GridSignatureInput
): string {
  if (!input.showGrid) {
    return "hidden";
  }

  return [
    input.gridOriginX,
    input.gridOriginY,
    input.canvasWidth,
    input.canvasHeight,
    input.tileWidth,
    input.tileHeight,
    input.startTileX,
    input.startTileY,
    input.endTileX,
    input.endTileY
  ].join(":");
}

export function createBoundsRenderSignature(
  input: BoundsSignatureInput
): string {
  if (input.infinite) {
    return "infinite";
  }

  return [
    input.gridOriginX,
    input.gridOriginY,
    input.originX,
    input.originY,
    input.width,
    input.height,
    input.tileWidth,
    input.tileHeight
  ].join(":");
}
