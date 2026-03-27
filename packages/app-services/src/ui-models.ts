import {
  createMap,
  createObjectLayer,
  createSuggestedPropertiesForClassType,
  getMapGlobalTileGid,
  getObjectById,
  getTilesetTileByLocalId,
  listTilesetLocalIds,
  resolveMapTileGid,
  type BlendMode,
  type EditorMap,
  type EditorProject,
  type LayerDefinition,
  type LayerId,
  type MapObject,
  type ObjectId,
  type TilesetDefinition
} from "@pixel-editor/domain";
import type { DocumentSummary, ProjectAssetSummary } from "@pixel-editor/contracts";
import {
  getTileSelectionBounds,
  getTileStampPrimaryGid,
  getTileStampFootprint,
  summarizeEditorIssues,
  type EditorToolId,
  type ShapeFillMode,
  type ClipboardState,
  type SelectionState
} from "@pixel-editor/editor-state";
import type { PropertyDefinition, PropertyTypeDefinition } from "@pixel-editor/domain";

import type {
  EditorRuntimeSnapshot,
  EditorWorldContextMapSnapshot
} from "./controller";
import type { TiledMenuContext } from "./toolbar-spec";

export interface ObjectReferenceOption {
  id: string;
  label: string;
}

export interface ProjectTreeFolderNode {
  id: string;
  kind: "folder";
  name: string;
  path: string;
  children: ProjectTreeNode[];
}

export interface ProjectTreeAssetNode {
  id: string;
  kind: "asset";
  asset: ProjectAssetSummary;
}

export type ProjectTreeNode =
  | ProjectTreeFolderNode
  | ProjectTreeAssetNode;

export interface ProjectDockViewState {
  tree: ProjectTreeNode[];
  activeDocumentIds: string[];
}

export type ProjectDockActivationTarget =
  | {
      kind: "map";
      documentId: string;
    }
  | {
      kind: "tileset";
      documentId: string;
    }
  | {
      kind: "template";
      documentId: string;
    };

export interface EditorShellViewState {
  activeObject?: MapObject;
  activeDocument?: DocumentSummary;
  activeLayerIndex: number;
  activeProjectDocumentIds: string[];
  canMoveWorldMaps: boolean;
}

export interface EditorShellChromeViewState {
  menuContext: TiledMenuContext;
  activeTool: EditorToolId;
  shapeFillMode: ShapeFillMode;
  canUseWorldTool: boolean;
  activeLayerId?: LayerId;
}

export interface EditorShellDialogsViewState {
  issuesPanelOpen: boolean;
  project: EditorProject;
  projectPropertyTypes: readonly PropertyTypeDefinition[];
}

export interface ObjectsPanelObjectItem {
  id: ObjectId;
  name: string;
  shape: MapObject["shape"];
  x: number;
  y: number;
  width: number;
  height: number;
  isSelected: boolean;
}

export interface ObjectsPanelViewState {
  activeTemplateName?: string;
  clipboardObjectCount: number;
  hasActiveLayer: boolean;
  hasObjectClipboard: boolean;
  hasObjectSelection: boolean;
  hasTemplateInstanceSelection: boolean;
  objects: ObjectsPanelObjectItem[];
}

export interface EditorStatusBarLayerOption {
  id: LayerId;
  name: string;
}

export interface EditorStatusBarViewState {
  activeLayerId?: LayerId;
  activeLayerKind?: LayerDefinition["kind"];
  errorCount: number;
  warningCount: number;
  layerOptions: EditorStatusBarLayerOption[];
  zoom: number;
}

export interface LayersPanelLayerItemViewState {
  id: LayerId;
  kind: LayerDefinition["kind"];
  name: string;
  visible: boolean;
  locked: boolean;
  isSelected: boolean;
}

export interface LayersPanelViewState {
  layers: LayersPanelLayerItemViewState[];
  hasMap: boolean;
  hasActiveLayer: boolean;
  canMoveActiveLayerUp: boolean;
  canMoveActiveLayerDown: boolean;
  hasSiblingLayers: boolean;
  otherLayersHidden: boolean;
  otherLayersLocked: boolean;
  highlightCurrentLayer: boolean;
}

export interface MapPropertiesPanelViewState {
  name: string;
  orientation: EditorMap["settings"]["orientation"];
  renderOrder: EditorMap["settings"]["renderOrder"];
  width: number;
  height: number;
  tileWidth: number;
  tileHeight: number;
  infinite: boolean;
  backgroundColor: string;
}

export interface MiniMapPanelViewState {
  mapName: string;
  mapWidth: number;
  mapHeight: number;
  infinite: boolean;
  previewWidthPercent: number;
  previewHeightPercent: number;
  viewportLeftPercent: number;
  viewportTopPercent: number;
  viewportWidthPercent: number;
  viewportHeightPercent: number;
  viewportZoom: number;
}

export type RendererCanvasObjectTransformPreviewViewState =
  | { kind: "none" }
  | {
      kind: "move";
      objectIds: ObjectId[];
      deltaX: number;
      deltaY: number;
    }
  | {
      kind: "resize";
      objectId: ObjectId;
      x: number;
      y: number;
      width: number;
      height: number;
    };

export interface RendererCanvasRenderViewState {
  map?: EditorMap;
  tilesets: TilesetDefinition[];
  viewport: EditorRuntimeSnapshot["bootstrap"]["viewport"];
  highlightedLayerId?: LayerId;
  selectedObjectIds?: ObjectId[];
  selectedTiles?: Array<{ x: number; y: number }>;
  previewTiles?: Array<{ x: number; y: number }>;
  objectTransformPreview?: RendererCanvasObjectTransformPreviewViewState;
}

export interface WorldContextOverlayMapItemViewState {
  worldId: EditorWorldContextMapSnapshot["worldId"];
  mapId?: EditorWorldContextMapSnapshot["mapId"];
  fileName: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
  canActivate: boolean;
  gridWidth?: number;
  gridHeight?: number;
}

export interface WorldContextOverlayViewState {
  activeMap: EditorMap;
  activeTool: EditorToolId;
  viewport: EditorRuntimeSnapshot["bootstrap"]["viewport"];
  visible: boolean;
  modifiable: boolean;
  activeMapRect: {
    x: number;
    y: number;
  };
  maps: WorldContextOverlayMapItemViewState[];
}

export interface RendererCanvasViewState {
  activeTool: EditorToolId;
  selectedObjectIds: ObjectId[];
  render: RendererCanvasRenderViewState;
  worldOverlay?: WorldContextOverlayViewState;
}

export interface MapImageExportViewState {
  snapshot: RendererCanvasRenderViewState;
  width: number;
  height: number;
}

