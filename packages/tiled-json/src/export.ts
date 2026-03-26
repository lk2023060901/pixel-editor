import type {
  LayerDefinition,
  MapObject,
  ObjectId,
  PropertyDefinition,
  PropertyValue,
  TileCell,
  TileChunk
} from "@pixel-editor/domain";

import type {
  ExportTmjMapDocumentInput,
  ImportedTmjTilesetReference,
  TmjJsonObject,
  TmjJsonValue
} from "./types";

const FLIPPED_HORIZONTALLY_FLAG = 0x80000000;
const FLIPPED_VERTICALLY_FLAG = 0x40000000;
const FLIPPED_DIAGONALLY_FLAG = 0x20000000;
const TMJ_FORMAT_VERSION = "1.11";

function compareNumbers(left: number, right: number): number {
  return left - right;
}

function compareStrings(left: string, right: string): number {
  return left.localeCompare(right);
}

function encodeTileGid(cell: TileCell): number {
  if (cell.gid === null) {
    return 0;
  }

  let gid = cell.gid >>> 0;

  if (cell.flipHorizontally) {
    gid |= FLIPPED_HORIZONTALLY_FLAG;
  }

  if (cell.flipVertically) {
    gid |= FLIPPED_VERTICALLY_FLAG;
  }

  if (cell.flipDiagonally) {
    gid |= FLIPPED_DIAGONALLY_FLAG;
  }

  return gid >>> 0;
}

function collectLayerIdMap(
  layers: readonly LayerDefinition[],
  nextId = 1,
  layerIds = new Map<LayerDefinition["id"], number>()
): { layerIds: Map<LayerDefinition["id"], number>; nextId: number } {
  let currentId = nextId;

  for (const layer of layers) {
    layerIds.set(layer.id, currentId);
    currentId += 1;

    if (layer.kind === "group") {
      const nested = collectLayerIdMap(layer.layers, currentId, layerIds);
      currentId = nested.nextId;
    }
  }

  return { layerIds, nextId: currentId };
}

function collectObjectIdMap(
  layers: readonly LayerDefinition[],
  nextId = 1,
  objectIds = new Map<ObjectId, number>()
): { objectIds: Map<ObjectId, number>; nextId: number } {
  let currentId = nextId;

  for (const layer of layers) {
    if (layer.kind === "object") {
      for (const object of layer.objects) {
        objectIds.set(object.id, currentId);
        currentId += 1;
      }
      continue;
    }

    if (layer.kind === "group") {
      const nested = collectObjectIdMap(layer.layers, currentId, objectIds);
      currentId = nested.nextId;
    }
  }

  return { objectIds, nextId: currentId };
}

function serializePropertyValue(
  value: PropertyValue,
  objectIds: ReadonlyMap<ObjectId, number>
): TmjJsonValue {
  if (Array.isArray(value)) {
    return value.map((entry) => serializePropertyValue(entry, objectIds));
  }

  if (value === null || typeof value === "boolean" || typeof value === "number" || typeof value === "string") {
    return value;
  }

  if ("objectId" in value) {
    return objectIds.get(value.objectId) ?? 0;
  }

  if ("members" in value) {
    return Object.fromEntries(
      Object.entries(value.members)
        .sort(([left], [right]) => compareStrings(left, right))
        .map(([key, memberValue]) => [key, serializePropertyValue(memberValue, objectIds)])
    );
  }

  return null;
}

function serializeProperties(
  properties: readonly PropertyDefinition[],
  objectIds: ReadonlyMap<ObjectId, number>,
  options: Pick<ExportTmjMapDocumentInput, "resolveObjectTypesAndProperties">
): TmjJsonObject[] | undefined {
  if (properties.length === 0) {
    return undefined;
  }

  return [...properties]
    .sort((left, right) => compareStrings(left.name, right.name))
    .map((property) => {
      const type =
        property.type === "enum"
          ? typeof property.value === "number" && Number.isInteger(property.value)
            ? "int"
            : "string"
          : property.type;
      const value = serializePropertyValue(property.value, objectIds);

      return {
        name: property.name,
        type,
        value,
        ...(property.propertyTypeName !== undefined &&
        !options.resolveObjectTypesAndProperties
          ? { propertytype: property.propertyTypeName }
          : {})
      };
    });
}

