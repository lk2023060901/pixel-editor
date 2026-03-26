import { DOMParser } from "@xmldom/xmldom";
import {
  exportTsjTilesetDocument,
  importTsjTilesetDocument,
  type TmjJsonObject,
  type TmjJsonValue
} from "@pixel-editor/tiled-json";

import type {
  ExportTsxTilesetDocumentInput,
  ImportedTsxTilesetDocument,
  TsxImportIssue
} from "./types";

type XmlRecord = Record<string, unknown>;
type XmlAttributes = Record<string, string | number | undefined>;

const TSX_FORMAT_VERSION = "1.11";

function appendIssue(
  issues: TsxImportIssue[],
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
  issues: TsxImportIssue[],
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
      "tsx.property.classMembersMissing",
      `Class property \`${name}\` is missing nested members and was normalized to an empty object.`
    );
    record.value = {};
  }

  return record;
}

function parsePropertiesContainer(
  node: Element,
  issues: TsxImportIssue[],
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

function parseObjectElement(
  node: Element,
  issues: TsxImportIssue[],
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

function parseObjectGroupElement(
  node: Element,
  issues: TsxImportIssue[],
  path: string
): XmlRecord {
  const record: XmlRecord = {
    type: "objectgroup",
    name: getAttribute(node, "name") ?? "",
    visible: getBooleanAttribute(node, "visible") ?? true,
    locked: getBooleanAttribute(node, "locked") ?? false,
    opacity: getNumberAttribute(node, "opacity") ?? 1,
    offsetx: getNumberAttribute(node, "offsetx") ?? 0,
    offsety: getNumberAttribute(node, "offsety") ?? 0,
    parallaxx: getNumberAttribute(node, "parallaxx") ?? 1,
    parallaxy: getNumberAttribute(node, "parallaxy") ?? 1,
    draworder: getAttribute(node, "draworder") ?? "topdown",
    objects: getElementChildrenByTag(node, "object").map((object, index) =>
      parseObjectElement(object, issues, `${path}.objects[${index}]`)
    )
  };
  const className = getAttribute(node, "class");
  const tintColor = getAttribute(node, "tintcolor");
  const mode = getAttribute(node, "mode");
  const properties = parsePropertiesContainer(node, issues, path);

  if (className !== undefined) {
    record.class = className;
  }

  if (tintColor !== undefined) {
    record.tintcolor = tintColor;
  }

  if (mode !== undefined) {
    record.mode = mode;
  }

  if (properties.length > 0) {
    record.properties = properties;
  }

  return record;
}

function parseAnimationElement(node: Element): XmlRecord[] {
  return getElementChildrenByTag(node, "frame").map((frame) => ({
    tileid: getNumberAttribute(frame, "tileid") ?? 0,
    duration: getNumberAttribute(frame, "duration") ?? 0
  }));
}

function inferWangSetType(node: Element): "corner" | "edge" | "mixed" {
  const explicitType = getAttribute(node, "type");

  if (explicitType === "corner" || explicitType === "edge" || explicitType === "mixed") {
    return explicitType;
  }

  const hasCornerColors = getElementChildrenByTag(node, "wangcornercolor").length > 0;
  const hasEdgeColors = getElementChildrenByTag(node, "wangedgecolor").length > 0;
  const hasGenericColors = getElementChildrenByTag(node, "wangcolor").length > 0;

  if (hasCornerColors && hasEdgeColors) {
    return "mixed";
  }

  if (hasCornerColors) {
    return "corner";
  }

  if (hasEdgeColors) {
    return "edge";
  }

  if (hasGenericColors) {
    return "mixed";
  }

  return "mixed";
}

function parseWangSetElement(node: Element): XmlRecord {
  const colorElements = [
    ...getElementChildrenByTag(node, "wangcolor"),
    ...getElementChildrenByTag(node, "wangcornercolor"),
    ...getElementChildrenByTag(node, "wangedgecolor")
  ];

  return {
    name: getAttribute(node, "name") ?? "",
    type: inferWangSetType(node),
    colors: colorElements.map((color) => ({
      name: getAttribute(color, "name") ?? "",
      color: getAttribute(color, "color") ?? "",
      ...(getNumberAttribute(color, "tile") !== undefined
        ? { tile: getNumberAttribute(color, "tile") }
        : {}),
      ...(getNumberAttribute(color, "probability") !== undefined
        ? { probability: getNumberAttribute(color, "probability") }
        : {})
    })),
    wangtiles: getElementChildrenByTag(node, "wangtile").map((wangTile) => ({
      tileid: getNumberAttribute(wangTile, "tileid") ?? 0,
      wangid: getAttribute(wangTile, "wangid") ?? ""
    }))
  };
}

function escapeXmlText(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeXmlAttribute(value: string): string {
  return escapeXmlText(value)
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function formatAttributes(attributes: XmlAttributes): string {
  return Object.entries(attributes)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => ` ${key}="${escapeXmlAttribute(String(value))}"`)
    .join("");
}

function createElementLine(
  name: string,
  attributes: XmlAttributes,
  level: number,
  selfClosing = true
): string {
  const indent = " ".repeat(level);
  const suffix = selfClosing ? "/>" : ">";
  return `${indent}<${name}${formatAttributes(attributes)}${suffix}`;
}

function closeElementLine(name: string, level: number): string {
  return `${" ".repeat(level)}</${name}>`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function inferPropertyType(value: TmjJsonValue): "bool" | "int" | "float" | "string" | "class" {
  if (isRecord(value)) {
    return "class";
  }

  if (typeof value === "boolean") {
    return "bool";
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? "int" : "float";
  }

  return "string";
}

function formatPropertyScalarValue(type: string, value: TmjJsonValue): string {
  if (type === "bool") {
    return value === true ? "true" : "false";
  }

  if (type === "object") {
    return value === null ? "0" : String(value);
  }

  if (type === "int" || type === "float") {
    return value === null ? "0" : String(value);
  }

  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }

  if (value === null) {
    return "";
  }

  return String(value);
}

function serializeProperty(property: TmjJsonObject, level: number): string[] {
  const name = typeof property.name === "string" ? property.name : "";
  const value = property.value as TmjJsonValue;
  const propertyTypeName =
    typeof property.propertytype === "string" ? property.propertytype : undefined;
  const type =
    typeof property.type === "string"
      ? property.type
      : inferPropertyType(value);

  if (type === "class" && isRecord(value)) {
    const lines = [
      createElementLine(
        "property",
        {
          name,
          type,
          ...(propertyTypeName !== undefined ? { propertytype: propertyTypeName } : {})
        },
        level,
        false
      ),
      createElementLine("properties", {}, level + 1, false)
    ];

    for (const [memberName, memberValue] of Object.entries(value)) {
      lines.push(...serializeProperty({ name: memberName, value: memberValue }, level + 2));
    }

    lines.push(closeElementLine("properties", level + 1));
    lines.push(closeElementLine("property", level));
    return lines;
  }

  return [
    createElementLine(
      "property",
      {
        name,
        type,
        ...(propertyTypeName !== undefined ? { propertytype: propertyTypeName } : {}),
        value: formatPropertyScalarValue(type, value)
      },
      level
    )
  ];
}

function serializeProperties(
  properties: TmjJsonObject[] | undefined,
  level: number
): string[] {
  if (!properties || properties.length === 0) {
    return [];
  }

  const lines = [createElementLine("properties", {}, level, false)];

  for (const property of properties) {
    lines.push(...serializeProperty(property, level + 1));
  }

  lines.push(closeElementLine("properties", level));
  return lines;
}

function formatPolygonPoints(points: readonly TmjJsonObject[]): string {
  return points
    .map((point) => `${Number(point.x ?? 0)},${Number(point.y ?? 0)}`)
    .join(" ");
}

function serializeText(text: TmjJsonObject, level: number): string[] {
  const lines = [
    createElementLine(
      "text",
      {
        ...(typeof text.fontfamily === "string" ? { fontfamily: text.fontfamily } : {}),
        ...(typeof text.pixelsize === "number" ? { pixelsize: text.pixelsize } : {}),
        ...(typeof text.wrap === "boolean" ? { wrap: text.wrap ? 1 : 0 } : {}),
        ...(typeof text.color === "string" ? { color: text.color } : {})
      },
      level,
      false
    )
  ];

  lines.push(`${" ".repeat(level + 1)}${escapeXmlText(String(text.text ?? ""))}`);
  lines.push(closeElementLine("text", level));

  return lines;
}

function serializeObject(object: TmjJsonObject, level: number): string[] {
  const properties = Array.isArray(object.properties)
    ? (object.properties as TmjJsonObject[])
    : undefined;
  const lines = [
    createElementLine(
      "object",
      {
        ...(typeof object.id === "number" ? { id: object.id } : {}),
        ...(typeof object.name === "string" ? { name: object.name } : {}),
        ...(typeof object.type === "string" && object.type.length > 0 ? { type: object.type } : {}),
        ...(typeof object.gid === "number" ? { gid: object.gid } : {}),
        x: typeof object.x === "number" ? object.x : 0,
        y: typeof object.y === "number" ? object.y : 0,
        width: typeof object.width === "number" ? object.width : 0,
        height: typeof object.height === "number" ? object.height : 0,
        rotation: typeof object.rotation === "number" ? object.rotation : 0,
        visible: typeof object.visible === "boolean" ? (object.visible ? 1 : 0) : 1
      },
      level,
      false
    )
  ];

  lines.push(...serializeProperties(properties, level + 1));

  if (object.ellipse === true) {
    lines.push(createElementLine("ellipse", {}, level + 1));
  } else if (object.point === true) {
    lines.push(createElementLine("point", {}, level + 1));
  } else if (Array.isArray(object.polygon)) {
    lines.push(
      createElementLine(
        "polygon",
        {
          points: formatPolygonPoints(object.polygon as TmjJsonObject[])
        },
        level + 1
      )
    );
  } else if (Array.isArray(object.polyline)) {
    lines.push(
      createElementLine(
        "polyline",
        {
          points: formatPolygonPoints(object.polyline as TmjJsonObject[])
        },
        level + 1
      )
    );
  } else if (isRecord(object.text)) {
    lines.push(...serializeText(object.text as TmjJsonObject, level + 1));
  }

  lines.push(closeElementLine("object", level));
  return lines;
}

function serializeObjectGroup(group: TmjJsonObject, level: number): string[] {
  const objects = Array.isArray(group.objects) ? (group.objects as TmjJsonObject[]) : [];
  const properties = Array.isArray(group.properties)
    ? (group.properties as TmjJsonObject[])
    : undefined;
  const lines = [
    createElementLine(
      "objectgroup",
      {
        ...(typeof group.name === "string" && group.name.length > 0 ? { name: group.name } : {}),
        ...(typeof group.class === "string" ? { class: group.class } : {}),
        visible: typeof group.visible === "boolean" ? (group.visible ? 1 : 0) : 1,
        ...(group.locked === true ? { locked: 1 } : {}),
        ...(typeof group.opacity === "number" ? { opacity: group.opacity } : {}),
        ...(typeof group.offsetx === "number" && group.offsetx !== 0 ? { offsetx: group.offsetx } : {}),
        ...(typeof group.offsety === "number" && group.offsety !== 0 ? { offsety: group.offsety } : {}),
        ...(typeof group.parallaxx === "number" && group.parallaxx !== 1 ? { parallaxx: group.parallaxx } : {}),
        ...(typeof group.parallaxy === "number" && group.parallaxy !== 1 ? { parallaxy: group.parallaxy } : {}),
        ...(typeof group.tintcolor === "string" ? { tintcolor: group.tintcolor } : {}),
        ...(typeof group.mode === "string" ? { mode: group.mode } : {}),
        ...(typeof group.draworder === "string" ? { draworder: group.draworder } : {})
      },
      level,
      false
    )
  ];

  lines.push(...serializeProperties(properties, level + 1));

  for (const object of objects) {
    lines.push(...serializeObject(object, level + 1));
  }

  lines.push(closeElementLine("objectgroup", level));
  return lines;
}

function serializeAnimation(animation: TmjJsonObject[], level: number): string[] {
  const lines = [createElementLine("animation", {}, level, false)];

  for (const frame of animation) {
    lines.push(
      createElementLine(
        "frame",
        {
          tileid: typeof frame.tileid === "number" ? frame.tileid : 0,
          duration: typeof frame.duration === "number" ? frame.duration : 0
        },
        level + 1
      )
    );
  }

  lines.push(closeElementLine("animation", level));
  return lines;
}

function serializeTile(tile: TmjJsonObject, level: number): string[] {
  const properties = Array.isArray(tile.properties)
    ? (tile.properties as TmjJsonObject[])
    : undefined;
  const animation = Array.isArray(tile.animation)
    ? (tile.animation as TmjJsonObject[])
    : undefined;
  const objectGroup = isRecord(tile.objectgroup) ? (tile.objectgroup as TmjJsonObject) : undefined;
  const hasChildren =
    Boolean(properties?.length) ||
    typeof tile.image === "string" ||
    Boolean(animation?.length) ||
    objectGroup !== undefined;

  if (!hasChildren) {
    return [
      createElementLine(
        "tile",
        {
          id: typeof tile.id === "number" ? tile.id : 0,
          ...(typeof tile.type === "string" && tile.type.length > 0 ? { type: tile.type } : {}),
          ...(typeof tile.probability === "number" && tile.probability !== 1
            ? { probability: tile.probability }
            : {})
        },
        level
      )
    ];
  }

  const lines = [
    createElementLine(
      "tile",
      {
        id: typeof tile.id === "number" ? tile.id : 0,
        ...(typeof tile.type === "string" && tile.type.length > 0 ? { type: tile.type } : {}),
        ...(typeof tile.probability === "number" && tile.probability !== 1
          ? { probability: tile.probability }
          : {})
      },
      level,
      false
    )
  ];

  lines.push(...serializeProperties(properties, level + 1));

  if (typeof tile.image === "string") {
    lines.push(createElementLine("image", { source: tile.image }, level + 1));
  }

  if (animation && animation.length > 0) {
    lines.push(...serializeAnimation(animation, level + 1));
  }

  if (objectGroup) {
    lines.push(...serializeObjectGroup(objectGroup, level + 1));
  }

  lines.push(closeElementLine("tile", level));
  return lines;
}

function serializeWangSet(wangSet: TmjJsonObject, level: number): string[] {
  const colors = Array.isArray(wangSet.colors) ? (wangSet.colors as TmjJsonObject[]) : [];
  const wangTiles = Array.isArray(wangSet.wangtiles) ? (wangSet.wangtiles as TmjJsonObject[]) : [];
  const hasChildren = colors.length > 0 || wangTiles.length > 0;

  if (!hasChildren) {
    return [
      createElementLine(
        "wangset",
        {
          ...(typeof wangSet.name === "string" ? { name: wangSet.name } : {}),
          ...(typeof wangSet.type === "string" ? { type: wangSet.type } : {})
        },
        level
      )
    ];
  }

  const lines = [
    createElementLine(
      "wangset",
      {
        ...(typeof wangSet.name === "string" ? { name: wangSet.name } : {}),
        ...(typeof wangSet.type === "string" ? { type: wangSet.type } : {})
      },
      level,
      false
    )
  ];

  for (const color of colors) {
    lines.push(
      createElementLine(
        "wangcolor",
        {
          ...(typeof color.name === "string" ? { name: color.name } : {}),
          ...(typeof color.color === "string" ? { color: color.color } : {}),
          ...(typeof color.tile === "number" ? { tile: color.tile } : {}),
          ...(typeof color.probability === "number" ? { probability: color.probability } : {})
        },
        level + 1
      )
    );
  }

  for (const wangTile of wangTiles) {
    lines.push(
      createElementLine(
        "wangtile",
        {
          ...(typeof wangTile.tileid === "number" ? { tileid: wangTile.tileid } : {}),
          ...(typeof wangTile.wangid === "string" ? { wangid: wangTile.wangid } : {})
        },
        level + 1
      )
    );
  }

  lines.push(closeElementLine("wangset", level));
  return lines;
}

function toImportedTsxTilesetDocument(
  result: ReturnType<typeof importTsjTilesetDocument>
): ImportedTsxTilesetDocument {
  return {
    tileset: result.tileset,
    issues: result.issues.map((issue) => ({
      severity: issue.severity,
      code: issue.code,
      message: issue.message,
      path: issue.path
    }))
  };
}

export function importTsxTilesetDocument(input: string): ImportedTsxTilesetDocument {
  const document = parseXmlDocument(input);
  const root = document.documentElement;

  if (!root || root.tagName !== "tileset") {
    throw new Error("tsx root element must be <tileset>");
  }

  const issues: TsxImportIssue[] = [];
  const tsjLikeDocument: XmlRecord = {
    type: "tileset",
    ...(getAttribute(root, "version") !== undefined ? { version: getAttribute(root, "version") } : {}),
    ...(getAttribute(root, "tiledversion") !== undefined
      ? { tiledversion: getAttribute(root, "tiledversion") }
      : {}),
    name: requireAttribute(root, "name", "tsx"),
    tilewidth: getNumberAttribute(root, "tilewidth") ?? 0,
    tileheight: getNumberAttribute(root, "tileheight") ?? 0,
    ...(getNumberAttribute(root, "spacing") !== undefined ? { spacing: getNumberAttribute(root, "spacing") } : {}),
    ...(getNumberAttribute(root, "margin") !== undefined ? { margin: getNumberAttribute(root, "margin") } : {}),
    ...(getNumberAttribute(root, "tilecount") !== undefined
      ? { tilecount: getNumberAttribute(root, "tilecount") }
      : {}),
    ...(getNumberAttribute(root, "columns") !== undefined ? { columns: getNumberAttribute(root, "columns") } : {}),
    ...(getAttribute(root, "class") !== undefined ? { class: getAttribute(root, "class") } : {}),
    ...(getAttribute(root, "backgroundcolor") !== undefined
      ? { backgroundcolor: getAttribute(root, "backgroundcolor") }
      : {}),
    ...(getAttribute(root, "objectalignment") !== undefined
      ? { objectalignment: getAttribute(root, "objectalignment") }
      : {}),
    ...(getAttribute(root, "tilerendersize") !== undefined
      ? { tilerendersize: getAttribute(root, "tilerendersize") }
      : {}),
    ...(getAttribute(root, "fillmode") !== undefined ? { fillmode: getAttribute(root, "fillmode") } : {})
  };
  const properties = parsePropertiesContainer(root, issues, "tsx");
  const image = getFirstChildByTag(root, "image");
  const tileOffset = getFirstChildByTag(root, "tileoffset");
  const grid = getFirstChildByTag(root, "grid");
  const transformations = getFirstChildByTag(root, "transformations");
  const tiles = getElementChildrenByTag(root, "tile").map((tile, index) => {
    const record: XmlRecord = {
      id: getNumberAttribute(tile, "id") ?? index
    };
    const typeName = getAttribute(tile, "type");
    const className = getAttribute(tile, "class");
    const probability = getNumberAttribute(tile, "probability");
    const tileProperties = parsePropertiesContainer(tile, issues, `tsx.tiles[${index}]`);
    const tileImage = getFirstChildByTag(tile, "image");
    const animation = getFirstChildByTag(tile, "animation");
    const objectGroup = getFirstChildByTag(tile, "objectgroup");

    if (typeName !== undefined) {
      record.type = typeName;
    }

    if (className !== undefined) {
      record.class = className;
    }

    if (probability !== undefined) {
      record.probability = probability;
    }

    if (tileProperties.length > 0) {
      record.properties = tileProperties;
    }

    if (tileImage && getAttribute(tileImage, "source") !== undefined) {
      record.image = getAttribute(tileImage, "source");
    }

    if (animation) {
      record.animation = parseAnimationElement(animation);
    }

    if (objectGroup) {
      record.objectgroup = parseObjectGroupElement(objectGroup, issues, `tsx.tiles[${index}].objectgroup`);
    }

    return record;
  });
  const wangSetsContainer = getFirstChildByTag(root, "wangsets");
  const terrainTypes = getFirstChildByTag(root, "terraintypes");

  if (properties.length > 0) {
    tsjLikeDocument.properties = properties;
  }

  if (image) {
    const imageSource = getAttribute(image, "source");

    if (imageSource !== undefined) {
      tsjLikeDocument.image = imageSource;
    }

    if (getNumberAttribute(image, "width") !== undefined) {
      tsjLikeDocument.imagewidth = getNumberAttribute(image, "width");
    }

    if (getNumberAttribute(image, "height") !== undefined) {
      tsjLikeDocument.imageheight = getNumberAttribute(image, "height");
    }
  }

  if (tileOffset) {
    tsjLikeDocument.tileoffset = {
      x: getNumberAttribute(tileOffset, "x") ?? 0,
      y: getNumberAttribute(tileOffset, "y") ?? 0
    };
  }

  if (grid) {
    tsjLikeDocument.grid = {
      ...(getAttribute(grid, "orientation") !== undefined
        ? { orientation: getAttribute(grid, "orientation") }
        : {}),
      ...(getNumberAttribute(grid, "width") !== undefined ? { width: getNumberAttribute(grid, "width") } : {}),
      ...(getNumberAttribute(grid, "height") !== undefined
        ? { height: getNumberAttribute(grid, "height") }
        : {})
    };
  }

  if (transformations) {
    tsjLikeDocument.transformations = {
      ...(getBooleanAttribute(transformations, "hflip") !== undefined
        ? { hflip: getBooleanAttribute(transformations, "hflip") }
        : {}),
      ...(getBooleanAttribute(transformations, "vflip") !== undefined
        ? { vflip: getBooleanAttribute(transformations, "vflip") }
        : {}),
      ...(getBooleanAttribute(transformations, "rotate") !== undefined
        ? { rotate: getBooleanAttribute(transformations, "rotate") }
        : {}),
      ...(getBooleanAttribute(transformations, "preferuntransformed") !== undefined
        ? { preferuntransformed: getBooleanAttribute(transformations, "preferuntransformed") }
        : {})
    };
  }

  if (tiles.length > 0) {
    tsjLikeDocument.tiles = tiles;
  }

  if (wangSetsContainer) {
    tsjLikeDocument.wangsets = getElementChildrenByTag(wangSetsContainer, "wangset").map((wangSet) =>
      parseWangSetElement(wangSet)
    );
  }

  if (terrainTypes) {
    appendIssue(
      issues,
      "tsx.terraintypes",
      "tsx.terrainTypesUnsupported",
      "Legacy terrain types are not represented by the current domain model and were skipped."
    );
  }

  const imported = toImportedTsxTilesetDocument(importTsjTilesetDocument(tsjLikeDocument));

  return {
    ...imported,
    issues: [...issues, ...imported.issues]
  };
}

export function stringifyTsxTilesetDocument(input: ExportTsxTilesetDocumentInput): string {
  const document = exportTsjTilesetDocument({
    tileset: input.tileset,
    formatVersion: input.formatVersion ?? TSX_FORMAT_VERSION,
    tiledVersion: input.tiledVersion ?? TSX_FORMAT_VERSION
  });
  const properties = Array.isArray(document.properties)
    ? (document.properties as TmjJsonObject[])
    : undefined;
  const tiles = Array.isArray(document.tiles)
    ? (document.tiles as TmjJsonObject[])
    : [];
  const wangSets = Array.isArray(document.wangsets)
    ? (document.wangsets as TmjJsonObject[])
    : [];
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    createElementLine(
      "tileset",
      {
        version: typeof document.version === "string" ? document.version : TSX_FORMAT_VERSION,
        tiledversion:
          typeof document.tiledversion === "string" ? document.tiledversion : TSX_FORMAT_VERSION,
        name: typeof document.name === "string" ? document.name : input.tileset.name,
        tilewidth:
          typeof document.tilewidth === "number" ? document.tilewidth : input.tileset.tileWidth,
        tileheight:
          typeof document.tileheight === "number" ? document.tileheight : input.tileset.tileHeight,
        ...(typeof document.spacing === "number" ? { spacing: document.spacing } : {}),
        ...(typeof document.margin === "number" ? { margin: document.margin } : {}),
        ...(typeof document.tilecount === "number" ? { tilecount: document.tilecount } : {}),
        ...(typeof document.columns === "number" ? { columns: document.columns } : {}),
        ...(typeof document.objectalignment === "string"
          ? { objectalignment: document.objectalignment }
          : {}),
        ...(typeof document.tilerendersize === "string"
          ? { tilerendersize: document.tilerendersize }
          : {}),
        ...(typeof document.fillmode === "string" ? { fillmode: document.fillmode } : {})
      },
      0,
      false
    )
  ];

  if (isRecord(document.tileoffset)) {
    lines.push(
      createElementLine(
        "tileoffset",
        {
          ...(typeof document.tileoffset.x === "number" ? { x: document.tileoffset.x } : {}),
          ...(typeof document.tileoffset.y === "number" ? { y: document.tileoffset.y } : {})
        },
        1
      )
    );
  }

  if (typeof document.image === "string") {
    lines.push(
      createElementLine(
        "image",
        {
          source: document.image,
          ...(typeof document.imagewidth === "number" ? { width: document.imagewidth } : {}),
          ...(typeof document.imageheight === "number" ? { height: document.imageheight } : {})
        },
        1
      )
    );
  }

  lines.push(...serializeProperties(properties, 1));

  for (const tile of tiles) {
    lines.push(...serializeTile(tile, 1));
  }

  if (wangSets.length > 0) {
    lines.push(createElementLine("wangsets", {}, 1, false));

    for (const wangSet of wangSets) {
      lines.push(...serializeWangSet(wangSet, 2));
    }

    lines.push(closeElementLine("wangsets", 1));
  }

  lines.push(closeElementLine("tileset", 0));

  return `${lines.join("\n")}\n`;
}

export function exportTsxTilesetDocument(input: ExportTsxTilesetDocumentInput): string {
  return stringifyTsxTilesetDocument(input);
}
