import type { AssetReferenceDescriptor } from "@pixel-editor/asset-reference";

import type { TmxImportIssue, TsxImportIssue } from "./types";

type ImportIssue = TmxImportIssue | TsxImportIssue;
type SourceKind = "tmx" | "tsx";

const COMMON_LAYER_ATTRIBUTES = new Set([
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
  "x",
  "y"
]);

const TMX_MAP_ATTRIBUTES = new Set([
  "version",
  "tiledversion",
  "class",
  "orientation",
  "renderorder",
  "compressionlevel",
  "width",
  "height",
  "tilewidth",
  "tileheight",
  "hexsidelength",
  "staggeraxis",
  "staggerindex",
  "parallaxoriginx",
  "parallaxoriginy",
  "backgroundcolor",
  "nextlayerid",
  "nextobjectid",
  "infinite",
  "name"
]);

const TMX_MAP_CHILDREN = new Set([
  "properties",
  "tileset",
  "layer",
  "objectgroup",
  "imagelayer",
  "group",
  "editorsettings"
]);

const TILESET_ATTRIBUTES = new Set([
  "version",
  "tiledversion",
  "firstgid",
  "source",
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
  "fillmode"
]);

const TILESET_CHILDREN = new Set([
  "image",
  "tileoffset",
  "grid",
  "properties",
  "tile",
  "wangsets",
  "terraintypes",
  "transformations"
]);

const TILE_LAYER_ATTRIBUTES = new Set([
  ...COMMON_LAYER_ATTRIBUTES,
  "width",
  "height"
]);

const TILE_LAYER_CHILDREN = new Set(["properties", "data"]);

const OBJECT_LAYER_ATTRIBUTES = new Set([
  ...COMMON_LAYER_ATTRIBUTES,
  "draworder",
  "color"
]);

const OBJECT_LAYER_CHILDREN = new Set(["properties", "object"]);

const IMAGE_LAYER_ATTRIBUTES = new Set([
  ...COMMON_LAYER_ATTRIBUTES,
  "repeatx",
  "repeaty"
]);

const IMAGE_LAYER_CHILDREN = new Set(["properties", "image"]);

const GROUP_LAYER_ATTRIBUTES = new Set([...COMMON_LAYER_ATTRIBUTES]);
const GROUP_LAYER_CHILDREN = new Set(["properties", "layer", "objectgroup", "imagelayer", "group"]);

const OBJECT_ATTRIBUTES = new Set([
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
  "template"
]);

const OBJECT_CHILDREN = new Set([
  "properties",
  "ellipse",
  "point",
  "polygon",
  "polyline",
  "text"
]);

