import {
  createAssetReference,
  normalizeAssetPath,
  type AssetReferenceDescriptor
} from "@pixel-editor/asset-reference";
import {
  createDefaultPropertyValue,
  createEntityId,
  createProject,
  type EditorProjectExportOptions,
  getClassPropertyTypeDefinitionByName,
  getEnumPropertyTypeDefinitionByName,
  type ClassPropertyFieldDefinition,
  type ClassPropertyTypeDefinition,
  type EnumPropertyTypeDefinition,
  type PropertyTypeDefinition,
  type PropertyTypeName,
  type PropertyTypeUseAs,
  type PropertyValue
} from "@pixel-editor/domain";

import type {
  ExportTiledProjectDocumentInput,
  ImportedTiledProjectDocument,
  TiledProjectImportIssue,
  TiledProjectImportOptions,
  TiledProjectJsonObject,
  TiledProjectJsonValue
} from "./types";

export * from "./types";

const TILED_PROJECT_EXTENSION = ".tiled-project";
const TILED_LATEST_COMPATIBILITY = 65535;
const DEFAULT_PROJECT_NAME = "project";
const KNOWN_PROJECT_FIELDS = new Set([
  "automappingRulesFile",
  "commands",
  "compatibilityVersion",
  "extensionsPath",
  "folders",
  "objectTypesFile",
  "pixelEditor",
  "properties",
  "propertyTypes"
]);
const SUPPORTED_USE_AS_VALUES = new Set<PropertyTypeUseAs>([
  "property",
  "map",
  "layer",
  "object",
  "tile",
  "tileset",
  "wangcolor",
  "wangset",
  "project",
  "world",
  "template"
]);

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

function optionalString(record: JsonRecord, key: string): string | undefined {
  return typeof record[key] === "string" ? (record[key] as string) : undefined;
}

function optionalBoolean(record: JsonRecord, key: string): boolean | undefined {
  return typeof record[key] === "boolean" ? (record[key] as boolean) : undefined;
}

function appendIssue(
  issues: TiledProjectImportIssue[],
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

function appendInvalidProjectExportOptionIssue(
  issues: TiledProjectImportIssue[],
  path: string
): void {
  appendIssue(
    issues,
    path,
    "project.exportOptions.invalid",
    "Invalid project export option was ignored."
  );
}

function normalizeProjectPath(path: string): string {
  const normalized = path.replaceAll("\\", "/").trim();

  if (normalized.length === 0 || normalized === ".") {
    return ".";
  }

  const nextPath = normalizeAssetPath(normalized);
  return nextPath.length > 0 ? nextPath : ".";
}

function deriveProjectName(documentPath?: string): string {
  const normalizedPath =
    documentPath !== undefined ? normalizeAssetPath(documentPath) : "";
  const fileName = normalizedPath.split("/").at(-1) ?? "";

  if (fileName.endsWith(TILED_PROJECT_EXTENSION)) {
    return fileName.slice(0, -TILED_PROJECT_EXTENSION.length) || DEFAULT_PROJECT_NAME;
  }

  return fileName || DEFAULT_PROJECT_NAME;
}

function compatibilityVersionFromNumber(value: number): string | undefined {
  if (!Number.isInteger(value) || value <= 0) {
    return undefined;
  }

  if (value === TILED_LATEST_COMPATIBILITY) {
    return "latest";
  }

  const major = Math.floor(value / 1000);
  const minor = Math.floor((value % 1000) / 10);

  if (major <= 0) {
    return undefined;
  }

  return `${major}.${minor}`;
}

function compatibilityVersionToNumber(value: string): number | undefined {
  const normalized = value.trim().toLowerCase();

  if (normalized.length === 0) {
    return undefined;
  }

  if (normalized === "latest") {
    return TILED_LATEST_COMPATIBILITY;
  }

  const match = /^(\d+)\.(\d+)$/.exec(normalized);

  if (!match) {
    return undefined;
  }

  return Number(match[1]) * 1000 + Number(match[2]) * 10;
}

function parseProjectExportOptions(
  value: unknown,
  issues: TiledProjectImportIssue[],
  path: string
): Partial<EditorProjectExportOptions> | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!isRecord(value)) {
    appendIssue(
      issues,
      path,
      "project.exportOptions.unsupported",
      "Invalid project export options were ignored."
    );
    return undefined;
  }

  const nextOptions: Partial<EditorProjectExportOptions> = {};

  for (const key of Object.keys(value)) {
    if (
      key !== "embedTilesets" &&
      key !== "detachTemplateInstances" &&
      key !== "resolveObjectTypesAndProperties" &&
      key !== "exportMinimized"
    ) {
      appendIssue(
        issues,
        `${path}.${key}`,
        "project.exportOptions.field.unknown",
        `Unknown project export option \`${key}\` was ignored.`
      );
    }
  }

  const embedTilesets = optionalBoolean(value, "embedTilesets");

  if (embedTilesets !== undefined) {
    nextOptions.embedTilesets = embedTilesets;
  } else if ("embedTilesets" in value) {
    appendInvalidProjectExportOptionIssue(issues, `${path}.embedTilesets`);
  }

  const detachTemplateInstances = optionalBoolean(value, "detachTemplateInstances");

  if (detachTemplateInstances !== undefined) {
    nextOptions.detachTemplateInstances = detachTemplateInstances;
  } else if ("detachTemplateInstances" in value) {
    appendInvalidProjectExportOptionIssue(issues, `${path}.detachTemplateInstances`);
  }

  const resolveObjectTypesAndProperties = optionalBoolean(
    value,
    "resolveObjectTypesAndProperties"
  );

  if (resolveObjectTypesAndProperties !== undefined) {
    nextOptions.resolveObjectTypesAndProperties = resolveObjectTypesAndProperties;
  } else if ("resolveObjectTypesAndProperties" in value) {
    appendInvalidProjectExportOptionIssue(
      issues,
      `${path}.resolveObjectTypesAndProperties`
    );
  }

  const exportMinimized = optionalBoolean(value, "exportMinimized");

  if (exportMinimized !== undefined) {
    nextOptions.exportMinimized = exportMinimized;
  } else if ("exportMinimized" in value) {
    appendInvalidProjectExportOptionIssue(issues, `${path}.exportMinimized`);
  }

  return Object.keys(nextOptions).length > 0 ? nextOptions : undefined;
}

