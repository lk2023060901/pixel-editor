import {
  getTileLayerCell,
  type EditorMap,
  type LayerDefinition,
  type LayerId,
  type ObjectId,
  type TileLayer
} from "@pixel-editor/domain";
import { Application, Container, Graphics, Text } from "pixi.js";

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
import { drawProjectedObjects } from "./object-layer-render";

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

export interface RendererViewportSnapshot {
  zoom: number;
  originX: number;
  originY: number;
  showGrid: boolean;
}

export interface RendererSnapshot {
  map?: EditorMap;
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

function drawTileLayers(scene: Container, snapshot: RendererSnapshot, geometry: ViewportGeometry): void {
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

        const screenX = geometry.gridOriginX + tileX * geometry.tileWidth - snapshot.viewport.originX;
        const screenY = geometry.gridOriginY + tileY * geometry.tileHeight - snapshot.viewport.originY;
        const inset = Math.max(1, Math.min(4, geometry.tileWidth * 0.08));
        const radius = Math.min(geometry.tileWidth, geometry.tileHeight) * 0.18;

        graphics.roundRect(
          screenX + inset,
          screenY + inset,
          geometry.tileWidth - inset * 2,
          geometry.tileHeight - inset * 2,
          radius
        );
        graphics.fill({
          color: colorForGid(cell.gid),
          alpha: Math.max(0.2, Math.min(0.85, entry.opacity * 0.85))
        });

        if (entry.highlighted) {
          graphics.roundRect(
            screenX + inset,
            screenY + inset,
            geometry.tileWidth - inset * 2,
            geometry.tileHeight - inset * 2,
            radius
          );
          graphics.stroke({
            color: 0xf8fafc,
            width: 1.25,
            alpha: 0.95
          });
        }
      }
    }

    scene.addChild(graphics);
  }
}

function drawSelectionOverlay(
  scene: Container,
  snapshot: RendererSnapshot,
  geometry: ViewportGeometry
): void {
  if (!snapshot.selectedTiles?.length) {
    return;
  }

  const overlay = new Graphics();

  for (const coordinate of snapshot.selectedTiles) {
    const screenX =
      geometry.gridOriginX + coordinate.x * geometry.tileWidth - snapshot.viewport.originX;
    const screenY =
      geometry.gridOriginY + coordinate.y * geometry.tileHeight - snapshot.viewport.originY;
    const radius = Math.min(geometry.tileWidth, geometry.tileHeight) * 0.18;

    overlay.roundRect(screenX, screenY, geometry.tileWidth, geometry.tileHeight, radius);
    overlay.fill({ color: 0x10b981, alpha: 0.2 });
    overlay.stroke({ color: 0x34d399, width: 1.5, alpha: 1 });
  }

  scene.addChild(overlay);
}

function drawObjectLayers(
  scene: Container,
  snapshot: RendererSnapshot,
  geometry: ViewportGeometry
): void {
  if (!snapshot.map) {
    return;
  }

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

  drawProjectedObjects(scene, projectedObjects, geometry);
}

function drawPreviewOverlay(
  scene: Container,
  snapshot: RendererSnapshot,
  geometry: ViewportGeometry
): void {
  if (!snapshot.previewTiles?.length) {
    return;
  }

  const overlay = new Graphics();

  for (const coordinate of snapshot.previewTiles) {
    const screenX =
      geometry.gridOriginX + coordinate.x * geometry.tileWidth - snapshot.viewport.originX;
    const screenY =
      geometry.gridOriginY + coordinate.y * geometry.tileHeight - snapshot.viewport.originY;
    const radius = Math.min(geometry.tileWidth, geometry.tileHeight) * 0.18;

    overlay.roundRect(screenX, screenY, geometry.tileWidth, geometry.tileHeight, radius);
    overlay.fill({ color: 0xf59e0b, alpha: 0.16 });
    overlay.stroke({ color: 0xfbbf24, width: 1.25, alpha: 0.95 });
  }

  scene.addChild(overlay);
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
  drawObjectLayers(scene, snapshot, geometry);
  drawPreviewOverlay(scene, snapshot, geometry);
  drawSelectionOverlay(scene, snapshot, geometry);
}

export async function exportRendererSnapshotImageDataUrl(input: {
  snapshot: RendererSnapshot;
  width: number;
  height: number;
  layout?: Partial<RendererLayoutMetrics>;
  labels?: {
    noActiveMap?: string;
  };
  mimeType?: "image/png" | "image/jpeg" | "image/webp";
}): Promise<string> {
  const app = new Application();
  const layout = createRendererLayoutMetrics(input.layout);

  await app.init({
    width: input.width,
    height: input.height,
    antialias: true,
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

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });

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
  const layout = createRendererLayoutMetrics(options.layout);

  function renderSnapshot(snapshot: RendererSnapshot): void {
    if (!mountedHost || !app) {
      return;
    }

    mountedHost.dataset.activeMap = snapshot.map?.id ?? "";
    mountedHost.dataset.zoom = String(snapshot.viewport.zoom);

    for (const child of app.stage.removeChildren()) {
      child.destroy({ children: true });
    }

    const scene = new Container();
    app.stage.addChild(scene);

    const width = app.renderer.width;
    const height = app.renderer.height;
    buildScene(scene, snapshot, width, height, layout, options.labels);
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

      if (options.mode === "object") {
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
    }
  };
}
