import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import { createObjectLayer, createMap, createObjectTemplate } from "@pixel-editor/domain";
import { importTmjMapDocument } from "@pixel-editor/tiled-json";

import type {
  ExportTxTemplateDocumentInput,
  ImportedTxTemplateDocument,
  TiledXmlImportOptions,
  TxImportIssue
} from "./types";
import { stringifyTmxMapDocument } from "./export";

type XmlRecord = Record<string, unknown>;

const TX_FORMAT_VERSION = "1.10";

function appendIssue(
  issues: TxImportIssue[],
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

function parsePropertyElement(
  node: Element,
  issues: TxImportIssue[],
  path: string
): XmlRecord {
  const name = requireAttribute(node, "name", path);
  const rawType = getAttribute(node, "type");
  const propertyTypeName = getAttribute(node, "propertytype");
  const nestedProperties = getFirstChildByTag(node, "properties");
  let value: unknown;

  if (rawType === "class" && nestedProperties) {
    value = Object.fromEntries(
      getElementChildren(nestedProperties)
        .filter((child) => child.tagName === "property")
        .map((property, index) => {
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
      "tx.property.classMembersMissing",
      `Class property \`${name}\` is missing nested members and was normalized to an empty object.`
    );
    record.value = {};
  }

  return record;
}

function parsePropertiesContainer(
  node: Element,
  issues: TxImportIssue[],
  path: string
): XmlRecord[] {
  const container = getFirstChildByTag(node, "properties");

  if (!container) {
    return [];
  }

  return getElementChildren(container)
    .filter((child) => child.tagName === "property")
    .map((property, index) => parsePropertyElement(property, issues, `${path}.properties[${index}]`));
}

function parseObjectElement(node: Element, issues: TxImportIssue[]): XmlRecord {
  const path = "tx.object";
  const record: XmlRecord = {
    id: getNumberAttribute(node, "id") ?? 1,
    name: getAttribute(node, "name") ?? "",
    x: getNumberAttribute(node, "x") ?? 0,
    y: getNumberAttribute(node, "y") ?? 0,
    width: getNumberAttribute(node, "width") ?? 0,
    height: getNumberAttribute(node, "height") ?? 0,
    rotation: getNumberAttribute(node, "rotation") ?? 0,
    visible: getBooleanAttribute(node, "visible") ?? true
  };
  const className = getAttribute(node, "class");
  const typeName = getAttribute(node, "type");
  const gid = getNumberAttribute(node, "gid");
  const polygon = getFirstChildByTag(node, "polygon");
  const polyline = getFirstChildByTag(node, "polyline");
  const point = getFirstChildByTag(node, "point");
  const text = getFirstChildByTag(node, "text");
  const ellipse = getFirstChildByTag(node, "ellipse");
  const properties = parsePropertiesContainer(node, issues, path);

  if (className !== undefined) {
    record.class = className;
  } else if (typeName !== undefined) {
    record.type = typeName;
  }

  if (gid !== undefined) {
    record.gid = gid;
  }

  if (ellipse) {
    record.ellipse = true;
  }

  if (point) {
    record.point = true;
  }

  if (polygon) {
    record.polygon = parsePointList(requireAttribute(polygon, "points", `${path}.polygon`));
  }

  if (polyline) {
    record.polyline = parsePointList(requireAttribute(polyline, "points", `${path}.polyline`));
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

  if (properties.length > 0) {
    record.properties = properties;
  }

  return record;
}

function remapTmjPathToTx(path: string): string {
  return path
    .replace(/^tmj\.layers\[0\]\.objects\[0\](?=\.|$)/, "tx.object")
    .replace(/^tmj\.tilesets(?=\.|$)/, "tx.tilesets")
    .replace(/^tmj(?=\.|$)/, "tx");
}

function remapTmjCodeToTx(code: string): string {
  return code.replace(/^tmj(?=\.|$)/, "tx");
}

function deriveTemplateName(documentPath: string | undefined, objectName: string): string {
  if (documentPath) {
    const normalized = documentPath.replaceAll("\\", "/");
    const fileName = normalized.split("/").at(-1) ?? "";

    if (fileName.toLowerCase().endsWith(".tx")) {
      return fileName.slice(0, -3) || "template";
    }

    if (fileName.length > 0) {
      return fileName;
    }
  }

  return objectName.trim() || "template";
}

export function importTxTemplateDocument(
  input: string,
  options: TiledXmlImportOptions = {}
): ImportedTxTemplateDocument {
  const document = parseXmlDocument(input);
  const root = document.documentElement;

  if (!root || root.tagName !== "template") {
    throw new Error("tx root element must be <template>");
  }

  const issues: TxImportIssue[] = [];
  const tilesets = getElementChildren(root).filter((child) => child.tagName === "tileset");
  const objects = getElementChildren(root).filter((child) => child.tagName === "object");

  if (objects.length === 0) {
    throw new Error("tx template must contain an <object> element");
  }

  if (objects.length > 1) {
    appendIssue(
      issues,
      "tx.object",
      "tx.object.multipleObjectsUnsupported",
      "Only the first template object is imported."
    );
  }

  const objectRecord = parseObjectElement(objects[0]!, issues);
  const tilesetReferences = tilesets.map((tileset, index) => {
    const source = getAttribute(tileset, "source");

    if (!source) {
      appendIssue(
        issues,
        `tx.tilesets[${index}]`,
        "tx.tileset.embeddedUnsupported",
        "Embedded tilesets in template files are not currently represented by the domain model."
      );
    }

    return {
      firstgid: getNumberAttribute(tileset, "firstgid") ?? 1,
      ...(source !== undefined ? { source } : {}),
      ...(getAttribute(tileset, "name") !== undefined ? { name: getAttribute(tileset, "name") } : {}),
      ...(getNumberAttribute(tileset, "tilecount") !== undefined
        ? { tilecount: getNumberAttribute(tileset, "tilecount") }
        : {}),
      ...(getFirstChildByTag(tileset, "image") && getAttribute(getFirstChildByTag(tileset, "image")!, "source") !== undefined
        ? { image: getAttribute(getFirstChildByTag(tileset, "image")!, "source") }
        : {})
    };
  });

  const imported = importTmjMapDocument(
    {
      name: deriveTemplateName(options.documentPath, String(objectRecord.name ?? "")),
      orientation: "orthogonal",
      width: 1,
      height: 1,
      tilewidth: 1,
      tileheight: 1,
      layers: [
        {
          type: "objectgroup",
          name: "Template",
          objects: [objectRecord]
        }
      ],
      ...(tilesetReferences.length > 0 ? { tilesets: tilesetReferences } : {})
    },
    options
  );
  const objectLayer = imported.map.layers.find((layer) => layer.kind === "object");
  const templateObject = objectLayer?.objects[0];

  if (!templateObject) {
    throw new Error("tx template import did not yield an object");
  }

  return {
    template: createObjectTemplate(imported.map.name, templateObject, []),
    tilesetReferences: tilesetReferences.map((reference) => ({
      firstGid: reference.firstgid,
      ...(reference.source !== undefined ? { source: reference.source } : {}),
      ...(reference.name !== undefined ? { name: reference.name } : {}),
      ...(reference.tilecount !== undefined ? { tileCount: reference.tilecount } : {}),
      ...(reference.image !== undefined ? { image: reference.image } : {})
    })),
    assetReferences: imported.assetReferences.map((reference) => ({
      ...reference,
      ownerPath: remapTmjPathToTx(reference.ownerPath)
    })),
    issues: [
      ...issues,
      ...imported.issues.map((issue) => ({
        severity: issue.severity,
        code: remapTmjCodeToTx(issue.code),
        message: issue.message,
        path: remapTmjPathToTx(issue.path)
      }))
    ]
  };
}

export function stringifyTxTemplateDocument(
  input: ExportTxTemplateDocumentInput
): string {
  const templateTile = input.template.object.tile;
  const exportedTileGid =
    input.template.object.shape === "tile" && templateTile
      ? templateTile.tileId !== undefined
        ? templateTile.tileId + 1
        : templateTile.gid
      : undefined;

  if (input.template.object.shape === "tile" && templateTile && !input.tilesetSource) {
    throw new Error("tx export requires tilesetSource for tile template objects");
  }

  if (input.template.object.shape === "tile" && templateTile && exportedTileGid === undefined) {
    throw new Error("tx export requires tile template objects to resolve to a local tile gid");
  }

  const templateObject =
    input.template.object.shape === "tile" && templateTile
      ? {
          ...input.template.object,
          tile: {
            ...templateTile,
            ...(exportedTileGid !== undefined ? { gid: exportedTileGid } : {})
          }
        }
      : input.template.object;

  const map = createMap({
    name: input.template.name,
    orientation: "orthogonal",
    width: 1,
    height: 1,
    tileWidth: 1,
    tileHeight: 1,
    layers: [
      createObjectLayer({
        name: "Template",
        objects: [templateObject]
      })
    ]
  });
  const serializedMap = stringifyTmxMapDocument({
    map,
    ...(input.tilesetSource !== undefined
      ? {
          tilesetReferences: [
            {
              firstGid: 1,
              source: input.tilesetSource
            }
          ]
        }
      : {}),
    formatVersion: input.formatVersion ?? TX_FORMAT_VERSION,
    tiledVersion: input.tiledVersion ?? TX_FORMAT_VERSION
  });
  const mapDocument = parseXmlDocument(serializedMap);
  const mapRoot = mapDocument.documentElement;
  const serializer = new XMLSerializer();
  const tilesetXml = getElementChildren(mapRoot)
    .filter((child) => child.tagName === "tileset")
    .map((child) => serializer.serializeToString(child))
    .join("\n");
  const objectGroup = getFirstChildByTag(mapRoot, "objectgroup");
  const objectElement = objectGroup ? getFirstChildByTag(objectGroup, "object") : undefined;

  if (!objectElement) {
    throw new Error("tx export requires a template object");
  }

  const objectXml = serializer.serializeToString(objectElement);

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    "<template>",
    ...(tilesetXml ? [tilesetXml] : []),
    objectXml,
    "</template>"
  ].join("\n");
}

export const exportTxTemplateDocument = stringifyTxTemplateDocument;
