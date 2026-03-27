import { describe, expect, it } from "vitest";

import {
  createClassPropertyTypeDefinition,
  createMap,
  createMapObject,
  createObjectLayer,
  createObjectTemplate,
  createProperty,
  createProject,
  createTileDefinition,
  createTileset,
  createWangSetDefinition,
  createWorld,
  getMapGlobalTileGid
} from "@pixel-editor/domain";
import {
  createEditorIssueState,
  createObjectMovePreview,
  createEditorWorkspaceState,
  createObjectClipboardState,
  createPatternTileStamp,
  createSingleTileStamp,
  createTileClipboardState,
  createTileSelectionCanvasPreview,
  updateTileSelectionCanvasPreview
} from "@pixel-editor/editor-state";

import { createEditorStore } from "../src/controller";
import {
  deriveEditorShellDialogsViewState,
  deriveEditorStatusBarViewState,
  deriveEditorShellChromeViewState,
  deriveIssuesPanelViewState,
  deriveLayersPanelViewState,
  deriveMapImageExportViewState,
  deriveMapPropertiesPanelViewState,
  deriveMiniMapPanelViewState,
  deriveObjectsPanelViewState,
  deriveProjectDockViewState,
  derivePropertiesInspectorViewState,
  deriveRendererCanvasViewState,
  deriveTerrainSetsPanelViewState,
  deriveTileAnimationEditorViewState,
  deriveTileCollisionEditorViewState,
  deriveTilePropertiesEditorViewState,
  deriveTileSelectionControlsViewState,
  deriveTilesetsPanelViewState,
  deriveWorldContextOverlayViewState,
  resolveProjectDockActivation
} from "../src/ui";

