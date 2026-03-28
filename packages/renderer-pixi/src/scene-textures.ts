import type {
  EditorMap,
  LayerDefinition,
  TilesetDefinition
} from "@pixel-editor/domain";

function addTexturePath(texturePaths: Set<string>, imagePath: string | undefined): void {
  const normalizedPath = imagePath?.trim();

  if (!normalizedPath) {
    return;
  }

  texturePaths.add(normalizedPath);
}

function collectLayerTexturePaths(
  layers: readonly LayerDefinition[],
  texturePaths: Set<string>
): void {
  for (const layer of layers) {
    if (layer.kind === "group") {
      collectLayerTexturePaths(layer.layers, texturePaths);
      continue;
    }

    if (layer.kind === "image") {
      addTexturePath(texturePaths, layer.imagePath);
    }
  }
}

export function collectRendererSnapshotTexturePaths(input: {
  map?: Pick<EditorMap, "layers">;
  tilesets: readonly TilesetDefinition[];
}): string[] {
  const texturePaths = new Set<string>();

  if (input.map) {
    collectLayerTexturePaths(input.map.layers, texturePaths);
  }

  for (const tileset of input.tilesets) {
    if (tileset.kind === "image") {
      addTexturePath(texturePaths, tileset.source?.imagePath);
      continue;
    }

    for (const tile of tileset.tiles) {
      addTexturePath(texturePaths, tile.imageSource);
    }
  }

  return [...texturePaths];
}
