import { describe, expect, it } from "vitest";

import { createEntityId, createProject } from "@pixel-editor/domain";

import {
  exportTiledProjectDocument,
  importTiledProjectDocument,
  stringifyTiledProjectDocument
} from "./index";

describe("@pixel-editor/tiled-project", () => {
  it("imports tiled project metadata and property types", () => {
    const imported = importTiledProjectDocument(
      {
        folders: ["maps", "tilesets"],
        extensionsPath: "extensions",
        automappingRulesFile: "rules.txt",
        compatibilityVersion: 1120,
        propertyTypes: [
          {
            id: 1,
            type: "enum",
            name: "Biome",
            storageType: "string",
            values: ["forest", "desert"],
            valuesAsFlags: false
          },
          {
            id: 2,
            type: "class",
            name: "EncounterConfig",
            color: "#ff00ff00",
            drawFill: false,
            useAs: ["map", "project", "wangcolor", "unsupported-target"],
            members: [
              {
                name: "biome",
                type: "string",
                propertyType: "Biome",
                value: "forest"
              },
              {
                name: "spawnRate",
                type: "float",
                value: 1.5
              }
            ]
          }
        ],
        commands: [{ name: "Build" }],
        properties: [{ name: "debug", type: "bool", value: true }],
        mysteryField: true
      },
      {
        documentPath: "projects/demo.tiled-project"
      }
    );

    expect(imported.project).toMatchObject({
      name: "demo",
      assetRoots: ["maps", "tilesets"],
      compatibilityVersion: "1.12",
      extensionsDirectory: "extensions",
      automappingRulesFile: "rules.txt"
    });
    expect(imported.project.propertyTypes).toMatchObject([
      {
        kind: "enum",
        name: "Biome",
        storageType: "string",
        values: ["forest", "desert"],
        valuesAsFlags: false
      },
      {
        kind: "class",
        name: "EncounterConfig",
        color: "#ff00ff00",
        drawFill: false,
        useAs: ["map", "project", "wangcolor"],
        fields: [
          {
            name: "biome",
            valueType: "enum",
            propertyTypeName: "Biome",
            defaultValue: "forest"
          },
          {
            name: "spawnRate",
            valueType: "float",
            defaultValue: 1.5
          }
        ]
      }
    ]);
    expect(imported.assetReferences).toEqual([
      expect.objectContaining({
        kind: "project-folder",
        ownerPath: "project.folders[0]",
        originalPath: "maps"
      }),
      expect.objectContaining({
        kind: "project-folder",
        ownerPath: "project.folders[1]",
        originalPath: "tilesets"
      }),
      expect.objectContaining({
        kind: "extensions",
        ownerPath: "project.extensionsPath",
        originalPath: "extensions"
      }),
      expect.objectContaining({
        kind: "automapping-rules",
        ownerPath: "project.automappingRulesFile",
        originalPath: "rules.txt"
      })
    ]);
    expect(imported.issues).toEqual([
      expect.objectContaining({
        code: "project.field.unknown",
        path: "project.mysteryField"
      }),
      expect.objectContaining({
        code: "project.propertyType.useAsUnsupported",
        path: "project.propertyTypes[1].useAs[3]"
      }),
      expect.objectContaining({
        code: "project.commands.unsupported",
        path: "project.commands"
      }),
      expect.objectContaining({
        code: "project.properties.unsupported",
        path: "project.properties"
      })
    ]);
  });

  it("exports deterministic tiled project json", () => {
    const project = createProject({
      name: "Demo",
      assetRoots: [".", "maps", "../tests"],
      compatibilityVersion: "1.12",
      extensionsDirectory: "extensions",
      automappingRulesFile: "rules.txt",
      propertyTypes: [
        {
          id: createEntityId("propertyType"),
          kind: "enum",
          name: "Biome",
          storageType: "string",
          values: ["forest", "desert"],
          valuesAsFlags: false
        },
        {
          id: createEntityId("propertyType"),
          kind: "class",
          name: "EncounterConfig",
          useAs: ["map", "project"],
          color: "#ff00ff00",
          drawFill: false,
          fields: [
            {
              name: "biome",
              valueType: "enum",
              propertyTypeName: "Biome",
              defaultValue: "desert"
            },
            {
              name: "spawnRate",
              valueType: "float",
              defaultValue: 2.5
            }
          ]
        }
      ]
    });

    const exported = exportTiledProjectDocument({
      project
    });

    expect(exported).toEqual({
      automappingRulesFile: "rules.txt",
      commands: [],
      compatibilityVersion: 1120,
      extensionsPath: "extensions",
      folders: [".", "maps", "../tests"],
      properties: [],
      propertyTypes: [
        {
          id: 1,
          type: "enum",
          name: "Biome",
          storageType: "string",
          values: ["forest", "desert"],
          valuesAsFlags: false
        },
        {
          id: 2,
          type: "class",
          name: "EncounterConfig",
          color: "#ff00ff00",
          drawFill: false,
          useAs: ["map", "project"],
          members: [
            {
              name: "biome",
              type: "string",
              propertyType: "Biome",
              value: "desert"
            },
            {
              name: "spawnRate",
              type: "float",
              value: 2.5
            }
          ]
        }
      ]
    });
    expect(JSON.parse(stringifyTiledProjectDocument({ project }))).toEqual(exported);
  });
});
