import type { ObjectLayer } from "./layer";
import {
  createMapObject,
  type CreateObjectInput,
  type MapObject,
  type Point,
  type TextObjectData,
  type TileObjectData
} from "./object";
import type { ObjectId } from "./id";
import type { PropertyDefinition, PropertyValue } from "./property";

export interface ObjectBoundsRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function clonePoint(point: Point): Point {
  return {
    x: point.x,
    y: point.y
  };
}

function cloneTextObjectData(text: TextObjectData): TextObjectData {
  return {
    content: text.content,
    fontFamily: text.fontFamily,
    pixelSize: text.pixelSize,
    wrap: text.wrap,
    color: text.color
  };
}

function cloneTileObjectData(tile: TileObjectData): TileObjectData {
  return {
    ...(tile.tilesetId !== undefined ? { tilesetId: tile.tilesetId } : {}),
    ...(tile.tileId !== undefined ? { tileId: tile.tileId } : {}),
    ...(tile.gid !== undefined ? { gid: tile.gid } : {})
  };
}

function clonePropertyValue(value: PropertyValue): PropertyValue {
  if (Array.isArray(value)) {
    return value.map((entry) => clonePropertyValue(entry));
  }

  if (value === null || typeof value !== "object") {
    return value;
  }

  if ("members" in value) {
    return {
      members: Object.fromEntries(
        Object.entries(value.members).map(([key, memberValue]) => [
          key,
          clonePropertyValue(memberValue)
        ])
      )
    };
  }

  if ("objectId" in value) {
    return {
      objectId: value.objectId
    };
  }

  return value;
}

export function clonePropertyDefinition(
  property: PropertyDefinition
): PropertyDefinition {
  return {
    name: property.name,
    type: property.type,
    value: clonePropertyValue(property.value),
    ...(property.propertyTypeName !== undefined
      ? { propertyTypeName: property.propertyTypeName }
      : {})
  };
}

export function cloneMapObject(
  object: MapObject,
  patch: Partial<CreateObjectInput> = {}
): MapObject {
  const points = patch.points ?? object.points?.map(clonePoint);
  const text = patch.text ?? (object.text ? cloneTextObjectData(object.text) : undefined);
  const tile = patch.tile ?? (object.tile ? cloneTileObjectData(object.tile) : undefined);
  const className = patch.className ?? object.className;
  const templateId = patch.templateId ?? object.templateId;

  return createMapObject({
    name: patch.name ?? object.name,
    shape: patch.shape ?? object.shape,
    x: patch.x ?? object.x,
    y: patch.y ?? object.y,
    width: patch.width ?? object.width,
    height: patch.height ?? object.height,
    rotation: patch.rotation ?? object.rotation,
    visible: patch.visible ?? object.visible,
    properties: patch.properties ?? object.properties.map(clonePropertyDefinition),
    ...(points !== undefined ? { points } : {}),
    ...(text !== undefined ? { text } : {}),
    ...(tile !== undefined ? { tile } : {}),
    ...(className !== undefined ? { className } : {}),
    ...(templateId !== undefined ? { templateId } : {})
  });
}

export function getMapObjectBounds(
  objects: readonly MapObject[]
): ObjectBoundsRect | undefined {
  if (objects.length === 0) {
    return undefined;
  }

  const minX = Math.min(...objects.map((object) => object.x));
  const minY = Math.min(...objects.map((object) => object.y));
  const maxX = Math.max(...objects.map((object) => object.x + Math.max(object.width, 0)));
  const maxY = Math.max(...objects.map((object) => object.y + Math.max(object.height, 0)));

  return {
    x: minX,
    y: minY,
    width: Math.max(maxX - minX, 0),
    height: Math.max(maxY - minY, 0)
  };
}

export function appendObjectsToLayer(
  layer: ObjectLayer,
  objects: readonly MapObject[]
): ObjectLayer {
  if (objects.length === 0) {
    return layer;
  }

  return {
    ...layer,
    objects: [...layer.objects, ...objects]
  };
}

export function removeObjectsFromLayer(
  layer: ObjectLayer,
  objectIds: readonly ObjectId[]
): ObjectLayer {
  if (objectIds.length === 0) {
    return layer;
  }

  const targetIds = new Set(objectIds);

  return {
    ...layer,
    objects: layer.objects.filter((object) => !targetIds.has(object.id))
  };
}

export function getObjectById(
  layer: ObjectLayer,
  objectId: ObjectId
): MapObject | undefined {
  return layer.objects.find((object) => object.id === objectId);
}
