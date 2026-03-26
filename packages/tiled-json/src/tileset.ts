import {
  createAssetReference,
  type AssetReferenceDescriptor,
  type AssetReferenceResolveOptions
} from "@pixel-editor/asset-reference";
import {
  createMapObject,
  createObjectLayer,
  createProperty,
  createTileDefinition,
  createTileset,
  createWangSetDefinition,
  getTilesetTileCount,
  type BlendMode,
  type MapObject,
  type ObjectId,
  type ObjectLayer,
  type ObjectShape,
  type PropertyDefinition,
  type PropertyTypeName,
  type PropertyValue,
  type TileAnimationFrame,
  type TileDefinition,
  type TilesetDefinition,
  type TilesetFillMode,
  type TilesetObjectAlignment,
  type TilesetTileRenderSize,
  type TilesetImageSource,
  type WangSetType
} from "@pixel-editor/domain";

import type {
  ExportTsjTilesetDocumentInput,
  ImportedTsjTilesetDocument,
  TiledJsonImportOptions,
  TmjJsonObject,
  TmjJsonValue,
  TsjImportIssue
} from "./types";
import {
  appendExternalAssetReferenceIssues,
  collectUnknownTsjFieldIssues
} from "./validation";

type JsonRecord = Record<string, unknown>;

const TSJ_FORMAT_VERSION = "1.11";

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
  issues: TsjImportIssue[],
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

function compareNumbers(left: number, right: number): number {
  return left - right;
}

function compareStrings(left: string, right: string): number {
  return left.localeCompare(right);
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

function isObjectAlignment(value: unknown): value is TilesetObjectAlignment {
  return (
    value === "unspecified" ||
    value === "topleft" ||
    value === "top" ||
    value === "topright" ||
    value === "left" ||
    value === "center" ||
    value === "right" ||
    value === "bottomleft" ||
    value === "bottom" ||
    value === "bottomright"
  );
}

function isTileRenderSize(value: unknown): value is TilesetTileRenderSize {
  return value === "tile" || value === "grid";
}

function isTilesetFillMode(value: unknown): value is TilesetFillMode {
  return value === "stretch" || value === "preserve-aspect-fit";
}

function isWangSetType(value: unknown): value is WangSetType {
  return value === "corner" || value === "edge" || value === "mixed";
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
  issues: TsjImportIssue[],
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
      "tsj.property.objectReferenceUnsupported",
      `Object property \`${name}\` uses unresolved TSJ object ids and is currently imported as null.`
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
  issues: TsjImportIssue[],
  path: string
): PropertyDefinition[] {
  const rawProperties = record.properties;

  if (rawProperties === undefined) {
    return [];
  }

  if (!Array.isArray(rawProperties)) {
    appendIssue(issues, `${path}.properties`, "tsj.properties.invalid", "Properties must be an array.");
    return [];
  }

  return rawProperties.flatMap((property, index) => {
    const parsed = parsePropertyDefinition(property, issues, `${path}.properties[${index}]`);
    return parsed ? [parsed] : [];
  });
}

function collectFilePropertyReferences(
  record: JsonRecord,
  path: string,
  options: AssetReferenceResolveOptions,
  assetReferences: AssetReferenceDescriptor[]
): void {
  const rawProperties = record.properties;

  if (!Array.isArray(rawProperties)) {
    return;
  }

  rawProperties.forEach((property, index) => {
    if (!isRecord(property) || optionalString(property, "type") !== "file") {
      return;
    }

    const rawValue = optionalString(property, "value")?.trim();

    if (!rawValue) {
      return;
    }

    assetReferences.push(
      createAssetReference(
        "property-file",
        `${path}.properties[${index}].value`,
        rawValue,
        options
      )
    );
  });
}

function collectCollisionObjectAssetReferences(
  record: JsonRecord,
  issues: TsjImportIssue[],
  path: string,
  options: AssetReferenceResolveOptions,
  assetReferences: AssetReferenceDescriptor[]
): void {
  const templatePath = optionalString(record, "template")?.trim();

  if (templatePath) {
    assetReferences.push(
      createAssetReference("template", `${path}.template`, templatePath, options)
    );
    appendIssue(
      issues,
      path,
      "tsj.object.templateUnsupported",
      `Template-backed object \`${optionalString(record, "name") ?? ""}\` keeps only inline attributes during TSJ import.`
    );
  }

  collectFilePropertyReferences(record, path, options, assetReferences);
}

function collectTsjAssetReferences(
  document: JsonRecord,
  issues: TsjImportIssue[],
  options: AssetReferenceResolveOptions
): AssetReferenceDescriptor[] {
  const assetReferences: AssetReferenceDescriptor[] = [];

  collectFilePropertyReferences(document, "tsj", options, assetReferences);

  const imagePath = optionalString(document, "image")?.trim();

  if (imagePath) {
    assetReferences.push(
      createAssetReference("image", "tsj.image", imagePath, options)
    );
  }

  const rawTiles = Array.isArray(document.tiles) ? document.tiles : [];

  rawTiles.forEach((entry, index) => {
    if (!isRecord(entry)) {
      return;
    }

    const tileImagePath = optionalString(entry, "image")?.trim();

    if (tileImagePath) {
      assetReferences.push(
        createAssetReference(
          "image",
          `tsj.tiles[${index}].image`,
          tileImagePath,
          options
        )
      );
    }

    collectFilePropertyReferences(entry, `tsj.tiles[${index}]`, options, assetReferences);

    const objectGroup = isRecord(entry.objectgroup) ? entry.objectgroup : undefined;
    const rawObjects = objectGroup && Array.isArray(objectGroup.objects) ? objectGroup.objects : [];

    rawObjects.forEach((objectEntry, objectIndex) => {
      if (!isRecord(objectEntry)) {
        return;
      }

      collectCollisionObjectAssetReferences(
        objectEntry,
        issues,
        `tsj.tiles[${index}].objectgroup.objects[${objectIndex}]`,
        options,
        assetReferences
      );
    });
  });

  return assetReferences;
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

  if (record.capsule === true) {
    return "capsule";
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

function buildBaseLayerInput(
  record: JsonRecord,
  issues: TsjImportIssue[],
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
      `${path}.mode`,
      "tsj.layer.blendModeUnsupported",
      `Blend mode \`${rawBlendMode}\` is not supported and was normalized to \`normal\`.`
    );
  }

  const className = optionalString(record, "class");
  const tintColor = optionalString(record, "tintcolor");

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
    ...(tintColor !== undefined ? { tintColor } : {}),
    ...(className !== undefined ? { className } : {})
  };
}

