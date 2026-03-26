import { describe, expect, it } from "vitest";

import {
  buildExampleProjectAssetDescriptors,
  resolveExampleMapDocumentPath,
  resolveExampleTilesetDocumentPath,
  type ExampleProjectDescriptor
} from "./schema";

describe("example project schema helpers", () => {
  it("builds project asset descriptors from maps, tilesets and image assets", () => {
    const descriptor: ExampleProjectDescriptor = {
      project: {
        name: "Demo",
        assetRoots: ["maps", "tilesets", "templates"]
      },
      tilesets: [
        {
          key: "terrain-core",
          kind: "image",
          name: "Terrain Core",
          path: "tilesets/terrain-core.tsj",
          tileWidth: 32,
          tileHeight: 32,
          imagePath: "assets/terrain-core.svg",
          imageWidth: 64,
          imageHeight: 32,
          columns: 2
        },
        {
          key: "props-collection",
          kind: "image-collection",
          name: "Props Collection",
          path: "tilesets/props-collection.tsj",
          tileWidth: 32,
          tileHeight: 32,
          imageSources: ["assets/props/prop-1.svg", "assets/props/prop-2.svg"]
        }
      ],
      maps: [
        {
          name: "starter-map",
          path: "maps/starter-map.tmj",
          orientation: "orthogonal",
          width: 8,
          height: 8,
          tileWidth: 32,
          tileHeight: 32,
          tilesetKeys: ["terrain-core"]
        }
      ],
      auxiliaryAssets: [
        {
          kind: "file",
          path: "rules.txt"
        },
        {
          kind: "map",
          path: "maps/automapping/ruins-fill.tmj"
        }
      ]
    };

    expect(buildExampleProjectAssetDescriptors(descriptor)).toEqual([
      {
        id: "image:assets/props/prop-1.svg",
        kind: "image",
        name: "prop-1.svg",
        path: "assets/props/prop-1.svg"
      },
      {
        id: "image:assets/props/prop-2.svg",
        kind: "image",
        name: "prop-2.svg",
        path: "assets/props/prop-2.svg"
      },
      {
        id: "image:assets/terrain-core.svg",
        kind: "image",
        name: "terrain-core.svg",
        path: "assets/terrain-core.svg"
      },
      {
        id: "map:maps/automapping/ruins-fill.tmj",
        kind: "map",
        name: "ruins-fill.tmj",
        path: "maps/automapping/ruins-fill.tmj"
      },
      {
        id: "map:maps/starter-map.tmj",
        kind: "map",
        name: "starter-map.tmj",
        path: "maps/starter-map.tmj"
      },
      {
        id: "project:project.json",
        kind: "project",
        name: "project.json",
        path: "project.json"
      },
      {
        id: "file:rules.txt",
        kind: "file",
        name: "rules.txt",
        path: "rules.txt"
      },
      {
        id: "tileset:tilesets/props-collection.tsj",
        kind: "tileset",
        name: "props-collection.tsj",
        path: "tilesets/props-collection.tsj"
      },
      {
        id: "tileset:tilesets/terrain-core.tsj",
        kind: "tileset",
        name: "terrain-core.tsj",
        path: "tilesets/terrain-core.tsj"
      }
    ]);
  });

  it("derives fallback document paths when no explicit path is configured", () => {
    expect(
      resolveExampleMapDocumentPath({
        name: "Starter Map"
      })
    ).toBe("maps/starter-map.tmj");
    expect(
      resolveExampleTilesetDocumentPath({
        key: "terrain-core"
      })
    ).toBe("tilesets/terrain-core.tsj");
  });
});
