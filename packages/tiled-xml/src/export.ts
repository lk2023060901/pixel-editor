import { exportTmjMapDocument, type TmjJsonObject, type TmjJsonValue } from "@pixel-editor/tiled-json";

import type { ExportTmxMapDocumentInput } from "./types";

type XmlAttributes = Record<string, string | number | undefined>;

const TMX_FORMAT_VERSION = "1.11";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

function serializeProperty(
  property: TmjJsonObject,
  level: number
): string[] {
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

function formatCsvData(data: readonly number[]): string {
  return data.join(",");
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

function serializeChunk(chunk: TmjJsonObject, level: number): string[] {
  const data = Array.isArray(chunk.data) ? (chunk.data as number[]) : [];
  const lines = [
    createElementLine(
      "chunk",
      {
        x: typeof chunk.x === "number" ? chunk.x : 0,
        y: typeof chunk.y === "number" ? chunk.y : 0,
        width: typeof chunk.width === "number" ? chunk.width : 0,
        height: typeof chunk.height === "number" ? chunk.height : 0
      },
      level,
      false
    ),
    `${" ".repeat(level + 1)}${escapeXmlText(formatCsvData(data))}`,
    closeElementLine("chunk", level)
  ];

  return lines;
}

function serializeDataElement(layer: TmjJsonObject, level: number): string[] {
  const chunkData = Array.isArray(layer.chunks)
    ? (layer.chunks as TmjJsonObject[])
    : undefined;

  if (chunkData && chunkData.length > 0) {
    const lines = [createElementLine("data", { encoding: "csv" }, level, false)];

    for (const chunk of chunkData) {
      lines.push(...serializeChunk(chunk, level + 1));
    }

    lines.push(closeElementLine("data", level));
    return lines;
  }

  const data = Array.isArray(layer.data) ? (layer.data as number[]) : [];
  return [
    createElementLine("data", { encoding: "csv" }, level, false),
    `${" ".repeat(level + 1)}${escapeXmlText(formatCsvData(data))}`,
    closeElementLine("data", level)
  ];
}

function serializeLayerBaseAttributes(layer: TmjJsonObject): XmlAttributes {
  return {
    ...(typeof layer.id === "number" ? { id: layer.id } : {}),
    ...(typeof layer.name === "string" ? { name: layer.name } : {}),
    ...(typeof layer.class === "string" ? { class: layer.class } : {}),
    visible: typeof layer.visible === "boolean" ? (layer.visible ? 1 : 0) : 1,
    ...(layer.locked === true ? { locked: 1 } : {}),
    ...(typeof layer.opacity === "number" ? { opacity: layer.opacity } : {}),
    ...(typeof layer.offsetx === "number" && layer.offsetx !== 0 ? { offsetx: layer.offsetx } : {}),
    ...(typeof layer.offsety === "number" && layer.offsety !== 0 ? { offsety: layer.offsety } : {}),
    ...(typeof layer.parallaxx === "number" && layer.parallaxx !== 1 ? { parallaxx: layer.parallaxx } : {}),
    ...(typeof layer.parallaxy === "number" && layer.parallaxy !== 1 ? { parallaxy: layer.parallaxy } : {}),
    ...(typeof layer.tintcolor === "string" ? { tintcolor: layer.tintcolor } : {}),
    ...(typeof layer.mode === "string" ? { mode: layer.mode } : {})
  };
}

function serializeLayer(
  layer: TmjJsonObject,
  mapWidth: number,
  mapHeight: number,
  level: number
): string[] {
  const properties = Array.isArray(layer.properties)
    ? (layer.properties as TmjJsonObject[])
    : undefined;

  switch (layer.type) {
    case "tilelayer": {
      const hasChunks = Array.isArray(layer.chunks) && layer.chunks.length > 0;
      const lines = [
        createElementLine(
          "layer",
          {
            ...serializeLayerBaseAttributes(layer),
            width: hasChunks ? mapWidth : typeof layer.width === "number" ? layer.width : mapWidth,
            height: hasChunks ? mapHeight : typeof layer.height === "number" ? layer.height : mapHeight
          },
          level,
          false
        )
      ];

      lines.push(...serializeProperties(properties, level + 1));
      lines.push(...serializeDataElement(layer, level + 1));
      lines.push(closeElementLine("layer", level));

      return lines;
    }
    case "objectgroup": {
      const objects = Array.isArray(layer.objects) ? (layer.objects as TmjJsonObject[]) : [];
      const lines = [
        createElementLine(
          "objectgroup",
          {
            ...serializeLayerBaseAttributes(layer),
            ...(typeof layer.draworder === "string" ? { draworder: layer.draworder } : {})
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
    case "imagelayer": {
      const lines = [createElementLine("imagelayer", serializeLayerBaseAttributes(layer), level, false)];

      lines.push(...serializeProperties(properties, level + 1));
      lines.push(
        createElementLine(
          "image",
          {
            ...(typeof layer.image === "string" ? { source: layer.image } : {}),
            ...(typeof layer.imagewidth === "number" ? { width: layer.imagewidth } : {}),
            ...(typeof layer.imageheight === "number" ? { height: layer.imageheight } : {}),
            ...(typeof layer.transparentcolor === "string" ? { trans: layer.transparentcolor } : {})
          },
          level + 1
        )
      );
      if (layer.repeatx === true || layer.repeaty === true) {
        lines[0] = createElementLine(
          "imagelayer",
          {
            ...serializeLayerBaseAttributes(layer),
            ...(layer.repeatx === true ? { repeatx: 1 } : {}),
            ...(layer.repeaty === true ? { repeaty: 1 } : {})
          },
          level,
          false
        );
      }
      lines.push(closeElementLine("imagelayer", level));

      return lines;
    }
    case "group": {
      const childLayers = Array.isArray(layer.layers) ? (layer.layers as TmjJsonObject[]) : [];
      const lines = [createElementLine("group", serializeLayerBaseAttributes(layer), level, false)];

      lines.push(...serializeProperties(properties, level + 1));
      for (const child of childLayers) {
        lines.push(...serializeLayer(child, mapWidth, mapHeight, level + 1));
      }
      lines.push(closeElementLine("group", level));

      return lines;
    }
    default:
      return [];
  }
}

function serializeTilesetReference(
  reference: TmjJsonObject,
  mapTileWidth: number,
  mapTileHeight: number,
  level: number
): string[] {
  if (typeof reference.source === "string") {
    return [
      createElementLine(
        "tileset",
        {
          firstgid: typeof reference.firstgid === "number" ? reference.firstgid : 1,
          source: reference.source
        },
        level
      )
    ];
  }

  const lines = [
    createElementLine(
      "tileset",
      {
        firstgid: typeof reference.firstgid === "number" ? reference.firstgid : 1,
        ...(typeof reference.name === "string" ? { name: reference.name } : {}),
        tilewidth: mapTileWidth,
        tileheight: mapTileHeight,
        ...(typeof reference.tilecount === "number" ? { tilecount: reference.tilecount } : {}),
        columns: 0
      },
      level,
      false
    )
  ];

  if (typeof reference.image === "string") {
    lines.push(createElementLine("image", { source: reference.image }, level + 1));
  }

  lines.push(closeElementLine("tileset", level));
  return lines;
}

export function stringifyTmxMapDocument(input: ExportTmxMapDocumentInput): string {
  const document = exportTmjMapDocument({
    map: input.map,
    ...(input.tilesetReferences !== undefined
      ? { tilesetReferences: input.tilesetReferences }
      : {}),
    formatVersion: input.formatVersion ?? TMX_FORMAT_VERSION,
    tiledVersion: input.tiledVersion ?? TMX_FORMAT_VERSION,
    resolveObjectTypesAndProperties: input.resolveObjectTypesAndProperties ?? false
  });
  const properties = Array.isArray(document.properties)
    ? (document.properties as TmjJsonObject[])
    : undefined;
  const tilesets = Array.isArray(document.tilesets)
    ? (document.tilesets as TmjJsonObject[])
    : [];
  const layers = Array.isArray(document.layers)
    ? (document.layers as TmjJsonObject[])
    : [];
  const mapWidth = typeof document.width === "number" ? document.width : input.map.settings.width;
  const mapHeight = typeof document.height === "number" ? document.height : input.map.settings.height;
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    createElementLine(
      "map",
      {
        version: typeof document.version === "string" ? document.version : TMX_FORMAT_VERSION,
        tiledversion:
          typeof document.tiledversion === "string" ? document.tiledversion : TMX_FORMAT_VERSION,
        orientation: typeof document.orientation === "string" ? document.orientation : input.map.settings.orientation,
        ...(typeof document.renderorder === "string" ? { renderorder: document.renderorder } : {}),
        width: mapWidth,
        height: mapHeight,
        tilewidth:
          typeof document.tilewidth === "number" ? document.tilewidth : input.map.settings.tileWidth,
        tileheight:
          typeof document.tileheight === "number" ? document.tileheight : input.map.settings.tileHeight,
        infinite: document.infinite === true ? 1 : 0,
        ...(typeof document.nextlayerid === "number" ? { nextlayerid: document.nextlayerid } : {}),
        ...(typeof document.nextobjectid === "number" ? { nextobjectid: document.nextobjectid } : {}),
        ...(typeof document.compressionlevel === "number"
          ? { compressionlevel: document.compressionlevel }
          : {}),
        ...(typeof document.hexsidelength === "number" ? { hexsidelength: document.hexsidelength } : {}),
        ...(typeof document.staggeraxis === "string" ? { staggeraxis: document.staggeraxis } : {}),
        ...(typeof document.staggerindex === "string" ? { staggerindex: document.staggerindex } : {}),
        ...(typeof document.parallaxoriginx === "number" && document.parallaxoriginx !== 0
          ? { parallaxoriginx: document.parallaxoriginx }
          : {}),
        ...(typeof document.parallaxoriginy === "number" && document.parallaxoriginy !== 0
          ? { parallaxoriginy: document.parallaxoriginy }
          : {}),
        ...(typeof document.backgroundcolor === "string"
          ? { backgroundcolor: document.backgroundcolor }
          : {})
      },
      0,
      false
    )
  ];

  lines.push(...serializeProperties(properties, 1));
  for (const tileset of tilesets) {
    lines.push(
      ...serializeTilesetReference(
        tileset,
        typeof document.tilewidth === "number" ? document.tilewidth : input.map.settings.tileWidth,
        typeof document.tileheight === "number" ? document.tileheight : input.map.settings.tileHeight,
        1
      )
    );
  }
  for (const layer of layers) {
    lines.push(...serializeLayer(layer, mapWidth, mapHeight, 1));
  }
  lines.push(closeElementLine("map", 0));

  return `${lines.join("\n")}\n`;
}

export function exportTmxMapDocument(input: ExportTmxMapDocumentInput): string {
  return stringifyTmxMapDocument(input);
}
