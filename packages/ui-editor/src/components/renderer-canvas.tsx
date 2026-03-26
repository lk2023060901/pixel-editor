"use client";

import type {
  CanvasGestureModifiers,
  EditorRuntimeSnapshot,
  ObjectMoveGestureModifiers
} from "@pixel-editor/app-services";
import type { ObjectId } from "@pixel-editor/domain";
import { useI18n } from "@pixel-editor/i18n/client";
import { createPixiEditorRenderer } from "@pixel-editor/renderer-pixi";
import { useDeferredValue, useEffect, useRef, useState } from "react";

import { WorldContextOverlay } from "./world-context-overlay";

export interface RendererCanvasProps {
  snapshot: EditorRuntimeSnapshot;
  onStrokeStart?: (x: number, y: number, modifiers: CanvasGestureModifiers) => void;
  onStrokeMove?: (x: number, y: number, modifiers: CanvasGestureModifiers) => void;
  onStrokeEnd?: () => void;
  onStatusInfoChange?: (statusInfo: string) => void;
  onObjectSelect?: (objectId: ObjectId) => void;
  onObjectMoveStart?: (
    objectId: ObjectId,
    x: number,
    y: number,
    modifiers: ObjectMoveGestureModifiers
  ) => void;
  onObjectMove?: (x: number, y: number, modifiers: ObjectMoveGestureModifiers) => void;
  onObjectMoveEnd?: () => void;
  onWorldMapActivate?: (mapId: string) => void;
  onWorldMapMove?: (worldId: string, fileName: string, x: number, y: number) => void;
}

const OBJECT_DRAG_START_DISTANCE = 4;

interface PendingObjectDragState {
  pointerId: number;
  objectId: ObjectId;
  startClientX: number;
  startClientY: number;
  startWorldX: number;
  startWorldY: number;
  lastWorldX: number;
  lastWorldY: number;
  dragging: boolean;
}

export function RendererCanvas({
  snapshot,
  onStrokeStart,
  onStrokeMove,
  onStrokeEnd,
  onStatusInfoChange,
  onObjectSelect,
  onObjectMoveStart,
  onObjectMove,
  onObjectMoveEnd,
  onWorldMapActivate,
  onWorldMapMove
}: RendererCanvasProps) {
  const { t } = useI18n();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasHostRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef(
    createPixiEditorRenderer({
      labels: {
        noActiveMap: t("canvas.noActiveMap")
      }
    })
  );
  const deferredSnapshot = useDeferredValue(snapshot);
  const isStrokeActiveRef = useRef(false);
  const lastPickedTileRef = useRef<{ x: number; y: number } | undefined>(undefined);
  const pendingObjectDragRef = useRef<PendingObjectDragState | undefined>(undefined);
  const lastStatusInfoRef = useRef("");
  const [hostSize, setHostSize] = useState({ width: 0, height: 0 });

  function readModifiers(event: {
    shiftKey: boolean;
    altKey: boolean;
  }): CanvasGestureModifiers {
    return {
      lockAspectRatio: event.shiftKey,
      fromCenter: event.altKey
    };
  }

  function readObjectMoveModifiers(event: {
    ctrlKey: boolean;
  }): ObjectMoveGestureModifiers {
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
      viewport: deferredSnapshot.bootstrap.viewport,
      ...(deferredSnapshot.activeMap ? { map: deferredSnapshot.activeMap } : {}),
      ...(deferredSnapshot.workspace.session.activeLayerId
        ? { highlightedLayerId: deferredSnapshot.workspace.session.activeLayerId }
        : {}),
      ...(deferredSnapshot.workspace.session.selection.kind === "tile"
        ? { selectedTiles: deferredSnapshot.workspace.session.selection.coordinates }
        : {}),
      ...(deferredSnapshot.workspace.session.selection.kind === "object"
        ? { selectedObjectIds: deferredSnapshot.workspace.session.selection.objectIds }
        : {}),
      ...(deferredSnapshot.runtime.interactions.objectTransformPreview.kind === "object-move"
        ? {
            objectTransformPreview: {
              kind: "move" as const,
              objectIds:
                deferredSnapshot.runtime.interactions.objectTransformPreview.objectIds,
              deltaX: deferredSnapshot.runtime.interactions.objectTransformPreview.deltaX,
              deltaY: deferredSnapshot.runtime.interactions.objectTransformPreview.deltaY
            }
          }
        : {}),
      ...(deferredSnapshot.runtime.interactions.canvasPreview.kind !== "none"
        ? { previewTiles: deferredSnapshot.runtime.interactions.canvasPreview.coordinates }
        : {})
    });
  }, [deferredSnapshot]);

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

    if (snapshot.workspace.session.activeTool !== "object-select") {
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
    const pending = pendingObjectDragRef.current;

    if (!pending) {
      return;
    }

    pendingObjectDragRef.current = undefined;

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
      const selection = snapshot.workspace.session.selection;
      const alreadySelected =
        selection.kind === "object" && selection.objectIds.includes(pending.objectId);

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

        if (snapshot.workspace.session.activeTool === "world-tool") {
          hostRef.current?.focus();
          return;
        }

        if (snapshot.workspace.session.activeTool === "object-select") {
          const result = rendererRef.current.pick(event.clientX, event.clientY, {
            mode: "object"
          });

          if (result.kind !== "object") {
            return;
          }

          const location = locateMapPoint(event.clientX, event.clientY);

          if (!location) {
            return;
          }

          pendingObjectDragRef.current = {
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

        if (snapshot.workspace.session.activeTool === "object-select") {
          const pending = pendingObjectDragRef.current;

          if (!pending) {
            return;
          }

          const location = locateMapPoint(event.clientX, event.clientY);

          if (!location) {
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
        const pending = pendingObjectDragRef.current;

        if (
          snapshot.workspace.session.activeTool === "object-select" &&
          pending?.dragging
        ) {
          onObjectMove?.(
            pending.lastWorldX,
            pending.lastWorldY,
            readObjectMoveModifiers(event)
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
        const pending = pendingObjectDragRef.current;

        if (
          snapshot.workspace.session.activeTool === "object-select" &&
          pending?.dragging
        ) {
          onObjectMove?.(
            pending.lastWorldX,
            pending.lastWorldY,
            readObjectMoveModifiers(event)
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
      {snapshot.activeMap && snapshot.worldContext ? (
        <WorldContextOverlay
          activeMap={snapshot.activeMap}
          activeTool={snapshot.workspace.session.activeTool}
          height={hostSize.height}
          viewport={snapshot.bootstrap.viewport}
          visible={
            snapshot.workspace.session.showWorlds ||
            snapshot.workspace.session.activeTool === "world-tool"
          }
          width={hostSize.width}
          worldContext={snapshot.worldContext}
          onActivateMap={onWorldMapActivate}
          onMoveWorldMap={onWorldMapMove}
          onStatusInfoChange={publishStatusInfo}
        />
      ) : null}
    </div>
  );
}
