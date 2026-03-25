import { describe, expect, it } from "vitest";

import {
  createMap,
  createProperty,
  createTileDefinition,
  createTileset
} from "./index";
import {
  attachTilesetToMap,
  createImageCollectionTileset,
  createImageTileset,
  getMapGlobalTileGid,
  getTilesetTileCount,
  listTilesetLocalIds,
  removeTilesetTileProperty,
  resolveMapTileGid,
  updateTilesetDetails,
  updateTilesetTileMetadata,
  upsertTilesetTileProperty
} from "./tileset-operations";

describe("tileset operations", () => {
  it("derives tile count from explicit tiles and image metadata", () => {
    const imageTileset = {
      ...createTileset({
        name: "terrain",
        kind: "image",
        tileWidth: 32,
        tileHeight: 32,
        source: {
          imagePath: "terrain.png",
          imageWidth: 128,
          imageHeight: 64,
          margin: 0,
          spacing: 0,
          columns: 4
        }
      }),
      tiles: [createTileDefinition(0), createTileDefinition(1)]
    };
    const collectionTileset = {
      ...createTileset({
        name: "props",
        kind: "image-collection",
        tileWidth: 32,
        tileHeight: 32
      }),
      tiles: [createTileDefinition(0), createTileDefinition(1), createTileDefinition(2)]
    };

    expect(getTilesetTileCount(imageTileset)).toBe(8);
    expect(getTilesetTileCount(collectionTileset)).toBe(3);
    expect(listTilesetLocalIds(collectionTileset)).toEqual([0, 1, 2]);
  });

  it("resolves map gids against ordered map tilesets", () => {
    const terrainTileset = {
      ...createTileset({
        name: "terrain",
        kind: "image",
        tileWidth: 32,
        tileHeight: 32,
        source: {
          imagePath: "terrain.png",
          imageWidth: 128,
          imageHeight: 64,
          margin: 0,
          spacing: 0,
          columns: 4
        }
      }),
      tiles: Array.from({ length: 8 }, (_, localId) => createTileDefinition(localId))
    };
    const propsTileset = {
      ...createTileset({
        name: "props",
        kind: "image-collection",
        tileWidth: 32,
        tileHeight: 32
      }),
      tiles: Array.from({ length: 4 }, (_, localId) => createTileDefinition(localId))
    };
    const map = createMap({
      name: "demo",
      orientation: "orthogonal",
      width: 8,
      height: 8,
      tileWidth: 32,
      tileHeight: 32,
      tilesetIds: [terrainTileset.id, propsTileset.id]
    });

    expect(getMapGlobalTileGid(map, [terrainTileset, propsTileset], terrainTileset.id, 2)).toBe(3);
    expect(getMapGlobalTileGid(map, [terrainTileset, propsTileset], propsTileset.id, 1)).toBe(10);

    expect(resolveMapTileGid(map, [terrainTileset, propsTileset], 10)).toMatchObject({
      firstGid: 9,
      localId: 1,
      tileset: propsTileset
    });
  });

  it("creates image and image-collection tilesets and attaches them to maps", () => {
    const spriteTileset = createImageTileset({
      name: "terrain",
      tileWidth: 32,
      tileHeight: 32,
      imagePath: "/demo/terrain-core.svg",
      imageWidth: 192,
      imageHeight: 128,
      columns: 6
    });
    const collectionTileset = createImageCollectionTileset({
      name: "props",
      tileWidth: 32,
      tileHeight: 32,
      imageSources: ["/demo/props/prop-1.svg", "/demo/props/prop-2.svg"]
    });
    const map = createMap({
      name: "demo",
      orientation: "orthogonal",
      width: 8,
      height: 8,
      tileWidth: 32,
      tileHeight: 32
    });

    const attached = attachTilesetToMap(attachTilesetToMap(map, spriteTileset.id), collectionTileset.id);

    expect(spriteTileset.tiles).toHaveLength(24);
    expect(collectionTileset.tiles).toHaveLength(2);
    expect(attached.tilesetIds).toEqual([spriteTileset.id, collectionTileset.id]);
  });

  it("updates tileset parameters and keeps image tiles aligned with computed count", () => {
    const tileset = createImageTileset({
      name: "terrain",
      tileWidth: 32,
      tileHeight: 32,
      imagePath: "/demo/terrain-core.svg",
      imageWidth: 192,
      imageHeight: 128,
      columns: 6
    });

    const updated = updateTilesetDetails(tileset, {
      name: "terrain-v2",
      tileWidth: 48,
      tileHeight: 32,
      tileOffsetX: 4,
      tileOffsetY: -8,
      objectAlignment: "bottom",
      tileRenderSize: "grid",
      fillMode: "preserve-aspect-fit",
      spacing: 4,
      margin: 2,
      columns: 3
    });

    expect(updated.name).toBe("terrain-v2");
    expect(updated.tileWidth).toBe(48);
    expect(updated.tileOffsetX).toBe(4);
    expect(updated.tileOffsetY).toBe(-8);
    expect(updated.objectAlignment).toBe("bottom");
    expect(updated.tileRenderSize).toBe("grid");
    expect(updated.fillMode).toBe("preserve-aspect-fit");
    expect(updated.source).toMatchObject({
      margin: 2,
      spacing: 4,
      columns: 3
    });
    expect(updated.tiles).toHaveLength(9);
  });

  it("updates tile metadata and custom properties by local id", () => {
    const tileset = createImageCollectionTileset({
      name: "props",
      tileWidth: 32,
      tileHeight: 32,
      imageSources: ["/demo/props/prop-1.svg", "/demo/props/prop-2.svg"]
    });

    const withMetadata = updateTilesetTileMetadata(tileset, 1, {
      className: "PropRock",
      probability: 0.5
    });
    const withProperty = upsertTilesetTileProperty(
      withMetadata,
      1,
      createProperty("biome", "string", "forest")
    );
    const renamedProperty = upsertTilesetTileProperty(
      withProperty,
      1,
      createProperty("spawnWeight", "int", 4),
      "biome"
    );
    const cleaned = removeTilesetTileProperty(renamedProperty, 1, "spawnWeight");

    expect(withMetadata.tiles[1]).toMatchObject({
      localId: 1,
      className: "PropRock",
      probability: 0.5
    });
    expect(withProperty.tiles[1]?.properties).toEqual([
      createProperty("biome", "string", "forest")
    ]);
    expect(renamedProperty.tiles[1]?.properties).toEqual([
      createProperty("spawnWeight", "int", 4)
    ]);
    expect(cleaned.tiles[1]?.properties).toEqual([]);
  });
});
