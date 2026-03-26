import type { EditorBootstrapContract } from "@pixel-editor/contracts";
import { CommandHistory } from "@pixel-editor/command-engine";
import {
  importTmxMapDocument as importTmxMapDocumentAdapter,
  importTsxTilesetDocument as importTsxTilesetDocumentAdapter,
  type ImportedTmxMapDocument,
  type ImportedTsxTilesetDocument
} from "@pixel-editor/tiled-xml";
import {
  importTmjMapDocument as importTmjMapDocumentAdapter,
  importTsjTilesetDocument as importTsjTilesetDocumentAdapter,
  type ImportedTmjMapDocument,
  type ImportedTsjTilesetDocument
} from "@pixel-editor/tiled-json";
import {
  createWangSetDefinition,
  createMapObject,
  getLayerById,
  getMapObjectBounds,
  getObjectById,
  getTilesetTileByLocalId,
  getTilesetWangSet,
  type Point,
  type CreateImageCollectionTilesetInput,
  type CreateImageTilesetInput,
  type CreateMapInput,
  type EditorMap,
  type LayerDefinition,
  type LayerId,
  type MapId,
  type MapObject,
  type ObjectId,
  type ObjectLayer,
  type ObjectShape,
  type PropertyDefinition,
  type TileAnimationFrame,
  type TilesetDefinition,
  type UpdateMapObjectDetailsInput,
  type UpdateTileMetadataInput,
  type UpdateTilesetDetailsInput,
  type UpdateMapDetailsInput,
  type UpdateWangSetInput,
  type WangSetId,
  type WangSetType
} from "@pixel-editor/domain";
import {
  clearEditorRuntimeInteractions,
  createEditorRuntimeState,
  createObjectMovePreview,
  createShapeFillCanvasPreview,
  createSingleTileStamp,
  createObjectClipboardState,
  createTileClipboardState,
  createTileSelectionCanvasPreview,
  getActiveLayer,
  getActiveMap,
  getActiveStampPrimaryGid,
  getActiveTileset,
  getCanvasPreviewTiles,
  getTileSelectionBounds,
  isObjectSelectionState,
  isTileSelectionState,
  materializeTileStampCells,
  setEditorRuntimeClipboard,
  updateObjectMovePreview,
  updateShapeFillCanvasPreview,
  updateTileSelectionCanvasPreview,
  type CanvasGestureModifiers,
  type ClipboardState,
  type EditorRuntimeState,
  type EditorToolId,
  type ObjectMoveGestureModifiers,
  type EditorWorkspaceState,
  type TileStamp,
  type ShapeFillMode
} from "@pixel-editor/editor-state";
import {
  addImportedMapDocumentCommand,
  addLayerCommand,
  captureTileSelectionStampCommand,
  clearTileSelectionCommand,
  collectTileSelectionCoordinates,
  collectShapeFillCoordinates,
  createTileStampFromSelection,
  createMapDocumentCommand,
  moveLayerCommand,
  paintTileAtCommand,
  paintTileFillCommand,
  paintTileShapeCommand,
  paintTileStampCommand,
  paintTileStrokeCommand,
  pasteTileClipboardCommand,
  panViewportCommand,
  removeLayerPropertyCommand,
  removeMapPropertyCommand,
  removeLayerCommand,
  selectTileCommand,
  selectTileRegionCommand,
  setActiveLayerCommand,
  setActiveMapCommand,
  setActiveStampCommand,
  setActiveToolCommand,
  setShapeFillModeCommand,
  setViewportZoomCommand,
  toggleGridCommand,
  upsertLayerPropertyCommand,
  upsertMapPropertyCommand,
  updateLayerDetailsCommand,
  updateMapDetailsCommand,
  type UpdateLayerDetailsInput,
  zoomViewportCommand
} from "@pixel-editor/map";
import {
  createRectangleObjectCommand,
  moveObjectsCommand,
  pasteObjectClipboardCommand,
  removeObjectPropertyCommand,
  removeSelectedObjectsCommand,
  selectObjectCommand,
  upsertObjectPropertyCommand,
  updateObjectDetailsCommand
} from "@pixel-editor/objects";
import {
  addImportedTilesetCommand,
  createTilesetWangSetCommand,
  createImageCollectionTilesetCommand,
  createImageTilesetCommand,
  removeTilesetWangSetCommand,
  createTilesetTileCollisionObjectCommand,
  moveTilesetTileCollisionObjectsCommand,
  removeTilesetTileCollisionObjectPropertyCommand,
  removeTilesetTileCollisionObjectsCommand,
  removeTilesetTilePropertyCommand,
  reorderTilesetTileCollisionObjectsCommand,
  selectTilesetStampCommand,
  setActiveTilesetCommand,
  updateTilesetTileAnimationCommand,
  updateTilesetWangSetCommand,
  updateTilesetTileCollisionObjectCommand,
  updateTilesetDetailsCommand,
  updateTilesetTileMetadataCommand,
  upsertTilesetTileCollisionObjectPropertyCommand,
  upsertTilesetTilePropertyCommand
} from "@pixel-editor/tileset";