function serializeTextData(object: MapObject): TmjJsonObject | undefined {
  if (!object.text) {
    return undefined;
  }

  return {
    text: object.text.content,
    ...(object.text.fontFamily !== "sans-serif"
      ? { fontfamily: object.text.fontFamily }
      : {}),
    ...(object.text.pixelSize !== 16 ? { pixelsize: object.text.pixelSize } : {}),
    ...(object.text.wrap ? { wrap: true } : {}),
    ...(object.text.color !== "#000000" ? { color: object.text.color } : {})
  };
}

function serializeMapObject(
  object: MapObject,
  objectIds: ReadonlyMap<ObjectId, number>,
  options: Pick<ExportTmjMapDocumentInput, "resolveObjectTypesAndProperties">
): TmjJsonObject {
  const properties = serializeProperties(object.properties, objectIds, options);
  const document: TmjJsonObject = {
    ...(properties ? { properties } : {}),
    ...(objectIds.get(object.id) !== undefined ? { id: objectIds.get(object.id)! } : {}),
    name: object.name,
    ...(!options.resolveObjectTypesAndProperties ? { type: object.className ?? "" } : {}),
    ...(object.tile?.gid !== undefined ? { gid: object.tile.gid } : {}),
    x: object.x,
    y: object.y,
    width: object.width,
    height: object.height,
    rotation: object.rotation,
    visible: object.visible
  };

  if (object.shape === "ellipse") {
    document.ellipse = true;
  } else if (object.shape === "point") {
    document.point = true;
  } else if (object.shape === "polygon" && object.points) {
    document.polygon = object.points.map((point) => ({
      x: point.x,
      y: point.y
    }));
  } else if (object.shape === "polyline" && object.points) {
    document.polyline = object.points.map((point) => ({
      x: point.x,
      y: point.y
    }));
  } else if (object.shape === "capsule") {
    document.capsule = true;
  } else if (object.shape === "text") {
    const text = serializeTextData(object);

    if (text) {
      document.text = text;
    }
  }

  return document;
}

