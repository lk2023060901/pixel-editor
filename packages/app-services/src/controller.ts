import type { EditorBootstrapContract } from "@pixel-editor/contracts";
import { CommandHistory } from "@pixel-editor/command-engine";
import {
  getLayerById,
  type CreateImageCollectionTilesetInput,
  type CreateImageTilesetInput,
  type CreateMapInput,
  type EditorMap,
  type LayerDefinition,
  type LayerId,
  type MapId,
  type PropertyDefinition,
  type TilesetDefinition,
  type UpdateTileMetadataInput,
  type UpdateTilesetDetailsInput,
  type UpdateMapDetailsInput
} from "@pixel-editor/domain";
import {
  clearCanvasPreview,
  createEditorInteractionState,
  createShapeFillCanvasPreview,
  createSingleTileStamp,
  createTileSelectionCanvasPreview,
  getActiveLayer,
  getActiveMap,
  getActiveStampPrimaryGid,
  getActiveTileset,
  getCanvasPreviewTiles,
  isTileSelectionState,
  materializeTileStampCells,
  updateShapeFillCanvasPreview,
  updateTileSelectionCanvasPreview,
  type CanvasGestureModifiers,
  type EditorInteractionState,
  type EditorToolId,
  type EditorWorkspaceState,
  type TileStamp,
  type ShapeFillMode
} from "@pixel-editor/editor-state";
import {
  addLayerCommand,
  captureTileSelectionStampCommand,
  collectTileSelectionCoordinates,
  collectShapeFillCoordinates,
  createMapDocumentCommand,
  moveLayerCommand,
  paintTileAtCommand,
  paintTileFillCommand,
  paintTileShapeCommand,
  paintTileStampCommand,
  paintTileStrokeCommand,
  panViewportCommand,
  removeLayerCommand,
  selectTileCommand,
  selectTileRegionCommand,
  setActiveLayerCommand,
  setActiveMapCommand,
  setActiveStampCommand,
  setActiveToolCommand,
  setShapeFillModeCommand,
  toggleGridCommand,
  updateMapDetailsCommand,
  zoomViewportCommand
} from "@pixel-editor/map";
import {
  createImageCollectionTilesetCommand,
  createImageTilesetCommand,
  removeTilesetTilePropertyCommand,
  selectTilesetStampCommand,
  setActiveTilesetCommand,
  updateTilesetDetailsCommand,
  updateTilesetTileMetadataCommand,
  upsertTilesetTilePropertyCommand
} from "@pixel-editor/tileset";

import {
  createIndexedName,
  createIndexedSlug,
  layerNamePrefixes,
  quickMapBlueprint
} from "./config";
import { toEditorBootstrap } from "./bootstrap";

export interface DocumentRepository {
  saveWorkspace(state: EditorWorkspaceState): Promise<void>;
}

export interface AssetRepository {
  listAssetRoots(projectId: string): Promise<string[]>;
}

export interface ExportJobGateway {
  queueMapExport(mapId: string): Promise<{ jobId: string }>;
}

export interface ValidationGateway {
  validateWorkspace(state: EditorWorkspaceState): Promise<string[]>;
}

export interface EditorInfrastructure {
  documents: DocumentRepository;
  assets: AssetRepository;
  exports: ExportJobGateway;
  validation: ValidationGateway;
}

export interface EditorRuntimeSnapshot {
  bootstrap: EditorBootstrapContract;
  workspace: EditorWorkspaceState;
  interactions: EditorInteractionState;
  activeMap?: EditorMap;
  activeLayer?: LayerDefinition;
  activeTileset?: TilesetDefinition;
  canUndo: boolean;
  canRedo: boolean;
}

