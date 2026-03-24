"use client";

import type {
  CanvasGestureModifiers,
  EditorRuntimeSnapshot
} from "@pixel-editor/app-services";
import { createPixiEditorRenderer } from "@pixel-editor/renderer-pixi";
import { useDeferredValue, useEffect, useRef } from "react";

export interface RendererCanvasProps {
  snapshot: EditorRuntimeSnapshot;
  onStrokeStart?: (x: number, y: number, modifiers: CanvasGestureModifiers) => void;
  onStrokeMove?: (x: number, y: number, modifiers: CanvasGestureModifiers) => void;
  onStrokeEnd?: () => void;
}

export function RendererCanvas({
  snapshot,
  onStrokeStart,
  onStrokeMove,
  onStrokeEnd
}: RendererCanvasProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef(createPixiEditorRenderer());
  const deferredSnapshot = useDeferredValue(snapshot);
  const isStrokeActiveRef = useRef(false);
  const lastPickedTileRef = useRef<{ x: number; y: number } | undefined>(undefined);

  function readModifiers(event: {
    shiftKey: boolean;
    altKey: boolean;
  }): CanvasGestureModifiers {
    return {
      lockAspectRatio: event.shiftKey,
      fromCenter: event.altKey
    };
  }

  useEffect(() => {
    const host = hostRef.current;

    if (!host) {
      return;
    }

    void rendererRef.current.mount(host);

    return () => {
      rendererRef.current.destroy();
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
      ...(deferredSnapshot.interactions.canvasPreview.kind !== "none"
        ? { previewTiles: deferredSnapshot.interactions.canvasPreview.coordinates }
        : {})
    });
  }, [deferredSnapshot]);

  function pickTile(clientX: number, clientY: number): { x: number; y: number } | undefined {
    const result = rendererRef.current.pick(clientX, clientY);

    if (result.kind !== "tile") {
      return undefined;
    }

    return {
      x: result.x,
      y: result.y
    };
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

  return (
    <div
      ref={hostRef}
      className="h-full min-h-[520px] overflow-hidden rounded-2xl"
      onPointerDown={(event) => {
        if (event.button !== 0 || !onStrokeStart) {
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
        finishStroke(event.pointerId);
      }}
      onPointerCancel={(event) => {
        finishStroke(event.pointerId);
      }}
      onLostPointerCapture={() => {
        finishStroke();
      }}
      onKeyDown={(event) => {
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
    />
  );
}