const TEXT_ATTRIBUTES = new Set([
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

const PROPERTY_ATTRIBUTES = new Set(["name", "type", "propertytype", "value"]);
const PROPERTY_CHILDREN = new Set(["properties"]);
const IMAGE_ATTRIBUTES = new Set(["source", "width", "height", "trans"]);
const DATA_ATTRIBUTES = new Set(["encoding", "compression"]);
const DATA_CHILDREN = new Set(["chunk", "tile"]);
const CHUNK_ATTRIBUTES = new Set(["x", "y", "width", "height", "encoding", "compression"]);
const CHUNK_CHILDREN = new Set(["tile"]);
const TILE_ATTRIBUTES = new Set(["id", "type", "class", "probability", "x", "y", "width", "height"]);
const TILE_CHILDREN = new Set(["properties", "image", "animation", "objectgroup"]);
const ANIMATION_CHILDREN = new Set(["frame"]);
const FRAME_ATTRIBUTES = new Set(["tileid", "duration"]);
const TILE_OFFSET_ATTRIBUTES = new Set(["x", "y"]);
const GRID_ATTRIBUTES = new Set(["orientation", "width", "height"]);
const TRANSFORMATION_ATTRIBUTES = new Set(["hflip", "vflip", "rotate", "preferuntransformed"]);
const WANGSETS_CHILDREN = new Set(["wangset"]);
const WANGSET_ATTRIBUTES = new Set(["name", "class", "type"]);
const WANGSET_CHILDREN = new Set([
  "properties",
  "wangcolor",
  "wangcornercolor",
  "wangedgecolor",
  "wangtile"
]);
const WANGCOLOR_ATTRIBUTES = new Set(["name", "class", "color", "tile", "probability"]);
const WANGTILE_ATTRIBUTES = new Set(["tileid", "wangid"]);
const TERRAINTYPES_CHILDREN = new Set(["terrain"]);
const TERRAIN_ATTRIBUTES = new Set(["name", "tile"]);

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

function getAttributeNames(node: Element): string[] {
  const attributes: string[] = [];

  for (let index = 0; index < node.attributes.length; index += 1) {
    const attribute = node.attributes.item(index);

    if (attribute) {
      attributes.push(attribute.name);
    }
  }

  return attributes;
}

function appendUnknownAttributeIssues(
  source: SourceKind,
  path: string,
  node: Element,
  allowedAttributes: ReadonlySet<string>,
  issues: ImportIssue[]
): void {
  getAttributeNames(node)
    .filter((name) => !allowedAttributes.has(name))
    .sort((left, right) => left.localeCompare(right))
    .forEach((name) => {
      appendIssue(
        issues,
        `${path}.@${name}`,
        `${source}.attribute.unknown`,
        `Unknown ${source.toUpperCase()} attribute \`${name}\` was ignored during import.`
      );
    });
}

function appendUnknownChildElementIssues(
  source: SourceKind,
  path: string,
  node: Element,
  allowedChildren: ReadonlySet<string>,
  issues: ImportIssue[]
): void {
  getElementChildren(node)
    .filter((child) => !allowedChildren.has(child.tagName))
    .forEach((child, index) => {
      appendIssue(
        issues,
        `${path}.${child.tagName}[${index}]`,
        `${source}.element.unknown`,
        `Unknown ${source.toUpperCase()} element <${child.tagName}> was ignored during import.`
      );
    });
}

function inspectPropertyElement(
  source: SourceKind,
  node: Element,
  path: string,
  issues: ImportIssue[]
): void {
  appendUnknownAttributeIssues(source, path, node, PROPERTY_ATTRIBUTES, issues);
  appendUnknownChildElementIssues(source, path, node, PROPERTY_CHILDREN, issues);

  getElementChildren(node)
    .filter((child) => child.tagName === "properties")
    .forEach((propertiesNode) => {
      getElementChildren(propertiesNode).forEach((propertyNode, index) => {
        if (propertyNode.tagName === "property") {
          inspectPropertyElement(
            source,
            propertyNode,
            `${path}.properties[${index}]`,
            issues
          );
        } else {
          appendIssue(
            issues,
            `${path}.properties.${propertyNode.tagName}[${index}]`,
            `${source}.element.unknown`,
            `Unknown ${source.toUpperCase()} element <${propertyNode.tagName}> was ignored during import.`
          );
        }
      });
    });
}

function inspectObjectElement(
  source: SourceKind,
  node: Element,
  path: string,
  issues: ImportIssue[]
): void {
  appendUnknownAttributeIssues(source, path, node, OBJECT_ATTRIBUTES, issues);
  appendUnknownChildElementIssues(source, path, node, OBJECT_CHILDREN, issues);

  getElementChildren(node).forEach((child, index) => {
    if (child.tagName === "properties") {
      getElementChildren(child).forEach((propertyNode, propertyIndex) => {
        if (propertyNode.tagName === "property") {
          inspectPropertyElement(
            source,
            propertyNode,
            `${path}.properties[${propertyIndex}]`,
            issues
          );
        }
      });
      return;
    }

    if (child.tagName === "text") {
      appendUnknownAttributeIssues(source, `${path}.text`, child, TEXT_ATTRIBUTES, issues);
      return;
    }

    if (child.tagName === "polygon" || child.tagName === "polyline") {
      appendUnknownAttributeIssues(source, `${path}.${child.tagName}`, child, new Set(["points"]), issues);
    }
  });
}

function inspectLayerElement(
  source: SourceKind,
  node: Element,
  path: string,
  issues: ImportIssue[]
): void {
  const attributeSet =
    node.tagName === "layer"
      ? TILE_LAYER_ATTRIBUTES
      : node.tagName === "objectgroup"
        ? OBJECT_LAYER_ATTRIBUTES
        : node.tagName === "imagelayer"
          ? IMAGE_LAYER_ATTRIBUTES
          : GROUP_LAYER_ATTRIBUTES;
  const childSet =
    node.tagName === "layer"
      ? TILE_LAYER_CHILDREN
      : node.tagName === "objectgroup"
        ? OBJECT_LAYER_CHILDREN
        : node.tagName === "imagelayer"
          ? IMAGE_LAYER_CHILDREN
          : GROUP_LAYER_CHILDREN;

  appendUnknownAttributeIssues(source, path, node, attributeSet, issues);
  appendUnknownChildElementIssues(source, path, node, childSet, issues);

  getElementChildren(node).forEach((child, index) => {
    if (child.tagName === "properties") {
      getElementChildren(child).forEach((propertyNode, propertyIndex) => {
        if (propertyNode.tagName === "property") {
          inspectPropertyElement(
            source,
            propertyNode,
            `${path}.properties[${propertyIndex}]`,
            issues
          );
        }
      });
      return;
    }

    if (child.tagName === "data") {
      appendUnknownAttributeIssues(source, `${path}.data`, child, DATA_ATTRIBUTES, issues);
      appendUnknownChildElementIssues(source, `${path}.data`, child, DATA_CHILDREN, issues);

      getElementChildren(child)
        .filter((entry) => entry.tagName === "chunk")
        .forEach((chunkNode, chunkIndex) => {
          appendUnknownAttributeIssues(
            source,
            `${path}.data.chunks[${chunkIndex}]`,
            chunkNode,
            CHUNK_ATTRIBUTES,
            issues
          );
          appendUnknownChildElementIssues(
            source,
            `${path}.data.chunks[${chunkIndex}]`,
            chunkNode,
            CHUNK_CHILDREN,
            issues
          );
        });
      return;
    }

    if (child.tagName === "object") {
      inspectObjectElement(source, child, `${path}.objects[${index}]`, issues);
      return;
    }

    if (
      child.tagName === "layer" ||
      child.tagName === "objectgroup" ||
      child.tagName === "imagelayer" ||
      child.tagName === "group"
    ) {
      inspectLayerElement(source, child, `${path}.layers[${index}]`, issues);
      return;
    }

    if (child.tagName === "image") {
      appendUnknownAttributeIssues(source, `${path}.image`, child, IMAGE_ATTRIBUTES, issues);
    }
  });
}

function inspectTilesetChildren(
  source: SourceKind,
  node: Element,
  path: string,
  issues: ImportIssue[]
): void {
  getElementChildren(node).forEach((child, index) => {
    if (child.tagName === "properties") {
      getElementChildren(child).forEach((propertyNode, propertyIndex) => {
        if (propertyNode.tagName === "property") {
          inspectPropertyElement(
            source,
            propertyNode,
            `${path}.properties[${propertyIndex}]`,
            issues
          );
        }
      });
      return;
    }

    if (child.tagName === "image") {
      appendUnknownAttributeIssues(source, `${path}.image`, child, IMAGE_ATTRIBUTES, issues);
      return;
    }

    if (child.tagName === "tileoffset") {
      appendUnknownAttributeIssues(source, `${path}.tileoffset`, child, TILE_OFFSET_ATTRIBUTES, issues);
      return;
    }

    if (child.tagName === "grid") {
      appendUnknownAttributeIssues(source, `${path}.grid`, child, GRID_ATTRIBUTES, issues);
      return;
    }

    if (child.tagName === "transformations") {
      appendUnknownAttributeIssues(
        source,
        `${path}.transformations`,
        child,
        TRANSFORMATION_ATTRIBUTES,
        issues
      );
      return;
    }

    if (child.tagName === "tile") {
      appendUnknownAttributeIssues(source, `${path}.tiles[${index}]`, child, TILE_ATTRIBUTES, issues);
      appendUnknownChildElementIssues(source, `${path}.tiles[${index}]`, child, TILE_CHILDREN, issues);

      getElementChildren(child).forEach((tileChild, tileChildIndex) => {
        if (tileChild.tagName === "properties") {
          getElementChildren(tileChild).forEach((propertyNode, propertyIndex) => {
            if (propertyNode.tagName === "property") {
              inspectPropertyElement(
                source,
                propertyNode,
                `${path}.tiles[${index}].properties[${propertyIndex}]`,
                issues
              );
            }
          });
          return;
        }

        if (tileChild.tagName === "image") {
          appendUnknownAttributeIssues(
            source,
            `${path}.tiles[${index}].image`,
            tileChild,
            IMAGE_ATTRIBUTES,
            issues
          );
          return;
        }

        if (tileChild.tagName === "animation") {
          appendUnknownChildElementIssues(
            source,
            `${path}.tiles[${index}].animation`,
            tileChild,
            ANIMATION_CHILDREN,
            issues
          );
          getElementChildren(tileChild)
            .filter((frameNode) => frameNode.tagName === "frame")
            .forEach((frameNode, frameIndex) => {
              appendUnknownAttributeIssues(
                source,
                `${path}.tiles[${index}].animation[${frameIndex}]`,
                frameNode,
                FRAME_ATTRIBUTES,
                issues
              );
            });
          return;
        }

        if (tileChild.tagName === "objectgroup") {
          inspectLayerElement(
            source,
            tileChild,
            `${path}.tiles[${index}].objectgroup`,
            issues
          );
        }
      });
      return;
    }

    if (child.tagName === "wangsets") {
      appendUnknownChildElementIssues(source, `${path}.wangsets`, child, WANGSETS_CHILDREN, issues);
      getElementChildren(child)
        .filter((wangSetNode) => wangSetNode.tagName === "wangset")
        .forEach((wangSetNode, wangSetIndex) => {
          const wangPath = `${path}.wangsets[${wangSetIndex}]`;
          appendUnknownAttributeIssues(source, wangPath, wangSetNode, WANGSET_ATTRIBUTES, issues);
          appendUnknownChildElementIssues(source, wangPath, wangSetNode, WANGSET_CHILDREN, issues);

          getElementChildren(wangSetNode).forEach((wangChild, wangChildIndex) => {
            if (wangChild.tagName === "properties") {
              getElementChildren(wangChild).forEach((propertyNode, propertyIndex) => {
                if (propertyNode.tagName === "property") {
                  inspectPropertyElement(
                    source,
                    propertyNode,
                    `${wangPath}.properties[${propertyIndex}]`,
                    issues
                  );
                }
              });
              return;
            }

            if (
              wangChild.tagName === "wangcolor" ||
              wangChild.tagName === "wangcornercolor" ||
              wangChild.tagName === "wangedgecolor"
            ) {
              appendUnknownAttributeIssues(
                source,
                `${wangPath}.colors[${wangChildIndex}]`,
                wangChild,
                WANGCOLOR_ATTRIBUTES,
                issues
              );
              return;
            }

            if (wangChild.tagName === "wangtile") {
              appendUnknownAttributeIssues(
                source,
                `${wangPath}.wangtiles[${wangChildIndex}]`,
                wangChild,
                WANGTILE_ATTRIBUTES,
                issues
              );
            }
          });
        });
      return;
    }

    if (child.tagName === "terraintypes") {
      appendUnknownChildElementIssues(
        source,
        `${path}.terraintypes`,
        child,
        TERRAINTYPES_CHILDREN,
        issues
      );
      getElementChildren(child)
        .filter((terrainNode) => terrainNode.tagName === "terrain")
        .forEach((terrainNode, terrainIndex) => {
          appendUnknownAttributeIssues(
            source,
            `${path}.terraintypes[${terrainIndex}]`,
            terrainNode,
            TERRAIN_ATTRIBUTES,
            issues
          );
        });
    }
  });
}

export function collectUnknownTmxIssues(root: Element, issues: TmxImportIssue[]): void {
  appendUnknownAttributeIssues("tmx", "tmx", root, TMX_MAP_ATTRIBUTES, issues);
  appendUnknownChildElementIssues("tmx", "tmx", root, TMX_MAP_CHILDREN, issues);

  getElementChildren(root).forEach((child, index) => {
    if (child.tagName === "properties") {
      getElementChildren(child).forEach((propertyNode, propertyIndex) => {
        if (propertyNode.tagName === "property") {
          inspectPropertyElement("tmx", propertyNode, `tmx.properties[${propertyIndex}]`, issues);
        }
      });
      return;
    }

    if (child.tagName === "tileset") {
      appendUnknownAttributeIssues("tmx", `tmx.tilesets[${index}]`, child, TILESET_ATTRIBUTES, issues);
      appendUnknownChildElementIssues("tmx", `tmx.tilesets[${index}]`, child, TILESET_CHILDREN, issues);
      inspectTilesetChildren("tmx", child, `tmx.tilesets[${index}]`, issues);
      return;
    }

    if (
      child.tagName === "layer" ||
      child.tagName === "objectgroup" ||
      child.tagName === "imagelayer" ||
      child.tagName === "group"
    ) {
      inspectLayerElement("tmx", child, `tmx.layers[${index}]`, issues);
    }
  });
}

export function collectUnknownTsxIssues(root: Element, issues: TsxImportIssue[]): void {
  appendUnknownAttributeIssues("tsx", "tsx", root, TILESET_ATTRIBUTES, issues);
  appendUnknownChildElementIssues("tsx", "tsx", root, TILESET_CHILDREN, issues);
  inspectTilesetChildren("tsx", root, "tsx", issues);
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
