import {
  getTileLayerCell,
  type EditorMap,
  type LayerDefinition,
  type LayerId,
  type ObjectId,
  type TilesetDefinition,
  type TileLayer
} from "@pixel-editor/domain";
import {
  Application,
  Assets,
  Container,
  Graphics,
  Matrix,
  Rectangle,
  Sprite,
  Text,
  Texture,
  type TextStyleFontWeight
} from "pixi.js";

import {
  createRendererLayoutMetrics,
  type RendererLayoutMetrics
} from "./layout";
import {
  collectProjectedMapObjects,
  type ObjectProjectionGeometry,
  type ObjectProjectionViewport,
  type ObjectTransformPreview,
  type ProjectedMapObject,
  pickProjectedObject
} from "./object-layer";
import {
  createProjectedObjectSceneNodes,
  destroyProjectedObjectSceneNodes,
  drawProjectedObjects,
  type ProjectedObjectSceneNodes,
  updateProjectedObjectScene
} from "./object-layer-render";
import {
  getProjectedObjectSelectionControls,
  pickProjectedObjectSelectionHandle,
  type ProjectedObjectTransformHandle
} from "./object-selection";
import { getRendererMode, type RendererMode } from "./renderer-mode";
import {
  createBoundsRenderSignature,
  createGridRenderSignature,
  createProjectedObjectRenderSignature,
  createProjectedObjectSelectionSignature,
  createProjectedObjectsRenderSignature,
  createTileLayerSegmentRenderSignature,
  createTileLayersRenderSignature,
  createTileOverlayRenderSignature,
  type TileLayerRenderGroupToken
} from "./renderer-signature";
import { resolveTileTexture } from "./tile-texture";
import { createTileTransformMatrix } from "./tile-transform";
import { collectVisibleTileSegments } from "./tile-visibility";
import type { ResolvedTileTexture } from "./tile-texture";

export {
  createRendererLayoutMetrics,
  defaultRendererLayoutMetrics,
  type RendererLayoutMetrics
} from "./layout";
export {
  collectProjectedMapObjects,
  pickProjectedObject,
  type ObjectProjectionGeometry,
  type ObjectProjectionViewport,
  type ObjectTransformPreview,
  type ProjectedMapObject
} from "./object-layer";
export {
  createRendererRegressionCases,
  type RendererRegressionCase
} from "./regression-fixtures";

export interface RendererViewportSnapshot {
  zoom: number;
  originX: number;
  originY: number;
  showGrid: boolean;
}

export interface RendererSnapshot {
  map?: EditorMap;
  tilesets: TilesetDefinition[];
  viewport: RendererViewportSnapshot;
  highlightedLayerId?: LayerId;
  selectedObjectIds?: ObjectId[];
  selectedTiles?: Array<{ x: number; y: number }>;
  previewTiles?: Array<{ x: number; y: number }>;
  objectTransformPreview?: ObjectTransformPreview;
}

export type RendererPickResult =
  | { kind: "none" }
  | { kind: "layer"; layerId: LayerId }
  | { kind: "object"; objectId: ObjectId }
  | { kind: "object-handle"; handle: ProjectedObjectTransformHandle }
  | { kind: "tile"; x: number; y: number };

export interface RendererPickOptions {
  mode?: "tile" | "object" | "topmost";
}

export type RendererLocationResult =
  | { kind: "none" }
  | {
      kind: "map";
      worldX: number;
      worldY: number;
      tileX: number;
      tileY: number;
    };

export interface RendererViewportProjection {
  canvasX: number;
  canvasY: number;
  canvasWidth: number;
  canvasHeight: number;
  mapLeft: number;
  mapTop: number;
  pixelScaleX: number;
  pixelScaleY: number;
}

export interface RendererProjectedRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface EditorRenderer {
  mount(host: HTMLElement): Promise<void>;
  update(snapshot: RendererSnapshot): void;
  pick(clientX: number, clientY: number, options?: RendererPickOptions): RendererPickResult;
  locate(clientX: number, clientY: number): RendererLocationResult;
  destroy(): void;
}

interface ViewportGeometry {
  canvasX: number;
  canvasY: number;
  canvasWidth: number;
  canvasHeight: number;
  tileWidth: number;
  tileHeight: number;
  gridOriginX: number;
  gridOriginY: number;
  startTileX: number;
  startTileY: number;
  endTileX: number;
  endTileY: number;
}

interface RenderableTileLayer {
  layer: TileLayer;
  opacity: number;
  highlighted: boolean;
}

interface LocatedMapPoint {
  localX: number;
  localY: number;
  geometry: ViewportGeometry;
  worldX: number;
  worldY: number;
  tileX: number;
  tileY: number;
}

interface ResolvedVisibleTileCell {
  x: number;
  y: number;
  cell: {
    gid: number;
    flipHorizontally: boolean;
    flipVertically: boolean;
    flipDiagonally: boolean;
  };
  texture: ResolvedTileTexture | undefined;
}

interface ResolvedRenderableTileLayer {
  layerId: LayerId;
  opacity: number;
  highlighted: boolean;
  segments: ResolvedRenderableTileSegment[];
}

interface ResolvedRenderableTileSegment {
  key: string;
  originTileX: number;
  originTileY: number;
  cells: ResolvedVisibleTileCell[];
}

interface RendererSceneNodes {
  root: Container;
  background: Graphics;
  titleText: Text;
  subtitleText: Text;
  emptyStateText: Text;
  unsupportedText: Text;
  grid: Graphics;
  bounds: Graphics;
  tileLayers: Container;
  objectLayers: Container;
  objectSelectionOverlay: Graphics;
  previewOverlay: Graphics;
  selectionOverlay: Graphics;
}

interface RendererSectionCache {
  mode: RendererMode | undefined;
  tileLayersSignature: string | undefined;
  objectLayersSignature: string | undefined;
  objectSelectionSignature: string | undefined;
  previewSignature: string | undefined;
  selectionSignature: string | undefined;
  gridSignature: string | undefined;
  boundsSignature: string | undefined;
}

interface TileSegmentSceneNodes {
  root: Container;
  graphics: Graphics;
  sprites: Container;
  signature: string | undefined;
}

interface TileLayerSceneNodes {
  root: Container;
  segments: Map<string, TileSegmentSceneNodes>;
}

interface ObjectLayerSceneNodes {
  objects: Map<ObjectId, ProjectedObjectSceneNodes>;
}

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

function computeCanvasBounds(
  width: number,
  height: number,
  layout: RendererLayoutMetrics
) {
  const canvasX = layout.framePadding + layout.canvasOffsetX;
  const canvasY = layout.framePadding + layout.canvasOffsetY;

  return {
    canvasX,
    canvasY,
    canvasWidth: Math.max(layout.minCanvasWidth, width - canvasX - layout.framePadding),
    canvasHeight: Math.max(
      layout.minCanvasHeight,
      height - canvasY - layout.framePadding
    )
  };
}

