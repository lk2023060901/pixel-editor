import { describe, expect, it } from "vitest";

import type { ExampleProjectSeed } from "./schema";
import { createEditorStoreFromExampleSeed } from "./create-store-from-seed";

describe("createEditorStoreFromExampleSeed", () => {
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
});