describe("ui models", () => {
  it("derives objects panel selection and clipboard state from the active object layer", () => {
    const firstObject = createMapObject({
      name: "Tree",
      shape: "rectangle",
      x: 16,
      y: 24,
      width: 32,
      height: 48
    });
    const secondObject = createMapObject({
      name: "Rock",
      shape: "ellipse",
      x: 64,
      y: 96,
      width: 20,
      height: 18
    });
    const objectLayer = createObjectLayer({
      name: "Objects",
      objects: [firstObject, secondObject]
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
          assetRoots: ["maps"]
        }),
        maps: [map],
        session: {
          activeMapId: map.id,
          activeLayerId: objectLayer.id,
          selection: {
            kind: "object",
            objectIds: [secondObject.id]
          }
        }
      })
    );

    store.copySelectedObjectsToClipboard();

    const viewState = deriveObjectsPanelViewState(store.getSnapshot());

    expect(viewState).toMatchObject({
      hasActiveLayer: true,
      hasObjectSelection: true,
      hasObjectClipboard: true,
      clipboardObjectCount: 1,
      hasTemplateInstanceSelection: false
    });
    expect(viewState.objects).toEqual([
      expect.objectContaining({
        id: firstObject.id,
        name: "Tree",
        shape: "rectangle",
        isSelected: false
      }),
      expect.objectContaining({
        id: secondObject.id,
        name: "Rock",
        shape: "ellipse",
        isSelected: true
      })
    ]);
  });

  it("marks template instance selection and active template in objects panel state", () => {
    const template = createObjectTemplate(
      "Torch Template",
      createMapObject({
        name: "Torch",
        shape: "tile",
        width: 32,
        height: 32
      })
    );
    const instance = createMapObject({
      name: "Torch Instance",
      shape: "tile",
      x: 128,
      y: 160,
      width: 32,
      height: 32,
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
          activeTemplateId: template.id,
          selection: {
            kind: "object",
            objectIds: [instance.id]
          }
        }
      })
    );

    const viewState = deriveObjectsPanelViewState(store.getSnapshot());

    expect(viewState.activeTemplateName).toBe("Torch Template");
    expect(viewState.hasTemplateInstanceSelection).toBe(true);
    expect(viewState.objects).toEqual([
      expect.objectContaining({
        id: instance.id,
        isSelected: true
      })
    ]);
  });

  it("reports an empty objects panel when the active layer is not an object layer", () => {
    const objectLayer = createObjectLayer({
      name: "Objects",
      objects: []
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
          assetRoots: ["maps"]
        }),
        maps: [map],
        session: {
          activeMapId: map.id,
          selection: {
            kind: "none"
          }
        }
      })
    );

    const snapshot = store.getSnapshot();
    const viewState = deriveObjectsPanelViewState({
      ...snapshot,
      runtime: {
        ...snapshot.runtime,
        clipboard: createObjectClipboardState({
          objects: [],
          sourceLayerId: objectLayer.id,
          sourceBounds: {
            x: 0,
            y: 0,
            width: 0,
            height: 0
          }
        })
      }
    });

    expect(viewState).toMatchObject({
      hasActiveLayer: false,
      hasObjectSelection: false,
      hasTemplateInstanceSelection: false,
      hasObjectClipboard: true,
      clipboardObjectCount: 0,
      objects: []
    });
  });

  it("derives status bar counts, layer options, and zoom from the runtime snapshot", () => {
    const backgroundLayer = createObjectLayer({
      name: "Background",
      objects: []
    });
    const gameplayLayer = createObjectLayer({
      name: "Gameplay",
      objects: []
    });
    const map = createMap({
      name: "starter-map",
      orientation: "orthogonal",
      width: 8,
      height: 8,
      tileWidth: 32,
      tileHeight: 32,
      layers: [backgroundLayer, gameplayLayer]
    });
    const store = createEditorStore(
      createEditorWorkspaceState({
        project: createProject({
          name: "demo",
          assetRoots: ["maps"]
        }),
        maps: [map],
        session: {
          activeMapId: map.id,
          activeLayerId: gameplayLayer.id
        }
      })
    );

    const snapshot = store.getSnapshot();
    const viewState = deriveEditorStatusBarViewState({
      ...snapshot,
      bootstrap: {
        ...snapshot.bootstrap,
        viewport: {
          ...snapshot.bootstrap.viewport,
          zoom: 1.5
        }
      },
      runtime: {
        ...snapshot.runtime,
        issues: createEditorIssueState({
          entries: [
            {
              id: "issue:error",
              sourceId: map.id,
              sourceKind: "validation",
              documentName: map.name,
              severity: "error",
              code: "map/error",
              message: "error",
              path: "map"
            },
            {
              id: "issue:warning",
              sourceId: map.id,
              sourceKind: "validation",
              documentName: map.name,
              severity: "warning",
              code: "map/warning",
              message: "warning",
              path: "map/layer"
            }
          ]
        })
      }
    });

    expect(viewState).toEqual({
      activeLayerId: gameplayLayer.id,
      activeLayerKind: "object",
      errorCount: 1,
      warningCount: 1,
      layerOptions: [
        {
          id: gameplayLayer.id,
          name: "Gameplay"
        },
        {
          id: backgroundLayer.id,
          name: "Background"
        }
      ],
      zoom: 1.5
    });
  });

  it("derives editor shell chrome state from menu context and active tool state", () => {
    const backgroundLayer = createObjectLayer({
      name: "Background",
      objects: []
    });
    const gameplayLayer = createObjectLayer({
      name: "Gameplay",
      objects: []
    });
    const map = createMap({
      name: "starter-map",
      orientation: "orthogonal",
      width: 8,
      height: 8,
      tileWidth: 32,
      tileHeight: 32,
      layers: [backgroundLayer, gameplayLayer]
    });
    const store = createEditorStore(
      createEditorWorkspaceState({
        project: createProject({
          name: "demo",
          assetRoots: ["maps"],
          automappingRulesFile: "rules.txt"
        }),
        maps: [map],
        session: {
          activeMapId: map.id,
          activeLayerId: gameplayLayer.id,
          activeTool: "shape-fill",
          shapeFillMode: "ellipse",
          showWorlds: true,
          autoMapWhileDrawing: true,
          highlightCurrentLayer: false
        }
      })
    );

    const viewState = deriveEditorShellChromeViewState({
      snapshot: store.getSnapshot(),
      customTypesEditorOpen: true
    });

    expect(viewState).toMatchObject({
      activeTool: "shape-fill",
      shapeFillMode: "ellipse",
      canUseWorldTool: false,
      activeLayerId: gameplayLayer.id,
      menuContext: {
        activeDocumentKind: "map",
        canUndo: false,
        canRedo: false,
        canSaveActiveDocument: false,
        canSaveAllDocuments: false,
        canExportActiveDocument: false,
        canExportActiveMapImage: false,
        showGrid: true,
        showWorlds: true,
        autoMapWhileDrawing: true,
        highlightCurrentLayer: false,
        hasProject: true,
        hasActiveMap: true,
        hasAutomappingRulesFile: true,
        hasActiveLayer: true,
        hasSiblingLayers: true,
        hasWorldContext: false,
        canMoveWorldMaps: false,
        canMoveLayerUp: true,
        canMoveLayerDown: false,
        customTypesEditorOpen: true
      }
    });
  });

  it("derives project dock and dialog shell state from bootstrap and workspace data", () => {
    const starterMap = createMap({
      name: "starter-map",
      orientation: "orthogonal",
      width: 4,
      height: 4,
      tileWidth: 32,
      tileHeight: 32
    });
    const dungeonTileset = createTileset({
      name: "dungeon",
      kind: "image",
      tileWidth: 32,
      tileHeight: 32,
      source: {
        imagePath: "tiles/dungeon.png",
        imageWidth: 256,
        imageHeight: 256,
        margin: 0,
        spacing: 0
      }
    });
    const template = createObjectTemplate(
      "Torch Template",
      createMapObject({
        name: "Torch",
        shape: "tile",
        width: 32,
        height: 32
      })
    );
    const world = createWorld("demo-world", [
      {
        fileName: "maps/starter-map.tmj",
        x: 0,
        y: 0,
        width: 128,
        height: 128
      }
    ]);
    const propertyType = createClassPropertyTypeDefinition({
      name: "Enemy"
    });
    const store = createEditorStore(
      createEditorWorkspaceState({
        project: createProject({
          name: "demo",
          assetRoots: ["maps", "tilesets", "templates", "worlds"],
          propertyTypes: [propertyType]
        }),
        maps: [starterMap],
        templates: [template],
        tilesets: [dungeonTileset],
        worlds: [world],
        session: {
          activeMapId: starterMap.id,
          activeTilesetId: dungeonTileset.id,
          activeTemplateId: template.id
        }
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
            id: "tileset:dungeon",
            name: "dungeon",
            kind: "tileset",
            path: "tilesets/dungeon.tsx",
            documentId: dungeonTileset.id
          },
          {
            id: "template:torch",
            name: "Torch Template",
            kind: "template",
            path: "templates/torch.tj",
            documentId: template.id
          },
          {
            id: "world:demo",
            name: "demo-world",
            kind: "world",
            path: "worlds/demo.world",
            documentId: world.id
          }
        ]
      }
    );

    store.toggleIssuesPanel();

    const snapshot = store.getSnapshot();
    const projectDockViewState = deriveProjectDockViewState(snapshot);
    const dialogsViewState = deriveEditorShellDialogsViewState(snapshot);
    const worldAsset = snapshot.bootstrap.projectAssets.find((asset) => asset.kind === "world");

    expect(projectDockViewState.activeDocumentIds).toEqual([
      starterMap.id,
      dungeonTileset.id,
      template.id,
      world.id
    ]);
    expect(projectDockViewState.tree).toEqual([
      expect.objectContaining({
        kind: "folder",
        name: "maps"
      }),
      expect.objectContaining({
        kind: "folder",
        name: "templates"
      }),
      expect.objectContaining({
        kind: "folder",
        name: "tilesets"
      }),
      expect.objectContaining({
        kind: "folder",
        name: "worlds"
      })
    ]);
    expect(dialogsViewState).toMatchObject({
      issuesPanelOpen: true,
      project: snapshot.workspace.project,
      projectPropertyTypes: [propertyType]
    });
    expect(
      worldAsset !== undefined ? resolveProjectDockActivation(snapshot, worldAsset) : undefined
    ).toEqual({
      kind: "map",
      documentId: starterMap.id
    });
  });

  it("derives issues panel items from runtime issues", () => {
    const objectLayer = createObjectLayer({
      name: "Objects",
      objects: []
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
          assetRoots: ["maps"]
        }),
        maps: [map],
        session: {
          activeMapId: map.id,
          activeLayerId: objectLayer.id
        }
      })
    );

    const snapshot = store.getSnapshot();
    const viewState = deriveIssuesPanelViewState({
      ...snapshot,
      runtime: {
        ...snapshot.runtime,
        issues: createEditorIssueState({
          entries: [
            {
              id: "issue:error",
              sourceId: map.id,
              sourceKind: "validation",
              documentName: map.name,
              documentPath: "maps/starter-map.tmx",
              severity: "error",
              code: "map/error",
              message: "error",
              path: "map"
            }
          ]
        })
      }
    });

    expect(viewState).toEqual({
      issues: [
        {
          id: "issue:error",
          sourceKind: "validation",
          documentName: "starter-map",
          documentPath: "maps/starter-map.tmx",
          severity: "error",
          code: "map/error",
          message: "error",
          path: "map"
        }
      ]
    });
  });

  it("derives layers panel state from the active map layer ordering and toggles", () => {
    const backgroundLayer = createObjectLayer({
      name: "Background",
      visible: false,
      locked: true,
      objects: []
    });
    const gameplayLayer = createObjectLayer({
      name: "Gameplay",
      objects: []
    });
    const map = createMap({
      name: "starter-map",
      orientation: "orthogonal",
      width: 8,
      height: 8,
      tileWidth: 32,
      tileHeight: 32,
      layers: [backgroundLayer, gameplayLayer]
    });
    const store = createEditorStore(
      createEditorWorkspaceState({
        project: createProject({
          name: "demo",
          assetRoots: ["maps"]
        }),
        maps: [map],
        session: {
          activeMapId: map.id,
          activeLayerId: gameplayLayer.id,
          highlightCurrentLayer: true
        }
      })
    );

    const viewState = deriveLayersPanelViewState(store.getSnapshot());

    expect(viewState).toMatchObject({
      hasMap: true,
      hasActiveLayer: true,
      canMoveActiveLayerUp: true,
      canMoveActiveLayerDown: false,
      hasSiblingLayers: true,
      otherLayersHidden: true,
      otherLayersLocked: true,
      highlightCurrentLayer: true
    });
    expect(viewState.layers).toEqual([
      expect.objectContaining({
        id: gameplayLayer.id,
        name: "Gameplay",
        isSelected: true,
        visible: true,
        locked: false
      }),
      expect.objectContaining({
        id: backgroundLayer.id,
        name: "Background",
        isSelected: false,
        visible: false,
        locked: true
      })
    ]);
  });

  it("derives map properties panel state from the active map settings", () => {
    const map = createMap({
      name: "starter-map",
      orientation: "hexagonal",
      renderOrder: "left-up",
      width: 48,
      height: 24,
      tileWidth: 64,
      tileHeight: 32,
      infinite: true,
      backgroundColor: "#112233"
    });
    const store = createEditorStore(
      createEditorWorkspaceState({
        project: createProject({
          name: "demo",
          assetRoots: ["maps"]
        }),
        maps: [map],
        session: {
          activeMapId: map.id
        }
      })
    );

    expect(deriveMapPropertiesPanelViewState(store.getSnapshot())).toEqual({
      name: "starter-map",
      orientation: "hexagonal",
      renderOrder: "left-up",
      width: 0,
      height: 0,
      tileWidth: 64,
      tileHeight: 32,
      infinite: true,
      backgroundColor: "#112233"
    });
  });

  it("derives mini map panel geometry from the active map and viewport", () => {
    const map = createMap({
      name: "starter-map",
      orientation: "orthogonal",
      width: 100,
      height: 50,
      tileWidth: 32,
      tileHeight: 16
    });
    const store = createEditorStore(
      createEditorWorkspaceState({
        project: createProject({
          name: "demo",
          assetRoots: ["maps"]
        }),
        maps: [map],
        session: {
          activeMapId: map.id
        }
      })
    );
    const snapshot = store.getSnapshot();

    const viewState = deriveMiniMapPanelViewState({
      ...snapshot,
      bootstrap: {
        ...snapshot.bootstrap,
        viewport: {
          ...snapshot.bootstrap.viewport,
          originX: 320,
          originY: 80,
          zoom: 2
        }
      }
    });

    expect(viewState).toMatchObject({
      mapName: "starter-map",
      mapWidth: 100,
      mapHeight: 50,
      infinite: false,
      previewWidthPercent: 100,
      previewHeightPercent: 50,
      viewportWidthPercent: 50,
      viewportHeightPercent: 50,
      viewportLeftPercent: 10,
      viewportTopPercent: 10,
      viewportZoom: 2
    });
  });

  it("derives map image export state from the active map", () => {
    const tileset = createTileset({
      name: "terrain",
      kind: "image-collection",
      tileWidth: 32,
      tileHeight: 32
    });
    const map = createMap({
      name: "starter-map",
      orientation: "orthogonal",
      width: 10,
      height: 6,
      tileWidth: 32,
      tileHeight: 16
    });
    const store = createEditorStore(
      createEditorWorkspaceState({
        project: createProject({
          name: "demo",
          assetRoots: ["maps"]
        }),
        maps: [map],
        tilesets: [tileset],
        session: {
          activeMapId: map.id
        }
      })
    );

    expect(deriveMapImageExportViewState(store.getSnapshot())).toEqual({
      snapshot: {
        map,
        tilesets: [tileset],
        viewport: {
          zoom: 1,
          originX: 0,
          originY: 0,
          showGrid: false
        }
      },
      width: 320,
      height: 96
    });
  });

  it("derives renderer canvas state from render selection and previews", () => {
    const object = createMapObject({
      name: "Torch",
      shape: "rectangle",
      x: 32,
      y: 48,
      width: 16,
      height: 24
    });
    const objectLayer = createObjectLayer({
      name: "Objects",
      objects: [object]
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
          assetRoots: ["maps"]
        }),
        maps: [map],
        session: {
          activeMapId: map.id,
          activeLayerId: objectLayer.id,
          activeTool: "object-select",
          selection: {
            kind: "object",
            objectIds: [object.id]
          },
          highlightCurrentLayer: true
        }
      })
    );
    const snapshot = store.getSnapshot();
    const preview = updateTileSelectionCanvasPreview(
      createTileSelectionCanvasPreview({
        mapId: map.id,
        layerId: objectLayer.id,
        originX: 1,
        originY: 2
      }),
      {
        currentX: 3,
        currentY: 4,
        coordinates: [{ x: 1, y: 2 }]
      }
    );

    const viewState = deriveRendererCanvasViewState({
      ...snapshot,
      runtime: {
        ...snapshot.runtime,
        interactions: {
          ...snapshot.runtime.interactions,
          canvasPreview: preview,
          objectTransformPreview: createObjectMovePreview({
            mapId: map.id,
            layerId: objectLayer.id,
            objectIds: [object.id],
            anchorX: object.x,
            anchorY: object.y,
            referenceX: object.x,
            referenceY: object.y
          })
        }
      }
    });

    expect(viewState.activeTool).toBe("object-select");
    expect(viewState.selectedObjectIds).toEqual([object.id]);
    expect(viewState.render).toMatchObject({
      map,
      tilesets: [],
      viewport: snapshot.bootstrap.viewport,
      highlightedLayerId: objectLayer.id,
      selectedObjectIds: [object.id],
      previewTiles: [{ x: 1, y: 2 }],
      objectTransformPreview: {
        kind: "move",
        objectIds: [object.id],
        deltaX: 0,
        deltaY: 0
      }
    });
  });

  it("derives world context overlay state from the active world context", () => {
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
        worlds: [world],
        session: {
          activeMapId: starterMap.id,
          activeTool: "world-tool"
        }
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

    const viewState = deriveWorldContextOverlayViewState(store.getSnapshot());

    expect(viewState).toMatchObject({
      activeMap: starterMap,
      activeTool: "world-tool",
      visible: true,
      modifiable: true,
      activeMapRect: {
        x: 0,
        y: 0
      }
    });
    expect(viewState?.maps).toEqual([
      expect.objectContaining({
        fileName: "maps/starter-map.tmj",
        active: true,
        canActivate: false,
        gridWidth: 32,
        gridHeight: 32
      }),
      expect.objectContaining({
        fileName: "maps/east-map.tmj",
        active: false,
        canActivate: true,
        gridWidth: 32,
        gridHeight: 32
      })
    ]);
  });

  it("derives properties inspector state from the active map, layer, and object", () => {
    const spawnProperty = createProperty("spawnId", "string", "entry");
    const object = createMapObject({
      name: "Spawn Point",
      shape: "point",
      x: 12,
      y: 34,
      properties: [spawnProperty]
    });
    const objectLayer = createObjectLayer({
      name: "Markers",
      className: "markers",
      offsetX: 4,
      offsetY: 6,
      parallaxX: 0.8,
      parallaxY: 0.9,
      tintColor: "#ffeeaa",
      properties: [createProperty("layerFlag", "bool", true)],
      objects: [object]
    });
    const map = createMap({
      name: "starter-map",
      orientation: "orthogonal",
      width: 8,
      height: 8,
      tileWidth: 32,
      tileHeight: 32,
      parallaxOriginX: 10,
      parallaxOriginY: 20,
      backgroundColor: "#112233",
      properties: [createProperty("music", "string", "intro")],
      layers: [objectLayer]
    });
    const store = createEditorStore(
      createEditorWorkspaceState({
        project: createProject({
          name: "demo",
          assetRoots: ["maps"]
        }),
        maps: [map],
        session: {
          activeMapId: map.id,
          activeLayerId: objectLayer.id,
          selection: {
            kind: "object",
            objectIds: [object.id]
          }
        }
      })
    );

    const viewState = derivePropertiesInspectorViewState(store.getSnapshot());

    expect(viewState.map).toMatchObject({
      name: "starter-map",
      orientation: "orthogonal",
      width: 8,
      height: 8,
      tileWidth: 32,
      tileHeight: 32,
      parallaxOriginX: 10,
      parallaxOriginY: 20,
      backgroundColor: "#112233",
      properties: [expect.objectContaining({ name: "music", value: "intro" })]
    });
    expect(viewState.layer).toMatchObject({
      kind: "object",
      name: "Markers",
      className: "markers",
      offsetX: 4,
      offsetY: 6,
      parallaxX: 0.8,
      parallaxY: 0.9,
      tintColor: "#ffeeaa",
      properties: [expect.objectContaining({ name: "layerFlag", value: true })]
    });
    expect(viewState.object).toMatchObject({
      shape: "point",
      name: "Spawn Point",
      x: 12,
      y: 34,
      properties: [expect.objectContaining({ name: "spawnId", value: "entry" })]
    });
    expect(viewState.objectReferenceOptions).toEqual([
      {
        id: object.id,
        label: `Spawn Point · Markers`
      }
    ]);
  });

  it("derives tile properties editor state from the selected tileset tile", () => {
    const tileClassType = createClassPropertyTypeDefinition({
      name: "HazardTile",
      useAs: ["tile"],
      fields: [
        {
          name: "damage",
          valueType: "int",
          defaultValue: 5
        }
      ]
    });
    const marker = createMapObject({
      name: "Marker",
      shape: "point",
      x: 8,
      y: 8
    });
    const objectLayer = createObjectLayer({
      name: "Markers",
      objects: [marker]
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
    const tile = {
      ...createTileDefinition(7),
      className: "HazardTile",
      probability: 0.25,
      imageSource: "tiles/hazard.png",
      properties: [createProperty("damage", "int", 9)]
    };
    const tileset = {
      ...createTileset({
        name: "terrain",
        kind: "image-collection",
        tileWidth: 32,
        tileHeight: 32
      }),
      tiles: [tile]
    };

    const viewState = deriveTilePropertiesEditorViewState({
      activeMap: map,
      propertyTypes: [tileClassType],
      tileset,
      selectedLocalId: 7
    });

    expect(viewState.propertyTypes).toEqual([tileClassType]);
    expect(viewState.objectReferenceOptions).toEqual([
      {
        id: marker.id,
        label: "Marker · Markers"
      }
    ]);
    expect(viewState.tile).toMatchObject({
      localId: 7,
      className: "HazardTile",
      probability: 0.25,
      imageSource: "tiles/hazard.png",
      properties: [expect.objectContaining({ name: "damage", value: 9 })]
    });
    expect(viewState.tile?.suggestedProperties).toEqual([
      expect.objectContaining({ name: "damage", value: 5 })
    ]);
  });

  it("derives tile selection controls state from selection and clipboard", () => {
    const viewState = deriveTileSelectionControlsViewState({
      canEditTiles: true,
      selection: {
        kind: "tile",
        coordinates: [
          { x: 2, y: 3 },
          { x: 4, y: 3 },
          { x: 4, y: 5 }
        ]
      },
      clipboard: createTileClipboardState({
        stamp: createPatternTileStamp({
          width: 2,
          height: 3,
          cells: [
            { offsetX: 0, offsetY: 0, gid: 1 },
            { offsetX: 1, offsetY: 0, gid: 2 },
            { offsetX: 0, offsetY: 1, gid: 3 }
          ]
        }),
        sourceBounds: {
          x: 2,
          y: 3,
          width: 3,
          height: 3
        }
      })
    });

    expect(viewState).toEqual({
      canEditTiles: true,
      hasTileClipboard: true,
      selectionWidth: 3,
      selectionHeight: 3,
      selectionCellCount: 3,
      clipboard: {
        kind: "tile",
        width: 2,
        height: 3
      }
    });
  });

  it("derives tilesets panel state from the active map and stamp selection", () => {
    const tilesetTile = {
      ...createTileDefinition(0),
      className: "Ground",
      imageSource: "tiles/ground.png"
    };
    const tileset = {
      ...createTileset({
        name: "terrain",
        kind: "image-collection",
        tileWidth: 32,
        tileHeight: 32
      }),
      tiles: [tilesetTile]
    };
    const map = createMap({
      name: "starter-map",
      orientation: "orthogonal",
      width: 8,
      height: 8,
      tileWidth: 32,
      tileHeight: 32,
      tilesetIds: [tileset.id]
    });
    const store = createEditorStore(
      createEditorWorkspaceState({
        project: createProject({
          name: "demo",
          assetRoots: ["maps"]
        }),
        maps: [map],
        tilesets: [tileset],
        session: {
          activeMapId: map.id,
          activeTilesetId: tileset.id,
          activeTilesetTileLocalId: 0,
          activeStamp: createSingleTileStamp(
            getMapGlobalTileGid(map, [tileset], tileset.id, 0) ?? null
          )
        }
      })
    );

    const viewState = deriveTilesetsPanelViewState(store.getSnapshot());

    expect(viewState.availableTilesets).toEqual([
      {
        id: tileset.id,
        name: "terrain",
        kind: "image-collection",
        tileWidth: 32,
        tileHeight: 32,
        tileCount: 1,
        isActive: true
      }
    ]);
    expect(viewState.stampSummary).toEqual({
      kind: "tile",
      gid: 1,
      localId: 0,
      tilesetName: "terrain"
    });
    expect(viewState.activeTileEntries).toEqual([
      expect.objectContaining({
        localId: 0,
        isSelected: true,
        preview: expect.objectContaining({
          kind: "image-collection",
          imagePath: "tiles/ground.png"
        })
      })
    ]);
    expect(viewState.selectedLocalId).toBe(0);
    expect(viewState.selectedTileClassName).toBe("Ground");
    expect(viewState.selectedTilePreview).toMatchObject({
      kind: "image-collection",
      imagePath: "tiles/ground.png",
      gid: 1
    });
    expect(viewState.tilePropertiesEditorViewState?.tile).toMatchObject({
      localId: 0,
      className: "Ground"
    });
    expect(viewState.tilesetDetailsViewState).toMatchObject({
      kind: "image-collection",
      name: "terrain",
      tileWidth: 32,
      tileHeight: 32
    });
  });

  it("derives terrain sets panel state from the active map tilesets", () => {
    const terrainTileset = {
      ...createTileset({
        name: "terrain",
        kind: "image-collection",
        tileWidth: 32,
        tileHeight: 32
      }),
      wangSets: [
        createWangSetDefinition({
          name: "Cliffs",
          type: "edge"
        })
      ]
    };
    const propsTileset = createTileset({
      name: "props",
      kind: "image-collection",
      tileWidth: 32,
      tileHeight: 32
    });
    const map = createMap({
      name: "starter-map",
      orientation: "orthogonal",
      width: 8,
      height: 8,
      tileWidth: 32,
      tileHeight: 32,
      tilesetIds: [terrainTileset.id]
    });
    const store = createEditorStore(
      createEditorWorkspaceState({
        project: createProject({
          name: "demo",
          assetRoots: ["maps"]
        }),
        maps: [map],
        tilesets: [terrainTileset, propsTileset],
        session: {
          activeMapId: map.id,
          activeTilesetId: terrainTileset.id
        }
      })
    );

    const viewState = deriveTerrainSetsPanelViewState(store.getSnapshot());

    expect(viewState.availableTilesets).toEqual([
      {
        id: terrainTileset.id,
        name: "terrain",
        isActive: true
      }
    ]);
    expect(viewState.activeTilesetId).toBe(terrainTileset.id);
    expect(viewState.activeTilesetName).toBe("terrain");
    expect(viewState.wangSets).toEqual([
      expect.objectContaining({
        name: "Cliffs",
        type: "edge"
      })
    ]);
  });

  it("derives tile animation editor state from the active tileset tile animation", () => {
    const animatedTileset = {
      ...createTileset({
        name: "terrain",
        kind: "image-collection",
        tileWidth: 32,
        tileHeight: 32
      }),
      tiles: [
        {
          ...createTileDefinition(0),
          imageSource: "tiles/ground.png",
          animation: [
            {
              tileId: 1,
              durationMs: 120
            }
          ]
        },
        {
          ...createTileDefinition(1),
          imageSource: "tiles/water.png"
        }
      ]
    };
    const map = createMap({
      name: "starter-map",
      orientation: "orthogonal",
      width: 8,
      height: 8,
      tileWidth: 32,
      tileHeight: 32,
      tilesetIds: [animatedTileset.id]
    });
    const store = createEditorStore(
      createEditorWorkspaceState({
        project: createProject({
          name: "demo",
          assetRoots: ["maps"]
        }),
        maps: [map],
        tilesets: [animatedTileset],
        session: {
          activeMapId: map.id,
          activeTilesetId: animatedTileset.id,
          activeTilesetTileLocalId: 0
        }
      })
    );

    const viewState = deriveTileAnimationEditorViewState(store.getSnapshot());

    expect(viewState).toMatchObject({
      tilesetId: animatedTileset.id,
      tilesetKind: "image-collection",
      tileWidth: 32,
      tileHeight: 32,
      selectedLocalId: 0
    });
    expect(viewState?.frames).toEqual([
      expect.objectContaining({
        tileId: 1,
        durationMs: 120,
        preview: expect.objectContaining({
          kind: "image-collection",
          imagePath: "tiles/water.png"
        })
      })
    ]);
    expect(viewState?.sourceTiles).toEqual([
      expect.objectContaining({
        localId: 0,
        preview: expect.objectContaining({
          kind: "image-collection",
          imagePath: "tiles/ground.png"
        })
      }),
      expect.objectContaining({
        localId: 1,
        preview: expect.objectContaining({
          kind: "image-collection",
          imagePath: "tiles/water.png"
        })
      })
    ]);
  });

  it("derives tile collision editor state from the selected tile collision layer", () => {
    const collisionObject = createMapObject({
      name: "Hitbox",
      shape: "rectangle",
      x: 2,
      y: 4,
      width: 28,
      height: 16
    });
    const collisionClassType = createClassPropertyTypeDefinition({
      name: "CollisionMeta",
      useAs: ["object"],
      fields: [
        {
          name: "damage",
          valueType: "int",
          defaultValue: 1
        }
      ]
    });
    const collisionTileset = {
      ...createTileset({
        name: "terrain",
        kind: "image-collection",
        tileWidth: 32,
        tileHeight: 32
      }),
      tiles: [
        {
          ...createTileDefinition(0),
          imageSource: "tiles/ground.png",
          collisionLayer: createObjectLayer({
            name: "collision",
            drawOrder: "index",
            objects: [collisionObject]
          })
        }
      ]
    };
    const map = createMap({
      name: "starter-map",
      orientation: "orthogonal",
      width: 8,
      height: 8,
      tileWidth: 32,
      tileHeight: 32,
      tilesetIds: [collisionTileset.id]
    });
    const store = createEditorStore(
      createEditorWorkspaceState({
        project: createProject({
          name: "demo",
          assetRoots: ["maps"],
          propertyTypes: [collisionClassType]
        }),
        maps: [map],
        tilesets: [collisionTileset],
        session: {
          activeMapId: map.id,
          activeTilesetId: collisionTileset.id,
          activeTilesetTileLocalId: 0
        }
      })
    );

    const viewState = deriveTileCollisionEditorViewState(store.getSnapshot());

    expect(viewState).toMatchObject({
      selectedLocalId: 0,
      propertyTypes: [collisionClassType],
      collisionObjects: [
        expect.objectContaining({
          id: collisionObject.id,
          name: "Hitbox"
        })
      ],
      canvas: {
        tileWidth: 32,
        tileHeight: 32,
        tilePreview: expect.objectContaining({
          kind: "image-collection",
          imagePath: "tiles/ground.png"
        }),
        previewMap: expect.objectContaining({
          settings: expect.objectContaining({
            width: 1,
            height: 1,
            tileWidth: 32,
            tileHeight: 32
          }),
          layers: [
            expect.objectContaining({
              kind: "object",
              drawOrder: "index"
            })
          ]
        }),
        objects: [
          expect.objectContaining({
            id: collisionObject.id
          })
        ]
      }
    });
  });
});
