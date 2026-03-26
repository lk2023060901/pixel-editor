import { createEntityId, type WorldId } from "./id";
import type { PropertyDefinition } from "./property";

export interface WorldMapReference {
  fileName: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface WorldPatternReference {
  regexp: string;
  multiplierX: number;
  multiplierY: number;
  offsetX: number;
  offsetY: number;
  mapWidth: number;
  mapHeight: number;
}

export interface EditorWorld {
  id: WorldId;
  kind: "world";
  name: string;
  maps: WorldMapReference[];
  patterns: WorldPatternReference[];
  onlyShowAdjacentMaps: boolean;
  properties: PropertyDefinition[];
}

export function createWorld(
  name: string,
  maps: WorldMapReference[] = [],
  properties: PropertyDefinition[] = [],
  options?: {
    patterns?: WorldPatternReference[];
    onlyShowAdjacentMaps?: boolean;
  }
): EditorWorld {
  return {
    id: createEntityId("world"),
    kind: "world",
    name,
    maps: maps.map((map) => ({
      fileName: map.fileName,
      x: map.x,
      y: map.y,
      ...(map.width !== undefined ? { width: map.width } : {}),
      ...(map.height !== undefined ? { height: map.height } : {})
    })),
    patterns: (options?.patterns ?? []).map((pattern) => ({
      regexp: pattern.regexp,
      multiplierX: pattern.multiplierX,
      multiplierY: pattern.multiplierY,
      offsetX: pattern.offsetX,
      offsetY: pattern.offsetY,
      mapWidth: pattern.mapWidth,
      mapHeight: pattern.mapHeight
    })),
    onlyShowAdjacentMaps: options?.onlyShowAdjacentMaps ?? false,
    properties
  };
}
