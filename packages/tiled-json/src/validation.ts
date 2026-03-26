import type { AssetReferenceDescriptor } from "@pixel-editor/asset-reference";

import type { TmjImportIssue, TsjImportIssue } from "./types";

type JsonRecord = Record<string, unknown>;
type ImportIssue = TmjImportIssue | TsjImportIssue;
type SourceKind = "tmj" | "tsj";

const COMMON_LAYER_KEYS = new Set([
  "id",
  "name",
  "class",
  "visible",
  "locked",
  "opacity",
  "offsetx",
  "offsety",
  "parallaxx",
  "parallaxy",
  "tintcolor",
  "mode",
  "blendmode",
  "properties",
  "x",
  "y",
  "width",
  "height",
  "startx",
  "starty",
  "type"
]);

const TMJ_MAP_KEYS = new Set([
  "type",
  "version",
  "tiledversion",
  "class",
  "compressionlevel",
  "height",
  "hexsidelength",
  "infinite",
  "layers",
  "nextlayerid",
  "nextobjectid",
  "orientation",
  "parallaxoriginx",
  "parallaxoriginy",
  "properties",
  "renderorder",
  "staggeraxis",
  "staggerindex",
  "tileheight",
  "tilesets",
  "tilewidth",
  "width",
  "backgroundcolor",
  "name",
  "editorsettings"
]);

const TMJ_TILESET_REFERENCE_KEYS = new Set([
  "firstgid",
  "source",
  "name",
  "tilecount",
  "image",
  "columns",
  "tilewidth",
  "tileheight",
  "spacing",
  "margin"
]);

const TMJ_TILE_LAYER_KEYS = new Set([
  ...COMMON_LAYER_KEYS,
  "data",
  "chunks",
  "encoding",
  "compression",
  "infinite"
]);

const TMJ_OBJECT_LAYER_KEYS = new Set([
  ...COMMON_LAYER_KEYS,
  "draworder",
  "objects",
  "color"
]);

const TMJ_IMAGE_LAYER_KEYS = new Set([
  ...COMMON_LAYER_KEYS,
  "image",
  "imagewidth",
  "imageheight",
  "transparentcolor",
  "repeatx",
  "repeaty"
]);

const TMJ_GROUP_LAYER_KEYS = new Set([...COMMON_LAYER_KEYS, "layers"]);

const TMJ_CHUNK_KEYS = new Set([
  "x",
  "y",
  "width",
  "height",
  "data"
]);

const TMJ_OBJECT_KEYS = new Set([
  "id",
  "name",
  "type",
  "class",
  "x",
  "y",
  "width",
  "height",
  "rotation",
  "gid",
  "visible",
  "template",
  "properties",
  "ellipse",
  "point",
  "polygon",
  "polyline",
  "text",
  "capsule"
]);

const TMJ_TEXT_KEYS = new Set([
  "text",
  "fontfamily",
  "pixelsize",
  "wrap",
  "color",
  "bold",
  "italic",
  "underline",
  "strikeout",
  "kerning",
  "halign",
  "valign"
]);

const PROPERTY_KEYS = new Set(["name", "type", "propertytype", "value"]);

const TSJ_TILESET_KEYS = new Set([
  "type",
  "version",
  "tiledversion",
  "name",
  "class",
  "tilewidth",
  "tileheight",
  "spacing",
  "margin",
  "tilecount",
  "columns",
  "objectalignment",
  "tilerendersize",
  "fillmode",
  "tileoffset",
  "grid",
  "transformations",
  "properties",
  "image",
  "imagewidth",
  "imageheight",
  "tiles",
  "wangsets",
  "backgroundcolor"
]);

const TSJ_TILE_KEYS = new Set([
  "id",
  "type",
  "class",
  "probability",
  "properties",
  "image",
  "animation",
  "objectgroup",
  "terrain",
  "x",
  "y",
  "width",
  "height"
]);

const TSJ_OBJECT_LAYER_KEYS = new Set([
  ...COMMON_LAYER_KEYS,
  "draworder",
  "objects",
  "color"
]);

