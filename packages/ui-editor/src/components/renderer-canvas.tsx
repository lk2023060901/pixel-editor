"use client";

import type {
  RendererCanvasPendingObjectGestureState,
  RendererCanvasViewState
} from "@pixel-editor/app-services/ui";
import {
  createRendererCanvasModifierSyncPlan,
  createRendererCanvasObjectGestureCompletionPlan,
  createRendererCanvasPointerDownPlan,
  createRendererCanvasPointerMovePlan,
  resolveRendererCanvasStatusInfo
} from "@pixel-editor/app-services/ui";
import type { EditorShellCanvasInteractionStore } from "@pixel-editor/app-services/ui-shell";
import { useI18n } from "@pixel-editor/i18n/client";
import { useDeferredValue, useEffect, useRef, useState } from "react";

import type { EditorRenderBridge } from "../render-bridge";

import { WorldContextOverlay } from "./world-context-overlay";

type RendererCanvasObjectId = Parameters<EditorShellCanvasInteractionStore["selectObject"]>[0];
type RendererCanvasGestureModifiers = NonNullable<
  Parameters<EditorShellCanvasInteractionStore["beginCanvasStroke"]>[2]
>;
type RendererCanvasObjectMoveGestureModifiers = NonNullable<
  Parameters<EditorShellCanvasInteractionStore["beginObjectMove"]>[3]
>;
type RendererCanvasObjectResizeHandle = Parameters<
  EditorShellCanvasInteractionStore["beginObjectResize"]
>[1];
type RendererCanvasObjectResizeGestureModifiers = NonNullable<
  Parameters<EditorShellCanvasInteractionStore["beginObjectResize"]>[4]
>;

export interface RendererCanvasProps {
  renderBridge: EditorRenderBridge;
  viewState: RendererCanvasViewState;
  onStrokeStart?: (x: number, y: number, modifiers: RendererCanvasGestureModifiers) => void;
  onStrokeMove?: (x: number, y: number, modifiers: RendererCanvasGestureModifiers) => void;
  onStrokeEnd?: () => void;
  onStatusInfoChange?: (statusInfo: string) => void;
  onObjectSelect?: (objectId: RendererCanvasObjectId) => void;
  onObjectMoveStart?: (
    objectId: RendererCanvasObjectId,
    x: number,
    y: number,
    modifiers: RendererCanvasObjectMoveGestureModifiers
  ) => void;
  onObjectMove?: (
    x: number,
    y: number,
    modifiers: RendererCanvasObjectMoveGestureModifiers
  ) => void;
  onObjectMoveEnd?: () => void;
  onObjectResizeStart?: (
    objectId: RendererCanvasObjectId,
    handle: RendererCanvasObjectResizeHandle,
    x: number,
    y: number,
    modifiers: RendererCanvasObjectResizeGestureModifiers
  ) => void;
  onObjectResize?: (
    x: number,
    y: number,
    modifiers: RendererCanvasObjectResizeGestureModifiers
  ) => void;
  onObjectResizeEnd?: () => void;
  onWorldMapActivate?: (mapId: string) => void;
  onWorldMapMove?: (worldId: string, fileName: string, x: number, y: number) => void;
}

