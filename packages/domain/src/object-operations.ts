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
import {
  clonePropertyDefinition,
  type PropertyDefinition
} from "./property";

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

export interface UpdateMapObjectDetailsInput {
  name?: string;
  className?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  visible?: boolean;
  points?: Point[];
  properties?: PropertyDefinition[];
}

export function updateMapObject(
  object: MapObject,
  patch: UpdateMapObjectDetailsInput
): MapObject {
  const nextObject: MapObject = {
    ...object,
    ...(patch.name !== undefined ? { name: patch.name } : {}),
    ...(patch.x !== undefined ? { x: patch.x } : {}),
    ...(patch.y !== undefined ? { y: patch.y } : {}),
    ...(patch.width !== undefined ? { width: patch.width } : {}),
    ...(patch.height !== undefined ? { height: patch.height } : {}),
    ...(patch.rotation !== undefined ? { rotation: patch.rotation } : {}),
    ...(patch.visible !== undefined ? { visible: patch.visible } : {}),
    ...(patch.points !== undefined ? { points: patch.points.map(clonePoint) } : {}),
    ...(patch.properties !== undefined
      ? { properties: patch.properties.map(clonePropertyDefinition) }
      : {})
  };

  if (patch.className !== undefined) {
    const className = patch.className.trim();

    if (className.length > 0) {
      nextObject.className = className;
    } else {
      delete nextObject.className;
    }
  }

  return nextObject;
}

export function translateMapObject(
  object: MapObject,
  deltaX: number,
  deltaY: number
): MapObject {
  if (deltaX === 0 && deltaY === 0) {
    return object;
  }

  return {
    ...object,
    x: object.x + deltaX,
    y: object.y + deltaY
  };
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

export function translateObjectsInLayer(
  layer: ObjectLayer,
  objectIds: readonly ObjectId[],
  deltaX: number,
  deltaY: number
): ObjectLayer {
  if (objectIds.length === 0 || (deltaX === 0 && deltaY === 0)) {
    return layer;
  }

  const targetIds = new Set(objectIds);
  let changed = false;

  const objects = layer.objects.map((object) => {
    if (!targetIds.has(object.id)) {
      return object;
    }

    changed = true;
    return translateMapObject(object, deltaX, deltaY);
  });

  return changed
    ? {
        ...layer,
        objects
      }
    : layer;
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

export function reorderObjectsInLayer(
  layer: ObjectLayer,
  objectIds: readonly ObjectId[],
  direction: "up" | "down"
): ObjectLayer {
  if (objectIds.length === 0) {
    return layer;
  }

  const targetIds = new Set(objectIds);
  const objects = [...layer.objects];
  let changed = false;

  if (direction === "up") {
    for (let index = 1; index < objects.length; index += 1) {
      const currentObject = objects[index];
      const previousObject = objects[index - 1];

      if (!currentObject || !previousObject) {
        continue;
      }

      if (!targetIds.has(currentObject.id) || targetIds.has(previousObject.id)) {
        continue;
      }

      objects[index - 1] = currentObject;
      objects[index] = previousObject;
      changed = true;
    }
  } else {
    for (let index = objects.length - 2; index >= 0; index -= 1) {
      const currentObject = objects[index];
      const nextObject = objects[index + 1];

      if (!currentObject || !nextObject) {
        continue;
      }

      if (!targetIds.has(currentObject.id) || targetIds.has(nextObject.id)) {
        continue;
      }

      objects[index] = nextObject;
      objects[index + 1] = currentObject;
      changed = true;
    }
  }

  return changed
    ? {
        ...layer,
        objects
      }
    : layer;
}

export function getObjectById(
  layer: ObjectLayer,
  objectId: ObjectId
): MapObject | undefined {
  return layer.objects.find((object) => object.id === objectId);
}