export interface PropertiesInspectorMapViewState {
  name: string;
  orientation: EditorMap["settings"]["orientation"];
  renderOrder: EditorMap["settings"]["renderOrder"];
  width: number;
  height: number;
  tileWidth: number;
  tileHeight: number;
  parallaxOriginX: number;
  parallaxOriginY: number;
  infinite: boolean;
  backgroundColor: string;
  properties: readonly PropertyDefinition[];
}

export interface PropertiesInspectorLayerViewState {
  kind: LayerDefinition["kind"];
  name: string;
  className: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  offsetX: number;
  offsetY: number;
  parallaxX: number;
  parallaxY: number;
  tintColor: string;
  blendMode: BlendMode;
  properties: readonly PropertyDefinition[];
  drawOrder?: "topdown" | "index";
  imagePath?: string;
  repeatX?: boolean;
  repeatY?: boolean;
}

export interface PropertiesInspectorObjectViewState {
  shape: MapObject["shape"];
  name: string;
  className: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  visible: boolean;
  properties: readonly PropertyDefinition[];
}

export interface PropertiesInspectorViewState {
  map?: PropertiesInspectorMapViewState;
  layer?: PropertiesInspectorLayerViewState;
  object?: PropertiesInspectorObjectViewState;
  propertyTypes: readonly PropertyTypeDefinition[];
  objectReferenceOptions: ObjectReferenceOption[];
}

export interface TilePropertiesEditorTileViewState {
  localId: number;
  className: string;
  probability: number;
  properties: readonly PropertyDefinition[];
  suggestedProperties: readonly PropertyDefinition[];
  imageSource?: string;
}

export interface TilePropertiesEditorViewState {
  tile?: TilePropertiesEditorTileViewState;
  propertyTypes: readonly PropertyTypeDefinition[];
  objectReferenceOptions: ObjectReferenceOption[];
}

export type TileSelectionClipboardSummaryViewState =
  | { kind: "empty" }
  | { kind: "tile"; width: number; height: number }
  | { kind: "object"; objectCount: number };

export interface TileSelectionControlsViewState {
  canEditTiles: boolean;
  hasTileClipboard: boolean;
  selectionWidth: number;
  selectionHeight: number;
  selectionCellCount: number;
  clipboard: TileSelectionClipboardSummaryViewState;
}

export type TileVisualViewState =
  | {
      kind: "sprite";
      tileWidth: number;
      tileHeight: number;
      imagePath: string;
      imageWidth: number;
      imageHeight: number;
      offsetX: number;
      offsetY: number;
      gid?: number;
    }
  | {
      kind: "image-collection";
      tileWidth: number;
      tileHeight: number;
      imagePath: string;
      gid?: number;
    }
  | {
      kind: "fallback";
      tileWidth: number;
      tileHeight: number;
      gid?: number;
    };

export interface TilesetDetailsViewState {
  kind: TilesetDefinition["kind"];
  name: string;
  tileWidth: number;
  tileHeight: number;
  tileOffsetX: number;
  tileOffsetY: number;
  objectAlignment: TilesetDefinition["objectAlignment"];
  tileRenderSize: TilesetDefinition["tileRenderSize"];
  fillMode: TilesetDefinition["fillMode"];
  imagePath: string;
  imageWidth?: number;
  imageHeight?: number;
  margin: number;
  spacing: number;
  columns?: number;
}

export interface TilesetsPanelTilesetItemViewState {
  id: string;
  name: string;
  kind: TilesetDefinition["kind"];
  tileWidth: number;
  tileHeight: number;
  tileCount: number;
  isActive: boolean;
}

export type TilesetsPanelStampSummaryViewState =
  | { kind: "none" }
  | { kind: "pattern"; width: number; height: number }
  | { kind: "tile"; gid: number; localId: number; tilesetName: string };

export interface TilesetsPanelTileEntryViewState {
  localId: number;
  isSelected: boolean;
  preview: TileVisualViewState;
}

export interface TilesetsPanelViewState {
  availableTilesets: TilesetsPanelTilesetItemViewState[];
  activeTilesetId?: string;
  activeTilesetKind?: TilesetDefinition["kind"];
  activeTileWidth?: number;
  activeTileHeight?: number;
  activeImageColumns?: number;
  selectedLocalId: number | null;
  selectedTileClassName?: string;
  selectedTilePreview?: TileVisualViewState;
  activeTileEntries: TilesetsPanelTileEntryViewState[];
  stampSummary: TilesetsPanelStampSummaryViewState;
  tilePropertiesEditorViewState?: TilePropertiesEditorViewState;
  tilesetDetailsViewState?: TilesetDetailsViewState;
}

export interface TileAnimationEditorFrameViewState {
  tileId: number;
  durationMs: number;
  preview: TileVisualViewState;
}

export interface TileAnimationEditorSourceTileViewState {
  localId: number;
  preview: TileVisualViewState;
}

export interface TileAnimationEditorViewState {
  tilesetId: string;
  tilesetKind: TilesetDefinition["kind"];
  tileWidth: number;
  tileHeight: number;
  imageColumns?: number;
  selectedLocalId: number | null;
  frames: TileAnimationEditorFrameViewState[];
  sourceTiles: TileAnimationEditorSourceTileViewState[];
}

export interface TileCollisionCanvasViewState {
  tileWidth: number;
  tileHeight: number;
  tilePreview: TileVisualViewState;
  previewMap: NonNullable<RendererCanvasRenderViewState["map"]>;
  objects: readonly MapObject[];
}

export interface TileCollisionEditorViewState {
  selectedLocalId: number | null;
  collisionObjects: readonly MapObject[];
  propertyTypes: readonly PropertyTypeDefinition[];
  canvas?: TileCollisionCanvasViewState;
}

export interface TerrainSetsPanelTilesetItemViewState {
  id: TilesetDefinition["id"];
  name: string;
  isActive: boolean;
}

export interface TerrainSetsPanelWangSetItemViewState {
  id: TilesetDefinition["wangSets"][number]["id"];
  name: string;
  type: TilesetDefinition["wangSets"][number]["type"];
}

export interface TerrainSetsPanelViewState {
  availableTilesets: TerrainSetsPanelTilesetItemViewState[];
  activeTilesetId?: TilesetDefinition["id"];
  activeTilesetName?: string;
  wangSets: TerrainSetsPanelWangSetItemViewState[];
}

export interface IssuesPanelIssueItem {
  id: string;
  sourceKind: string;
  documentName: string;
  documentPath?: string;
  severity: "warning" | "error";
  code: string;
  message: string;
  path: string;
}

export interface IssuesPanelViewState {
  issues: IssuesPanelIssueItem[];
}