import {
  createIndexedName,
  createIndexedSlug,
  defaultEditorNamingConfig,
  type EditorNamingConfig,
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

export interface EditorControllerOptions {
  naming?: EditorNamingConfig;
}

export interface EditorRuntimeSnapshot {
  bootstrap: EditorBootstrapContract;
  workspace: EditorWorkspaceState;
  runtime: EditorRuntimeState;
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
  importTmxMapDocument(input: string): ImportedTmxMapDocument;
  importTsxTilesetDocument(input: string): ImportedTsxTilesetDocument;
  importTmjMapDocument(input: string | unknown): ImportedTmjMapDocument;
  importTsjTilesetDocument(input: string | unknown): ImportedTsjTilesetDocument;
  createQuickMapDocument(name?: string): string;
  setActiveMap(mapId: string): void;
  setActiveLayer(layerId: string): void;
  setActiveTileset(tilesetId: string): void;
  setActiveTool(tool: EditorToolId): void;
  setShapeFillMode(mode: ShapeFillMode): void;
  setActiveStamp(stamp: TileStamp): void;
  selectObject(objectId: ObjectId): void;
  selectStampTile(tilesetId: string, localId: number): void;
  captureSelectedTilesAsStamp(): void;
  copySelectedTilesToClipboard(): void;
  cutSelectedTilesToClipboard(): void;
  pasteClipboardToSelection(): void;
  createRectangleObject(): void;
  copySelectedObjectsToClipboard(): void;
  cutSelectedObjectsToClipboard(): void;
  pasteClipboardToActiveObjectLayer(): void;
  removeSelectedObjects(): void;
  beginObjectMove(
    objectId: ObjectId,
    x: number,
    y: number,
    modifiers?: ObjectMoveGestureModifiers
  ): void;
  updateObjectMove(x: number, y: number, modifiers?: ObjectMoveGestureModifiers): void;
  endObjectMove(): void;
  createSpriteSheetTileset(input: CreateImageTilesetInput): void;
  createImageCollectionTileset(input: CreateImageCollectionTilesetInput): void;
  updateActiveTilesetDetails(patch: UpdateTilesetDetailsInput): void;
  updateSelectedTileMetadata(patch: UpdateTileMetadataInput): void;
  updateSelectedTileAnimation(animation: readonly TileAnimationFrame[]): void;
  createActiveTilesetWangSet(type: WangSetType, name?: string): WangSetId | undefined;
  updateActiveTilesetWangSet(wangSetId: WangSetId, patch: UpdateWangSetInput): void;
  removeActiveTilesetWangSet(wangSetId: WangSetId): void;
  createSelectedTileCollisionObject(
    shape: "rectangle" | "ellipse" | "point" | "polygon" | "polyline" | "capsule"
  ): ObjectId | undefined;
  updateSelectedTileCollisionObjectDetails(
    objectId: ObjectId,
    patch: UpdateMapObjectDetailsInput
  ): void;
  upsertSelectedTileCollisionObjectProperty(
    objectId: ObjectId,
    property: PropertyDefinition,
    previousName?: string
  ): void;
  removeSelectedTileCollisionObjectProperty(objectId: ObjectId, propertyName: string): void;
  removeSelectedTileCollisionObjects(objectIds: ObjectId[]): void;
  moveSelectedTileCollisionObjects(
    objectIds: readonly ObjectId[],
    deltaX: number,
    deltaY: number
  ): void;
  reorderSelectedTileCollisionObjects(
    objectIds: readonly ObjectId[],
    direction: "up" | "down"
  ): void;
  upsertSelectedTileProperty(property: PropertyDefinition, previousName?: string): void;
  removeSelectedTileProperty(propertyName: string): void;
  updateActiveMapDetails(patch: UpdateMapDetailsInput): void;
  upsertActiveMapProperty(property: PropertyDefinition, previousName?: string): void;
  removeActiveMapProperty(propertyName: string): void;
  updateActiveLayerDetails(patch: UpdateLayerDetailsInput): void;
  upsertActiveLayerProperty(property: PropertyDefinition, previousName?: string): void;
  removeActiveLayerProperty(propertyName: string): void;
  updateSelectedObjectDetails(patch: UpdateMapObjectDetailsInput): void;
  upsertSelectedObjectProperty(property: PropertyDefinition, previousName?: string): void;
  removeSelectedObjectProperty(propertyName: string): void;
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
  setViewportZoom(zoom: number): void;
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

function snapDeltaToGrid(
  referencePosition: number,
  rawDelta: number,
  gridSize: number
): number {
  if (gridSize <= 0) {
    return rawDelta;
  }

  const targetPosition = referencePosition + rawDelta;
  const snappedPosition = Math.round(targetPosition / gridSize) * gridSize;

  return snappedPosition - referencePosition;
}

class InMemoryEditorController implements EditorController {
  private readonly history: CommandHistory<EditorWorkspaceState>;
  private readonly naming: EditorNamingConfig;
  private readonly listeners = new Set<() => void>();
  private canvasStroke: CanvasStrokeState | undefined;
  private runtime = createEditorRuntimeState();
  private cachedSnapshot: EditorRuntimeSnapshot | undefined;

  constructor(
    initialState: EditorWorkspaceState,
    options: EditorControllerOptions = {}
  ) {
    this.history = new CommandHistory(initialState);
    this.naming = options.naming ?? defaultEditorNamingConfig;
  }

  getState(): EditorWorkspaceState {
    return this.history.state;
  }

  getSnapshot(): EditorRuntimeSnapshot {
    if (this.cachedSnapshot) {
      return this.cachedSnapshot;
    }

    const workspace = this.history.state;
    const activeMap = getActiveMap(workspace);
    const activeLayer = getActiveLayer(workspace);
    const activeTileset = getActiveTileset(workspace);

    this.cachedSnapshot = {
      bootstrap: toEditorBootstrap(workspace),
      workspace,
      runtime: this.runtime,
      canUndo: this.history.canUndo,
      canRedo: this.history.canRedo,
      ...(activeMap ? { activeMap } : {}),
      ...(activeLayer ? { activeLayer } : {}),
      ...(activeTileset ? { activeTileset } : {})
    };

    return this.cachedSnapshot;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  private invalidateSnapshot(): void {
    this.cachedSnapshot = undefined;
  }

  private emit(): void {
    this.invalidateSnapshot();

    for (const listener of this.listeners) {
      listener();
    }
  }

  private clearTransientInteractions(): void {
    this.canvasStroke = undefined;
    this.runtime = clearEditorRuntimeInteractions(this.runtime);
  }

  private buildTileClipboardFromSelection(): ClipboardState | undefined {
    const state = this.history.state;
    const activeLayer = getActiveLayer(state);

    if (!activeLayer || activeLayer.kind !== "tile" || !isTileSelectionState(state.session.selection)) {
      return undefined;
    }

    const stamp = createTileStampFromSelection(activeLayer, state.session.selection);
    const bounds = getTileSelectionBounds(state.session.selection);

    if (!stamp || !bounds) {
      return undefined;
    }

    return createTileClipboardState({
      stamp,
      sourceBounds: bounds
    });
  }

  private resolveActiveObjectLayer():
    | { activeMap: EditorMap; activeLayer: ObjectLayer }
    | undefined {
    const state = this.history.state;
    const activeMap = getActiveMap(state);
    const activeLayer = getActiveLayer(state);

    if (!activeMap || !activeLayer || activeLayer.kind !== "object") {
      return undefined;
    }

    return {
      activeMap,
      activeLayer
    };
  }

  private resolveSelectedTileContext():
    | {
        activeTileset: TilesetDefinition;
        selectedLocalId: number;
      }
    | undefined {
    const state = this.history.state;
    const activeTileset = getActiveTileset(state);
    const selectedLocalId = state.session.activeTilesetTileLocalId;

    if (!activeTileset || selectedLocalId === null) {
      return undefined;
    }

    return {
      activeTileset,
      selectedLocalId
    };
  }

  private getSelectedObjects(activeLayer: ObjectLayer) {
    const selection = this.history.state.session.selection;

    if (!isObjectSelectionState(selection) || selection.objectIds.length === 0) {
      return [];
    }

    const targetIds = new Set(selection.objectIds);

    return activeLayer.objects.filter((object) => targetIds.has(object.id));
  }

  private buildObjectClipboardFromSelection(): ClipboardState | undefined {
    const resolved = this.resolveActiveObjectLayer();

    if (!resolved) {
      return undefined;
    }

    const selectedObjects = this.getSelectedObjects(resolved.activeLayer);
    const bounds = getMapObjectBounds(selectedObjects);

    if (selectedObjects.length === 0 || !bounds) {
      return undefined;
    }

    return createObjectClipboardState({
      objects: selectedObjects,
      sourceLayerId: resolved.activeLayer.id,
      sourceBounds: bounds
    });
  }

  private resolveObjectClipboardPasteAnchor(
    activeMap: EditorMap,
    activeLayer: ObjectLayer
  ): { x: number; y: number } {
    const selectedObjects = this.getSelectedObjects(activeLayer);
    const sourceBounds =
      this.runtime.clipboard.kind === "object"
        ? this.runtime.clipboard.sourceBounds
        : { x: 0, y: 0 };
    const anchorObject = selectedObjects[0];

    if (anchorObject) {
      return {
        x: anchorObject.x + activeMap.settings.tileWidth,
        y: anchorObject.y + activeMap.settings.tileHeight
      };
    }

    return {
      x: sourceBounds.x + activeMap.settings.tileWidth,
      y: sourceBounds.y + activeMap.settings.tileHeight
    };
  }

  private resolveObjectMoveSelection(
    activeLayer: ObjectLayer,
    objectId: ObjectId
  ): ObjectId[] {
    const selection = this.history.state.session.selection;

    if (!isObjectSelectionState(selection) || !selection.objectIds.includes(objectId)) {
      return [objectId];
    }

    const availableObjectIds = new Set(activeLayer.objects.map((object) => object.id));
    return selection.objectIds.filter((candidateId) => availableObjectIds.has(candidateId));
  }

  private resolveObjectMoveDelta(
    preview: Extract<
      EditorRuntimeState["interactions"]["objectTransformPreview"],
      { kind: "object-move" }
    >,
    modifiers: ObjectMoveGestureModifiers = {}
  ): { deltaX: number; deltaY: number } {
    const rawDeltaX = preview.currentX - preview.anchorX;
    const rawDeltaY = preview.currentY - preview.anchorY;

    if (!modifiers.snapToGrid) {
      return {
        deltaX: rawDeltaX,
        deltaY: rawDeltaY
      };
    }

    const map = this.history.state.maps.find((entry) => entry.id === preview.mapId);

    if (!map) {
      return {
        deltaX: rawDeltaX,
        deltaY: rawDeltaY
      };
    }

    return {
      deltaX: snapDeltaToGrid(preview.referenceX, rawDeltaX, map.settings.tileWidth),
      deltaY: snapDeltaToGrid(preview.referenceY, rawDeltaY, map.settings.tileHeight)
    };
  }

  private resolveSelectedObject():
    | { activeMap: EditorMap; activeLayer: ObjectLayer; object: MapObject }
    | undefined {
    const resolved = this.resolveActiveObjectLayer();

    if (!resolved) {
      return undefined;
    }

    const selection = this.history.state.session.selection;

    if (!isObjectSelectionState(selection) || selection.objectIds.length === 0) {
      return undefined;
    }

    const object = getObjectById(resolved.activeLayer, selection.objectIds[0]!);

    if (!object) {
      return undefined;
    }

    return {
      ...resolved,
      object
    };
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
    const preview = this.runtime.interactions.canvasPreview;

    if (preview.kind !== "shape-fill") {
      return;
    }

    this.runtime = {
      ...this.runtime,
      interactions: {
        ...this.runtime.interactions,
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
      }
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

    this.runtime = {
      ...this.runtime,
      interactions: {
        ...this.runtime.interactions,
        canvasPreview: createShapeFillCanvasPreview({
          mapId: activeMap.id,
          layerId: activeLayer.id,
          mode: state.session.shapeFillMode,
          originX: x,
          originY: y,
          gid: getActiveStampPrimaryGid(state) ?? 1,
          modifiers
        })
      }
    };
    this.updateShapeFillPreview(x, y, modifiers);
  }

  private updateTileSelectionPreview(x: number, y: number): void {
    const preview = this.runtime.interactions.canvasPreview;

    if (preview.kind !== "tile-selection") {
      return;
    }

    this.runtime = {
      ...this.runtime,
      interactions: {
        ...this.runtime.interactions,
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
      }
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

    this.runtime = {
      ...this.runtime,
      interactions: {
        ...this.runtime.interactions,
        canvasPreview: createTileSelectionCanvasPreview({
          mapId: activeMap.id,
          layerId: activeLayer.id,
          originX: x,
          originY: y
        })
      }
    };
    this.updateTileSelectionPreview(x, y);
  }

  createMapDocument(input: CreateMapInput): string {
    const command = createMapDocumentCommand(
      input,
      this.naming.defaultMapLayerNames
    );
    const projectedMap = command.run(this.history.state).maps.at(-1);

    this.commit(command);

    return projectedMap?.id ?? "";
  }

  importTmxMapDocument(input: string): ImportedTmxMapDocument {
    const imported = importTmxMapDocumentAdapter(input);

    this.commit(addImportedMapDocumentCommand(imported.map));

    return imported;
  }

  importTsxTilesetDocument(input: string): ImportedTsxTilesetDocument {
    const imported = importTsxTilesetDocumentAdapter(input);
    const activeMap = getActiveMap(this.history.state);

    this.commit(
      addImportedTilesetCommand({
        tileset: imported.tileset,
        ...(activeMap ? { mapId: activeMap.id } : {})
      })
    );

    return imported;
  }

  importTmjMapDocument(input: string | unknown): ImportedTmjMapDocument {
    const imported = importTmjMapDocumentAdapter(input);

    this.commit(addImportedMapDocumentCommand(imported.map));

    return imported;
  }

  importTsjTilesetDocument(input: string | unknown): ImportedTsjTilesetDocument {
    const imported = importTsjTilesetDocumentAdapter(input);
    const activeMap = getActiveMap(this.history.state);

    this.commit(
      addImportedTilesetCommand({
        tileset: imported.tileset,
        ...(activeMap ? { mapId: activeMap.id } : {})
      })
    );

    return imported;
  }

  createQuickMapDocument(name?: string): string {
    const nextName =
      name?.trim() ||
      createIndexedSlug(
        this.naming.mapNamePrefix,
        this.history.state.maps.length + 1
      );

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

  selectObject(objectId: ObjectId): void {
    const resolved = this.resolveActiveObjectLayer();

    if (!resolved || !getObjectById(resolved.activeLayer, objectId)) {
      return;
    }

    this.clearTransientInteractions();
    this.commit(selectObjectCommand(objectId));
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

  copySelectedTilesToClipboard(): void {
    const clipboard = this.buildTileClipboardFromSelection();

    if (!clipboard) {
      return;
    }

    this.runtime = setEditorRuntimeClipboard(this.runtime, clipboard);
    this.emit();
  }

  cutSelectedTilesToClipboard(): void {
    const state = this.history.state;
    const activeMap = getActiveMap(state);
    const activeLayer = getActiveLayer(state);
    const clipboard = this.buildTileClipboardFromSelection();

    if (!activeMap || !activeLayer || activeLayer.kind !== "tile" || !clipboard) {
      return;
    }

    this.clearTransientInteractions();
    this.runtime = setEditorRuntimeClipboard(this.runtime, clipboard);
    this.commit(clearTileSelectionCommand(activeMap.id, activeLayer.id, state.session.selection));
  }

  pasteClipboardToSelection(): void {
    const state = this.history.state;
    const activeMap = getActiveMap(state);
    const activeLayer = getActiveLayer(state);
    const selectionBounds = getTileSelectionBounds(state.session.selection);

    if (
      this.runtime.clipboard.kind !== "tile" ||
      !activeMap ||
      !activeLayer ||
      activeLayer.kind !== "tile" ||
      !selectionBounds
    ) {
      return;
    }

    this.clearTransientInteractions();
    this.commit(
      pasteTileClipboardCommand(
        activeMap.id,
        activeLayer.id,
        selectionBounds.x,
        selectionBounds.y,
        this.runtime.clipboard.stamp
      )
    );
  }

  createRectangleObject(): void {
    const resolved = this.resolveActiveObjectLayer();

    if (!resolved) {
      return;
    }

    this.clearTransientInteractions();
    this.commit(
      createRectangleObjectCommand(resolved.activeMap.id, resolved.activeLayer.id, {
        name: createIndexedName(
          this.naming.objectNamePrefix,
          resolved.activeLayer.objects.length + 1
        ),
        x: resolved.activeMap.settings.tileWidth,
        y: resolved.activeMap.settings.tileHeight,
        width: resolved.activeMap.settings.tileWidth,
        height: resolved.activeMap.settings.tileHeight
      })
    );
  }

  copySelectedObjectsToClipboard(): void {
    const clipboard = this.buildObjectClipboardFromSelection();

    if (!clipboard) {
      return;
    }

    this.runtime = setEditorRuntimeClipboard(this.runtime, clipboard);
    this.emit();
  }

  cutSelectedObjectsToClipboard(): void {
    const resolved = this.resolveActiveObjectLayer();
    const selection = this.history.state.session.selection;
    const clipboard = this.buildObjectClipboardFromSelection();

    if (!resolved || !clipboard || !isObjectSelectionState(selection)) {
      return;
    }

    this.clearTransientInteractions();
    this.runtime = setEditorRuntimeClipboard(this.runtime, clipboard);
    this.commit(
      removeSelectedObjectsCommand(
        resolved.activeMap.id,
        resolved.activeLayer.id,
        selection
      )
    );
  }

  pasteClipboardToActiveObjectLayer(): void {
    const resolved = this.resolveActiveObjectLayer();

    if (!resolved || this.runtime.clipboard.kind !== "object") {
      return;
    }

    const anchor = this.resolveObjectClipboardPasteAnchor(
      resolved.activeMap,
      resolved.activeLayer
    );

    this.clearTransientInteractions();
    this.commit(
      pasteObjectClipboardCommand(
        resolved.activeMap.id,
        resolved.activeLayer.id,
        anchor.x,
        anchor.y,
        this.runtime.clipboard.objects,
        this.runtime.clipboard.sourceBounds
      )
    );
  }

  removeSelectedObjects(): void {
    const resolved = this.resolveActiveObjectLayer();
    const selection = this.history.state.session.selection;

    if (!resolved || !isObjectSelectionState(selection)) {
      return;
    }

    this.clearTransientInteractions();
    this.commit(
      removeSelectedObjectsCommand(
        resolved.activeMap.id,
        resolved.activeLayer.id,
        selection
      )
    );
  }

  beginObjectMove(
    objectId: ObjectId,
    x: number,
    y: number,
    modifiers: ObjectMoveGestureModifiers = {}
  ): void {
    const resolved = this.resolveActiveObjectLayer();

    if (!resolved || !getObjectById(resolved.activeLayer, objectId)) {
      return;
    }

    const objectIds = this.resolveObjectMoveSelection(resolved.activeLayer, objectId);
    const movingObjects = resolved.activeLayer.objects.filter((object) =>
      objectIds.includes(object.id)
    );
    const bounds = getMapObjectBounds(movingObjects);
    const selection = this.history.state.session.selection;
    const isSameSingleSelection =
      isObjectSelectionState(selection) &&
      selection.objectIds.length === 1 &&
      selection.objectIds[0] === objectId;

    if (!bounds) {
      return;
    }

    this.clearTransientInteractions();

    if (!isSameSingleSelection && objectIds.length === 1 && objectIds[0] === objectId) {
      this.commit(selectObjectCommand(objectId));
    }

    this.runtime = {
      ...this.runtime,
      interactions: {
        ...this.runtime.interactions,
        objectTransformPreview: createObjectMovePreview({
          mapId: resolved.activeMap.id,
          layerId: resolved.activeLayer.id,
          objectIds,
          anchorX: x,
          anchorY: y,
          referenceX: bounds.x,
          referenceY: bounds.y,
          modifiers
        })
      }
    };
    this.emit();
  }

  updateObjectMove(
    x: number,
    y: number,
    modifiers: ObjectMoveGestureModifiers = {}
  ): void {
    const preview = this.runtime.interactions.objectTransformPreview;

    if (preview.kind !== "object-move") {
      return;
    }

    const delta = this.resolveObjectMoveDelta(
      {
        ...preview,
        currentX: x,
        currentY: y
      },
      modifiers
    );

    this.runtime = {
      ...this.runtime,
      interactions: {
        ...this.runtime.interactions,
        objectTransformPreview: updateObjectMovePreview(preview, {
          currentX: x,
          currentY: y,
          deltaX: delta.deltaX,
          deltaY: delta.deltaY,
          modifiers
        })
      }
    };
    this.emit();
  }

  endObjectMove(): void {
    const preview = this.runtime.interactions.objectTransformPreview;

    if (preview.kind !== "object-move") {
      return;
    }

    this.runtime = clearEditorRuntimeInteractions(this.runtime);

    if (preview.deltaX === 0 && preview.deltaY === 0) {
      this.emit();
      return;
    }

    this.commit(
      moveObjectsCommand(
        preview.mapId,
        preview.layerId,
        preview.objectIds,
        preview.deltaX,
        preview.deltaY
      )
    );
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

  updateSelectedTileAnimation(animation: readonly TileAnimationFrame[]): void {
    const state = this.history.state;
    const activeTileset = getActiveTileset(state);
    const selectedLocalId = state.session.activeTilesetTileLocalId;

    if (!activeTileset || selectedLocalId === null) {
      return;
    }

    this.commit(updateTilesetTileAnimationCommand(activeTileset.id, selectedLocalId, animation));
  }

  createActiveTilesetWangSet(
    type: WangSetType,
    name?: string
  ): WangSetId | undefined {
    const activeTileset = getActiveTileset(this.history.state);

    if (!activeTileset) {
      return undefined;
    }

    const wangSet = createWangSetDefinition({
      name: name ?? this.naming.defaultWangSetName,
      type
    });

    this.commit(createTilesetWangSetCommand(activeTileset.id, wangSet));

    return wangSet.id;
  }

  updateActiveTilesetWangSet(wangSetId: WangSetId, patch: UpdateWangSetInput): void {
    const activeTileset = getActiveTileset(this.history.state);

    if (!activeTileset || !getTilesetWangSet(activeTileset, wangSetId)) {
      return;
    }

    this.commit(updateTilesetWangSetCommand(activeTileset.id, wangSetId, patch));
  }

  removeActiveTilesetWangSet(wangSetId: WangSetId): void {
    const activeTileset = getActiveTileset(this.history.state);

    if (!activeTileset || !getTilesetWangSet(activeTileset, wangSetId)) {
      return;
    }

    this.commit(removeTilesetWangSetCommand(activeTileset.id, wangSetId));
  }

  createSelectedTileCollisionObject(
    shape: "rectangle" | "ellipse" | "point" | "polygon" | "polyline" | "capsule"
  ): ObjectId | undefined {
    const resolved = this.resolveSelectedTileContext();

    if (!resolved) {
      return undefined;
    }

    const selectedTile = getTilesetTileByLocalId(
      resolved.activeTileset,
      resolved.selectedLocalId
    );
    const existingCount = selectedTile?.collisionLayer?.objects.length ?? 0;
    const tileWidth = resolved.activeTileset.tileWidth;
    const tileHeight = resolved.activeTileset.tileHeight;
    const defaultWidth = Math.max(8, tileWidth * 0.5);
    const defaultHeight = Math.max(8, tileHeight * 0.5);
    const originX = Math.max(0, (tileWidth - defaultWidth) * 0.5);
    const originY = Math.max(0, (tileHeight - defaultHeight) * 0.5);

    const objectInput: {
      shape: ObjectShape;
      x: number;
      y: number;
      width?: number;
      height?: number;
      points?: Point[];
    } = {
      shape,
      x: originX,
      y: originY
    };

    if (shape === "point") {
      objectInput.x = tileWidth * 0.5;
      objectInput.y = tileHeight * 0.5;
    } else {
      objectInput.width = defaultWidth;
      objectInput.height = defaultHeight;

      if (shape === "polygon") {
        objectInput.points = [
          { x: defaultWidth * 0.5, y: 0 },
          { x: defaultWidth, y: defaultHeight },
          { x: 0, y: defaultHeight }
        ];
      } else if (shape === "polyline") {
        objectInput.points = [
          { x: 0, y: defaultHeight },
          { x: defaultWidth * 0.5, y: 0 },
          { x: defaultWidth, y: defaultHeight }
        ];
      }
    }

    const object = createMapObject({
      name: createIndexedName(this.naming.objectNamePrefix, existingCount + 1),
      ...objectInput
    });

    this.commit(
      createTilesetTileCollisionObjectCommand(
        resolved.activeTileset.id,
        resolved.selectedLocalId,
        object
      )
    );

    return object.id;
  }

  updateSelectedTileCollisionObjectDetails(
    objectId: ObjectId,
    patch: UpdateMapObjectDetailsInput
  ): void {
    const resolved = this.resolveSelectedTileContext();

    if (!resolved) {
      return;
    }

    this.commit(
      updateTilesetTileCollisionObjectCommand(
        resolved.activeTileset.id,
        resolved.selectedLocalId,
        objectId,
        patch
      )
    );
  }

  upsertSelectedTileCollisionObjectProperty(
    objectId: ObjectId,
    property: PropertyDefinition,
    previousName?: string
  ): void {
    const resolved = this.resolveSelectedTileContext();

    if (!resolved) {
      return;
    }

    this.commit(
      upsertTilesetTileCollisionObjectPropertyCommand(
        resolved.activeTileset.id,
        resolved.selectedLocalId,
        objectId,
        property,
        previousName
      )
    );
  }

  removeSelectedTileCollisionObjectProperty(
    objectId: ObjectId,
    propertyName: string
  ): void {
    const resolved = this.resolveSelectedTileContext();

    if (!resolved) {
      return;
    }

    this.commit(
      removeTilesetTileCollisionObjectPropertyCommand(
        resolved.activeTileset.id,
        resolved.selectedLocalId,
        objectId,
        propertyName
      )
    );
  }

  removeSelectedTileCollisionObjects(objectIds: ObjectId[]): void {
    const resolved = this.resolveSelectedTileContext();

    if (!resolved || objectIds.length === 0) {
      return;
    }

    this.commit(
      removeTilesetTileCollisionObjectsCommand(
        resolved.activeTileset.id,
        resolved.selectedLocalId,
        objectIds
      )
    );
  }

  moveSelectedTileCollisionObjects(
    objectIds: readonly ObjectId[],
    deltaX: number,
    deltaY: number
  ): void {
    const resolved = this.resolveSelectedTileContext();

    if (!resolved || objectIds.length === 0 || (deltaX === 0 && deltaY === 0)) {
      return;
    }

    this.commit(
      moveTilesetTileCollisionObjectsCommand(
        resolved.activeTileset.id,
        resolved.selectedLocalId,
        objectIds,
        deltaX,
        deltaY
      )
    );
  }

  reorderSelectedTileCollisionObjects(
    objectIds: readonly ObjectId[],
    direction: "up" | "down"
  ): void {
    const resolved = this.resolveSelectedTileContext();

    if (!resolved || objectIds.length === 0) {
      return;
    }

    this.commit(
      reorderTilesetTileCollisionObjectsCommand(
        resolved.activeTileset.id,
        resolved.selectedLocalId,
        objectIds,
        direction
      )
    );
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

  upsertActiveMapProperty(property: PropertyDefinition, previousName?: string): void {
    const activeMap = getActiveMap(this.history.state);

    if (!activeMap) {
      return;
    }

    this.commit(upsertMapPropertyCommand(activeMap.id, property, previousName));
  }

  removeActiveMapProperty(propertyName: string): void {
    const activeMap = getActiveMap(this.history.state);

    if (!activeMap) {
      return;
    }

    this.commit(removeMapPropertyCommand(activeMap.id, propertyName));
  }

  updateActiveLayerDetails(patch: UpdateLayerDetailsInput): void {
    const activeMap = getActiveMap(this.history.state);
    const activeLayer = getActiveLayer(this.history.state);

    if (!activeMap || !activeLayer) {
      return;
    }

    this.commit(updateLayerDetailsCommand(activeMap.id, activeLayer.id, patch));
  }

  upsertActiveLayerProperty(property: PropertyDefinition, previousName?: string): void {
    const activeMap = getActiveMap(this.history.state);
    const activeLayer = getActiveLayer(this.history.state);

    if (!activeMap || !activeLayer) {
      return;
    }

    this.commit(upsertLayerPropertyCommand(activeMap.id, activeLayer.id, property, previousName));
  }

  removeActiveLayerProperty(propertyName: string): void {
    const activeMap = getActiveMap(this.history.state);
    const activeLayer = getActiveLayer(this.history.state);

    if (!activeMap || !activeLayer) {
      return;
    }

    this.commit(removeLayerPropertyCommand(activeMap.id, activeLayer.id, propertyName));
  }

  updateSelectedObjectDetails(patch: UpdateMapObjectDetailsInput): void {
    const resolved = this.resolveSelectedObject();

    if (!resolved) {
      return;
    }

    this.commit(
      updateObjectDetailsCommand(
        resolved.activeMap.id,
        resolved.activeLayer.id,
        resolved.object.id,
        patch
      )
    );
  }

  upsertSelectedObjectProperty(
    property: PropertyDefinition,
    previousName?: string
  ): void {
    const resolved = this.resolveSelectedObject();

    if (!resolved) {
      return;
    }

    this.commit(
      upsertObjectPropertyCommand(
        resolved.activeMap.id,
        resolved.activeLayer.id,
        resolved.object.id,
        property,
        previousName
      )
    );
  }

  removeSelectedObjectProperty(propertyName: string): void {
    const resolved = this.resolveSelectedObject();

    if (!resolved) {
      return;
    }

    this.commit(
      removeObjectPropertyCommand(
        resolved.activeMap.id,
        resolved.activeLayer.id,
        resolved.object.id,
        propertyName
      )
    );
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
        name ??
          createIndexedName(
            this.naming.layerNamePrefixes.tile,
            activeMap.layers.length + 1
          )
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
        name ??
          createIndexedName(
            this.naming.layerNamePrefixes.object,
            activeMap.layers.length + 1
          )
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
    if (this.runtime.interactions.canvasPreview.kind === "shape-fill") {
      this.updateShapeFillPreview(x, y, modifiers);
      return;
    }

    if (this.runtime.interactions.canvasPreview.kind === "tile-selection") {
      this.updateTileSelectionPreview(x, y);
      return;
    }

    this.appendStrokeSegment(x, y);
  }

  endCanvasStroke(): void {
    const preview =
      this.runtime.interactions.canvasPreview.kind !== "none"
        ? this.runtime.interactions.canvasPreview
        : undefined;

    if (preview) {
      if (preview.kind === "tile-selection") {
        this.runtime = clearEditorRuntimeInteractions(this.runtime);
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

      this.runtime = clearEditorRuntimeInteractions(this.runtime);

      if (preview.coordinates.length === 0) {
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

    if (tool === "select") {
      this.commit(selectTileRegionCommand(x, y, x, y));
      return;
    }

    if (tool === "object-select") {
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

  setViewportZoom(zoom: number): void {
    this.commit(setViewportZoomCommand(zoom));
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
  initialState: EditorWorkspaceState,
  options: EditorControllerOptions = {}
): EditorController {
  return new InMemoryEditorController(initialState, options);
}

export function createEditorStore(
  initialState: EditorWorkspaceState,
  options: EditorControllerOptions = {}
): EditorController {
  return createEditorController(initialState, options);
}
