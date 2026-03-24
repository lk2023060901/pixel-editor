import { createEntityId, type ObjectId, type TemplateId, type TilesetId } from "./id";
import type { PropertyDefinition } from "./property";

export type ObjectShape =
  | "rectangle"
  | "ellipse"
  | "point"
  | "polygon"
  | "polyline"
  | "text"
  | "tile"
  | "capsule";

export interface Point {
  x: number;
  y: number;
}

export interface TextObjectData {
  content: string;
  fontFamily: string;
  pixelSize: number;
  wrap: boolean;
  color: string;
}

export interface TileObjectData {
  tilesetId?: TilesetId;
  tileId?: number;
  gid?: number;
}

export interface MapObject {
  id: ObjectId;
  name: string;
  className?: string;
  shape: ObjectShape;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  visible: boolean;
  properties: PropertyDefinition[];
  points?: Point[];
  text?: TextObjectData;
  tile?: TileObjectData;
  templateId?: TemplateId;
}

export interface CreateObjectInput {
  name: string;
  shape: ObjectShape;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  visible?: boolean;
  properties?: PropertyDefinition[];
  points?: Point[];
  text?: TextObjectData;
  tile?: TileObjectData;
  className?: string;
  templateId?: TemplateId;
}

export function createMapObject(input: CreateObjectInput): MapObject {
  return {
    id: createEntityId("object"),
    name: input.name,
    shape: input.shape,
    x: input.x ?? 0,
    y: input.y ?? 0,
    width: input.width ?? 0,
    height: input.height ?? 0,
    rotation: input.rotation ?? 0,
    visible: input.visible ?? true,
    properties: input.properties ?? [],
    ...(input.className !== undefined ? { className: input.className } : {}),
    ...(input.points !== undefined ? { points: input.points } : {}),
    ...(input.text !== undefined ? { text: input.text } : {}),
    ...(input.tile !== undefined ? { tile: input.tile } : {}),
    ...(input.templateId !== undefined ? { templateId: input.templateId } : {})
  };
}