function normalizeProjectPath(path: string): string {
  return path.replaceAll("\\", "/").trim().replace(/^\.\/+/, "");
}

function buildTileCollisionPreviewMap(input: {
  tileWidth: number;
  tileHeight: number;
  objects: readonly MapObject[];
}): NonNullable<RendererCanvasRenderViewState["map"]> {
  return createMap({
    name: "tile-collision-preview",
    orientation: "orthogonal",
    width: 1,
    height: 1,
    tileWidth: input.tileWidth,
    tileHeight: input.tileHeight,
    layers: [
      createObjectLayer({
        name: "collision",
        drawOrder: "index",
        objects: [...input.objects]
      })
    ]
  });
}

function basename(path: string): string {
  const normalized = normalizeProjectPath(path);
  return normalized.split("/").at(-1) ?? normalized;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function createProjectTreeFolder(path: string): ProjectTreeFolderNode {
  return {
    id: `folder:${path || "."}`,
    kind: "folder",
    name: path.length > 0 ? basename(path) : ".",
    path,
    children: []
  };
}

function sortProjectTreeNodes(nodes: ProjectTreeNode[]): ProjectTreeNode[] {
  return nodes
    .map((node) =>
      node.kind === "folder"
        ? {
            ...node,
            children: sortProjectTreeNodes(node.children)
          }
        : node
    )
    .sort((left, right) => {
      if (left.kind !== right.kind) {
        return left.kind === "folder" ? -1 : 1;
      }

      const leftName = left.kind === "folder" ? left.name : left.asset.name;
      const rightName = right.kind === "folder" ? right.name : right.asset.name;

      return leftName.localeCompare(rightName);
    });
}

function collectLayerObjectReferenceOptions(
  map: EditorMap,
  options: ObjectReferenceOption[]
): void {
  for (const layer of map.layers) {
    collectNestedLayerObjectReferenceOptions(layer, options);
  }
}

function collectNestedLayerObjectReferenceOptions(
  layer: EditorMap["layers"][number],
  options: ObjectReferenceOption[]
): void {
  if (layer.kind === "group") {
    for (const childLayer of layer.layers) {
      collectNestedLayerObjectReferenceOptions(childLayer, options);
    }

    return;
  }

  if (layer.kind !== "object") {
    return;
  }

  for (const object of layer.objects) {
    options.push({
      id: object.id,
      label: `${object.name || object.id} · ${layer.name}`
    });
  }
}

function selectActiveObject(snapshot: EditorRuntimeSnapshot): MapObject | undefined {
  const activeObjectLayer = snapshot.activeLayer?.kind === "object" ? snapshot.activeLayer : undefined;
  const selectedObjectId =
    snapshot.workspace.session.selection.kind === "object"
      ? snapshot.workspace.session.selection.objectIds[0]
      : undefined;

  return activeObjectLayer && selectedObjectId
    ? getObjectById(activeObjectLayer, selectedObjectId)
    : undefined;
}

export function buildObjectReferenceOptions(
  map: EditorMap | undefined
): ObjectReferenceOption[] {
  if (!map) {
    return [];
  }

  const options: ObjectReferenceOption[] = [];
  collectLayerObjectReferenceOptions(map, options);
  return options;
}

function getImageTilesetColumns(tileset: TilesetDefinition): number | undefined {
  if (tileset.kind !== "image" || !tileset.source) {
    return undefined;
  }

  if (tileset.source.columns !== undefined) {
    return tileset.source.columns;
  }

  if (tileset.source.imageWidth === undefined) {
    return undefined;
  }

  return Math.floor(
    (tileset.source.imageWidth - tileset.source.margin * 2 + tileset.source.spacing) /
      Math.max(1, tileset.tileWidth + tileset.source.spacing)
  );
}

export function buildTileVisualViewState(input: {
  tileset: TilesetDefinition;
  localId: number;
  gid?: number;
}): TileVisualViewState {
  const { tileset, localId } = input;

  if (
    tileset.kind === "image" &&
    tileset.source &&
    tileset.source.imageWidth !== undefined &&
    tileset.source.imageHeight !== undefined
  ) {
    const columns = getImageTilesetColumns(tileset);

    if (columns && columns > 0) {
      const column = localId % columns;
      const row = Math.floor(localId / columns);
      const offsetX =
        tileset.source.margin + column * (tileset.tileWidth + tileset.source.spacing);
      const offsetY =
        tileset.source.margin + row * (tileset.tileHeight + tileset.source.spacing);

      return {
        kind: "sprite",
        tileWidth: tileset.tileWidth,
        tileHeight: tileset.tileHeight,
        imagePath: tileset.source.imagePath,
        imageWidth: tileset.source.imageWidth,
        imageHeight: tileset.source.imageHeight,
        offsetX,
        offsetY,
        ...(input.gid !== undefined ? { gid: input.gid } : {})
      };
    }
  }

  if (tileset.kind === "image-collection") {
    const tile = getTilesetTileByLocalId(tileset, localId);

    if (tile?.imageSource) {
      return {
        kind: "image-collection",
        tileWidth: tileset.tileWidth,
        tileHeight: tileset.tileHeight,
        imagePath: tile.imageSource,
        ...(input.gid !== undefined ? { gid: input.gid } : {})
      };
    }
  }

  return {
    kind: "fallback",
    tileWidth: tileset.tileWidth,
    tileHeight: tileset.tileHeight,
    ...(input.gid !== undefined ? { gid: input.gid } : {})
  };
}

export function buildProjectTree(
  assetRoots: readonly string[],
  assets: readonly ProjectAssetSummary[]
): ProjectTreeNode[] {
  const rootNodes: ProjectTreeNode[] = [];
  const folders = new Map<string, ProjectTreeFolderNode>();

  function ensureFolder(path: string): ProjectTreeFolderNode {
    const normalizedPath = normalizeProjectPath(path);
    const existing = folders.get(normalizedPath);

    if (existing) {
      return existing;
    }

    const folder = createProjectTreeFolder(normalizedPath);
    folders.set(normalizedPath, folder);

    const segments = normalizedPath.split("/").filter((segment) => segment.length > 0);

    if (segments.length <= 1) {
      rootNodes.push(folder);
      return folder;
    }

    const parentPath = segments.slice(0, -1).join("/");
    ensureFolder(parentPath).children.push(folder);
    return folder;
  }

  for (const assetRoot of assetRoots) {
    const normalizedRoot = normalizeProjectPath(assetRoot);

    if (normalizedRoot.length === 0 || normalizedRoot === ".") {
      continue;
    }

    ensureFolder(normalizedRoot);
  }

  for (const asset of assets) {
    const normalizedPath = normalizeProjectPath(asset.path);
    const segments = normalizedPath.split("/").filter((segment) => segment.length > 0);
    const assetNode: ProjectTreeAssetNode = {
      id: asset.id,
      kind: "asset",
      asset: {
        ...asset,
        path: normalizedPath
      }
    };

    if (segments.length <= 1) {
      rootNodes.push(assetNode);
      continue;
    }

    const parentPath = segments.slice(0, -1).join("/");
    ensureFolder(parentPath).children.push(assetNode);
  }

  return sortProjectTreeNodes(rootNodes);
}

function selectActiveDocumentSummary(snapshot: EditorRuntimeSnapshot): DocumentSummary | undefined {
  return (
    snapshot.bootstrap.documents.find(
      (document) => document.id === snapshot.bootstrap.activeDocumentId
    ) ?? snapshot.bootstrap.documents[0]
  );
}

function collectActiveProjectDocumentIds(snapshot: EditorRuntimeSnapshot): string[] {
  const activeMap = snapshot.activeMap;
  const worldContext = snapshot.worldContext;

  return [
    ...(activeMap ? [activeMap.id] : []),
    ...(snapshot.workspace.session.activeTilesetId !== undefined
      ? [snapshot.workspace.session.activeTilesetId]
      : []),
    ...(snapshot.workspace.session.activeTemplateId !== undefined
      ? [snapshot.workspace.session.activeTemplateId]
      : []),
    ...(worldContext !== undefined ? [worldContext.worldId] : [])
  ];
}

export function deriveProjectDockViewState(
  snapshot: EditorRuntimeSnapshot
): ProjectDockViewState {
  return {
    tree: buildProjectTree(
      snapshot.bootstrap.project.assetRoots,
      snapshot.bootstrap.projectAssets
    ),
    activeDocumentIds: collectActiveProjectDocumentIds(snapshot)
  };
}

export function resolveProjectDockActivation(
  snapshot: EditorRuntimeSnapshot,
  asset: ProjectAssetSummary
): ProjectDockActivationTarget | undefined {
  if (asset.documentId === undefined) {
    return undefined;
  }

  switch (asset.kind) {
    case "map":
      return {
        kind: "map",
        documentId: asset.documentId
      };
    case "world": {
      const world = snapshot.workspace.worlds.find((entry) => entry.id === asset.documentId);
      const firstMapPath = world?.maps[0]?.fileName;
      const firstMapAsset =
        firstMapPath !== undefined
          ? snapshot.bootstrap.projectAssets.find(
              (entry) =>
                entry.kind === "map" &&
                entry.path === firstMapPath &&
                entry.documentId !== undefined
            )
          : undefined;

      if (firstMapAsset?.documentId === undefined) {
        return undefined;
      }

      return {
        kind: "map",
        documentId: firstMapAsset.documentId
      };
    }
    case "tileset":
      return {
        kind: "tileset",
        documentId: asset.documentId
      };
    case "template":
      return {
        kind: "template",
        documentId: asset.documentId
      };
    default:
      return undefined;
  }
}

export function deriveEditorShellDialogsViewState(
  snapshot: EditorRuntimeSnapshot
): EditorShellDialogsViewState {
  return {
    issuesPanelOpen: snapshot.runtime.issues.panelOpen,
    project: snapshot.workspace.project,
    projectPropertyTypes: snapshot.workspace.project.propertyTypes
  };
}

export function deriveTilePropertiesEditorViewState(input: {
  activeMap: EditorMap | undefined;
  propertyTypes: readonly PropertyTypeDefinition[] | undefined;
  tileset: TilesetDefinition;
  selectedLocalId: number | null;
}): TilePropertiesEditorViewState {
  const propertyTypes = input.propertyTypes ?? [];
  const selectedTile =
    input.selectedLocalId !== null
      ? input.tileset.tiles.find((tile) => tile.localId === input.selectedLocalId)
      : undefined;

  return {
    ...(selectedTile !== undefined
      ? {
          tile: {
            localId: selectedTile.localId,
            className: selectedTile.className ?? "",
            probability: selectedTile.probability,
            properties: selectedTile.properties,
            suggestedProperties: createSuggestedPropertiesForClassType(
              propertyTypes,
              selectedTile.className,
              "tile"
            ),
            ...(selectedTile.imageSource !== undefined
              ? { imageSource: selectedTile.imageSource }
              : {})
          }
        }
      : {}),
    propertyTypes,
    objectReferenceOptions: buildObjectReferenceOptions(input.activeMap)
  };
}

export function deriveTileSelectionControlsViewState(input: {
  clipboard: ClipboardState;
  selection: SelectionState;
  canEditTiles: boolean;
}): TileSelectionControlsViewState | undefined {
  const bounds = getTileSelectionBounds(input.selection);

  if (!bounds || input.selection.kind !== "tile") {
    return undefined;
  }

  const clipboard: TileSelectionClipboardSummaryViewState =
    input.clipboard.kind === "tile"
      ? (() => {
          const footprint = getTileStampFootprint(input.clipboard.stamp);
          return {
            kind: "tile",
            width: footprint.width,
            height: footprint.height
          } satisfies TileSelectionClipboardSummaryViewState;
        })()
      : input.clipboard.kind === "object"
        ? {
            kind: "object",
            objectCount: input.clipboard.objects.length
          }
        : { kind: "empty" };

  return {
    canEditTiles: input.canEditTiles,
    hasTileClipboard: input.clipboard.kind === "tile",
    selectionWidth: bounds.width,
    selectionHeight: bounds.height,
    selectionCellCount: input.selection.coordinates.length,
    clipboard
  };
}

export function deriveTilesetsPanelViewState(
  snapshot: EditorRuntimeSnapshot
): TilesetsPanelViewState {
  const activeMap = snapshot.activeMap;
  const allTilesets = snapshot.workspace.tilesets;
  const availableTilesets = activeMap
    ? activeMap.tilesetIds
        .map((tilesetId) => allTilesets.find((tileset) => tileset.id === tilesetId))
        .filter((tileset): tileset is TilesetDefinition => tileset !== undefined)
    : allTilesets;
  const activeStampGid = getTileStampPrimaryGid(snapshot.workspace.session.activeStamp);
  const stampResolution =
    activeMap && activeStampGid !== null
      ? resolveMapTileGid(activeMap, allTilesets, activeStampGid)
      : undefined;
  const activeTileset =
    availableTilesets.find(
      (tileset) => tileset.id === snapshot.workspace.session.activeTilesetId
    ) ??
    stampResolution?.tileset ??
    availableTilesets[0];
  const activeTileIds = activeTileset ? listTilesetLocalIds(activeTileset) : [];
  const selectedLocalId =
    activeTileset &&
    snapshot.workspace.session.activeTilesetTileLocalId !== null &&
    activeTileIds.includes(snapshot.workspace.session.activeTilesetTileLocalId)
      ? snapshot.workspace.session.activeTilesetTileLocalId
      : activeTileIds[0] ?? null;
  const selectedTile =
    activeTileset && selectedLocalId !== null
      ? getTilesetTileByLocalId(activeTileset, selectedLocalId)
      : undefined;
  const activeTileEntries = activeTileset
    ? activeTileIds.map((localId) => {
        const gid =
          activeMap !== undefined
            ? getMapGlobalTileGid(activeMap, allTilesets, activeTileset.id, localId)
            : undefined;

        return {
          localId,
          isSelected: selectedLocalId === localId,
          preview: buildTileVisualViewState({
            tileset: activeTileset,
            localId,
            ...(gid !== undefined ? { gid } : {})
          })
        };
      })
    : [];
  const stampSummary: TilesetsPanelStampSummaryViewState =
    snapshot.workspace.session.activeStamp.kind === "pattern"
      ? {
          kind: "pattern",
          width: snapshot.workspace.session.activeStamp.width,
          height: snapshot.workspace.session.activeStamp.height
        }
      : stampResolution && activeStampGid !== null
        ? {
            kind: "tile",
            gid: activeStampGid,
            localId: stampResolution.localId,
            tilesetName: stampResolution.tileset.name
          }
        : { kind: "none" };

  return {
    availableTilesets: availableTilesets.map((tileset) => ({
      id: tileset.id,
      name: tileset.name,
      kind: tileset.kind,
      tileWidth: tileset.tileWidth,
      tileHeight: tileset.tileHeight,
      tileCount: listTilesetLocalIds(tileset).length,
      isActive: tileset.id === activeTileset?.id
    })),
    ...(activeTileset !== undefined ? { activeTilesetId: activeTileset.id } : {}),
    ...(activeTileset !== undefined ? { activeTilesetKind: activeTileset.kind } : {}),
    ...(activeTileset !== undefined ? { activeTileWidth: activeTileset.tileWidth } : {}),
    ...(activeTileset !== undefined ? { activeTileHeight: activeTileset.tileHeight } : {}),
    ...(activeTileset?.kind === "image" && getImageTilesetColumns(activeTileset) !== undefined
      ? { activeImageColumns: getImageTilesetColumns(activeTileset)! }
      : {}),
    selectedLocalId,
    ...(selectedTile?.className !== undefined
      ? { selectedTileClassName: selectedTile.className }
      : {}),
    ...(activeTileset !== undefined && selectedLocalId !== null
      ? {
          selectedTilePreview: buildTileVisualViewState({
            tileset: activeTileset,
            localId: selectedLocalId,
            ...(activeStampGid !== null ? { gid: activeStampGid } : {})
          })
        }
      : {}),
    activeTileEntries,
    stampSummary,
    ...(activeTileset !== undefined
      ? {
          tilePropertiesEditorViewState: deriveTilePropertiesEditorViewState({
            activeMap,
            propertyTypes: snapshot.workspace.project.propertyTypes,
            tileset: activeTileset,
            selectedLocalId
          }),
          tilesetDetailsViewState: {
            kind: activeTileset.kind,
            name: activeTileset.name,
            tileWidth: activeTileset.tileWidth,
            tileHeight: activeTileset.tileHeight,
            tileOffsetX: activeTileset.tileOffsetX,
            tileOffsetY: activeTileset.tileOffsetY,
            objectAlignment: activeTileset.objectAlignment,
            tileRenderSize: activeTileset.tileRenderSize,
            fillMode: activeTileset.fillMode,
            imagePath:
              activeTileset.kind === "image" && activeTileset.source
                ? activeTileset.source.imagePath
                : "",
            ...(activeTileset.kind === "image" && activeTileset.source?.imageWidth !== undefined
              ? { imageWidth: activeTileset.source.imageWidth }
              : {}),
            ...(activeTileset.kind === "image" && activeTileset.source?.imageHeight !== undefined
              ? { imageHeight: activeTileset.source.imageHeight }
              : {}),
            margin:
              activeTileset.kind === "image" && activeTileset.source
                ? activeTileset.source.margin
                : 0,
            spacing:
              activeTileset.kind === "image" && activeTileset.source
                ? activeTileset.source.spacing
                : 0,
            ...(activeTileset.kind === "image" && activeTileset.source?.columns !== undefined
              ? { columns: activeTileset.source.columns }
              : {})
          }
        }
      : {})
  };
}

export function deriveTileAnimationEditorViewState(
  snapshot: EditorRuntimeSnapshot
): TileAnimationEditorViewState | undefined {
  const activeTileset = snapshot.activeTileset;
  const selectedLocalId = snapshot.workspace.session.activeTilesetTileLocalId;

  if (!activeTileset) {
    return undefined;
  }

  const sourceTileIds = listTilesetLocalIds(activeTileset);
  const selectedTile =
    selectedLocalId !== null
      ? getTilesetTileByLocalId(activeTileset, selectedLocalId)
      : undefined;
  const frames = selectedTile?.animation ?? [];

  return {
    tilesetId: activeTileset.id,
    tilesetKind: activeTileset.kind,
    tileWidth: activeTileset.tileWidth,
    tileHeight: activeTileset.tileHeight,
    ...(activeTileset.kind === "image" && getImageTilesetColumns(activeTileset) !== undefined
      ? { imageColumns: getImageTilesetColumns(activeTileset)! }
      : {}),
    selectedLocalId,
    frames: frames.map((frame) => ({
      tileId: frame.tileId,
      durationMs: frame.durationMs,
      preview: buildTileVisualViewState({
        tileset: activeTileset,
        localId: frame.tileId
      })
    })),
    sourceTiles: sourceTileIds.map((localId) => ({
      localId,
      preview: buildTileVisualViewState({
        tileset: activeTileset,
        localId
      })
    }))
  };
}

export function deriveTileCollisionEditorViewState(
  snapshot: EditorRuntimeSnapshot
): TileCollisionEditorViewState | undefined {
  const activeTileset = snapshot.activeTileset;
  const selectedLocalId = snapshot.workspace.session.activeTilesetTileLocalId;

  if (!activeTileset) {
    return undefined;
  }

  const selectedTile =
    selectedLocalId !== null
      ? getTilesetTileByLocalId(activeTileset, selectedLocalId)
      : undefined;
  const collisionObjects = selectedTile?.collisionLayer?.objects ?? [];

  return {
    selectedLocalId,
    collisionObjects,
    propertyTypes: snapshot.workspace.project.propertyTypes,
    ...(selectedTile !== undefined && selectedLocalId !== null
        ? {
            canvas: {
              tileWidth: activeTileset.tileWidth,
              tileHeight: activeTileset.tileHeight,
              tilePreview: buildTileVisualViewState({
                tileset: activeTileset,
                localId: selectedLocalId
              }),
              previewMap: buildTileCollisionPreviewMap({
                tileWidth: activeTileset.tileWidth,
                tileHeight: activeTileset.tileHeight,
                objects: collisionObjects
              }),
              objects: collisionObjects
            }
          }
      : {})
  };
}

export function deriveEditorShellViewState(
  snapshot: EditorRuntimeSnapshot
): EditorShellViewState {
  const activeMap = snapshot.activeMap;
  const activeObject = selectActiveObject(snapshot);
  const activeDocument = selectActiveDocumentSummary(snapshot);
  const worldContext = snapshot.worldContext;

  return {
    ...(activeObject !== undefined ? { activeObject } : {}),
    ...(activeDocument !== undefined ? { activeDocument } : {}),
    activeLayerIndex:
      activeMap?.layers.findIndex((layer) => layer.id === snapshot.workspace.session.activeLayerId) ?? -1,
    activeProjectDocumentIds: collectActiveProjectDocumentIds(snapshot),
    canMoveWorldMaps: worldContext?.modifiable ?? false
  };
}

export function deriveEditorShellChromeViewState(input: {
  snapshot: EditorRuntimeSnapshot;
  customTypesEditorOpen: boolean;
}): EditorShellChromeViewState {
  const { snapshot, customTypesEditorOpen } = input;
  const activeMap = snapshot.activeMap;
  const activeDocument = selectActiveDocumentSummary(snapshot);
  const activeLayerIndex =
    activeMap?.layers.findIndex((layer) => layer.id === snapshot.workspace.session.activeLayerId) ??
    -1;

  return {
    menuContext: {
      activeDocumentKind: activeDocument?.kind,
      canUndo: snapshot.canUndo,
      canRedo: snapshot.canRedo,
      canSaveActiveDocument: snapshot.canSaveActiveDocument,
      canSaveAllDocuments: snapshot.canSaveAllDocuments,
      canExportActiveDocument: snapshot.canExportActiveDocument,
      canExportActiveMapImage: snapshot.canExportActiveMapImage,
      showGrid: snapshot.bootstrap.viewport.showGrid,
      showWorlds: snapshot.workspace.session.showWorlds,
      autoMapWhileDrawing: snapshot.workspace.session.autoMapWhileDrawing,
      highlightCurrentLayer: snapshot.workspace.session.highlightCurrentLayer,
      hasProject: true,
      hasActiveMap: activeMap !== undefined,
      hasAutomappingRulesFile: Boolean(snapshot.workspace.project.automappingRulesFile),
      hasActiveLayer: snapshot.workspace.session.activeLayerId !== undefined,
      hasSiblingLayers: Boolean(activeMap && activeMap.layers.length > 1 && activeLayerIndex >= 0),
      hasWorldContext: snapshot.worldContext !== undefined,
      canMoveWorldMaps: snapshot.worldContext?.modifiable ?? false,
      canMoveLayerUp: Boolean(activeMap && activeLayerIndex > 0),
      canMoveLayerDown: Boolean(
        activeMap &&
          activeLayerIndex >= 0 &&
          activeLayerIndex < activeMap.layers.length - 1
      ),
      customTypesEditorOpen
    },
    activeTool: snapshot.workspace.session.activeTool,
    shapeFillMode: snapshot.workspace.session.shapeFillMode,
    canUseWorldTool: snapshot.worldContext?.modifiable ?? false,
    ...(snapshot.workspace.session.activeLayerId !== undefined
      ? { activeLayerId: snapshot.workspace.session.activeLayerId }
      : {})
  };
}

export function isEditorShellMainToolbarActionDisabled(
  viewState: EditorShellChromeViewState,
  actionId: string
): boolean {
  switch (actionId) {
    case "save":
      return !viewState.menuContext.canSaveActiveDocument;
    case "undo":
      return !viewState.menuContext.canUndo;
    case "redo":
      return !viewState.menuContext.canRedo;
    default:
      return false;
  }
}

export function isEditorShellToolActionDisabled(
  viewState: EditorShellChromeViewState,
  editorToolId: EditorToolId | undefined
): boolean {
  return editorToolId === "world-tool" && !viewState.canUseWorldTool;
}

export function isEditorShellToolOptionActive(
  viewState: EditorShellChromeViewState,
  actionId: string
): boolean {
  return (
    (actionId === "shape-fill-rectangle" && viewState.shapeFillMode === "rectangle") ||
    (actionId === "shape-fill-ellipse" && viewState.shapeFillMode === "ellipse")
  );
}

export function deriveObjectsPanelViewState(
  snapshot: EditorRuntimeSnapshot
): ObjectsPanelViewState {
  const activeLayer = snapshot.activeLayer?.kind === "object" ? snapshot.activeLayer : undefined;
  const selectedObjectIds =
    snapshot.workspace.session.selection.kind === "object"
      ? new Set(snapshot.workspace.session.selection.objectIds)
      : new Set<string>();
  const hasTemplateInstanceSelection =
    activeLayer !== undefined &&
    activeLayer.objects.some((object) =>
      selectedObjectIds.has(object.id) && object.templateId !== undefined
    );

  return {
    ...(snapshot.activeTemplate?.name !== undefined
      ? { activeTemplateName: snapshot.activeTemplate.name }
      : {}),
    clipboardObjectCount:
      snapshot.runtime.clipboard.kind === "object"
        ? snapshot.runtime.clipboard.objects.length
        : 0,
    hasActiveLayer: activeLayer !== undefined,
    hasObjectClipboard: snapshot.runtime.clipboard.kind === "object",
    hasObjectSelection: selectedObjectIds.size > 0,
    hasTemplateInstanceSelection,
    objects: (activeLayer?.objects ?? []).map((object) => ({
      id: object.id,
      name: object.name,
      shape: object.shape,
      x: object.x,
      y: object.y,
      width: object.width,
      height: object.height,
      isSelected: selectedObjectIds.has(object.id)
    }))
  };
}

export function deriveEditorStatusBarViewState(
  snapshot: EditorRuntimeSnapshot
): EditorStatusBarViewState {
  const issueSummary = summarizeEditorIssues(snapshot.runtime.issues);

  return {
    ...(snapshot.workspace.session.activeLayerId !== undefined
      ? { activeLayerId: snapshot.workspace.session.activeLayerId }
      : {}),
    ...(snapshot.activeLayer !== undefined ? { activeLayerKind: snapshot.activeLayer.kind } : {}),
    errorCount: issueSummary.errorCount,
    warningCount: issueSummary.warningCount,
    layerOptions: [...(snapshot.activeMap?.layers ?? [])]
      .reverse()
      .map((layer) => ({
        id: layer.id,
        name: layer.name
      })),
    zoom: snapshot.bootstrap.viewport.zoom
  };
}

export function deriveLayersPanelViewState(
  snapshot: EditorRuntimeSnapshot
): LayersPanelViewState {
  const activeMap = snapshot.activeMap;
  const activeLayerId = snapshot.workspace.session.activeLayerId;
  const activeLayerIndex =
    activeMap?.layers.findIndex((layer) => layer.id === activeLayerId) ?? -1;
  const otherLayers = activeMap?.layers.filter((layer) => layer.id !== activeLayerId) ?? [];
  const hasActiveLayer = activeLayerIndex >= 0;

  return {
    layers: activeMap
      ? [...activeMap.layers].reverse().map((layer) => ({
          id: layer.id,
          kind: layer.kind,
          name: layer.name,
          visible: layer.visible,
          locked: layer.locked,
          isSelected: layer.id === activeLayerId
        }))
      : [],
    hasMap: activeMap !== undefined,
    hasActiveLayer,
    canMoveActiveLayerUp: Boolean(activeMap && activeLayerIndex > 0),
    canMoveActiveLayerDown: Boolean(
      activeMap &&
        activeLayerIndex >= 0 &&
        activeLayerIndex < activeMap.layers.length - 1
    ),
    hasSiblingLayers: hasActiveLayer && otherLayers.length > 0,
    otherLayersHidden: otherLayers.length > 0 && otherLayers.every((layer) => !layer.visible),
    otherLayersLocked: otherLayers.length > 0 && otherLayers.every((layer) => layer.locked),
    highlightCurrentLayer: snapshot.workspace.session.highlightCurrentLayer
  };
}

export function deriveMapPropertiesPanelViewState(
  snapshot: EditorRuntimeSnapshot
): MapPropertiesPanelViewState | undefined {
  const activeMap = snapshot.activeMap;

  if (!activeMap) {
    return undefined;
  }

  return {
    name: activeMap.name,
    orientation: activeMap.settings.orientation,
    renderOrder: activeMap.settings.renderOrder,
    width: activeMap.settings.width,
    height: activeMap.settings.height,
    tileWidth: activeMap.settings.tileWidth,
    tileHeight: activeMap.settings.tileHeight,
    infinite: activeMap.settings.infinite ?? false,
    backgroundColor: activeMap.settings.backgroundColor ?? ""
  };
}

export function deriveMiniMapPanelViewState(
  snapshot: EditorRuntimeSnapshot
): MiniMapPanelViewState | undefined {
  const activeMap = snapshot.activeMap;

  if (!activeMap) {
    return undefined;
  }

  const mapWidthTiles = Math.max(activeMap.settings.width, activeMap.settings.infinite ? 48 : 1);
  const mapHeightTiles = Math.max(activeMap.settings.height, activeMap.settings.infinite ? 48 : 1);
  const mapWidthPx = Math.max(mapWidthTiles * activeMap.settings.tileWidth, 1);
  const mapHeightPx = Math.max(mapHeightTiles * activeMap.settings.tileHeight, 1);
  const maxDimension = Math.max(mapWidthTiles, mapHeightTiles, 1);
  const viewportWidthPercent = clamp(
    100 / Math.max(snapshot.bootstrap.viewport.zoom, 0.25),
    14,
    100
  );
  const viewportHeightPercent = clamp(
    100 / Math.max(snapshot.bootstrap.viewport.zoom, 0.25),
    14,
    100
  );

  return {
    mapName: activeMap.name,
    mapWidth: activeMap.settings.width,
    mapHeight: activeMap.settings.height,
    infinite: activeMap.settings.infinite ?? false,
    previewWidthPercent: (mapWidthTiles / maxDimension) * 100,
    previewHeightPercent: (mapHeightTiles / maxDimension) * 100,
    viewportLeftPercent: clamp(
      (snapshot.bootstrap.viewport.originX / mapWidthPx) * 100,
      0,
      100 - viewportWidthPercent
    ),
    viewportTopPercent: clamp(
      (snapshot.bootstrap.viewport.originY / mapHeightPx) * 100,
      0,
      100 - viewportHeightPercent
    ),
    viewportWidthPercent,
    viewportHeightPercent,
    viewportZoom: snapshot.bootstrap.viewport.zoom
  };
}

export function deriveWorldContextOverlayViewState(
  snapshot: EditorRuntimeSnapshot
): WorldContextOverlayViewState | undefined {
  const activeMap = snapshot.activeMap;
  const worldContext = snapshot.worldContext;

  if (!activeMap || !worldContext) {
    return undefined;
  }

  return {
    activeMap,
    activeTool: snapshot.workspace.session.activeTool,
    viewport: snapshot.bootstrap.viewport,
    visible:
      snapshot.workspace.session.showWorlds ||
      snapshot.workspace.session.activeTool === "world-tool",
    modifiable: worldContext.modifiable,
    activeMapRect: {
      x: worldContext.activeMapRect.x,
      y: worldContext.activeMapRect.y
    },
    maps: worldContext.maps.map((mapEntry) => ({
      worldId: mapEntry.worldId,
      ...(mapEntry.mapId !== undefined ? { mapId: mapEntry.mapId } : {}),
      fileName: mapEntry.fileName,
      name: mapEntry.name,
      x: mapEntry.x,
      y: mapEntry.y,
      width: mapEntry.width,
      height: mapEntry.height,
      active: mapEntry.active,
      canActivate: mapEntry.canActivate,
      ...(mapEntry.gridWidth !== undefined ? { gridWidth: mapEntry.gridWidth } : {}),
      ...(mapEntry.gridHeight !== undefined ? { gridHeight: mapEntry.gridHeight } : {})
    }))
  };
}

export function deriveRendererCanvasViewState(
  snapshot: EditorRuntimeSnapshot
): RendererCanvasViewState {
  const selectedObjectIds =
    snapshot.workspace.session.selection.kind === "object"
      ? [...snapshot.workspace.session.selection.objectIds]
      : [];
  const selectedTiles =
    snapshot.workspace.session.selection.kind === "tile"
      ? [...snapshot.workspace.session.selection.coordinates]
      : undefined;
  const previewTiles =
    snapshot.runtime.interactions.canvasPreview.kind !== "none"
      ? [...snapshot.runtime.interactions.canvasPreview.coordinates]
      : undefined;
  const objectTransformPreview =
    snapshot.runtime.interactions.objectTransformPreview.kind === "object-move"
      ? {
          kind: "move" as const,
          objectIds: [...snapshot.runtime.interactions.objectTransformPreview.objectIds],
          deltaX: snapshot.runtime.interactions.objectTransformPreview.deltaX,
          deltaY: snapshot.runtime.interactions.objectTransformPreview.deltaY
        }
      : snapshot.runtime.interactions.objectTransformPreview.kind === "object-resize"
        ? {
            kind: "resize" as const,
            objectId: snapshot.runtime.interactions.objectTransformPreview.objectId,
            x: snapshot.runtime.interactions.objectTransformPreview.x,
            y: snapshot.runtime.interactions.objectTransformPreview.y,
            width: snapshot.runtime.interactions.objectTransformPreview.width,
            height: snapshot.runtime.interactions.objectTransformPreview.height
          }
        : { kind: "none" as const };
  const worldOverlay = deriveWorldContextOverlayViewState(snapshot);

  return {
    activeTool: snapshot.workspace.session.activeTool,
    selectedObjectIds,
    render: {
      tilesets: [...snapshot.workspace.tilesets],
      viewport: snapshot.bootstrap.viewport,
      ...(snapshot.activeMap !== undefined ? { map: snapshot.activeMap } : {}),
      ...(snapshot.workspace.session.highlightCurrentLayer &&
      snapshot.workspace.session.activeLayerId !== undefined
        ? { highlightedLayerId: snapshot.workspace.session.activeLayerId }
        : {}),
      ...(selectedObjectIds.length > 0 ? { selectedObjectIds } : {}),
      ...(selectedTiles !== undefined ? { selectedTiles } : {}),
      ...(previewTiles !== undefined ? { previewTiles } : {}),
      ...(objectTransformPreview.kind !== "none"
        ? { objectTransformPreview }
        : {})
    },
    ...(worldOverlay !== undefined ? { worldOverlay } : {})
  };
}

export function deriveMapImageExportViewState(
  snapshot: EditorRuntimeSnapshot
): MapImageExportViewState | undefined {
  const activeMap = snapshot.activeMap;

  if (!activeMap) {
    return undefined;
  }

  return {
    snapshot: {
      map: activeMap,
      tilesets: [...snapshot.workspace.tilesets],
      viewport: {
        zoom: 1,
        originX: 0,
        originY: 0,
        showGrid: false
      }
    },
    width: Math.max(1, activeMap.settings.width) * activeMap.settings.tileWidth,
    height: Math.max(1, activeMap.settings.height) * activeMap.settings.tileHeight
  };
}

export function deriveIssuesPanelViewState(
  snapshot: EditorRuntimeSnapshot
): IssuesPanelViewState {
  return {
    issues: snapshot.runtime.issues.entries.map((issue) => ({
      id: issue.id,
      sourceKind: issue.sourceKind,
      documentName: issue.documentName,
      ...(issue.documentPath !== undefined ? { documentPath: issue.documentPath } : {}),
      severity: issue.severity,
      code: issue.code,
      message: issue.message,
      path: issue.path
    }))
  };
}

export function deriveTerrainSetsPanelViewState(
  snapshot: EditorRuntimeSnapshot
): TerrainSetsPanelViewState {
  const activeMap = snapshot.activeMap;
  const allTilesets = snapshot.workspace.tilesets;
  const availableTilesets = activeMap
    ? activeMap.tilesetIds
        .map((tilesetId) => allTilesets.find((tileset) => tileset.id === tilesetId))
        .filter((tileset): tileset is TilesetDefinition => tileset !== undefined)
    : allTilesets;
  const activeTileset =
    availableTilesets.find(
      (tileset) => tileset.id === snapshot.workspace.session.activeTilesetId
    ) ?? availableTilesets[0];

  return {
    availableTilesets: availableTilesets.map((tileset) => ({
      id: tileset.id,
      name: tileset.name,
      isActive: tileset.id === activeTileset?.id
    })),
    ...(activeTileset !== undefined ? { activeTilesetId: activeTileset.id } : {}),
    ...(activeTileset !== undefined ? { activeTilesetName: activeTileset.name } : {}),
    wangSets: (activeTileset?.wangSets ?? []).map((wangSet) => ({
      id: wangSet.id,
      name: wangSet.name,
      type: wangSet.type
    }))
  };
}

export function derivePropertiesInspectorViewState(
  snapshot: EditorRuntimeSnapshot
): PropertiesInspectorViewState {
  const activeMap = snapshot.activeMap;
  const activeLayer = snapshot.activeLayer;
  const activeObject = selectActiveObject(snapshot);

  return {
    ...(activeMap !== undefined
      ? {
          map: {
            name: activeMap.name,
            orientation: activeMap.settings.orientation,
            renderOrder: activeMap.settings.renderOrder,
            width: activeMap.settings.width,
            height: activeMap.settings.height,
            tileWidth: activeMap.settings.tileWidth,
            tileHeight: activeMap.settings.tileHeight,
            parallaxOriginX: activeMap.settings.parallaxOriginX ?? 0,
            parallaxOriginY: activeMap.settings.parallaxOriginY ?? 0,
            infinite: activeMap.settings.infinite ?? false,
            backgroundColor: activeMap.settings.backgroundColor ?? "",
            properties: activeMap.properties
          }
        }
      : {}),
    ...(activeLayer !== undefined
      ? {
          layer: {
            kind: activeLayer.kind,
            name: activeLayer.name,
            className: activeLayer.className ?? "",
            visible: activeLayer.visible,
            locked: activeLayer.locked,
            opacity: activeLayer.opacity,
            offsetX: activeLayer.offsetX,
            offsetY: activeLayer.offsetY,
            parallaxX: activeLayer.parallaxX,
            parallaxY: activeLayer.parallaxY,
            tintColor: activeLayer.tintColor ?? "",
            blendMode: activeLayer.blendMode ?? "normal",
            properties: activeLayer.properties,
            ...(activeLayer.kind === "object" ? { drawOrder: activeLayer.drawOrder } : {}),
            ...(activeLayer.kind === "image"
              ? {
                  imagePath: activeLayer.imagePath,
                  repeatX: activeLayer.repeatX,
                  repeatY: activeLayer.repeatY
                }
              : {})
          }
        }
      : {}),
    ...(activeObject !== undefined
      ? {
          object: {
            shape: activeObject.shape,
            name: activeObject.name,
            className: activeObject.className ?? "",
            x: activeObject.x,
            y: activeObject.y,
            width: activeObject.width,
            height: activeObject.height,
            rotation: activeObject.rotation,
            visible: activeObject.visible,
            properties: activeObject.properties
          }
        }
      : {}),
    propertyTypes: snapshot.workspace.project.propertyTypes,
    objectReferenceOptions: buildObjectReferenceOptions(activeMap)
  };
}