function serializeProjectExportOptions(
  exportOptions: EditorProjectExportOptions
): TiledProjectJsonObject {
  return {
    embedTilesets: exportOptions.embedTilesets,
    detachTemplateInstances: exportOptions.detachTemplateInstances,
    resolveObjectTypesAndProperties: exportOptions.resolveObjectTypesAndProperties,
    exportMinimized: exportOptions.exportMinimized
  };
}

function collectUnknownFieldIssues(
  record: JsonRecord,
  issues: TiledProjectImportIssue[]
): void {
  for (const key of Object.keys(record)) {
    if (KNOWN_PROJECT_FIELDS.has(key)) {
      continue;
    }

    appendIssue(
      issues,
      `project.${key}`,
      "project.field.unknown",
      `Unknown project field \`${key}\` was ignored.`
    );
  }
}

function parseLiteralPropertyValue(value: unknown): PropertyValue {
  if (Array.isArray(value)) {
    return value.map((entry) => parseLiteralPropertyValue(entry));
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
      Object.entries(value).map(([key, entryValue]) => [
        key,
        parseLiteralPropertyValue(entryValue)
      ])
    )
  };
}

function parseListItemValue(
  value: unknown,
  issues: TiledProjectImportIssue[],
  path: string
): PropertyValue {
  const record = requireRecord(value, path);
  const rawType = requireString(record, "type", path);

  return parseTypedPropertyValue(
    rawType,
    record.value,
    optionalString(record, "propertyType"),
    issues,
    `${path}.value`
  );
}

