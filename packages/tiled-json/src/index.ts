import {
  createGroupLayer,
  createImageLayer,
  createMap,
  createMapObject,
  createObjectLayer,
  createProperty,
  createTileCell,
  createTileLayer,
  type BlendMode,
  type EditorMap,
  type LayerDefinition,
  type MapObject,
  type ObjectShape,
  type PropertyDefinition,
  type PropertyTypeName,
  type PropertyValue,
  type TileCell,
  type TileChunk
} from "@pixel-editor/domain";

import type {
  ImportedTmjMapDocument,
  ImportedTmjTilesetReference,
  TmjImportIssue
} from "./types";

export * from "./types";
export { exportTmjMapDocument, stringifyTmjMapDocument } from "./export";
export {
  exportTsjTilesetDocument,
  importTsjTilesetDocument,
  stringifyTsjTilesetDocument
} from "./tileset";

const FLIPPED_HORIZONTALLY_FLAG = 0x80000000;
const FLIPPED_VERTICALLY_FLAG = 0x40000000;
const FLIPPED_DIAGONALLY_FLAG = 0x20000000;
const ROTATED_HEXAGONAL_120_FLAG = 0x10000000;

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireRecord(value: unknown, path: string): JsonRecord {
  if (!isRecord(value)) {
    throw new Error(`${path} must be an object`);
  }

  return value;
}

function requireString(record: JsonRecord, key: string, path: string): string {
  const value = record[key];

  if (typeof value !== "string") {
    throw new Error(`${path}.${key} must be a string`);
  }

  return value;
}

function requireNumber(record: JsonRecord, key: string, path: string): number {
  const value = record[key];

  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`${path}.${key} must be a number`);
  }

  return value;
}

function optionalNumber(record: JsonRecord, key: string): number | undefined {
  const value = record[key];
  return typeof value === "number" && !Number.isNaN(value) ? value : undefined;
}

function optionalString(record: JsonRecord, key: string): string | undefined {
  return typeof record[key] === "string" ? (record[key] as string) : undefined;
}

function optionalBoolean(record: JsonRecord, key: string): boolean | undefined {
  return typeof record[key] === "boolean" ? (record[key] as boolean) : undefined;
}

function appendIssue(
  issues: TmjImportIssue[],
  path: string,
  code: string,
  message: string
): void {
  issues.push({
    severity: "warning",
    code,
    message,
    path
  });
}

function isBlendMode(value: unknown): value is BlendMode {
  return (
    value === "normal" ||
    value === "add" ||
    value === "multiply" ||
    value === "screen" ||
    value === "overlay" ||
    value === "darken" ||
    value === "lighten" ||
    value === "color-dodge" ||
    value === "color-burn" ||
    value === "hard-light" ||
    value === "soft-light" ||
    value === "difference" ||
    value === "exclusion"
  );
}

function decodeTileGid(
  rawGid: number,
  issues: TmjImportIssue[],
  path: string
): TileCell {
  const gidBits = rawGid >>> 0;
  const rotatedHexagonal = (gidBits & ROTATED_HEXAGONAL_120_FLAG) !== 0;

  if (rotatedHexagonal) {
    appendIssue(
      issues,
      path,
      "tmj.gid.hexRotationUnsupported",
      "Hexagonal rotated tile flags are not represented by the current domain model."
    );
  }

  const gid =
    gidBits &
    ~(FLIPPED_HORIZONTALLY_FLAG |
      FLIPPED_VERTICALLY_FLAG |
      FLIPPED_DIAGONALLY_FLAG |
      ROTATED_HEXAGONAL_120_FLAG);

  return {
    gid: gid === 0 ? null : gid,
    flipHorizontally: (gidBits & FLIPPED_HORIZONTALLY_FLAG) !== 0,
    flipVertically: (gidBits & FLIPPED_VERTICALLY_FLAG) !== 0,
    flipDiagonally: (gidBits & FLIPPED_DIAGONALLY_FLAG) !== 0
  };
}

