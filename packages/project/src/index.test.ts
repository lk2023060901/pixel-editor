import { describe, expect, it } from "vitest";

import {
  createClassPropertyTypeDefinition,
  createEnumPropertyTypeDefinition,
  createMap,
  createMapObject,
  createObjectLayer,
  createObjectTemplate,
  createProject,
  createProperty,
  createTileDefinition,
  createTileset,
  createWorld
} from "@pixel-editor/domain";
import { createEditorWorkspaceState } from "@pixel-editor/editor-state";

import {
  replaceProjectCommand,
  replaceProjectPropertyTypesCommand
} from "./index";

describe("replaceProjectCommand", () => {
  it("replaces project metadata and marks the workspace dirty", () => {
    const before = createEditorWorkspaceState({
      project: createProject({
        name: "Before",
        assetRoots: ["maps"]
      })
    });
    const nextProject = createProject({
      name: "After",
      assetRoots: ["maps", "tilesets"],
      compatibilityVersion: "1.12",
      extensionsDirectory: "extensions",
      automappingRulesFile: "rules.txt"
    });

    const after = replaceProjectCommand(nextProject).run(before);

    expect(after.project).toEqual(nextProject);
    expect(after.session.hasUnsavedChanges).toBe(true);
  });
});

describe("replaceProjectPropertyTypesCommand", () => {
  it("renames referenced enum and class property types across workspace documents", () => {
    const biomeType = createEnumPropertyTypeDefinition({
      name: "Biome",
      values: ["forest", "desert"]
    });
    const encounterType = createClassPropertyTypeDefinition({
      name: "EncounterConfig",
      useAs: ["object", "tile", "layer"],
      fields: [
        {
          name: "biome",
          valueType: "enum",
          propertyTypeName: biomeType.name,
          defaultValue: "forest"
        }
      ],
      color: "#22c55e",
      drawFill: true
    });

    const collisionObject = createMapObject({
      name: "collision-object",
      className: encounterType.name,
      shape: "rectangle",
      properties: [
        createProperty("biome", "enum", "forest", biomeType.name),
        createProperty(
          "encounter",
          "class",
          {
            members: {
              biome: "forest"
            }
          },
          encounterType.name
        )
      ]
    });
    const collisionLayer = createObjectLayer({
      name: "collision",
      className: encounterType.name,
      properties: [createProperty("biome", "enum", "forest", biomeType.name)],
      objects: [collisionObject]
    });
    const tile = {
      ...createTileDefinition(0),
      className: encounterType.name,
      properties: [
        createProperty("biome", "enum", "forest", biomeType.name),
        createProperty(
          "encounter",
          "class",
          {
            members: {
              biome: "forest"
            }
          },
          encounterType.name
        )
      ],
      collisionLayer
    };
    const tileset = {
      ...createTileset({
        name: "terrain",
        kind: "image",
        tileWidth: 32,
        tileHeight: 32
      }),
      properties: [createProperty("biome", "enum", "forest", biomeType.name)],
      tiles: [tile]
    };
    const objectLayer = createObjectLayer({
      name: "Objects",
      className: encounterType.name,
      properties: [createProperty("biome", "enum", "forest", biomeType.name)],
      objects: [
        createMapObject({
          name: "spawn",
          className: encounterType.name,
          shape: "rectangle",
          properties: [
            createProperty("biome", "enum", "forest", biomeType.name),
            createProperty(
              "encounter",
              "class",
              {
                members: {
                  biome: "forest"
                }
              },
              encounterType.name
            )
          ]
        })
      ]
    });
    const map = createMap({
      name: "starter-map",
      orientation: "orthogonal",
      width: 10,
      height: 10,
      tileWidth: 32,
      tileHeight: 32,
      properties: [
        createProperty("biome", "enum", "forest", biomeType.name),
        createProperty(
          "encounter",
          "class",
          {
            members: {
              biome: "forest"
            }
          },
          encounterType.name
        )
      ],
      layers: [objectLayer]
    });
    const template = createObjectTemplate(
      "spawn-template",
      createMapObject({
        name: "spawn-template-object",
        className: encounterType.name,
        shape: "rectangle",
        properties: [createProperty("biome", "enum", "forest", biomeType.name)]
      })
    );
    const world = createWorld("world", [], [
      createProperty("biome", "enum", "forest", biomeType.name)
    ]);
    const before = createEditorWorkspaceState({
      project: createProject({
        name: "demo",
        assetRoots: ["maps"],
        propertyTypes: [biomeType, encounterType]
      }),
      maps: [map],
      tilesets: [tileset],
      templates: [template],
      worlds: [world]
    });
    const renamedBiomeType = {
      ...biomeType,
      name: "BiomeType"
    };
    const renamedEncounterType = {
      ...encounterType,
      name: "Encounter"
    };

    const after = replaceProjectPropertyTypesCommand([
      renamedBiomeType,
      renamedEncounterType
    ]).run(before);

    expect(after.project.propertyTypes).toMatchObject([
      {
        id: biomeType.id,
        name: "BiomeType"
      },
      {
        id: encounterType.id,
        name: "Encounter",
        fields: [
          {
            name: "biome",
            propertyTypeName: "BiomeType"
          }
        ]
      }
    ]);
    expect(after.maps[0]?.properties).toContainEqual(
      expect.objectContaining({ propertyTypeName: "BiomeType" })
    );
    expect(after.maps[0]?.layers[0]).toMatchObject({
      className: "Encounter",
      properties: [expect.objectContaining({ propertyTypeName: "BiomeType" })],
      objects: [
        expect.objectContaining({
          className: "Encounter",
          properties: [
            expect.objectContaining({ propertyTypeName: "BiomeType" }),
            expect.objectContaining({ propertyTypeName: "Encounter" })
          ]
        })
      ]
    });
    expect(after.tilesets[0]).toMatchObject({
      properties: [expect.objectContaining({ propertyTypeName: "BiomeType" })],
      tiles: [
        expect.objectContaining({
          className: "Encounter",
          properties: [
            expect.objectContaining({ propertyTypeName: "BiomeType" }),
            expect.objectContaining({ propertyTypeName: "Encounter" })
          ],
          collisionLayer: expect.objectContaining({
            className: "Encounter",
            properties: [expect.objectContaining({ propertyTypeName: "BiomeType" })],
            objects: [
              expect.objectContaining({
                className: "Encounter",
                properties: [
                  expect.objectContaining({ propertyTypeName: "BiomeType" }),
                  expect.objectContaining({ propertyTypeName: "Encounter" })
                ]
              })
            ]
          })
        })
      ]
    });
    expect(after.templates[0]?.object).toMatchObject({
      className: "Encounter",
      properties: [expect.objectContaining({ propertyTypeName: "BiomeType" })]
    });
    expect(after.worlds[0]?.properties).toContainEqual(
      expect.objectContaining({ propertyTypeName: "BiomeType" })
    );
    expect(after.session.hasUnsavedChanges).toBe(true);
  });
});
