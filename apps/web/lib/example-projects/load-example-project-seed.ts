import "server-only";

import { promises as fs } from "node:fs";

import {
  readExampleProjectFile as readExampleProjectDescriptorFile,
  resolveExampleAssetFilePath
} from "@pixel-editor/example-project-support";

import {
  buildExampleProjectAssetDescriptors,
  buildExampleAssetUrl,
  type ExampleProjectDescriptor,
  type ExampleProjectTextAsset,
  type ExampleProjectSeed,
  type ExampleTilesetDescriptor
} from "./schema";

async function loadAuxiliaryTextAssets(
  projectId: string,
  descriptor: ExampleProjectDescriptor
): Promise<ExampleProjectTextAsset[]> {
  return Promise.all(
    (descriptor.auxiliaryAssets ?? []).map(async (asset) => ({
      path: asset.path,
      content: await fs.readFile(
        resolveExampleAssetFilePath(projectId, asset.path.split("/")),
        "utf8"
      )
    }))
  );
}

function resolveTilesetAssets(
  projectId: string,
  tileset: ExampleTilesetDescriptor
): ExampleTilesetDescriptor {
  if (tileset.kind === "image") {
    return {
      ...tileset,
      imagePath: buildExampleAssetUrl(projectId, tileset.imagePath)
    };
  }

  return {
    ...tileset,
    imageSources: tileset.imageSources.map((assetPath) =>
      buildExampleAssetUrl(projectId, assetPath)
    )
  };
}

export async function loadExampleProjectSeed(
  projectId: string
): Promise<ExampleProjectSeed> {
  const fileContent = await readExampleProjectDescriptorFile(projectId);
  const descriptor = JSON.parse(fileContent) as ExampleProjectDescriptor;

  return {
    projectId,
    project: descriptor.project,
    projectAssets: buildExampleProjectAssetDescriptors(descriptor),
    textAssets: await loadAuxiliaryTextAssets(projectId, descriptor),
    tilesets: descriptor.tilesets.map((tileset) =>
      resolveTilesetAssets(projectId, tileset)
    ),
    maps: descriptor.maps
  };
}

export async function readExampleProjectFile(projectId: string): Promise<string> {
  return readExampleProjectDescriptorFile(projectId);
}
