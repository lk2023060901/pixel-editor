import { createProject } from "@pixel-editor/domain";
import { createEditorWorkspaceState } from "@pixel-editor/editor-state";

import { createEditorStore, type EditorController } from "../../src/controller";

const testSpriteSheet = {
  name: "Test Terrain",
  tileWidth: 32,
  tileHeight: 32,
  imagePath: "/tests/terrain-core.svg",
  imageWidth: 192,
  imageHeight: 128,
  columns: 6
} as const;

const testImageCollection = {
  name: "Test Props",
  tileWidth: 32,
  tileHeight: 32,
  imageSources: [
    "/tests/props/prop-1.svg",
    "/tests/props/prop-2.svg",
    "/tests/props/prop-3.svg",
    "/tests/props/prop-4.svg",
    "/tests/props/prop-5.svg",
    "/tests/props/prop-6.svg"
  ] as string[]
} as const;

export function createTestEditorStore(projectId: string): EditorController {
  const project = createProject({
    name: `Project ${projectId}`,
    assetRoots: ["maps", "tilesets", "templates"]
  });
  const store = createEditorStore(
    createEditorWorkspaceState({
      project
    })
  );

  store.createSpriteSheetTileset(testSpriteSheet);
  store.createImageCollectionTileset(testImageCollection);
  store.createMapDocument({
    name: "starter-map",
    orientation: "orthogonal",
    width: 64,
    height: 64,
    tileWidth: 32,
    tileHeight: 32,
    tilesetIds: store.getState().tilesets.map((tileset) => tileset.id)
  });

  return store;
}