function parsePropertyValueLiteral(value: unknown): PropertyValue {
  if (Array.isArray(value)) {
    return value.map((entry) => parsePropertyValueLiteral(entry));
  }

  if (!isRecord(value)) {
    if (
      value === null ||
      typeof value === "boolean" ||
      typeof value === "number" ||
      typeof value === "string"
    ) {
      return value;
    }

    return null;
  }

  return {
    members: Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        parsePropertyValueLiteral(nestedValue)
      ])
    )
  };
}

function parsePropertyDefinition(
  value: unknown,
  issues: TmjImportIssue[],
  path: string
): PropertyDefinition | undefined {
  const record = requireRecord(value, path);
  const name = requireString(record, "name", path);
  const rawType = optionalString(record, "type");
  const propertyTypeName = optionalString(record, "propertytype");
  const rawValue = record.value;

  if (rawType === "class") {
    const classMembers = isRecord(rawValue)
      ? Object.fromEntries(
          Object.entries(rawValue).map(([key, entryValue]) => [
            key,
            parsePropertyValueLiteral(entryValue)
          ])
        )
      : {};

    return createProperty(name, "class", { members: classMembers }, propertyTypeName);
  }

  if (rawType === "object") {
    if (rawValue === null || rawValue === 0 || rawValue === undefined) {
      return createProperty(name, "object", null, propertyTypeName);
    }

    appendIssue(
      issues,
      path,
      "tmj.property.objectReferenceUnsupported",
      `Object property \`${name}\` uses unresolved TMJ object ids and is currently imported as null.`
    );
    return createProperty(name, "object", null, propertyTypeName);
  }

  if (propertyTypeName && (rawType === "string" || rawType === "int")) {
    return createProperty(
      name,
      "enum",
      (rawValue as string | number | null) ?? (rawType === "int" ? 0 : ""),
      propertyTypeName
    );
  }

  const inferredType: PropertyTypeName =
    rawType === "bool" ||
    rawType === "color" ||
    rawType === "file" ||
    rawType === "float" ||
    rawType === "int" ||
    rawType === "string"
      ? rawType
      : typeof rawValue === "boolean"
        ? "bool"
        : typeof rawValue === "number"
          ? Number.isInteger(rawValue)
            ? "int"
            : "float"
          : "string";

  return createProperty(
    name,
    inferredType,
    (rawValue as string | number | boolean | null) ??
      (inferredType === "bool" ? false : inferredType === "int" || inferredType === "float" ? 0 : ""),
    propertyTypeName
  );
}

function parseProperties(
  record: JsonRecord,
  issues: TmjImportIssue[],
  path: string
): PropertyDefinition[] {
  const rawProperties = record.properties;

  if (rawProperties === undefined) {
    return [];
  }

  if (!Array.isArray(rawProperties)) {
    appendIssue(issues, `${path}.properties`, "tmj.properties.invalid", "Properties must be an array.");
    return [];
  }

  return rawProperties.flatMap((property, index) => {
    const parsed = parsePropertyDefinition(property, issues, `${path}.properties[${index}]`);
    return parsed ? [parsed] : [];
  });
}

function buildBaseLayerInput(
  record: JsonRecord,
  issues: TmjImportIssue[],
  path: string
): {
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
} {
  const rawBlendMode = optionalString(record, "mode") ?? optionalString(record, "blendmode");
  const blendMode = isBlendMode(rawBlendMode) ? rawBlendMode : "normal";

  if (rawBlendMode !== undefined && !isBlendMode(rawBlendMode)) {
    appendIssue(
      issues,
      `${path}.blendmode`,
      "tmj.layer.blendModeUnsupported",
      `Blend mode \`${rawBlendMode}\` is not supported and was normalized to \`normal\`.`
    );
  }

  const className = optionalString(record, "class");

  return {
    name: optionalString(record, "name") ?? "",
    visible: optionalBoolean(record, "visible") ?? true,
    locked: optionalBoolean(record, "locked") ?? false,
    opacity: optionalNumber(record, "opacity") ?? 1,
    offsetX: optionalNumber(record, "offsetx") ?? 0,
    offsetY: optionalNumber(record, "offsety") ?? 0,
    parallaxX: optionalNumber(record, "parallaxx") ?? 1,
    parallaxY: optionalNumber(record, "parallaxy") ?? 1,
    blendMode,
    properties: parseProperties(record, issues, path),
    ...(className !== undefined ? { className } : {})
  };
}

