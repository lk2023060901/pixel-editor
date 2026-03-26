import type {
  CreateMapInput,
  ClassPropertyFieldDefinition,
  PropertyTypeName,
  PropertyValue
} from "@pixel-editor/domain";
import type { ProjectAssetKind } from "@pixel-editor/contracts";

function normalizeExampleProjectPath(path: string): string {
  return path.replaceAll("\\", "/").trim().replace(/^\.\/+/, "");
}

function basename(path: string): string {
  const normalized = normalizeExampleProjectPath(path);
  return normalized.split("/").at(-1) ?? normalized;
}

function slugify(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "untitled";
}

export interface ExampleProjectDescriptor {
  project: {
    name: string;
    assetRoots: string[];
    automappingRulesFile?: string;
    propertyTypes?: ExamplePropertyTypeDescriptor[];
  };
  tilesets: ExampleTilesetDescriptor[];
  maps: ExampleMapDescriptor[];
  auxiliaryAssets?: ExampleAuxiliaryAssetDescriptor[];
}

export type ExamplePropertyTypeDescriptor =
  | {
      kind: "enum";
      name: string;
      storageType: "string" | "int";
      values: string[];
      valuesAsFlags: boolean;
    }
  | {
      kind: "class";
      name: string;
      useAs: Array<
        | "property"
        | "map"
        | "layer"
        | "object"
        | "tile"
        | "tileset"
        | "wangcolor"
        | "wangset"
        | "project"
        | "world"
        | "template"
      >;
      color?: string;
      drawFill?: boolean;
      fields: Array<
        Omit<ClassPropertyFieldDefinition, "defaultValue"> & {
          defaultValue?: PropertyValue;
        }
      >;
    };

export type ExampleTilesetDescriptor =
  | {
      key: string;
      kind: "image";
      name: string;
      path?: string;
      tileWidth: number;
      tileHeight: number;
      imagePath: string;
      imageWidth: number;
      imageHeight: number;
      margin?: number;
      spacing?: number;
      columns?: number;
      wangSets?: ExampleWangSetDescriptor[];
      tiles?: ExampleTileDescriptor[];
    }
  | {
      key: string;
      kind: "image-collection";
      name: string;
      path?: string;
      tileWidth: number;
      tileHeight: number;
      imageSources: string[];
      wangSets?: ExampleWangSetDescriptor[];
      tiles?: ExampleTileDescriptor[];
    };

export interface ExampleWangSetDescriptor {
  name: string;
  type: "corner" | "edge" | "mixed";
}

export interface ExamplePropertyDefinition {
  name: string;
  type: PropertyTypeName;
  value: PropertyValue;
  propertyTypeName?: string;
}

export interface ExampleTileDescriptor {
  localId: number;
  className?: string;
  probability?: number;
  properties?: ExamplePropertyDefinition[];
}

export type ExampleMapDescriptor = Omit<CreateMapInput, "tilesetIds"> & {
  path?: string;
  tilesetKeys: string[];
};

export interface ExampleProjectAssetDescriptor {
  id: string;
  kind: Exclude<ProjectAssetKind, "folder">;
  name: string;
  path: string;
}

export interface ExampleAuxiliaryAssetDescriptor {
  kind: Exclude<ProjectAssetKind, "folder">;
  path: string;
  name?: string;
}

export interface ExampleProjectTextAsset {
  path: string;
  content: string;
}

export interface ExampleProjectSeed {
  projectId: string;
  project: ExampleProjectDescriptor["project"];
  tilesets: ExampleTilesetDescriptor[];
  maps: ExampleMapDescriptor[];
  projectAssets?: ExampleProjectAssetDescriptor[];
  textAssets?: ExampleProjectTextAsset[];
}

export function buildExampleAssetUrl(
  projectId: string,
  relativeAssetPath: string
): string {
  return `/api/example-projects/${projectId}/assets/${relativeAssetPath}`;
}

export function resolveExampleTilesetDocumentPath(
  tileset: Pick<ExampleTilesetDescriptor, "key" | "path">
): string {
  return normalizeExampleProjectPath(
    tileset.path ?? `tilesets/${tileset.key}.tsj`
  );
}

export function resolveExampleMapDocumentPath(
  map: Pick<ExampleMapDescriptor, "name" | "path">
): string {
  return normalizeExampleProjectPath(
    map.path ?? `maps/${slugify(map.name)}.tmj`
  );
}

export function buildExampleProjectAssetDescriptors(
  descriptor: ExampleProjectDescriptor
): ExampleProjectAssetDescriptor[] {
  const assets = new Map<string, ExampleProjectAssetDescriptor>();

  function addAsset(
    kind: Exclude<ProjectAssetKind, "folder">,
    path: string,
    name?: string
  ): void {
    const normalizedPath = normalizeExampleProjectPath(path);

    if (normalizedPath.length === 0 || assets.has(normalizedPath)) {
      return;
    }

    assets.set(normalizedPath, {
      id: `${kind}:${normalizedPath}`,
      kind,
      name: name?.trim() || basename(normalizedPath),
      path: normalizedPath
    });
  }

  addAsset("project", "project.json");

  for (const map of descriptor.maps) {
    addAsset("map", resolveExampleMapDocumentPath(map));
  }

  for (const tileset of descriptor.tilesets) {
    addAsset("tileset", resolveExampleTilesetDocumentPath(tileset));

    if (tileset.kind === "image") {
      addAsset("image", tileset.imagePath);
      continue;
    }

    for (const imageSource of tileset.imageSources) {
      addAsset("image", imageSource);
    }
  }

  for (const asset of descriptor.auxiliaryAssets ?? []) {
    addAsset(asset.kind, asset.path, asset.name);
  }

  return [...assets.values()].sort((left, right) =>
    left.path.localeCompare(right.path)
  );
}
