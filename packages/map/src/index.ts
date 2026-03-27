import {
  createHistoryCommand,
  createMacroCommand,
  type HistoryCommand
} from "@pixel-editor/command-engine";
import {
  addTopLevelGroupLayer,
  addTopLevelImageLayer,
  addTopLevelObjectLayer,
  addTopLevelTileLayer,
  areTileCellsEqual,
  collectConnectedTileRegion,
  collectEllipseShapeTiles,
  collectRectangleShapeTiles,
  createMap,
  createTileCell,
  getLayerById,
  getTileLayerCell,
  moveLayerInMap,
  paintTileInMap,
  removePropertyDefinition,
  removeLayerFromMap,
  type PropertyDefinition,
  upsertPropertyDefinition,
  updateLayerInMap,
  updateMapDetails,
  type UpdateMapDetailsInput,
  type CreateMapInput,
  type EditorMap,
  type LayerDefinition,
  type LayerId,
  type MapId
} from "@pixel-editor/domain";
import type {
  EditorToolId,
  EditorWorkspaceState,
  SelectionState,
  ShapeFillMode,
  TileStamp,
  ViewportState
} from "@pixel-editor/editor-state";
import {
  createPatternTileStamp,
  createSingleTileStamp,
  getTileStampFootprint,
  getTileSelectionBounds,
  materializeTileStampCells
} from "@pixel-editor/editor-state";
import type { TileCoordinate, TileShapeGestureOptions } from "@pixel-editor/domain";

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 8;
const ZOOM_STEP = 1.2;

export interface DefaultMapLayerNames {
  tile: string;
  object: string;
}

export const defaultMapLayerNames: DefaultMapLayerNames = {
  tile: "Ground",
  object: "Objects"
};

export interface UpdateLayerDetailsInput {
  name?: string;
  className?: string;
  visible?: boolean;
  locked?: boolean;
  opacity?: number;
  offsetX?: number;
  offsetY?: number;
  drawOrder?: "topdown" | "index";
}

export function upsertMapPropertyCommand(
  mapId: MapId,
  property: PropertyDefinition,
  previousName?: string
): HistoryCommand<EditorWorkspaceState> {
  return createHistoryCommand({
    id: `map.property.upsert:${mapId}`,
    description: `Upsert property ${property.name} on map ${mapId}`,
    run: (state) => ({
      ...state,
      maps: state.maps.map((map) =>
        map.id === mapId
          ? {
              ...map,
              properties: upsertPropertyDefinition(map.properties, property, previousName)
            }
          : map
      ),
      session: {
        ...state.session,
        hasUnsavedChanges: true
      }
    })
  });
}

export function removeMapPropertyCommand(
  mapId: MapId,
  propertyName: string
): HistoryCommand<EditorWorkspaceState> {
  return createHistoryCommand({
    id: `map.property.remove:${mapId}:${propertyName}`,
    description: `Remove property ${propertyName} from map ${mapId}`,
    run: (state) => ({
      ...state,
      maps: state.maps.map((map) =>
        map.id === mapId
          ? {
              ...map,
              properties: removePropertyDefinition(map.properties, propertyName)
            }
          : map
      ),
      session: {
        ...state.session,
        hasUnsavedChanges: true
      }
    })
  });
}

function clampZoom(value: number): number {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value));
}

function patchSessionActiveLayer(
  state: EditorWorkspaceState,
  activeLayerId: LayerId | undefined
): EditorWorkspaceState["session"] {
  const nextSession = {
    ...state.session
  };

  if (activeLayerId) {
    return {
      ...nextSession,
      activeLayerId
    };
  }

  delete nextSession.activeLayerId;
  return nextSession;
}

function collectLayerTree(layers: readonly LayerDefinition[]): LayerDefinition[] {
  const collected: LayerDefinition[] = [];

  for (const layer of layers) {
    collected.push(layer);

    if (layer.kind === "group") {
      collected.push(...collectLayerTree(layer.layers));
    }
  }

  return collected;
}

export function buildDefaultMapDocument(
  input: CreateMapInput,
  layerNames: DefaultMapLayerNames = defaultMapLayerNames
): EditorMap {
  const baseMap = createMap({
    ...input,
    layers: []
  });
  const groundLayer = addTopLevelTileLayer(baseMap, layerNames.tile).layer;
  const objectsLayer = addTopLevelObjectLayer(baseMap, layerNames.object).layer;

  return createMap({
    ...input,
    layers: [groundLayer, objectsLayer]
  });
}