function parseMapObject(
  value: unknown,
  issues: TsjImportIssue[],
  path: string
): { object: MapObject; rawId?: number } {
  const record = requireRecord(value, path);
  const shape = parseObjectShape(record);
  const rawId = optionalNumber(record, "id");
  const className = optionalString(record, "class") ?? optionalString(record, "type");
  const object = createMapObject({
    name: optionalString(record, "name") ?? "",
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
    const gid = optionalNumber(record, "gid");

    return {
      object: {
        ...object,
        ...(gid !== undefined ? { tile: { gid } } : {})
      },
      ...(rawId !== undefined ? { rawId } : {})
    };
  }

  if (shape === "polygon" || shape === "polyline") {
    return {
      object: {
        ...object,
        points: parsePoints(record[shape], `${path}.${shape}`)
      },
      ...(rawId !== undefined ? { rawId } : {})
    };
  }

  if (shape === "text") {
    return {
      object: {
        ...object,
        text: parseTextObjectData(record.text, `${path}.text`)
      },
      ...(rawId !== undefined ? { rawId } : {})
    };
  }

  return {
    object,
    ...(rawId !== undefined ? { rawId } : {})
  };
}

function parseObjectGroup(
  value: unknown,
  issues: TsjImportIssue[],
  path: string
): { layer: ObjectLayer; maxObjectId: number } {
  const record = requireRecord(value, path);
  const rawObjects = Array.isArray(record.objects) ? record.objects : [];
  const parsedObjects = rawObjects.map((entry, index) =>
    parseMapObject(entry, issues, `${path}.objects[${index}]`)
  );

  return {
    maxObjectId: parsedObjects.reduce((maxId, entry) => Math.max(maxId, entry.rawId ?? 0), 0),
    layer: createObjectLayer({
      ...buildBaseLayerInput(record, issues, path),
      drawOrder: optionalString(record, "draworder") === "index" ? "index" : "topdown",
      objects: parsedObjects.map((entry) => entry.object)
    })
  };
}

function parseTileAnimation(
  value: unknown,
  issues: TsjImportIssue[],
  path: string
): TileAnimationFrame[] {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    appendIssue(
      issues,
      path,
      "tsj.tile.animationInvalid",
      "Tile animation must be an array."
    );
    return [];
  }

  return value.map((entry, index) => {
    const record = requireRecord(entry, `${path}[${index}]`);

    return {
      tileId: requireNumber(record, "tileid", `${path}[${index}]`),
      durationMs: requireNumber(record, "duration", `${path}[${index}]`)
    };
  });
}

