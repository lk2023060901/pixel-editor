import { createEntityId, type LayerId } from "./id";
import type { MapObject } from "./object";
import type { PropertyDefinition } from "./property";

export type BlendMode =
  | "normal"
  | "add"
  | "multiply"
  | "screen"
  | "overlay"
  | "darken"
  | "lighten"
  | "color-dodge"
  | "color-burn"
  | "hard-light"
  | "soft-light"
  | "difference"
  | "exclusion";

export interface TileCell {
  gid: number | null;
  flipHorizontally: boolean;
  flipVertically: boolean;
  flipDiagonally: boolean;
}

export interface TileChunk {
  x: number;
  y: number;
  width: number;
  height: number;
  cells: TileCell[];
}

export interface BaseLayer {
  id: LayerId;
  name: string;
  className?: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  offsetX: number;
  offsetY: number;
  parallaxX: number;
  parallaxY: number;
  tintColor?: string;
  blendMode: BlendMode;
  properties: PropertyDefinition[];
}

export interface TileLayer extends BaseLayer {
  kind: "tile";
  width: number;
  height: number;
  infinite: boolean;
  chunkWidth: number;
  chunkHeight: number;
  cells: TileCell[];
  chunks: TileChunk[];
}

export interface ObjectLayer extends BaseLayer {
  kind: "object";
  drawOrder: "topdown" | "index";
  objects: MapObject[];
}

export interface ImageLayer extends BaseLayer {
  kind: "image";
  imagePath: string;
  imageWidth?: number;
  imageHeight?: number;
  repeatX: boolean;
  repeatY: boolean;
  transparentColor?: string;
}

export interface GroupLayer extends BaseLayer {
  kind: "group";
  layers: LayerDefinition[];
}

export type LayerDefinition =
  | TileLayer
  | ObjectLayer
  | ImageLayer
  | GroupLayer;

export interface BaseLayerInput {
  name: string;
  className?: string;
  visible?: boolean;
  locked?: boolean;
  opacity?: number;
  offsetX?: number;
  offsetY?: number;
  parallaxX?: number;
  parallaxY?: number;
  tintColor?: string;
  blendMode?: BlendMode;
  properties?: PropertyDefinition[];
}

function createBaseLayer(input: BaseLayerInput): BaseLayer {
  return {
    id: createEntityId("layer"),
    name: input.name,
    visible: input.visible ?? true,
    locked: input.locked ?? false,
    opacity: input.opacity ?? 1,
    offsetX: input.offsetX ?? 0,
    offsetY: input.offsetY ?? 0,
    parallaxX: input.parallaxX ?? 1,
    parallaxY: input.parallaxY ?? 1,
    blendMode: input.blendMode ?? "normal",
    properties: input.properties ?? [],
    ...(input.className !== undefined ? { className: input.className } : {}),
    ...(input.tintColor !== undefined ? { tintColor: input.tintColor } : {})
  };
}

export interface CreateTileLayerInput extends BaseLayerInput {
  width: number;
  height: number;
  infinite?: boolean;
  chunkWidth?: number;
  chunkHeight?: number;
}

export function createEmptyTileCell(): TileCell {
  return {
    gid: null,
    flipHorizontally: false,
    flipVertically: false,
    flipDiagonally: false
  };
}

export function createTileLayer(input: CreateTileLayerInput): TileLayer {
  const infinite = input.infinite ?? false;
  const width = infinite ? 0 : input.width;
  const height = infinite ? 0 : input.height;

  if (!infinite && (width <= 0 || height <= 0)) {
    throw new Error("Finite tile layers must have positive width and height");
  }

  return {
    ...createBaseLayer(input),
    kind: "tile",
    width,
    height,
    infinite,
    chunkWidth: input.chunkWidth ?? 16,
    chunkHeight: input.chunkHeight ?? 16,
    cells: infinite ? [] : Array.from({ length: width * height }, () => createEmptyTileCell()),
    chunks: []
  };
}

export interface CreateObjectLayerInput extends BaseLayerInput {
  drawOrder?: "topdown" | "index";
  objects?: MapObject[];
}

export function createObjectLayer(input: CreateObjectLayerInput): ObjectLayer {
  return {
    ...createBaseLayer(input),
    kind: "object",
    drawOrder: input.drawOrder ?? "topdown",
    objects: input.objects ?? []
  };
}

export interface CreateImageLayerInput extends BaseLayerInput {
  imagePath: string;
  imageWidth?: number;
  imageHeight?: number;
  repeatX?: boolean;
  repeatY?: boolean;
  transparentColor?: string;
}

export function createImageLayer(input: CreateImageLayerInput): ImageLayer {
  return {
    ...createBaseLayer(input),
    kind: "image",
    imagePath: input.imagePath,
    repeatX: input.repeatX ?? false,
    repeatY: input.repeatY ?? false,
    ...(input.imageWidth !== undefined ? { imageWidth: input.imageWidth } : {}),
    ...(input.imageHeight !== undefined ? { imageHeight: input.imageHeight } : {}),
    ...(input.transparentColor !== undefined
      ? { transparentColor: input.transparentColor }
      : {})
  };
}

export interface CreateGroupLayerInput extends BaseLayerInput {
  layers?: LayerDefinition[];
}

export function createGroupLayer(input: CreateGroupLayerInput): GroupLayer {
  return {
    ...createBaseLayer(input),
    kind: "group",
    layers: input.layers ?? []
  };
}