export function addImportedMapDocumentCommand(
  map: EditorMap
): HistoryCommand<EditorWorkspaceState> {
  const addMapCommand = createHistoryCommand<EditorWorkspaceState>({
    id: "map.add",
    description: `Add map ${map.name}`,
    run: (state) => ({
      ...state,
      maps: [...state.maps, map]
    })
  });

  const activateMapCommand = setActiveMapCommand(map.id);
  const activateToolCommand = setActiveToolCommand("stamp");

  const markDirtyCommand = createHistoryCommand<EditorWorkspaceState>({
    id: "session.markDirty",
    description: "Mark workspace dirty",
    run: (state) => ({
      ...state,
      session: {
        ...state.session,
        hasUnsavedChanges: true
      }
    })
  });

  return createMacroCommand(
    `Import map ${map.name}`,
    [addMapCommand, activateMapCommand, activateToolCommand, markDirtyCommand],
    "map.import"
  );
}

export function createMapDocumentCommand(
  input: CreateMapInput,
  layerNames: DefaultMapLayerNames = defaultMapLayerNames
): HistoryCommand<EditorWorkspaceState> {
  const map = buildDefaultMapDocument(input, layerNames);
  const command = addImportedMapDocumentCommand(map);

  return createHistoryCommand({
    id: "map.create",
    description: `Create map ${map.name}`,
    run: (state) => command.run(state)
  });
}

export function setActiveMapCommand(
  mapId: MapId
): HistoryCommand<EditorWorkspaceState> {
  return createHistoryCommand({
    id: "session.setActiveMap",
    description: `Set active map ${mapId}`,
    run: (state) => {
      const map = state.maps.find((entry) => entry.id === mapId);

      if (!map) {
        return state;
      }

      return {
        ...state,
        session: {
          ...patchSessionActiveLayer(state, map.layers[0]?.id),
          activeMapId: map.id,
          selection: { kind: "none" }
        }
      };
    }
  });
}

export function setActiveToolCommand(
  tool: EditorToolId
): HistoryCommand<EditorWorkspaceState> {
  return createHistoryCommand({
    id: "session.setActiveTool",
    description: `Switch active tool to ${tool}`,
    run: (state) => ({
      ...state,
      session: {
        ...state.session,
        activeTool: tool
      }
    }),
    canMerge: (next) => next.id === "session.setActiveTool",
    merge: (next) => next
  });
}

export function setShapeFillModeCommand(
  mode: ShapeFillMode
): HistoryCommand<EditorWorkspaceState> {
  return createHistoryCommand({
    id: "session.setShapeFillMode",
    description: `Set shape fill mode to ${mode}`,
    run: (state) => ({
      ...state,
      session: {
        ...state.session,
        shapeFillMode: mode
      }
    }),
    canMerge: (next) => next.id === "session.setShapeFillMode",
    merge: (next) => next
  });
}

export function setActiveLayerCommand(
  layerId: LayerId
): HistoryCommand<EditorWorkspaceState> {
  return createHistoryCommand({
    id: "session.setActiveLayer",
    description: `Set active layer ${layerId}`,
    run: (state) => ({
      ...state,
      session: {
        ...state.session,
        activeLayerId: layerId,
        selection: { kind: "none" }
      }
    })
  });
}

export function patchViewportCommand(
  patch: Partial<ViewportState>,
  description = "Update viewport"
): HistoryCommand<EditorWorkspaceState> {
  return createHistoryCommand({
    id: "viewport.patch",
    description,
    run: (state) => ({
      ...state,
      session: {
        ...state.session,
        viewport: {
          ...state.session.viewport,
          ...patch
        }
      }
    }),
    canMerge: (next) => next.id === "viewport.patch",
    merge: (next) => next
  });
}

export function panViewportCommand(
  deltaX: number,
  deltaY: number
): HistoryCommand<EditorWorkspaceState> {
  return createHistoryCommand({
    id: "viewport.pan",
    description: `Pan viewport by ${deltaX}, ${deltaY}`,
    run: (state) => ({
      ...state,
      session: {
        ...state.session,
        viewport: {
          ...state.session.viewport,
          originX: state.session.viewport.originX + deltaX,
          originY: state.session.viewport.originY + deltaY
        }
      }
    }),
    canMerge: (next) => next.id === "viewport.pan",
    merge: (next) => next
  });
}

