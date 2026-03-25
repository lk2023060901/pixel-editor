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
});