function parseTileDataArray(
  value: unknown,
  issues: TmjImportIssue[],
  path: string
): TileCell[] {
  if (!Array.isArray(value)) {
    appendIssue(
      issues,
      path,
      "tmj.tileData.encodingUnsupported",
      "Only array-based TMJ tile data is currently supported."
    );
    return [];
  }

  return value.map((entry, index) =>
    decodeTileGid(typeof entry === "number" ? entry : 0, issues, `${path}[${index}]`)
  );
}

function parseTileChunk(
  value: unknown,
  issues: TmjImportIssue[],
  path: string
): TileChunk {
  const record = requireRecord(value, path);

  return {
    x: requireNumber(record, "x", path),
    y: requireNumber(record, "y", path),
    width: requireNumber(record, "width", path),
    height: requireNumber(record, "height", path),
    cells: parseTileDataArray(record.data, issues, `${path}.data`)
  };
}

function parseTextObjectData(value: unknown, path: string): NonNullable<MapObject["text"]> {
  const record = requireRecord(value, path);

  return {
    content: optionalString(record, "text") ?? "",
    fontFamily: optionalString(record, "fontfamily") ?? "sans-serif",
    pixelSize: optionalNumber(record, "pixelsize") ?? 16,
    wrap: optionalBoolean(record, "wrap") ?? false,
    color: optionalString(record, "color") ?? "#000000"
  };
}

function parseObjectShape(record: JsonRecord): ObjectShape {
  if (record.gid !== undefined) {
    return "tile";
  }

  if (record.text !== undefined) {
    return "text";
  }

  if (Array.isArray(record.polygon)) {
    return "polygon";
  }

  if (Array.isArray(record.polyline)) {
    return "polyline";
  }

  if (record.ellipse === true) {
    return "ellipse";
  }

  if (record.point === true) {
    return "point";
  }

  return "rectangle";
}

function parsePoints(value: unknown, path: string): Array<{ x: number; y: number }> {
  if (!Array.isArray(value)) {
    throw new Error(`${path} must be an array`);
  }

  return value.map((entry, index) => {
    const record = requireRecord(entry, `${path}[${index}]`);

    return {
      x: requireNumber(record, "x", `${path}[${index}]`),
      y: requireNumber(record, "y", `${path}[${index}]`)
    };
  });
}

function parseMapObject(
  value: unknown,
  issues: TmjImportIssue[],
  path: string
): { object: MapObject; rawId?: number } {
  const record = requireRecord(value, path);
  const shape = parseObjectShape(record);
  const rawId = optionalNumber(record, "id");
  const name = optionalString(record, "name") ?? "";
  const typeName = optionalString(record, "type");
  const className = optionalString(record, "class") ?? typeName;
  const baseObject = createMapObject({
    name,
    shape,
    x: optionalNumber(record, "x") ?? 0,
    y: optionalNumber(record, "y") ?? 0,
    width: optionalNumber(record, "width") ?? 0,
    height: optionalNumber(record, "height") ?? 0,
    rotation: optionalNumber(record, "rotation") ?? 0,
    visible: optionalBoolean(record, "visible") ?? true,
    properties: parseProperties(record, issues, path),
    ...(className ? { className } : {})
  });

  if (shape === "tile") {
    const rawGid = optionalNumber(record, "gid") ?? 0;
    const tileCell = decodeTileGid(rawGid, issues, `${path}.gid`);

    return {
      object: {
        ...baseObject,
        tile: {
          ...(tileCell.gid !== null ? { gid: tileCell.gid } : {})
        }
      },
      ...(rawId !== undefined ? { rawId } : {})
    };
  }

  if (shape === "polygon" || shape === "polyline") {
    const points = parsePoints(record[shape], `${path}.${shape}`);

    return {
      object: {
        ...baseObject,
        points
      },
      ...(rawId !== undefined ? { rawId } : {})
    };
  }

  if (shape === "text") {
    const text = parseTextObjectData(record.text, `${path}.text`);

    return {
      object: {
        ...baseObject,
        text
      },
      ...(rawId !== undefined ? { rawId } : {})
    };
  }

  return {
    object: baseObject,
    ...(rawId !== undefined ? { rawId } : {})
  };
}

