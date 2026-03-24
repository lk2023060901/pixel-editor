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
  pickProjectedObject
} from "./object-layer";
import { drawProjectedObjects } from "./object-layer-render";

export {
  createRendererLayoutMetrics,
  defaultRendererLayoutMetrics,
  type RendererLayoutMetrics
} from "./layout";

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
}

export type RendererPickResult =
  | { kind: "none" }
  | { kind: "layer"; layerId: LayerId }
  | { kind: "object"; objectId: ObjectId }
  | { kind: "tile"; x: number; y: number };

export interface RendererPickOptions {
  mode?: "tile" | "object" | "topmost";
}

export interface EditorRenderer {
  mount(host: HTMLElement): Promise<void>;
  update(snapshot: RendererSnapshot): void;
  pick(clientX: number, clientY: number, options?: RendererPickOptions): RendererPickResult;
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

export function createPixiEditorRenderer(options: {
  layout?: Partial<RendererLayoutMetrics>;
} = {}): EditorRenderer {
  let app: Application | undefined;
  let mountedHost: HTMLElement | undefined;
  let lastSnapshot: RendererSnapshot | undefined;
  const layout = createRendererLayoutMetrics(options.layout);

  return {
    async mount(host) {
      mountedHost = host;
      app = new Application();
      await app.init({
        resizeTo: host,
        antialias: true,
        backgroundAlpha: 0
      });
      mountedHost.dataset.renderer = "pixi-shell";
      mountedHost.replaceChildren(app.canvas);
    },
    update(snapshot) {
      lastSnapshot = snapshot;

      if (mountedHost && app) {
        mountedHost.dataset.activeMap = snapshot.map?.id ?? "";
        mountedHost.dataset.zoom = String(snapshot.viewport.zoom);

        for (const child of app.stage.removeChildren()) {
          child.destroy({ children: true });
        }

        const scene = new Container();
        app.stage.addChild(scene);

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

        const background = new Graphics();
        background.roundRect(
          layout.framePadding,
          layout.framePadding,
          frameWidth,
          frameHeight,
          layout.frameRadius
        );
        background.fill({ color: 0x020617, alpha: 0.92 });
        background.stroke({ color: 0x334155, width: 1.5, alpha: 0.95 });
        scene.addChild(background);

        if (!snapshot.map) {
          const emptyText = new Text({
            text: "No active map",
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

        const map = snapshot.map;
        const zoom = snapshot.viewport.zoom;
        const geometry = buildViewportGeometry(
          map,
          snapshot.viewport,
          width,
          height,
          layout
        );

        if (snapshot.viewport.showGrid) {
          const grid = new Graphics();

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

          grid.stroke({ color: 0x1e293b, width: 1, alpha: 0.9 });
          scene.addChild(grid);
        }

        const titleText = new Text({
          text: `${map.name} · ${map.settings.orientation}`,
          style: {
            fill: 0xf8fafc,
            fontSize: 20,
            fontWeight: "600",
            fontFamily: "IBM Plex Sans, sans-serif"
          }
        });
        titleText.position.set(
          layout.framePadding + layout.titleOffsetX,
          layout.framePadding + layout.titleOffsetY
        );
        scene.addChild(titleText);

        const subtitleText = new Text({
          text: `Layers ${map.layers.length} · Tiles ${map.settings.tileWidth}×${map.settings.tileHeight} · Zoom ${zoom.toFixed(2)}x`,
          style: {
            fill: 0x94a3b8,
            fontSize: 13,
            fontFamily: "IBM Plex Sans, sans-serif"
          }
        });
        subtitleText.position.set(
          layout.framePadding + layout.titleOffsetX,
          layout.framePadding + layout.subtitleOffsetY
        );
        scene.addChild(subtitleText);

        if (!map.settings.infinite) {
          const bounds = new Graphics();
          bounds.roundRect(
            geometry.gridOriginX - snapshot.viewport.originX,
            geometry.gridOriginY - snapshot.viewport.originY,
            map.settings.width * geometry.tileWidth,
            map.settings.height * geometry.tileHeight,
            14
          );
          bounds.stroke({ color: 0x475569, width: 1.5, alpha: 0.8 });
          scene.addChild(bounds);
        }

        drawTileLayers(scene, snapshot, geometry);
        drawObjectLayers(scene, snapshot, geometry);
        drawPreviewOverlay(scene, snapshot, geometry);
        drawSelectionOverlay(scene, snapshot, geometry);
      }
    },
    pick(clientX, clientY, options = {}) {
      if (!mountedHost || !lastSnapshot?.map) {
        return { kind: "none" };
      }

      const rect = mountedHost.getBoundingClientRect();
      const localX = clientX - rect.left;
      const localY = clientY - rect.top;
      const geometry = buildViewportGeometry(
        lastSnapshot.map,
        lastSnapshot.viewport,
        mountedHost.clientWidth,
        mountedHost.clientHeight,
        layout
      );

      if (
        localX < geometry.canvasX ||
        localY < geometry.canvasY ||
        localX > geometry.canvasX + geometry.canvasWidth ||
        localY > geometry.canvasY + geometry.canvasHeight
      ) {
        return { kind: "none" };
      }

      const projectedObjects = collectProjectedMapObjects({
        map: lastSnapshot.map,
        geometry,
        viewport: lastSnapshot.viewport,
        ...(lastSnapshot.highlightedLayerId !== undefined
          ? { highlightedLayerId: lastSnapshot.highlightedLayerId }
          : {}),
        ...(lastSnapshot.selectedObjectIds !== undefined
          ? { selectedObjectIds: lastSnapshot.selectedObjectIds }
          : {})
      });
      const pickedObjectId = pickProjectedObject(projectedObjects, localX, localY);

      if (options.mode === "object") {
        return pickedObjectId ? { kind: "object", objectId: pickedObjectId } : { kind: "none" };
      }

      const tileX = Math.floor(
        (localX - geometry.gridOriginX + lastSnapshot.viewport.originX) / geometry.tileWidth
      );
      const tileY = Math.floor(
        (localY - geometry.gridOriginY + lastSnapshot.viewport.originY) / geometry.tileHeight
      );

      if (tileX < 0 || tileY < 0) {
        return { kind: "none" };
      }

      if (
        !lastSnapshot.map.settings.infinite &&
        (tileX >= lastSnapshot.map.settings.width || tileY >= lastSnapshot.map.settings.height)
      ) {
        return options.mode === "topmost" && pickedObjectId
          ? { kind: "object", objectId: pickedObjectId }
          : { kind: "none" };
      }

      const tilePick: RendererPickResult = {
        kind: "tile",
        x: tileX,
        y: tileY
      };

      if (options.mode === "tile") {
        return tilePick;
      }

      return pickedObjectId ? { kind: "object", objectId: pickedObjectId } : tilePick;
    },
    destroy() {
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
