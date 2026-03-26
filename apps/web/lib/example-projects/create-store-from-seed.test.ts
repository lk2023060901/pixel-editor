import { describe, expect, it } from "vitest";

import type { ExampleProjectSeed } from "./schema";
import { createEditorStoreFromExampleSeed } from "./create-store-from-seed";

describe("createEditorStoreFromExampleSeed", () => {
  it("materializes project assets with attached document ids", () => {
    const seed: ExampleProjectSeed = {
      projectId: "demo-project",
      project: {
        name: "Example Terrain Project",
        assetRoots: ["maps", "tilesets", "templates"]
      },
      projectAssets: [
        {
          id: "project:project.json",
          kind: "project",
          name: "project.json",
          path: "project.json"
        },
        {
          id: "map:maps/starter-map.tmj",
          kind: "map",
          name: "starter-map.tmj",
          path: "maps/starter-map.tmj"
        },
        {
          id: "tileset:tilesets/terrain-core.tsj",
          kind: "tileset",
          name: "terrain-core.tsj",
          path: "tilesets/terrain-core.tsj"
        },
        {
          id: "image:assets/terrain-core.svg",
          kind: "image",
          name: "terrain-core.svg",
          path: "assets/terrain-core.svg"
        }
      ],
      tilesets: [
        {
          key: "terrain-core",
          kind: "image",
          name: "Terrain Core",
          path: "tilesets/terrain-core.tsj",
          tileWidth: 32,
          tileHeight: 32,
          imagePath: "/terrain-core.svg",
          imageWidth: 64,
          imageHeight: 32,
          columns: 2
        }
      ],
      maps: [
        {
          name: "starter-map",
          path: "maps/starter-map.tmj",
          orientation: "orthogonal",
          width: 64,
          height: 64,
          tileWidth: 32,
          tileHeight: 32,
          tilesetKeys: ["terrain-core"]
        }
      ]
    };

    const store = createEditorStoreFromExampleSeed(seed);
    const snapshot = store.getSnapshot();

    expect(snapshot.bootstrap.projectAssets).toEqual([
      {
        id: "project:project.json",
        kind: "project",
        name: "project.json",
        path: "project.json"
      },
      {
        id: "map:maps/starter-map.tmj",
        kind: "map",
        name: "starter-map.tmj",
        path: "maps/starter-map.tmj",
        documentId: snapshot.activeMap?.id
      },
      {
        id: "tileset:tilesets/terrain-core.tsj",
        kind: "tileset",
        name: "terrain-core.tsj",
        path: "tilesets/terrain-core.tsj",
        documentId: snapshot.workspace.tilesets[0]?.id
      },
      {
        id: "image:assets/terrain-core.svg",
        kind: "image",
        name: "terrain-core.svg",
        path: "assets/terrain-core.svg"
      }
    ]);
  });

  it("preserves project property types and map typed properties", () => {
    const seed: ExampleProjectSeed = {
      projectId: "demo-project",
      project: {
        name: "Example Terrain Project",
        assetRoots: ["maps", "tilesets", "templates"],
        propertyTypes: [
          {
            kind: "enum",
            name: "Biome",
            storageType: "string",
            values: ["forest", "ruins", "cave"],
            valuesAsFlags: false
          },
          {
            kind: "class",
            name: "EncounterConfig",
            useAs: ["map"],
            fields: [
              {
                name: "enabled",
                valueType: "bool",
                defaultValue: true
              },
              {
                name: "biome",
                valueType: "enum",
                propertyTypeName: "Biome",
                defaultValue: "forest"
              }
            ]
          }
        ]
      },
      tilesets: [],
      maps: [
        {
          name: "starter-map",
          orientation: "orthogonal",
          width: 64,
          height: 64,
          tileWidth: 32,
          tileHeight: 32,
          properties: [
            {
              name: "biome",
              type: "enum",
              propertyTypeName: "Biome",
              value: "forest"
            },
            {
              name: "encounter",
              type: "class",
              propertyTypeName: "EncounterConfig",
              value: {
                members: {
                  enabled: true,
                  biome: "ruins"
                }
              }
            }
          ],
          tilesetKeys: []
        }
      ]
    };

    const store = createEditorStoreFromExampleSeed(seed);
    const activeMap = store.getSnapshot().activeMap;

    expect(store.getState().project.propertyTypes).toHaveLength(2);
    expect(store.getState().project.propertyTypes[0]).toMatchObject({
      kind: "enum",
      name: "Biome",
      storageType: "string"
    });
    expect(store.getState().project.propertyTypes[1]).toMatchObject({
      kind: "class",
      name: "EncounterConfig"
    });
    expect(activeMap?.properties).toEqual([
      {
        name: "biome",
        type: "enum",
        propertyTypeName: "Biome",
        value: "forest"
      },
      {
        name: "encounter",
        type: "class",
        propertyTypeName: "EncounterConfig",
        value: {
          members: {
            enabled: true,
            biome: "ruins"
          }
        }
      }
    ]);
  });

  it("applies seeded tile metadata and leaves typed tile class defaults to the UI layer", () => {
    const seed: ExampleProjectSeed = {
      projectId: "demo-project",
      project: {
        name: "Example Terrain Project",
        assetRoots: ["maps", "tilesets", "templates"],
        propertyTypes: [
          {
            kind: "enum",
            name: "Biome",
            storageType: "string",
            values: ["forest", "ruins", "cave"],
            valuesAsFlags: false
          },
          {
            kind: "class",
            name: "TerrainTile",
            useAs: ["tile"],
            fields: [
              {
                name: "biome",
                valueType: "enum",
                propertyTypeName: "Biome",
                defaultValue: "forest"
              },
              {
                name: "walkable",
                valueType: "bool",
                defaultValue: true
              }
            ]
          }
        ]
      },
      tilesets: [
        {
          key: "terrain-core",
          kind: "image",
          name: "Terrain Core",
          tileWidth: 32,
          tileHeight: 32,
          imagePath: "/terrain-core.svg",
          imageWidth: 64,
          imageHeight: 32,
          columns: 2,
          tiles: [
            {
              localId: 0,
              className: "TerrainTile",
              properties: [
                {
                  name: "biome",
                  type: "enum",
                  propertyTypeName: "Biome",
                  value: "ruins"
                }
              ]
            }
          ]
        }
      ],
      maps: [
        {
          name: "starter-map",
          orientation: "orthogonal",
          width: 8,
          height: 8,
          tileWidth: 32,
          tileHeight: 32,
          tilesetKeys: ["terrain-core"]
        }
      ]
    };

    const store = createEditorStoreFromExampleSeed(seed);
    const seededTile = store.getState().tilesets[0]?.tiles[0];

    expect(seededTile).toMatchObject({
      localId: 0,
      className: "TerrainTile",
      properties: [
        {
          name: "biome",
          type: "enum",
          propertyTypeName: "Biome",
          value: "ruins"
        }
      ]
    });
  });

  it("applies seeded Wang sets to created tilesets", () => {
    const seed: ExampleProjectSeed = {
      projectId: "demo-project",
      project: {
        name: "Example Terrain Project",
        assetRoots: ["maps", "tilesets", "templates"]
      },
      tilesets: [
        {
          key: "terrain-core",
          kind: "image",
          name: "Terrain Core",
          tileWidth: 32,
          tileHeight: 32,
          imagePath: "/terrain-core.svg",
          imageWidth: 64,
          imageHeight: 32,
          columns: 2,
          wangSets: [
            {
              name: "Core Terrain",
              type: "mixed"
            }
          ]
        }
      ],
      maps: [
        {
          name: "starter-map",
          orientation: "orthogonal",
          width: 8,
          height: 8,
          tileWidth: 32,
          tileHeight: 32,
          tilesetKeys: ["terrain-core"]
        }
      ]
    };

    const store = createEditorStoreFromExampleSeed(seed);

    expect(store.getState().tilesets[0]?.wangSets).toMatchObject([
      {
        name: "Core Terrain",
        type: "mixed"
      }
    ]);
  });
});