function parseLayerDefinition(
  value: unknown,
  mapDefaults: {
    width: number;
    height: number;
    infinite: boolean;
  },
  issues: TmjImportIssue[],
  path: string
): { layer: LayerDefinition; maxObjectId: number } {
  const record = requireRecord(value, path);
  const type = requireString(record, "type", path);
  const baseLayer = buildBaseLayerInput(record, issues, path);

  if (type === "tilelayer") {
    const infinite = optionalBoolean(record, "infinite") ?? mapDefaults.infinite;
    const width = infinite ? 0 : optionalNumber(record, "width") ?? mapDefaults.width;
    const height = infinite ? 0 : optionalNumber(record, "height") ?? mapDefaults.height;
    const layer = createTileLayer({
      ...baseLayer,
      width,
      height,
      infinite
    });

    return {
      maxObjectId: 0,
      layer: {
        ...layer,
        cells: infinite ? [] : parseTileDataArray(record.data, issues, `${path}.data`),
        chunks: Array.isArray(record.chunks)
          ? record.chunks.map((chunk, index) =>
              parseTileChunk(chunk, issues, `${path}.chunks[${index}]`)
            )
          : []
      }
    };
  }

  if (type === "objectgroup") {
    const rawObjects = Array.isArray(record.objects) ? record.objects : [];
    const parsedObjects = rawObjects.map((entry, index) =>
      parseMapObject(entry, issues, `${path}.objects[${index}]`)
    );

    return {
      maxObjectId: parsedObjects.reduce((maxId, entry) => Math.max(maxId, entry.rawId ?? 0), 0),
      layer: createObjectLayer({
        ...baseLayer,
        drawOrder:
          optionalString(record, "draworder") === "index" ? "index" : "topdown",
        objects: parsedObjects.map((entry) => entry.object)
      })
    };
  }

  if (type === "imagelayer") {
    const imageWidth = optionalNumber(record, "imagewidth");
    const imageHeight = optionalNumber(record, "imageheight");
    const transparentColor = optionalString(record, "transparentcolor");

    return {
      maxObjectId: 0,
      layer: createImageLayer({
        ...baseLayer,
        imagePath: optionalString(record, "image") ?? "",
        repeatX: optionalBoolean(record, "repeatx") ?? false,
        repeatY: optionalBoolean(record, "repeaty") ?? false,
        ...(imageWidth !== undefined ? { imageWidth } : {}),
        ...(imageHeight !== undefined ? { imageHeight } : {}),
        ...(transparentColor !== undefined ? { transparentColor } : {})
      })
    };
  }

  if (type === "group") {
    const rawLayers = Array.isArray(record.layers) ? record.layers : [];
    const parsedLayers = rawLayers.map((entry, index) =>
      parseLayerDefinition(entry, mapDefaults, issues, `${path}.layers[${index}]`)
    );

    return {
      maxObjectId: parsedLayers.reduce((maxId, entry) => Math.max(maxId, entry.maxObjectId), 0),
      layer: createGroupLayer({
        ...baseLayer,
        layers: parsedLayers.map((entry) => entry.layer)
      })
    };
  }

  appendIssue(
    issues,
    `${path}.type`,
    "tmj.layer.kindUnsupported",
    `Layer type \`${type}\` is not supported and was skipped.`
  );

  return {
    maxObjectId: 0,
    layer: createGroupLayer({
      ...baseLayer,
      layers: []
    })
  };
}

