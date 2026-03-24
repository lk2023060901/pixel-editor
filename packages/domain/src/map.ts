import { createEntityId, type MapId, type TilesetId } from "./id";
import type { LayerDefinition } from "./layer";
import type { PropertyDefinition } from "./property";

export type MapOrientation =
  | "orthogonal"
  | "isometric"
  | "staggered"
  | "hexagonal"
  | "oblique";

export type MapRenderOrder =
  | "right-down"
  | "right-up"
  | "left-down"
  | "left-up";

export interface MapSettings {
  orientation: MapOrientation;
  width: number;
  height: number;
  tileWidth: number;
  tileHeight: number;
  infinite: boolean;
  renderOrder: MapRenderOrder;
  compressionLevel: number;
  hexSideLength?: number;
  staggerAxis?: "x" | "y";
  staggerIndex?: "odd" | "even";
  skewX?: number;
  skewY?: number;
  parallaxOriginX: number;
  parallaxOriginY: number;
  backgroundColor?: string;
}

export interface EditorMap {
  id: MapId;
  kind: "map";
  name: string;
  settings: MapSettings;
  layers: LayerDefinition[];
  tilesetIds: TilesetId[];
  properties: PropertyDefinition[];
  nextLayerOrder: number;
  nextObjectId: number;
}

export interface CreateMapInput {
  name: string;
  orientation: MapOrientation;
  width: number;
  height: number;
  tileWidth: number;
  tileHeight: number;
  infinite?: boolean;
  renderOrder?: MapRenderOrder;
  compressionLevel?: number;
  hexSideLength?: number;
  staggerAxis?: "x" | "y";
  staggerIndex?: "odd" | "even";
  skewX?: number;
  skewY?: number;
  parallaxOriginX?: number;
  parallaxOriginY?: number;
  backgroundColor?: string;
  properties?: PropertyDefinition[];
  layers?: LayerDefinition[];
  tilesetIds?: TilesetId[];
}

function assertPositive(name: string, value: number): void {
  if (value <= 0) {
    throw new Error(`${name} must be greater than zero`);
  }
}

export function createMap(input: CreateMapInput): EditorMap {
  assertPositive("tileWidth", input.tileWidth);
  assertPositive("tileHeight", input.tileHeight);

  if (!input.infinite) {
    assertPositive("width", input.width);
    assertPositive("height", input.height);
  }

  return {
    id: createEntityId("map"),
    kind: "map",
    name: input.name,
    settings: {
      orientation: input.orientation,
      width: input.infinite ? 0 : input.width,
      height: input.infinite ? 0 : input.height,
      tileWidth: input.tileWidth,
      tileHeight: input.tileHeight,
      infinite: input.infinite ?? false,
      renderOrder: input.renderOrder ?? "right-down",
      compressionLevel: input.compressionLevel ?? -1,
      parallaxOriginX: input.parallaxOriginX ?? 0,
      parallaxOriginY: input.parallaxOriginY ?? 0,
      ...(input.hexSideLength !== undefined ? { hexSideLength: input.hexSideLength } : {}),
      ...(input.staggerAxis !== undefined ? { staggerAxis: input.staggerAxis } : {}),
      ...(input.staggerIndex !== undefined ? { staggerIndex: input.staggerIndex } : {}),
      ...(input.skewX !== undefined ? { skewX: input.skewX } : {}),
      ...(input.skewY !== undefined ? { skewY: input.skewY } : {}),
      ...(input.backgroundColor !== undefined
        ? { backgroundColor: input.backgroundColor }
        : {})
    },
    layers: input.layers ?? [],
    tilesetIds: input.tilesetIds ?? [],
    properties: input.properties ?? [],
    nextLayerOrder: (input.layers ?? []).length + 1,
    nextObjectId: 1
  };
}