function parseTypedPropertyValue(
  rawType: string,
  rawValue: unknown,
  propertyTypeName: string | undefined,
  issues: TiledProjectImportIssue[],
  path: string
): PropertyValue {
  if (Array.isArray(rawValue)) {
    return rawValue.map((entry, index) =>
      isRecord(entry) && "type" in entry && "value" in entry
        ? parseListItemValue(entry, issues, `${path}[${index}]`)
        : parseLiteralPropertyValue(entry)
    );
  }

  if (rawType === "class") {
    const members = isRecord(rawValue)
      ? Object.fromEntries(
          Object.entries(rawValue).map(([key, entryValue]) => [
            key,
            parseLiteralPropertyValue(entryValue)
          ])
        )
      : {};

    return { members };
  }

  if (rawType === "object") {
    if (rawValue === null || rawValue === 0 || rawValue === undefined) {
      return null;
    }

    appendIssue(
      issues,
      path,
      "project.property.objectReferenceUnsupported",
      "Object default values in project property types are imported as null."
    );
    return null;
  }

  if (propertyTypeName && (rawType === "string" || rawType === "int")) {
    if (typeof rawValue === "string" || typeof rawValue === "number") {
      return rawValue;
    }

    return rawType === "int" ? 0 : "";
  }

  switch (rawType) {
    case "bool":
      return typeof rawValue === "boolean" ? rawValue : false;
    case "color":
    case "file":
    case "string":
      return typeof rawValue === "string" ? rawValue : "";
    case "float":
    case "int":
      return typeof rawValue === "number" && !Number.isNaN(rawValue) ? rawValue : 0;
    default:
      appendIssue(
        issues,
        path,
        "project.property.typeUnsupported",
        `Unsupported project property type \`${rawType}\` was imported as null.`
      );
      return null;
  }
}

function parseFieldValueType(
  rawType: string,
  propertyTypeName: string | undefined,
  issues: TiledProjectImportIssue[],
  path: string
): PropertyTypeName | undefined {
  if (propertyTypeName && (rawType === "string" || rawType === "int")) {
    return "enum";
  }

  if (
    rawType === "bool" ||
    rawType === "class" ||
    rawType === "color" ||
    rawType === "file" ||
    rawType === "float" ||
    rawType === "int" ||
    rawType === "object" ||
    rawType === "string"
  ) {
    return rawType;
  }

  appendIssue(
    issues,
    path,
    "project.property.typeUnsupported",
    `Unsupported project property type \`${rawType}\` was ignored.`
  );
  return undefined;
}

function parseClassFieldDefinition(
  value: unknown,
  issues: TiledProjectImportIssue[],
  path: string
): ClassPropertyFieldDefinition | undefined {
  const record = requireRecord(value, path);
  const name = requireString(record, "name", path);
  const rawType = requireString(record, "type", path);
  const propertyTypeName = optionalString(record, "propertyType");
  const valueType = parseFieldValueType(rawType, propertyTypeName, issues, `${path}.type`);

  if (!valueType) {
    return undefined;
  }

  const defaultValue = parseTypedPropertyValue(
    rawType,
    record.value,
    propertyTypeName,
    issues,
    `${path}.value`
  );

  return {
    name,
    valueType,
    ...(propertyTypeName !== undefined ? { propertyTypeName } : {}),
    ...(defaultValue !== undefined ? { defaultValue } : {})
  };
}

function parseUseAs(
  value: unknown,
  issues: TiledProjectImportIssue[],
  path: string
): PropertyTypeUseAs[] {
  if (value === undefined) {
    return ["property"];
  }

  if (!Array.isArray(value)) {
    appendIssue(
      issues,
      path,
      "project.propertyType.useAsInvalid",
      "Project class property type `useAs` must be an array."
    );
    return ["property"];
  }

  const useAs: PropertyTypeUseAs[] = [];

  for (let index = 0; index < value.length; index += 1) {
    const entry = value[index];

    if (typeof entry !== "string") {
      appendIssue(
        issues,
        `${path}[${index}]`,
        "project.propertyType.useAsInvalid",
        "Project class property type `useAs` entries must be strings."
      );
      continue;
    }

    if (!SUPPORTED_USE_AS_VALUES.has(entry as PropertyTypeUseAs)) {
      appendIssue(
        issues,
        `${path}[${index}]`,
        "project.propertyType.useAsUnsupported",
        `Unsupported project class property type target \`${entry}\` was ignored.`
      );
      continue;
    }

    useAs.push(entry as PropertyTypeUseAs);
  }

  return useAs;
}

