import {
  createHistoryCommand,
  createMacroCommand,
  type HistoryCommand
} from "@pixel-editor/command-engine";
import {
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
  removeLayerFromMap,
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
  getTileSelectionBounds,
  materializeTileStampCells
} from "@pixel-editor/editor-state";
import type { TileCoordinate, TileShapeGestureOptions } from "@pixel-editor/domain";

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 8;
const ZOOM_STEP = 1.2;

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

export function buildDefaultMapDocument(input: CreateMapInput): EditorMap {
  const baseMap = createMap({
    ...input,
    layers: []
  });
  const groundLayer = addTopLevelTileLayer(baseMap, "Ground").layer;
  const objectsLayer = addTopLevelObjectLayer(baseMap, "Objects").layer;

  return createMap({
    ...input,
    layers: [groundLayer, objectsLayer]
  });
}

export function createMapDocumentCommand(
  input: CreateMapInput
): HistoryCommand<EditorWorkspaceState> {
  const map = buildDefaultMapDocument(input);

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
    `Create map ${map.name}`,
    [addMapCommand, activateMapCommand, activateToolCommand, markDirtyCommand],
    "map.create"
  );
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

export function addLayerCommand(
  mapId: MapId,
  kind: "tile" | "object",
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
          kind === "tile" ? addTopLevelTileLayer(map, name) : addTopLevelObjectLayer(map, name);
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

export function getLayerKindForState(
  state: EditorWorkspaceState,
  mapId: MapId,
  layerId: LayerId
): LayerDefinition["kind"] | undefined {
  const map = state.maps.find((entry) => entry.id === mapId);
  const layer = map ? getLayerById(map.layers, layerId) : undefined;
  return layer?.kind;
}