function buildViewportGeometry(
  map: EditorMap,
  viewport: RendererViewportSnapshot,
  width: number,
  height: number,
  layout: RendererLayoutMetrics
): ViewportGeometry {
  const tileWidth = Math.max(12, Math.min(72, map.settings.tileWidth * viewport.zoom));
  const tileHeight = Math.max(12, Math.min(72, map.settings.tileHeight * viewport.zoom));
  const { canvasX, canvasY, canvasWidth, canvasHeight } = computeCanvasBounds(
    width,
    height,
    layout
  );
  const gridOriginX = canvasX - positiveModulo(viewport.originX, tileWidth);
  const gridOriginY = canvasY - positiveModulo(viewport.originY, tileHeight);
  const visibleColumns = Math.ceil(canvasWidth / tileWidth) + 1;
  const visibleRows = Math.ceil(canvasHeight / tileHeight) + 1;
  const startTileX = Math.floor(viewport.originX / tileWidth);
  const startTileY = Math.floor(viewport.originY / tileHeight);

  return {
    canvasX,
    canvasY,
    canvasWidth,
    canvasHeight,
    tileWidth,
    tileHeight,
    gridOriginX,
    gridOriginY,
    startTileX,
    startTileY,
    endTileX: startTileX + visibleColumns,
    endTileY: startTileY + visibleRows
  };
}

export function resolveRendererViewportProjection(input: {
  map: EditorMap;
  viewport: RendererViewportSnapshot;
  width: number;
  height: number;
  layout?: Partial<RendererLayoutMetrics>;
}): RendererViewportProjection {
  const layout = createRendererLayoutMetrics(input.layout);
  const geometry = buildViewportGeometry(
    input.map,
    input.viewport,
    input.width,
    input.height,
    layout
  );

  return {
    canvasX: geometry.canvasX,
    canvasY: geometry.canvasY,
    canvasWidth: geometry.canvasWidth,
    canvasHeight: geometry.canvasHeight,
    mapLeft: geometry.gridOriginX - input.viewport.originX,
    mapTop: geometry.gridOriginY - input.viewport.originY,
    pixelScaleX: geometry.tileWidth / input.map.settings.tileWidth,
    pixelScaleY: geometry.tileHeight / input.map.settings.tileHeight
  };
}

export function projectWorldRectToScreenRect(input: {
  projection: RendererViewportProjection;
  activeWorldRect: {
    x: number;
    y: number;
  };
  worldRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}): RendererProjectedRect {
  return {
    left:
      input.projection.mapLeft +
      (input.worldRect.x - input.activeWorldRect.x) * input.projection.pixelScaleX,
    top:
      input.projection.mapTop +
      (input.worldRect.y - input.activeWorldRect.y) * input.projection.pixelScaleY,
    width: input.worldRect.width * input.projection.pixelScaleX,
    height: input.worldRect.height * input.projection.pixelScaleY
  };
}

function collectRenderableTileLayers(
  layers: LayerDefinition[],
  highlightedLayerId?: LayerId,
  inheritedVisible = true,
  inheritedOpacity = 1
): RenderableTileLayer[] {
  const renderableLayers: RenderableTileLayer[] = [];

  for (const layer of layers) {
    const isVisible = inheritedVisible && layer.visible;
    const nextOpacity = inheritedOpacity * layer.opacity;

    if (!isVisible) {
      continue;
    }

    if (layer.kind === "group") {
      renderableLayers.push(
        ...collectRenderableTileLayers(
          layer.layers,
          highlightedLayerId,
          isVisible,
          nextOpacity
        )
      );
      continue;
    }

    if (layer.kind !== "tile") {
      continue;
    }

    renderableLayers.push({
      layer,
      opacity: nextOpacity,
      highlighted: layer.id === highlightedLayerId
    });
  }

  return renderableLayers;
}

function colorForGid(gid: number): number {
  const seed = (gid * 2654435761) % 0xffffff;
  return (seed | 0x335500) & 0xffffff;
}

function locateMapPoint(
  host: HTMLElement,
  snapshot: RendererSnapshot,
  clientX: number,
  clientY: number,
  layout: RendererLayoutMetrics,
  options: {
    requireInsideCanvas?: boolean;
  } = {}
): LocatedMapPoint | undefined {
  if (!snapshot.map) {
    return undefined;
  }

  const rect = host.getBoundingClientRect();
  const localX = clientX - rect.left;
  const localY = clientY - rect.top;
  const geometry = buildViewportGeometry(
    snapshot.map,
    snapshot.viewport,
    host.clientWidth,
    host.clientHeight,
    layout
  );

  if (
    options.requireInsideCanvas !== false &&
    (localX < geometry.canvasX ||
      localY < geometry.canvasY ||
      localX > geometry.canvasX + geometry.canvasWidth ||
      localY > geometry.canvasY + geometry.canvasHeight)
  ) {
    return undefined;
  }

  const worldX =
    ((localX - geometry.gridOriginX + snapshot.viewport.originX) / geometry.tileWidth) *
    snapshot.map.settings.tileWidth;
  const worldY =
    ((localY - geometry.gridOriginY + snapshot.viewport.originY) / geometry.tileHeight) *
    snapshot.map.settings.tileHeight;

  return {
    localX,
    localY,
    geometry,
    worldX,
    worldY,
    tileX: Math.floor(worldX / snapshot.map.settings.tileWidth),
    tileY: Math.floor(worldY / snapshot.map.settings.tileHeight)
  };
}

function drawTilePlaceholder(
  graphics: Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  gid: number,
  alpha: number,
  highlighted: boolean
): void {
  const inset = Math.max(1, Math.min(4, width * 0.08));
  const radius = Math.min(width, height) * 0.18;

  graphics.roundRect(
    x + inset,
    y + inset,
    width - inset * 2,
    height - inset * 2,
    radius
  );
  graphics.fill({
    color: colorForGid(gid),
    alpha: Math.max(0.2, Math.min(0.85, alpha * 0.85))
  });

  if (!highlighted) {
    return;
  }

  graphics.roundRect(
    x + inset,
    y + inset,
    width - inset * 2,
    height - inset * 2,
    radius
  );
  graphics.stroke({
    color: 0xf8fafc,
    width: 1.25,
    alpha: 0.95
  });
}

function drawTileLayers(
  scene: Container,
  snapshot: RendererSnapshot,
  geometry: ViewportGeometry
): void {
  if (!snapshot.map) {
    return;
  }

  const tileLayers = collectRenderableTileLayers(snapshot.map.layers, snapshot.highlightedLayerId);

  for (const entry of tileLayers) {
    const graphics = new Graphics();

    for (let tileY = geometry.startTileY; tileY <= geometry.endTileY; tileY += 1) {
      for (let tileX = geometry.startTileX; tileX <= geometry.endTileX; tileX += 1) {
        if (
          !entry.layer.infinite &&
          (tileX < 0 ||
            tileY < 0 ||
            tileX >= snapshot.map.settings.width ||
            tileY >= snapshot.map.settings.height)
        ) {
          continue;
        }

        const cell = getTileLayerCell(entry.layer, tileX, tileY);

        if (!cell?.gid) {
          continue;
        }

        const screenX =
          geometry.gridOriginX + tileX * geometry.tileWidth - snapshot.viewport.originX;
        const screenY =
          geometry.gridOriginY + tileY * geometry.tileHeight - snapshot.viewport.originY;

        drawTilePlaceholder(
          graphics,
          screenX,
          screenY,
          geometry.tileWidth,
          geometry.tileHeight,
          cell.gid,
          entry.opacity,
          entry.highlighted
        );
      }
    }

    scene.addChild(graphics);
  }
}