function parsePropertyTypeDefinition(
  value: unknown,
  issues: TiledProjectImportIssue[],
  path: string
): PropertyTypeDefinition | undefined {
  const record = requireRecord(value, path);
  const name = requireString(record, "name", path);
  const kind = optionalString(record, "type") ?? "enum";

  if (kind === "enum") {
    const values = Array.isArray(record.values)
      ? record.values
          .filter((entry): entry is string => typeof entry === "string")
      : [];

    return {
      id: createEntityId("propertyType"),
      kind: "enum",
      name,
      storageType: optionalString(record, "storageType") === "int" ? "int" : "string",
      values,
      valuesAsFlags: record.valuesAsFlags === true
    } satisfies EnumPropertyTypeDefinition;
  }

  if (kind === "class") {
    const fields = Array.isArray(record.members)
      ? record.members
          .map((entry, index) =>
            parseClassFieldDefinition(entry, issues, `${path}.members[${index}]`)
          )
          .filter(
            (entry): entry is ClassPropertyFieldDefinition => entry !== undefined
          )
      : [];
    const useAs = parseUseAs(record.useAs, issues, `${path}.useAs`);
    const color = optionalString(record, "color");
    const drawFill = optionalBoolean(record, "drawFill");

    return {
      id: createEntityId("propertyType"),
      kind: "class",
      name,
      useAs,
      fields,
      ...(color !== undefined ? { color } : {}),
      ...(drawFill !== undefined ? { drawFill } : {})
    } satisfies ClassPropertyTypeDefinition;
  }

  appendIssue(
    issues,
    `${path}.type`,
    "project.propertyType.kindUnsupported",
    `Unsupported project property type kind \`${kind}\` was ignored.`
  );
  return undefined;
}

function isClassPropertyValue(value: PropertyValue): value is Extract<PropertyValue, { members: Record<string, PropertyValue> }> {
  return typeof value === "object" && value !== null && "members" in value;
}

function isObjectReferenceValue(
  value: PropertyValue
): value is Extract<PropertyValue, { objectId: string }> {
  return typeof value === "object" && value !== null && "objectId" in value;
}

function serializeUntypedPropertyValue(value: PropertyValue): TiledProjectJsonValue {
  if (Array.isArray(value)) {
    return value.map((entry) => serializeUntypedPropertyValue(entry));
  }

  if (isClassPropertyValue(value)) {
    return Object.fromEntries(
      Object.entries(value.members).map(([key, memberValue]) => [
        key,
        serializeUntypedPropertyValue(memberValue)
      ])
    );
  }

  if (isObjectReferenceValue(value)) {
    return 0;
  }

  return value;
}

function inferListItemType(value: PropertyValue): {
  type: string;
  propertyTypeName?: string;
  value: TiledProjectJsonValue;
} {
  if (isClassPropertyValue(value)) {
    return {
      type: "class",
      value: serializeUntypedPropertyValue(value)
    };
  }

  if (isObjectReferenceValue(value) || value === null) {
    return {
      type: "object",
      value: 0
    };
  }

  if (typeof value === "boolean") {
    return {
      type: "bool",
      value
    };
  }

  if (typeof value === "number") {
    return {
      type: Number.isInteger(value) ? "int" : "float",
      value
    };
  }

  return {
    type: "string",
    value: typeof value === "string" ? value : ""
  };
}

function serializeTypedPropertyValue(
  valueType: PropertyTypeName,
  value: PropertyValue,
  propertyTypeName: string | undefined,
  propertyTypes: readonly PropertyTypeDefinition[]
): TiledProjectJsonValue {
  if (Array.isArray(value)) {
    return value.map((entry) => {
      const typedEntry = inferListItemType(entry);

      return {
        type: typedEntry.type,
        value: typedEntry.value,
        ...(typedEntry.propertyTypeName !== undefined
          ? { propertyType: typedEntry.propertyTypeName }
          : {})
      };
    });
  }

  switch (valueType) {
    case "bool":
      return typeof value === "boolean" ? value : false;
    case "color":
    case "file":
    case "string":
      return typeof value === "string" ? value : "";
    case "float":
    case "int":
      return typeof value === "number" && !Number.isNaN(value) ? value : 0;
    case "object":
      return isObjectReferenceValue(value) ? 0 : 0;
    case "enum": {
      const enumType = getEnumPropertyTypeDefinitionByName(propertyTypes, propertyTypeName);

      if (enumType?.storageType === "int" && typeof value === "number") {
        return value;
      }

      return typeof value === "string"
        ? value
        : enumType?.storageType === "int"
          ? 0
          : "";
    }
    case "class": {
      if (!isClassPropertyValue(value)) {
        return {};
      }

      const classType = getClassPropertyTypeDefinitionByName(
        propertyTypes,
        propertyTypeName
      );

      if (!classType) {
        return serializeUntypedPropertyValue(value);
      }

      const members: Record<string, TiledProjectJsonValue> = {};

      for (const field of classType.fields) {
        const memberValue =
          value.members[field.name] ??
          createDefaultPropertyValue(
            field.valueType,
            field.propertyTypeName,
            propertyTypes
          );

        members[field.name] = serializeTypedPropertyValue(
          field.valueType,
          memberValue,
          field.propertyTypeName,
          propertyTypes
        );
      }

      for (const [key, memberValue] of Object.entries(value.members)) {
        if (members[key] !== undefined) {
          continue;
        }

        members[key] = serializeUntypedPropertyValue(memberValue);
      }

      return members;
    }
  }
}

