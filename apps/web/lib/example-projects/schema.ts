import type {
  CreateMapInput,
  ClassPropertyFieldDefinition,
  PropertyTypeName,
  PropertyValue
} from "@pixel-editor/domain";

export interface ExampleProjectDescriptor {
  project: {
    name: string;
    assetRoots: string[];
    propertyTypes?: ExamplePropertyTypeDescriptor[];
  };
  tilesets: ExampleTilesetDescriptor[];
  maps: ExampleMapDescriptor[];
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
  tilesetKeys: string[];
};

export interface ExampleProjectSeed {
  projectId: string;
  project: ExampleProjectDescriptor["project"];
  tilesets: ExampleTilesetDescriptor[];
  maps: ExampleMapDescriptor[];
}

export function buildExampleAssetUrl(
  projectId: string,
  relativeAssetPath: string
): string {
  return `/api/example-projects/${projectId}/assets/${relativeAssetPath}`;
}
