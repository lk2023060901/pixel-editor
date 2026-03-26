import {
  createAssetReference,
  normalizeAssetPath,
  type AssetReferenceDescriptor,
  type AssetReferenceResolveOptions
} from "@pixel-editor/asset-reference";
import {
  createProperty,
  createWorld,
  type PropertyDefinition,
  type PropertyTypeName,
  type PropertyValue,
  type WorldMapReference,
  type WorldPatternReference
} from "@pixel-editor/domain";

import type {
  ExportTiledWorldDocumentInput,
  ImportedTiledWorldDocument,
  TiledWorldImportIssue,
  TiledWorldImportOptions,
  TiledWorldJsonObject,
  TiledWorldJsonValue
} from "./types";

export * from "./types";

type JsonRecord = Record<string, unknown>;

const WORLD_EXTENSION = ".world";
const DEFAULT_WORLD_NAME = "world";
const WORLD_KEYS = new Set([
  "maps",
  "patterns",
  "properties",
  "type",
  "onlyShowAdjacentMaps"
]);
const WORLD_MAP_KEYS = new Set(["fileName", "x", "y", "width", "height"]);
const WORLD_PATTERN_KEYS = new Set([
  "regexp",
  "multiplierX",
  "multiplierY",
  "offsetX",
  "offsetY",
  "mapWidth",
  "mapHeight"
]);
const PROPERTY_KEYS = new Set(["name", "type", "propertytype", "value"]);

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
  issues: TiledWorldImportIssue[],
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

function collectUnknownFieldIssues(
  record: JsonRecord,
  knownKeys: ReadonlySet<string>,
  path: string,
  issues: TiledWorldImportIssue[]
): void {
  for (const key of Object.keys(record)) {
    if (knownKeys.has(key)) {
      continue;
    }

    appendIssue(
      issues,
      `${path}.${key}`,
      "world.field.unknown",
      `Unknown world field \`${key}\` was ignored.`
    );
  }
}

function appendExternalAssetReferenceIssues(
  assetReferences: readonly AssetReferenceDescriptor[],
  issues: TiledWorldImportIssue[]
): void {
  assetReferences
    .filter((reference) => reference.externalToProject)
    .forEach((reference) => {
      appendIssue(
        issues,
        reference.ownerPath,
        "world.asset.externalReference",
        `External WORLD ${reference.kind} reference \`${reference.originalPath}\` is outside known project asset roots.`
      );
    });
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
  issues: TiledWorldImportIssue[],
  path: string
): PropertyDefinition | undefined {
  const record = requireRecord(value, path);
  collectUnknownFieldIssues(record, PROPERTY_KEYS, path, issues);
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
      "world.property.objectReferenceUnsupported",
      `Object property \`${name}\` uses unresolved world object ids and is currently imported as null.`
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
      (inferredType === "bool"
        ? false
        : inferredType === "int" || inferredType === "float"
          ? 0
          : ""),
    propertyTypeName
  );
}

