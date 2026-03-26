import type {
  DocumentSummary,
  EditorBootstrapContract,
  ExportJobReceipt,
  ExportedDocumentArtifactContract,
  ProjectAssetSummary
} from "@pixel-editor/contracts";
import { resolveAssetPath } from "@pixel-editor/asset-reference";
import { CommandHistory } from "@pixel-editor/command-engine";
import { createMacroCommand } from "@pixel-editor/command-engine";
import {
  runAutomappingRuleMap,
  type AutomappingEngineIssue
} from "@pixel-editor/automapping";
import {
  importTiledProjectDocument as importTiledProjectDocumentAdapter,
  type ImportedTiledProjectDocument
} from "@pixel-editor/tiled-project";
import {
  importAutomappingRulesFile,
  matchesAutomappingMapName,
  type ImportedAutomappingRulesFile
} from "@pixel-editor/tiled-automapping";
import {
  stringifyTiledWorldDocument as exportTiledWorldDocumentAdapter,
  importTiledWorldDocument as importTiledWorldDocumentAdapter,
  type ImportedTiledWorldDocument
} from "@pixel-editor/tiled-world";
import {
  stringifyTmxMapDocument as exportTmxMapDocumentAdapter,
  stringifyTsxTilesetDocument as exportTsxTilesetDocumentAdapter,
  stringifyTxTemplateDocument as exportTxTemplateDocumentAdapter,
  importTmxMapDocument as importTmxMapDocumentAdapter,
  importTxTemplateDocument as importTxTemplateDocumentAdapter,
  importTsxTilesetDocument as importTsxTilesetDocumentAdapter,
  type ImportedTmxMapDocument,
  type ImportedTxTemplateDocument,
  type ImportedTsxTilesetDocument
} from "@pixel-editor/tiled-xml";
import {
  stringifyTmjMapDocument as exportTmjMapDocumentAdapter,
  stringifyTsjTilesetDocument as exportTsjTilesetDocumentAdapter,
  importTmjMapDocument as importTmjMapDocumentAdapter,
  importTsjTilesetDocument as importTsjTilesetDocumentAdapter,
  type ImportedTmjMapDocument,
  type ImportedTmjTilesetReference,
  type ImportedTsjTilesetDocument
} from "@pixel-editor/tiled-json";
import {
  createWangSetDefinition,
  cloneMapObject,
  createMapObject,
  attachTilesetToMap,
  getLayerById,
  getMapObjectBounds,
  getMapGlobalTileGid,
  getObjectById,
  getTilesetTileCount,
  resolveMapTileGid,
  getTilesetTileByLocalId,
  getTilesetWangSet,
  type Point,
  type CreateImageCollectionTilesetInput,
  type CreateImageTilesetInput,
  type CreateMapInput,
  type EditorWorld,
  type EditorMap,
  type LayerDefinition,
  type LayerId,
  type MapId,
  type MapObject,
  type ObjectId,
  type ObjectLayer,
  type ObjectShape,
  type ObjectTemplate,
  type PropertyDefinition,
  type PropertyTypeDefinition,
  type TemplateId,
  type TileAnimationFrame,
  type TilesetId,
  type TilesetDefinition,
  type UpdateMapObjectDetailsInput,
  type UpdateTileMetadataInput,
  type UpdateTilesetDetailsInput,
  type UpdateMapDetailsInput,
  type UpdateProjectDetailsInput,
  type UpdateWangSetInput,
  type WangSetId,
  type WangSetType
} from "@pixel-editor/domain";
import {
  clearEditorRuntimeIssueEntries,
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
  getActiveTemplate,
  getActiveTileset,
  getCanvasPreviewTiles,
  getTileSelectionBounds,
  isObjectSelectionState,
  isTileSelectionState,
  materializeTileStampCells,
  replaceEditorRuntimeIssueSourceEntries,
  setEditorRuntimeClipboard,
  setEditorRuntimeIssuePanelOpen,
  type EditorIssueEntry,
  type EditorIssueSourceKind,
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
  toggleAutoMapWhileDrawingCommand,
  toggleGridCommand,
  upsertLayerPropertyCommand,
  upsertMapPropertyCommand,
  updateLayerDetailsCommand,
  updateMapDetailsCommand,
  replaceMapDocumentCommand,
  type UpdateLayerDetailsInput,
  zoomViewportCommand
} from "@pixel-editor/map";
import {
  createRectangleObjectCommand,
  detachTemplateInstancesCommand,
  moveObjectsCommand,
  pasteObjectClipboardCommand,
  replaceObjectsWithTemplateCommand,
  resetTemplateInstancesCommand,
  removeObjectPropertyCommand,
  removeSelectedObjectsCommand,
  selectObjectCommand,
  upsertObjectPropertyCommand,
  updateObjectDetailsCommand
} from "@pixel-editor/objects";
import {
  replaceProjectCommand,
  replaceProjectPropertyTypesCommand,
  updateProjectDetailsCommand
} from "@pixel-editor/project";
import {
  addImportedTemplateCommand,
  buildObjectTemplateDocument,
  setActiveTemplateCommand
} from "@pixel-editor/template";
import {
  addImportedWorldCommand,
  moveWorldMapCommand,
  toggleShowWorldsCommand
} from "@pixel-editor/world";
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
  saveDocument(document: SavedEditorDocument): Promise<void>;
}

export interface AssetRepository {
  listAssetRoots(projectId: string): Promise<string[]>;
}

export interface ExportJobGateway {
  queueDocumentExport(
    document: ExportedDocumentArtifactContract
  ): Promise<ExportJobReceipt>;
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
  documents?: DocumentRepository;
  exports?: ExportJobGateway;
  projectAssets?: readonly ProjectAssetSummary[];
  resolveProjectTextAsset?: ProjectTextAssetResolver;
}

export type ProjectTextAssetResolver = (path: string) => string | undefined;

export interface ExternalDocumentImportOptions {
  documentPath?: string;
  assetRoots?: readonly string[];
}

export interface EditorRuntimeSnapshot {
  bootstrap: EditorBootstrapContract;
  workspace: EditorWorkspaceState;
  runtime: EditorRuntimeState;
  activeMap?: EditorMap;
  activeLayer?: LayerDefinition;
  activeTemplate?: ObjectTemplate;
  activeTileset?: TilesetDefinition;
  worldContext?: EditorWorldContextSnapshot;
  canUndo: boolean;
  canRedo: boolean;
  canSaveActiveDocument: boolean;
  canSaveAllDocuments: boolean;
  canExportActiveDocument: boolean;
  canExportActiveTilesetDocument: boolean;
  canExportActiveMapImage: boolean;
}

export interface SavedEditorDocument extends ExportedDocumentArtifactContract {}

export interface EditorWorldContextMapSnapshot {
  worldId: EditorWorld["id"];
  mapId?: EditorMap["id"];
  fileName: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
  loaded: boolean;
  canActivate: boolean;
  gridWidth?: number;
  gridHeight?: number;
}

export interface EditorWorldContextSnapshot {
  worldId: EditorWorld["id"];
  worldName: string;
  modifiable: boolean;
  activeMapFileName: string;
  activeMapRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  maps: EditorWorldContextMapSnapshot[];
}