function parseTileRecords(
  record: JsonRecord,
  issues: TsjImportIssue[],
  path: string
): Array<{
  localId: number;
  className?: string;
  probability?: number;
  properties: PropertyDefinition[];
  imageSource?: string;
  animation: TileAnimationFrame[];
  collisionLayer?: ObjectLayer;
}> {
  type ParsedTileRecord = {
    localId: number;
    className?: string;
    probability?: number;
    properties: PropertyDefinition[];
    imageSource?: string;
    animation: TileAnimationFrame[];
    collisionLayer?: ObjectLayer;
  };
  const rawTiles = record.tiles;

  if (rawTiles === undefined) {
    return [];
  }

  const normalizeTileEntry = (
    value: unknown,
    path: string,
    fallbackLocalId?: number
  ): ParsedTileRecord => {
    const tileRecord = requireRecord(value, path);
    const localId = optionalNumber(tileRecord, "id") ?? fallbackLocalId;

    if (localId === undefined) {
      throw new Error(`${path}.id must be a number`);
    }

    const className = optionalString(tileRecord, "class") ?? optionalString(tileRecord, "type");
    const objectGroup = tileRecord.objectgroup;
    const parsedCollision = objectGroup
      ? parseObjectGroup(objectGroup, issues, `${path}.objectgroup`)
      : undefined;
    const probability = optionalNumber(tileRecord, "probability");
    const imageSource = optionalString(tileRecord, "image");
    const nextRecord: ParsedTileRecord = {
      localId,
      properties: parseProperties(tileRecord, issues, path),
      animation: parseTileAnimation(tileRecord.animation, issues, `${path}.animation`)
    };

    if (className !== undefined) {
      nextRecord.className = className;
    }

    if (probability !== undefined) {
      nextRecord.probability = probability;
    }

    if (imageSource !== undefined) {
      nextRecord.imageSource = imageSource;
    }

    if (parsedCollision && parsedCollision.layer.objects.length > 0) {
      nextRecord.collisionLayer = parsedCollision.layer;
    }

    return nextRecord;
  };

  if (Array.isArray(rawTiles)) {
    return rawTiles.map((entry, index) =>
      normalizeTileEntry(entry, `${path}.tiles[${index}]`)
    );
  }

  if (isRecord(rawTiles)) {
    return Object.entries(rawTiles)
      .sort(([left], [right]) => compareNumbers(Number(left), Number(right)))
      .map(([localId, entry]) =>
        normalizeTileEntry(entry, `${path}.tiles.${localId}`, Number(localId))
      );
  }

  appendIssue(issues, `${path}.tiles`, "tsj.tiles.invalid", "Tiles must be an array or object map.");
  return [];
}

function computeImageTileCount(input: {
  tileWidth: number;
  tileHeight: number;
  imageWidth?: number;
  imageHeight?: number;
  margin: number;
  spacing: number;
  columns?: number;
}): number {
  if (input.imageWidth === undefined || input.imageHeight === undefined) {
    return 0;
  }

  const availableWidth = input.imageWidth - input.margin * 2 + input.spacing;
  const availableHeight = input.imageHeight - input.margin * 2 + input.spacing;
  const computedColumns =
    input.columns ??
    Math.floor(availableWidth / Math.max(1, input.tileWidth + input.spacing));
  const computedRows = Math.floor(
    availableHeight / Math.max(1, input.tileHeight + input.spacing)
  );

  if (computedColumns <= 0 || computedRows <= 0) {
    return 0;
  }

  return computedColumns * computedRows;
}