export function zoomViewportCommand(
  direction: "in" | "out"
): HistoryCommand<EditorWorkspaceState> {
  return createHistoryCommand({
    id: "viewport.zoom",
    description: direction === "in" ? "Zoom in" : "Zoom out",
    run: (state) => {
      const factor = direction === "in" ? ZOOM_STEP : 1 / ZOOM_STEP;

      return {
        ...state,
        session: {
          ...state.session,
          viewport: {
            ...state.session.viewport,
            zoom: clampZoom(state.session.viewport.zoom * factor)
          }
        }
      };
    },
    canMerge: (next) => next.id === "viewport.zoom",
    merge: (next) => next
  });
}

export function setViewportZoomCommand(
  zoom: number
): HistoryCommand<EditorWorkspaceState> {
  return createHistoryCommand({
    id: "viewport.zoom.set",
    description: `Set zoom to ${zoom}`,
    run: (state) => ({
      ...state,
      session: {
        ...state.session,
        viewport: {
          ...state.session.viewport,
          zoom: clampZoom(zoom)
        }
      }
    }),
    canMerge: (next) => next.id === "viewport.zoom.set",
    merge: (next) => next
  });
}

export function toggleGridCommand(): HistoryCommand<EditorWorkspaceState> {
  return createHistoryCommand({
    id: "viewport.toggleGrid",
    description: "Toggle grid visibility",
    run: (state) => ({
      ...state,
      session: {
        ...state.session,
        viewport: {
          ...state.session.viewport,
          showGrid: !state.session.viewport.showGrid
        }
      }
    })
  });
}

export function toggleAutoMapWhileDrawingCommand(): HistoryCommand<EditorWorkspaceState> {
  return createHistoryCommand({
    id: "session.toggleAutoMapWhileDrawing",
    description: "Toggle AutoMap While Drawing",
    run: (state) => ({
      ...state,
      session: {
        ...state.session,
        autoMapWhileDrawing: !state.session.autoMapWhileDrawing
      }
    })
  });
}

export function toggleHighlightCurrentLayerCommand(): HistoryCommand<EditorWorkspaceState> {
  return createHistoryCommand({
    id: "session.toggleHighlightCurrentLayer",
    description: "Toggle current layer highlight",
    run: (state) => ({
      ...state,
      session: {
        ...state.session,
        highlightCurrentLayer: !state.session.highlightCurrentLayer
      }
    })
  });
}

export function updateMapDetailsCommand(
  mapId: MapId,
  patch: UpdateMapDetailsInput
): HistoryCommand<EditorWorkspaceState> {
  return createHistoryCommand({
    id: "map.updateDetails",
    description: `Update map ${mapId}`,
    run: (state) => ({
      ...state,
      maps: state.maps.map((map) => (map.id === mapId ? updateMapDetails(map, patch) : map)),
      session: {
        ...state.session,
        hasUnsavedChanges: true
      }
    })
  });
}

export function toggleOtherLayersVisibilityCommand(
  mapId: MapId,
  activeLayerId: LayerId
): HistoryCommand<EditorWorkspaceState> {
  return createHistoryCommand({
    id: "layer.toggleOtherVisibility",
    description: `Toggle visibility for layers around ${activeLayerId}`,
    run: (state) => {
      const map = state.maps.find((entry) => entry.id === mapId);

      if (!map) {
        return state;
      }

      const otherLayers = collectLayerTree(map.layers).filter((layer) => layer.id !== activeLayerId);

      if (otherLayers.length === 0) {
        return state;
      }

      const nextVisible = !otherLayers.some((layer) => layer.visible);
      const nextMap = otherLayers.reduce(
        (currentMap, layer) =>
          updateLayerInMap(currentMap, layer.id, (candidate) => ({
            ...candidate,
            visible: nextVisible
          })),
        map
      );

      if (nextMap === map) {
        return state;
      }

      return {
        ...state,
        maps: state.maps.map((entry) => (entry.id === mapId ? nextMap : entry)),
        session: {
          ...state.session,
          hasUnsavedChanges: true
        }
      };
    }
  });
}

