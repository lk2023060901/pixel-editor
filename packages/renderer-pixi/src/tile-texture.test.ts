import { describe, expect, it } from "vitest";

import {
  createImageCollectionTileset,
  createImageTileset,
  createMap,
  getTilesetTileCount
} from "@pixel-editor/domain";

import {
  getTilesetTileTextureFrame,
  resolveTileTexture,
  supportsRenderedMapOrientation
} from "./tile-texture";

describe("tile texture resolution", () => {
  it("maps sprite sheet local ids into source frames", () => {
    const tileset = createImageTileset({
      name: "Terrain",
      tileWidth: 32,
      tileHeight: 32,
      imagePath: "/terrain.png",
      imageWidth: 140,
      imageHeight: 140,
      margin: 1,
      spacing: 2,
      columns: 4
    });

    expect(getTilesetTileTextureFrame(tileset, 5)).toEqual({
      x: 35,
      y: 35,
      width: 32,
      height: 32
    });
  });

  it("resolves gids across sprite sheet and image collection tilesets", () => {
    const terrain = createImageTileset({
      name: "Terrain",
      tileWidth: 32,
      tileHeight: 32,
      imagePath: "/terrain.png",
      imageWidth: 128,
      imageHeight: 64,
      columns: 4
    });
    const props = createImageCollectionTileset({
      name: "Props",
      tileWidth: 32,
      tileHeight: 32,
      imageSources: ["/prop-1.png", "/prop-2.png", "/prop-3.png"]
    });
    const map = createMap({
      name: "map-1",
      orientation: "orthogonal",
      width: 10,
      height: 10,
      tileWidth: 32,
      tileHeight: 32,
      layers: [],
      tilesetIds: [terrain.id, props.id]
    });

    expect(resolveTileTexture(map, [terrain, props], 6)).toEqual({
      imagePath: "/terrain.png",
      frame: {
        x: 32,
        y: 32,
        width: 32,
        height: 32
      }
    });
    expect(
      resolveTileTexture(
        map,
        [terrain, props],
        getTilesetTileCount(terrain) + 2
      )
    ).toEqual({
      imagePath: "/prop-2.png"
    });
  });

  it("marks non-orthogonal maps as not yet renderable", () => {
    const orthogonalMap = createMap({
      name: "orthogonal-map",
      orientation: "orthogonal",
      width: 4,
      height: 4,
      tileWidth: 32,
      tileHeight: 32,
      layers: []
    });
    const isometricMap = createMap({
      name: "isometric-map",
      orientation: "isometric",
      width: 4,
      height: 4,
      tileWidth: 32,
      tileHeight: 32,
      layers: []
    });

    expect(supportsRenderedMapOrientation(orthogonalMap)).toBe(true);
    expect(supportsRenderedMapOrientation(isometricMap)).toBe(false);
  });
});
