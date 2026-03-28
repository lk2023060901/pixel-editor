import { describe, expect, it } from "vitest";

import {
  createGroupLayer,
  createImageCollectionTileset,
  createImageLayer,
  createImageTileset,
  createMap,
  createTileLayer
} from "@pixel-editor/domain";

import { collectRendererSnapshotTexturePaths } from "./scene-textures";

describe("scene textures", () => {
  it("collects unique texture paths from image layers and tilesets", () => {
    const map = createMap({
      name: "Preview",
      orientation: "orthogonal",
      width: 8,
      height: 6,
      tileWidth: 16,
      tileHeight: 16
    });
    const imageLayer = createImageLayer({
      name: "Backdrop",
      imagePath: "/layers/backdrop.png"
    });
    const groupedImageLayer = createGroupLayer({
      name: "Group",
      layers: [
        createTileLayer({
          name: "Ground",
          width: 8,
          height: 6
        }),
        createImageLayer({
          name: "Mist",
          imagePath: "/layers/mist.png"
        }),
        createImageLayer({
          name: "Duplicate",
          imagePath: "/layers/backdrop.png"
        })
      ]
    });

    map.layers.push(imageLayer, groupedImageLayer);

    const imageTileset = createImageTileset({
      name: "Terrain",
      tileWidth: 16,
      tileHeight: 16,
      imagePath: "/tilesets/terrain.png",
      imageWidth: 64,
      imageHeight: 64
    });
    const collectionTileset = createImageCollectionTileset({
      name: "Props",
      tileWidth: 16,
      tileHeight: 16,
      imageSources: ["/tilesets/prop-1.png", "/tilesets/prop-2.png", "/tilesets/terrain.png"]
    });

    expect(
      collectRendererSnapshotTexturePaths({
        map,
        tilesets: [imageTileset, collectionTileset]
      })
    ).toEqual([
      "/layers/backdrop.png",
      "/layers/mist.png",
      "/tilesets/terrain.png",
      "/tilesets/prop-1.png",
      "/tilesets/prop-2.png"
    ]);
  });
});
