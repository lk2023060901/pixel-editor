import "server-only";

import { promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import {
  buildExampleProjectAssetDescriptors,
  buildExampleAssetUrl,
  type ExampleProjectDescriptor,
  type ExampleProjectSeed,
  type ExampleTilesetDescriptor
} from "./schema";

function normalizeExampleProjectId(projectId: string): string {
  if (!/^[a-z0-9-]+$/i.test(projectId)) {
    throw new Error("Invalid example project identifier");
  }

  return projectId;
}

const exampleProjectsRootDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../examples"
);

function exampleProjectDirectory(projectId: string): string {
  return path.join(exampleProjectsRootDirectory, normalizeExampleProjectId(projectId));
}

function exampleProjectFilePath(projectId: string): string {
  return path.join(exampleProjectDirectory(projectId), "project.json");
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
  const fileContent = await fs.readFile(exampleProjectFilePath(projectId), "utf8");
  const descriptor = JSON.parse(fileContent) as ExampleProjectDescriptor;

  return {
    projectId,
    project: descriptor.project,
    projectAssets: buildExampleProjectAssetDescriptors(descriptor),
    tilesets: descriptor.tilesets.map((tileset) =>
      resolveTilesetAssets(projectId, tileset)
    ),
    maps: descriptor.maps
  };
}

export async function readExampleProjectFile(projectId: string): Promise<string> {
  return fs.readFile(exampleProjectFilePath(projectId), "utf8");
}

export function resolveExampleAssetFilePath(
  projectId: string,
  assetPathSegments: string[]
): string {
  const baseDirectory = exampleProjectDirectory(projectId);
  const filePath = path.resolve(baseDirectory, ...assetPathSegments);

  if (
    filePath !== baseDirectory &&
    !filePath.startsWith(`${baseDirectory}${path.sep}`)
  ) {
    throw new Error("Invalid example asset path");
  }

  return filePath;
}