export interface EditorController {
  getState(): EditorWorkspaceState;
  getSnapshot(): EditorRuntimeSnapshot;
  createMapDocument(input: CreateMapInput): string;
  createQuickMapDocument(name?: string): string;
  setActiveMap(mapId: string): void;
  setActiveLayer(layerId: string): void;
  setActiveTileset(tilesetId: string): void;
  setActiveTool(tool: EditorToolId): void;
  setShapeFillMode(mode: ShapeFillMode): void;
  setActiveStamp(stamp: TileStamp): void;
  selectStampTile(tilesetId: string, localId: number): void;
  captureSelectedTilesAsStamp(): void;
  createSpriteSheetTileset(input: CreateImageTilesetInput): void;
  createImageCollectionTileset(input: CreateImageCollectionTilesetInput): void;
  updateActiveTilesetDetails(patch: UpdateTilesetDetailsInput): void;
  updateSelectedTileMetadata(patch: UpdateTileMetadataInput): void;
  upsertSelectedTileProperty(property: PropertyDefinition, previousName?: string): void;
  removeSelectedTileProperty(propertyName: string): void;
  updateActiveMapDetails(patch: UpdateMapDetailsInput): void;
  addTileLayer(name?: string): void;
  addObjectLayer(name?: string): void;
  removeActiveLayer(): void;
  moveActiveLayer(direction: "up" | "down"): void;
  beginCanvasStroke(x: number, y: number, modifiers?: CanvasGestureModifiers): void;
  updateCanvasStroke(x: number, y: number, modifiers?: CanvasGestureModifiers): void;
  endCanvasStroke(): void;
  handleCanvasPrimaryAction(x: number, y: number): void;
  zoomIn(): void;
  zoomOut(): void;
  panBy(deltaX: number, deltaY: number): void;
  toggleGrid(): void;
  undo(): void;
  redo(): void;
  subscribe(listener: () => void): () => void;
}

interface CanvasStrokeState {
  mapId: MapId;
  layerId: LayerId;
  stamp: TileStamp;
  cells: Array<{ x: number; y: number; gid: number | null }>;
  cellIndicesByKey: Map<string, number>;
  lastX: number;
  lastY: number;
}

function createTileKey(x: number, y: number): string {
  return `${x}:${y}`;
}

function rasterizeLine(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number
): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  let x = fromX;
  let y = fromY;
  const deltaX = Math.abs(toX - fromX);
  const deltaY = Math.abs(toY - fromY);
  const stepX = fromX < toX ? 1 : -1;
  const stepY = fromY < toY ? 1 : -1;
  let error = deltaX - deltaY;

  while (true) {
    points.push({ x, y });

    if (x === toX && y === toY) {
      return points;
    }

    const doubledError = error * 2;

    if (doubledError > -deltaY) {
      error -= deltaY;
      x += stepX;
    }

    if (doubledError < deltaX) {
      error += deltaX;
      y += stepY;
    }
  }
}

class InMemoryEditorController implements EditorController {
  private readonly history: CommandHistory<EditorWorkspaceState>;
  private readonly listeners = new Set<() => void>();
  private canvasStroke: CanvasStrokeState | undefined;
  private interactions = createEditorInteractionState();

  constructor(initialState: EditorWorkspaceState) {
    this.history = new CommandHistory(initialState);
  }

  getState(): EditorWorkspaceState {
    return this.history.state;
  }

