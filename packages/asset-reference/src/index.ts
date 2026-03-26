export type AssetReferenceKind =
  | "tileset"
  | "image"
  | "template"
  | "property-file"
  | "project-folder"
  | "extensions"
  | "automapping-rules";

export type AssetPathKind =
  | "project-relative"
  | "relative"
  | "absolute"
  | "url";

export interface AssetReferenceResolveOptions {
  documentPath?: string;
  assetRoots?: readonly string[];
}

export interface ResolvedAssetPath {
  originalPath: string;
  resolvedPath: string;
  pathKind: AssetPathKind;
  assetRoot?: string;
  externalToProject: boolean;
  documentPath?: string;
}

export interface AssetReferenceDescriptor extends ResolvedAssetPath {
  kind: AssetReferenceKind;
  ownerPath: string;
}

function normalizeSeparators(value: string): string {
  return value.replaceAll("\\", "/");
}

function isUrlPath(value: string): boolean {
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(value);
}

function isAbsolutePath(value: string): boolean {
  return value.startsWith("/") || /^[a-z]:\//i.test(value);
}

function splitPathSegments(value: string): string[] {
  return normalizeSeparators(value)
    .split("/")
    .filter((segment) => segment.length > 0);
}

export function normalizeAssetPath(path: string): string {
  const normalized = normalizeSeparators(path).trim();

  if (normalized.length === 0 || normalized === ".") {
    return "";
  }

  if (isUrlPath(normalized) || isAbsolutePath(normalized)) {
    return normalized;
  }

  const segments = splitPathSegments(normalized);
  const stack: string[] = [];

  for (const segment of segments) {
    if (segment === ".") {
      continue;
    }

    if (segment === "..") {
      const last = stack.at(-1);

      if (last && last !== "..") {
        stack.pop();
      } else {
        stack.push("..");
      }

      continue;
    }

    stack.push(segment);
  }

  return stack.join("/");
}

export function dirnameAssetPath(path: string): string {
  const normalized = normalizeAssetPath(path);

  if (normalized === "" || isUrlPath(normalized) || isAbsolutePath(normalized)) {
    return "";
  }

  const segments = splitPathSegments(normalized);

  if (segments.length <= 1) {
    return "";
  }

  return segments.slice(0, -1).join("/");
}

function startsWithWholeSegment(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`);
}

function detectAssetRoot(
  resolvedPath: string,
  assetRoots: readonly string[] | undefined
): string | undefined {
  const normalizedRoots = (assetRoots ?? [])
    .map((root) => normalizeAssetPath(root))
    .filter((root) => root.length > 0)
    .sort((left, right) => right.length - left.length);

  return normalizedRoots.find((root) => startsWithWholeSegment(resolvedPath, root));
}

export function resolveAssetPath(
  path: string,
  options: AssetReferenceResolveOptions = {}
): ResolvedAssetPath {
  const originalPath = normalizeSeparators(path).trim();

  if (originalPath.length === 0) {
    return {
      originalPath,
      resolvedPath: "",
      pathKind: "relative",
      externalToProject: true,
      ...(options.documentPath !== undefined ? { documentPath: options.documentPath } : {})
    };
  }

  if (isUrlPath(originalPath)) {
    return {
      originalPath,
      resolvedPath: originalPath,
      pathKind: "url",
      externalToProject: true,
      ...(options.documentPath !== undefined ? { documentPath: options.documentPath } : {})
    };
  }

  if (isAbsolutePath(originalPath)) {
    return {
      originalPath,
      resolvedPath: originalPath,
      pathKind: "absolute",
      externalToProject: true,
      ...(options.documentPath !== undefined ? { documentPath: options.documentPath } : {})
    };
  }

  const documentDirectory = options.documentPath
    ? dirnameAssetPath(options.documentPath)
    : "";
  const resolvedPath = normalizeAssetPath(
    documentDirectory ? `${documentDirectory}/${originalPath}` : originalPath
  );
  const hasAssetRootContext = (options.assetRoots?.length ?? 0) > 0;
  const assetRoot = detectAssetRoot(resolvedPath, options.assetRoots);
  const pathKind = documentDirectory ? "relative" : "project-relative";

  return {
    originalPath,
    resolvedPath,
    pathKind,
    externalToProject:
      hasAssetRootContext &&
      (assetRoot === undefined || resolvedPath.startsWith("../")),
    ...(assetRoot !== undefined ? { assetRoot } : {}),
    ...(options.documentPath !== undefined ? { documentPath: options.documentPath } : {})
  };
}

export function createAssetReference(
  kind: AssetReferenceKind,
  ownerPath: string,
  path: string,
  options: AssetReferenceResolveOptions = {}
): AssetReferenceDescriptor {
  const resolved = resolveAssetPath(path, options);

  return {
    kind,
    ownerPath,
    ...resolved
  };
}