const TSJ_ANIMATION_FRAME_KEYS = new Set(["tileid", "duration"]);
const TSJ_TILE_OFFSET_KEYS = new Set(["x", "y"]);
const TSJ_GRID_KEYS = new Set(["orientation", "width", "height"]);
const TSJ_TRANSFORMATION_KEYS = new Set(["hflip", "vflip", "rotate", "preferuntransformed"]);
const TSJ_WANG_SET_KEYS = new Set(["name", "class", "type", "properties", "colors", "wangtiles"]);
const TSJ_WANG_COLOR_KEYS = new Set(["name", "class", "color", "tile", "probability"]);
const TSJ_WANG_TILE_KEYS = new Set(["tileid", "wangid"]);

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function appendIssue(
  issues: ImportIssue[],
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

function appendUnknownKeyIssues(
  source: SourceKind,
  path: string,
  record: JsonRecord,
  allowedKeys: ReadonlySet<string>,
  issues: ImportIssue[]
): void {
  Object.keys(record)
    .filter((key) => !allowedKeys.has(key))
    .sort((left, right) => left.localeCompare(right))
    .forEach((key) => {
      appendIssue(
        issues,
        `${path}.${key}`,
        `${source}.field.unknown`,
        `Unknown ${source.toUpperCase()} field \`${key}\` was ignored during import.`
      );
    });
}

function inspectPropertyArray(
  source: SourceKind,
  value: unknown,
  path: string,
  issues: ImportIssue[]
): void {
  if (!Array.isArray(value)) {
    return;
  }

  value.forEach((entry, index) => {
    if (!isRecord(entry)) {
      return;
    }

    appendUnknownKeyIssues(source, `${path}[${index}]`, entry, PROPERTY_KEYS, issues);
  });
}

function inspectTmjObjectRecord(record: JsonRecord, path: string, issues: ImportIssue[]): void {
  appendUnknownKeyIssues("tmj", path, record, TMJ_OBJECT_KEYS, issues);
  inspectPropertyArray("tmj", record.properties, `${path}.properties`, issues);

  if (isRecord(record.text)) {
    appendUnknownKeyIssues("tmj", `${path}.text`, record.text, TMJ_TEXT_KEYS, issues);
  }
}

function inspectTmjLayerRecord(record: JsonRecord, path: string, issues: ImportIssue[]): void {
  const type = typeof record.type === "string" ? record.type : "";
  const allowedKeys =
    type === "tilelayer"
      ? TMJ_TILE_LAYER_KEYS
      : type === "objectgroup"
        ? TMJ_OBJECT_LAYER_KEYS
        : type === "imagelayer"
          ? TMJ_IMAGE_LAYER_KEYS
          : type === "group"
            ? TMJ_GROUP_LAYER_KEYS
            : COMMON_LAYER_KEYS;

  appendUnknownKeyIssues("tmj", path, record, allowedKeys, issues);
  inspectPropertyArray("tmj", record.properties, `${path}.properties`, issues);

  if (type === "tilelayer" && Array.isArray(record.chunks)) {
    record.chunks.forEach((entry, index) => {
      if (!isRecord(entry)) {
        return;
      }

      appendUnknownKeyIssues("tmj", `${path}.chunks[${index}]`, entry, TMJ_CHUNK_KEYS, issues);
    });
  }

  if (type === "objectgroup" && Array.isArray(record.objects)) {
    record.objects.forEach((entry, index) => {
      if (!isRecord(entry)) {
        return;
      }

      inspectTmjObjectRecord(entry, `${path}.objects[${index}]`, issues);
    });
  }

  if (type === "group" && Array.isArray(record.layers)) {
    record.layers.forEach((entry, index) => {
      if (!isRecord(entry)) {
        return;
      }

      inspectTmjLayerRecord(entry, `${path}.layers[${index}]`, issues);
    });
  }
}

export function collectUnknownTmjFieldIssues(
  document: JsonRecord,
  issues: TmjImportIssue[]
): void {
  appendUnknownKeyIssues("tmj", "tmj", document, TMJ_MAP_KEYS, issues);
  inspectPropertyArray("tmj", document.properties, "tmj.properties", issues);

  if (Array.isArray(document.tilesets)) {
    document.tilesets.forEach((entry, index) => {
      if (!isRecord(entry)) {
        return;
      }

      appendUnknownKeyIssues(
        "tmj",
        `tmj.tilesets[${index}]`,
        entry,
        TMJ_TILESET_REFERENCE_KEYS,
        issues
      );
      inspectPropertyArray("tmj", entry.properties, `tmj.tilesets[${index}].properties`, issues);
    });
  }

  if (Array.isArray(document.layers)) {
    document.layers.forEach((entry, index) => {
      if (!isRecord(entry)) {
        return;
      }

      inspectTmjLayerRecord(entry, `tmj.layers[${index}]`, issues);
    });
  }
}

function inspectTsjObjectRecord(record: JsonRecord, path: string, issues: ImportIssue[]): void {
  appendUnknownKeyIssues("tsj", path, record, TMJ_OBJECT_KEYS, issues);
  inspectPropertyArray("tsj", record.properties, `${path}.properties`, issues);

  if (isRecord(record.text)) {
    appendUnknownKeyIssues("tsj", `${path}.text`, record.text, TMJ_TEXT_KEYS, issues);
  }
}

function inspectTsjObjectGroup(record: JsonRecord, path: string, issues: ImportIssue[]): void {
  appendUnknownKeyIssues("tsj", path, record, TSJ_OBJECT_LAYER_KEYS, issues);
  inspectPropertyArray("tsj", record.properties, `${path}.properties`, issues);

  if (Array.isArray(record.objects)) {
    record.objects.forEach((entry, index) => {
      if (!isRecord(entry)) {
        return;
      }

      inspectTsjObjectRecord(entry, `${path}.objects[${index}]`, issues);
    });
  }
}

function inspectTsjTileRecord(record: JsonRecord, path: string, issues: ImportIssue[]): void {
  appendUnknownKeyIssues("tsj", path, record, TSJ_TILE_KEYS, issues);
  inspectPropertyArray("tsj", record.properties, `${path}.properties`, issues);

  if (Array.isArray(record.animation)) {
    record.animation.forEach((entry, index) => {
      if (!isRecord(entry)) {
        return;
      }

      appendUnknownKeyIssues(
        "tsj",
        `${path}.animation[${index}]`,
        entry,
        TSJ_ANIMATION_FRAME_KEYS,
        issues
      );
    });
  }

  if (isRecord(record.objectgroup)) {
    inspectTsjObjectGroup(record.objectgroup, `${path}.objectgroup`, issues);
  }
}

export function collectUnknownTsjFieldIssues(
  document: JsonRecord,
  issues: TsjImportIssue[]
): void {
  appendUnknownKeyIssues("tsj", "tsj", document, TSJ_TILESET_KEYS, issues);
  inspectPropertyArray("tsj", document.properties, "tsj.properties", issues);

  if (isRecord(document.tileoffset)) {
    appendUnknownKeyIssues("tsj", "tsj.tileoffset", document.tileoffset, TSJ_TILE_OFFSET_KEYS, issues);
  }

  if (isRecord(document.grid)) {
    appendUnknownKeyIssues("tsj", "tsj.grid", document.grid, TSJ_GRID_KEYS, issues);
  }

  if (isRecord(document.transformations)) {
    appendUnknownKeyIssues(
      "tsj",
      "tsj.transformations",
      document.transformations,
      TSJ_TRANSFORMATION_KEYS,
      issues
    );
  }

  if (Array.isArray(document.tiles)) {
    document.tiles.forEach((entry, index) => {
      if (!isRecord(entry)) {
        return;
      }

      inspectTsjTileRecord(entry, `tsj.tiles[${index}]`, issues);
    });
  }

  if (Array.isArray(document.wangsets)) {
    document.wangsets.forEach((entry, index) => {
      if (!isRecord(entry)) {
        return;
      }

      const basePath = `tsj.wangsets[${index}]`;
      appendUnknownKeyIssues("tsj", basePath, entry, TSJ_WANG_SET_KEYS, issues);
      inspectPropertyArray("tsj", entry.properties, `${basePath}.properties`, issues);

      if (Array.isArray(entry.colors)) {
        entry.colors.forEach((colorEntry, colorIndex) => {
          if (!isRecord(colorEntry)) {
            return;
          }

          appendUnknownKeyIssues(
            "tsj",
            `${basePath}.colors[${colorIndex}]`,
            colorEntry,
            TSJ_WANG_COLOR_KEYS,
            issues
          );
        });
      }

      if (Array.isArray(entry.wangtiles)) {
        entry.wangtiles.forEach((wangTileEntry, wangTileIndex) => {
          if (!isRecord(wangTileEntry)) {
            return;
          }

          appendUnknownKeyIssues(
            "tsj",
            `${basePath}.wangtiles[${wangTileIndex}]`,
            wangTileEntry,
            TSJ_WANG_TILE_KEYS,
            issues
          );
        });
      }
    });
  }
}

export function appendExternalAssetReferenceIssues(
  source: SourceKind,
  assetReferences: readonly AssetReferenceDescriptor[],
  issues: ImportIssue[]
): void {
  assetReferences
    .filter((reference) => reference.externalToProject)
    .forEach((reference) => {
      appendIssue(
        issues,
        reference.ownerPath,
        `${source}.asset.externalReference`,
        `External ${source.toUpperCase()} ${reference.kind} reference \`${reference.originalPath}\` is outside known project asset roots.`
      );
    });
}
