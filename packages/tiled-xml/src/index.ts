import { DOMParser } from "@xmldom/xmldom";
import {
  createAssetReference,
  type AssetReferenceDescriptor
} from "@pixel-editor/asset-reference";
import { importTmjMapDocument } from "@pixel-editor/tiled-json";

import type {
  ImportedTmxMapDocument,
  ImportedTmxTilesetReference,
  TiledXmlImportOptions,
  TmxImportIssue
} from "./types";
import {
  appendExternalAssetReferenceIssues,
  collectUnknownTmxIssues
} from "./validation";

export * from "./types";
export { exportTmxMapDocument, stringifyTmxMapDocument } from "./export";
export {
  exportTsxTilesetDocument,
  importTsxTilesetDocument,
  stringifyTsxTilesetDocument
} from "./tileset";

type XmlRecord = Record<string, unknown>;

function appendIssue(
  issues: TmxImportIssue[],
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

function parseXmlDocument(input: string): Document {
  return new DOMParser().parseFromString(input, "application/xml");
}

function getElementChildren(node: Element): Element[] {
  const children: Element[] = [];

  for (let index = 0; index < node.childNodes.length; index += 1) {
    const child = node.childNodes[index];

    if (child && child.nodeType === 1) {
      children.push(child as Element);
    }
  }

  return children;
}

function getElementChildrenByTag(node: Element, tagName: string): Element[] {
  return getElementChildren(node).filter((child) => child.tagName === tagName);
}

function getFirstChildByTag(node: Element, tagName: string): Element | undefined {
  return getElementChildren(node).find((child) => child.tagName === tagName);
}

function getTrimmedText(node: Element): string {
  return node.textContent?.trim() ?? "";
}

function getAttribute(node: Element, name: string): string | undefined {
  const value = node.getAttribute(name);
  return value === null || value === "" ? undefined : value;
}

function requireAttribute(node: Element, name: string, path: string): string {
  const value = getAttribute(node, name);

  if (value === undefined) {
    throw new Error(`${path}.@${name} must be present`);
  }

  return value;
}

function getNumberAttribute(node: Element, name: string): number | undefined {
  const raw = getAttribute(node, name);

  if (raw === undefined) {
    return undefined;
  }

  const value = Number(raw);
  return Number.isNaN(value) ? undefined : value;
}

function getBooleanAttribute(node: Element, name: string): boolean | undefined {
  const raw = getAttribute(node, name);

  if (raw === undefined) {
    return undefined;
  }

  const normalized = raw.trim().toLowerCase();

  if (normalized === "0" || normalized === "false" || normalized === "no") {
    return false;
  }

  if (normalized === "1" || normalized === "true" || normalized === "yes") {
    return true;
  }

  return Boolean(normalized);
}

function getStringOrNumberAttribute(node: Element, name: string): string | number | undefined {
  const numeric = getNumberAttribute(node, name);
  return numeric === undefined ? getAttribute(node, name) : numeric;
}

function parseCsvTileData(text: string): number[] {
  return text
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .map((entry) => Number(entry));
}

function parsePointList(points: string): Array<{ x: number; y: number }> {
  return points
    .trim()
    .split(/\s+/)
    .filter((entry) => entry.length > 0)
    .map((entry) => {
      const [rawX = "0", rawY = "0"] = entry.split(",");

      return {
        x: Number(rawX),
        y: Number(rawY)
      };
    });
}

function parsePropertiesContainer(
  node: Element,
  issues: TmxImportIssue[],
  path: string
): XmlRecord[] {
  const container = getFirstChildByTag(node, "properties");

  if (!container) {
    return [];
  }

  return getElementChildrenByTag(container, "property").map((property, index) =>
    parsePropertyElement(property, issues, `${path}.properties[${index}]`)
  );
}

function parsePropertyElement(
  node: Element,
  issues: TmxImportIssue[],
  path: string
): XmlRecord {
  const name = requireAttribute(node, "name", path);
  const rawType = getAttribute(node, "type");
  const propertyTypeName = getAttribute(node, "propertytype");
  const nestedProperties = getFirstChildByTag(node, "properties");
  let value: unknown;

  if (rawType === "class" && nestedProperties) {
    value = Object.fromEntries(
      getElementChildrenByTag(nestedProperties, "property").map((property, index) => {
        const parsed = parsePropertyElement(property, issues, `${path}.properties[${index}]`);
        return [String(parsed.name), parsed.value ?? null];
      })
    );
  } else {
    const rawValue = getAttribute(node, "value") ?? getTrimmedText(node);

    if (rawType === "bool") {
      value = rawValue.toLowerCase() === "true" || rawValue === "1" || rawValue.toLowerCase() === "yes";
    } else if (rawType === "int" || rawType === "object") {
      value = rawValue === "" ? 0 : Number(rawValue);
    } else if (rawType === "float") {
      value = rawValue === "" ? 0 : Number(rawValue);
    } else {
      value = rawValue;
    }
  }

  const record: XmlRecord = {
    name,
    value
  };

  if (rawType !== undefined) {
    record.type = rawType;
  }

  if (propertyTypeName !== undefined) {
    record.propertytype = propertyTypeName;
  }

  if (rawType === "class" && !nestedProperties) {
    appendIssue(
      issues,
      path,
      "tmx.property.classMembersMissing",
      `Class property \`${name}\` is missing nested members and was normalized to an empty object.`
    );
    record.value = {};
  }

  return record;
}

function parseTileDataElement(
  node: Element,
  issues: TmxImportIssue[],
  path: string
): XmlRecord {
  const encoding = getAttribute(node, "encoding");
  const compression = getAttribute(node, "compression");
  const chunkElements = getElementChildrenByTag(node, "chunk");

  if (chunkElements.length > 0) {
    return {
      ...(encoding !== undefined ? { encoding } : {}),
      ...(compression !== undefined ? { compression } : {}),
      chunks: chunkElements.map((chunk, index) =>
        parseTileChunkElement(chunk, issues, `${path}.chunks[${index}]`, encoding, compression)
      )
    };
  }

  if (encoding === "csv") {
    return {
      encoding,
      ...(compression !== undefined ? { compression } : {}),
      data: parseCsvTileData(getTrimmedText(node))
    };
  }

  const tileElements = getElementChildrenByTag(node, "tile");

  if (tileElements.length > 0) {
    return {
      data: tileElements.map((tile) => getNumberAttribute(tile, "gid") ?? 0)
    };
  }

  const rawText = getTrimmedText(node);

  return {
    ...(encoding !== undefined ? { encoding } : {}),
    ...(compression !== undefined ? { compression } : {}),
    data: rawText
  };
}

function parseTileChunkElement(
  node: Element,
  issues: TmxImportIssue[],
  path: string,
  inheritedEncoding?: string,
  inheritedCompression?: string
): XmlRecord {
  const encoding = getAttribute(node, "encoding") ?? inheritedEncoding;
  const compression = getAttribute(node, "compression") ?? inheritedCompression;
  const tileElements = getElementChildrenByTag(node, "tile");
  const text = getTrimmedText(node);

  return {
    x: getNumberAttribute(node, "x") ?? 0,
    y: getNumberAttribute(node, "y") ?? 0,
    width: getNumberAttribute(node, "width") ?? 0,
    height: getNumberAttribute(node, "height") ?? 0,
    ...(encoding !== undefined ? { encoding } : {}),
    ...(compression !== undefined ? { compression } : {}),
    data:
      encoding === "csv"
        ? parseCsvTileData(text)
        : tileElements.length > 0
          ? tileElements.map((tile) => getNumberAttribute(tile, "gid") ?? 0)
          : text
  };
}

function parseObjectElement(
  node: Element,
  issues: TmxImportIssue[],
  path: string
): XmlRecord {
  const record: XmlRecord = {
    id: getNumberAttribute(node, "id") ?? 0,
    name: getAttribute(node, "name") ?? "",
    x: getNumberAttribute(node, "x") ?? 0,
    y: getNumberAttribute(node, "y") ?? 0,
    width: getNumberAttribute(node, "width") ?? 0,
    height: getNumberAttribute(node, "height") ?? 0,
    rotation: getNumberAttribute(node, "rotation") ?? 0,
    visible: getBooleanAttribute(node, "visible") ?? true
  };
  const typeName = getAttribute(node, "type");
  const className = getAttribute(node, "class");
  const gid = getNumberAttribute(node, "gid");
  const polygon = getFirstChildByTag(node, "polygon");
  const polyline = getFirstChildByTag(node, "polyline");
  const ellipse = getFirstChildByTag(node, "ellipse");
  const point = getFirstChildByTag(node, "point");
  const text = getFirstChildByTag(node, "text");

  if (typeName !== undefined) {
    record.type = typeName;
  }

  if (className !== undefined) {
    record.class = className;
  }

  if (gid !== undefined) {
    record.gid = gid;
  }

  if (polygon) {
    record.polygon = parsePointList(getAttribute(polygon, "points") ?? "");
  }

  if (polyline) {
    record.polyline = parsePointList(getAttribute(polyline, "points") ?? "");
  }

  if (ellipse) {
    record.ellipse = true;
  }

  if (point) {
    record.point = true;
  }

  if (text) {
    record.text = {
      text: text.textContent ?? "",
      ...(getAttribute(text, "fontfamily") !== undefined
        ? { fontfamily: getAttribute(text, "fontfamily") }
        : {}),
      ...(getNumberAttribute(text, "pixelsize") !== undefined
        ? { pixelsize: getNumberAttribute(text, "pixelsize") }
        : {}),
      ...(getBooleanAttribute(text, "wrap") !== undefined
        ? { wrap: getBooleanAttribute(text, "wrap") }
        : {}),
      ...(getAttribute(text, "color") !== undefined ? { color: getAttribute(text, "color") } : {})
    };
  }

  const properties = parsePropertiesContainer(node, issues, path);

  if (properties.length > 0) {
    record.properties = properties;
  }

  return record;
}

function parseTilesetElement(node: Element, issues: TmxImportIssue[], path: string): XmlRecord {
  const firstgid = getNumberAttribute(node, "firstgid");

  if (firstgid === undefined) {
    throw new Error(`${path}.@firstgid must be present`);
  }

  const source = getAttribute(node, "source");
  const name = getAttribute(node, "name");
  const tilecount = getNumberAttribute(node, "tilecount");
  const image = getFirstChildByTag(node, "image");
  const imageSource = image ? getAttribute(image, "source") : undefined;

  if (!source && !imageSource && name) {
    appendIssue(
      issues,
      path,
      "tmx.tileset.embeddedImageMissing",
      `Embedded tileset \`${name}\` is missing an <image> source and will only keep metadata.`
    );
  }

  return {
    firstgid,
    ...(source !== undefined ? { source } : {}),
    ...(name !== undefined ? { name } : {}),
    ...(tilecount !== undefined ? { tilecount } : {}),
    ...(imageSource !== undefined ? { image: imageSource } : {})
  };
}

function parseLayerElement(node: Element, issues: TmxImportIssue[], path: string): XmlRecord {
  const base: XmlRecord = {
    name: getAttribute(node, "name") ?? "",
    visible: getBooleanAttribute(node, "visible") ?? true,
    locked: getBooleanAttribute(node, "locked") ?? false,
    opacity: getNumberAttribute(node, "opacity") ?? 1,
    offsetx: getNumberAttribute(node, "offsetx") ?? 0,
    offsety: getNumberAttribute(node, "offsety") ?? 0,
    parallaxx: getNumberAttribute(node, "parallaxx") ?? 1,
    parallaxy: getNumberAttribute(node, "parallaxy") ?? 1
  };
  const className = getAttribute(node, "class");
  const tintcolor = getAttribute(node, "tintcolor");
  const mode = getAttribute(node, "mode");
  const properties = parsePropertiesContainer(node, issues, path);

  if (className !== undefined) {
    base.class = className;
  }

  if (tintcolor !== undefined) {
    base.tintcolor = tintcolor;
  }

  if (mode !== undefined) {
    base.mode = mode;
  }

  if (properties.length > 0) {
    base.properties = properties;
  }

  if (node.tagName === "layer") {
    const dataElement = getFirstChildByTag(node, "data");
    const parsedData = dataElement
      ? parseTileDataElement(dataElement, issues, `${path}.data`)
      : { data: [] };
    const hasChunks = Array.isArray(parsedData.chunks) && parsedData.chunks.length > 0;

    return {
      ...base,
      type: "tilelayer",
      ...(getNumberAttribute(node, "width") !== undefined
        ? { width: getNumberAttribute(node, "width") }
        : {}),
      ...(getNumberAttribute(node, "height") !== undefined
        ? { height: getNumberAttribute(node, "height") }
        : {}),
      ...(node.getAttribute("infinite") !== null
        ? { infinite: getBooleanAttribute(node, "infinite") ?? false }
        : {}),
      ...(hasChunks ? { infinite: true } : {}),
      ...parsedData
    };
  }

  if (node.tagName === "objectgroup") {
    return {
      ...base,
      type: "objectgroup",
      ...(getAttribute(node, "draworder") !== undefined
        ? { draworder: getAttribute(node, "draworder") }
        : {}),
      objects: getElementChildrenByTag(node, "object").map((object, index) =>
        parseObjectElement(object, issues, `${path}.objects[${index}]`)
      )
    };
  }

  if (node.tagName === "imagelayer") {
    const image = getFirstChildByTag(node, "image");

    return {
      ...base,
      type: "imagelayer",
      ...(getBooleanAttribute(node, "repeatx") !== undefined
        ? { repeatx: getBooleanAttribute(node, "repeatx") }
        : {}),
      ...(getBooleanAttribute(node, "repeaty") !== undefined
        ? { repeaty: getBooleanAttribute(node, "repeaty") }
        : {}),
      ...(image && getAttribute(image, "source") !== undefined ? { image: getAttribute(image, "source") } : {}),
      ...(image && getNumberAttribute(image, "width") !== undefined
        ? { imagewidth: getNumberAttribute(image, "width") }
        : {}),
      ...(image && getNumberAttribute(image, "height") !== undefined
        ? { imageheight: getNumberAttribute(image, "height") }
        : {}),
      ...(image && getAttribute(image, "trans") !== undefined
        ? { transparentcolor: getAttribute(image, "trans") }
        : {})
    };
  }

  if (node.tagName === "group") {
    return {
      ...base,
      type: "group",
      layers: getElementChildren(node)
        .filter((child) =>
          child.tagName === "layer" ||
          child.tagName === "objectgroup" ||
          child.tagName === "imagelayer" ||
          child.tagName === "group"
        )
        .map((child, index) => parseLayerElement(child, issues, `${path}.layers[${index}]`))
    };
  }

  appendIssue(
    issues,
    `${path}.type`,
    "tmx.layer.kindUnsupported",
    `Layer element <${node.tagName}> is not supported and was skipped.`
  );

  return {
    ...base,
    type: "group",
    layers: []
  };
}

function collectTmxTemplateReferencesFromLayer(
  node: Element,
  issues: TmxImportIssue[],
  path: string,
  options: TiledXmlImportOptions,
  assetReferences: AssetReferenceDescriptor[]
): void {
  if (node.tagName === "objectgroup") {
    getElementChildrenByTag(node, "object").forEach((object, index) => {
      const templatePath = getAttribute(object, "template")?.trim();

      if (!templatePath) {
        return;
      }

      assetReferences.push(
        createAssetReference(
          "template",
          `${path}.objects[${index}].template`,
          templatePath,
          options
        )
      );
      appendIssue(
        issues,
        `${path}.objects[${index}]`,
        "tmx.object.templateUnsupported",
        `Template-backed object \`${getAttribute(object, "name") ?? ""}\` keeps only inline attributes during TMX import.`
      );
    });

    return;
  }

  if (node.tagName === "group") {
    getElementChildren(node)
      .filter((child) =>
        child.tagName === "layer" ||
        child.tagName === "objectgroup" ||
        child.tagName === "imagelayer" ||
        child.tagName === "group"
      )
      .forEach((child, index) => {
        collectTmxTemplateReferencesFromLayer(
          child,
          issues,
          `${path}.layers[${index}]`,
          options,
          assetReferences
        );
      });
  }
}

function collectTmxTemplateReferences(
  root: Element,
  issues: TmxImportIssue[],
  options: TiledXmlImportOptions
): AssetReferenceDescriptor[] {
  const assetReferences: AssetReferenceDescriptor[] = [];

  getElementChildren(root)
    .filter((child) =>
      child.tagName === "layer" ||
      child.tagName === "objectgroup" ||
      child.tagName === "imagelayer" ||
      child.tagName === "group"
    )
    .forEach((layer, index) => {
      collectTmxTemplateReferencesFromLayer(
        layer,
        issues,
        `tmx.layers[${index}]`,
        options,
        assetReferences
      );
    });

  return assetReferences;
}

function toImportedTmxMapDocument(result: ReturnType<typeof importTmjMapDocument>): ImportedTmxMapDocument {
  return {
    map: result.map,
    tilesetReferences: result.tilesetReferences.map((reference): ImportedTmxTilesetReference => ({
      firstGid: reference.firstGid,
      ...(reference.source !== undefined ? { source: reference.source } : {}),
      ...(reference.name !== undefined ? { name: reference.name } : {}),
      ...(reference.tileCount !== undefined ? { tileCount: reference.tileCount } : {}),
      ...(reference.image !== undefined ? { image: reference.image } : {})
    })),
    assetReferences: result.assetReferences.map((reference) => ({
      ...reference,
      ownerPath: reference.ownerPath.replace(/^tmj(?=\.|$)/, "tmx")
    })),
    issues: result.issues.map((issue) => ({
      severity: issue.severity,
      code: issue.code,
      message: issue.message,
      path: issue.path
    }))
  };
}

export function importTmxMapDocument(
  input: string,
  options: TiledXmlImportOptions = {}
): ImportedTmxMapDocument {
  const document = parseXmlDocument(input);
  const root = document.documentElement;

  if (!root || root.tagName !== "map") {
    throw new Error("tmx root element must be <map>");
  }

  const issues: TmxImportIssue[] = [];
  const tmjLikeDocument: XmlRecord = {
    orientation: requireAttribute(root, "orientation", "tmx"),
    width: getNumberAttribute(root, "width") ?? 0,
    height: getNumberAttribute(root, "height") ?? 0,
    tilewidth: getNumberAttribute(root, "tilewidth") ?? 0,
    tileheight: getNumberAttribute(root, "tileheight") ?? 0,
    ...(getAttribute(root, "name") !== undefined ? { name: getAttribute(root, "name") } : {}),
    ...(getAttribute(root, "renderorder") !== undefined
      ? { renderorder: getAttribute(root, "renderorder") }
      : {}),
    ...(getNumberAttribute(root, "compressionlevel") !== undefined
      ? { compressionlevel: getNumberAttribute(root, "compressionlevel") }
      : {}),
    ...(getBooleanAttribute(root, "infinite") !== undefined
      ? { infinite: getBooleanAttribute(root, "infinite") }
      : {}),
    ...(getNumberAttribute(root, "parallaxoriginx") !== undefined
      ? { parallaxoriginx: getNumberAttribute(root, "parallaxoriginx") }
      : {}),
    ...(getNumberAttribute(root, "parallaxoriginy") !== undefined
      ? { parallaxoriginy: getNumberAttribute(root, "parallaxoriginy") }
      : {}),
    ...(getNumberAttribute(root, "hexsidelength") !== undefined
      ? { hexsidelength: getNumberAttribute(root, "hexsidelength") }
      : {}),
    ...(getAttribute(root, "staggeraxis") !== undefined
      ? { staggeraxis: getAttribute(root, "staggeraxis") }
      : {}),
    ...(getAttribute(root, "staggerindex") !== undefined
      ? { staggerindex: getAttribute(root, "staggerindex") }
      : {}),
    ...(getAttribute(root, "backgroundcolor") !== undefined
      ? { backgroundcolor: getAttribute(root, "backgroundcolor") }
      : {})
  };
  const properties = parsePropertiesContainer(root, issues, "tmx");
  const tilesets = getElementChildrenByTag(root, "tileset").map((tileset, index) =>
    parseTilesetElement(tileset, issues, `tmx.tilesets[${index}]`)
  );
  const layers = getElementChildren(root)
    .filter((child) =>
      child.tagName === "layer" ||
      child.tagName === "objectgroup" ||
      child.tagName === "imagelayer" ||
      child.tagName === "group"
    )
    .map((layer, index) => parseLayerElement(layer, issues, `tmx.layers[${index}]`));

  if (properties.length > 0) {
    tmjLikeDocument.properties = properties;
  }

  if (tilesets.length > 0) {
    tmjLikeDocument.tilesets = tilesets;
  }

  if (layers.length > 0) {
    tmjLikeDocument.layers = layers;
  }

  const templateAssetReferences = collectTmxTemplateReferences(root, issues, options);
  const imported = toImportedTmxMapDocument(importTmjMapDocument(tmjLikeDocument, options));
  const assetReferences = [...imported.assetReferences, ...templateAssetReferences];
  const importedIssues = imported.issues.filter(
    (issue) => issue.code !== "tmj.asset.externalReference"
  );

  collectUnknownTmxIssues(root, issues);
  appendExternalAssetReferenceIssues("tmx", assetReferences, issues);

  return {
    ...imported,
    assetReferences,
    issues: [...issues, ...importedIssues]
  };
}