function serializeClassField(
  field: ClassPropertyFieldDefinition,
  propertyTypes: readonly PropertyTypeDefinition[]
): TiledProjectJsonObject {
  const fieldValue =
    field.defaultValue ??
    createDefaultPropertyValue(field.valueType, field.propertyTypeName, propertyTypes);
  const type =
    field.valueType === "enum"
      ? getEnumPropertyTypeDefinitionByName(propertyTypes, field.propertyTypeName)
          ?.storageType ?? "string"
      : field.valueType;

  return {
    name: field.name,
    type,
    value: serializeTypedPropertyValue(
      field.valueType,
      fieldValue,
      field.propertyTypeName,
      propertyTypes
    ),
    ...(field.propertyTypeName !== undefined
      ? { propertyType: field.propertyTypeName }
      : {})
  };
}

function serializePropertyTypeDefinition(
  propertyType: PropertyTypeDefinition,
  index: number,
  propertyTypes: readonly PropertyTypeDefinition[]
): TiledProjectJsonObject {
  if (propertyType.kind === "enum") {
    return {
      id: index + 1,
      type: "enum",
      name: propertyType.name,
      storageType: propertyType.storageType,
      values: propertyType.values,
      valuesAsFlags: propertyType.valuesAsFlags
    };
  }

  return {
    id: index + 1,
    type: "class",
    name: propertyType.name,
    members: propertyType.fields.map((field) =>
      serializeClassField(field, propertyTypes)
    ),
    useAs: propertyType.useAs,
    ...(propertyType.color !== undefined ? { color: propertyType.color } : {}),
    ...(propertyType.drawFill !== undefined
      ? { drawFill: propertyType.drawFill }
      : {})
  };
}