export function RendererCanvas({
  renderBridge,
  viewState,
  onStrokeStart,
  onStrokeMove,
  onStrokeEnd,
  onStatusInfoChange,
  onObjectSelect,
  onObjectMoveStart,
  onObjectMove,
  onObjectMoveEnd,
  onObjectResizeStart,
  onObjectResize,
  onObjectResizeEnd,
  onWorldMapActivate,
  onWorldMapMove
}: RendererCanvasProps) {
  const { t } = useI18n();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasHostRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef(
    renderBridge.createRenderer({
      labels: {
        noActiveMap: t("canvas.noActiveMap")
      }
    })
  );
  const deferredViewState = useDeferredValue(viewState);
  const isStrokeActiveRef = useRef(false);
  const lastPickedTileRef = useRef<{ x: number; y: number } | undefined>(undefined);
  const pendingObjectGestureRef =
    useRef<RendererCanvasPendingObjectGestureState | undefined>(undefined);
  const lastStatusInfoRef = useRef("");
  const [hostSize, setHostSize] = useState({ width: 0, height: 0 });

  function readModifiers(event: {
    shiftKey: boolean;
    altKey: boolean;
  }): RendererCanvasGestureModifiers {
    return {
      lockAspectRatio: event.shiftKey,
      fromCenter: event.altKey
    };
  }

  function readObjectMoveModifiers(event: {
    ctrlKey: boolean;
  }): RendererCanvasObjectMoveGestureModifiers {
    return {
      snapToGrid: event.ctrlKey
    };
  }

  function readObjectResizeModifiers(event: {
    ctrlKey: boolean;
  }): RendererCanvasObjectResizeGestureModifiers {
    return {
      snapToGrid: event.ctrlKey
    };
  }

  useEffect(() => {
    const host = canvasHostRef.current;

    if (!host) {
      return;
    }

    void rendererRef.current.mount(host);

    return () => {
      rendererRef.current.destroy();
    };
  }, []);

  useEffect(() => {
    const host = hostRef.current;

    if (!host) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];

      if (!entry) {
        return;
      }

      setHostSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height
      });
    });

    observer.observe(host);
    setHostSize({
      width: host.clientWidth,
      height: host.clientHeight
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    rendererRef.current.update({
      ...deferredViewState.render
    });
  }, [deferredViewState]);

  function pickTile(clientX: number, clientY: number): { x: number; y: number } | undefined {
    const result = rendererRef.current.pick(clientX, clientY, {
      mode: "tile"
    });

    if (result.kind !== "tile") {
      return undefined;
    }

    return {
      x: result.x,
      y: result.y
    };
  }

  function locateMapPoint(
    clientX: number,
    clientY: number
  ): { worldX: number; worldY: number } | undefined {
    const result = rendererRef.current.locate(clientX, clientY);

    if (result.kind !== "map") {
      return undefined;
    }

    return {
      worldX: result.worldX,
      worldY: result.worldY
    };
  }

  function publishStatusInfo(statusInfo: string): void {
    if (lastStatusInfoRef.current === statusInfo) {
      return;
    }

    lastStatusInfoRef.current = statusInfo;
    onStatusInfoChange?.(statusInfo);
  }

  function readStatusInfo(clientX: number, clientY: number): string {
    return resolveRendererCanvasStatusInfo({
      activeTool: viewState.activeTool,
      tile: pickTile(clientX, clientY),
      mapPoint:
        viewState.activeTool === "object-select"
          ? locateMapPoint(clientX, clientY)
          : undefined
    });
  }

  function finishStroke(pointerId?: number): void {
    if (!isStrokeActiveRef.current) {
      return;
    }

    isStrokeActiveRef.current = false;
    lastPickedTileRef.current = undefined;

    if (
      pointerId !== undefined &&
      hostRef.current?.hasPointerCapture(pointerId)
    ) {
      hostRef.current.releasePointerCapture(pointerId);
    }

    onStrokeEnd?.();
  }

  function finishObjectGesture(input: {
    pointerId?: number;
    clientX?: number;
    clientY?: number;
    ctrlKey?: boolean;
  } = {}): void {
    const pending = pendingObjectGestureRef.current;

    if (!pending) {
      return;
    }

    pendingObjectGestureRef.current = undefined;
    const location =
      input.clientX !== undefined && input.clientY !== undefined
        ? locateMapPoint(input.clientX, input.clientY)
        : undefined;
    const plan = createRendererCanvasObjectGestureCompletionPlan({
      pendingGesture: pending,
      selectedObjectIds: viewState.selectedObjectIds,
      mapPoint: location
    });

    switch (plan.kind) {
      case "object-resize":
        if (plan.commitLocation) {
          onObjectResize?.(
            plan.commitLocation.worldX,
            plan.commitLocation.worldY,
            readObjectResizeModifiers({
              ctrlKey: input.ctrlKey ?? false
            })
          );
        }
        onObjectResizeEnd?.();
        break;
      case "object-move":
        if (plan.commitLocation) {
          onObjectMove?.(
            plan.commitLocation.worldX,
            plan.commitLocation.worldY,
            readObjectMoveModifiers({
              ctrlKey: input.ctrlKey ?? false
            })
          );
        }
        onObjectMoveEnd?.();
        break;
      case "select-object":
        onObjectSelect?.(plan.objectId);
        break;
      case "noop":
        break;
    }

    if (
      input.pointerId !== undefined &&
      hostRef.current?.hasPointerCapture(input.pointerId)
    ) {
      hostRef.current.releasePointerCapture(input.pointerId);
    }
  }

  return (
    <div
      ref={hostRef}
      className="relative h-full min-h-0 w-full overflow-hidden bg-slate-950 outline-none"
      onPointerDown={(event) => {
        if (event.button !== 0) {
          return;
        }
        const plan = createRendererCanvasPointerDownPlan({
          activeTool: viewState.activeTool,
          selectedObjectIds: viewState.selectedObjectIds,
          pointerId: event.pointerId,
          clientX: event.clientX,
          clientY: event.clientY,
          pickResult:
            viewState.activeTool === "object-select"
              ? rendererRef.current.pick(event.clientX, event.clientY, {
                  mode: "object"
                })
              : { kind: "none" },
          mapPoint:
            viewState.activeTool === "object-select"
              ? locateMapPoint(event.clientX, event.clientY)
              : undefined,
          tile:
            viewState.activeTool === "object-select" || viewState.activeTool === "world-tool"
              ? undefined
              : pickTile(event.clientX, event.clientY),
          canStartStroke: onStrokeStart !== undefined,
          canStartObjectResize: onObjectResizeStart !== undefined
        });

        switch (plan.kind) {
          case "focus":
            hostRef.current?.focus();
            return;
          case "object-resize":
            pendingObjectGestureRef.current = plan.pendingGesture;
            hostRef.current?.focus();
            hostRef.current?.setPointerCapture(event.pointerId);
            onObjectResizeStart?.(
              plan.pendingGesture.objectId,
              plan.pendingGesture.handle,
              plan.pendingGesture.lastWorldX,
              plan.pendingGesture.lastWorldY,
              readObjectResizeModifiers(event)
            );
            return;
          case "object-move":
            pendingObjectGestureRef.current = plan.pendingGesture;
            hostRef.current?.focus();
            hostRef.current?.setPointerCapture(event.pointerId);
            return;
          case "stroke":
            isStrokeActiveRef.current = true;
            lastPickedTileRef.current = plan.tile;
            hostRef.current?.focus();
            hostRef.current?.setPointerCapture(event.pointerId);
            onStrokeStart?.(plan.tile.x, plan.tile.y, readModifiers(event));
            return;
          case "noop":
            return;
        }
      }}
      onPointerMove={(event) => {
        publishStatusInfo(readStatusInfo(event.clientX, event.clientY));

        if (viewState.activeTool === "object-select") {
          const pending = pendingObjectGestureRef.current;
          const plan = createRendererCanvasPointerMovePlan({
            activeTool: viewState.activeTool,
            pendingGesture: pending,
            mapPoint: locateMapPoint(event.clientX, event.clientY),
            clientX: event.clientX,
            clientY: event.clientY,
            canStartObjectMove: onObjectMoveStart !== undefined
          });

          switch (plan.kind) {
            case "object-resize":
              if (pending?.kind !== "resize") {
                return;
              }

              pending.lastWorldX = plan.worldX;
              pending.lastWorldY = plan.worldY;
              onObjectResize?.(
                plan.worldX,
                plan.worldY,
                readObjectResizeModifiers(event)
              );
              return;
            case "object-move":
              if (pending?.kind !== "move") {
                return;
              }

              if (plan.startDragging) {
                pending.dragging = true;
                onObjectMoveStart?.(
                  pending.objectId,
                  pending.startWorldX,
                  pending.startWorldY,
                  readObjectMoveModifiers(event)
                );
              }

              pending.lastWorldX = plan.worldX;
              pending.lastWorldY = plan.worldY;
              onObjectMove?.(plan.worldX, plan.worldY, readObjectMoveModifiers(event));
              return;
            case "noop":
              return;
          }
        }

        if (!isStrokeActiveRef.current || !onStrokeMove) {
          return;
        }

        const coordinate = pickTile(event.clientX, event.clientY);

        if (!coordinate) {
          return;
        }

        lastPickedTileRef.current = coordinate;
        onStrokeMove(coordinate.x, coordinate.y, readModifiers(event));
      }}
      onPointerUp={(event) => {
        finishObjectGesture({
          pointerId: event.pointerId,
          clientX: event.clientX,
          clientY: event.clientY,
          ctrlKey: event.ctrlKey
        });
        finishStroke(event.pointerId);
      }}
      onPointerCancel={(event) => {
        finishObjectGesture({
          pointerId: event.pointerId
        });
        finishStroke(event.pointerId);
      }}
      onPointerLeave={() => {
        publishStatusInfo("");
      }}
      onLostPointerCapture={() => {
        finishObjectGesture();
        finishStroke();
      }}
      onKeyDown={(event) => {
        const plan = createRendererCanvasModifierSyncPlan({
          activeTool: viewState.activeTool,
          pendingGesture: pendingObjectGestureRef.current
        });

        switch (plan.kind) {
          case "object-move":
            onObjectMove?.(plan.worldX, plan.worldY, readObjectMoveModifiers(event));
            return;
          case "object-resize":
            onObjectResize?.(
              plan.worldX,
              plan.worldY,
              readObjectResizeModifiers(event)
            );
            return;
          case "noop":
            break;
        }

        if (!isStrokeActiveRef.current || !onStrokeMove || !lastPickedTileRef.current) {
          return;
        }

        onStrokeMove(
          lastPickedTileRef.current.x,
          lastPickedTileRef.current.y,
          readModifiers(event)
        );
      }}
      onKeyUp={(event) => {
        const plan = createRendererCanvasModifierSyncPlan({
          activeTool: viewState.activeTool,
          pendingGesture: pendingObjectGestureRef.current
        });

        switch (plan.kind) {
          case "object-move":
            onObjectMove?.(plan.worldX, plan.worldY, readObjectMoveModifiers(event));
            return;
          case "object-resize":
            onObjectResize?.(
              plan.worldX,
              plan.worldY,
              readObjectResizeModifiers(event)
            );
            return;
          case "noop":
            break;
        }

        if (!isStrokeActiveRef.current || !onStrokeMove || !lastPickedTileRef.current) {
          return;
        }

        onStrokeMove(
          lastPickedTileRef.current.x,
          lastPickedTileRef.current.y,
          readModifiers(event)
        );
      }}
      tabIndex={0}
    >
      <div ref={canvasHostRef} className="absolute inset-0" />
      {viewState.worldOverlay ? (
        <WorldContextOverlay
          height={hostSize.height}
          renderBridge={renderBridge}
          viewState={viewState.worldOverlay}
          width={hostSize.width}
          onActivateMap={onWorldMapActivate}
          onMoveWorldMap={onWorldMapMove}
          onStatusInfoChange={publishStatusInfo}
        />
      ) : null}
    </div>
  );
}