function createFrameTexture(
  sourceTexture: Texture,
  frame: { x: number; y: number; width: number; height: number }
): Texture {
  return new Texture({
    source: sourceTexture.source,
    frame: new Rectangle(frame.x, frame.y, frame.width, frame.height),
    orig: new Rectangle(0, 0, frame.width, frame.height)
  });
}

function createTileSpriteMatrix(
  texture: Texture,
  cell: {
    flipHorizontally: boolean;
    flipVertically: boolean;
    flipDiagonally: boolean;
  },
  screenX: number,
  screenY: number,
  cellWidth: number,
  cellHeight: number
): Matrix {
  return createTileTransformMatrix({
    cell,
    textureWidth: texture.orig.width,
    textureHeight: texture.orig.height,
    cellWidth,
    cellHeight,
    screenX,
    screenY
  });
}

function createSceneText(options: {
  text: string;
  fontSize: number;
  fill: number;
  fontWeight?: TextStyleFontWeight;
  wordWrap?: boolean;
  wordWrapWidth?: number;
}): Text {
  const style = {
    fill: options.fill,
    fontSize: options.fontSize,
    fontFamily: "IBM Plex Sans, sans-serif",
    ...(options.fontWeight !== undefined
      ? { fontWeight: options.fontWeight }
      : {}),
    ...(options.wordWrap !== undefined ? { wordWrap: options.wordWrap } : {}),
    ...(options.wordWrapWidth !== undefined
      ? { wordWrapWidth: options.wordWrapWidth }
      : {})
  };

  return new Text({
    text: options.text,
    style
  });
}

function createRendererSceneNodes(labels?: {
  noActiveMap?: string;
}): RendererSceneNodes {
  const root = new Container();
  const background = new Graphics();
  const titleText = createSceneText({
    text: "",
    fill: 0xf8fafc,
    fontSize: 20,
    fontWeight: "600"
  });
  const subtitleText = createSceneText({
    text: "",
    fill: 0x94a3b8,
    fontSize: 13
  });
  const emptyStateText = createSceneText({
    text: labels?.noActiveMap ?? "No active map",
    fill: 0xe2e8f0,
    fontSize: 18
  });
  const unsupportedText = createSceneText({
    text: "Canvas rendering and picking currently support orthogonal maps only.",
    fill: 0xfbbf24,
    fontSize: 14,
    wordWrap: true,
    wordWrapWidth: 240
  });
  const grid = new Graphics();
  const bounds = new Graphics();
  const tileLayers = new Container();
  const objectLayers = new Container();
  const objectSelectionOverlay = new Graphics();
  const previewOverlay = new Graphics();
  const selectionOverlay = new Graphics();

  root.addChild(background);
  root.addChild(titleText);
  root.addChild(subtitleText);
  root.addChild(emptyStateText);
  root.addChild(unsupportedText);
  root.addChild(grid);
  root.addChild(bounds);
  root.addChild(tileLayers);
  root.addChild(objectLayers);
  root.addChild(objectSelectionOverlay);
  root.addChild(previewOverlay);
  root.addChild(selectionOverlay);

  return {
    root,
    background,
    titleText,
    subtitleText,
    emptyStateText,
    unsupportedText,
    grid,
    bounds,
    tileLayers,
    objectLayers,
    objectSelectionOverlay,
    previewOverlay,
    selectionOverlay
  };
}

function clearContainerChildren(container: Container): void {
  for (const child of container.removeChildren()) {
    child.destroy({ children: true });
  }
}

function syncContainerChildren(
  container: Container,
  nextChildren: readonly Container[]
): void {
  if (
    container.children.length === nextChildren.length &&
    nextChildren.every((child, index) => container.children[index] === child)
  ) {
    return;
  }

  container.removeChildren();

  for (const child of nextChildren) {
    container.addChild(child);
  }
}

function setRendererModeVisibility(
  scene: RendererSceneNodes,
  mode: RendererMode
): void {
  scene.titleText.visible = mode !== "empty";
  scene.subtitleText.visible = mode !== "empty";
  scene.emptyStateText.visible = mode === "empty";
  scene.unsupportedText.visible = mode === "unsupported";
  scene.grid.visible = mode === "ready";
  scene.bounds.visible = mode === "ready";
  scene.tileLayers.visible = mode === "ready";
  scene.objectLayers.visible = mode === "ready";
  scene.objectSelectionOverlay.visible = mode === "ready";
  scene.previewOverlay.visible = mode === "ready";
  scene.selectionOverlay.visible = mode === "ready";
}

function createTileSegmentSceneNodes(): TileSegmentSceneNodes {
  const root = new Container();
  const sprites = new Container();
  const graphics = new Graphics();

  root.addChild(sprites);
  root.addChild(graphics);

  return {
    root,
    graphics,
    sprites,
    signature: undefined
  };
}

function destroyTileSegmentSceneNodes(segment: TileSegmentSceneNodes): void {
  segment.root.destroy({ children: true });
}

function createTileLayerSceneNodes(): TileLayerSceneNodes {
  return {
    root: new Container(),
    segments: new Map()
  };
}

function destroyTileLayerSceneNodes(layer: TileLayerSceneNodes): void {
  layer.root.destroy({ children: true });
}

function clearTileLayerSceneCache(
  scene: Container,
  cache: Map<LayerId, TileLayerSceneNodes>
): void {
  clearContainerChildren(scene);
  cache.clear();
}

function clearObjectSceneCache(
  scene: Container,
  cache: ObjectLayerSceneNodes
): void {
  clearContainerChildren(scene);
  cache.objects.clear();
}

function drawHighlightedTileStroke(
  graphics: Graphics,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  const radius = Math.min(width, height) * 0.18;

  graphics.roundRect(x, y, width, height, radius);
  graphics.stroke({
    color: 0xf8fafc,
    width: 1.25,
    alpha: 0.95
  });
}