export function importTiledProjectDocument(
  input: string | unknown,
  options: TiledProjectImportOptions = {}
): ImportedTiledProjectDocument {
  const rawDocument =
    typeof input === "string" ? (JSON.parse(input) as unknown) : input;
  const record = requireRecord(rawDocument, "project");
  const issues: TiledProjectImportIssue[] = [];

  collectUnknownFieldIssues(record, issues);

  const assetRoots = Array.isArray(record.folders)
    ? record.folders
        .filter((entry): entry is string => typeof entry === "string")
        .map((entry) => normalizeProjectPath(entry))
    : [];
  const extensionsDirectory = normalizeProjectPath(
    optionalString(record, "extensionsPath") ?? "extensions"
  );
  const automappingRulesFileRaw = optionalString(record, "automappingRulesFile");
  const pixelEditorRecord = (() => {
    if (record.pixelEditor === undefined) {
      return undefined;
    }

    if (!isRecord(record.pixelEditor)) {
      appendIssue(
        issues,
        "project.pixelEditor",
        "project.pixelEditor.unsupported",
        "Invalid pixelEditor metadata was ignored."
      );
      return undefined;
    }

    return record.pixelEditor;
  })();
  const compatibilityVersion = (() => {
    const value = record.compatibilityVersion;

    if (value === undefined) {
      return undefined;
    }

    if (typeof value === "number") {
      const resolved = compatibilityVersionFromNumber(value);

      if (resolved !== undefined) {
        return resolved;
      }

      appendIssue(
        issues,
        "project.compatibilityVersion",
        "project.compatibilityVersion.invalid",
        "Invalid project compatibility version was ignored."
      );
      return undefined;
    }

    if (typeof value === "string") {
      return value;
    }

    appendIssue(
      issues,
      "project.compatibilityVersion",
      "project.compatibilityVersion.invalid",
      "Invalid project compatibility version was ignored."
    );
    return undefined;
  })();
  const propertyTypes = Array.isArray(record.propertyTypes)
    ? record.propertyTypes
        .map((entry, index) =>
          parsePropertyTypeDefinition(entry, issues, `project.propertyTypes[${index}]`)
        )
        .filter((entry): entry is PropertyTypeDefinition => entry !== undefined)
    : [];

  if (Array.isArray(record.commands) && record.commands.length > 0) {
    appendIssue(
      issues,
      "project.commands",
      "project.commands.unsupported",
      "Project commands are not represented by the current domain model."
    );
  }

  if (Array.isArray(record.properties) && record.properties.length > 0) {
    appendIssue(
      issues,
      "project.properties",
      "project.properties.unsupported",
      "Project custom properties are not represented by the current domain model."
    );
  }

  if (
    typeof record.objectTypesFile === "string" &&
    record.objectTypesFile.trim().length > 0
  ) {
    appendIssue(
      issues,
      "project.objectTypesFile",
      "project.objectTypesFile.unsupported",
      "Legacy objectTypesFile references are not represented by the current domain model."
    );
  }

  const exportOptions = (() => {
    if (!pixelEditorRecord) {
      return undefined;
    }

    for (const key of Object.keys(pixelEditorRecord)) {
      if (key === "exportOptions") {
        continue;
      }

      appendIssue(
        issues,
        `project.pixelEditor.${key}`,
        "project.pixelEditor.field.unknown",
        `Unknown pixelEditor field \`${key}\` was ignored.`
      );
    }

    return parseProjectExportOptions(
      pixelEditorRecord.exportOptions,
      issues,
      "project.pixelEditor.exportOptions"
    );
  })();

  const project = createProject({
    name: deriveProjectName(options.documentPath),
    assetRoots,
    ...(compatibilityVersion !== undefined ? { compatibilityVersion } : {}),
    extensionsDirectory,
    ...(automappingRulesFileRaw !== undefined && automappingRulesFileRaw.trim().length > 0
      ? { automappingRulesFile: normalizeProjectPath(automappingRulesFileRaw) }
      : {}),
    ...(exportOptions !== undefined ? { exportOptions } : {}),
    propertyTypes
  });
  const assetReferences: AssetReferenceDescriptor[] = assetRoots.map((folder, index) =>
    createAssetReference("project-folder", `project.folders[${index}]`, folder, options)
  );

  assetReferences.push(
    createAssetReference(
      "extensions",
      "project.extensionsPath",
      extensionsDirectory,
      options
    )
  );

  if (automappingRulesFileRaw !== undefined && automappingRulesFileRaw.trim().length > 0) {
    assetReferences.push(
      createAssetReference(
        "automapping-rules",
        "project.automappingRulesFile",
        normalizeProjectPath(automappingRulesFileRaw),
        options
      )
    );
  }

  return {
    project,
    assetReferences,
    issues
  };
}

export function exportTiledProjectDocument(
  input: ExportTiledProjectDocumentInput
): TiledProjectJsonObject {
  const compatibilityVersion = compatibilityVersionToNumber(
    input.project.compatibilityVersion
  );

  return {
    automappingRulesFile: input.project.automappingRulesFile ?? "",
    commands: [],
    extensionsPath: normalizeProjectPath(input.project.extensionsDirectory),
    folders: input.project.assetRoots.map((assetRoot) => normalizeProjectPath(assetRoot)),
    pixelEditor: {
      exportOptions: serializeProjectExportOptions(input.project.exportOptions)
    },
    properties: [],
    propertyTypes: input.project.propertyTypes.map((propertyType, index) =>
      serializePropertyTypeDefinition(propertyType, index, input.project.propertyTypes)
    ),
    ...(compatibilityVersion !== undefined &&
    compatibilityVersion !== TILED_LATEST_COMPATIBILITY
      ? { compatibilityVersion }
      : {})
  };
}

export function stringifyTiledProjectDocument(
  input: ExportTiledProjectDocumentInput
): string {
  return JSON.stringify(exportTiledProjectDocument(input), null, 2);
}
