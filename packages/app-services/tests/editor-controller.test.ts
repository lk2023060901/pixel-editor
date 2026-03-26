import { describe, expect, it } from "vitest";

import {
  createClassPropertyTypeDefinition,
  createProject,
  createProperty,
  createMap,
  createTileLayer,
  createObjectLayer,
  createMapObject,
  createTileDefinition,
  createTileset,
  createWorld,
  createObjectTemplate,
  createEnumPropertyTypeDefinition,
  paintTileInMap,
  getMapGlobalTileGid,
  getTileLayerCell,
  type TileAnimationFrame
} from "@pixel-editor/domain";
import {
  createEditorWorkspaceState,
  createSingleTileStamp,
  getTileStampPrimaryGid
} from "@pixel-editor/editor-state";

import { createEditorStore, type SavedEditorDocument } from "../src/controller";
import { createTestEditorStore } from "./support/create-test-editor-store";

describe("editor controller", () => {
  it("returns a stable snapshot reference until state changes", () => {
    const store = createTestEditorStore("demo");

    const firstSnapshot = store.getSnapshot();
    const secondSnapshot = store.getSnapshot();

    expect(secondSnapshot).toBe(firstSnapshot);

    store.zoomIn();

    const thirdSnapshot = store.getSnapshot();

    expect(thirdSnapshot).not.toBe(firstSnapshot);
    expect(store.getSnapshot()).toBe(thirdSnapshot);
  });

  it("creates a quick map through the controller preset API", () => {
    const store = createTestEditorStore("demo");
    const initialMapCount = store.getState().maps.length;

    const mapId = store.createQuickMapDocument();
    const snapshot = store.getSnapshot();

    expect(snapshot.workspace.maps).toHaveLength(initialMapCount + 1);
    expect(snapshot.activeMap?.id).toBe(mapId);
    expect(snapshot.activeMap?.name).toBe("map-2");
    expect(snapshot.activeMap?.settings).toMatchObject({
      orientation: "orthogonal",
      width: 48,
      height: 32,
      tileWidth: 32,
      tileHeight: 32
    });
  });

  it("replaces project property types and migrates renamed references", () => {
    const biomeType = createEnumPropertyTypeDefinition({
      name: "Biome",
      values: ["forest", "desert"]
    });
    const encounterType = createClassPropertyTypeDefinition({
      name: "EncounterConfig",
      useAs: ["object", "tile"],
      fields: [
        {
          name: "biome",
          valueType: "enum",
          propertyTypeName: "Biome",
          defaultValue: "forest"
        }
      ]
    });
    const store = createEditorStore(
      createEditorWorkspaceState({
        project: createProject({
          name: "demo",
          assetRoots: ["maps"],
          propertyTypes: [biomeType, encounterType]
        }),
        maps: [
          createMap({
            name: "starter-map",
            orientation: "orthogonal",
            width: 8,
            height: 8,
            tileWidth: 32,
            tileHeight: 32,
            properties: [createProperty("biome", "enum", "forest", "Biome")],
            layers: [
              createObjectLayer({
                name: "Objects",
                objects: [
                  createMapObject({
                    name: "spawn",
                    className: "EncounterConfig",
                    shape: "rectangle",
                    properties: [
                      createProperty("encounter", "class", { members: { biome: "forest" } }, "EncounterConfig")
                    ]
                  })
                ]
              })
            ]
          })
        ],
        tilesets: [
          {
            ...createTileset({
              name: "terrain",
              kind: "image",
              tileWidth: 32,
              tileHeight: 32
            }),
            tiles: [
              {
                ...createTileDefinition(0),
                className: "EncounterConfig",
                properties: [createProperty("biome", "enum", "forest", "Biome")]
              }
            ]
          }
        ],
        templates: [
          createObjectTemplate(
            "spawn-template",
            createMapObject({
              name: "spawn-template-object",
              className: "EncounterConfig",
              shape: "rectangle"
            })
          )
        ],
        worlds: [createWorld("world", [], [createProperty("biome", "enum", "forest", "Biome")])]
      })
    );

    store.replaceProjectPropertyTypes([
      {
        ...biomeType,
        name: "BiomeType"
      },
      {
        ...encounterType,
        name: "Encounter"
      }
    ]);

    const snapshot = store.getSnapshot();

    expect(snapshot.workspace.project.propertyTypes).toMatchObject([
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
    expect(snapshot.workspace.maps[0]?.properties).toContainEqual(
      expect.objectContaining({ propertyTypeName: "BiomeType" })
    );
    expect(snapshot.workspace.maps[0]?.layers[0]).toMatchObject({
      objects: [
        expect.objectContaining({
          className: "Encounter",
          properties: [expect.objectContaining({ propertyTypeName: "Encounter" })]
        })
      ]
    });
    expect(snapshot.workspace.tilesets[0]?.tiles[0]).toMatchObject({
      className: "Encounter",
      properties: [expect.objectContaining({ propertyTypeName: "BiomeType" })]
    });
    expect(snapshot.workspace.templates[0]?.object.className).toBe("Encounter");
    expect(snapshot.workspace.worlds[0]?.properties).toContainEqual(
      expect.objectContaining({ propertyTypeName: "BiomeType" })
    );
  });

  it("updates project details through the controller", () => {
    const store = createTestEditorStore("demo");

    store.updateProjectDetails({
      compatibilityVersion: "latest",
      extensionsDirectory: "scripts/extensions",
      automappingRulesFile: "rules.txt",
      exportOptions: {
        embedTilesets: true,
        detachTemplateInstances: true
      }
    });

    const snapshot = store.getSnapshot();

    expect(snapshot.workspace.project).toMatchObject({
      compatibilityVersion: "latest",
      extensionsDirectory: "scripts/extensions",
      automappingRulesFile: "rules.txt",
      exportOptions: {
        embedTilesets: true,
        detachTemplateInstances: true,
        resolveObjectTypesAndProperties: false,
        exportMinimized: false
      }
    });
  });

  it("saves native map, tileset, template and world documents through the document repository", async () => {
    const tileset = createTileset({
      name: "Terrain",
      kind: "image",
      tileWidth: 32,
      tileHeight: 32,
      source: {
        imagePath: "assets/terrain.png",
        imageWidth: 64,
        imageHeight: 32,
        margin: 0,
        spacing: 0,
        columns: 2
      }
    });
    const map = createMap({
      name: "starter-map",
      orientation: "orthogonal",
      width: 8,
      height: 8,
      tileWidth: 32,
      tileHeight: 32,
      tilesetIds: [tileset.id],
      layers: [
        createTileLayer({
          name: "Ground",
          width: 8,
          height: 8
        })
      ]
    });
    const template = createObjectTemplate(
      "spawn-template",
      createMapObject({
        name: "spawn",
        shape: "rectangle",
        width: 32,
        height: 32
      })
    );
    const world = createWorld("demo-world", [
      {
        fileName: "maps/starter-map.tmx",
        x: 0,
        y: 0,
        width: 256,
        height: 256
      }
    ]);
    const savedDocuments: SavedEditorDocument[] = [];
    const store = createEditorStore(
      createEditorWorkspaceState({
        project: createProject({
          name: "demo",
          assetRoots: ["maps", "tilesets", "templates"]
        }),
        maps: [map],
        tilesets: [tileset],
        templates: [template],
        worlds: [world]
      }),
      {
        documents: {
          async saveDocument(document) {
            savedDocuments.push(document);
          }
        },
        projectAssets: [
          {
            id: "map:maps/starter-map.tmx",
            kind: "map",
            name: "starter-map.tmx",
            path: "maps/starter-map.tmx",
            documentId: map.id
          },
          {
            id: "tileset:tilesets/terrain.tsx",
            kind: "tileset",
            name: "terrain.tsx",
            path: "tilesets/terrain.tsx",
            documentId: tileset.id
          },
          {
            id: "template:templates/spawn-template.tx",
            kind: "template",
            name: "spawn-template.tx",
            path: "templates/spawn-template.tx",
            documentId: template.id
          },
          {
            id: "world:demo.world",
            kind: "world",
            name: "demo.world",
            path: "demo.world",
            documentId: world.id
          }
        ]
      }
    );

    expect(await store.saveDocument(map.id)).toBe(true);
    expect(await store.saveDocument(tileset.id)).toBe(true);
    expect(await store.saveDocument(template.id)).toBe(true);
    expect(await store.saveDocument(world.id)).toBe(true);

    expect(savedDocuments).toHaveLength(4);
    expect(savedDocuments[0]).toMatchObject({
      kind: "map",
      path: "maps/starter-map.tmx",
      contentType: "application/xml; charset=utf-8"
    });
    expect(savedDocuments[0]?.content).toContain('source="../tilesets/terrain.tsx"');
    expect(savedDocuments[1]).toMatchObject({
      kind: "tileset",
      path: "tilesets/terrain.tsx",
      contentType: "application/xml; charset=utf-8"
    });
    expect(savedDocuments[1]?.content).toContain("<tileset");
    expect(savedDocuments[2]).toMatchObject({
      kind: "template",
      path: "templates/spawn-template.tx",
      contentType: "application/xml; charset=utf-8"
    });
    expect(savedDocuments[2]?.content).toContain("<template");
    expect(savedDocuments[3]).toMatchObject({
      kind: "world",
      path: "demo.world",
      contentType: "application/json; charset=utf-8"
    });
    expect(savedDocuments[3]?.content).toContain('"type": "world"');
  });

  it("assigns default native paths when saving all unsaved documents", async () => {
    const tileset = createTileset({
      name: "Terrain Core",
      kind: "image",
      tileWidth: 32,
      tileHeight: 32,
      source: {
        imagePath: "assets/terrain.png",
        imageWidth: 64,
        imageHeight: 32,
        margin: 0,
        spacing: 0,
        columns: 2
      }
    });
    const map = createMap({
      name: "Starter Map",
      orientation: "orthogonal",
      width: 8,
      height: 8,
      tileWidth: 32,
      tileHeight: 32,
      tilesetIds: [tileset.id],
      layers: [
        createTileLayer({
          name: "Ground",
          width: 8,
          height: 8
        })
      ]
    });
    const template = createObjectTemplate(
      "Spawn Template",
      createMapObject({
        name: "spawn",
        shape: "rectangle",
        width: 32,
        height: 32
      })
    );
    const world = createWorld("Overworld");
    const savedDocuments: SavedEditorDocument[] = [];
    const store = createEditorStore(
      createEditorWorkspaceState({
        project: createProject({
          name: "demo",
          assetRoots: ["maps", "tilesets", "templates"]
        }),
        maps: [map],
        tilesets: [tileset],
        templates: [template],
        worlds: [world]
      }),
      {
        documents: {
          async saveDocument(document) {
            savedDocuments.push(document);
          }
        }
      }
    );

    expect(await store.saveAllDocuments()).toBe(true);

    expect(savedDocuments.map((document) => document.path)).toEqual([
      "maps/starter-map.tmx",
      "tilesets/terrain-core.tsx",
      "templates/spawn-template.tx",
      "overworld.world"
    ]);
    expect(savedDocuments[0]?.content).toContain('source="../tilesets/terrain-core.tsx"');
    expect(store.getSnapshot().bootstrap.projectAssets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "map", path: "maps/starter-map.tmx" }),
        expect.objectContaining({ kind: "tileset", path: "tilesets/terrain-core.tsx" }),
        expect.objectContaining({ kind: "template", path: "templates/spawn-template.tx" }),
        expect.objectContaining({ kind: "world", path: "overworld.world" })
      ])
    );
  });

  it("runs manual automapping against the active map and remaps rule map gids by tileset source", () => {
    const propsTileset = {
      ...createTileset({
        name: "Props",
        kind: "image",
        tileWidth: 32,
        tileHeight: 32
      }),
      tiles: [createTileDefinition(0), createTileDefinition(1)]
    };
    const terrainTileset = {
      ...createTileset({
        name: "Terrain",
        kind: "image",
        tileWidth: 32,
        tileHeight: 32
      }),
      tiles: [createTileDefinition(0), createTileDefinition(1)]
    };
    const baseMap = createMap({
      name: "starter-map",
      orientation: "orthogonal",
      width: 4,
      height: 4,
      tileWidth: 32,
      tileHeight: 32,
      layers: [
        createTileLayer({
          name: "Ground",
          width: 4,
          height: 4
        })
      ],
      tilesetIds: [propsTileset.id, terrainTileset.id]
    });
    const terrainLocal0Gid = getMapGlobalTileGid(
      baseMap,
      [propsTileset, terrainTileset],
      terrainTileset.id,
      0
    );
    const terrainLocal1Gid = getMapGlobalTileGid(
      baseMap,
      [propsTileset, terrainTileset],
      terrainTileset.id,
      1
    );

    expect(terrainLocal0Gid).toBeDefined();
    expect(terrainLocal1Gid).toBeDefined();

    const paintedMap = paintTileInMap(
      baseMap,
      baseMap.layers[0]!.id,
      0,
      0,
      terrainLocal0Gid!
    );
    const store = createEditorStore(
      createEditorWorkspaceState({
        project: createProject({
          name: "demo",
          assetRoots: ["maps", "tilesets", "templates"],
          automappingRulesFile: "rules.txt"
        }),
        maps: [paintedMap],
        tilesets: [propsTileset, terrainTileset],
        session: {
          activeMapId: paintedMap.id,
          activeLayerId: paintedMap.layers[0]!.id
        }
      }),
      {
        projectAssets: [
          {
            id: "map:maps/starter-map.tmj",
            kind: "map",
            name: "starter-map.tmj",
            path: "maps/starter-map.tmj",
            documentId: paintedMap.id
          },
          {
            id: "tileset:tilesets/props.tsj",
            kind: "tileset",
            name: "props.tsj",
            path: "tilesets/props.tsj",
            documentId: propsTileset.id
          },
          {
            id: "tileset:tilesets/terrain.tsj",
            kind: "tileset",
            name: "terrain.tsj",
            path: "tilesets/terrain.tsj",
            documentId: terrainTileset.id
          },
          {
            id: "file:rules.txt",
            kind: "file",
            name: "rules.txt",
            path: "rules.txt"
          },
          {
            id: "map:maps/automapping/replace.tmj",
            kind: "map",
            name: "replace.tmj",
            path: "maps/automapping/replace.tmj"
          }
        ],
        resolveProjectTextAsset: (path) => {
          if (path === "rules.txt") {
            return "maps/automapping/replace.tmj";
          }

          if (path === "maps/automapping/replace.tmj") {
            return JSON.stringify({
              name: "replace",
              orientation: "orthogonal",
              width: 1,
              height: 1,
              tilewidth: 32,
              tileheight: 32,
              layers: [
                {
                  type: "tilelayer",
                  name: "input_Ground",
                  width: 1,
                  height: 1,
                  data: [1]
                },
                {
                  type: "tilelayer",
                  name: "output_Ground",
                  width: 1,
                  height: 1,
                  data: [2]
                }
              ],
              tilesets: [
                {
                  firstgid: 1,
                  source: "../../tilesets/terrain.tsj"
                }
              ]
            });
          }

          return undefined;
        }
      }
    );

    store.runManualAutomapping();

    const snapshot = store.getSnapshot();
    const groundLayer = snapshot.activeMap?.layers[0];

    expect(groundLayer?.kind).toBe("tile");
    expect(
      groundLayer?.kind === "tile" ? getTileLayerCell(groundLayer, 0, 0)?.gid : undefined
    ).toBe(terrainLocal1Gid);
    expect(snapshot.runtime.issues.entries).toEqual([]);
  });

  it("applies automapping while drawing as a single undoable operation", () => {
    const terrainTileset = {
      ...createTileset({
        name: "Terrain",
        kind: "image",
        tileWidth: 32,
        tileHeight: 32
      }),
      tiles: [createTileDefinition(0), createTileDefinition(1)]
    };
    const baseMap = createMap({
      name: "starter-map",
      orientation: "orthogonal",
      width: 4,
      height: 4,
      tileWidth: 32,
      tileHeight: 32,
      layers: [
        createTileLayer({
          name: "Ground",
          width: 4,
          height: 4
        })
      ],
      tilesetIds: [terrainTileset.id]
    });
    const terrainLocal0Gid = getMapGlobalTileGid(
      baseMap,
      [terrainTileset],
      terrainTileset.id,
      0
    );
    const terrainLocal1Gid = getMapGlobalTileGid(
      baseMap,
      [terrainTileset],
      terrainTileset.id,
      1
    );

    expect(terrainLocal0Gid).toBe(1);
    expect(terrainLocal1Gid).toBe(2);

    const store = createEditorStore(
      createEditorWorkspaceState({
        project: createProject({
          name: "demo",
          assetRoots: ["maps", "tilesets", "templates"],
          automappingRulesFile: "rules.txt"
        }),
        maps: [baseMap],
        tilesets: [terrainTileset],
        session: {
          activeMapId: baseMap.id,
          activeLayerId: baseMap.layers[0]!.id
        }
      }),
      {
        projectAssets: [
          {
            id: "map:maps/starter-map.tmj",
            kind: "map",
            name: "starter-map.tmj",
            path: "maps/starter-map.tmj",
            documentId: baseMap.id
          },
          {
            id: "tileset:tilesets/terrain.tsj",
            kind: "tileset",
            name: "terrain.tsj",
            path: "tilesets/terrain.tsj",
            documentId: terrainTileset.id
          },
          {
            id: "file:rules.txt",
            kind: "file",
            name: "rules.txt",
            path: "rules.txt"
          },
          {
            id: "map:maps/automapping/replace.tmj",
            kind: "map",
            name: "replace.tmj",
            path: "maps/automapping/replace.tmj"
          }
        ],
        resolveProjectTextAsset: (path) => {
          if (path === "rules.txt") {
            return "maps/automapping/replace.tmj";
          }

          if (path === "maps/automapping/replace.tmj") {
            return JSON.stringify({
              name: "replace",
              orientation: "orthogonal",
              width: 1,
              height: 1,
              tilewidth: 32,
              tileheight: 32,
              layers: [
                {
                  type: "tilelayer",
                  name: "input_Ground",
                  width: 1,
                  height: 1,
                  data: [1]
                },
                {
                  type: "tilelayer",
                  name: "output_Ground",
                  width: 1,
                  height: 1,
                  data: [2]
                }
              ],
              tilesets: [
                {
                  firstgid: 1,
                  source: "../../tilesets/terrain.tsj"
                }
              ]
            });
          }

          return undefined;
        }
      }
    );

    store.toggleAutoMapWhileDrawing();
    expect(store.getSnapshot().workspace.session.autoMapWhileDrawing).toBe(true);

    store.selectStampTile(terrainTileset.id, 0);
    store.handleCanvasPrimaryAction(0, 0);

    let snapshot = store.getSnapshot();
    let groundLayer = snapshot.activeMap?.layers[0];

    expect(groundLayer?.kind).toBe("tile");
    expect(
      groundLayer?.kind === "tile" ? getTileLayerCell(groundLayer, 0, 0)?.gid : undefined
    ).toBe(terrainLocal1Gid);

    store.undo();

    snapshot = store.getSnapshot();
    groundLayer = snapshot.activeMap?.layers[0];

    expect(
      groundLayer?.kind === "tile" ? getTileLayerCell(groundLayer, 0, 0)?.gid : undefined
    ).toBeNull();
  });

  it("imports a TMJ document into the workspace through the controller", () => {
    const store = createTestEditorStore("demo");
    const initialMapCount = store.getState().maps.length;

    const imported = store.importTmjMapDocument(
      {
        name: "imported-map",
        orientation: "orthogonal",
        width: 2,
        height: 2,
        tilewidth: 32,
        tileheight: 32,
        layers: [
          {
            type: "tilelayer",
            name: "Ground",
            width: 2,
            height: 2,
            data: [1, 0, 2, 0]
          }
        ],
        tilesets: [
          {
            firstgid: 1,
            source: "../tilesets/terrain.tsj"
          }
        ]
      },
      {
        documentPath: "maps/imported-map.tmj"
      }
    );

    expect(store.getState().maps).toHaveLength(initialMapCount + 1);
    expect(store.getSnapshot().activeMap?.name).toBe("imported-map");
    expect(imported.tilesetReferences).toEqual([
      {
        firstGid: 1,
        source: "../tilesets/terrain.tsj"
      }
    ]);
    expect(imported.assetReferences).toEqual([
      expect.objectContaining({
        kind: "tileset",
        ownerPath: "tmj.tilesets[0].source",
        resolvedPath: "tilesets/terrain.tsj",
        assetRoot: "tilesets",
        externalToProject: false,
        documentPath: "maps/imported-map.tmj"
      })
    ]);
    expect(imported.issues).toEqual([]);
  });

  it("imports a TMX document into the workspace through the controller", () => {
    const store = createTestEditorStore("demo");
    const initialMapCount = store.getState().maps.length;

    const imported = store.importTmxMapDocument(`<?xml version="1.0" encoding="UTF-8"?>
<map version="1.11" tiledversion="1.11.2" name="xml-import" orientation="orthogonal" width="2" height="2" tilewidth="32" tileheight="32">
  <tileset firstgid="1" source="../tilesets/terrain.tsx"/>
  <layer id="1" name="Ground" width="2" height="2">
    <data encoding="csv">1,0,2,0</data>
  </layer>
</map>`);

    expect(store.getState().maps).toHaveLength(initialMapCount + 1);
    expect(store.getSnapshot().activeMap?.name).toBe("xml-import");
    expect(imported.tilesetReferences).toEqual([
      {
        firstGid: 1,
        source: "../tilesets/terrain.tsx"
      }
    ]);
    expect(imported.issues).toEqual([]);
  });

  it("creates and exports TX templates from the selected object through the controller", () => {
    const tileset = {
      ...createTileset({
        name: "Terrain",
        kind: "image-collection",
        tileWidth: 32,
        tileHeight: 32
      }),
      tiles: [
        {
          ...createTileDefinition(0),
          imageSource: "../tilesets/terrain.png"
        }
      ]
    };
    const templateObject = createMapObject({
      name: "Spawn",
      shape: "tile",
      x: 32,
      y: 64,
      width: 32,
      height: 32,
      tile: {
        gid: 1
      }
    });
    const objectLayer = createObjectLayer({
      name: "Objects",
      objects: [templateObject]
    });
    const map = createMap({
      name: "starter-map",
      orientation: "orthogonal",
      width: 8,
      height: 8,
      tileWidth: 32,
      tileHeight: 32,
      layers: [objectLayer],
      tilesetIds: [tileset.id]
    });
    const store = createEditorStore(
      createEditorWorkspaceState({
        project: createProject({
          name: "demo",
          assetRoots: ["maps", "tilesets", "templates"]
        }),
        maps: [map],
        tilesets: [tileset],
        session: {
          activeMapId: map.id,
          activeLayerId: objectLayer.id,
          selection: {
            kind: "object",
            objectIds: [templateObject.id]
          }
        }
      }),
      {
        projectAssets: [
          {
            id: "tileset:tilesets/terrain.tsx",
            kind: "tileset",
            name: "terrain.tsx",
            path: "tilesets/terrain.tsx",
            documentId: tileset.id
          }
        ]
      }
    );

    const templateId = store.createTemplateFromSelectedObject({
      name: "Spawn Template"
    });
    const snapshot = store.getSnapshot();
    const exported = templateId ? store.exportTxTemplateDocument(templateId) : undefined;

    expect(templateId).toBeDefined();
    expect(snapshot.workspace.templates).toMatchObject([
      {
        name: "Spawn Template",
        tilesetIds: [tileset.id],
        object: {
          name: "Spawn",
          shape: "tile",
          tile: {
            gid: 1,
            tilesetId: tileset.id,
            tileId: 0
          }
        }
      }
    ]);
    expect(snapshot.workspace.session.activeTemplateId).toBe(templateId);
    expect(snapshot.bootstrap.projectAssets).toContainEqual(
      expect.objectContaining({
        kind: "template",
        path: "templates/spawn-template.tx",
        documentId: templateId
      })
    );
    expect(exported).toContain("<template>");
    expect(exported).toContain('<tileset firstgid="1" source="../tilesets/terrain.tsx"/>');
  });

  it("imports TX templates into the workspace and records TX issues", () => {
    const tileset = {
      ...createTileset({
        name: "Terrain",
        kind: "image-collection",
        tileWidth: 32,
        tileHeight: 32
      }),
      tiles: [
        {
          ...createTileDefinition(0),
          imageSource: "../tilesets/terrain.png"
        }
      ]
    };
    const store = createEditorStore(
      createEditorWorkspaceState({
        project: createProject({
          name: "demo",
          assetRoots: ["maps", "tilesets", "templates"]
        }),
        tilesets: [tileset]
      }),
      {
        projectAssets: [
          {
            id: "tileset:tilesets/terrain.tsx",
            kind: "tileset",
            name: "terrain.tsx",
            path: "tilesets/terrain.tsx",
            documentId: tileset.id
          }
        ]
      }
    );

    const imported = store.importTxTemplateDocument(`<?xml version="1.0" encoding="UTF-8"?>
<template>
  <tileset firstgid="1" name="Embedded" tilewidth="32" tileheight="32" tilecount="1" columns="1">
    <image source="../tilesets/terrain.png" width="32" height="32"/>
  </tileset>
  <object id="1" name="Spawn" gid="1" x="32" y="64" width="32" height="32"/>
</template>`, {
      documentPath: "templates/spawn.tx"
    });
    const snapshot = store.getSnapshot();

    expect(imported.template.name).toBe("spawn");
    expect(snapshot.workspace.templates).toHaveLength(1);
    expect(snapshot.workspace.templates[0]?.object.tile).toMatchObject({
      gid: 1
    });
    expect(snapshot.bootstrap.projectAssets).toContainEqual(
      expect.objectContaining({
        kind: "template",
        path: "templates/spawn.tx",
        documentId: imported.template.id
      })
    );
    expect(snapshot.runtime.issues.entries).toEqual([
      expect.objectContaining({
        documentName: "spawn",
        sourceKind: "tx",
        code: "tx.tileset.embeddedUnsupported",
        path: "tx.tilesets[0]"
      })
    ]);
  });

  it("replaces selected objects with the active template while remapping tile gids for the target map", () => {
    const terrainTileset = {
      ...createTileset({
        name: "Terrain",
        kind: "image",
        tileWidth: 32,
        tileHeight: 32
      }),
      tiles: [createTileDefinition(0), createTileDefinition(1)]
    };
    const propsTileset = {
      ...createTileset({
        name: "Props",
        kind: "image-collection",
        tileWidth: 32,
        tileHeight: 32
      }),
      tiles: [createTileDefinition(0)]
    };
    const targetObject = createMapObject({
      name: "Spawn",
      shape: "rectangle",
      x: 96,
      y: 128,
      width: 16,
      height: 20
    });
    const objectLayer = createObjectLayer({
      name: "Objects",
      objects: [targetObject]
    });
    const map = createMap({
      name: "starter-map",
      orientation: "orthogonal",
      width: 8,
      height: 8,
      tileWidth: 32,
      tileHeight: 32,
      layers: [objectLayer],
      tilesetIds: [terrainTileset.id]
    });
    const template = createObjectTemplate(
      "Torch Template",
      createMapObject({
        name: "Torch",
        className: "Decoration",
        shape: "tile",
        width: 32,
        height: 32,
        properties: [createProperty("kind", "string", "torch")],
        tile: {
          tilesetId: propsTileset.id,
          tileId: 0,
          gid: 1
        }
      }),
      [propsTileset.id]
    );
    const store = createEditorStore(
      createEditorWorkspaceState({
        project: createProject({
          name: "demo",
          assetRoots: ["maps", "tilesets", "templates"]
        }),
        maps: [map],
        tilesets: [terrainTileset, propsTileset],
        templates: [template],
        session: {
          activeMapId: map.id,
          activeLayerId: objectLayer.id,
          activeTemplateId: template.id,
          selection: {
            kind: "object",
            objectIds: [targetObject.id]
          }
        }
      })
    );

    store.replaceSelectedObjectsWithActiveTemplate();

    const snapshot = store.getSnapshot();
    const replacedObject =
      snapshot.activeLayer?.kind === "object" ? snapshot.activeLayer.objects[0] : undefined;
    const expectedGid = getMapGlobalTileGid(
      snapshot.activeMap!,
      snapshot.workspace.tilesets,
      propsTileset.id,
      0
    );

    expect(expectedGid).toBeDefined();

    expect(snapshot.activeMap?.tilesetIds).toEqual([terrainTileset.id, propsTileset.id]);
    expect(replacedObject).toMatchObject({
      id: targetObject.id,
      name: "Torch",
      className: "Decoration",
      x: 96,
      y: 128,
      width: 32,
      height: 32,
      templateId: template.id,
      properties: [createProperty("kind", "string", "torch")],
      tile: {
        tilesetId: propsTileset.id,
        tileId: 0,
        gid: expectedGid!
      }
    });
  });

  it("resets selected template instances to their template state while preserving ids and positions", () => {
    const template = createObjectTemplate(
      "Marker Template",
      createMapObject({
        name: "Marker",
        className: "Encounter",
        shape: "ellipse",
        width: 24,
        height: 24,
        rotation: 15,
        visible: false,
        properties: [createProperty("facing", "string", "north")]
      })
    );
    const instance = createMapObject({
      name: "Changed Marker",
      className: "Override",
      shape: "rectangle",
      x: 96,
      y: 128,
      width: 12,
      height: 40,
      rotation: 45,
      properties: [createProperty("facing", "string", "south")],
      templateId: template.id
    });
    const objectLayer = createObjectLayer({
      name: "Objects",
      objects: [instance]
    });
    const map = createMap({
      name: "starter-map",
      orientation: "orthogonal",
      width: 8,
      height: 8,
      tileWidth: 32,
      tileHeight: 32,
      layers: [objectLayer]
    });
    const store = createEditorStore(
      createEditorWorkspaceState({
        project: createProject({
          name: "demo",
          assetRoots: ["maps", "templates"]
        }),
        maps: [map],
        templates: [template],
        session: {
          activeMapId: map.id,
          activeLayerId: objectLayer.id,
          selection: {
            kind: "object",
            objectIds: [instance.id]
          }
        }
      })
    );

    store.resetSelectedTemplateInstances();

    const snapshot = store.getSnapshot();
    const resetObject =
      snapshot.activeLayer?.kind === "object" ? snapshot.activeLayer.objects[0] : undefined;

    expect(resetObject).toMatchObject({
      id: instance.id,
      name: "Marker",
      className: "Encounter",
      shape: "ellipse",
      x: 96,
      y: 128,
      width: 24,
      height: 24,
      rotation: 15,
      visible: false,
      templateId: template.id,
      properties: [createProperty("facing", "string", "north")]
    });
  });

  it("detaches selected template instances while preserving the current object state", () => {
    const template = createObjectTemplate(
      "Torch Template",
      createMapObject({
        name: "Torch",
        className: "Decoration",
        shape: "tile",
        width: 32,
        height: 32,
        properties: [createProperty("kind", "string", "torch")]
      })
    );
    const instance = createMapObject({
      name: "Torch",
      className: "Decoration",
      shape: "tile",
      x: 96,
      y: 128,
      width: 32,
      height: 32,
      properties: [createProperty("kind", "string", "torch")],
      templateId: template.id
    });
    const objectLayer = createObjectLayer({
      name: "Objects",
      objects: [instance]
    });
    const map = createMap({
      name: "starter-map",
      orientation: "orthogonal",
      width: 8,
      height: 8,
      tileWidth: 32,
      tileHeight: 32,
      layers: [objectLayer]
    });
    const store = createEditorStore(
      createEditorWorkspaceState({
        project: createProject({
          name: "demo",
          assetRoots: ["maps", "templates"]
        }),
        maps: [map],
        templates: [template],
        session: {
          activeMapId: map.id,
          activeLayerId: objectLayer.id,
          selection: {
            kind: "object",
            objectIds: [instance.id]
          }
        }
      })
    );

    store.detachSelectedTemplateInstances();

    const snapshot = store.getSnapshot();
    const detachedObject =
      snapshot.activeLayer?.kind === "object" ? snapshot.activeLayer.objects[0] : undefined;

    expect(detachedObject).toMatchObject({
      id: instance.id,
      name: "Torch",
      className: "Decoration",
      shape: "tile",
      x: 96,
      y: 128,
      width: 32,
      height: 32,
      properties: [createProperty("kind", "string", "torch")]
    });
    expect(detachedObject?.templateId).toBeUndefined();
  });

  it("imports a TSJ tileset into the workspace through the controller", () => {
    const store = createTestEditorStore("demo");
    const initialTilesetCount = store.getState().tilesets.length;
    const activeMap = store.getSnapshot().activeMap;

    const imported = store.importTsjTilesetDocument({
      type: "tileset",
      version: "1.11",
      tiledversion: "1.11.2",
      name: "Imported Props",
      tilewidth: 32,
      tileheight: 32,
      tilecount: 2,
      columns: 0,
      tiles: [
        {
          id: 0,
          image: "../tilesets/prop-a.png"
        },
        {
          id: 1,
          image: "../tilesets/prop-b.png",
          type: "Decoration"
        }
      ]
    });

    const snapshot = store.getSnapshot();

    expect(snapshot.workspace.tilesets).toHaveLength(initialTilesetCount + 1);
    expect(snapshot.activeTileset?.name).toBe("Imported Props");
    expect(imported.tileset.kind).toBe("image-collection");
    expect(imported.tileset.tiles[1]).toMatchObject({
      localId: 1,
      className: "Decoration",
      imageSource: "../tilesets/prop-b.png"
    });
    expect(imported.issues).toEqual([]);
    expect(activeMap?.tilesetIds).not.toContain(imported.tileset.id);
    expect(snapshot.activeMap?.tilesetIds).toContain(imported.tileset.id);
  });

  it("imports a TSX tileset into the workspace through the controller", () => {
    const store = createTestEditorStore("demo");
    const initialTilesetCount = store.getState().tilesets.length;
    const activeMap = store.getSnapshot().activeMap;

    const imported = store.importTsxTilesetDocument(`<?xml version="1.0" encoding="UTF-8"?>
<tileset version="1.11" tiledversion="1.11.2" name="Imported Terrain" tilewidth="32" tileheight="32" tilecount="2" columns="2">
  <image source="../tilesets/terrain.png" width="64" height="32"/>
  <tile id="1" type="Decoration"/>
</tileset>`);

    const snapshot = store.getSnapshot();

    expect(snapshot.workspace.tilesets).toHaveLength(initialTilesetCount + 1);
    expect(snapshot.activeTileset?.name).toBe("Imported Terrain");
    expect(imported.tileset).toMatchObject({
      kind: "image",
      name: "Imported Terrain"
    });
    expect(imported.tileset.tiles[1]).toMatchObject({
      localId: 1,
      className: "Decoration"
    });
    expect(imported.issues).toEqual([]);
    expect(activeMap?.tilesetIds).not.toContain(imported.tileset.id);
    expect(snapshot.activeMap?.tilesetIds).toContain(imported.tileset.id);
  });

  it("records import issues in runtime state and exposes issues panel controls", () => {
    const store = createTestEditorStore("demo");

    store.importTmxMapDocument(`<?xml version="1.0" encoding="UTF-8"?>
<map version="1.11" tiledversion="1.11.2" name="xml-import" orientation="orthogonal" width="1" height="1" tilewidth="32" tileheight="32" mystery="1">
  <tileset firstgid="1" source="https://example.com/terrain.tsx"/>
</map>`, {
      documentPath: "maps/xml-import.tmx"
    });

    let snapshot = store.getSnapshot();

    expect(snapshot.runtime.issues.panelOpen).toBe(true);
    expect(snapshot.runtime.issues.entries).toEqual([
      expect.objectContaining({
        documentName: "xml-import",
        sourceKind: "tmx",
        code: "tmx.attribute.unknown",
        path: "tmx.@mystery"
      }),
      expect.objectContaining({
        documentName: "xml-import",
        sourceKind: "tmx",
        code: "tmx.asset.externalReference",
        path: "tmx.tilesets[0].source"
      })
    ]);

    store.toggleIssuesPanel();
    snapshot = store.getSnapshot();
    expect(snapshot.runtime.issues.panelOpen).toBe(false);

    store.clearIssues();
    snapshot = store.getSnapshot();
    expect(snapshot.runtime.issues.entries).toEqual([]);
    expect(snapshot.runtime.issues.panelOpen).toBe(false);
  });

  it("imports tiled project metadata into the current workspace", () => {
    const store = createTestEditorStore("demo");

    const imported = store.importTiledProjectDocument(
      {
        folders: ["maps", "tilesets", "templates"],
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
          }
        ],
        commands: [{ name: "Build" }]
      },
      {
        documentPath: "projects/demo.tiled-project"
      }
    );

    expect(imported.project).toMatchObject({
      name: "demo",
      assetRoots: ["maps", "tilesets", "templates"],
      compatibilityVersion: "1.12",
      extensionsDirectory: "extensions",
      automappingRulesFile: "rules.txt"
    });

    const snapshot = store.getSnapshot();

    expect(snapshot.workspace.project).toMatchObject({
      name: "demo",
      assetRoots: ["maps", "tilesets", "templates"],
      compatibilityVersion: "1.12",
      extensionsDirectory: "extensions",
      automappingRulesFile: "rules.txt"
    });
    expect(snapshot.workspace.project.propertyTypes).toEqual([
      expect.objectContaining({
        kind: "enum",
        name: "Biome"
      })
    ]);
    expect(snapshot.runtime.issues.entries).toEqual([
      expect.objectContaining({
        documentName: "demo",
        sourceKind: "project",
        code: "project.commands.unsupported",
        path: "project.commands"
      })
    ]);
    expect(snapshot.workspace.session.hasUnsavedChanges).toBe(true);
  });

  it("imports and exports world documents through the controller", () => {
    const store = createTestEditorStore("demo");

    const imported = store.importTiledWorldDocument(
      {
        type: "world",
        maps: [
          {
            fileName: "../maps/starter-map.tmj",
            x: 0,
            y: 0,
            width: 320,
            height: 160
          }
        ],
        properties: [
          {
            name: "rules",
            type: "file",
            value: "../rules/biome.txt"
          }
        ],
        onlyShowAdjacentMaps: true
      },
      {
        documentPath: "worlds/demo.world",
        assetRoots: ["maps", "worlds", "rules"]
      }
    );
    const snapshot = store.getSnapshot();
    const exported = store.exportTiledWorldDocument(imported.world.id);

    expect(snapshot.workspace.worlds).toHaveLength(1);
    expect(snapshot.workspace.worlds[0]).toMatchObject({
      name: "demo",
      maps: [
        {
          fileName: "maps/starter-map.tmj",
          x: 0,
          y: 0,
          width: 320,
          height: 160
        }
      ],
      onlyShowAdjacentMaps: true
    });
    expect(imported.assetReferences).toEqual([
      expect.objectContaining({
        kind: "map",
        ownerPath: "world.maps[0].fileName",
        resolvedPath: "maps/starter-map.tmj"
      }),
      expect.objectContaining({
        kind: "property-file",
        ownerPath: "world.properties[0].value",
        resolvedPath: "rules/biome.txt"
      })
    ]);
    expect(imported.issues).toEqual([]);
    expect(snapshot.bootstrap.projectAssets).toContainEqual(
      expect.objectContaining({
        kind: "world",
        path: "worlds/demo.world",
        documentId: imported.world.id
      })
    );
    expect(exported).toBeDefined();
    expect(exported).toContain('"type": "world"');
    expect(exported).toContain('"fileName": "../maps/starter-map.tmj"');
  });

  it("records world import issues with world source kind", () => {
    const store = createTestEditorStore("demo");

    store.importTiledWorldDocument(
      {
        type: "world",
        patterns: [
          {
            regexp: "chunk_(\\d+)\\.tmj"
          }
        ]
      },
      {
        documentPath: "worlds/broken.world"
      }
    );

    const snapshot = store.getSnapshot();

    expect(snapshot.runtime.issues.panelOpen).toBe(true);
    expect(snapshot.runtime.issues.entries).toEqual([
      expect.objectContaining({
        documentName: "broken",
        sourceKind: "world",
        code: "world.pattern.captureCount.invalid",
        path: "world.patterns[0].regexp"
      }),
      expect.objectContaining({
        documentName: "broken",
        sourceKind: "world",
        code: "world.empty",
        path: "world"
      })
    ]);
  });

  it("builds world context for the active map and toggles world visibility", () => {
    const starterMap = createMap({
      name: "starter-map",
      orientation: "orthogonal",
      width: 4,
      height: 4,
      tileWidth: 32,
      tileHeight: 32
    });
    const eastMap = createMap({
      name: "east-map",
      orientation: "orthogonal",
      width: 4,
      height: 4,
      tileWidth: 32,
      tileHeight: 32
    });
    const farMap = createMap({
      name: "far-map",
      orientation: "orthogonal",
      width: 4,
      height: 4,
      tileWidth: 32,
      tileHeight: 32
    });
    const world = createWorld(
      "demo-world",
      [
        {
          fileName: "maps/starter-map.tmj",
          x: 0,
          y: 0,
          width: 128,
          height: 128
        },
        {
          fileName: "maps/east-map.tmj",
          x: 128,
          y: 0,
          width: 128,
          height: 128
        },
        {
          fileName: "maps/far-map.tmj",
          x: 640,
          y: 0,
          width: 128,
          height: 128
        }
      ],
      [],
      {
        onlyShowAdjacentMaps: true
      }
    );
    const store = createEditorStore(
      createEditorWorkspaceState({
        project: createProject({
          name: "demo",
          assetRoots: ["maps", "worlds"]
        }),
        maps: [starterMap, eastMap, farMap],
        worlds: [world]
      }),
      {
        projectAssets: [
          {
            id: "map:starter",
            name: "starter-map",
            kind: "map",
            path: "maps/starter-map.tmj",
            documentId: starterMap.id
          },
          {
            id: "map:east",
            name: "east-map",
            kind: "map",
            path: "maps/east-map.tmj",
            documentId: eastMap.id
          },
          {
            id: "map:far",
            name: "far-map",
            kind: "map",
            path: "maps/far-map.tmj",
            documentId: farMap.id
          },
          {
            id: "world:demo",
            name: "demo",
            kind: "world",
            path: "worlds/demo.world",
            documentId: world.id
          }
        ]
      }
    );

    const initialSnapshot = store.getSnapshot();

    expect(initialSnapshot.workspace.session.showWorlds).toBe(false);
    expect(initialSnapshot.worldContext).toMatchObject({
      worldId: world.id,
      modifiable: true,
      activeMapFileName: "maps/starter-map.tmj",
      activeMapRect: {
        x: 0,
        y: 0,
        width: 128,
        height: 128
      }
    });
    expect(initialSnapshot.worldContext?.maps.map((entry) => entry.fileName)).toEqual([
      "maps/starter-map.tmj",
      "maps/east-map.tmj"
    ]);

    store.toggleWorlds();

    const nextSnapshot = store.getSnapshot();

    expect(nextSnapshot.workspace.session.showWorlds).toBe(true);
    expect(nextSnapshot.workspace.session.hasUnsavedChanges).toBe(false);
  });

  it("moves world map references through the controller", () => {
    const starterMap = createMap({
      name: "starter-map",
      orientation: "orthogonal",
      width: 4,
      height: 4,
      tileWidth: 32,
      tileHeight: 32
    });
    const eastMap = createMap({
      name: "east-map",
      orientation: "orthogonal",
      width: 4,
      height: 4,
      tileWidth: 32,
      tileHeight: 32
    });
    const world = createWorld("demo-world", [
      {
        fileName: "maps/starter-map.tmj",
        x: 0,
        y: 0,
        width: 128,
        height: 128
      },
      {
        fileName: "maps/east-map.tmj",
        x: 128,
        y: 0,
        width: 128,
        height: 128
      }
    ]);
    const store = createEditorStore(
      createEditorWorkspaceState({
        project: createProject({
          name: "demo",
          assetRoots: ["maps", "worlds"]
        }),
        maps: [starterMap, eastMap],
        worlds: [world]
      }),
      {
        projectAssets: [
          {
            id: "map:starter",
            name: "starter-map",
            kind: "map",
            path: "maps/starter-map.tmj",
            documentId: starterMap.id
          },
          {
            id: "map:east",
            name: "east-map",
            kind: "map",
            path: "maps/east-map.tmj",
            documentId: eastMap.id
          },
          {
            id: "world:demo",
            name: "demo",
            kind: "world",
            path: "worlds/demo.world",
            documentId: world.id
          }
        ]
      }
    );

    store.moveWorldMap(world.id, "maps/east-map.tmj", 256, 64);

    const snapshot = store.getSnapshot();

    expect(snapshot.workspace.worlds[0]?.maps).toContainEqual(
      expect.objectContaining({
        fileName: "maps/east-map.tmj",
        x: 256,
        y: 64,
        width: 128,
        height: 128
      })
    );
    expect(snapshot.worldContext?.maps).toContainEqual(
      expect.objectContaining({
        fileName: "maps/east-map.tmj",
        x: 256,
        y: 64
      })
    );
    expect(snapshot.workspace.session.hasUnsavedChanges).toBe(true);
  });

  it("applies localized naming config to generated maps, layers and objects", () => {
    const store = createEditorStore(
      createEditorWorkspaceState({
        project: createProject({
          name: "示例项目",
          assetRoots: ["maps", "tilesets", "templates"]
        })
      }),
      {
        naming: {
          mapNamePrefix: "地图",
          defaultMapLayerNames: {
            tile: "地面",
            object: "对象"
          },
          layerNamePrefixes: {
            tile: "图块层",
            object: "对象层"
          },
          objectNamePrefix: "对象",
          defaultWangSetName: "未命名集合"
        }
      }
    );

    store.createQuickMapDocument();

    expect(store.getSnapshot().activeMap?.name).toBe("地图-1");
    expect(store.getSnapshot().activeMap?.layers.map((layer) => layer.name)).toEqual([
      "地面",
      "对象"
    ]);

    store.addTileLayer();
    store.addObjectLayer();

    expect(store.getSnapshot().activeMap?.layers.map((layer) => layer.name)).toEqual([
      "地面",
      "对象",
      "图块层 3",
      "对象层 4"
    ]);

    const objectLayer = store
      .getSnapshot()
      .activeMap?.layers.find((layer) => layer.kind === "object" && layer.name === "对象");

    expect(objectLayer?.kind).toBe("object");

    if (!objectLayer || objectLayer.kind !== "object") {
      throw new Error("Expected localized default object layer.");
    }

    store.setActiveLayer(objectLayer.id);
    store.createRectangleObject();

    const nextObjectLayer = store
      .getSnapshot()
      .activeMap?.layers.find((layer) => layer.id === objectLayer.id);

    expect(nextObjectLayer?.kind === "object" ? nextObjectLayer.objects[0]?.name : undefined).toBe(
      "对象 1"
    );

    store.createImageCollectionTileset({
      name: "道具图块集",
      tileWidth: 32,
      tileHeight: 32,
      imageSources: ["/tests/props/prop-1.svg"]
    });
    store.createActiveTilesetWangSet("mixed");

    expect(store.getSnapshot().activeTileset?.wangSets[0]?.name).toBe("未命名集合");
  });

  it("updates active layer details through the controller", () => {
    const store = createTestEditorStore("demo");

    store.updateActiveLayerDetails({
      name: "Foreground",
      className: "collision",
      visible: false,
      locked: true,
      opacity: 0.5,
      offsetX: 12,
      offsetY: -8
    });

    const activeLayer = store.getSnapshot().activeLayer;

    expect(activeLayer).toMatchObject({
      name: "Foreground",
      className: "collision",
      visible: false,
      locked: true,
      opacity: 0.5,
      offsetX: 12,
      offsetY: -8
    });
  });

  it("updates the selected object details through the controller", () => {
    const store = createTestEditorStore("demo");
    const objectLayer = store
      .getSnapshot()
      .activeMap?.layers.find((layer) => layer.kind === "object");

    expect(objectLayer?.kind).toBe("object");

    if (!objectLayer || objectLayer.kind !== "object") {
      throw new Error("Expected object layer.");
    }

    store.setActiveLayer(objectLayer.id);
    store.createRectangleObject();
    store.updateSelectedObjectDetails({
      name: "Spawn Point",
      className: "spawn",
      x: 48,
      y: 64,
      width: 40,
      height: 24,
      rotation: 15,
      visible: false
    });

    const updatedObjectLayer = store
      .getSnapshot()
      .activeMap?.layers.find((layer) => layer.id === objectLayer.id);
    const updatedObject =
      updatedObjectLayer?.kind === "object" ? updatedObjectLayer.objects[0] : undefined;

    expect(updatedObject).toMatchObject({
      name: "Spawn Point",
      className: "spawn",
      x: 48,
      y: 64,
      width: 40,
      height: 24,
      rotation: 15,
      visible: false
    });
  });

  it("creates, updates, and removes Wang sets through the controller", () => {
    const store = createTestEditorStore("demo");
    const activeTileset = store.getSnapshot().activeTileset;

    expect(activeTileset).toBeDefined();

    const wangSetId = store.createActiveTilesetWangSet("mixed", "Core Terrain");

    expect(wangSetId).toBeDefined();

    if (!wangSetId) {
      throw new Error("Expected Wang set to be created.");
    }

    store.updateActiveTilesetWangSet(wangSetId, {
      name: "Road Terrain",
      type: "edge"
    });

    let updatedTileset = store.getSnapshot().activeTileset;

    expect(updatedTileset?.wangSets).toMatchObject([
      {
        id: wangSetId,
        name: "Road Terrain",
        type: "edge"
      }
    ]);

    store.removeActiveTilesetWangSet(wangSetId);
    updatedTileset = store.getSnapshot().activeTileset;

    expect(updatedTileset?.wangSets).toEqual([]);
  });

  it("upserts and removes map, layer, and object custom properties through the controller", () => {
    const store = createTestEditorStore("demo");
    const initialActiveLayerId = store.getSnapshot().activeLayer?.id;
    const objectLayer = store
      .getSnapshot()
      .activeMap?.layers.find((layer) => layer.kind === "object");

    expect(objectLayer?.kind).toBe("object");

    if (!objectLayer || objectLayer.kind !== "object") {
      throw new Error("Expected object layer.");
    }

    store.upsertActiveMapProperty(createProperty("music", "string", "forest"));
    store.upsertActiveLayerProperty(createProperty("collision", "bool", true));
    store.setActiveLayer(objectLayer.id);
    store.createRectangleObject();
    store.upsertSelectedObjectProperty(createProperty("spawnWeight", "int", 2));

    let snapshot = store.getSnapshot();
    let updatedActiveLayer = snapshot.activeMap?.layers.find((layer) => layer.id === initialActiveLayerId);
    let updatedObjectLayer = snapshot.activeMap?.layers.find((layer) => layer.id === objectLayer.id);
    let updatedObject =
      updatedObjectLayer?.kind === "object" ? updatedObjectLayer.objects[0] : undefined;

    expect(snapshot.activeMap?.properties).toEqual([
      createProperty("music", "string", "forest")
    ]);
    expect(updatedActiveLayer).toMatchObject({
      properties: [createProperty("collision", "bool", true)]
    });
    expect(updatedObject?.properties).toEqual([createProperty("spawnWeight", "int", 2)]);

    store.removeActiveMapProperty("music");
    store.removeSelectedObjectProperty("spawnWeight");
    if (initialActiveLayerId) {
      store.setActiveLayer(initialActiveLayerId);
    }
    store.removeActiveLayerProperty("collision");

    snapshot = store.getSnapshot();
    updatedActiveLayer = snapshot.activeMap?.layers.find((layer) => layer.id === initialActiveLayerId);
    updatedObjectLayer = snapshot.activeMap?.layers.find((layer) => layer.id === objectLayer.id);
    updatedObject = updatedObjectLayer?.kind === "object" ? updatedObjectLayer.objects[0] : undefined;

    expect(snapshot.activeMap?.properties).toEqual([]);
    expect(updatedActiveLayer).toMatchObject({
      properties: []
    });
    expect(updatedObject?.properties).toEqual([]);
  });

  it("supports object reference properties through the shared property command chain", () => {
    const store = createTestEditorStore("demo");
    const objectLayer = store
      .getSnapshot()
      .activeMap?.layers.find((layer) => layer.kind === "object");

    expect(objectLayer?.kind).toBe("object");

    if (!objectLayer || objectLayer.kind !== "object") {
      throw new Error("Expected object layer.");
    }

    store.setActiveLayer(objectLayer.id);
    store.createRectangleObject();

    const selectedObject = store
      .getSnapshot()
      .activeMap?.layers.find((layer) => layer.id === objectLayer.id);
    const targetObject =
      selectedObject?.kind === "object" ? selectedObject.objects[0] : undefined;

    expect(targetObject).toBeDefined();

    if (!targetObject) {
      throw new Error("Expected created object.");
    }

    store.upsertActiveMapProperty(
      createProperty("focusObject", "object", { objectId: targetObject.id })
    );

    expect(store.getSnapshot().activeMap?.properties).toEqual([
      createProperty("focusObject", "object", { objectId: targetObject.id })
    ]);
  });

  it("sets viewport zoom directly for status bar controls", () => {
    const store = createTestEditorStore("demo");

    store.setViewportZoom(2);
    expect(store.getSnapshot().bootstrap.viewport.zoom).toBe(2);

    store.setViewportZoom(999);
    expect(store.getSnapshot().bootstrap.viewport.zoom).toBe(8);
  });

  it("routes canvas actions through the active tool", () => {
    const store = createTestEditorStore("demo");

    store.setActiveStamp(createSingleTileStamp(11));
    store.handleCanvasPrimaryAction(3, 4);

    const paintedSnapshot = store.getSnapshot();
    const tileLayer =
      paintedSnapshot.activeMap?.layers.find((layer) => layer.kind === "tile") ?? null;

    expect(tileLayer?.kind).toBe("tile");
    expect(
      tileLayer?.kind === "tile" ? getTileLayerCell(tileLayer, 3, 4)?.gid : null
    ).toBe(11);

    store.setActiveTool("select");
    store.handleCanvasPrimaryAction(5, 6);

    expect(store.getState().session.selection).toEqual({
      kind: "tile",
      coordinates: [{ x: 5, y: 6 }]
    });
  });

  it("commits drag painting as a single undoable stroke", () => {
    const store = createTestEditorStore("demo");

    store.setActiveStamp(createSingleTileStamp(13));
    store.beginCanvasStroke(1, 1);
    store.updateCanvasStroke(4, 1);
    store.endCanvasStroke();

    const paintedLayer = store
      .getSnapshot()
      .activeMap?.layers.find((layer) => layer.kind === "tile");

    expect(
      paintedLayer?.kind === "tile" ? getTileLayerCell(paintedLayer, 1, 1)?.gid : null
    ).toBe(13);
    expect(
      paintedLayer?.kind === "tile" ? getTileLayerCell(paintedLayer, 4, 1)?.gid : null
    ).toBe(13);

    store.undo();

    const revertedLayer = store
      .getSnapshot()
      .activeMap?.layers.find((layer) => layer.kind === "tile");

    expect(
      revertedLayer?.kind === "tile" ? getTileLayerCell(revertedLayer, 1, 1)?.gid : null
    ).toBeNull();
    expect(
      revertedLayer?.kind === "tile" ? getTileLayerCell(revertedLayer, 4, 1)?.gid : null
    ).toBeNull();
  });

  it("supports drag erasing through the stroke lifecycle", () => {
    const store = createTestEditorStore("demo");

    store.setActiveStamp(createSingleTileStamp(17));
    store.beginCanvasStroke(2, 2);
    store.updateCanvasStroke(4, 2);
    store.endCanvasStroke();

    store.setActiveTool("eraser");
    store.beginCanvasStroke(3, 2);
    store.updateCanvasStroke(4, 2);
    store.endCanvasStroke();

    const layer = store
      .getSnapshot()
      .activeMap?.layers.find((entry) => entry.kind === "tile");

    expect(layer?.kind === "tile" ? getTileLayerCell(layer, 2, 2)?.gid : null).toBe(17);
    expect(layer?.kind === "tile" ? getTileLayerCell(layer, 3, 2)?.gid : null).toBeNull();
    expect(layer?.kind === "tile" ? getTileLayerCell(layer, 4, 2)?.gid : null).toBeNull();
  });

  it("fills a bounded region through the bucket-fill tool", () => {
    const store = createTestEditorStore("demo");

    store.setActiveStamp(createSingleTileStamp(9));
    store.handleCanvasPrimaryAction(2, 0);
    store.handleCanvasPrimaryAction(2, 1);
    store.handleCanvasPrimaryAction(2, 2);
    store.handleCanvasPrimaryAction(0, 2);
    store.handleCanvasPrimaryAction(1, 2);

    store.setActiveStamp(createSingleTileStamp(6));
    store.setActiveTool("bucket-fill");
    store.handleCanvasPrimaryAction(0, 0);

    let layer = store
      .getSnapshot()
      .activeMap?.layers.find((entry) => entry.kind === "tile");

    expect(layer?.kind === "tile" ? getTileLayerCell(layer, 0, 0)?.gid : null).toBe(6);
    expect(layer?.kind === "tile" ? getTileLayerCell(layer, 1, 1)?.gid : null).toBe(6);
    expect(layer?.kind === "tile" ? getTileLayerCell(layer, 2, 1)?.gid : null).toBe(9);
    expect(store.getState().session.selection).toEqual({
      kind: "tile",
      coordinates: [{ x: 0, y: 0 }]
    });

    store.undo();

    layer = store.getSnapshot().activeMap?.layers.find((entry) => entry.kind === "tile");

    expect(layer?.kind === "tile" ? getTileLayerCell(layer, 0, 0)?.gid : null).toBeNull();
    expect(layer?.kind === "tile" ? getTileLayerCell(layer, 1, 1)?.gid : null).toBeNull();
    expect(layer?.kind === "tile" ? getTileLayerCell(layer, 2, 1)?.gid : null).toBe(9);
  });

  it("previews and commits shape fills with shape mode modifiers", () => {
    const store = createTestEditorStore("demo");

    store.setActiveStamp(createSingleTileStamp(12));
    store.setActiveTool("shape-fill");
    store.setShapeFillMode("ellipse");
    store.beginCanvasStroke(5, 5, {
      lockAspectRatio: true,
      fromCenter: true
    });
    store.updateCanvasStroke(8, 7, {
      lockAspectRatio: true,
      fromCenter: true
    });

    const preview = store.getSnapshot().runtime.interactions.canvasPreview;

    expect(preview.kind).toBe("shape-fill");
    expect(preview.kind === "shape-fill" ? preview.coordinates : []).toContainEqual({
      x: 5,
      y: 5
    });
    expect(preview.kind === "shape-fill" ? preview.coordinates : []).toContainEqual({
      x: 5,
      y: 3
    });
    expect(preview.kind === "shape-fill" ? preview.coordinates : []).not.toContainEqual({
      x: 3,
      y: 3
    });

    store.endCanvasStroke();

    const layer = store
      .getSnapshot()
      .activeMap?.layers.find((entry) => entry.kind === "tile");

    expect(store.getSnapshot().runtime.interactions.canvasPreview.kind).toBe("none");
    expect(layer?.kind === "tile" ? getTileLayerCell(layer, 5, 5)?.gid : null).toBe(12);
    expect(layer?.kind === "tile" ? getTileLayerCell(layer, 5, 3)?.gid : null).toBe(12);
    expect(layer?.kind === "tile" ? getTileLayerCell(layer, 3, 3)?.gid : null).toBeNull();
  });

  it("clears transient canvas previews when the shape mode changes", () => {
    const store = createTestEditorStore("demo");

    store.setActiveTool("shape-fill");
    store.beginCanvasStroke(2, 2);
    store.updateCanvasStroke(6, 4);

    expect(store.getSnapshot().runtime.interactions.canvasPreview.kind).toBe("shape-fill");

    store.setShapeFillMode("ellipse");

    expect(store.getSnapshot().runtime.interactions.canvasPreview.kind).toBe("none");
  });

  it("selects tile regions and captures them as reusable pattern stamps", () => {
    const store = createTestEditorStore("demo");

    store.setActiveStamp(createSingleTileStamp(21));
    store.handleCanvasPrimaryAction(1, 1);
    store.setActiveStamp(createSingleTileStamp(22));
    store.handleCanvasPrimaryAction(2, 1);

    store.setActiveTool("select");
    store.beginCanvasStroke(1, 1);
    store.updateCanvasStroke(2, 1);

    const preview = store.getSnapshot().runtime.interactions.canvasPreview;

    expect(preview.kind).toBe("tile-selection");
    expect(preview.kind === "tile-selection" ? preview.coordinates : []).toHaveLength(2);

    store.endCanvasStroke();

    expect(store.getState().session.selection).toEqual({
      kind: "tile",
      coordinates: [
        { x: 1, y: 1 },
        { x: 2, y: 1 }
      ]
    });

    store.captureSelectedTilesAsStamp();

    const capturedSnapshot = store.getSnapshot();

    expect(capturedSnapshot.workspace.session.activeStamp.kind).toBe("pattern");
    expect(getTileStampPrimaryGid(capturedSnapshot.workspace.session.activeStamp)).toBe(21);
    expect(capturedSnapshot.workspace.session.activeTool).toBe("stamp");

    store.handleCanvasPrimaryAction(6, 4);

    const layer = store
      .getSnapshot()
      .activeMap?.layers.find((entry) => entry.kind === "tile");

    expect(layer?.kind === "tile" ? getTileLayerCell(layer, 6, 4)?.gid : null).toBe(21);
    expect(layer?.kind === "tile" ? getTileLayerCell(layer, 7, 4)?.gid : null).toBe(22);
  });

  it("copies, cuts, and pastes tile selections through the clipboard API", () => {
    const store = createTestEditorStore("demo");

    store.setActiveStamp(createSingleTileStamp(31));
    store.handleCanvasPrimaryAction(1, 1);
    store.setActiveStamp(createSingleTileStamp(32));
    store.handleCanvasPrimaryAction(2, 1);

    store.setActiveTool("select");
    store.beginCanvasStroke(1, 1);
    store.updateCanvasStroke(2, 1);
    store.endCanvasStroke();

    store.copySelectedTilesToClipboard();

    expect(store.getSnapshot().runtime.clipboard.kind).toBe("tile");

    store.cutSelectedTilesToClipboard();

    let layer = store
      .getSnapshot()
      .activeMap?.layers.find((entry) => entry.kind === "tile");

    expect(layer?.kind === "tile" ? getTileLayerCell(layer, 1, 1)?.gid : null).toBeNull();
    expect(layer?.kind === "tile" ? getTileLayerCell(layer, 2, 1)?.gid : null).toBeNull();

    store.setActiveTool("select");
    store.beginCanvasStroke(6, 4);
    store.updateCanvasStroke(7, 4);
    store.endCanvasStroke();
    store.pasteClipboardToSelection();

    layer = store.getSnapshot().activeMap?.layers.find((entry) => entry.kind === "tile");

    expect(layer?.kind === "tile" ? getTileLayerCell(layer, 6, 4)?.gid : null).toBe(31);
    expect(layer?.kind === "tile" ? getTileLayerCell(layer, 7, 4)?.gid : null).toBe(32);
  });

  it("creates, selects, cuts, and pastes objects through the object clipboard API", () => {
    const store = createTestEditorStore("demo");
    const objectLayer = store.getSnapshot().activeMap?.layers.find((layer) => layer.kind === "object");

    expect(objectLayer?.kind).toBe("object");

    if (!objectLayer || objectLayer.kind !== "object") {
      return;
    }

    store.setActiveLayer(objectLayer.id);
    store.createRectangleObject();

    let nextObjectLayer = store
      .getSnapshot()
      .activeMap?.layers.find((layer) => layer.id === objectLayer.id);
    const firstObject = nextObjectLayer?.kind === "object" ? nextObjectLayer.objects[0] : undefined;

    expect(firstObject).toMatchObject({
      name: "Object 1",
      shape: "rectangle",
      x: 32,
      y: 32,
      width: 32,
      height: 32
    });
    expect(store.getState().session.selection).toEqual({
      kind: "object",
      objectIds: firstObject ? [firstObject.id] : []
    });

    if (!firstObject) {
      return;
    }

    store.copySelectedObjectsToClipboard();

    expect(store.getSnapshot().runtime.clipboard.kind).toBe("object");

    store.pasteClipboardToActiveObjectLayer();

    nextObjectLayer = store
      .getSnapshot()
      .activeMap?.layers.find((layer) => layer.id === objectLayer.id);
    const objectEntries = nextObjectLayer?.kind === "object" ? nextObjectLayer.objects : [];
    const pastedObject = objectEntries[1];

    expect(objectEntries).toHaveLength(2);
    expect(pastedObject).toMatchObject({
      name: "Object 1",
      shape: "rectangle",
      x: 64,
      y: 64,
      width: 32,
      height: 32
    });

    store.selectObject(firstObject.id);
    store.cutSelectedObjectsToClipboard();

    nextObjectLayer = store
      .getSnapshot()
      .activeMap?.layers.find((layer) => layer.id === objectLayer.id);

    expect(nextObjectLayer?.kind === "object" ? nextObjectLayer.objects : []).toHaveLength(1);
    expect(store.getState().session.selection).toEqual({ kind: "none" });
  });

  it("previews and commits object drag moves as a single undoable command", () => {
    const store = createTestEditorStore("demo");
    const objectLayer = store.getSnapshot().activeMap?.layers.find((layer) => layer.kind === "object");

    expect(objectLayer?.kind).toBe("object");

    if (!objectLayer || objectLayer.kind !== "object") {
      return;
    }

    store.setActiveLayer(objectLayer.id);
    store.createRectangleObject();

    const createdObject = store
      .getSnapshot()
      .activeMap?.layers.find((layer) => layer.id === objectLayer.id);
    const targetObject =
      createdObject?.kind === "object" ? createdObject.objects[0] : undefined;

    expect(targetObject).toBeDefined();

    if (!targetObject) {
      return;
    }

    store.beginObjectMove(targetObject.id, 32, 32);
    store.updateObjectMove(56, 44);

    const preview = store.getSnapshot().runtime.interactions.objectTransformPreview;

    expect(preview.kind).toBe("object-move");
    expect(
      preview.kind === "object-move"
        ? {
            objectIds: preview.objectIds,
            deltaX: preview.deltaX,
            deltaY: preview.deltaY
          }
        : null
    ).toEqual({
      objectIds: [targetObject.id],
      deltaX: 24,
      deltaY: 12
    });

    store.endObjectMove();

    const movedObject = store
      .getSnapshot()
      .activeMap?.layers.find((layer) => layer.id === objectLayer.id);
    const committedObject =
      movedObject?.kind === "object" ? movedObject.objects[0] : undefined;

    expect(store.getSnapshot().runtime.interactions.objectTransformPreview.kind).toBe("none");
    expect(committedObject).toMatchObject({
      id: targetObject.id,
      x: 56,
      y: 44,
      width: 32,
      height: 32
    });

    store.undo();

    const revertedObject = store
      .getSnapshot()
      .activeMap?.layers.find((layer) => layer.id === objectLayer.id);

    expect(revertedObject?.kind === "object" ? revertedObject.objects[0] : undefined).toMatchObject({
      id: targetObject.id,
      x: 32,
      y: 32,
      width: 32,
      height: 32
    });
  });

  it("snaps object drag moves to the tile grid when requested", () => {
    const store = createTestEditorStore("demo");
    const objectLayer = store.getSnapshot().activeMap?.layers.find((layer) => layer.kind === "object");

    expect(objectLayer?.kind).toBe("object");

    if (!objectLayer || objectLayer.kind !== "object") {
      return;
    }

    store.setActiveLayer(objectLayer.id);
    store.createRectangleObject();

    const createdObject = store
      .getSnapshot()
      .activeMap?.layers.find((layer) => layer.id === objectLayer.id);
    const targetObject =
      createdObject?.kind === "object" ? createdObject.objects[0] : undefined;

    expect(targetObject).toBeDefined();

    if (!targetObject) {
      return;
    }

    store.beginObjectMove(targetObject.id, 32, 32);
    store.updateObjectMove(50, 49, {
      snapToGrid: true
    });

    const preview = store.getSnapshot().runtime.interactions.objectTransformPreview;

    expect(preview.kind).toBe("object-move");
    expect(
      preview.kind === "object-move"
        ? {
            deltaX: preview.deltaX,
            deltaY: preview.deltaY,
            modifiers: preview.modifiers
          }
        : null
    ).toEqual({
      deltaX: 32,
      deltaY: 32,
      modifiers: {
        snapToGrid: true
      }
    });

    store.endObjectMove();

    const snappedObject = store
      .getSnapshot()
      .activeMap?.layers.find((layer) => layer.id === objectLayer.id);

    expect(snappedObject?.kind === "object" ? snappedObject.objects[0] : undefined).toMatchObject({
      id: targetObject.id,
      x: 64,
      y: 64,
      width: 32,
      height: 32
    });
  });

  it("selects stamps from the active tileset set", () => {
    const store = createTestEditorStore("demo");
    const snapshot = store.getSnapshot();
    const secondTileset = snapshot.workspace.tilesets[1]!;
    store.setActiveTileset(secondTileset.id);
    store.selectStampTile(secondTileset.id, 2);

    const nextSnapshot = store.getSnapshot();
    const gid = getMapGlobalTileGid(
      nextSnapshot.activeMap!,
      nextSnapshot.workspace.tilesets,
      secondTileset.id,
      2
    );

    expect(nextSnapshot.activeTileset?.id).toBe(secondTileset.id);
    expect(nextSnapshot.workspace.session.activeTilesetTileLocalId).toBe(2);
    expect(getTileStampPrimaryGid(nextSnapshot.workspace.session.activeStamp)).toBe(gid);
    expect(nextSnapshot.workspace.session.activeTool).toBe("stamp");
  });

  it("creates sprite-sheet and image-collection tilesets on the active map", () => {
    const store = createTestEditorStore("demo");
    const initialTilesetCount = store.getState().tilesets.length;

    store.createSpriteSheetTileset({
      name: "Custom Sheet",
      imagePath: "/demo/terrain-core.svg",
      imageWidth: 192,
      imageHeight: 128,
      tileWidth: 32,
      tileHeight: 32,
      columns: 6
    });
    store.createImageCollectionTileset({
      name: "Custom Collection",
      tileWidth: 32,
      tileHeight: 32,
      imageSources: ["/demo/props/prop-1.svg", "/demo/props/prop-2.svg"]
    });

    const snapshot = store.getSnapshot();

    expect(snapshot.workspace.tilesets).toHaveLength(initialTilesetCount + 2);
    expect(snapshot.activeMap?.tilesetIds).toHaveLength(initialTilesetCount + 2);
    expect(snapshot.activeTileset?.name).toBe("Custom Collection");
  });

  it("updates active tileset details and selected tile properties", () => {
    const store = createTestEditorStore("demo");

    store.setActiveTileset(store.getState().tilesets[0]!.id);
    store.selectStampTile(store.getState().tilesets[0]!.id, 5);
    store.updateActiveTilesetDetails({
      tileOffsetX: 6,
      tileOffsetY: -4,
      objectAlignment: "bottom",
      tileRenderSize: "grid"
    });
    store.updateSelectedTileMetadata({
      className: "TerrainSlope",
      probability: 0.25
    });
    store.upsertSelectedTileProperty(createProperty("terrainType", "string", "grass"));

    let snapshot = store.getSnapshot();

    expect(snapshot.activeTileset).toMatchObject({
      tileOffsetX: 6,
      tileOffsetY: -4,
      objectAlignment: "bottom",
      tileRenderSize: "grid"
    });
    expect(snapshot.workspace.session.activeTilesetTileLocalId).toBe(5);
    expect(snapshot.activeTileset?.tiles[5]).toMatchObject({
      className: "TerrainSlope",
      probability: 0.25
    });
    expect(snapshot.activeTileset?.tiles[5]?.properties).toEqual([
      createProperty("terrainType", "string", "grass")
    ]);

    store.upsertSelectedTileProperty(
      createProperty("spawnWeight", "int", 4),
      "terrainType"
    );
    store.removeSelectedTileProperty("spawnWeight");

    snapshot = store.getSnapshot();

    expect(snapshot.activeTileset?.tiles[5]?.properties).toEqual([]);
  });

  it("updates selected tile animation frames through the controller", () => {
    const store = createTestEditorStore("demo");
    const firstTilesetId = store.getState().tilesets[0]!.id;
    const frames: TileAnimationFrame[] = [
      { tileId: 1, durationMs: 100 },
      { tileId: 4, durationMs: 220 }
    ];

    store.setActiveTileset(firstTilesetId);
    store.selectStampTile(firstTilesetId, 3);
    store.updateSelectedTileAnimation(frames);

    const snapshot = store.getSnapshot();

    expect(snapshot.workspace.session.activeTilesetTileLocalId).toBe(3);
    expect(snapshot.activeTileset?.tiles[3]?.animation).toEqual(frames);
  });

  it("edits collision objects on the selected tile through the controller", () => {
    const store = createTestEditorStore("demo");
    const firstTilesetId = store.getState().tilesets[0]!.id;

    store.setActiveTileset(firstTilesetId);
    store.selectStampTile(firstTilesetId, 2);

    const objectId = store.createSelectedTileCollisionObject("rectangle");

    expect(objectId).toBeDefined();

    if (!objectId) {
      throw new Error("Expected collision object to be created.");
    }

    store.updateSelectedTileCollisionObjectDetails(objectId, {
      name: "Hitbox",
      x: 6,
      y: 8,
      width: 18,
      height: 12
    });
    store.upsertSelectedTileCollisionObjectProperty(
      objectId,
      createProperty("kind", "string", "solid")
    );
    store.moveSelectedTileCollisionObjects([objectId], 4, -2);
    store.reorderSelectedTileCollisionObjects([objectId], "down");
    store.removeSelectedTileCollisionObjectProperty(objectId, "kind");

    let snapshot = store.getSnapshot();
    let collisionObject = snapshot.activeTileset?.tiles[2]?.collisionLayer?.objects.find(
      (object) => object.id === objectId
    );

    expect(collisionObject).toMatchObject({
      name: "Hitbox",
      x: 10,
      y: 6,
      width: 18,
      height: 12,
      properties: []
    });

    store.removeSelectedTileCollisionObjects([objectId]);

    snapshot = store.getSnapshot();
    collisionObject = snapshot.activeTileset?.tiles[2]?.collisionLayer?.objects.find(
      (object) => object.id === objectId
    );

    expect(collisionObject).toBeUndefined();
  });
});