export function toggleOtherLayersLockCommand(
  mapId: MapId,
  activeLayerId: LayerId
): HistoryCommand<EditorWorkspaceState> {
  return createHistoryCommand({
    id: "layer.toggleOtherLock",
    description: `Toggle locks for layers around ${activeLayerId}`,
    run: (state) => {
      const map = state.maps.find((entry) => entry.id === mapId);

      if (!map) {
        return state;
      }

      const otherLayers = collectLayerTree(map.layers).filter((layer) => layer.id !== activeLayerId);

      if (otherLayers.length === 0) {
        return state;
      }

      const nextLocked = otherLayers.some((layer) => !layer.locked);
      const nextMap = otherLayers.reduce(
        (currentMap, layer) =>
          updateLayerInMap(currentMap, layer.id, (candidate) => ({
            ...candidate,
            locked: nextLocked
          })),
        map
      );

      if (nextMap === map) {
        return state;
      }

      return {
        ...state,
        maps: state.maps.map((entry) => (entry.id === mapId ? nextMap : entry)),
        session: {
          ...state.session,
          hasUnsavedChanges: true
        }
      };
    }
  });
}

export function replaceMapDocumentCommand(
  mapId: MapId,
  nextMap: EditorMap,
  description = `Replace map ${mapId}`
): HistoryCommand<EditorWorkspaceState> {
  return createHistoryCommand({
    id: "map.replace",
    description,
    run: (state) => ({
      ...state,
      maps: state.maps.map((map) => (map.id === mapId ? nextMap : map)),
      session: {
        ...state.session,
        hasUnsavedChanges: true
      }
    })
  });
}

export function addLayerCommand(
  mapId: MapId,
  kind: "tile" | "object" | "image" | "group",
  name: string
): HistoryCommand<EditorWorkspaceState> {
  return createHistoryCommand({
    id: "layer.add",
    description: `Add ${kind} layer ${name}`,
    run: (state) => {
      let createdLayerId: LayerId | undefined;
      const maps = state.maps.map((map) => {
        if (map.id !== mapId) {
          return map;
        }

        const result =
          kind === "tile"
            ? addTopLevelTileLayer(map, name)
            : kind === "object"
              ? addTopLevelObjectLayer(map, name)
              : kind === "image"
                ? addTopLevelImageLayer(map, name)
                : addTopLevelGroupLayer(map, name);
        createdLayerId = result.layer.id;
        return result.map;
      });

      return {
        ...state,
        maps,
        session: {
          ...state.session,
          ...(createdLayerId ? { activeLayerId: createdLayerId } : {}),
          hasUnsavedChanges: true
        }
      };
    }
  });
}

export function removeLayerCommand(
  mapId: MapId,
  layerId: LayerId
): HistoryCommand<EditorWorkspaceState> {
  return createHistoryCommand({
    id: "layer.remove",
    description: `Remove layer ${layerId}`,
    run: (state) => {
      const maps = state.maps.map((map) =>
        map.id === mapId ? removeLayerFromMap(map, layerId) : map
      );
      const updatedMap = maps.find((map) => map.id === mapId);
      const nextActiveLayerId =
        state.session.activeLayerId === layerId ? updatedMap?.layers[0]?.id : state.session.activeLayerId;

      return {
        ...state,
        maps,
        session: {
          ...patchSessionActiveLayer(state, nextActiveLayerId),
          hasUnsavedChanges: true
        }
      };
    }
  });
}

export function moveLayerCommand(
  mapId: MapId,
  layerId: LayerId,
  direction: "up" | "down"
): HistoryCommand<EditorWorkspaceState> {
  return createHistoryCommand({
    id: "layer.move",
    description: `Move layer ${direction}`,
    run: (state) => ({
      ...state,
      maps: state.maps.map((map) =>
        map.id === mapId ? moveLayerInMap(map, layerId, direction) : map
      ),
      session: {
        ...state.session,
        hasUnsavedChanges: true
      }
    })
  });
}