function getInfiniteLayerBounds(chunks: readonly TileChunk[]): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  if (chunks.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = chunks[0]!.x;
  let minY = chunks[0]!.y;
  let maxX = chunks[0]!.x + chunks[0]!.width;
  let maxY = chunks[0]!.y + chunks[0]!.height;

  for (const chunk of chunks.slice(1)) {
    minX = Math.min(minX, chunk.x);
    minY = Math.min(minY, chunk.y);
    maxX = Math.max(maxX, chunk.x + chunk.width);
    maxY = Math.max(maxY, chunk.y + chunk.height);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

function serializeLayerAttributes(
  layer: LayerDefinition,
  layerIds: ReadonlyMap<LayerDefinition["id"], number>,
  objectIds: ReadonlyMap<ObjectId, number>,
  options: Pick<ExportTmjMapDocumentInput, "resolveObjectTypesAndProperties">
): TmjJsonObject {
  const properties = serializeProperties(layer.properties, objectIds, options);

  return {
    ...(layerIds.get(layer.id) !== undefined ? { id: layerIds.get(layer.id)! } : {}),
    name: layer.name,
    ...(layer.className !== undefined && !options.resolveObjectTypesAndProperties
      ? { class: layer.className }
      : {}),
    x: 0,
    y: 0,
    visible: layer.visible,
    ...(layer.locked ? { locked: true } : {}),
    opacity: layer.opacity,
    ...(layer.offsetX !== 0 ? { offsetx: layer.offsetX } : {}),
    ...(layer.offsetY !== 0 ? { offsety: layer.offsetY } : {}),
    ...(layer.parallaxX !== 1 ? { parallaxx: layer.parallaxX } : {}),
    ...(layer.parallaxY !== 1 ? { parallaxy: layer.parallaxY } : {}),
    ...(layer.tintColor !== undefined ? { tintcolor: layer.tintColor } : {}),
    ...(layer.blendMode !== "normal" ? { mode: layer.blendMode } : {}),
    ...(properties ? { properties } : {})
  };
}

function serializeTileLayer(
  layer: Extract<LayerDefinition, { kind: "tile" }>,
  layerIds: ReadonlyMap<LayerDefinition["id"], number>,
  objectIds: ReadonlyMap<ObjectId, number>,
  options: Pick<ExportTmjMapDocumentInput, "resolveObjectTypesAndProperties">
): TmjJsonObject {
  const bounds = getInfiniteLayerBounds(layer.chunks);
  const document: TmjJsonObject = {
    type: "tilelayer",
    width: layer.infinite ? bounds.width : layer.width,
    height: layer.infinite ? bounds.height : layer.height,
    ...(layer.infinite ? { startx: bounds.x, starty: bounds.y } : {}),
    ...serializeLayerAttributes(layer, layerIds, objectIds, options)
  };

  if (layer.infinite) {
    document.chunks = [...layer.chunks]
      .sort((left, right) =>
        compareNumbers(left.y, right.y) || compareNumbers(left.x, right.x)
      )
      .map((chunk) => ({
        x: chunk.x,
        y: chunk.y,
        width: chunk.width,
        height: chunk.height,
        data: chunk.cells.map((cell) => encodeTileGid(cell))
      }));
  } else {
    document.data = layer.cells.map((cell) => encodeTileGid(cell));
  }

  return document;
}

function serializeObjectLayer(
  layer: Extract<LayerDefinition, { kind: "object" }>,
  layerIds: ReadonlyMap<LayerDefinition["id"], number>,
  objectIds: ReadonlyMap<ObjectId, number>,
  options: Pick<ExportTmjMapDocumentInput, "resolveObjectTypesAndProperties">
): TmjJsonObject {
  return {
    type: "objectgroup",
    draworder: layer.drawOrder,
    ...serializeLayerAttributes(layer, layerIds, objectIds, options),
    objects: layer.objects.map((object) => serializeMapObject(object, objectIds, options))
  };
}

function serializeImageLayer(
  layer: Extract<LayerDefinition, { kind: "image" }>,
  layerIds: ReadonlyMap<LayerDefinition["id"], number>,
  objectIds: ReadonlyMap<ObjectId, number>,
  options: Pick<ExportTmjMapDocumentInput, "resolveObjectTypesAndProperties">
): TmjJsonObject {
  return {
    type: "imagelayer",
    ...serializeLayerAttributes(layer, layerIds, objectIds, options),
    image: layer.imagePath,
    ...(layer.imageWidth !== undefined ? { imagewidth: layer.imageWidth } : {}),
    ...(layer.imageHeight !== undefined ? { imageheight: layer.imageHeight } : {}),
    ...(layer.transparentColor !== undefined
      ? { transparentcolor: layer.transparentColor }
      : {}),
    ...(layer.repeatX ? { repeatx: true } : {}),
    ...(layer.repeatY ? { repeaty: true } : {})
  };
}

function serializeGroupLayer(
  layer: Extract<LayerDefinition, { kind: "group" }>,
  layerIds: ReadonlyMap<LayerDefinition["id"], number>,
  objectIds: ReadonlyMap<ObjectId, number>,
  options: Pick<ExportTmjMapDocumentInput, "resolveObjectTypesAndProperties">
): TmjJsonObject {
  return {
    type: "group",
    ...serializeLayerAttributes(layer, layerIds, objectIds, options),
    layers: serializeLayers(layer.layers, layerIds, objectIds, options)
  };
}

function serializeLayers(
  layers: readonly LayerDefinition[],
  layerIds: ReadonlyMap<LayerDefinition["id"], number>,
  objectIds: ReadonlyMap<ObjectId, number>,
  options: Pick<ExportTmjMapDocumentInput, "resolveObjectTypesAndProperties">
): TmjJsonObject[] {
  return layers.map((layer) => {
    switch (layer.kind) {
      case "tile":
        return serializeTileLayer(layer, layerIds, objectIds, options);
      case "object":
        return serializeObjectLayer(layer, layerIds, objectIds, options);
      case "image":
        return serializeImageLayer(layer, layerIds, objectIds, options);
      case "group":
        return serializeGroupLayer(layer, layerIds, objectIds, options);
    }
  });
}

function serializeTilesetReference(reference: ImportedTmjTilesetReference): TmjJsonObject {
  if (reference.source) {
    return {
      firstgid: reference.firstGid,
      source: reference.source
    };
  }

  return {
    firstgid: reference.firstGid,
    ...(reference.name !== undefined ? { name: reference.name } : {}),
    ...(reference.tileCount !== undefined ? { tilecount: reference.tileCount } : {}),
    ...(reference.image !== undefined ? { image: reference.image } : {})
  };
}

export function exportTmjMapDocument(input: ExportTmjMapDocumentInput): TmjJsonObject {
  const { map } = input;
  const { layerIds, nextId: nextLayerId } = collectLayerIdMap(map.layers);
  const { objectIds } = collectObjectIdMap(map.layers);
  const serializeOptions = {
    resolveObjectTypesAndProperties: input.resolveObjectTypesAndProperties ?? false
  };
  const properties = serializeProperties(map.properties, objectIds, serializeOptions);

  return {
    type: "map",
    version: input.formatVersion ?? TMJ_FORMAT_VERSION,
    tiledversion: input.tiledVersion ?? TMJ_FORMAT_VERSION,
    orientation: map.settings.orientation,
    renderorder: map.settings.renderOrder,
    width: map.settings.width,
    height: map.settings.height,
    tilewidth: map.settings.tileWidth,
    tileheight: map.settings.tileHeight,
    infinite: map.settings.infinite,
    nextlayerid: nextLayerId,
    nextobjectid: map.nextObjectId,
    compressionlevel: map.settings.compressionLevel,
    ...(properties ? { properties } : {}),
    ...(map.settings.hexSideLength !== undefined
      ? { hexsidelength: map.settings.hexSideLength }
      : {}),
    ...(map.settings.staggerAxis !== undefined ? { staggeraxis: map.settings.staggerAxis } : {}),
    ...(map.settings.staggerIndex !== undefined
      ? { staggerindex: map.settings.staggerIndex }
      : {}),
    ...(map.settings.skewX !== undefined ? { skewx: map.settings.skewX } : {}),
    ...(map.settings.skewY !== undefined ? { skewy: map.settings.skewY } : {}),
    ...(map.settings.parallaxOriginX !== 0
      ? { parallaxoriginx: map.settings.parallaxOriginX }
      : {}),
    ...(map.settings.parallaxOriginY !== 0
      ? { parallaxoriginy: map.settings.parallaxOriginY }
      : {}),
    ...(map.settings.backgroundColor !== undefined
      ? { backgroundcolor: map.settings.backgroundColor }
      : {}),
    tilesets: [...(input.tilesetReferences ?? [])]
      .sort((left, right) => compareNumbers(left.firstGid, right.firstGid))
      .map((reference) => serializeTilesetReference(reference)),
    layers: serializeLayers(map.layers, layerIds, objectIds, serializeOptions)
  };
}

export function stringifyTmjMapDocument(
  input: ExportTmjMapDocumentInput,
  space = input.minimized ? 0 : 2
): string {
  return JSON.stringify(exportTmjMapDocument(input), null, space);
}
