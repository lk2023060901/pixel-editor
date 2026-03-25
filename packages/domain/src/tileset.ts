import {
  createEntityId,
  type TileId,
  type TilesetId,
  type WangSetId
} from "./id";
import type { ObjectLayer } from "./layer";
import type { PropertyDefinition } from "./property";

export type TilesetKind = "image" | "image-collection";
export type TilesetObjectAlignment =
  | "unspecified"
  | "topleft"
  | "top"
  | "topright"
  | "left"
  | "center"
  | "right"
  | "bottomleft"
  | "bottom"
  | "bottomright";
export type TilesetTileRenderSize = "tile" | "grid";
export type TilesetFillMode = "stretch" | "preserve-aspect-fit";

export interface TileAnimationFrame {
  tileId: number;
  durationMs: number;
}

export interface TileDefinition {
  id: TileId;
  localId: number;
  className?: string;
  probability: number;
  properties: PropertyDefinition[];
  imageSource?: string;
  animation: TileAnimationFrame[];
  collisionLayer?: ObjectLayer;
}

export interface TilesetImageSource {
  imagePath: string;
  imageWidth?: number;
  imageHeight?: number;
  margin: number;
  spacing: number;
  columns?: number;
}

export type WangSetType = "corner" | "edge" | "mixed";

export interface WangSetDefinition {
  id: WangSetId;
  name: string;
  type: WangSetType;
}

export interface TilesetDefinition {
  id: TilesetId;
  name: string;
  kind: TilesetKind;
  tileWidth: number;
  tileHeight: number;
  tileOffsetX: number;
  tileOffsetY: number;
  objectAlignment: TilesetObjectAlignment;
  tileRenderSize: TilesetTileRenderSize;
  fillMode: TilesetFillMode;
  source?: TilesetImageSource;
  tiles: TileDefinition[];
  wangSets: WangSetDefinition[];
  properties: PropertyDefinition[];
}

export interface CreateTilesetInput {
  name: string;
  kind: TilesetKind;
  tileWidth: number;
  tileHeight: number;
  source?: TilesetImageSource;
  properties?: PropertyDefinition[];
}

function assertPositiveDimension(name: string, value: number): void {
  if (value <= 0) {
    throw new Error(`${name} must be greater than zero`);
  }
}

export function createTileDefinition(localId: number): TileDefinition {
  return {
    id: createEntityId("tile"),
    localId,
    probability: 1,
    properties: [],
    animation: []
  };
}

export function createWangSetDefinition(input: {
  name: string;
  type: WangSetType;
}): WangSetDefinition {
  return {
    id: createEntityId("wangSet"),
    name: input.name,
    type: input.type
  };
}

export function createTileset(input: CreateTilesetInput): TilesetDefinition {
  assertPositiveDimension("tileWidth", input.tileWidth);
  assertPositiveDimension("tileHeight", input.tileHeight);

  return {
    id: createEntityId("tileset"),
    name: input.name,
    kind: input.kind,
    tileWidth: input.tileWidth,
    tileHeight: input.tileHeight,
    tileOffsetX: 0,
    tileOffsetY: 0,
    objectAlignment: "unspecified",
    tileRenderSize: "tile",
    fillMode: "stretch",
    tiles: [],
    wangSets: [],
    properties: input.properties ?? [],
    ...(input.source !== undefined ? { source: input.source } : {})
  };
}