export function updateLayerDetailsCommand(
  mapId: MapId,
  layerId: LayerId,
  patch: UpdateLayerDetailsInput
): HistoryCommand<EditorWorkspaceState> {
  return createHistoryCommand({
    id: "layer.updateDetails",
    description: `Update layer ${layerId}`,
    run: (state) => ({
      ...state,
      maps: state.maps.map((map) =>
        map.id === mapId
          ? updateLayerInMap(map, layerId, (layer) => {
              const nextLayer: LayerDefinition = {
                ...layer,
                ...(patch.name !== undefined ? { name: patch.name } : {}),
                ...(patch.visible !== undefined ? { visible: patch.visible } : {}),
                ...(patch.locked !== undefined ? { locked: patch.locked } : {}),
                ...(patch.opacity !== undefined ? { opacity: patch.opacity } : {}),
                ...(patch.offsetX !== undefined ? { offsetX: patch.offsetX } : {}),
                ...(patch.offsetY !== undefined ? { offsetY: patch.offsetY } : {})
              };

              if (patch.className !== undefined) {
                const className = patch.className.trim();

                if (className.length > 0) {
                  nextLayer.className = className;
                } else {
                  delete nextLayer.className;
                }
              }

              if (layer.kind === "object" && patch.drawOrder !== undefined) {
                return {
                  ...nextLayer,
                  drawOrder: patch.drawOrder
                };
              }

              return nextLayer;
            })
          : map
      ),
      session: {
        ...state.session,
        hasUnsavedChanges: true
      }
    })
  });
}

export function upsertLayerPropertyCommand(
  mapId: MapId,
  layerId: LayerId,
  property: PropertyDefinition,
  previousName?: string
): HistoryCommand<EditorWorkspaceState> {
  return createHistoryCommand({
    id: `layer.property.upsert:${layerId}`,
    description: `Upsert property ${property.name} on layer ${layerId}`,
    run: (state) => ({
      ...state,
      maps: state.maps.map((map) =>
        map.id === mapId
          ? updateLayerInMap(map, layerId, (layer) => ({
              ...layer,
              properties: upsertPropertyDefinition(layer.properties, property, previousName)
            }))
          : map
      ),
      session: {
        ...state.session,
        hasUnsavedChanges: true
      }
    })
  });
}

export function removeLayerPropertyCommand(
  mapId: MapId,
  layerId: LayerId,
  propertyName: string
): HistoryCommand<EditorWorkspaceState> {
  return createHistoryCommand({
    id: `layer.property.remove:${layerId}:${propertyName}`,
    description: `Remove property ${propertyName} from layer ${layerId}`,
    run: (state) => ({
      ...state,
      maps: state.maps.map((map) =>
        map.id === mapId
          ? updateLayerInMap(map, layerId, (layer) => ({
              ...layer,
              properties: removePropertyDefinition(layer.properties, propertyName)
            }))
          : map
      ),
      session: {
        ...state.session,
        hasUnsavedChanges: true
      }
    })
  });
}

export function selectTileCommand(
  x: number,
  y: number
): HistoryCommand<EditorWorkspaceState> {
  return selectTileRegionCommand(x, y, x, y);
}

export function collectTileSelectionCoordinates(
  startX: number,
  startY: number,
  endX: number,
  endY: number
): TileCoordinate[] {
  const minX = Math.min(startX, endX);
  const minY = Math.min(startY, endY);
  const maxX = Math.max(startX, endX);
  const maxY = Math.max(startY, endY);
  const coordinates: TileCoordinate[] = [];

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      coordinates.push({ x, y });
    }
  }

  return coordinates;
}

export function selectTileRegionCommand(
  startX: number,
  startY: number,
  endX: number,
  endY: number
): HistoryCommand<EditorWorkspaceState> {
  const selection: SelectionState = {
    kind: "tile",
    coordinates: collectTileSelectionCoordinates(startX, startY, endX, endY)
  };

  return createHistoryCommand({
    id: "selection.tile",
    description: `Select tiles ${startX},${startY} -> ${endX},${endY}`,
    run: (state) => ({
      ...state,
      session: {
        ...state.session,
        selection
      }
    }),
    canMerge: (next) => next.id === "selection.tile",
    merge: (next) => next
  });
}