export interface EditorController {
  getState(): EditorWorkspaceState;
  getSnapshot(): EditorRuntimeSnapshot;
  replaceProjectAssets(projectAssets: ProjectAssetSummary[]): void;
  updateProjectDetails(input: UpdateProjectDetailsInput): void;
  replaceProjectPropertyTypes(propertyTypes: PropertyTypeDefinition[]): void;
  createMapDocument(input: CreateMapInput): string;
  importTiledProjectDocument(
    input: string | unknown,
    options?: ExternalDocumentImportOptions
  ): ImportedTiledProjectDocument;
  importTiledWorldDocument(
    input: string | unknown,
    options?: ExternalDocumentImportOptions
  ): ImportedTiledWorldDocument;
  importTmxMapDocument(input: string, options?: ExternalDocumentImportOptions): ImportedTmxMapDocument;
  importTxTemplateDocument(
    input: string,
    options?: ExternalDocumentImportOptions
  ): ImportedTxTemplateDocument;
  importTsxTilesetDocument(
    input: string,
    options?: ExternalDocumentImportOptions
  ): ImportedTsxTilesetDocument;
  importTmjMapDocument(
    input: string | unknown,
    options?: ExternalDocumentImportOptions
  ): ImportedTmjMapDocument;
  importTsjTilesetDocument(
    input: string | unknown,
    options?: ExternalDocumentImportOptions
  ): ImportedTsjTilesetDocument;
  createQuickMapDocument(name?: string): string;
  saveDocument(documentId: string): Promise<boolean>;
  saveActiveDocument(): Promise<boolean>;
  saveAllDocuments(): Promise<boolean>;
  exportDocumentAsJson(documentId: string): Promise<boolean>;
  exportActiveDocumentAsJson(): Promise<boolean>;
  exportActiveTilesetAsJson(): Promise<boolean>;
  exportActiveMapImage(dataUrl: string): Promise<boolean>;
  setActiveMap(mapId: string): void;
  setActiveLayer(layerId: string): void;
  setActiveTileset(tilesetId: string): void;
  setActiveTemplate(templateId: string): void;
  setActiveTool(tool: EditorToolId): void;
  toggleWorlds(): void;
  toggleAutoMapWhileDrawing(): void;
  setShapeFillMode(mode: ShapeFillMode): void;
  setActiveStamp(stamp: TileStamp): void;
  selectObject(objectId: ObjectId): void;
  selectStampTile(tilesetId: string, localId: number): void;
  captureSelectedTilesAsStamp(): void;
  copySelectedTilesToClipboard(): void;
  cutSelectedTilesToClipboard(): void;
  pasteClipboardToSelection(): void;
  createRectangleObject(): void;
  createTemplateFromSelectedObject(input?: {
    name?: string;
    path?: string;
  }): string | undefined;
  replaceSelectedObjectsWithActiveTemplate(): void;
  resetSelectedTemplateInstances(): void;
  detachSelectedTemplateInstances(): void;
  copySelectedObjectsToClipboard(): void;
  cutSelectedObjectsToClipboard(): void;
  pasteClipboardToActiveObjectLayer(): void;
  removeSelectedObjects(): void;
  exportTiledWorldDocument(worldId: string): string | undefined;
  exportTxTemplateDocument(templateId: string): string | undefined;
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
  moveWorldMap(worldId: string, fileName: string, x: number, y: number): void;
  runManualAutomapping(): void;
  undo(): void;
  redo(): void;
  toggleIssuesPanel(): void;
  closeIssuesPanel(): void;
  clearIssues(): void;
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

interface ImportedAutomappingRuleMapDocument {
  map: EditorMap;
  tilesetReferences: Array<{
    firstGid: number;
    source?: string;
    name?: string;
    tileCount?: number;
  }>;
  issues: Array<{
    severity: "warning";
    code: string;
    message: string;
    path: string;
  }>;
}

interface TargetMapTilesetBinding {
  tilesetId: TilesetId;
  sourcePath?: string;
  name: string;
}

function createTileKey(x: number, y: number): string {
  return `${x}:${y}`;
}

function normalizeProjectAssetPath(path: string): string {
  return path.replaceAll("\\", "/").trim().replace(/^\.\/+/, "");
}

function basename(path: string): string {
  const normalizedPath = normalizeProjectAssetPath(path);
  return normalizedPath.split("/").at(-1) ?? normalizedPath;
}

function replacePathExtension(path: string, extension: string): string {
  const normalizedPath = normalizeProjectAssetPath(path);
  const dotIndex = normalizedPath.lastIndexOf(".");

  if (dotIndex < 0) {
    return `${normalizedPath}${extension}`;
  }

  return `${normalizedPath.slice(0, dotIndex)}${extension}`;
}

function ensureTemplateExtension(path: string): string {
  return path.toLowerCase().endsWith(".tx") ? path : `${path}.tx`;
}

function slugifyPathSegment(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "template";
}

function relativeProjectPath(fromPath: string, toPath: string): string {
  const fromSegments = normalizeProjectAssetPath(fromPath)
    .split("/")
    .filter((segment) => segment.length > 0)
    .slice(0, -1);
  const toSegments = normalizeProjectAssetPath(toPath)
    .split("/")
    .filter((segment) => segment.length > 0);
  let sharedLength = 0;

  while (
    sharedLength < fromSegments.length &&
    sharedLength < toSegments.length &&
    fromSegments[sharedLength] === toSegments[sharedLength]
  ) {
    sharedLength += 1;
  }

  const upwardSegments = fromSegments.slice(sharedLength).map(() => "..");
  const downwardSegments = toSegments.slice(sharedLength);
  const relativeSegments = [...upwardSegments, ...downwardSegments];

  return relativeSegments.length > 0 ? relativeSegments.join("/") : ".";
}

function dirname(path: string): string {
  const normalizedPath = normalizeProjectAssetPath(path);
  const segments = normalizedPath.split("/").filter((segment) => segment.length > 0);

  if (segments.length <= 1) {
    return "";
  }

  return segments.slice(0, -1).join("/");
}

function lowerCaseExtension(path: string): string {
  const normalizedPath = basename(path);
  const extensionIndex = normalizedPath.lastIndexOf(".");

  if (extensionIndex < 0) {
    return "";
  }

  return normalizedPath.slice(extensionIndex).toLowerCase();
}

function mapLayerTree(
  layers: readonly LayerDefinition[],
  mapper: (layer: LayerDefinition) => LayerDefinition
): LayerDefinition[] {
  return layers.map((layer) => {
    if (layer.kind !== "group") {
      return mapper(layer);
    }

    return mapper({
      ...layer,
      layers: mapLayerTree(layer.layers, mapper)
    });
  });
}

function getMapPixelSize(map: EditorMap): { width: number; height: number } {
  return {
    width: Math.max(0, map.settings.width * map.settings.tileWidth),
    height: Math.max(0, map.settings.height * map.settings.tileHeight)
  };
}

function rectsIntersect(
  left: { x: number; y: number; width: number; height: number },
  right: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    left.x < right.x + right.width &&
    left.x + left.width > right.x &&
    left.y < right.y + right.height &&
    left.y + left.height > right.y
  );
}

interface ResolvedWorldMapEntry {
  fileName: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  derived: boolean;
}

function resolveWorldPatternEntry(
  fileName: string,
  worldDirectory: string | undefined,
  world: EditorWorld
): ResolvedWorldMapEntry | undefined {
  const normalizedFileName = normalizeProjectAssetPath(fileName);

  if (worldDirectory !== undefined && dirname(normalizedFileName) !== worldDirectory) {
    return undefined;
  }

  const baseFileName = basename(normalizedFileName);

  for (const pattern of world.patterns) {
    const match = new RegExp(pattern.regexp).exec(baseFileName);

    if (!match) {
      continue;
    }

    const x = Number.parseInt(match[1] ?? "", 10);
    const y = Number.parseInt(match[2] ?? "", 10);

    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      continue;
    }

    return {
      fileName: normalizedFileName,
      x: x * pattern.multiplierX + pattern.offsetX,
      y: y * pattern.multiplierY + pattern.offsetY,
      width: pattern.mapWidth,
      height: pattern.mapHeight,
      derived: true
    };
  }

  return undefined;
}

