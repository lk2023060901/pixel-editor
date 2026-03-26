import { describe, expect, it } from "vitest";

import { createProperty, createWorld } from "@pixel-editor/domain";

import {
  exportTiledWorldDocument,
  importTiledWorldDocument,
  stringifyTiledWorldDocument
} from "./index";

describe("@pixel-editor/tiled-world", () => {
  it("imports a world document with map references, patterns and file property asset references", () => {
    const imported = importTiledWorldDocument(
      {
        type: "world",
        maps: [
          {
            fileName: "../maps/starter-map.tmj",
            x: 0,
            y: 32,
            width: 320,
            height: 160,
            ignored: true
          }
        ],
        patterns: [
          {
            regexp: "chunk_(\\d+)_(\\d+)\\.tmj",
            multiplierX: 64,
            offsetY: 16
          }
        ],
        properties: [
          {
            name: "rules",
            type: "file",
            value: "../rules/biome.txt"
          }
        ],
        onlyShowAdjacentMaps: true,
        unexpectedField: true
      },
      {
        documentPath: "worlds/demo.world",
        assetRoots: ["maps", "rules", "worlds"]
      }
    );

    expect(imported.world).toMatchObject({
      name: "demo",
      maps: [
        {
          fileName: "maps/starter-map.tmj",
          x: 0,
          y: 32,
          width: 320,
          height: 160
        }
      ],
      patterns: [
        {
          regexp: "chunk_(\\d+)_(\\d+)\\.tmj",
          multiplierX: 64,
          multiplierY: 1,
          offsetX: 0,
          offsetY: 16,
          mapWidth: 64,
          mapHeight: 1
        }
      ],
      onlyShowAdjacentMaps: true,
      properties: [createProperty("rules", "file", "../rules/biome.txt")]
    });
    expect(imported.assetReferences).toEqual([
      expect.objectContaining({
        kind: "map",
        ownerPath: "world.maps[0].fileName",
        originalPath: "../maps/starter-map.tmj",
        resolvedPath: "maps/starter-map.tmj"
      }),
      expect.objectContaining({
        kind: "property-file",
        ownerPath: "world.properties[0].value",
        originalPath: "../rules/biome.txt",
        resolvedPath: "rules/biome.txt"
      })
    ]);
    expect(imported.issues).toEqual([
      expect.objectContaining({
        code: "world.field.unknown",
        path: "world.unexpectedField"
      }),
      expect.objectContaining({
        code: "world.field.unknown",
        path: "world.maps[0].ignored"
      })
    ]);
  });

  it("reports invalid world patterns and keeps valid content", () => {
    const imported = importTiledWorldDocument({
      type: "world",
      patterns: [
        {
          regexp: "chunk_(\\d+)\\.tmj"
        }
      ]
    });

    expect(imported.world.patterns).toEqual([]);
    expect(imported.issues).toEqual([
      expect.objectContaining({
        code: "world.pattern.captureCount.invalid",
        path: "world.patterns[0].regexp"
      }),
      expect.objectContaining({
        code: "world.empty",
        path: "world"
      })
    ]);
  });

  it("exports world documents deterministically and relativizes map paths against the world path", () => {
    const world = createWorld(
      "demo",
      [
        {
          fileName: "maps/starter-map.tmj",
          x: 10,
          y: 20,
          width: 320,
          height: 160
        }
      ],
      [createProperty("rules", "file", "../rules/biome.txt")],
      {
        patterns: [
          {
            regexp: "chunk_(\\d+)_(\\d+)\\.tmj",
            multiplierX: 64,
            multiplierY: 32,
            offsetX: 5,
            offsetY: 6,
            mapWidth: 96,
            mapHeight: 64
          }
        ],
        onlyShowAdjacentMaps: true
      }
    );

    const exported = exportTiledWorldDocument({
      world,
      documentPath: "worlds/demo.world"
    });

    expect(exported).toEqual({
      maps: [
        {
          fileName: "../maps/starter-map.tmj",
          x: 10,
          y: 20,
          width: 320,
          height: 160
        }
      ],
      patterns: [
        {
          regexp: "chunk_(\\d+)_(\\d+)\\.tmj",
          multiplierX: 64,
          multiplierY: 32,
          offsetX: 5,
          offsetY: 6,
          mapWidth: 96,
          mapHeight: 64
        }
      ],
      properties: [
        {
          name: "rules",
          type: "file",
          value: "../rules/biome.txt"
        }
      ],
      type: "world",
      onlyShowAdjacentMaps: true
    });
    expect(stringifyTiledWorldDocument({ world, documentPath: "worlds/demo.world" })).toBe(
      JSON.stringify(exported, null, 2)
    );
  });
});