function drawTileSegmentContent(
  scene: TileSegmentSceneNodes,
  segment: ResolvedRenderableTileSegment,
  layer: Pick<ResolvedRenderableTileLayer, "opacity" | "highlighted">,
  geometry: ViewportGeometry,
  options: {
    getSourceTexture: (imagePath: string) => Texture | undefined;
    getFrameTexture: (
      imagePath: string,
      frame: { x: number; y: number; width: number; height: number }
    ) => Texture | undefined;
  }
): void {
  scene.graphics.clear();
  clearContainerChildren(scene.sprites);

  for (const { x: tileX, y: tileY, cell, texture: tileTexture } of segment.cells) {
    const localX = (tileX - segment.originTileX) * geometry.tileWidth;
    const localY = (tileY - segment.originTileY) * geometry.tileHeight;
    const sourceTexture = tileTexture
      ? options.getSourceTexture(tileTexture.imagePath)
      : undefined;
    const texture =
      sourceTexture && tileTexture?.frame
        ? options.getFrameTexture(tileTexture.imagePath, tileTexture.frame)
        : sourceTexture;

    if (!texture) {
      drawTilePlaceholder(
        scene.graphics,
        localX,
        localY,
        geometry.tileWidth,
        geometry.tileHeight,
        cell.gid,
        layer.opacity,
        layer.highlighted
      );
      continue;
    }

    const sprite = new Sprite({
      texture,
      roundPixels: true
    });
    sprite.setFromMatrix(
      createTileSpriteMatrix(
        texture,
        cell,
        localX,
        localY,
        geometry.tileWidth,
        geometry.tileHeight
      )
    );
    sprite.alpha = layer.opacity;
    scene.sprites.addChild(sprite);

    if (layer.highlighted) {
      drawHighlightedTileStroke(
        scene.graphics,
        localX,
        localY,
        geometry.tileWidth,
        geometry.tileHeight
      );
    }
  }
}

function updateTileLayerScenes(
  scene: Container,
  cache: Map<LayerId, TileLayerSceneNodes>,
  layers: ResolvedRenderableTileLayer[],
  viewport: RendererViewportSnapshot,
  geometry: ViewportGeometry,
  options: {
    getSourceTexture: (imagePath: string) => Texture | undefined;
    getFrameTexture: (
      imagePath: string,
      frame: { x: number; y: number; width: number; height: number }
    ) => Texture | undefined;
    assetVersion: number;
  }
): void {
  const nextLayerIds = new Set(layers.map((layer) => layer.layerId));

  for (const [layerId, layerScene] of cache) {
    if (nextLayerIds.has(layerId)) {
      continue;
    }

    scene.removeChild(layerScene.root);
    destroyTileLayerSceneNodes(layerScene);
    cache.delete(layerId);
  }

  const orderedLayerRoots: Container[] = [];
  const baseX = geometry.gridOriginX - viewport.originX;
  const baseY = geometry.gridOriginY - viewport.originY;

  for (const layer of layers) {
    let layerScene = cache.get(layer.layerId);

    if (!layerScene) {
      layerScene = createTileLayerSceneNodes();
      cache.set(layer.layerId, layerScene);
    }

    const nextSegmentKeys = new Set(layer.segments.map((segment) => segment.key));

    for (const [segmentKey, segmentScene] of layerScene.segments) {
      if (nextSegmentKeys.has(segmentKey)) {
        continue;
      }

      layerScene.root.removeChild(segmentScene.root);
      destroyTileSegmentSceneNodes(segmentScene);
      layerScene.segments.delete(segmentKey);
    }

    const orderedSegmentRoots: Container[] = [];

    for (const segment of layer.segments) {
      let segmentScene = layerScene.segments.get(segment.key);

      if (!segmentScene) {
        segmentScene = createTileSegmentSceneNodes();
        layerScene.segments.set(segment.key, segmentScene);
      }

      segmentScene.root.position.set(
        baseX + segment.originTileX * geometry.tileWidth,
        baseY + segment.originTileY * geometry.tileHeight
      );
      orderedSegmentRoots.push(segmentScene.root);

      const signature = createTileLayerSegmentRenderSignature({
        opacity: layer.opacity,
        highlighted: layer.highlighted,
        tileWidth: geometry.tileWidth,
        tileHeight: geometry.tileHeight,
        assetVersion: options.assetVersion,
        cells: segment.cells.map((cell) => ({
          x: cell.x,
          y: cell.y,
          gid: cell.cell.gid,
          flipHorizontally: cell.cell.flipHorizontally,
          flipVertically: cell.cell.flipVertically,
          flipDiagonally: cell.cell.flipDiagonally,
          texture: cell.texture
        }))
      });

      if (segmentScene.signature !== signature) {
        segmentScene.signature = signature;
        drawTileSegmentContent(segmentScene, segment, layer, geometry, options);
      }
    }

    syncContainerChildren(layerScene.root, orderedSegmentRoots);
    orderedLayerRoots.push(layerScene.root);
  }

  syncContainerChildren(scene, orderedLayerRoots);
}

function drawSelectionOverlay(
  scene: Graphics,
  snapshot: RendererSnapshot,
  geometry: ViewportGeometry
): void {
  scene.clear();

  if (!snapshot.selectedTiles?.length) {
    return;
  }

  for (const coordinate of snapshot.selectedTiles) {
    const screenX =
      geometry.gridOriginX + coordinate.x * geometry.tileWidth - snapshot.viewport.originX;
    const screenY =
      geometry.gridOriginY + coordinate.y * geometry.tileHeight - snapshot.viewport.originY;
    const radius = Math.min(geometry.tileWidth, geometry.tileHeight) * 0.18;

    scene.roundRect(screenX, screenY, geometry.tileWidth, geometry.tileHeight, radius);
    scene.fill({ color: 0x10b981, alpha: 0.2 });
    scene.stroke({ color: 0x34d399, width: 1.5, alpha: 1 });
  }
}

function drawObjectLayers(
  scene: Container,
  objects: readonly ProjectedMapObject[],
  geometry: ViewportGeometry
): void {
  clearContainerChildren(scene);
  drawProjectedObjects(scene, objects, geometry);
}

function drawObjectSelectionOverlay(
  scene: Graphics,
  objects: readonly ProjectedMapObject[],
  geometry: ViewportGeometry
): void {
  scene.clear();

  const controls = getProjectedObjectSelectionControls(objects, geometry);

  if (!controls) {
    return;
  }

  const { bounds } = controls;
  const radius = Math.min(10, Math.max(4, Math.min(bounds.width, bounds.height) * 0.14));

  scene.roundRect(bounds.left, bounds.top, bounds.width, bounds.height, radius);
  scene.stroke({
    color: 0x38bdf8,
    width: 1.5,
    alpha: 0.95
  });

  scene.moveTo(bounds.centerX, bounds.top);
  scene.lineTo(
    bounds.centerX,
    controls.rotationHandle.y + controls.rotationHandle.radius
  );
  scene.stroke({
    color: 0x7dd3fc,
    width: 1.25,
    alpha: 0.9
  });

  scene.circle(
    controls.rotationHandle.x,
    controls.rotationHandle.y,
    controls.rotationHandle.radius
  );
  scene.fill({
    color: 0x020617,
    alpha: 0.96
  });
  scene.stroke({
    color: 0x7dd3fc,
    width: 1.25,
    alpha: 0.95
  });

  for (const handle of controls.resizeHandles) {
    scene.roundRect(
      handle.x - controls.handleHalf,
      handle.y - controls.handleHalf,
      controls.handleSize,
      controls.handleSize,
      2
    );
    scene.fill({
      color: 0xf8fafc,
      alpha: 0.96
    });
    scene.stroke({
      color: 0x0f172a,
      width: 1.25,
      alpha: 0.92
    });
  }
}

