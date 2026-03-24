import { createEntityId, type TemplateId, type TilesetId } from "./id";
import type { MapObject } from "./object";

export interface ObjectTemplate {
  id: TemplateId;
  kind: "template";
  name: string;
  object: MapObject;
  tilesetIds: TilesetId[];
}

export function createObjectTemplate(
  name: string,
  object: MapObject,
  tilesetIds: TilesetId[] = []
): ObjectTemplate {
  return {
    id: createEntityId("template"),
    kind: "template",
    name,
    object,
    tilesetIds
  };
}

