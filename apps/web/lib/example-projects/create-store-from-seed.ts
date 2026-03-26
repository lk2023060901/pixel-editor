import {
  createEditorStore,
  type EditorController,
  type EditorNamingConfig
} from "@pixel-editor/app-services";
import type { ProjectAssetSummary } from "@pixel-editor/contracts";
import {
  createEntityId,
  createProject,
  type PropertyTypeDefinition,
  type TilesetDefinition
} from "@pixel-editor/domain";
import { createEditorWorkspaceState } from "@pixel-editor/editor-state";

import type {
  ExampleProjectSeed,
  ExamplePropertyTypeDescriptor,
  ExampleTilesetDescriptor
} from "./schema";
import { createExampleProjectDocumentRepository } from "./create-document-repository";
import { createExampleProjectExportJobGateway } from "./create-export-job-gateway";
import {
  resolveExampleMapDocumentPath,
  resolveExampleTilesetDocumentPath
} from "./schema";

function isImageTileset(
  tileset: ExampleTilesetDescriptor
): tileset is Extract<ExampleTilesetDescriptor, { kind: "image" }> {
  return tileset.kind === "image";
}

export interface ExampleStoreFromSeedOptions {
  naming?: EditorNamingConfig;
}

function normalizeExampleProjectPath(path: string): string {
  return path.replaceAll("\\", "/").trim().replace(/^\.\/+/, "");
}

function materializePropertyTypes(
  propertyTypes: readonly ExamplePropertyTypeDescriptor[] | undefined
): PropertyTypeDefinition[] {
  return (propertyTypes ?? []).map((propertyType) => ({
    ...propertyType,
    id: createEntityId("propertyType")
  }));
}

function materializeProjectAssets(
  seed: ExampleProjectSeed,
  mapIdsByPath: ReadonlyMap<string, string>,
  tilesetIdsByPath: ReadonlyMap<string, TilesetDefinition["id"]>
): ProjectAssetSummary[] {
  return (seed.projectAssets ?? []).map((asset) => ({
    id: asset.id,
    name: asset.name,
    path: asset.path,
    kind: asset.kind,
    ...(asset.kind === "map"
      ? (() => {
          const documentId = mapIdsByPath.get(asset.path);
          return documentId !== undefined ? { documentId } : {};
        })()
      : {}),
    ...(asset.kind === "tileset"
      ? (() => {
          const documentId = tilesetIdsByPath.get(asset.path);
          return documentId !== undefined ? { documentId } : {};
        })()
      : {})
  }));
}

export function createEditorStoreFromExampleSeed(
  seed: ExampleProjectSeed,
  options: ExampleStoreFromSeedOptions = {}
): EditorController {
  const project = createProject({
    name: seed.project.name,
    assetRoots: seed.project.assetRoots,
    ...(seed.project.automappingRulesFile !== undefined
      ? { automappingRulesFile: seed.project.automappingRulesFile }
      : {}),
    ...(seed.project.propertyTypes !== undefined
      ? { propertyTypes: materializePropertyTypes(seed.project.propertyTypes) }
      : {})
  });
  const textAssetsByPath = new Map(
    (seed.textAssets ?? []).map((asset) => [
      normalizeExampleProjectPath(asset.path),
      asset.content
    ])
  );
  const store = createEditorStore(
    createEditorWorkspaceState({
      project,
      tilesets: []
    }),
    {
      ...options,
      documents: createExampleProjectDocumentRepository(seed.projectId),
      exports: createExampleProjectExportJobGateway(seed.projectId),
      ...(textAssetsByPath.size > 0
        ? {
            resolveProjectTextAsset: (path: string) =>
              textAssetsByPath.get(normalizeExampleProjectPath(path))
          }
        : {})
    }
  );
  const tilesetIdsByKey = new Map<string, TilesetDefinition["id"]>();
  const tilesetIdsByPath = new Map<string, TilesetDefinition["id"]>();
  const mapIdsByPath = new Map<string, string>();

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
      tilesetIdsByPath.set(resolveExampleTilesetDocumentPath(tileset), createdTileset.id);

      if (tileset.tiles?.length) {
        store.setActiveTileset(createdTileset.id);

        for (const tile of tileset.tiles) {
          store.selectStampTile(createdTileset.id, tile.localId);

          if (tile.className !== undefined || tile.probability !== undefined) {
            store.updateSelectedTileMetadata({
              ...(tile.className !== undefined ? { className: tile.className } : {}),
              ...(tile.probability !== undefined ? { probability: tile.probability } : {})
            });
          }

          for (const property of tile.properties ?? []) {
            store.upsertSelectedTileProperty(property);
          }
        }
      }

      if (tileset.wangSets?.length) {
        store.setActiveTileset(createdTileset.id);

        for (const wangSet of tileset.wangSets) {
          store.createActiveTilesetWangSet(wangSet.type, wangSet.name);
        }
      }
    }
  }

  for (const map of seed.maps) {
    const mapId = store.createMapDocument({
      ...map,
      tilesetIds: map.tilesetKeys
        .map((tilesetKey) => tilesetIdsByKey.get(tilesetKey))
        .filter((tilesetId): tilesetId is TilesetDefinition["id"] => tilesetId !== undefined)
    });

    mapIdsByPath.set(resolveExampleMapDocumentPath(map), mapId);
  }

  store.replaceProjectAssets(materializeProjectAssets(seed, mapIdsByPath, tilesetIdsByPath));

  return store;
}