export function createTileStampFromSelection(
  layer: LayerDefinition,
  selection: SelectionState
): TileStamp | undefined {
  if (layer.kind !== "tile" || selection.kind !== "tile") {
    return undefined;
  }

  const bounds = getTileSelectionBounds(selection);

  if (!bounds) {
    return undefined;
  }

  const selectedKeys = new Set(
    selection.coordinates.map((coordinate) => `${coordinate.x}:${coordinate.y}`)
  );
  const cells = collectTileSelectionCoordinates(
    bounds.x,
    bounds.y,
    bounds.x + bounds.width - 1,
    bounds.y + bounds.height - 1
  ).map((coordinate) => ({
    offsetX: coordinate.x - bounds.x,
    offsetY: coordinate.y - bounds.y,
    gid: selectedKeys.has(`${coordinate.x}:${coordinate.y}`)
      ? getTileLayerCell(layer, coordinate.x, coordinate.y)?.gid ?? null
      : null
  }));

  if (bounds.width === 1 && bounds.height === 1) {
    return createSingleTileStamp(cells[0]?.gid ?? null);
  }

  return createPatternTileStamp({
    width: bounds.width,
    height: bounds.height,
    cells,
    primaryGid: cells.find((cell) => cell.offsetX === 0 && cell.offsetY === 0)?.gid ?? null
  });
}

export function setActiveStampCommand(
  stamp: TileStamp
): HistoryCommand<EditorWorkspaceState> {
  return createHistoryCommand({
    id: "session.setActiveStamp",
    description: "Set active stamp",
    run: (state) => ({
      ...state,
      session: {
        ...state.session,
        activeStamp: stamp,
        activeTool: "stamp"
      }
    }),
    canMerge: (next) => next.id === "session.setActiveStamp",
    merge: (next) => next
  });
}

export function paintTileAtCommand(
  mapId: MapId,
  layerId: LayerId,
  x: number,
  y: number,
  gid: number | null
): HistoryCommand<EditorWorkspaceState> {
  return paintTileStampCommand(mapId, layerId, x, y, createSingleTileStamp(gid));
}

export function paintTileStampCommand(
  mapId: MapId,
  layerId: LayerId,
  x: number,
  y: number,
  stamp: TileStamp
): HistoryCommand<EditorWorkspaceState> {
  return paintTileStrokeCommand(
    mapId,
    layerId,
    materializeTileStampCells(stamp, x, y),
    { x, y }
  );
}

export function paintTileStrokeCommand(
  mapId: MapId,
  layerId: LayerId,
  cells: Array<{ x: number; y: number; gid: number | null }>,
  selectionCoordinate: { x: number; y: number } = cells.at(-1) ?? { x: 0, y: 0 }
): HistoryCommand<EditorWorkspaceState> {
  if (cells.length === 0) {
    return createHistoryCommand<EditorWorkspaceState>({
      id: "tile.paint.stroke",
      description: "Paint empty stroke",
      run: (state) => state
    });
  }

  const commands: Array<HistoryCommand<EditorWorkspaceState>> = [
    ...cells.map(({ x, y, gid: nextGid }) =>
      createHistoryCommand<EditorWorkspaceState>({
        id: "tile.paint",
        description: `Paint tile ${x},${y}`,
        run: (state) => ({
          ...state,
          maps: state.maps.map((map) =>
            map.id === mapId ? paintTileInMap(map, layerId, x, y, nextGid) : map
          ),
          session: {
            ...state.session,
            hasUnsavedChanges: true
          }
        })
      })
    ),
    selectTileCommand(selectionCoordinate.x, selectionCoordinate.y)
  ];

  return createMacroCommand(
    `Paint stroke (${cells.length} tiles)`,
    commands,
    "tile.paint.stroke"
  );
}

export function paintTileFillCommand(
  mapId: MapId,
  layerId: LayerId,
  layer: LayerDefinition,
  x: number,
  y: number,
  gid: number | null
): HistoryCommand<EditorWorkspaceState> {
  if (layer.kind !== "tile") {
    return createHistoryCommand<EditorWorkspaceState>({
      id: "tile.fill",
      description: "Fill non-tile layer",
      run: (state) => state
    });
  }

  const targetCell = getTileLayerCell(layer, x, y);
  const replacementCell = createTileCell(gid);

  if (!targetCell || areTileCellsEqual(targetCell, replacementCell)) {
    return createHistoryCommand<EditorWorkspaceState>({
      id: "tile.fill",
      description: "Fill empty region",
      run: (state) => state
    });
  }

  const cells = collectConnectedTileRegion(
    layer,
    x,
    y,
    (cell) => areTileCellsEqual(cell, targetCell)
  ).map((coordinate) => ({
    ...coordinate,
    gid
  }));

  if (cells.length === 0) {
    return createHistoryCommand<EditorWorkspaceState>({
      id: "tile.fill",
      description: "Fill empty region",
      run: (state) => state
    });
  }

  return paintTileStrokeCommand(mapId, layerId, cells, { x, y });
}