function parseTilesetReference(value: unknown, path: string): ImportedTmjTilesetReference {
  const record = requireRecord(value, path);
  const source = optionalString(record, "source");
  const name = optionalString(record, "name");
  const tileCount = optionalNumber(record, "tilecount");
  const image = optionalString(record, "image");

  return {
    firstGid: requireNumber(record, "firstgid", path),
    ...(source !== undefined ? { source } : {}),
    ...(name !== undefined ? { name } : {}),
    ...(tileCount !== undefined ? { tileCount } : {}),
    ...(image !== undefined ? { image } : {})
  };
}

export function importTmjMapDocument(input: string | unknown): ImportedTmjMapDocument {
  const source = typeof input === "string" ? JSON.parse(input) : input;
  const document = requireRecord(source, "tmj");
  const issues: TmjImportIssue[] = [];
  const orientation = requireString(document, "orientation", "tmj");
  const width = requireNumber(document, "width", "tmj");
  const height = requireNumber(document, "height", "tmj");
  const tileWidth = requireNumber(document, "tilewidth", "tmj");
  const tileHeight = requireNumber(document, "tileheight", "tmj");
  const infinite = optionalBoolean(document, "infinite") ?? false;
  const rawLayers = Array.isArray(document.layers) ? document.layers : [];
  const parsedLayers = rawLayers.map((layer, index) =>
    parseLayerDefinition(layer, { width, height, infinite }, issues, `tmj.layers[${index}]`)
  );
  const hexSideLength = optionalNumber(document, "hexsidelength");
  const staggerAxis = optionalString(document, "staggeraxis");
  const staggerIndex = optionalString(document, "staggerindex");
  const backgroundColor = optionalString(document, "backgroundcolor");
  const map = createMap({
    name: optionalString(document, "name") ?? "",
    orientation:
      orientation === "orthogonal" ||
      orientation === "isometric" ||
      orientation === "staggered" ||
      orientation === "hexagonal"
        ? orientation
        : "orthogonal",
    width,
    height,
    tileWidth,
    tileHeight,
    infinite,
    renderOrder:
      optionalString(document, "renderorder") === "right-up" ||
      optionalString(document, "renderorder") === "left-down" ||
      optionalString(document, "renderorder") === "left-up"
        ? (optionalString(document, "renderorder") as EditorMap["settings"]["renderOrder"])
        : "right-down",
    compressionLevel: optionalNumber(document, "compressionlevel") ?? -1,
    parallaxOriginX: optionalNumber(document, "parallaxoriginx") ?? 0,
    parallaxOriginY: optionalNumber(document, "parallaxoriginy") ?? 0,
    properties: parseProperties(document, issues, "tmj"),
    layers: parsedLayers.map((entry) => entry.layer),
    ...(hexSideLength !== undefined ? { hexSideLength } : {}),
    ...(staggerAxis === "x" || staggerAxis === "y" ? { staggerAxis } : {}),
    ...(staggerIndex === "odd" || staggerIndex === "even" ? { staggerIndex } : {}),
    ...(backgroundColor !== undefined ? { backgroundColor } : {})
  });
  const tilesetReferences = Array.isArray(document.tilesets)
    ? document.tilesets.map((tileset, index) =>
        parseTilesetReference(tileset, `tmj.tilesets[${index}]`)
      )
    : [];
  const maxObjectId = parsedLayers.reduce((maxId, entry) => Math.max(maxId, entry.maxObjectId), 0);

  if (orientation === "oblique") {
    appendIssue(
      issues,
      "tmj.orientation",
      "tmj.orientation.obliqueNormalized",
      "Oblique orientation is normalized to the current domain orientation support."
    );
  }

  return {
    map: {
      ...map,
      nextObjectId: Math.max(map.nextObjectId, maxObjectId + 1)
    },
    tilesetReferences,
    issues
  };
}