function updateObjectScenes(
  scene: Container,
  cache: ObjectLayerSceneNodes,
  objects: readonly ProjectedMapObject[],
  geometry: ViewportGeometry,
  tileTextures: ReadonlyMap<ObjectId, ResolvedTileTexture | undefined>,
  options: {
    getSourceTexture: (imagePath: string) => Texture | undefined;
    getFrameTexture: (
      imagePath: string,
      frame: { x: number; y: number; width: number; height: number }
    ) => Texture | undefined;
    assetVersion: number;
  }
): void {
  const nextObjectIds = new Set(objects.map((object) => object.objectId));

  for (const [objectId, objectScene] of cache.objects) {
    if (nextObjectIds.has(objectId)) {
      continue;
    }

    scene.removeChild(objectScene.root);
    destroyProjectedObjectSceneNodes(objectScene);
    cache.objects.delete(objectId);
  }

  const orderedObjectRoots: Container[] = [];

  for (const object of objects) {
    let objectScene = cache.objects.get(object.objectId);

    if (!objectScene) {
      objectScene = createProjectedObjectSceneNodes();
      cache.objects.set(object.objectId, objectScene);
    }

    objectScene.root.position.set(object.screenX, object.screenY);
    orderedObjectRoots.push(objectScene.root);

    const tileTexture = tileTextures.get(object.objectId);
    const signature = createProjectedObjectRenderSignature({
      object,
      tileTexture,
      assetVersion: options.assetVersion
    });

    if (objectScene.signature !== signature) {
      objectScene.signature = signature;
      updateProjectedObjectScene(objectScene, object, geometry, {
        tileTexture,
        textureResolver: {
          getSourceTexture: options.getSourceTexture,
          getFrameTexture: options.getFrameTexture
        }
      });
    }
  }

  syncContainerChildren(scene, orderedObjectRoots);
}

function drawPreviewOverlay(
  scene: Graphics,
  snapshot: RendererSnapshot,
  geometry: ViewportGeometry
): void {
  scene.clear();

  if (!snapshot.previewTiles?.length) {
    return;
  }

  for (const coordinate of snapshot.previewTiles) {
    const screenX =
      geometry.gridOriginX + coordinate.x * geometry.tileWidth - snapshot.viewport.originX;
    const screenY =
      geometry.gridOriginY + coordinate.y * geometry.tileHeight - snapshot.viewport.originY;
    const radius = Math.min(geometry.tileWidth, geometry.tileHeight) * 0.18;

    scene.roundRect(screenX, screenY, geometry.tileWidth, geometry.tileHeight, radius);
    scene.fill({ color: 0xf59e0b, alpha: 0.16 });
    scene.stroke({ color: 0xfbbf24, width: 1.25, alpha: 0.95 });
  }
}

function drawGridOverlay(
  scene: Container,
  snapshot: RendererSnapshot,
  geometry: ViewportGeometry
): void {
  if (!snapshot.map || !snapshot.viewport.showGrid) {
    return;
  }

  const grid = new Graphics();

  if (snapshot.map.settings.infinite) {
    for (let column = 0; column <= geometry.endTileX - geometry.startTileX; column += 1) {
      const x = geometry.gridOriginX + column * geometry.tileWidth;
      grid.moveTo(x, geometry.gridOriginY);
      grid.lineTo(x, geometry.gridOriginY + geometry.canvasHeight);
    }

    for (let row = 0; row <= geometry.endTileY - geometry.startTileY; row += 1) {
      const y = geometry.gridOriginY + row * geometry.tileHeight;
      grid.moveTo(geometry.gridOriginX, y);
      grid.lineTo(geometry.gridOriginX + geometry.canvasWidth, y);
    }
  } else {
    const mapLeft = geometry.gridOriginX - snapshot.viewport.originX;
    const mapTop = geometry.gridOriginY - snapshot.viewport.originY;
    const mapWidth = snapshot.map.settings.width * geometry.tileWidth;
    const mapHeight = snapshot.map.settings.height * geometry.tileHeight;

    for (let column = 0; column <= snapshot.map.settings.width; column += 1) {
      const x = mapLeft + column * geometry.tileWidth;
      grid.moveTo(x, mapTop);
      grid.lineTo(x, mapTop + mapHeight);
    }

    for (let row = 0; row <= snapshot.map.settings.height; row += 1) {
      const y = mapTop + row * geometry.tileHeight;
      grid.moveTo(mapLeft, y);
      grid.lineTo(mapLeft + mapWidth, y);
    }
  }

  grid.stroke({ color: 0x1e293b, width: 1, alpha: 0.9 });
  scene.addChild(grid);
}

function buildScene(
  scene: Container,
  snapshot: RendererSnapshot,
  width: number,
  height: number,
  layout: RendererLayoutMetrics,
  labels?: {
    noActiveMap?: string;
  }
): void {
  const background = new Graphics();
  background.rect(0, 0, width, height);
  background.fill({ color: 0x0b1220, alpha: 1 });
  scene.addChild(background);

  if (!snapshot.map) {
    const emptyText = new Text({
      text: labels?.noActiveMap ?? "",
      style: {
        fill: 0xe2e8f0,
        fontSize: 18,
        fontFamily: "IBM Plex Sans, sans-serif"
      }
    });
    emptyText.position.set(
      layout.framePadding + layout.emptyStateOffsetX,
      layout.framePadding + layout.emptyStateOffsetY
    );
    scene.addChild(emptyText);
    return;
  }

  const geometry = buildViewportGeometry(
    snapshot.map,
    snapshot.viewport,
    width,
    height,
    layout
  );

  drawTileLayers(scene, snapshot, geometry);
  drawGridOverlay(scene, snapshot, geometry);
  const projectedObjects = collectProjectedMapObjects({
    map: snapshot.map,
    geometry,
    viewport: snapshot.viewport,
    ...(snapshot.highlightedLayerId !== undefined
      ? { highlightedLayerId: snapshot.highlightedLayerId }
      : {}),
    ...(snapshot.selectedObjectIds !== undefined
      ? { selectedObjectIds: snapshot.selectedObjectIds }
      : {}),
    ...(snapshot.objectTransformPreview !== undefined
      ? { objectTransformPreview: snapshot.objectTransformPreview }
      : {})
  });
  const objectLayerScene = new Container();
  scene.addChild(objectLayerScene);
  const objectSelectionOverlay = new Graphics();
  scene.addChild(objectSelectionOverlay);
  drawObjectLayers(objectLayerScene, projectedObjects, geometry);
  drawObjectSelectionOverlay(objectSelectionOverlay, projectedObjects, geometry);
  const previewOverlay = new Graphics();
  scene.addChild(previewOverlay);
  drawPreviewOverlay(previewOverlay, snapshot, geometry);
  const selectionOverlay = new Graphics();
  scene.addChild(selectionOverlay);
  drawSelectionOverlay(selectionOverlay, snapshot, geometry);
}