  getSnapshot(): EditorRuntimeSnapshot {
    const workspace = this.history.state;
    const activeMap = getActiveMap(workspace);
    const activeLayer = getActiveLayer(workspace);
    const activeTileset = getActiveTileset(workspace);

    return {
      bootstrap: toEditorBootstrap(workspace),
      workspace,
      interactions: this.interactions,
      canUndo: this.history.canUndo,
      canRedo: this.history.canRedo,
      ...(activeMap ? { activeMap } : {}),
      ...(activeLayer ? { activeLayer } : {}),
      ...(activeTileset ? { activeTileset } : {})
    };
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  private clearTransientInteractions(): void {
    this.canvasStroke = undefined;
    this.interactions = createEditorInteractionState();
  }

  private commit(command: Parameters<CommandHistory<EditorWorkspaceState>["execute"]>[0]): void {
    this.history.execute(command);
    this.emit();
  }

  private appendStrokeSegment(x: number, y: number): void {
    if (!this.canvasStroke) {
      return;
    }

    const segment = rasterizeLine(this.canvasStroke.lastX, this.canvasStroke.lastY, x, y);

    for (const point of segment) {
      const stampedCells = materializeTileStampCells(
        this.canvasStroke.stamp,
        point.x,
        point.y
      );

      for (const stampedCell of stampedCells) {
        const key = createTileKey(stampedCell.x, stampedCell.y);
        const existingIndex = this.canvasStroke.cellIndicesByKey.get(key);

        if (existingIndex === undefined) {
          this.canvasStroke.cells.push(stampedCell);
          this.canvasStroke.cellIndicesByKey.set(
            key,
            this.canvasStroke.cells.length - 1
          );
          continue;
        }

        this.canvasStroke.cells[existingIndex] = stampedCell;
      }
    }

    this.canvasStroke.lastX = x;
    this.canvasStroke.lastY = y;
  }

  private resolvePaintableLayer():
    | { mapId: MapId; layerId: LayerId; stamp: TileStamp }
    | undefined {
    const state = this.history.state;
    const activeMap = getActiveMap(state);
    const activeLayer = getActiveLayer(state);

    if (!activeMap || !activeLayer || activeLayer.kind !== "tile") {
      return undefined;
    }

    if (state.session.activeTool === "stamp") {
      return {
        mapId: activeMap.id,
        layerId: activeLayer.id,
        stamp: state.session.activeStamp
      };
    }

    if (state.session.activeTool === "eraser") {
      return {
        mapId: activeMap.id,
        layerId: activeLayer.id,
        stamp: createSingleTileStamp(null)
      };
    }

    return undefined;
  }

  private applyBucketFill(x: number, y: number): void {
    const state = this.history.state;
    const activeMap = getActiveMap(state);
    const activeLayer = getActiveLayer(state);

    if (!activeMap || !activeLayer || activeLayer.kind !== "tile") {
      return;
    }

    this.commit(
      paintTileFillCommand(
        activeMap.id,
        activeLayer.id,
        activeLayer,
        x,
        y,
        getActiveStampPrimaryGid(state) ?? 1
      )
    );
  }

  private updateShapeFillPreview(
    x: number,
    y: number,
    modifiers: CanvasGestureModifiers = {}
  ): void {
    const preview = this.interactions.canvasPreview;

    if (preview.kind !== "shape-fill") {
      return;
    }

    this.interactions = {
      ...this.interactions,
      canvasPreview: updateShapeFillCanvasPreview(preview, {
        currentX: x,
        currentY: y,
        modifiers,
        coordinates: collectShapeFillCoordinates(
          preview.mode,
          preview.originX,
          preview.originY,
          x,
          y,
          modifiers
        )
      })
    };

    this.emit();
  }

  private beginShapeFillPreview(
    x: number,
    y: number,
    modifiers: CanvasGestureModifiers = {}
  ): void {
    const state = this.history.state;
    const activeMap = getActiveMap(state);
    const activeLayer = getActiveLayer(state);

    if (!activeMap || !activeLayer || activeLayer.kind !== "tile") {
      return;
    }

    this.interactions = {
      ...this.interactions,
      canvasPreview: createShapeFillCanvasPreview({
        mapId: activeMap.id,
        layerId: activeLayer.id,
        mode: state.session.shapeFillMode,
        originX: x,
        originY: y,
        gid: getActiveStampPrimaryGid(state) ?? 1,
        modifiers
      })
    };
    this.updateShapeFillPreview(x, y, modifiers);
  }

  private updateTileSelectionPreview(x: number, y: number): void {
    const preview = this.interactions.canvasPreview;

    if (preview.kind !== "tile-selection") {
      return;
    }

    this.interactions = {
      ...this.interactions,
      canvasPreview: updateTileSelectionCanvasPreview(preview, {
        currentX: x,
        currentY: y,
        coordinates: collectTileSelectionCoordinates(
          preview.originX,
          preview.originY,
          x,
          y
        )
      })
    };
    this.emit();
  }

  private beginTileSelectionPreview(x: number, y: number): void {
    const state = this.history.state;
    const activeMap = getActiveMap(state);
    const activeLayer = getActiveLayer(state);

    if (!activeMap || !activeLayer || activeLayer.kind !== "tile") {
      this.commit(selectTileCommand(x, y));
      return;
    }

    this.interactions = {
      ...this.interactions,
      canvasPreview: createTileSelectionCanvasPreview({
        mapId: activeMap.id,
        layerId: activeLayer.id,
        originX: x,
        originY: y
      })
    };
    this.updateTileSelectionPreview(x, y);
  }

  createMapDocument(input: CreateMapInput): string {
    const command = createMapDocumentCommand(input);
    const projectedMap = command.run(this.history.state).maps.at(-1);

    this.commit(command);

    return projectedMap?.id ?? "";
  }

  createQuickMapDocument(name?: string): string {
    const nextName =
      name?.trim() || createIndexedSlug("map", this.history.state.maps.length + 1);

    return this.createMapDocument({
      name: nextName,
      ...quickMapBlueprint
    });
  }

  setActiveMap(mapId: string): void {
    const state = this.history.state;
    const map = state.maps.find((entry) => entry.id === mapId);

    if (!map) {
      return;
    }

    this.clearTransientInteractions();
    this.commit(setActiveMapCommand(map.id));
  }

  setActiveLayer(layerId: string): void {
    const state = this.history.state;
    const activeMap = getActiveMap(state);

    if (!activeMap) {
      return;
    }

    const layer = getLayerById(activeMap.layers, layerId as LayerId);

    if (!layer) {
      return;
    }

    this.clearTransientInteractions();
    this.commit(setActiveLayerCommand(layer.id));
  }

  setActiveTileset(tilesetId: string): void {
    const tileset = this.history.state.tilesets.find((entry) => entry.id === tilesetId);

    if (!tileset) {
      return;
    }

    this.commit(setActiveTilesetCommand(tileset.id));
  }

  setActiveTool(tool: EditorToolId): void {
    this.clearTransientInteractions();
    this.commit(setActiveToolCommand(tool));
  }

  setShapeFillMode(mode: ShapeFillMode): void {
    this.clearTransientInteractions();
    this.commit(setShapeFillModeCommand(mode));
  }

  setActiveStamp(stamp: TileStamp): void {
    if (stamp.kind === "single" && stamp.gid !== null && stamp.gid <= 0) {
      return;
    }

    this.commit(setActiveStampCommand(stamp));
  }

  selectStampTile(tilesetId: string, localId: number): void {
    const state = this.history.state;
    const tileset = state.tilesets.find((entry) => entry.id === tilesetId);
    const activeMap = getActiveMap(state);

    if (!tileset || !activeMap || localId < 0) {
      return;
    }

    this.commit(selectTilesetStampCommand(tileset.id, localId));
  }

  captureSelectedTilesAsStamp(): void {
    const state = this.history.state;
    const activeLayer = getActiveLayer(state);

    if (!activeLayer || activeLayer.kind !== "tile" || !isTileSelectionState(state.session.selection)) {
      return;
    }

    this.clearTransientInteractions();
    this.commit(captureTileSelectionStampCommand(activeLayer, state.session.selection));
  }

  createSpriteSheetTileset(input: CreateImageTilesetInput): void {
    const activeMap = getActiveMap(this.history.state);

    this.commit(
      createImageTilesetCommand({
        ...(activeMap ? { mapId: activeMap.id } : {}),
        tileset: input
      })
    );
  }

  createImageCollectionTileset(input: CreateImageCollectionTilesetInput): void {
    const activeMap = getActiveMap(this.history.state);

    this.commit(
      createImageCollectionTilesetCommand({
        ...(activeMap ? { mapId: activeMap.id } : {}),
        tileset: input
      })
    );
  }

  updateActiveTilesetDetails(patch: UpdateTilesetDetailsInput): void {
    const activeTileset = getActiveTileset(this.history.state);

    if (!activeTileset) {
      return;
    }

    this.commit(updateTilesetDetailsCommand(activeTileset.id, patch));
  }

  updateSelectedTileMetadata(patch: UpdateTileMetadataInput): void {
    const state = this.history.state;
    const activeTileset = getActiveTileset(state);
    const selectedLocalId = state.session.activeTilesetTileLocalId;

    if (!activeTileset || selectedLocalId === null) {
      return;
    }

    this.commit(updateTilesetTileMetadataCommand(activeTileset.id, selectedLocalId, patch));
  }

  upsertSelectedTileProperty(
    property: PropertyDefinition,
    previousName?: string
  ): void {
    const state = this.history.state;
    const activeTileset = getActiveTileset(state);
    const selectedLocalId = state.session.activeTilesetTileLocalId;

    if (!activeTileset || selectedLocalId === null) {
      return;
    }

    this.commit(
      upsertTilesetTilePropertyCommand(
        activeTileset.id,
        selectedLocalId,
        property,
        previousName
      )
    );
  }

  removeSelectedTileProperty(propertyName: string): void {
    const state = this.history.state;
    const activeTileset = getActiveTileset(state);
    const selectedLocalId = state.session.activeTilesetTileLocalId;

    if (!activeTileset || selectedLocalId === null) {
      return;
    }

    this.commit(
      removeTilesetTilePropertyCommand(activeTileset.id, selectedLocalId, propertyName)
    );
  }

  updateActiveMapDetails(patch: UpdateMapDetailsInput): void {
    const activeMap = getActiveMap(this.history.state);

    if (!activeMap) {
      return;
    }

    this.commit(updateMapDetailsCommand(activeMap.id, patch));
  }

  addTileLayer(name?: string): void {
    const activeMap = getActiveMap(this.history.state);

    if (!activeMap) {
      return;
    }

    this.commit(
      addLayerCommand(
        activeMap.id,
        "tile",
        name ?? createIndexedName(layerNamePrefixes.tile, activeMap.layers.length + 1)
      )
    );
  }

  addObjectLayer(name?: string): void {
    const activeMap = getActiveMap(this.history.state);

    if (!activeMap) {
      return;
    }

    this.commit(
      addLayerCommand(
        activeMap.id,
        "object",
        name ?? createIndexedName(layerNamePrefixes.object, activeMap.layers.length + 1)
      )
    );
  }

  removeActiveLayer(): void {
    const state = this.history.state;
    const activeMap = getActiveMap(state);
    const activeLayerId = state.session.activeLayerId;

    if (!activeMap || !activeLayerId) {
      return;
    }

    this.commit(removeLayerCommand(activeMap.id, activeLayerId));
  }

  moveActiveLayer(direction: "up" | "down"): void {
    const state = this.history.state;
    const activeMap = getActiveMap(state);
    const activeLayerId = state.session.activeLayerId;

    if (!activeMap || !activeLayerId) {
      return;
    }

    this.commit(moveLayerCommand(activeMap.id, activeLayerId, direction));
  }

  beginCanvasStroke(
    x: number,
    y: number,
    modifiers: CanvasGestureModifiers = {}
  ): void {
    const state = this.history.state;
    const tool = state.session.activeTool;

    if (tool === "select") {
      this.beginTileSelectionPreview(x, y);
      return;
    }

    if (tool === "object-select") {
      this.commit(selectTileCommand(x, y));
      return;
    }

    if (tool === "bucket-fill") {
      this.applyBucketFill(x, y);
      return;
    }

    if (tool === "shape-fill") {
      this.beginShapeFillPreview(x, y, modifiers);
      return;
    }

    const paintableLayer = this.resolvePaintableLayer();

    if (!paintableLayer) {
      return;
    }

    this.canvasStroke = {
      ...paintableLayer,
      cells: [],
      cellIndicesByKey: new Map<string, number>(),
      lastX: x,
      lastY: y
    };

    this.appendStrokeSegment(x, y);
  }

  updateCanvasStroke(
    x: number,
    y: number,
    modifiers: CanvasGestureModifiers = {}
  ): void {
    if (this.interactions.canvasPreview.kind === "shape-fill") {
      this.updateShapeFillPreview(x, y, modifiers);
      return;
    }

    if (this.interactions.canvasPreview.kind === "tile-selection") {
      this.updateTileSelectionPreview(x, y);
      return;
    }

    this.appendStrokeSegment(x, y);
  }

  endCanvasStroke(): void {
    const preview =
      this.interactions.canvasPreview.kind !== "none"
        ? this.interactions.canvasPreview
        : undefined;

    if (preview) {
      if (preview.kind === "tile-selection") {
        this.interactions = clearCanvasPreview(this.interactions);
        this.commit(
          selectTileRegionCommand(
            preview.originX,
            preview.originY,
            preview.currentX,
            preview.currentY
          )
        );
        return;
      }

      this.interactions = clearCanvasPreview(this.interactions);

      if (getCanvasPreviewTiles({ canvasPreview: preview }).length === 0) {
        this.emit();
        return;
      }

      this.commit(
        paintTileShapeCommand(
          preview.mapId,
          preview.layerId,
          preview.mode,
          preview.originX,
          preview.originY,
          preview.currentX,
          preview.currentY,
          preview.gid,
          preview.modifiers
        )
      );
      return;
    }

    const stroke = this.canvasStroke;
    this.canvasStroke = undefined;

    if (!stroke || stroke.cells.length === 0) {
      return;
    }

    this.commit(paintTileStrokeCommand(stroke.mapId, stroke.layerId, stroke.cells));
  }

  handleCanvasPrimaryAction(x: number, y: number): void {
    const state = this.history.state;
    const activeMap = getActiveMap(state);
    const activeLayer = getActiveLayer(state);

    if (!activeMap || !activeLayer) {
      return;
    }

    const tool = state.session.activeTool;

    if (tool === "select" || tool === "object-select") {
      this.commit(selectTileRegionCommand(x, y, x, y));
      return;
    }

    if (activeLayer.kind !== "tile") {
      return;
    }

    if (tool === "bucket-fill") {
      this.commit(
        paintTileFillCommand(
        activeMap.id,
        activeLayer.id,
        activeLayer,
        x,
        y,
        getActiveStampPrimaryGid(state) ?? 1
      )
    );
      return;
    }

    if (tool === "shape-fill") {
      this.commit(
        paintTileShapeCommand(
          activeMap.id,
          activeLayer.id,
          state.session.shapeFillMode,
          x,
          y,
          x,
          y,
          getActiveStampPrimaryGid(state) ?? 1
        )
      );
      return;
    }

    if (tool === "stamp") {
      this.commit(
        paintTileStampCommand(
          activeMap.id,
          activeLayer.id,
          x,
          y,
          state.session.activeStamp
        )
      );
      return;
    }

    if (tool === "eraser") {
      this.commit(paintTileAtCommand(activeMap.id, activeLayer.id, x, y, null));
    }
  }

  zoomIn(): void {
    this.commit(zoomViewportCommand("in"));
  }

  zoomOut(): void {
    this.commit(zoomViewportCommand("out"));
  }

  panBy(deltaX: number, deltaY: number): void {
    this.commit(panViewportCommand(deltaX, deltaY));
  }

  toggleGrid(): void {
    this.commit(toggleGridCommand());
  }

  undo(): void {
    this.clearTransientInteractions();
    this.history.undo();
    this.emit();
  }

  redo(): void {
    this.clearTransientInteractions();
    this.history.redo();
    this.emit();
  }
}

export function createEditorController(
  initialState: EditorWorkspaceState
): EditorController {
  return new InMemoryEditorController(initialState);
}

export function createEditorStore(
  initialState: EditorWorkspaceState
): EditorController {
  return createEditorController(initialState);
}
