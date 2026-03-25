import {
  createEditorStore,
  type EditorController,
  type EditorNamingConfig
} from "@pixel-editor/app-services";
import {
  createProject,
  type TilesetDefinition
} from "@pixel-editor/domain";
import { createEditorWorkspaceState } from "@pixel-editor/editor-state";

import type {
  ExampleProjectSeed,
  ExampleTilesetDescriptor
} from "./schema";

function isImageTileset(
  tileset: ExampleTilesetDescriptor
): tileset is Extract<ExampleTilesetDescriptor, { kind: "image" }> {
  return tileset.kind === "image";
}

export interface ExampleStoreFromSeedOptions {
  naming?: EditorNamingConfig;
}

export function createEditorStoreFromExampleSeed(
  seed: ExampleProjectSeed,
  options: ExampleStoreFromSeedOptions = {}
): EditorController {
  const project = createProject({
    name: seed.project.name,
    assetRoots: seed.project.assetRoots
  });
  const store = createEditorStore(
    createEditorWorkspaceState({
      project,
      tilesets: []
    }),
    options
  );
  const tilesetIdsByKey = new Map<string, TilesetDefinition["id"]>();

  for (const tileset of seed.tilesets) {
    if (isImageTileset(tileset)) {
      store.createSpriteSheetTileset({
        name: tileset.name,
        tileWidth: tileset.tileWidth,
        tileHeight: tileset.tileHeight,
        imagePath: tileset.imagePath,
        imageWidth: tileset.imageWidth,
        imageHeight: tileset.imageHeight,
        ...(tileset.margin !== undefined ? { margin: tileset.margin } : {}),
        ...(tileset.spacing !== undefined ? { spacing: tileset.spacing } : {}),
        ...(tileset.columns !== undefined ? { columns: tileset.columns } : {})
      });
    } else {
      store.createImageCollectionTileset({
        name: tileset.name,
        tileWidth: tileset.tileWidth,
        tileHeight: tileset.tileHeight,
        imageSources: tileset.imageSources
      });
    }

    const createdTileset = store.getState().tilesets.at(-1);

    if (createdTileset) {
      tilesetIdsByKey.set(tileset.key, createdTileset.id);
    }
  }

  for (const map of seed.maps) {
    store.createMapDocument({
      ...map,
      tilesetIds: map.tilesetKeys
        .map((tilesetKey) => tilesetIdsByKey.get(tilesetKey))
        .filter((tilesetId): tilesetId is TilesetDefinition["id"] => tilesetId !== undefined)
    });
  }

  return store;
}
