"use client";

import type {
  RendererCanvasViewState
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

const OBJECT_DRAG_START_DISTANCE = 4;

interface PendingObjectDragState {
  kind: "move";
  pointerId: number;
  objectId: RendererCanvasObjectId;
  startClientX: number;
  startClientY: number;
  startWorldX: number;
  startWorldY: number;
  lastWorldX: number;
  lastWorldY: number;
  dragging: boolean;
}

interface PendingObjectResizeState {
  kind: "resize";
  pointerId: number;
  objectId: RendererCanvasObjectId;
  handle: RendererCanvasObjectResizeHandle;
  lastWorldX: number;
  lastWorldY: number;
}

type PendingObjectGestureState =
  | PendingObjectDragState
  | PendingObjectResizeState;

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
  const pendingObjectGestureRef = useRef<PendingObjectGestureState | undefined>(undefined);
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
    const tile = pickTile(clientX, clientY);

    if (!tile) {
      return "";
    }

    if (viewState.activeTool !== "object-select") {
      return `${tile.x}, ${tile.y}`;
    }

    const mapPoint = locateMapPoint(clientX, clientY);

    if (!mapPoint) {
      return `${tile.x}, ${tile.y}`;
    }

    return `${tile.x}, ${tile.y} (${Math.round(mapPoint.worldX)}, ${Math.round(mapPoint.worldY)})`;
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

    if (pending.kind === "resize") {
      if (
        input.clientX !== undefined &&
        input.clientY !== undefined
      ) {
        const location = locateMapPoint(input.clientX, input.clientY);

        if (location) {
          onObjectResize?.(
            location.worldX,
            location.worldY,
            readObjectResizeModifiers({
              ctrlKey: input.ctrlKey ?? false
            })
          );
        }
      }

      onObjectResizeEnd?.();

      if (
        input.pointerId !== undefined &&
        hostRef.current?.hasPointerCapture(input.pointerId)
      ) {
        hostRef.current.releasePointerCapture(input.pointerId);
      }

      return;
    }

    if (
      pending.dragging &&
      input.clientX !== undefined &&
      input.clientY !== undefined
    ) {
      const location = locateMapPoint(input.clientX, input.clientY);

      if (location) {
        onObjectMove?.(
          location.worldX,
          location.worldY,
          readObjectMoveModifiers({
            ctrlKey: input.ctrlKey ?? false
          })
        );
      }
    }

    if (pending.dragging) {
      onObjectMoveEnd?.();
    } else {
      const alreadySelected = viewState.selectedObjectIds.includes(pending.objectId);

      if (!alreadySelected) {
        onObjectSelect?.(pending.objectId);
      }
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

        if (viewState.activeTool === "world-tool") {
          hostRef.current?.focus();
          return;
        }

        if (viewState.activeTool === "object-select") {
          const result = rendererRef.current.pick(event.clientX, event.clientY, {
            mode: "object"
          });

          if (result.kind === "object-handle") {
            if (result.handle === "rotate") {
              hostRef.current?.focus();
              return;
            }

            if (
              viewState.selectedObjectIds.length !== 1 ||
              !onObjectResizeStart
            ) {
              return;
            }

            const location = locateMapPoint(event.clientX, event.clientY);

            if (!location) {
              return;
            }

            pendingObjectGestureRef.current = {
              kind: "resize",
              pointerId: event.pointerId,
              objectId: viewState.selectedObjectIds[0]!,
              handle: result.handle,
              lastWorldX: location.worldX,
              lastWorldY: location.worldY
            };
            hostRef.current?.focus();
            hostRef.current?.setPointerCapture(event.pointerId);
            onObjectResizeStart(
              viewState.selectedObjectIds[0]!,
              result.handle,
              location.worldX,
              location.worldY,
              readObjectResizeModifiers(event)
            );
            return;
          }

          if (result.kind !== "object") {
            return;
          }

          const location = locateMapPoint(event.clientX, event.clientY);

          if (!location) {
            return;
          }

          pendingObjectGestureRef.current = {
            kind: "move",
            pointerId: event.pointerId,
            objectId: result.objectId,
            startClientX: event.clientX,
            startClientY: event.clientY,
            startWorldX: location.worldX,
            startWorldY: location.worldY,
            lastWorldX: location.worldX,
            lastWorldY: location.worldY,
            dragging: false
          };
          hostRef.current?.focus();
          hostRef.current?.setPointerCapture(event.pointerId);
          return;
        }

        if (!onStrokeStart) {
          return;
        }

        const coordinate = pickTile(event.clientX, event.clientY);

        if (!coordinate) {
          return;
        }

        isStrokeActiveRef.current = true;
        lastPickedTileRef.current = coordinate;
        hostRef.current?.focus();
        hostRef.current?.setPointerCapture(event.pointerId);
        onStrokeStart(coordinate.x, coordinate.y, readModifiers(event));
      }}
      onPointerMove={(event) => {
        publishStatusInfo(readStatusInfo(event.clientX, event.clientY));

        if (viewState.activeTool === "object-select") {
          const pending = pendingObjectGestureRef.current;

          if (!pending) {
            return;
          }

          const location = locateMapPoint(event.clientX, event.clientY);

          if (!location) {
            return;
          }

          if (pending.kind === "resize") {
            pending.lastWorldX = location.worldX;
            pending.lastWorldY = location.worldY;
            onObjectResize?.(
              location.worldX,
              location.worldY,
              readObjectResizeModifiers(event)
            );
            return;
          }

          if (!pending.dragging) {
            const deltaX = event.clientX - pending.startClientX;
            const deltaY = event.clientY - pending.startClientY;

            if (
              Math.hypot(deltaX, deltaY) < OBJECT_DRAG_START_DISTANCE ||
              !onObjectMoveStart
            ) {
              return;
            }

            pending.dragging = true;
            onObjectMoveStart(
              pending.objectId,
              pending.startWorldX,
              pending.startWorldY,
              readObjectMoveModifiers(event)
            );
          }

          pending.lastWorldX = location.worldX;
          pending.lastWorldY = location.worldY;
          onObjectMove?.(location.worldX, location.worldY, readObjectMoveModifiers(event));
          return;
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
        const pending = pendingObjectGestureRef.current;

        if (
          viewState.activeTool === "object-select" &&
          pending?.kind === "move" &&
          pending.dragging
        ) {
          onObjectMove?.(
            pending.lastWorldX,
            pending.lastWorldY,
            readObjectMoveModifiers(event)
          );
          return;
        }

        if (
          viewState.activeTool === "object-select" &&
          pending?.kind === "resize"
        ) {
          onObjectResize?.(
            pending.lastWorldX,
            pending.lastWorldY,
            readObjectResizeModifiers(event)
          );
          return;
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
        const pending = pendingObjectGestureRef.current;

        if (
          viewState.activeTool === "object-select" &&
          pending?.kind === "move" &&
          pending.dragging
        ) {
          onObjectMove?.(
            pending.lastWorldX,
            pending.lastWorldY,
            readObjectMoveModifiers(event)
          );
          return;
        }

        if (
          viewState.activeTool === "object-select" &&
          pending?.kind === "resize"
        ) {
          onObjectResize?.(
            pending.lastWorldX,
            pending.lastWorldY,
            readObjectResizeModifiers(event)
          );
          return;
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