function parseProperties(
  record: JsonRecord,
  issues: TiledWorldImportIssue[],
  path: string
): PropertyDefinition[] {
  const rawProperties = record.properties;

  if (rawProperties === undefined) {
    return [];
  }

  if (!Array.isArray(rawProperties)) {
    appendIssue(
      issues,
      `${path}.properties`,
      "world.properties.invalid",
      "World properties must be an array."
    );
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
  const rawProperties = Array.isArray(record.properties) ? record.properties : [];

  rawProperties.forEach((entry, index) => {
    if (!isRecord(entry)) {
      return;
    }

    const rawType = optionalString(entry, "type");

    if (rawType !== "file") {
      return;
    }

    const rawValue = optionalString(entry, "value")?.trim();

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

function countCapturingGroups(pattern: string): number {
  let count = 0;
  let escaped = false;
  let inCharClass = false;

  for (let index = 0; index < pattern.length; index += 1) {
    const character = pattern[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (character === "\\") {
      escaped = true;
      continue;
    }

    if (character === "[" && !inCharClass) {
      inCharClass = true;
      continue;
    }

    if (character === "]" && inCharClass) {
      inCharClass = false;
      continue;
    }

    if (inCharClass || character !== "(") {
      continue;
    }

    const nextCharacter = pattern[index + 1];

    if (nextCharacter !== "?") {
      count += 1;
      continue;
    }

    const afterQuestion = pattern[index + 2];

    if (
      afterQuestion === ":" ||
      afterQuestion === "=" ||
      afterQuestion === "!" ||
      (afterQuestion === "<" &&
        (pattern[index + 3] === "=" || pattern[index + 3] === "!"))
    ) {
      continue;
    }

    count += 1;
  }

  return count;
}

function parseWorldMaps(
  document: JsonRecord,
  issues: TiledWorldImportIssue[],
  options: TiledWorldImportOptions,
  assetReferences: AssetReferenceDescriptor[]
): WorldMapReference[] {
  const rawMaps = document.maps;

  if (rawMaps === undefined) {
    return [];
  }

  if (!Array.isArray(rawMaps)) {
    appendIssue(issues, "world.maps", "world.maps.invalid", "World maps must be an array.");
    return [];
  }

  return rawMaps.map((entry, index) => {
    const path = `world.maps[${index}]`;
    const record = requireRecord(entry, path);
    collectUnknownFieldIssues(record, WORLD_MAP_KEYS, path, issues);
    const fileName = requireString(record, "fileName", path).trim();
    const reference = createAssetReference("map", `${path}.fileName`, fileName, options);
    const width = optionalNumber(record, "width");
    const height = optionalNumber(record, "height");

    assetReferences.push(reference);

    return {
      fileName: reference.resolvedPath || normalizeAssetPath(fileName),
      x: optionalNumber(record, "x") ?? 0,
      y: optionalNumber(record, "y") ?? 0,
      ...(width !== undefined ? { width } : {}),
      ...(height !== undefined ? { height } : {})
    };
  });
}

function parseWorldPatterns(
  document: JsonRecord,
  issues: TiledWorldImportIssue[]
): WorldPatternReference[] {
  const rawPatterns = document.patterns;

  if (rawPatterns === undefined) {
    return [];
  }

  if (!Array.isArray(rawPatterns)) {
    appendIssue(
      issues,
      "world.patterns",
      "world.patterns.invalid",
      "World patterns must be an array."
    );
    return [];
  }

  return rawPatterns.flatMap((entry, index) => {
    const path = `world.patterns[${index}]`;
    const record = requireRecord(entry, path);
    collectUnknownFieldIssues(record, WORLD_PATTERN_KEYS, path, issues);
    const regexp = requireString(record, "regexp", path);
    const multiplierX = optionalNumber(record, "multiplierX") ?? 1;
    const multiplierY = optionalNumber(record, "multiplierY") ?? 1;
    const offsetX = optionalNumber(record, "offsetX") ?? 0;
    const offsetY = optionalNumber(record, "offsetY") ?? 0;
    const mapWidth = optionalNumber(record, "mapWidth") ?? Math.abs(multiplierX);
    const mapHeight = optionalNumber(record, "mapHeight") ?? Math.abs(multiplierY);

    try {
      new RegExp(regexp);
    } catch {
      appendIssue(
        issues,
        `${path}.regexp`,
        "world.pattern.regexp.invalid",
        `Invalid world regexp \`${regexp}\` was ignored.`
      );
      return [];
    }

    if (countCapturingGroups(regexp) !== 2) {
      appendIssue(
        issues,
        `${path}.regexp`,
        "world.pattern.captureCount.invalid",
        `World pattern \`${regexp}\` must define exactly two capturing groups.`
      );
      return [];
    }

    if (multiplierX === 0) {
      appendIssue(
        issues,
        `${path}.multiplierX`,
        "world.pattern.multiplierX.invalid",
        "World pattern multiplierX must not be zero."
      );
      return [];
    }

    if (multiplierY === 0) {
      appendIssue(
        issues,
        `${path}.multiplierY`,
        "world.pattern.multiplierY.invalid",
        "World pattern multiplierY must not be zero."
      );
      return [];
    }

    if (mapWidth <= 0) {
      appendIssue(
        issues,
        `${path}.mapWidth`,
        "world.pattern.mapWidth.invalid",
        "World pattern mapWidth must be greater than zero."
      );
      return [];
    }

    if (mapHeight <= 0) {
      appendIssue(
        issues,
        `${path}.mapHeight`,
        "world.pattern.mapHeight.invalid",
        "World pattern mapHeight must be greater than zero."
      );
      return [];
    }

    return [
      {
        regexp,
        multiplierX,
        multiplierY,
        offsetX,
        offsetY,
        mapWidth,
        mapHeight
      }
    ];
  });
}

function deriveWorldName(documentPath: string | undefined): string {
  const normalizedPath = documentPath ? normalizeAssetPath(documentPath) : "";
  const fileName = normalizedPath.split("/").at(-1) ?? "";

  if (fileName.toLowerCase().endsWith(WORLD_EXTENSION)) {
    return fileName.slice(0, -WORLD_EXTENSION.length) || DEFAULT_WORLD_NAME;
  }

  return fileName || DEFAULT_WORLD_NAME;
}

function compareStrings(left: string, right: string): number {
  return left.localeCompare(right);
}

function isObjectReferenceValue(
  value: PropertyValue
): value is Extract<PropertyValue, { objectId: string }> {
  return typeof value === "object" && value !== null && "objectId" in value;
}

function isClassPropertyValue(
  value: PropertyValue
): value is Extract<PropertyValue, { members: Record<string, PropertyValue> }> {
  return typeof value === "object" && value !== null && "members" in value;
}

function serializePropertyValue(value: PropertyValue): TiledWorldJsonValue {
  if (Array.isArray(value)) {
    return value.map((entry) => serializePropertyValue(entry));
  }

  if (isObjectReferenceValue(value)) {
    return 0;
  }

  if (isClassPropertyValue(value)) {
    return Object.fromEntries(
      Object.entries(value.members)
        .sort(([left], [right]) => compareStrings(left, right))
        .map(([key, memberValue]) => [key, serializePropertyValue(memberValue)])
    );
  }

  return value;
}

function serializeProperties(
  properties: readonly PropertyDefinition[]
): TiledWorldJsonObject[] | undefined {
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
        value: serializePropertyValue(property.value),
        ...(property.propertyTypeName !== undefined
          ? { propertytype: property.propertyTypeName }
          : {})
      };
    });
}

function relativePath(fromPath: string, toPath: string): string {
  const fromSegments = normalizeAssetPath(fromPath)
    .split("/")
    .filter((segment) => segment.length > 0)
    .slice(0, -1);
  const toSegments = normalizeAssetPath(toPath)
    .split("/")
    .filter((segment) => segment.length > 0);
  let sharedLength = 0;

  while (
    sharedLength < fromSegments.length &&
    sharedLength < toSegments.length &&
    fromSegments[sharedLength] === toSegments[sharedLength]
  ) {
    sharedLength += 1;
  }

  const upwardSegments = fromSegments.slice(sharedLength).map(() => "..");
  const downwardSegments = toSegments.slice(sharedLength);
  const relativeSegments = [...upwardSegments, ...downwardSegments];

  return relativeSegments.length > 0 ? relativeSegments.join("/") : ".";
}

function serializeMapReference(
  map: WorldMapReference,
  documentPath: string | undefined
): TiledWorldJsonObject {
  const normalizedFileName = normalizeAssetPath(map.fileName);

  return {
    fileName:
      documentPath !== undefined
        ? relativePath(documentPath, normalizedFileName)
        : normalizedFileName,
    x: map.x,
    y: map.y,
    ...(map.width !== undefined ? { width: map.width } : {}),
    ...(map.height !== undefined ? { height: map.height } : {})
  };
}

function serializePatternReference(pattern: WorldPatternReference): TiledWorldJsonObject {
  return {
    regexp: pattern.regexp,
    ...(pattern.multiplierX !== 1 ? { multiplierX: pattern.multiplierX } : {}),
    ...(pattern.multiplierY !== 1 ? { multiplierY: pattern.multiplierY } : {}),
    ...(pattern.offsetX !== 0 ? { offsetX: pattern.offsetX } : {}),
    ...(pattern.offsetY !== 0 ? { offsetY: pattern.offsetY } : {}),
    ...(pattern.mapWidth !== Math.abs(pattern.multiplierX)
      ? { mapWidth: pattern.mapWidth }
      : {}),
    ...(pattern.mapHeight !== Math.abs(pattern.multiplierY)
      ? { mapHeight: pattern.mapHeight }
      : {})
  };
}

export function importTiledWorldDocument(
  input: string | unknown,
  options: TiledWorldImportOptions = {}
): ImportedTiledWorldDocument {
  const document = requireRecord(
    typeof input === "string" ? JSON.parse(input) : input,
    "world"
  );
  const issues: TiledWorldImportIssue[] = [];
  const assetReferences: AssetReferenceDescriptor[] = [];

  collectUnknownFieldIssues(document, WORLD_KEYS, "world", issues);

  const type = optionalString(document, "type");

  if (type !== undefined && type !== "world") {
    appendIssue(
      issues,
      "world.type",
      "world.type.invalid",
      `Unsupported world document type \`${type}\` was imported as a world document.`
    );
  }

  const maps = parseWorldMaps(document, issues, options, assetReferences);
  const patterns = parseWorldPatterns(document, issues);
  const properties = parseProperties(document, issues, "world");

  collectFilePropertyReferences(document, "world", options, assetReferences);
  appendExternalAssetReferenceIssues(assetReferences, issues);

  if (maps.length === 0 && patterns.length === 0) {
    appendIssue(
      issues,
      "world",
      "world.empty",
      "World contained no valid maps or patterns."
    );
  }

  return {
    world: createWorld(
      deriveWorldName(options.documentPath),
      maps,
      properties,
      {
        patterns,
        onlyShowAdjacentMaps: optionalBoolean(document, "onlyShowAdjacentMaps") ?? false
      }
    ),
    assetReferences,
    issues
  };
}

export function exportTiledWorldDocument(
  input: ExportTiledWorldDocumentInput
): TiledWorldJsonObject {
  const maps = input.world.maps.map((map) =>
    serializeMapReference(map, input.documentPath)
  );
  const patterns = input.world.patterns.map((pattern) =>
    serializePatternReference(pattern)
  );
  const properties = serializeProperties(input.world.properties);

  return {
    ...(maps.length > 0 ? { maps } : {}),
    ...(patterns.length > 0 ? { patterns } : {}),
    ...(properties !== undefined ? { properties } : {}),
    type: "world",
    onlyShowAdjacentMaps: input.world.onlyShowAdjacentMaps
  };
}

export function stringifyTiledWorldDocument(
  input: ExportTiledWorldDocumentInput,
  space = 2
): string {
  return JSON.stringify(exportTiledWorldDocument(input), null, space);
}