async function waitForAnimationFrames(frameCount: number): Promise<void> {
  for (let index = 0; index < frameCount; index += 1) {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });
  }
}

export async function exportRendererSnapshotImageDataUrl(input: {
  snapshot: RendererSnapshot;
  width: number;
  height: number;
  layout?: Partial<RendererLayoutMetrics>;
  labels?: {
    noActiveMap?: string;
  };
  antialias?: boolean;
  mimeType?: "image/png" | "image/jpeg" | "image/webp";
}): Promise<string> {
  const app = new Application();
  const layout = createRendererLayoutMetrics(input.layout);

  await app.init({
    width: input.width,
    height: input.height,
    antialias: input.antialias ?? true,
    backgroundAlpha: 0
  });

  try {
    for (const child of app.stage.removeChildren()) {
      child.destroy({ children: true });
    }

    const scene = new Container();
    app.stage.addChild(scene);
    buildScene(
      scene,
      input.snapshot,
      input.width,
      input.height,
      layout,
      input.labels
    );

    app.render();
    await waitForAnimationFrames(2);
    app.render();

    return app.canvas.toDataURL(input.mimeType ?? "image/png");
  } finally {
    app.destroy(true, {
      children: true
    });
  }
}

export function createPixiEditorRenderer(options: {
  layout?: Partial<RendererLayoutMetrics>;
  labels?: {
    noActiveMap?: string;
  };
} = {}): EditorRenderer {
  let app: Application | undefined;
  let mountedHost: HTMLElement | undefined;
  let lastSnapshot: RendererSnapshot | undefined;
  let mountGeneration = 0;
  let sceneNodes: RendererSceneNodes | undefined;
  const layout = createRendererLayoutMetrics(options.layout);
  const sectionCache: RendererSectionCache = {
    mode: undefined,
    tileLayersSignature: undefined,
    objectLayersSignature: undefined,
    objectSelectionSignature: undefined,
    previewSignature: undefined,
    selectionSignature: undefined,
    gridSignature: undefined,
    boundsSignature: undefined
  };
  const sourceTextureCache = new Map<string, Texture>();
  const frameTextureCache = new Map<string, Texture>();
  const pendingTextureLoads = new Map<string, Promise<Texture>>();
  const failedTextureLoads = new Set<string>();
  const tileLayerSceneCache = new Map<LayerId, TileLayerSceneNodes>();
  const objectSceneCache: ObjectLayerSceneNodes = {
    objects: new Map()
  };
  let assetVersion = 0;

  function requestRender(): void {
    if (!lastSnapshot || !mountedHost || !app) {
      return;
    }

    renderSnapshot(lastSnapshot);
  }

  function ensureSourceTexture(imagePath: string): Texture | undefined {
    const cachedTexture = sourceTextureCache.get(imagePath);

    if (cachedTexture) {
      return cachedTexture;
    }

    if (!pendingTextureLoads.has(imagePath) && !failedTextureLoads.has(imagePath)) {
      const loadPromise = Assets.load<Texture>(imagePath)
        .then((texture) => {
          sourceTextureCache.set(imagePath, texture);
          pendingTextureLoads.delete(imagePath);
          assetVersion += 1;
          requestRender();
          return texture;
        })
        .catch((error) => {
          pendingTextureLoads.delete(imagePath);
          failedTextureLoads.add(imagePath);
          assetVersion += 1;
          console.error(`Failed to load tile texture: ${imagePath}`, error);
          requestRender();
          throw error;
        });

      pendingTextureLoads.set(imagePath, loadPromise);
    }

    return undefined;
  }

  function getFrameTexture(
    imagePath: string,
    frame: { x: number; y: number; width: number; height: number }
  ): Texture | undefined {
    const sourceTexture = ensureSourceTexture(imagePath);

    if (!sourceTexture) {
      return undefined;
    }

    const key = `${imagePath}:${frame.x}:${frame.y}:${frame.width}:${frame.height}`;
    const cachedTexture = frameTextureCache.get(key);

    if (cachedTexture) {
      return cachedTexture;
    }

    const nextTexture = createFrameTexture(sourceTexture, frame);
    frameTextureCache.set(key, nextTexture);
    return nextTexture;
  }

  function renderSnapshot(snapshot: RendererSnapshot): void {
    if (!mountedHost || !app || !sceneNodes) {
      return;
    }

    mountedHost.dataset.activeMap = snapshot.map?.id ?? "";
    mountedHost.dataset.zoom = String(snapshot.viewport.zoom);

    const width = app.renderer.width;
    const height = app.renderer.height;
    const frameWidth = Math.max(
      layout.minFrameWidth,
      width - layout.framePadding * 2
    );
    const frameHeight = Math.max(
      layout.minFrameHeight,
      height - layout.framePadding * 2
    );

    sceneNodes.background.clear();
    sceneNodes.background.roundRect(
      layout.framePadding,
      layout.framePadding,
      frameWidth,
      frameHeight,
      layout.frameRadius
    );
    sceneNodes.background.fill({ color: 0x020617, alpha: 0.92 });
    sceneNodes.background.stroke({ color: 0x334155, width: 1.5, alpha: 0.95 });

    const mode = getRendererMode(snapshot.map);
    setRendererModeVisibility(sceneNodes, mode);
    sectionCache.mode = mode;

    sceneNodes.emptyStateText.position.set(
      layout.framePadding + layout.emptyStateOffsetX,
      layout.framePadding + layout.emptyStateOffsetY
    );

    if (mode === "empty") {
      clearTileLayerSceneCache(sceneNodes.tileLayers, tileLayerSceneCache);
      clearObjectSceneCache(sceneNodes.objectLayers, objectSceneCache);
      sceneNodes.grid.clear();
      sceneNodes.bounds.clear();
      sceneNodes.previewOverlay.clear();
      sceneNodes.selectionOverlay.clear();
      sceneNodes.objectSelectionOverlay.clear();
      sectionCache.tileLayersSignature = undefined;
      sectionCache.objectLayersSignature = undefined;
      sectionCache.objectSelectionSignature = undefined;
      sectionCache.previewSignature = undefined;
      sectionCache.selectionSignature = undefined;
      sectionCache.gridSignature = undefined;
      sectionCache.boundsSignature = undefined;
      return;
    }

    const map = snapshot.map;

    if (!map) {
      return;
    }

    const zoom = snapshot.viewport.zoom;
    const geometry = buildViewportGeometry(
      map,
      snapshot.viewport,
      width,
      height,
      layout
    );

    sceneNodes.titleText.text = `${map.name} · ${map.settings.orientation}`;
    sceneNodes.titleText.position.set(
      layout.framePadding + layout.titleOffsetX,
      layout.framePadding + layout.titleOffsetY
    );
    sceneNodes.subtitleText.text =
      `Layers ${map.layers.length} · Tiles ${map.settings.tileWidth}×${map.settings.tileHeight} · Zoom ${zoom.toFixed(2)}x`;
    sceneNodes.subtitleText.position.set(
      layout.framePadding + layout.titleOffsetX,
      layout.framePadding + layout.subtitleOffsetY
    );

    sceneNodes.unsupportedText.style.wordWrapWidth = Math.max(
      frameWidth - layout.titleOffsetX * 2,
      240
    );
    sceneNodes.unsupportedText.position.set(
      layout.framePadding + layout.titleOffsetX,
      layout.framePadding + layout.subtitleOffsetY + 28
    );

    if (mode === "unsupported") {
      clearTileLayerSceneCache(sceneNodes.tileLayers, tileLayerSceneCache);
      clearObjectSceneCache(sceneNodes.objectLayers, objectSceneCache);
      sceneNodes.grid.clear();
      sceneNodes.bounds.clear();
      sceneNodes.previewOverlay.clear();
      sceneNodes.selectionOverlay.clear();
      sceneNodes.objectSelectionOverlay.clear();
      sectionCache.tileLayersSignature = undefined;
      sectionCache.objectLayersSignature = undefined;
      sectionCache.objectSelectionSignature = undefined;
      sectionCache.previewSignature = undefined;
      sectionCache.selectionSignature = undefined;
      sectionCache.gridSignature = undefined;
      sectionCache.boundsSignature = undefined;
      return;
    }

    const gridSignature = createGridRenderSignature({
      showGrid: snapshot.viewport.showGrid,
      gridOriginX: geometry.gridOriginX,
      gridOriginY: geometry.gridOriginY,
      canvasWidth: geometry.canvasWidth,
      canvasHeight: geometry.canvasHeight,
      tileWidth: geometry.tileWidth,
      tileHeight: geometry.tileHeight,
      startTileX: geometry.startTileX,
      startTileY: geometry.startTileY,
      endTileX: geometry.endTileX,
      endTileY: geometry.endTileY
    });

    if (sectionCache.gridSignature !== gridSignature) {
      sectionCache.gridSignature = gridSignature;
      sceneNodes.grid.clear();

      if (snapshot.viewport.showGrid) {
        for (let column = 0; column <= geometry.endTileX - geometry.startTileX; column += 1) {
          const x = geometry.gridOriginX + column * geometry.tileWidth;
          sceneNodes.grid.moveTo(x, geometry.gridOriginY);
          sceneNodes.grid.lineTo(x, geometry.gridOriginY + geometry.canvasHeight);
        }

        for (let row = 0; row <= geometry.endTileY - geometry.startTileY; row += 1) {
          const y = geometry.gridOriginY + row * geometry.tileHeight;
          sceneNodes.grid.moveTo(geometry.gridOriginX, y);
          sceneNodes.grid.lineTo(geometry.gridOriginX + geometry.canvasWidth, y);
        }

        sceneNodes.grid.stroke({ color: 0x1e293b, width: 1, alpha: 0.9 });
      }
    }

    const boundsSignature = createBoundsRenderSignature({
      infinite: map.settings.infinite,
      gridOriginX: geometry.gridOriginX,
      gridOriginY: geometry.gridOriginY,
      originX: snapshot.viewport.originX,
      originY: snapshot.viewport.originY,
      width: map.settings.width,
      height: map.settings.height,
      tileWidth: geometry.tileWidth,
      tileHeight: geometry.tileHeight
    });

    if (sectionCache.boundsSignature !== boundsSignature) {
      sectionCache.boundsSignature = boundsSignature;
      sceneNodes.bounds.clear();

      if (!map.settings.infinite) {
        sceneNodes.bounds.roundRect(
          geometry.gridOriginX - snapshot.viewport.originX,
          geometry.gridOriginY - snapshot.viewport.originY,
          map.settings.width * geometry.tileWidth,
          map.settings.height * geometry.tileHeight,
          14
        );
        sceneNodes.bounds.stroke({ color: 0x475569, width: 1.5, alpha: 0.8 });
      }
    }

    const resolvedTileLayers: ResolvedRenderableTileLayer[] = collectRenderableTileLayers(
      map.layers,
      snapshot.highlightedLayerId
    ).map((entry) => ({
      layerId: entry.layer.id,
      opacity: entry.opacity,
      highlighted: entry.highlighted,
      segments: collectVisibleTileSegments(entry.layer, {
        startTileX: geometry.startTileX,
        startTileY: geometry.startTileY,
        endTileX: geometry.endTileX,
        endTileY: geometry.endTileY
      }).map((segment) => ({
        key: segment.key,
        originTileX: segment.originTileX,
        originTileY: segment.originTileY,
        cells: segment.cells.map(({ x, y, cell }) => ({
          x,
          y,
          cell,
          texture: resolveTileTexture(map, snapshot.tilesets, cell.gid)
        }))
      }))
    }));
    const tileLayersSignature = createTileLayersRenderSignature({
      zoom: snapshot.viewport.zoom,
      originX: snapshot.viewport.originX,
      originY: snapshot.viewport.originY,
      tileWidth: geometry.tileWidth,
      tileHeight: geometry.tileHeight,
      assetVersion,
      layers: resolvedTileLayers.map<TileLayerRenderGroupToken>((layer) => ({
        layerId: layer.layerId,
        opacity: layer.opacity,
        highlighted: layer.highlighted,
        segments: layer.segments.map((segment) => ({
          key: segment.key,
          cells: segment.cells.map((cell) => ({
            x: cell.x,
            y: cell.y,
            gid: cell.cell.gid,
            flipHorizontally: cell.cell.flipHorizontally,
            flipVertically: cell.cell.flipVertically,
            flipDiagonally: cell.cell.flipDiagonally,
            texture: cell.texture
          }))
        }))
      }))
    });

    if (sectionCache.tileLayersSignature !== tileLayersSignature) {
      sectionCache.tileLayersSignature = tileLayersSignature;
      updateTileLayerScenes(sceneNodes.tileLayers, tileLayerSceneCache, resolvedTileLayers, snapshot.viewport, geometry, {
        getSourceTexture: ensureSourceTexture,
        getFrameTexture,
        assetVersion
      });
    }

    const projectedObjects = collectProjectedMapObjects({
      map,
      geometry,
      viewport: snapshot.viewport,
      ...(snapshot.highlightedLayerId !== undefined
        ? { highlightedLayerId: snapshot.highlightedLayerId }
        : {}),
      ...(snapshot.selectedObjectIds !== undefined
        ? { selectedObjectIds: snapshot.selectedObjectIds }
        : {}),
      ...(snapshot.objectTransformPreview !== undefined
        ? { objectTransformPreview: snapshot.objectTransformPreview }
        : {})
    });
    const objectTileTextures = new Map<ObjectId, ResolvedTileTexture | undefined>();

    for (const object of projectedObjects) {
      if (object.tileGid === undefined) {
        continue;
      }

      objectTileTextures.set(
        object.objectId,
        resolveTileTexture(map, snapshot.tilesets, object.tileGid)
      );
    }

    const objectLayersSignature = [
      objectTileTextures.size > 0 ? assetVersion : 0,
      createProjectedObjectsRenderSignature(projectedObjects)
    ].join("::");

    if (sectionCache.objectLayersSignature !== objectLayersSignature) {
      sectionCache.objectLayersSignature = objectLayersSignature;
      updateObjectScenes(
        sceneNodes.objectLayers,
        objectSceneCache,
        projectedObjects,
        geometry,
        objectTileTextures,
        {
          getSourceTexture: ensureSourceTexture,
          getFrameTexture,
          assetVersion
        }
      );
    }

    const objectSelectionSignature = createProjectedObjectSelectionSignature({
      objects: projectedObjects,
      tileWidth: geometry.tileWidth,
      tileHeight: geometry.tileHeight
    });

    if (sectionCache.objectSelectionSignature !== objectSelectionSignature) {
      sectionCache.objectSelectionSignature = objectSelectionSignature;
      drawObjectSelectionOverlay(
        sceneNodes.objectSelectionOverlay,
        projectedObjects,
        geometry
      );
    }

    const previewSignature = createTileOverlayRenderSignature({
      coordinates: snapshot.previewTiles,
      gridOriginX: geometry.gridOriginX,
      gridOriginY: geometry.gridOriginY,
      tileWidth: geometry.tileWidth,
      tileHeight: geometry.tileHeight
    });

    if (sectionCache.previewSignature !== previewSignature) {
      sectionCache.previewSignature = previewSignature;
      drawPreviewOverlay(sceneNodes.previewOverlay, snapshot, geometry);
    }

    const selectionSignature = createTileOverlayRenderSignature({
      coordinates: snapshot.selectedTiles,
      gridOriginX: geometry.gridOriginX,
      gridOriginY: geometry.gridOriginY,
      tileWidth: geometry.tileWidth,
      tileHeight: geometry.tileHeight
    });

    if (sectionCache.selectionSignature !== selectionSignature) {
      sectionCache.selectionSignature = selectionSignature;
      drawSelectionOverlay(sceneNodes.selectionOverlay, snapshot, geometry);
    }
  }

  return {
    async mount(host) {
      mountedHost = host;
      const nextApp = new Application();
      const currentGeneration = ++mountGeneration;

      await nextApp.init({
        resizeTo: host,
        antialias: true,
        backgroundAlpha: 0
      });
      if (mountGeneration !== currentGeneration || mountedHost !== host) {
        nextApp.destroy(true, {
          children: true
        });
        return;
      }

      app = nextApp;
      sceneNodes = createRendererSceneNodes(options.labels);
      app.stage.addChild(sceneNodes.root);
      mountedHost.dataset.renderer = "pixi-shell";
      mountedHost.replaceChildren(app.canvas);

      if (lastSnapshot) {
        renderSnapshot(lastSnapshot);
      }
    },
    update(snapshot) {
      lastSnapshot = snapshot;
      renderSnapshot(snapshot);
    },
    pick(clientX, clientY, options = {}) {
      if (!mountedHost || !lastSnapshot?.map) {
        return { kind: "none" };
      }

      if (getRendererMode(lastSnapshot.map) !== "ready") {
        return { kind: "none" };
      }

      const locatedPoint = locateMapPoint(
        mountedHost,
        lastSnapshot,
        clientX,
        clientY,
        layout
      );

      if (!locatedPoint) {
        return { kind: "none" };
      }

      const projectedObjects = collectProjectedMapObjects({
        map: lastSnapshot.map,
        geometry: locatedPoint.geometry,
        viewport: lastSnapshot.viewport,
        ...(lastSnapshot.highlightedLayerId !== undefined
          ? { highlightedLayerId: lastSnapshot.highlightedLayerId }
          : {}),
        ...(lastSnapshot.selectedObjectIds !== undefined
          ? { selectedObjectIds: lastSnapshot.selectedObjectIds }
          : {}),
        ...(lastSnapshot.objectTransformPreview !== undefined
          ? { objectTransformPreview: lastSnapshot.objectTransformPreview }
          : {})
      });
      const pickedObjectId = pickProjectedObject(
        projectedObjects,
        locatedPoint.localX,
        locatedPoint.localY
      );
      const pickedHandle = pickProjectedObjectSelectionHandle(
        projectedObjects,
        locatedPoint.geometry,
        locatedPoint.localX,
        locatedPoint.localY
      );

      if (options.mode === "object") {
        if (pickedHandle) {
          return { kind: "object-handle", handle: pickedHandle };
        }

        return pickedObjectId ? { kind: "object", objectId: pickedObjectId } : { kind: "none" };
      }

      if (locatedPoint.tileX < 0 || locatedPoint.tileY < 0) {
        return { kind: "none" };
      }

      if (
        !lastSnapshot.map.settings.infinite &&
        (locatedPoint.tileX >= lastSnapshot.map.settings.width ||
          locatedPoint.tileY >= lastSnapshot.map.settings.height)
      ) {
        if (options.mode === "topmost" && pickedHandle) {
          return { kind: "object-handle", handle: pickedHandle };
        }

        return options.mode === "topmost" && pickedObjectId
          ? { kind: "object", objectId: pickedObjectId }
          : { kind: "none" };
      }

      const tilePick: RendererPickResult = {
        kind: "tile",
        x: locatedPoint.tileX,
        y: locatedPoint.tileY
      };

      if (options.mode === "tile") {
        return tilePick;
      }

      if (pickedHandle) {
        return { kind: "object-handle", handle: pickedHandle };
      }

      return pickedObjectId ? { kind: "object", objectId: pickedObjectId } : tilePick;
    },
    locate(clientX, clientY) {
      if (!mountedHost || !lastSnapshot) {
        return { kind: "none" };
      }

      const point = locateMapPoint(mountedHost, lastSnapshot, clientX, clientY, layout, {
        requireInsideCanvas: false
      });

      if (!point) {
        return { kind: "none" };
      }

      return {
        kind: "map",
        worldX: point.worldX,
        worldY: point.worldY,
        tileX: point.tileX,
        tileY: point.tileY
      };
    },
    destroy() {
      mountGeneration += 1;

      if (sceneNodes) {
        clearTileLayerSceneCache(sceneNodes.tileLayers, tileLayerSceneCache);
        clearObjectSceneCache(sceneNodes.objectLayers, objectSceneCache);
      }

      if (app) {
        app.destroy(true, {
          children: true
        });
      }

      if (mountedHost) {
        delete mountedHost.dataset.renderer;
        delete mountedHost.dataset.activeMap;
        delete mountedHost.dataset.zoom;
        mountedHost.replaceChildren();
      }

      app = undefined;
      mountedHost = undefined;
      lastSnapshot = undefined;
      sceneNodes = undefined;
      sectionCache.mode = undefined;
      sectionCache.tileLayersSignature = undefined;
      sectionCache.objectLayersSignature = undefined;
      sectionCache.previewSignature = undefined;
      sectionCache.selectionSignature = undefined;
      sectionCache.gridSignature = undefined;
      sectionCache.boundsSignature = undefined;
      sourceTextureCache.clear();
      frameTextureCache.clear();
      pendingTextureLoads.clear();
      failedTextureLoads.clear();
      tileLayerSceneCache.clear();
      objectSceneCache.objects.clear();
    }
  };
}
