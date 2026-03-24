import { createEntityId, type WorldId } from "./id";
import type { PropertyDefinition } from "./property";

export interface WorldMapReference {
  fileName: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface EditorWorld {
  id: WorldId;
  kind: "world";
  name: string;
  maps: WorldMapReference[];
  onlyShowAdjacentMaps: boolean;
  properties: PropertyDefinition[];
}

export function createWorld(
  name: string,
  maps: WorldMapReference[] = [],
  properties: PropertyDefinition[] = []
): EditorWorld {
  return {
    id: createEntityId("world"),
    kind: "world",
    name,
    maps,
    onlyShowAdjacentMaps: false,
    properties
  };
}

