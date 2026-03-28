"use client";

import type {
  WorldMapDragPreview,
  WorldContextOverlayDragState,
  WorldContextOverlayMapPresentation,
  WorldContextOverlayViewState
} from "@pixel-editor/app-services/ui";
import {
  createWorldContextOverlayClickPlan,
  createWorldContextOverlayCommitPlan,
  createWorldContextOverlayPointerDownPlan,
  deriveWorldContextOverlayMapPresentation,
  resolveWorldMapDragPreview as resolveWorldMapDragPreviewHelper,
  shouldStartWorldContextOverlayDrag
} from "@pixel-editor/app-services/ui";
import { useRef, useState } from "react";

import type { EditorRenderBridge } from "../render-bridge";

interface WorldContextOverlayProps {
  viewState: WorldContextOverlayViewState;
  renderBridge: EditorRenderBridge;
  width: number;
  height: number;
  onActivateMap?: ((mapId: string) => void) | undefined;
  onMoveWorldMap?: ((worldId: string, fileName: string, x: number, y: number) => void) | undefined;
  onStatusInfoChange?: ((statusInfo: string) => void) | undefined;
}

export function WorldContextOverlay({
  viewState,
  renderBridge,
  width,
  height,
  onActivateMap,
  onMoveWorldMap,
  onStatusInfoChange
}: WorldContextOverlayProps) {
  const dragStateRef = useRef<WorldContextOverlayDragState | undefined>(undefined);
  const [preview, setPreview] = useState<{ fileName: string; x: number; y: number } | undefined>(
    undefined
  );

  if (!viewState.visible || width <= 0 || height <= 0) {
    return null;
  }

  const projection = renderBridge.resolveViewportProjection({
    map: viewState.activeMap,
    viewport: viewState.viewport,
    width,
    height
  });
  const projectedMaps = viewState.maps.map((mapEntry) => {
    const worldX = preview?.fileName === mapEntry.fileName ? preview.x : mapEntry.x;
    const worldY = preview?.fileName === mapEntry.fileName ? preview.y : mapEntry.y;

    return {
      ...mapEntry,
      worldX,
      worldY,
      screenRect: renderBridge.projectWorldRectToScreenRect({
        projection,
        activeWorldRect: viewState.activeMapRect,
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

  function readDragPreview(
    dragState: WorldContextOverlayDragState,
    event: { clientX: number; clientY: number; ctrlKey: boolean }
  ): WorldMapDragPreview {
    return resolveWorldMapDragPreviewHelper({
      viewState,
      map: dragState.map,
      deltaClientX: event.clientX - dragState.startClientX,
      deltaClientY: event.clientY - dragState.startClientY,
      pixelScaleX: projection.pixelScaleX,
      pixelScaleY: projection.pixelScaleY,
      freeMove: event.ctrlKey
    });
  }

  function commitDrag(event: { clientX: number; clientY: number; ctrlKey: boolean }): void {
    const dragState = dragStateRef.current;

    if (!dragState) {
      return;
    }

    dragStateRef.current = undefined;
    const nextPosition = readDragPreview(dragState, event);

    const plan = createWorldContextOverlayCommitPlan({
      dragState,
      position: nextPosition
    });

    if (plan.kind === "move") {
      onMoveWorldMap?.(plan.worldId, plan.fileName, plan.x, plan.y);
    } else if (plan.kind === "activate") {
      onActivateMap?.(plan.mapId);
    }

    clearPreview();
  }

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {projectedMaps.map((mapEntry) => {
        const presentation: WorldContextOverlayMapPresentation =
          deriveWorldContextOverlayMapPresentation({
            viewState,
            map: mapEntry
          });

        return (
          <button
            key={mapEntry.fileName}
            className={`pointer-events-auto absolute overflow-hidden border text-left transition ${
              presentation.appearance === "active"
                ? "border-emerald-400/90 bg-emerald-500/10 shadow-[0_0_0_1px_rgba(16,185,129,0.25)]"
                : "border-slate-500/80 bg-slate-950/60 hover:border-slate-300/80"
            } ${presentation.cursor === "pointer" ? "cursor-pointer" : "cursor-default"}`}
            style={{
              left: `${mapEntry.screenRect.left}px`,
              top: `${mapEntry.screenRect.top}px`,
              width: `${Math.max(mapEntry.screenRect.width, 18)}px`,
              height: `${Math.max(mapEntry.screenRect.height, 18)}px`
            }}
            onClick={() => {
              const plan = createWorldContextOverlayClickPlan({
                presentation,
                map: mapEntry
              });

              if (plan.kind === "activate") {
                onActivateMap?.(plan.mapId);
              }
            }}
            onPointerDown={(event) => {
              const plan = createWorldContextOverlayPointerDownPlan({
                presentation,
                map: mapEntry,
                button: event.button,
                pointerId: event.pointerId,
                clientX: event.clientX,
                clientY: event.clientY
              });

              if (plan.kind !== "drag") {
                return;
              }

              dragStateRef.current = plan.dragState;
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

              if (
                !dragState.moved &&
                shouldStartWorldContextOverlayDrag({
                  startClientX: dragState.startClientX,
                  startClientY: dragState.startClientY,
                  clientX: event.clientX,
                  clientY: event.clientY
                })
              ) {
                dragState.moved = true;
              }

              const nextPosition = readDragPreview(dragState, event);
              setPreview({
                fileName: dragState.map.fileName,
                x: nextPosition.x,
                y: nextPosition.y
              });

              if (dragState.moved) {
                onStatusInfoChange?.(nextPosition.statusInfo);
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