function resolveWorldMapEntry(
  world: EditorWorld,
  fileName: string,
  worldDirectory: string | undefined
): ResolvedWorldMapEntry | undefined {
  const normalizedFileName = normalizeProjectAssetPath(fileName);
  const explicitEntry = world.maps.find(
    (map) => normalizeProjectAssetPath(map.fileName) === normalizedFileName
  );

  if (explicitEntry) {
    return {
      fileName: normalizedFileName,
      x: explicitEntry.x,
      y: explicitEntry.y,
      ...(explicitEntry.width !== undefined ? { width: explicitEntry.width } : {}),
      ...(explicitEntry.height !== undefined ? { height: explicitEntry.height } : {}),
      derived: false
    };
  }

  return resolveWorldPatternEntry(normalizedFileName, worldDirectory, world);
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

function deriveIssueSourceKind(code: string): EditorIssueSourceKind {
  const prefix = code.split(".", 1)[0];

  if (
    prefix === "automapping" ||
    prefix === "project" ||
    prefix === "world" ||
    prefix === "tmj" ||
    prefix === "tsj" ||
    prefix === "tmx" ||
    prefix === "tsx" ||
    prefix === "tx"
  ) {
    return prefix;
  }

  return "validation";
}

interface NativeDocumentSaveTarget {
  id: string;
  kind: DocumentSummary["kind"];
  name: string;
  path: string;
}

type NativeDocumentSaveDraft = Omit<NativeDocumentSaveTarget, "path">;

interface NativeDocumentSerializationContext {
  pathsByDocumentKey: Map<string, string>;
}

function createDocumentKey(
  kind: DocumentSummary["kind"],
  documentId: string
): string {
  return `${kind}:${documentId}`;
}

class InMemoryEditorController implements EditorController {
  private readonly history: CommandHistory<EditorWorkspaceState>;
  private readonly naming: EditorNamingConfig;
  private readonly documents: DocumentRepository | undefined;
  private readonly exports: ExportJobGateway | undefined;
  private readonly resolveProjectTextAsset: ProjectTextAssetResolver | undefined;
  private readonly listeners = new Set<() => void>();
  private projectAssets: ProjectAssetSummary[];
  private canvasStroke: CanvasStrokeState | undefined;
  private runtime = createEditorRuntimeState();
  private cachedSnapshot: EditorRuntimeSnapshot | undefined;

  constructor(
    initialState: EditorWorkspaceState,
    options: EditorControllerOptions = {}
  ) {
    this.history = new CommandHistory(initialState);
    this.naming = options.naming ?? defaultEditorNamingConfig;
    this.documents = options.documents;
    this.exports = options.exports;
    this.projectAssets = [...(options.projectAssets ?? [])];
    this.resolveProjectTextAsset = options.resolveProjectTextAsset;
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
    const activeTemplate = getActiveTemplate(workspace);
    const activeTileset = getActiveTileset(workspace);
    const worldContext = this.buildWorldContext(workspace, activeMap);

    this.cachedSnapshot = {
      bootstrap: toEditorBootstrap(workspace, this.projectAssets),
      workspace,
      runtime: this.runtime,
      canUndo: this.history.canUndo,
      canRedo: this.history.canRedo,
      canSaveActiveDocument:
        this.documents !== undefined && workspace.maps.length > 0,
      canSaveAllDocuments:
        this.documents !== undefined &&
        (workspace.maps.length > 0 ||
          workspace.tilesets.length > 0 ||
          workspace.templates.length > 0 ||
          workspace.worlds.length > 0),
      canExportActiveDocument:
        (this.documents !== undefined || this.exports !== undefined) &&
        activeMap !== undefined,
      canExportActiveTilesetDocument:
        (this.documents !== undefined || this.exports !== undefined) &&
        activeTileset !== undefined,
      canExportActiveMapImage:
        (this.documents !== undefined || this.exports !== undefined) &&
        activeMap !== undefined,
      ...(activeMap ? { activeMap } : {}),
      ...(activeLayer ? { activeLayer } : {}),
      ...(activeTemplate ? { activeTemplate } : {}),
      ...(activeTileset ? { activeTileset } : {}),
      ...(worldContext ? { worldContext } : {})
    };

    return this.cachedSnapshot;
  }

  replaceProjectAssets(projectAssets: ProjectAssetSummary[]): void {
    this.projectAssets = [...projectAssets];
    this.emit();
  }

  updateProjectDetails(input: UpdateProjectDetailsInput): void {
    this.commit(updateProjectDetailsCommand(input));
  }

  replaceProjectPropertyTypes(propertyTypes: PropertyTypeDefinition[]): void {
    this.commit(replaceProjectPropertyTypesCommand(propertyTypes));
  }

  private createProjectAssetSummary(input: {
    kind: ProjectAssetSummary["kind"];
    path: string;
    documentId?: string;
  }): ProjectAssetSummary {
    const normalizedPath = normalizeProjectAssetPath(input.path);

    return {
      id: `${input.kind}:${normalizedPath}`,
      kind: input.kind,
      name: basename(normalizedPath),
      path: normalizedPath,
      ...(input.documentId !== undefined ? { documentId: input.documentId } : {})
    };
  }

  private upsertProjectAsset(asset: ProjectAssetSummary): void {
    const normalizedPath = normalizeProjectAssetPath(asset.path);
    const existingIndex = this.projectAssets.findIndex(
      (entry) =>
        entry.kind === asset.kind &&
        normalizeProjectAssetPath(entry.path) === normalizedPath
    );

    if (existingIndex >= 0) {
      this.projectAssets = this.projectAssets.map((entry, index) =>
        index === existingIndex ? asset : entry
      );
      return;
    }

    this.projectAssets = [...this.projectAssets, asset];
  }

  private getProjectAssetByDocumentId(
    kind: ProjectAssetSummary["kind"],
    documentId: string
  ): ProjectAssetSummary | undefined {
    return this.projectAssets.find(
      (asset) => asset.kind === kind && asset.documentId === documentId
    );
  }

  private getProjectAssetByPath(
    kind: ProjectAssetSummary["kind"],
    path: string
  ): ProjectAssetSummary | undefined {
    const normalizedPath = normalizeProjectAssetPath(path);

    return this.projectAssets.find(
      (asset) =>
        asset.kind === kind &&
        normalizeProjectAssetPath(asset.path) === normalizedPath
    );
  }

  private getPreferredAssetRoot(preferredRoot: string): string {
    const matchedRoot = this.history.state.project.assetRoots.find(
      (assetRoot) => normalizeProjectAssetPath(assetRoot) === preferredRoot
    );

    return normalizeProjectAssetPath(matchedRoot ?? preferredRoot);
  }

  private createUniqueDocumentPath(
    kind: DocumentSummary["kind"],
    name: string,
    reservedPaths: Set<string>
  ): string {
    let preferredPath = "";

    switch (kind) {
      case "map":
        preferredPath = `${this.getPreferredAssetRoot("maps")}/${slugifyPathSegment(name)}.tmx`;
        break;
      case "tileset":
        preferredPath = `${this.getPreferredAssetRoot("tilesets")}/${slugifyPathSegment(name)}.tsx`;
        break;
      case "template":
        preferredPath = `${this.getPreferredAssetRoot("templates")}/${slugifyPathSegment(name)}.tx`;
        break;
      case "world":
        preferredPath = `${slugifyPathSegment(name)}.world`;
        break;
    }

    let candidatePath = preferredPath;
    let suffix = 2;

    while (reservedPaths.has(candidatePath)) {
      const extensionIndex = preferredPath.lastIndexOf(".");
      const stem =
        extensionIndex >= 0 ? preferredPath.slice(0, extensionIndex) : preferredPath;
      const extension = extensionIndex >= 0 ? preferredPath.slice(extensionIndex) : "";
      candidatePath = `${stem}-${suffix}${extension}`;
      suffix += 1;
    }

    reservedPaths.add(candidatePath);
    return candidatePath;
  }

  private collectNativeDocumentSaveTargets(): NativeDocumentSaveDraft[] {
    const state = this.history.state;

    return [
      ...state.maps.map((map) => ({
        id: map.id,
        kind: "map" as const,
        name: map.name
      })),
      ...state.tilesets.map((tileset) => ({
        id: tileset.id,
        kind: "tileset" as const,
        name: tileset.name
      })),
      ...state.templates.map((template) => ({
        id: template.id,
        kind: "template" as const,
        name: template.name
      })),
      ...state.worlds.map((world) => ({
        id: world.id,
        kind: "world" as const,
        name: world.name
      }))
    ];
  }

  private buildNativeSaveTargets(
    documentIds?: readonly string[]
  ): NativeDocumentSaveTarget[] {
    const reservedPaths = new Set(
      this.projectAssets
        .filter((asset) =>
          asset.kind === "map" ||
          asset.kind === "tileset" ||
          asset.kind === "template" ||
          asset.kind === "world"
        )
        .map((asset) => normalizeProjectAssetPath(asset.path))
    );

    return this.collectNativeDocumentSaveTargets()
      .filter((target) => documentIds === undefined || documentIds.includes(target.id))
      .map((target) => {
        const asset = this.getProjectAssetByDocumentId(target.kind, target.id);
        const path =
          asset !== undefined
            ? normalizeProjectAssetPath(asset.path)
            : this.createUniqueDocumentPath(target.kind, target.name, reservedPaths);

        reservedPaths.add(path);

        return {
          ...target,
          path
        };
      });
  }

  private buildNativeDocumentSerializationContext(
    targets: readonly NativeDocumentSaveTarget[]
  ): NativeDocumentSerializationContext {
    return {
      pathsByDocumentKey: new Map(
        targets.map((target) => [createDocumentKey(target.kind, target.id), target.path])
      )
    };
  }

  private createJsonExportTarget(
    kind: Extract<DocumentSummary["kind"], "map" | "tileset">,
    documentId: string
  ): NativeDocumentSaveTarget | undefined {
    const nativeTarget = this.buildNativeSaveTargets([documentId])[0];

    if (!nativeTarget || nativeTarget.kind !== kind) {
      return undefined;
    }

    return {
      ...nativeTarget,
      path:
        kind === "map"
          ? replacePathExtension(nativeTarget.path, ".tmj")
          : replacePathExtension(nativeTarget.path, ".tsj")
    };
  }

  private createActiveMapImageExportTarget(): NativeDocumentSaveTarget | undefined {
    const activeMap = getActiveMap(this.history.state);

    if (!activeMap) {
      return undefined;
    }

    const nativeTarget = this.buildNativeSaveTargets([activeMap.id])[0];

    if (!nativeTarget || nativeTarget.kind !== "map") {
      return undefined;
    }

    return {
      ...nativeTarget,
      path: replacePathExtension(nativeTarget.path, ".png")
    };
  }

  private buildJsonExportSerializationContext(
    targets: readonly NativeDocumentSaveTarget[]
  ): NativeDocumentSerializationContext {
    const exportPathsByDocumentKey = new Map<string, string>();

    for (const target of this.collectNativeDocumentSaveTargets()) {
      if (target.kind === "map") {
        exportPathsByDocumentKey.set(
          createDocumentKey("map", target.id),
          this.createJsonExportTarget("map", target.id)?.path ??
            replacePathExtension(
              `${this.getPreferredAssetRoot("maps")}/${slugifyPathSegment(target.name)}.tmx`,
              ".tmj"
            )
        );
        continue;
      }

      if (target.kind === "tileset") {
        exportPathsByDocumentKey.set(
          createDocumentKey("tileset", target.id),
          this.createJsonExportTarget("tileset", target.id)?.path ??
            replacePathExtension(
              `${this.getPreferredAssetRoot("tilesets")}/${slugifyPathSegment(target.name)}.tsx`,
              ".tsj"
            )
        );
        continue;
      }
    }

    for (const target of targets) {
      exportPathsByDocumentKey.set(createDocumentKey(target.kind, target.id), target.path);
    }

    return {
      pathsByDocumentKey: exportPathsByDocumentKey
    };
  }

  private buildMapTilesetReferences(
    map: EditorMap,
    mapPath: string,
    context: NativeDocumentSerializationContext,
    options: {
      embedTilesets: boolean;
    }
  ): ImportedTmjTilesetReference[] {
    let firstGid = 1;
    const references: ImportedTmjTilesetReference[] = [];

    for (const tilesetId of map.tilesetIds) {
      const tileset = this.history.state.tilesets.find((entry) => entry.id === tilesetId);

      if (!tileset) {
        continue;
      }

      const tilesetPath = context.pathsByDocumentKey.get(
        createDocumentKey("tileset", tileset.id)
      );

      if (options.embedTilesets) {
        references.push({
          firstGid,
          name: tileset.name,
          tileCount: getTilesetTileCount(tileset),
          ...(tileset.kind === "image" && tileset.source?.imagePath !== undefined
            ? { image: tileset.source.imagePath }
            : {})
        });
      } else {
        if (!tilesetPath) {
          throw new Error(`Missing save path for tileset ${tileset.name}`);
        }

        references.push({
          firstGid,
          source: relativeProjectPath(mapPath, tilesetPath)
        });
      }

      firstGid += getTilesetTileCount(tileset);
    }

    return references;
  }

  private serializeNativeDocument(
    target: NativeDocumentSaveTarget,
    context: NativeDocumentSerializationContext
  ): SavedEditorDocument {
    switch (target.kind) {
      case "map": {
        const map = this.history.state.maps.find((entry) => entry.id === target.id);
        const exportOptions = this.history.state.project.exportOptions;

        if (!map) {
          throw new Error(`Map ${target.id} not found`);
        }

        const extension = lowerCaseExtension(target.path);
        const tilesetReferences = this.buildMapTilesetReferences(map, target.path, context, {
          embedTilesets: exportOptions.embedTilesets
        });
        const content =
          extension === ".tmj" || extension === ".json"
            ? exportTmjMapDocumentAdapter({
                map,
                tilesetReferences,
                minimized: exportOptions.exportMinimized,
                resolveObjectTypesAndProperties:
                  exportOptions.resolveObjectTypesAndProperties
              })
            : exportTmxMapDocumentAdapter({
                map,
                tilesetReferences,
                resolveObjectTypesAndProperties:
                  exportOptions.resolveObjectTypesAndProperties
              });

        return {
          id: target.id,
          kind: target.kind,
          name: target.name,
          path: target.path,
          content,
          contentType:
            extension === ".tmj" || extension === ".json"
              ? "application/json; charset=utf-8"
              : "application/xml; charset=utf-8"
        };
      }
      case "tileset": {
        const tileset = this.history.state.tilesets.find((entry) => entry.id === target.id);
        const exportOptions = this.history.state.project.exportOptions;

        if (!tileset) {
          throw new Error(`Tileset ${target.id} not found`);
        }

        const extension = lowerCaseExtension(target.path);
        const content =
          extension === ".tsj" || extension === ".json"
            ? exportTsjTilesetDocumentAdapter({
                tileset,
                minimized: exportOptions.exportMinimized,
                resolveObjectTypesAndProperties:
                  exportOptions.resolveObjectTypesAndProperties
              })
            : exportTsxTilesetDocumentAdapter({
                tileset,
                resolveObjectTypesAndProperties:
                  exportOptions.resolveObjectTypesAndProperties
              });

        return {
          id: target.id,
          kind: target.kind,
          name: target.name,
          path: target.path,
          content,
          contentType:
            extension === ".tsj" || extension === ".json"
              ? "application/json; charset=utf-8"
              : "application/xml; charset=utf-8"
        };
      }
      case "template": {
        const template = this.history.state.templates.find((entry) => entry.id === target.id);
        const exportOptions = this.history.state.project.exportOptions;

        if (!template) {
          throw new Error(`Template ${target.id} not found`);
        }

        const tilesetId =
          template.object.shape === "tile" && template.object.tile
            ? template.object.tile.tilesetId ?? template.tilesetIds[0]
            : undefined;
        const tilesetPath =
          tilesetId !== undefined
            ? context.pathsByDocumentKey.get(createDocumentKey("tileset", tilesetId))
            : undefined;
        const tilesetSource =
          tilesetPath !== undefined ? relativeProjectPath(target.path, tilesetPath) : undefined;

        return {
          id: target.id,
          kind: target.kind,
          name: target.name,
          path: target.path,
          content: exportTxTemplateDocumentAdapter({
            template,
            resolveObjectTypesAndProperties:
              exportOptions.resolveObjectTypesAndProperties,
            ...(tilesetSource !== undefined ? { tilesetSource } : {})
          }),
          contentType: "application/xml; charset=utf-8"
        };
      }
      case "world": {
        const world = this.history.state.worlds.find((entry) => entry.id === target.id);
        const exportOptions = this.history.state.project.exportOptions;

        if (!world) {
          throw new Error(`World ${target.id} not found`);
        }

        return {
          id: target.id,
          kind: target.kind,
          name: target.name,
          path: target.path,
          content: exportTiledWorldDocumentAdapter({
            world,
            documentPath: target.path,
            minimized: exportOptions.exportMinimized,
            resolveObjectTypesAndProperties:
              exportOptions.resolveObjectTypesAndProperties
          }),
          contentType: "application/json; charset=utf-8"
        };
      }
    }
  }

  private createSaveIssueEntry(
    target: NativeDocumentSaveTarget,
    error: unknown
  ): EditorIssueEntry {
    const message =
      error instanceof Error ? error.message : "Failed to save document.";

    return {
      id: `save:${target.id}:${target.path}`,
      sourceId: `save:${target.id}`,
      sourceKind: "validation",
      documentName: target.name,
      documentPath: target.path,
      severity: "error",
      code: "save.document.failed",
      message,
      path: target.path
    };
  }

  private createExportIssueEntry(
    target: NativeDocumentSaveTarget,
    error: unknown
  ): EditorIssueEntry {
    const message =
      error instanceof Error ? error.message : "Failed to export document.";

    return {
      id: `export:${target.id}:${target.path}`,
      sourceId: `export:${target.id}`,
      sourceKind: "validation",
      documentName: target.name,
      documentPath: target.path,
      severity: "error",
      code: "export.document.failed",
      message,
      path: target.path
    };
  }

  private async persistNativeDocument(
    target: NativeDocumentSaveTarget,
    context: NativeDocumentSerializationContext
  ): Promise<boolean> {
    if (!this.documents) {
      return false;
    }

    try {
      const serializedDocument = this.serializeNativeDocument(target, context);
      await this.documents.saveDocument(serializedDocument);
      this.upsertProjectAsset(
        this.createProjectAssetSummary({
          kind: target.kind,
          path: target.path,
          documentId: target.id
        })
      );
      this.replaceIssueSourceEntries(`save:${target.id}`, []);
      return true;
    } catch (error) {
      this.replaceIssueSourceEntries(`save:${target.id}`, [
        this.createSaveIssueEntry(target, error)
      ]);
      return false;
    }
  }

  private async persistJsonExport(
    target: NativeDocumentSaveTarget,
    context: NativeDocumentSerializationContext
  ): Promise<boolean> {
    if (!this.documents && !this.exports) {
      return false;
    }

    try {
      const serializedDocument = this.serializeNativeDocument(target, context);

      if (this.exports) {
        await this.exports.queueDocumentExport(serializedDocument);
      } else if (this.documents) {
        await this.documents.saveDocument(serializedDocument);
      }

      this.replaceIssueSourceEntries(`export:${target.id}`, []);
      return true;
    } catch (error) {
      this.replaceIssueSourceEntries(`export:${target.id}`, [
        this.createExportIssueEntry(target, error)
      ]);
      return false;
    }
  }

  private buildWorldContext(
    state: EditorWorkspaceState,
    activeMap: EditorMap | undefined
  ): EditorWorldContextSnapshot | undefined {
    if (!activeMap) {
      return undefined;
    }

    const activeMapAsset = this.getProjectAssetByDocumentId("map", activeMap.id);

    if (!activeMapAsset) {
      return undefined;
    }

    const activeMapPath = normalizeProjectAssetPath(activeMapAsset.path);
    const activeMapSize = getMapPixelSize(activeMap);

    for (const world of state.worlds) {
      const worldAssetPath = this.getProjectAssetByDocumentId("world", world.id)?.path;
      const worldDirectory =
        worldAssetPath !== undefined ? dirname(worldAssetPath) : undefined;
      const activeEntry = resolveWorldMapEntry(world, activeMapPath, worldDirectory);

      if (!activeEntry) {
        continue;
      }

      const activeMapRect = {
        x: activeEntry.x,
        y: activeEntry.y,
        width: activeEntry.width ?? activeMapSize.width,
        height: activeEntry.height ?? activeMapSize.height
      };
      const visibleRect = world.onlyShowAdjacentMaps
        ? {
            x: activeMapRect.x - 1,
            y: activeMapRect.y - 1,
            width: activeMapRect.width + 2,
            height: activeMapRect.height + 2
          }
        : activeMapRect;
      const entriesByPath = new Map<string, EditorWorldContextMapSnapshot>();

      for (const asset of this.projectAssets) {
        if (asset.kind !== "map") {
          continue;
        }

        const normalizedMapPath = normalizeProjectAssetPath(asset.path);
        const resolvedEntry = resolveWorldMapEntry(world, normalizedMapPath, worldDirectory);

        if (!resolvedEntry) {
          continue;
        }

        const mappedDocument =
          asset.documentId !== undefined
            ? state.maps.find((map) => map.id === asset.documentId)
            : undefined;
        const mapSize = mappedDocument ? getMapPixelSize(mappedDocument) : undefined;
        const width = resolvedEntry.width ?? mapSize?.width ?? 0;
        const height = resolvedEntry.height ?? mapSize?.height ?? 0;

        if (
          world.onlyShowAdjacentMaps &&
          !rectsIntersect(
            visibleRect,
            {
              x: resolvedEntry.x,
              y: resolvedEntry.y,
              width,
              height
            }
          )
        ) {
          continue;
        }

        entriesByPath.set(normalizedMapPath, {
          worldId: world.id,
          ...(asset.documentId !== undefined ? { mapId: asset.documentId as EditorMap["id"] } : {}),
          fileName: normalizedMapPath,
          name: mappedDocument?.name ?? asset.name,
          x: resolvedEntry.x,
          y: resolvedEntry.y,
          width,
          height,
          active: normalizedMapPath === activeMapPath,
          loaded: mappedDocument !== undefined,
          canActivate: mappedDocument !== undefined && normalizedMapPath !== activeMapPath,
          ...(mappedDocument !== undefined
            ? {
                gridWidth: mappedDocument.settings.tileWidth,
                gridHeight: mappedDocument.settings.tileHeight
              }
            : {})
        });
      }

      if (!entriesByPath.has(activeMapPath)) {
        entriesByPath.set(activeMapPath, {
          worldId: world.id,
          mapId: activeMap.id,
          fileName: activeMapPath,
          name: activeMap.name,
          x: activeMapRect.x,
          y: activeMapRect.y,
          width: activeMapRect.width,
          height: activeMapRect.height,
          active: true,
          loaded: true,
          canActivate: false,
          gridWidth: activeMap.settings.tileWidth,
          gridHeight: activeMap.settings.tileHeight
        });
      }

      return {
        worldId: world.id,
        worldName: world.name,
        modifiable: world.patterns.length === 0,
        activeMapFileName: activeMapPath,
        activeMapRect,
        maps: [...entriesByPath.values()]
      };
    }

    return undefined;
  }

  private createUniqueTemplatePath(name: string, explicitPath?: string): string {
    const templateRoot =
      this.history.state.project.assetRoots.find((assetRoot) =>
        normalizeProjectAssetPath(assetRoot) === "templates"
      ) ?? "templates";
    const normalizedTemplateRoot = normalizeProjectAssetPath(templateRoot);
    const explicitTemplatePath = explicitPath?.trim()
      ? ensureTemplateExtension(normalizeProjectAssetPath(explicitPath))
      : undefined;
    const preferredPath = explicitTemplatePath
      ? explicitTemplatePath.includes("/")
        ? explicitTemplatePath
        : `${normalizedTemplateRoot}/${explicitTemplatePath}`
      : `${normalizedTemplateRoot}/${slugifyPathSegment(name)}.tx`;
    let candidatePath = preferredPath;
    let suffix = 2;
    const existingPaths = new Set(
      this.projectAssets
        .filter((asset) => asset.kind === "template")
        .map((asset) => normalizeProjectAssetPath(asset.path))
    );

    while (existingPaths.has(candidatePath)) {
      const extensionIndex = preferredPath.toLowerCase().lastIndexOf(".tx");
      const stem =
        extensionIndex >= 0 ? preferredPath.slice(0, extensionIndex) : preferredPath;
      candidatePath = `${stem}-${suffix}.tx`;
      suffix += 1;
    }

    return candidatePath;
  }

  private resolveImportOptions(
    options: ExternalDocumentImportOptions | undefined
  ): ExternalDocumentImportOptions {
    if (!options) {
      return {};
    }

    return {
      ...(options?.documentPath !== undefined
        ? { documentPath: options.documentPath }
        : {}),
      ...((options.documentPath !== undefined || options.assetRoots !== undefined)
        ? {
            assetRoots:
              options.assetRoots ?? this.history.state.project.assetRoots
          }
        : {})
    };
  }

  private resolveProjectImportOptions(
    options: ExternalDocumentImportOptions | undefined
  ): { documentPath?: string } {
    if (!options || options.documentPath === undefined) {
      return {};
    }

    return {
      documentPath: options.documentPath
    };
  }

  private recordImportIssues(
    sourceId: string,
    documentName: string,
    documentPath: string | undefined,
    issues: ReadonlyArray<{
      severity: "warning";
      code: string;
      message: string;
      path: string;
    }>
  ): void {
    this.replaceIssueSourceEntries(
      sourceId,
      issues.map((issue) =>
        this.createIssueEntry(sourceId, documentName, documentPath, issue)
      )
    );
  }

  private createIssueEntry(
    sourceId: string,
    documentName: string,
    documentPath: string | undefined,
    issue: {
      severity: "warning" | "error";
      code: string;
      message: string;
      path: string;
    }
  ): EditorIssueEntry {
    return {
      id: `${sourceId}:${documentName}:${issue.code}:${issue.path}`,
      sourceId,
      sourceKind: deriveIssueSourceKind(issue.code),
      documentName,
      severity: issue.severity,
      code: issue.code,
      message: issue.message,
      path: issue.path,
      ...(documentPath !== undefined ? { documentPath } : {})
    };
  }

  private replaceIssueSourceEntries(
    sourceId: string,
    entries: readonly EditorIssueEntry[]
  ): void {
    this.runtime = replaceEditorRuntimeIssueSourceEntries(this.runtime, sourceId, entries);

    if (entries.length > 0) {
      this.runtime = setEditorRuntimeIssuePanelOpen(this.runtime, true);
    }
  }

  private loadProjectTextAsset(path: string): string | undefined {
    const normalizedPath = normalizeProjectAssetPath(path);

    return this.resolveProjectTextAsset?.(normalizedPath);
  }

  private importAutomappingRuleMapDocument(
    documentPath: string,
    source: string
  ): ImportedAutomappingRuleMapDocument | undefined {
    const normalizedDocumentPath = normalizeProjectAssetPath(documentPath);
    const resolvedOptions = this.resolveImportOptions({
      documentPath: normalizedDocumentPath
    });
    const extension = lowerCaseExtension(normalizedDocumentPath);

    if (extension === ".tmj" || extension === ".json") {
      const imported = importTmjMapDocumentAdapter(source, resolvedOptions);
      return {
        map: imported.map,
        tilesetReferences: imported.tilesetReferences,
        issues: imported.issues
      };
    }

    if (extension === ".tmx") {
      const imported = importTmxMapDocumentAdapter(source, resolvedOptions);
      return {
        map: imported.map,
        tilesetReferences: imported.tilesetReferences,
        issues: imported.issues
      };
    }

    return undefined;
  }

  private getTargetMapTilesetBindings(
    map: EditorMap,
    availableTilesets: TilesetDefinition[]
  ): TargetMapTilesetBinding[] {
    return map.tilesetIds
      .map((tilesetId) => {
        const tileset = availableTilesets.find((entry) => entry.id === tilesetId);

        if (!tileset) {
          return undefined;
        }

        const tilesetAsset = this.getProjectAssetByDocumentId("tileset", tileset.id);

        return {
          tilesetId: tileset.id,
          name: tileset.name,
          ...(tilesetAsset?.path !== undefined
            ? { sourcePath: normalizeProjectAssetPath(tilesetAsset.path) }
            : {})
        };
      })
      .filter((binding): binding is TargetMapTilesetBinding => binding !== undefined);
  }

  private normalizeAutomappingRuleMap(
    ruleMap: EditorMap,
    tilesetReferences: ImportedAutomappingRuleMapDocument["tilesetReferences"],
    targetMap: EditorMap,
    documentPath: string,
    availableTilesets: TilesetDefinition[],
    assetRoots: readonly string[]
  ): {
    map: EditorMap;
    issues: AutomappingEngineIssue[];
  } {
    const issues: AutomappingEngineIssue[] = [];
    const targetBindings = this.getTargetMapTilesetBindings(targetMap, availableTilesets);
    const seenUnresolvedKeys = new Set<string>();

    const resolveRuleCellGid = (gid: number | null): number | null => {
      if (gid === null) {
        return null;
      }

      const tilesetReference = [...tilesetReferences]
        .sort((left, right) => right.firstGid - left.firstGid)
        .find((reference) => gid >= reference.firstGid);

      if (!tilesetReference) {
        return null;
      }

      const localId = gid - tilesetReference.firstGid;
      const resolvedSourcePath =
        tilesetReference.source !== undefined
          ? resolveAssetPath(tilesetReference.source, {
              documentPath: documentPath,
              assetRoots
            }).resolvedPath
          : undefined;
      const candidateBindings =
        resolvedSourcePath !== undefined
          ? targetBindings.filter((binding) => binding.sourcePath === resolvedSourcePath)
          : targetBindings.filter((binding) => binding.name === tilesetReference.name);
      const targetBinding =
        candidateBindings.length === 1 ? candidateBindings[0] : undefined;
      const key = `${resolvedSourcePath ?? tilesetReference.name ?? "unknown"}:${localId}`;

      if (!targetBinding) {
        if (!seenUnresolvedKeys.has(key)) {
          seenUnresolvedKeys.add(key);
          issues.push({
            severity: "warning",
            code: "automapping.ruleMap.tileset.unresolved",
            message:
              resolvedSourcePath !== undefined
                ? `Automapping rule tile source \`${resolvedSourcePath}\` is not attached to the active map.`
                : `Automapping rule tile source \`${tilesetReference.name ?? "unknown"}\` could not be matched to a unique active-map tileset.`,
            path: "ruleMap.tilesets"
          });
        }

        return null;
      }

      const nextGid = getMapGlobalTileGid(
        targetMap,
        availableTilesets,
        targetBinding.tilesetId,
        localId
      );

      if (nextGid === undefined) {
        if (!seenUnresolvedKeys.has(key)) {
          seenUnresolvedKeys.add(key);
          issues.push({
            severity: "warning",
            code: "automapping.ruleMap.tile.unresolved",
            message: `Automapping rule tile local id ${localId} could not be resolved on active-map tileset \`${targetBinding.name}\`.`,
            path: "ruleMap.tilesets"
          });
        }

        return null;
      }

      return nextGid;
    };

    return {
      map: {
        ...ruleMap,
        layers: mapLayerTree(ruleMap.layers, (layer) => {
          if (layer.kind !== "tile") {
            return layer;
          }

          return {
            ...layer,
            cells: layer.cells.map((cell) => ({
              ...cell,
              gid: resolveRuleCellGid(cell.gid)
            })),
            chunks: layer.chunks.map((chunk) => ({
              ...chunk,
              cells: chunk.cells.map((cell) => ({
                ...cell,
                gid: resolveRuleCellGid(cell.gid)
              }))
            }))
          };
        })
      },
      issues
    };
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

  private normalizeTemplateObjectForStorage(
    object: MapObject,
    options: {
      activeMap?: EditorMap;
      tilesetId?: TilesetId;
      tileId?: number;
    } = {}
  ): { object: MapObject; tilesetIds: TilesetId[] } {
    if (object.shape !== "tile" || !object.tile) {
      return {
        object: cloneMapObject(object),
        tilesetIds: []
      };
    }

    let tilesetId = options.tilesetId ?? object.tile.tilesetId;
    let tileId = options.tileId ?? object.tile.tileId;

    if ((tilesetId === undefined || tileId === undefined) && options.activeMap && object.tile.gid) {
      const resolved = resolveMapTileGid(
        options.activeMap,
        this.history.state.tilesets,
        object.tile.gid
      );

      if (resolved) {
        tilesetId = resolved.tileset.id;
        tileId = resolved.localId;
      }
    }

    const gid =
      tileId !== undefined
        ? tileId + 1
        : object.tile.gid;

    return {
      object: cloneMapObject(object, {
        tile: {
          ...(tilesetId !== undefined ? { tilesetId } : {}),
          ...(tileId !== undefined ? { tileId } : {}),
          ...(gid !== undefined ? { gid } : {})
        }
      }),
      tilesetIds: tilesetId !== undefined ? [tilesetId] : []
    };
  }

  private resolveImportedTemplateTileReference(
    imported: ImportedTxTemplateDocument
  ): { tilesetId: TilesetId; tileId: number } | undefined {
    if (imported.template.object.shape !== "tile" || !imported.template.object.tile?.gid) {
      return undefined;
    }

    const rawGid = imported.template.object.tile.gid;
    const indexedReferences = imported.tilesetReferences
      .map((reference, index) => ({
        index,
        reference
      }))
      .sort((left, right) => left.reference.firstGid - right.reference.firstGid);

    for (let index = 0; index < indexedReferences.length; index += 1) {
      const entry = indexedReferences[index]!;
      const nextEntry = indexedReferences[index + 1];
      const lastExclusiveGid = nextEntry?.reference.firstGid ?? Number.POSITIVE_INFINITY;

      if (rawGid < entry.reference.firstGid || rawGid >= lastExclusiveGid) {
        continue;
      }

      const assetReference = imported.assetReferences.find(
        (reference) =>
          reference.kind === "tileset" &&
          reference.ownerPath === `tx.tilesets[${entry.index}].source`
      );
      const tilesetId =
        assetReference !== undefined
          ? this.getProjectAssetByPath("tileset", assetReference.resolvedPath)?.documentId
          : undefined;

      if (!tilesetId) {
        continue;
      }

      return {
        tilesetId: tilesetId as TilesetId,
        tileId: rawGid - entry.reference.firstGid
      };
    }

    const firstAssetReference = imported.assetReferences.find(
      (reference) => reference.kind === "tileset"
    );
    const fallbackTilesetId =
      firstAssetReference !== undefined
        ? this.getProjectAssetByPath("tileset", firstAssetReference.resolvedPath)?.documentId
        : undefined;

    if (!fallbackTilesetId) {
      return undefined;
    }

    return {
      tilesetId: fallbackTilesetId as TilesetId,
      tileId: rawGid - 1
    };
  }

  private materializeTemplateObjectForMap(
    template: ObjectTemplate,
    map: EditorMap
  ): { templateObject: MapObject; attachTilesetId?: TilesetId } | undefined {
    if (template.object.shape !== "tile" || !template.object.tile) {
      return {
        templateObject: cloneMapObject(template.object)
      };
    }

    const tilesetId = template.object.tile.tilesetId ?? template.tilesetIds[0];
    const tileId =
      template.object.tile.tileId ??
      (template.object.tile.gid !== undefined ? template.object.tile.gid - 1 : undefined);

    if (tilesetId === undefined || tileId === undefined || tileId < 0) {
      return undefined;
    }

    const projectedMap = map.tilesetIds.includes(tilesetId)
      ? map
      : attachTilesetToMap(map, tilesetId);
    const gid = getMapGlobalTileGid(
      projectedMap,
      this.history.state.tilesets,
      tilesetId,
      tileId
    );

    if (gid === undefined) {
      return undefined;
    }

    return {
      templateObject: cloneMapObject(template.object, {
        tile: {
          ...template.object.tile,
          tilesetId,
          tileId,
          gid
        }
      }),
      ...(projectedMap === map ? {} : { attachTilesetId: tilesetId })
    };
  }

  private resolveSelectedTemplateInstances():
    | {
        activeMap: EditorMap;
        activeLayer: ObjectLayer;
        instances: Array<{ object: MapObject; template: ObjectTemplate }>;
      }
    | undefined {
    const resolved = this.resolveActiveObjectLayer();

    if (!resolved) {
      return undefined;
    }

    const selection = this.history.state.session.selection;

    if (!isObjectSelectionState(selection) || selection.objectIds.length === 0) {
      return undefined;
    }

    const instances = selection.objectIds.flatMap((objectId) => {
      const object = getObjectById(resolved.activeLayer, objectId);

      if (!object?.templateId) {
        return [];
      }

      const template = this.history.state.templates.find(
        (entry) => entry.id === object.templateId
      );

      return template ? [{ object, template }] : [];
    });

    if (instances.length === 0) {
      return undefined;
    }

    return {
      ...resolved,
      instances
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

    this.commitMapCommandWithAutomapping(
      paintTileFillCommand(
        activeMap.id,
        activeLayer.id,
        activeLayer,
        x,
        y,
        getActiveStampPrimaryGid(state) ?? 1
      ),
      activeMap.id
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

  importTiledProjectDocument(
    input: string | unknown,
    options?: ExternalDocumentImportOptions
  ): ImportedTiledProjectDocument {
    const resolvedOptions = this.resolveProjectImportOptions(options);
    const imported = importTiledProjectDocumentAdapter(input, resolvedOptions);

    this.recordImportIssues(
      imported.project.id,
      imported.project.name,
      resolvedOptions.documentPath,
      imported.issues
    );

    for (const assetReference of imported.assetReferences) {
      if (assetReference.kind !== "automapping-rules") {
        continue;
      }

      this.upsertProjectAsset(
        this.createProjectAssetSummary({
          kind: "file",
          path: assetReference.resolvedPath
        })
      );
    }

    this.commit(replaceProjectCommand(imported.project));

    return imported;
  }

  importTiledWorldDocument(
    input: string | unknown,
    options?: ExternalDocumentImportOptions
  ): ImportedTiledWorldDocument {
    const resolvedOptions = this.resolveImportOptions(options);
    const imported = importTiledWorldDocumentAdapter(input, resolvedOptions);

    this.recordImportIssues(
      imported.world.id,
      imported.world.name,
      resolvedOptions.documentPath,
      imported.issues
    );

    if (resolvedOptions.documentPath) {
      this.upsertProjectAsset(
        this.createProjectAssetSummary({
          kind: "world",
          path: resolvedOptions.documentPath,
          documentId: imported.world.id
        })
      );
    }

    this.commit(addImportedWorldCommand(imported.world));

    return imported;
  }

  importTmxMapDocument(
    input: string,
    options?: ExternalDocumentImportOptions
  ): ImportedTmxMapDocument {
    const resolvedOptions = this.resolveImportOptions(options);
    const imported = importTmxMapDocumentAdapter(
      input,
      resolvedOptions
    );

    this.recordImportIssues(
      imported.map.id,
      imported.map.name,
      resolvedOptions.documentPath,
      imported.issues
    );

    if (resolvedOptions.documentPath) {
      this.upsertProjectAsset(
        this.createProjectAssetSummary({
          kind: "map",
          path: resolvedOptions.documentPath,
          documentId: imported.map.id
        })
      );
    }

    this.commit(addImportedMapDocumentCommand(imported.map));

    return imported;
  }

  importTxTemplateDocument(
    input: string,
    options?: ExternalDocumentImportOptions
  ): ImportedTxTemplateDocument {
    const resolvedOptions = this.resolveImportOptions(options);
    const imported = importTxTemplateDocumentAdapter(input, resolvedOptions);
    const tilesetIds = imported.assetReferences
      .filter((reference) => reference.kind === "tileset")
      .map((reference) =>
        this.getProjectAssetByPath("tileset", reference.resolvedPath)?.documentId
      )
      .filter((tilesetId): tilesetId is string => tilesetId !== undefined);
    const importedTileReference = this.resolveImportedTemplateTileReference(imported);
    const normalizedTemplateObject = this.normalizeTemplateObjectForStorage(
      imported.template.object,
      {
        ...(importedTileReference !== undefined
          ? {
              tilesetId: importedTileReference.tilesetId,
              tileId: importedTileReference.tileId
            }
          : {})
      }
    );
    const normalizedTilesetIds = [...new Set([...tilesetIds, ...normalizedTemplateObject.tilesetIds])];
    const template: ObjectTemplate =
      normalizedTilesetIds.length > 0 || normalizedTemplateObject.object !== imported.template.object
        ? {
            ...imported.template,
            object: normalizedTemplateObject.object,
            tilesetIds: normalizedTilesetIds as ObjectTemplate["tilesetIds"]
          }
        : imported.template;

    this.recordImportIssues(
      template.id,
      template.name,
      resolvedOptions.documentPath,
      imported.issues
    );

    if (resolvedOptions.documentPath) {
      this.upsertProjectAsset(
        this.createProjectAssetSummary({
          kind: "template",
          path: resolvedOptions.documentPath,
          documentId: template.id
        })
      );
    }

    this.commit(addImportedTemplateCommand(template));

    return {
      ...imported,
      template
    };
  }

  importTsxTilesetDocument(
    input: string,
    options?: ExternalDocumentImportOptions
  ): ImportedTsxTilesetDocument {
    const resolvedOptions = this.resolveImportOptions(options);
    const imported = importTsxTilesetDocumentAdapter(
      input,
      resolvedOptions
    );
    const activeMap = getActiveMap(this.history.state);

    this.recordImportIssues(
      imported.tileset.id,
      imported.tileset.name,
      resolvedOptions.documentPath,
      imported.issues
    );

    if (resolvedOptions.documentPath) {
      this.upsertProjectAsset(
        this.createProjectAssetSummary({
          kind: "tileset",
          path: resolvedOptions.documentPath,
          documentId: imported.tileset.id
        })
      );
    }

    this.commit(
      addImportedTilesetCommand({
        tileset: imported.tileset,
        ...(activeMap ? { mapId: activeMap.id } : {})
      })
    );

    return imported;
  }

  importTmjMapDocument(
    input: string | unknown,
    options?: ExternalDocumentImportOptions
  ): ImportedTmjMapDocument {
    const resolvedOptions = this.resolveImportOptions(options);
    const imported = importTmjMapDocumentAdapter(
      input,
      resolvedOptions
    );

    this.recordImportIssues(
      imported.map.id,
      imported.map.name,
      resolvedOptions.documentPath,
      imported.issues
    );

    if (resolvedOptions.documentPath) {
      this.upsertProjectAsset(
        this.createProjectAssetSummary({
          kind: "map",
          path: resolvedOptions.documentPath,
          documentId: imported.map.id
        })
      );
    }

    this.commit(addImportedMapDocumentCommand(imported.map));

    return imported;
  }

  importTsjTilesetDocument(
    input: string | unknown,
    options?: ExternalDocumentImportOptions
  ): ImportedTsjTilesetDocument {
    const resolvedOptions = this.resolveImportOptions(options);
    const imported = importTsjTilesetDocumentAdapter(
      input,
      resolvedOptions
    );
    const activeMap = getActiveMap(this.history.state);

    this.recordImportIssues(
      imported.tileset.id,
      imported.tileset.name,
      resolvedOptions.documentPath,
      imported.issues
    );

    if (resolvedOptions.documentPath) {
      this.upsertProjectAsset(
        this.createProjectAssetSummary({
          kind: "tileset",
          path: resolvedOptions.documentPath,
          documentId: imported.tileset.id
        })
      );
    }

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

  async saveDocument(documentId: string): Promise<boolean> {
    if (!this.documents) {
      return false;
    }

    const targets = this.buildNativeSaveTargets([documentId]);

    if (targets.length === 0) {
      return false;
    }

    const result = await this.persistNativeDocument(
      targets[0]!,
      this.buildNativeDocumentSerializationContext(this.buildNativeSaveTargets())
    );

    this.emit();
    return result;
  }

  async saveActiveDocument(): Promise<boolean> {
    const activeMap = getActiveMap(this.history.state);

    if (!activeMap) {
      return false;
    }

    return this.saveDocument(activeMap.id);
  }

  async saveAllDocuments(): Promise<boolean> {
    if (!this.documents) {
      return false;
    }

    const targets = this.buildNativeSaveTargets();

    if (targets.length === 0) {
      return false;
    }

    const context = this.buildNativeDocumentSerializationContext(targets);
    let allSaved = true;

    for (const target of targets) {
      const saved = await this.persistNativeDocument(target, context);
      allSaved = allSaved && saved;
    }

    this.emit();
    return allSaved;
  }

  async exportDocumentAsJson(documentId: string): Promise<boolean> {
    if (!this.documents && !this.exports) {
      return false;
    }

    const mapTarget = this.createJsonExportTarget("map", documentId);
    const tilesetTarget = this.createJsonExportTarget("tileset", documentId);
    const target = mapTarget ?? tilesetTarget;

    if (!target) {
      return false;
    }

    const result = await this.persistJsonExport(
      target,
      this.buildJsonExportSerializationContext([target])
    );

    this.emit();
    return result;
  }

  async exportActiveDocumentAsJson(): Promise<boolean> {
    const activeMap = getActiveMap(this.history.state);

    if (!activeMap) {
      return false;
    }

    return this.exportDocumentAsJson(activeMap.id);
  }

  async exportActiveTilesetAsJson(): Promise<boolean> {
    const activeTileset = getActiveTileset(this.history.state);

    if (!activeTileset) {
      return false;
    }

    return this.exportDocumentAsJson(activeTileset.id);
  }

  async exportActiveMapImage(dataUrl: string): Promise<boolean> {
    if (!this.documents && !this.exports) {
      return false;
    }

    const target = this.createActiveMapImageExportTarget();

    if (!target) {
      return false;
    }

    try {
      const exportedDocument: SavedEditorDocument = {
        id: target.id,
        kind: target.kind,
        name: target.name,
        path: target.path,
        content: dataUrl,
        contentType: "image/png"
      };

      if (this.exports) {
        await this.exports.queueDocumentExport(exportedDocument);
      } else if (this.documents) {
        await this.documents.saveDocument(exportedDocument);
      }

      this.replaceIssueSourceEntries(`export:${target.id}:image`, []);
      this.emit();
      return true;
    } catch (error) {
      this.replaceIssueSourceEntries(`export:${target.id}:image`, [
        {
          ...this.createExportIssueEntry(target, error),
          id: `export:${target.id}:image:${target.path}`,
          sourceId: `export:${target.id}:image`,
          code: "export.image.failed"
        }
      ]);
      this.emit();
      return false;
    }
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

  setActiveTemplate(templateId: string): void {
    const template = this.history.state.templates.find((entry) => entry.id === templateId);

    if (!template) {
      return;
    }

    this.clearTransientInteractions();
    this.commit(setActiveTemplateCommand(template.id as TemplateId));
  }

  setActiveTool(tool: EditorToolId): void {
    this.clearTransientInteractions();
    this.commit(setActiveToolCommand(tool));
  }

  toggleWorlds(): void {
    this.commit(toggleShowWorldsCommand());
  }

  toggleAutoMapWhileDrawing(): void {
    this.commit(toggleAutoMapWhileDrawingCommand());
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

  createTemplateFromSelectedObject(input?: {
    name?: string;
    path?: string;
  }): string | undefined {
    const resolved = this.resolveSelectedObject();

    if (!resolved) {
      return undefined;
    }

    const nextName =
      input?.name?.trim() ||
      resolved.object.name.trim() ||
      createIndexedName(
        this.naming.objectNamePrefix,
        this.history.state.templates.length + 1
      );
    const normalizedTemplateObject = this.normalizeTemplateObjectForStorage(
      resolved.object,
      {
        activeMap: resolved.activeMap
      }
    );
    const template = buildObjectTemplateDocument({
      name: nextName,
      object: normalizedTemplateObject.object,
      tilesetIds: normalizedTemplateObject.tilesetIds
    });
    const path = this.createUniqueTemplatePath(nextName, input?.path);

    this.upsertProjectAsset(
      this.createProjectAssetSummary({
        kind: "template",
        path,
        documentId: template.id
      })
    );
    this.clearTransientInteractions();
    this.commit(addImportedTemplateCommand(template));

    return template.id;
  }

  replaceSelectedObjectsWithActiveTemplate(): void {
    const resolved = this.resolveActiveObjectLayer();
    const template = getActiveTemplate(this.history.state);
    const selection = this.history.state.session.selection;

    if (!resolved || !template || !isObjectSelectionState(selection) || selection.objectIds.length === 0) {
      return;
    }

    const objectIds = selection.objectIds.filter((objectId) =>
      Boolean(getObjectById(resolved.activeLayer, objectId))
    );

    if (objectIds.length === 0) {
      return;
    }

    const materialized = this.materializeTemplateObjectForMap(
      template,
      resolved.activeMap
    );

    if (!materialized) {
      return;
    }

    this.clearTransientInteractions();
    this.commit(
      replaceObjectsWithTemplateCommand({
        mapId: resolved.activeMap.id,
        layerId: resolved.activeLayer.id,
        objectIds,
        template,
        templateObject: materialized.templateObject,
        ...(materialized.attachTilesetId !== undefined
          ? { attachTilesetId: materialized.attachTilesetId }
          : {})
      })
    );
  }

  resetSelectedTemplateInstances(): void {
    const resolved = this.resolveSelectedTemplateInstances();

    if (!resolved) {
      return;
    }

    const replacements = resolved.instances.flatMap((instance) => {
      const materialized = this.materializeTemplateObjectForMap(
        instance.template,
        resolved.activeMap
      );

      if (!materialized) {
        return [];
      }

      return [
        {
          objectId: instance.object.id,
          templateId: instance.template.id,
          templateObject: materialized.templateObject,
          ...(materialized.attachTilesetId !== undefined
            ? { attachTilesetId: materialized.attachTilesetId }
            : {})
        }
      ];
    });

    if (replacements.length === 0) {
      return;
    }

    this.clearTransientInteractions();
    this.commit(
      resetTemplateInstancesCommand({
        mapId: resolved.activeMap.id,
        layerId: resolved.activeLayer.id,
        replacements: replacements.map(({ attachTilesetId: _ignored, ...entry }) => entry),
        attachTilesetIds: [
          ...new Set(
            replacements
              .map((entry) => entry.attachTilesetId)
              .filter((tilesetId): tilesetId is TilesetId => tilesetId !== undefined)
          )
        ]
      })
    );
  }

  detachSelectedTemplateInstances(): void {
    const resolved = this.resolveActiveObjectLayer();
    const selection = this.history.state.session.selection;

    if (!resolved || !isObjectSelectionState(selection) || selection.objectIds.length === 0) {
      return;
    }

    const objectIds = selection.objectIds.filter((objectId) => {
      const object = getObjectById(resolved.activeLayer, objectId);
      return object?.templateId !== undefined;
    });

    if (objectIds.length === 0) {
      return;
    }

    this.clearTransientInteractions();
    this.commit(
      detachTemplateInstancesCommand({
        mapId: resolved.activeMap.id,
        layerId: resolved.activeLayer.id,
        objectIds
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

  exportTiledWorldDocument(worldId: string): string | undefined {
    const world = this.history.state.worlds.find((entry) => entry.id === worldId);

    if (!world) {
      return undefined;
    }

    const worldAsset = this.getProjectAssetByDocumentId("world", world.id);

    return exportTiledWorldDocumentAdapter({
      world,
      ...(worldAsset !== undefined ? { documentPath: worldAsset.path } : {})
    });
  }

  exportTxTemplateDocument(templateId: string): string | undefined {
    const template = this.history.state.templates.find((entry) => entry.id === templateId);

    if (!template) {
      return undefined;
    }

    let tilesetSource: string | undefined;

    if (template.object.shape === "tile" && template.object.tile) {
      const tilesetId =
        template.object.tile.tilesetId ?? template.tilesetIds[0];
      const tilesetAsset =
        tilesetId !== undefined
          ? this.getProjectAssetByDocumentId("tileset", tilesetId)
          : undefined;

      if (!tilesetAsset) {
        return undefined;
      }

      const templateAsset = this.getProjectAssetByDocumentId("template", template.id);
      tilesetSource =
        templateAsset !== undefined
          ? relativeProjectPath(templateAsset.path, tilesetAsset.path)
          : normalizeProjectAssetPath(tilesetAsset.path);
    }

    return exportTxTemplateDocumentAdapter({
      template,
      resolveObjectTypesAndProperties:
        this.history.state.project.exportOptions.resolveObjectTypesAndProperties,
      ...(tilesetSource !== undefined ? { tilesetSource } : {})
    });
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

      this.commitMapCommandWithAutomapping(
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
        ),
        preview.mapId
      );
      return;
    }

    const stroke = this.canvasStroke;
    this.canvasStroke = undefined;

    if (!stroke || stroke.cells.length === 0) {
      return;
    }

    this.commitMapCommandWithAutomapping(
      paintTileStrokeCommand(stroke.mapId, stroke.layerId, stroke.cells),
      stroke.mapId
    );
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
      this.commitMapCommandWithAutomapping(
        paintTileFillCommand(
          activeMap.id,
          activeLayer.id,
          activeLayer,
          x,
          y,
          getActiveStampPrimaryGid(state) ?? 1
        ),
        activeMap.id
      );
      return;
    }

    if (tool === "shape-fill") {
      this.commitMapCommandWithAutomapping(
        paintTileShapeCommand(
          activeMap.id,
          activeLayer.id,
          state.session.shapeFillMode,
          x,
          y,
          x,
          y,
          getActiveStampPrimaryGid(state) ?? 1
        ),
        activeMap.id
      );
      return;
    }

    if (tool === "stamp") {
      this.commitMapCommandWithAutomapping(
        paintTileStampCommand(
          activeMap.id,
          activeLayer.id,
          x,
          y,
          state.session.activeStamp
        ),
        activeMap.id
      );
      return;
    }

    if (tool === "eraser") {
      this.commitMapCommandWithAutomapping(
        paintTileAtCommand(activeMap.id, activeLayer.id, x, y, null),
        activeMap.id
      );
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

  moveWorldMap(worldId: string, fileName: string, x: number, y: number): void {
    const state = this.history.state;
    const normalizedFileName = normalizeProjectAssetPath(fileName);
    const world = state.worlds.find((entry) => entry.id === worldId);

    if (!world || world.patterns.length > 0) {
      return;
    }

    const mapEntry = resolveWorldMapEntry(world, normalizedFileName, undefined);

    if (!mapEntry) {
      return;
    }

    const targetMapAsset = this.getProjectAssetByPath("map", normalizedFileName);
    const targetMap =
      targetMapAsset?.documentId !== undefined
        ? state.maps.find((map) => map.id === targetMapAsset.documentId)
        : undefined;
    const targetMapSize = targetMap ? getMapPixelSize(targetMap) : undefined;
    const width = mapEntry.width ?? targetMapSize?.width;
    const height = mapEntry.height ?? targetMapSize?.height;

    this.commit(
      moveWorldMapCommand({
        worldId: world.id,
        fileName: normalizedFileName,
        x,
        y,
        ...(width !== undefined ? { width } : {}),
        ...(height !== undefined ? { height } : {})
      })
    );
  }

  private getAutomappingSourceId(mapId: MapId): string {
    return `automapping:${mapId}`;
  }

  private executeAutomappingForMap(
    state: EditorWorkspaceState,
    activeMap: EditorMap
  ): {
    map: EditorMap;
    issueEntries: EditorIssueEntry[];
    matchCount: number;
  } {
    const sourceId = this.getAutomappingSourceId(activeMap.id);
    const rulesFilePath = state.project.automappingRulesFile
      ? normalizeProjectAssetPath(state.project.automappingRulesFile)
      : "";
    const issueEntries: EditorIssueEntry[] = [];
    const addIssueEntries = (
      documentPath: string | undefined,
      documentName: string,
      issues: ReadonlyArray<{
        severity: "warning" | "error";
        code: string;
        message: string;
        path: string;
      }>
    ) => {
      issueEntries.push(
        ...issues.map((issue) =>
          this.createIssueEntry(sourceId, documentName, documentPath, issue)
        )
      );
    };

    if (rulesFilePath.length === 0) {
      addIssueEntries(undefined, activeMap.name, [
        {
          severity: "warning",
          code: "automapping.rulesFile.missing",
          message: "Project automapping rules file is not configured.",
          path: "project.automappingRulesFile"
        }
      ]);

      return {
        map: activeMap,
        issueEntries,
        matchCount: 0
      };
    }

    const rulesFileName = basename(rulesFilePath);
    const rulesText = this.loadProjectTextAsset(rulesFilePath);

    if (rulesText === undefined) {
      addIssueEntries(rulesFilePath, rulesFileName, [
        {
          severity: "warning",
          code: "automapping.rules.file.notFound",
          message: `Automapping rules file \`${rulesFilePath}\` could not be loaded.`,
          path: "rules"
        }
      ]);

      return {
        map: activeMap,
        issueEntries,
        matchCount: 0
      };
    }

    const importedRules: ImportedAutomappingRulesFile = importAutomappingRulesFile(rulesText, {
      documentPath: rulesFilePath,
      assetRoots: state.project.assetRoots,
      loadTextFile: (path) => this.loadProjectTextAsset(path)
    });

    addIssueEntries(rulesFilePath, rulesFileName, importedRules.issues);

    const matchingRuleMaps = importedRules.ruleMaps.filter((reference) =>
      matchesAutomappingMapName(activeMap.name, reference.mapNameFilter)
    );

    let nextMap = activeMap;
    let totalMatchCount = 0;

    for (const ruleMapReference of matchingRuleMaps) {
      const ruleMapPath = normalizeProjectAssetPath(ruleMapReference.filePath);
      const ruleMapName = basename(ruleMapPath);
      const ruleMapText = this.loadProjectTextAsset(ruleMapPath);

      if (ruleMapText === undefined) {
        addIssueEntries(ruleMapPath, ruleMapName, [
          {
            severity: "warning",
            code: "automapping.ruleMap.file.notFound",
            message: `Automapping rule map \`${ruleMapPath}\` could not be loaded.`,
            path: "rules"
          }
        ]);
        continue;
      }

      const importedRuleMap = this.importAutomappingRuleMapDocument(ruleMapPath, ruleMapText);

      if (!importedRuleMap) {
        addIssueEntries(ruleMapPath, ruleMapName, [
          {
            severity: "warning",
            code: "automapping.ruleMap.format.unsupported",
            message: `Automapping rule map format \`${lowerCaseExtension(ruleMapPath) || "unknown"}\` is not supported.`,
            path: "rules"
          }
        ]);
        continue;
      }

      addIssueEntries(ruleMapPath, ruleMapName, importedRuleMap.issues);

      const normalizedRuleMap = this.normalizeAutomappingRuleMap(
        importedRuleMap.map,
        importedRuleMap.tilesetReferences,
        nextMap,
        ruleMapPath,
        state.tilesets,
        state.project.assetRoots
      );

      addIssueEntries(ruleMapPath, ruleMapName, normalizedRuleMap.issues);

      const executed = runAutomappingRuleMap(normalizedRuleMap.map, nextMap);

      addIssueEntries(ruleMapPath, ruleMapName, executed.issues);

      nextMap = executed.map;
      totalMatchCount += executed.matches.length;
    }

    return {
      map: nextMap,
      issueEntries,
      matchCount: totalMatchCount
    };
  }

  private commitMapCommandWithAutomapping(
    command: Parameters<CommandHistory<EditorWorkspaceState>["execute"]>[0],
    mapId: MapId
  ): void {
    const state = this.history.state;

    if (!state.session.autoMapWhileDrawing) {
      this.commit(command);
      return;
    }

    const projectedState = command.run(state);
    const projectedMap = projectedState.maps.find((map) => map.id === mapId);

    if (!projectedMap) {
      this.commit(command);
      return;
    }

    const execution = this.executeAutomappingForMap(projectedState, projectedMap);

    this.replaceIssueSourceEntries(this.getAutomappingSourceId(mapId), execution.issueEntries);

    if (execution.matchCount > 0) {
      this.commit(
        createMacroCommand(
          `${command.description} + AutoMap`,
          [
            command,
            replaceMapDocumentCommand(
              mapId,
              execution.map,
              `Run AutoMap on ${projectedMap.name}`
            )
          ],
          `${command.id}.automap`
        )
      );
      return;
    }

    this.commit(command);
  }

  runManualAutomapping(): void {
    const state = this.history.state;
    const activeMap = getActiveMap(state);

    if (!activeMap) {
      return;
    }

    const execution = this.executeAutomappingForMap(state, activeMap);

    this.replaceIssueSourceEntries(
      this.getAutomappingSourceId(activeMap.id),
      execution.issueEntries
    );

    if (execution.matchCount > 0) {
      this.clearTransientInteractions();
      this.commit(
        replaceMapDocumentCommand(activeMap.id, execution.map, `Run AutoMap on ${activeMap.name}`)
      );
      return;
    }

    this.emit();
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

  toggleIssuesPanel(): void {
    this.runtime = setEditorRuntimeIssuePanelOpen(this.runtime, !this.runtime.issues.panelOpen);
    this.emit();
  }

  closeIssuesPanel(): void {
    this.runtime = setEditorRuntimeIssuePanelOpen(this.runtime, false);
    this.emit();
  }

  clearIssues(): void {
    this.runtime = clearEditorRuntimeIssueEntries(this.runtime);
    this.runtime = setEditorRuntimeIssuePanelOpen(this.runtime, false);
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