function createTiles(
  tileCount: number,
  parsedTiles: ReturnType<typeof parseTileRecords>
): TileDefinition[] {
  const parsedByLocalId = new Map(parsedTiles.map((tile) => [tile.localId, tile]));

  return Array.from({ length: tileCount }, (_, localId) => {
    const parsed = parsedByLocalId.get(localId);

    return {
      ...createTileDefinition(localId),
      ...(parsed?.className !== undefined ? { className: parsed.className } : {}),
      ...(parsed?.probability !== undefined ? { probability: parsed.probability } : {}),
      ...(parsed?.imageSource !== undefined ? { imageSource: parsed.imageSource } : {}),
      properties: parsed?.properties ?? [],
      animation: parsed?.animation ?? [],
      ...(parsed?.collisionLayer !== undefined ? { collisionLayer: parsed.collisionLayer } : {})
    };
  });
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
  options: Pick<ExportTsjTilesetDocumentInput, "resolveObjectTypesAndProperties">
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

      return {
        name: property.name,
        type,
        value: serializePropertyValue(property.value, objectIds),
        ...(property.propertyTypeName !== undefined &&
        !options.resolveObjectTypesAndProperties
          ? { propertytype: property.propertyTypeName }
          : {})
      };
    });
}

function collectObjectIds(objects: readonly MapObject[]): Map<ObjectId, number> {
  return new Map(objects.map((object, index) => [object.id, index + 1]));
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
  options: Pick<ExportTsjTilesetDocumentInput, "resolveObjectTypesAndProperties">
): TmjJsonObject {
  const properties = serializeProperties(object.properties, objectIds, options);
  const document: TmjJsonObject = {
    ...(properties ? { properties } : {}),
    id: objectIds.get(object.id) ?? 0,
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
    document.polygon = object.points.map((point) => ({ x: point.x, y: point.y }));
  } else if (object.shape === "polyline" && object.points) {
    document.polyline = object.points.map((point) => ({ x: point.x, y: point.y }));
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

function serializeObjectLayer(layer: ObjectLayer): TmjJsonObject {
  return serializeObjectLayerWithOptions(layer, {
    resolveObjectTypesAndProperties: false
  });
}

function serializeObjectLayerWithOptions(
  layer: ObjectLayer,
  options: Pick<ExportTsjTilesetDocumentInput, "resolveObjectTypesAndProperties">
): TmjJsonObject {
  const objectIds = collectObjectIds(layer.objects);
  const properties = serializeProperties(layer.properties, objectIds, options);

  return {
    type: "objectgroup",
    name: layer.name,
    ...(layer.className !== undefined ? { class: layer.className } : {}),
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
    ...(properties ? { properties } : {}),
    draworder: layer.drawOrder,
    objects: layer.objects.map((object) => serializeMapObject(object, objectIds, options))
  };
}

function shouldExportTile(
  tile: TileDefinition,
  kind: TilesetDefinition["kind"],
  options: Pick<ExportTsjTilesetDocumentInput, "resolveObjectTypesAndProperties">
): boolean {
  return (
    kind === "image-collection" ||
    (tile.className !== undefined && !options.resolveObjectTypesAndProperties) ||
    tile.probability !== 1 ||
    tile.properties.length > 0 ||
    tile.animation.length > 0 ||
    tile.imageSource !== undefined ||
    (tile.collisionLayer?.objects.length ?? 0) > 0
  );
}

function computeExportColumns(tileset: TilesetDefinition): number {
  if (tileset.kind !== "image" || !tileset.source) {
    return 0;
  }

  if (tileset.source.columns !== undefined) {
    return tileset.source.columns;
  }

  if (
    tileset.source.imageWidth === undefined ||
    tileset.source.imageHeight === undefined
  ) {
    return 0;
  }

  const availableWidth =
    tileset.source.imageWidth - tileset.source.margin * 2 + tileset.source.spacing;

  return Math.max(
    0,
    Math.floor(availableWidth / Math.max(1, tileset.tileWidth + tileset.source.spacing))
  );
}

export function importTsjTilesetDocument(
  input: string | unknown,
  options: TiledJsonImportOptions = {}
): ImportedTsjTilesetDocument {
  const source = typeof input === "string" ? JSON.parse(input) : input;
  const document = requireRecord(source, "tsj");
  const issues: TsjImportIssue[] = [];
  const name = requireString(document, "name", "tsj");
  const tileWidth = requireNumber(document, "tilewidth", "tsj");
  const tileHeight = requireNumber(document, "tileheight", "tsj");
  const imagePath = optionalString(document, "image");
  const margin = optionalNumber(document, "margin") ?? 0;
  const spacing = optionalNumber(document, "spacing") ?? 0;
  const columns = optionalNumber(document, "columns");
  const imageWidth = optionalNumber(document, "imagewidth");
  const imageHeight = optionalNumber(document, "imageheight");
  const parsedTiles = parseTileRecords(document, issues, "tsj");
  const highestTileLocalId = parsedTiles.reduce(
    (maxLocalId, tile) => Math.max(maxLocalId, tile.localId),
    -1
  );
  const declaredTileCount = optionalNumber(document, "tilecount") ?? 0;
  const computedTileCount =
    imagePath !== undefined
      ? computeImageTileCount({
          tileWidth,
          tileHeight,
          margin,
          spacing,
          ...(imageWidth !== undefined ? { imageWidth } : {}),
          ...(imageHeight !== undefined ? { imageHeight } : {}),
          ...(columns !== undefined ? { columns } : {})
        })
      : 0;
  const tileCount = Math.max(declaredTileCount, computedTileCount, highestTileLocalId + 1);
  const sourceDefinition: TilesetImageSource | undefined =
    imagePath !== undefined
      ? {
          imagePath,
          margin,
          spacing,
          ...(imageWidth !== undefined ? { imageWidth } : {}),
          ...(imageHeight !== undefined ? { imageHeight } : {}),
          ...(columns !== undefined ? { columns } : {})
        }
      : undefined;
  const tileset = createTileset({
    name,
    kind: imagePath !== undefined ? "image" : "image-collection",
    tileWidth,
    tileHeight,
    ...(sourceDefinition !== undefined ? { source: sourceDefinition } : {})
  });
  const objectAlignment = optionalString(document, "objectalignment");
  const tileRenderSize = optionalString(document, "tilerendersize");
  const fillMode = optionalString(document, "fillmode");
  const tileOffset = isRecord(document.tileoffset) ? document.tileoffset : undefined;
  const wangSets = Array.isArray(document.wangsets) ? document.wangsets : [];
  const assetReferences = collectTsjAssetReferences(document, issues, options);

  if (optionalString(document, "class") !== undefined) {
    appendIssue(
      issues,
      "tsj.class",
      "tsj.tileset.classUnsupported",
      "Tileset class is not represented by the current domain model."
    );
  }

  if (optionalString(document, "backgroundcolor") !== undefined) {
    appendIssue(
      issues,
      "tsj.backgroundcolor",
      "tsj.tileset.backgroundColorUnsupported",
      "Tileset background color is not represented by the current domain model."
    );
  }

  if (isRecord(document.transformations)) {
    appendIssue(
      issues,
      "tsj.transformations",
      "tsj.tileset.transformationsUnsupported",
      "Tileset transformation flags are not represented by the current domain model."
    );
  }

  if (isRecord(document.grid)) {
    appendIssue(
      issues,
      "tsj.grid",
      "tsj.tileset.gridUnsupported",
      "Tileset grid settings are not represented by the current domain model."
    );
  }

  const nextTileset: TilesetDefinition = {
    ...tileset,
    tileOffsetX: tileOffset ? optionalNumber(tileOffset, "x") ?? 0 : 0,
    tileOffsetY: tileOffset ? optionalNumber(tileOffset, "y") ?? 0 : 0,
    objectAlignment: isObjectAlignment(objectAlignment) ? objectAlignment : "unspecified",
    tileRenderSize: isTileRenderSize(tileRenderSize) ? tileRenderSize : "tile",
    fillMode: isTilesetFillMode(fillMode) ? fillMode : "stretch",
    properties: parseProperties(document, issues, "tsj"),
    tiles: createTiles(tileCount, parsedTiles),
    wangSets: wangSets.flatMap((entry, index) => {
      const wangSet = requireRecord(entry, `tsj.wangsets[${index}]`);
      const wangSetType = optionalString(wangSet, "type");

      if (!isWangSetType(wangSetType)) {
        appendIssue(
          issues,
          `tsj.wangsets[${index}].type`,
          "tsj.wangSet.typeUnsupported",
          "Unsupported Wang set type was skipped."
        );
        return [];
      }

      if (Array.isArray(wangSet.colors) && wangSet.colors.length > 0) {
        appendIssue(
          issues,
          `tsj.wangsets[${index}].colors`,
          "tsj.wangSet.colorsUnsupported",
          "Wang set colors are not represented by the current domain model."
        );
      }

      if (Array.isArray(wangSet.wangtiles) && wangSet.wangtiles.length > 0) {
        appendIssue(
          issues,
          `tsj.wangsets[${index}].wangtiles`,
          "tsj.wangSet.tilesUnsupported",
          "Wang tile assignments are not represented by the current domain model."
        );
      }

      return [
        createWangSetDefinition({
          name: optionalString(wangSet, "name") ?? `Wang Set ${index + 1}`,
          type: wangSetType
        })
      ];
    })
  };

  collectUnknownTsjFieldIssues(document, issues);
  appendExternalAssetReferenceIssues("tsj", assetReferences, issues);

  return {
    tileset: nextTileset,
    assetReferences,
    issues
  };
}

export function exportTsjTilesetDocument(input: ExportTsjTilesetDocumentInput): TmjJsonObject {
  const { tileset } = input;
  const serializeOptions = {
    resolveObjectTypesAndProperties: input.resolveObjectTypesAndProperties ?? false
  };
  const properties = serializeProperties(
    tileset.properties,
    new Map<ObjectId, number>(),
    serializeOptions
  );
  const tiles = tileset.tiles
    .filter((tile) => shouldExportTile(tile, tileset.kind, serializeOptions))
    .sort((left, right) => compareNumbers(left.localId, right.localId))
    .map((tile) => {
      const propertyValues = serializeProperties(
        tile.properties,
        tile.collisionLayer ? collectObjectIds(tile.collisionLayer.objects) : new Map(),
        serializeOptions
      );

      return {
        id: tile.localId,
        ...(tile.className !== undefined && !serializeOptions.resolveObjectTypesAndProperties
          ? { type: tile.className }
          : {}),
        ...(tile.probability !== 1 ? { probability: tile.probability } : {}),
        ...(propertyValues ? { properties: propertyValues } : {}),
        ...(tile.imageSource !== undefined ? { image: tile.imageSource } : {}),
        ...(tile.animation.length > 0
          ? {
              animation: tile.animation.map((frame) => ({
                tileid: frame.tileId,
                duration: frame.durationMs
              }))
            }
          : {}),
        ...(tile.collisionLayer && tile.collisionLayer.objects.length > 0
          ? { objectgroup: serializeObjectLayerWithOptions(tile.collisionLayer, serializeOptions) }
          : {})
      };
    });

  return {
    type: "tileset",
    version: input.formatVersion ?? TSJ_FORMAT_VERSION,
    tiledversion: input.tiledVersion ?? TSJ_FORMAT_VERSION,
    name: tileset.name,
    tilewidth: tileset.tileWidth,
    tileheight: tileset.tileHeight,
    spacing: tileset.kind === "image" && tileset.source ? tileset.source.spacing : 0,
    margin: tileset.kind === "image" && tileset.source ? tileset.source.margin : 0,
    tilecount: getTilesetTileCount(tileset),
    columns: tileset.kind === "image" ? computeExportColumns(tileset) : 0,
    ...(tileset.objectAlignment !== "unspecified"
      ? { objectalignment: tileset.objectAlignment }
      : {}),
    ...(tileset.tileRenderSize !== "tile" ? { tilerendersize: tileset.tileRenderSize } : {}),
    ...(tileset.fillMode !== "stretch" ? { fillmode: tileset.fillMode } : {}),
    ...(properties ? { properties } : {}),
    ...((tileset.tileOffsetX !== 0 || tileset.tileOffsetY !== 0)
      ? {
          tileoffset: {
            x: tileset.tileOffsetX,
            y: tileset.tileOffsetY
          }
        }
      : {}),
    ...(tileset.kind === "image" && tileset.source
      ? {
          image: tileset.source.imagePath,
          ...(tileset.source.imageWidth !== undefined
            ? { imagewidth: tileset.source.imageWidth }
            : {}),
          ...(tileset.source.imageHeight !== undefined
            ? { imageheight: tileset.source.imageHeight }
            : {})
        }
      : {}),
    ...(tiles.length > 0 ? { tiles } : {}),
    ...(tileset.wangSets.length > 0
      ? {
          wangsets: tileset.wangSets.map((wangSet) => ({
            name: wangSet.name,
            type: wangSet.type,
            colors: [],
            wangtiles: []
          }))
        }
      : {})
  };
}

export function stringifyTsjTilesetDocument(
  input: ExportTsjTilesetDocumentInput,
  space = input.minimized ? 0 : 2
): string {
  return JSON.stringify(exportTsjTilesetDocument(input), null, space);
}
