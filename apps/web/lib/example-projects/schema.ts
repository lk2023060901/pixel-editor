import type { CreateMapInput } from "@pixel-editor/domain";

export interface ExampleProjectDescriptor {
  project: {
    name: string;
    assetRoots: string[];
  };
  tilesets: ExampleTilesetDescriptor[];
  maps: ExampleMapDescriptor[];
}

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
    }
  | {
      key: string;
      kind: "image-collection";
      name: string;
      tileWidth: number;
      tileHeight: number;
      imageSources: string[];
    };

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