export function collectShapeFillCoordinates(
  mode: ShapeFillMode,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  options: TileShapeGestureOptions = {}
): Array<{ x: number; y: number }> {
  return mode === "ellipse"
    ? collectEllipseShapeTiles(startX, startY, endX, endY, options)
    : collectRectangleShapeTiles(startX, startY, endX, endY, options);
}

export function paintTileShapeCommand(
  mapId: MapId,
  layerId: LayerId,
  mode: ShapeFillMode,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  gid: number | null,
  options: TileShapeGestureOptions = {}
): HistoryCommand<EditorWorkspaceState> {
  const coordinates = collectShapeFillCoordinates(
    mode,
    startX,
    startY,
    endX,
    endY,
    options
  );

  if (coordinates.length === 0) {
    return createHistoryCommand<EditorWorkspaceState>({
      id: "tile.shape-fill",
      description: "Fill empty shape",
      run: (state) => state
    });
  }

  const selectionCoordinate =
    coordinates.find((coordinate) => coordinate.x === endX && coordinate.y === endY) ??
    coordinates.at(-1) ??
    { x: startX, y: startY };

  return paintTileStrokeCommand(
    mapId,
    layerId,
    coordinates.map((coordinate) => ({
      ...coordinate,
      gid
    })),
    selectionCoordinate
  );
}

export function captureTileSelectionStampCommand(
  layer: LayerDefinition,
  selection: SelectionState
): HistoryCommand<EditorWorkspaceState> {
  const stamp = createTileStampFromSelection(layer, selection);

  if (!stamp) {
    return createHistoryCommand<EditorWorkspaceState>({
      id: "selection.captureStamp",
      description: "Capture empty stamp selection",
      run: (state) => state
    });
  }

  return createMacroCommand(
    "Capture selection as stamp",
    [setActiveStampCommand(stamp)],
    "selection.captureStamp"
  );
}

export function clearTileSelectionCommand(
  mapId: MapId,
  layerId: LayerId,
  selection: SelectionState
): HistoryCommand<EditorWorkspaceState> {
  if (selection.kind !== "tile" || selection.coordinates.length === 0) {
    return createHistoryCommand<EditorWorkspaceState>({
      id: "clipboard.cut",
      description: "Clear empty tile selection",
      run: (state) => state
    });
  }

  const bounds = getTileSelectionBounds(selection);

  if (!bounds) {
    return createHistoryCommand<EditorWorkspaceState>({
      id: "clipboard.cut",
      description: "Clear empty tile selection",
      run: (state) => state
    });
  }

  const clearCommand = paintTileStrokeCommand(
    mapId,
    layerId,
    selection.coordinates.map((coordinate) => ({
      ...coordinate,
      gid: null
    })),
    { x: bounds.x, y: bounds.y }
  );
  const restoreSelectionCommand = selectTileRegionCommand(
    bounds.x,
    bounds.y,
    bounds.x + bounds.width - 1,
    bounds.y + bounds.height - 1
  );

  return createMacroCommand(
    "Clear tile selection",
    [clearCommand, restoreSelectionCommand],
    "clipboard.cut"
  );
}

export function pasteTileClipboardCommand(
  mapId: MapId,
  layerId: LayerId,
  x: number,
  y: number,
  stamp: TileStamp
): HistoryCommand<EditorWorkspaceState> {
  const footprint = getTileStampFootprint(stamp);
  const paintCommand = paintTileStrokeCommand(
    mapId,
    layerId,
    materializeTileStampCells(stamp, x, y),
    { x, y }
  );
  const selectionCommand = selectTileRegionCommand(
    x,
    y,
    x + footprint.width - 1,
    y + footprint.height - 1
  );

  return createMacroCommand(
    "Paste tile clipboard",
    [paintCommand, selectionCommand],
    "clipboard.paste"
  );
}

export function getLayerKindForState(
  state: EditorWorkspaceState,
  mapId: MapId,
  layerId: LayerId
): LayerDefinition["kind"] | undefined {
  const map = state.maps.find((entry) => entry.id === mapId);
  const layer = map ? getLayerById(map.layers, layerId) : undefined;
  return layer?.kind;
}
