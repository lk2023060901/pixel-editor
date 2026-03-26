"use client";

import type {
  EditorWorldContextMapSnapshot,
  EditorWorldContextSnapshot
} from "@pixel-editor/app-services";
import type { EditorMap } from "@pixel-editor/domain";
import type { EditorToolId } from "@pixel-editor/editor-state";
import {
  projectWorldRectToScreenRect,
  resolveRendererViewportProjection,
  type RendererViewportSnapshot
} from "@pixel-editor/renderer-pixi";
import { useRef, useState } from "react";

const DRAG_START_DISTANCE = 4;

interface WorldContextOverlayProps {
  activeMap: EditorMap;
  viewport: RendererViewportSnapshot;
  worldContext: EditorWorldContextSnapshot;
  activeTool: EditorToolId;
  width: number;
  height: number;
  visible: boolean;
  onActivateMap?: ((mapId: string) => void) | undefined;
  onMoveWorldMap?: ((worldId: string, fileName: string, x: number, y: number) => void) | undefined;
  onStatusInfoChange?: ((statusInfo: string) => void) | undefined;
}

interface WorldMapDragState {
  pointerId: number;
  map: EditorWorldContextMapSnapshot;
  startClientX: number;
  startClientY: number;
  startX: number;
  startY: number;
  moved: boolean;
}

export function WorldContextOverlay({
  activeMap,
  viewport,
  worldContext,
  activeTool,
  width,
  height,
  visible,
  onActivateMap,
  onMoveWorldMap,
  onStatusInfoChange
}: WorldContextOverlayProps) {
  const dragStateRef = useRef<WorldMapDragState | undefined>(undefined);
  const [preview, setPreview] = useState<{ fileName: string; x: number; y: number } | undefined>(
    undefined
  );

  if (!visible || width <= 0 || height <= 0) {
    return null;
  }

  const projection = resolveRendererViewportProjection({
    map: activeMap,
    viewport,
    width,
    height
  });
  const projectedMaps = worldContext.maps.map((mapEntry) => {
    const worldX = preview?.fileName === mapEntry.fileName ? preview.x : mapEntry.x;
    const worldY = preview?.fileName === mapEntry.fileName ? preview.y : mapEntry.y;

    return {
      ...mapEntry,
      worldX,
      worldY,
      screenRect: projectWorldRectToScreenRect({
        projection,
        activeWorldRect: worldContext.activeMapRect,
        worldRect: {
          x: worldX,
          y: worldY,
          width: mapEntry.width,
          height: mapEntry.height
        }
      })
    };
  });

  function clearPreview(): void {
    setPreview(undefined);
    onStatusInfoChange?.("");
  }

  function readSnappedPosition(
    dragState: WorldMapDragState,
    event: { clientX: number; clientY: number; ctrlKey: boolean }
  ): { x: number; y: number } {
    const rawX =
      dragState.startX +
      (event.clientX - dragState.startClientX) / projection.pixelScaleX;
    const rawY =
      dragState.startY +
      (event.clientY - dragState.startClientY) / projection.pixelScaleY;

    if (event.ctrlKey) {
      return {
        x: Math.round(rawX),
        y: Math.round(rawY)
      };
    }

    const gridWidth = dragState.map.gridWidth ?? activeMap.settings.tileWidth;
    const gridHeight = dragState.map.gridHeight ?? activeMap.settings.tileHeight;

    return {
      x: Math.round(rawX / gridWidth) * gridWidth,
      y: Math.round(rawY / gridHeight) * gridHeight
    };
  }

  function commitDrag(event: { clientX: number; clientY: number; ctrlKey: boolean }): void {
    const dragState = dragStateRef.current;

    if (!dragState) {
      return;
    }

    dragStateRef.current = undefined;
    const nextPosition = readSnappedPosition(dragState, event);

    if (dragState.moved) {
      onMoveWorldMap?.(
        dragState.map.worldId,
        dragState.map.fileName,
        nextPosition.x,
        nextPosition.y
      );
    } else if (dragState.map.mapId !== undefined && dragState.map.canActivate) {
      onActivateMap?.(dragState.map.mapId);
    }

    clearPreview();
  }

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {projectedMaps.map((mapEntry) => {
        const isDraggable = activeTool === "world-tool" && worldContext.modifiable;

        return (
          <button
            key={mapEntry.fileName}
            className={`pointer-events-auto absolute overflow-hidden border text-left transition ${
              mapEntry.active
                ? "border-emerald-400/90 bg-emerald-500/10 shadow-[0_0_0_1px_rgba(16,185,129,0.25)]"
                : "border-slate-500/80 bg-slate-950/60 hover:border-slate-300/80"
            } ${mapEntry.canActivate || isDraggable ? "cursor-pointer" : "cursor-default"}`}
            style={{
              left: `${mapEntry.screenRect.left}px`,
              top: `${mapEntry.screenRect.top}px`,
              width: `${Math.max(mapEntry.screenRect.width, 18)}px`,
              height: `${Math.max(mapEntry.screenRect.height, 18)}px`
            }}
            onClick={() => {
              if (activeTool === "world-tool") {
                return;
              }

              if (mapEntry.mapId !== undefined && mapEntry.canActivate) {
                onActivateMap?.(mapEntry.mapId);
              }
            }}
            onPointerDown={(event) => {
              if (!isDraggable || event.button !== 0) {
                return;
              }

              dragStateRef.current = {
                pointerId: event.pointerId,
                map: mapEntry,
                startClientX: event.clientX,
                startClientY: event.clientY,
                startX: mapEntry.worldX,
                startY: mapEntry.worldY,
                moved: false
              };
              event.currentTarget.setPointerCapture(event.pointerId);
              event.preventDefault();
              event.stopPropagation();
            }}
            onPointerMove={(event) => {
              const dragState = dragStateRef.current;

              if (
                !dragState ||
                dragState.pointerId !== event.pointerId ||
                dragState.map.fileName !== mapEntry.fileName
              ) {
                return;
              }

              const pointerDelta = Math.hypot(
                event.clientX - dragState.startClientX,
                event.clientY - dragState.startClientY
              );

              if (!dragState.moved && pointerDelta >= DRAG_START_DISTANCE) {
                dragState.moved = true;
              }

              const nextPosition = readSnappedPosition(dragState, event);
              setPreview({
                fileName: dragState.map.fileName,
                x: nextPosition.x,
                y: nextPosition.y
              });

              if (dragState.moved) {
                const offsetX = nextPosition.x - dragState.startX;
                const offsetY = nextPosition.y - dragState.startY;

                onStatusInfoChange?.(
                  `${nextPosition.x}, ${nextPosition.y} (${offsetX}, ${offsetY})`
                );
              }

              event.preventDefault();
              event.stopPropagation();
            }}
            onPointerUp={(event) => {
              if (dragStateRef.current?.pointerId !== event.pointerId) {
                return;
              }

              commitDrag(event);
              event.currentTarget.releasePointerCapture(event.pointerId);
              event.preventDefault();
              event.stopPropagation();
            }}
            onPointerCancel={(event) => {
              if (dragStateRef.current?.pointerId !== event.pointerId) {
                return;
              }

              dragStateRef.current = undefined;
              clearPreview();
              event.preventDefault();
              event.stopPropagation();
            }}
          >
            <div className="flex h-full w-full items-start justify-between bg-slate-950/15 p-1">
              <span className="max-w-full truncate bg-slate-950/85 px-1.5 py-0.5 text-[11px] font-medium text-slate-100">
                {mapEntry.name}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
