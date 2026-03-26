import { promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const defaultExampleProjectsRootDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../examples"
);

export interface ExampleProjectStorageLocationOptions {
  projectsRootDirectory?: string;
}

function normalizeExampleProjectId(projectId: string): string {
  if (!/^[a-z0-9-]+$/i.test(projectId)) {
    throw new Error("Invalid example project identifier");
  }

  return projectId;
}

function normalizeExampleProjectRelativePath(relativePath: string): string {
  return relativePath.replaceAll("\\", "/").trim().replace(/^\.\/+/, "");
}

function resolveProjectsRootDirectory(
  options: ExampleProjectStorageLocationOptions = {}
): string {
  return options.projectsRootDirectory ?? defaultExampleProjectsRootDirectory;
}

export function resolveExampleProjectDirectory(
  projectId: string,
  options: ExampleProjectStorageLocationOptions = {}
): string {
  return path.join(
    resolveProjectsRootDirectory(options),
    normalizeExampleProjectId(projectId)
  );
}

export function resolveExampleProjectFilePath(
  projectId: string,
  options: ExampleProjectStorageLocationOptions = {}
): string {
  return path.join(resolveExampleProjectDirectory(projectId, options), "project.json");
}

export function resolveExampleAssetFilePath(
  projectId: string,
  assetPath: string | readonly string[],
  options: ExampleProjectStorageLocationOptions = {}
): string {
  const baseDirectory = resolveExampleProjectDirectory(projectId, options);
  const assetPathSegments =
    typeof assetPath === "string"
      ? normalizeExampleProjectRelativePath(assetPath).split("/")
      : [...assetPath];
  const filePath = path.resolve(baseDirectory, ...assetPathSegments);

  if (filePath !== baseDirectory && !filePath.startsWith(`${baseDirectory}${path.sep}`)) {
    throw new Error("Invalid example asset path");
  }

  return filePath;
}

export async function readExampleProjectFile(
  projectId: string,
  options: ExampleProjectStorageLocationOptions = {}
): Promise<string> {
  return fs.readFile(resolveExampleProjectFilePath(projectId, options), "utf8");
}

export async function writeExampleProjectTextFile(
  projectId: string,
  relativePath: string,
  content: string,
  options: ExampleProjectStorageLocationOptions = {}
): Promise<void> {
  const filePath = resolveExampleAssetFilePath(projectId, relativePath, options);

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf8");
}

export async function writeExampleProjectBinaryFile(
  projectId: string,
  relativePath: string,
  content: Uint8Array,
  options: ExampleProjectStorageLocationOptions = {}
): Promise<void> {
  const filePath = resolveExampleAssetFilePath(projectId, relativePath, options);

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content);
}

function decodeDataUrlContent(content: string): Uint8Array | undefined {
  const match = /^data:([^;,]+);base64,(.*)$/.exec(content);

  if (!match) {
    return undefined;
  }

  const encodedContent = match[2];

  if (!encodedContent) {
    return undefined;
  }

  return Buffer.from(encodedContent, "base64");
}

export async function persistExampleProjectDocument(input: {
  projectId: string;
  path: string;
  content: string;
  contentType?: string;
  projectsRootDirectory?: string;
}): Promise<void> {
  if (input.contentType?.startsWith("image/")) {
    const binaryContent = decodeDataUrlContent(input.content);

    if (!binaryContent) {
      throw new Error("Image content must be a base64 data URL");
    }

    await writeExampleProjectBinaryFile(input.projectId, input.path, binaryContent, {
      ...(input.projectsRootDirectory !== undefined
        ? { projectsRootDirectory: input.projectsRootDirectory }
        : {})
    });
    return;
  }

  await writeExampleProjectTextFile(input.projectId, input.path, input.content, {
    ...(input.projectsRootDirectory !== undefined
      ? { projectsRootDirectory: input.projectsRootDirectory }
      : {})
  });
}
