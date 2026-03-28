"use client";

import {
  resolveMiniMapNavigationTarget,
  type MiniMapPanelViewState
} from "@pixel-editor/app-services/ui";
import {
  useDeferredValue,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent
} from "react";

import type { EditorRenderBridge } from "../render-bridge";

export function useMiniMapPanelState(input: {
  viewState: MiniMapPanelViewState | undefined;
  renderBridge: EditorRenderBridge;
  onNavigate?: (originX: number, originY: number) => void;
}) {
  const deferredViewState = useDeferredValue(input.viewState);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | undefined>(undefined);
  const [previewPending, setPreviewPending] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!deferredViewState) {
      setPreviewImageUrl(undefined);
      setPreviewPending(false);
      return;
    }

    setPreviewPending(true);

    void input.renderBridge
      .exportSnapshotImageDataUrl({
        snapshot: deferredViewState.preview.snapshot,
        width: deferredViewState.preview.width,
        height: deferredViewState.preview.height,
        mimeType: "image/png"
      })
      .then((nextImageUrl) => {
        if (cancelled) {
          return;
        }

        setPreviewImageUrl(nextImageUrl);
        setPreviewPending(false);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setPreviewImageUrl(undefined);
        setPreviewPending(false);
      });

    return () => {
      cancelled = true;
    };
  }, [deferredViewState, input.renderBridge]);

  function navigateFromClientPoint(clientX: number, clientY: number): void {
    const previewElement = previewRef.current;
    const viewState = input.viewState;

    if (!previewElement || !viewState || !input.onNavigate) {
      return;
    }

    const rect = previewElement.getBoundingClientRect();

    if (rect.width <= 0 || rect.height <= 0) {
      return;
    }

    const target = resolveMiniMapNavigationTarget(
      viewState,
      (clientX - rect.left) / rect.width,
      (clientY - rect.top) / rect.height
    );

    input.onNavigate(target.originX, target.originY);
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>): void {
    if (event.button !== 0) {
      return;
    }

    draggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    navigateFromClientPoint(event.clientX, event.clientY);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>): void {
    if (!draggingRef.current || (event.buttons & 1) === 0) {
      return;
    }

    navigateFromClientPoint(event.clientX, event.clientY);
  }

  function stopDragging(event: ReactPointerEvent<HTMLDivElement>): void {
    draggingRef.current = false;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return {
    canNavigate: Boolean(input.viewState && input.onNavigate),
    previewRef,
    previewImageUrl,
    previewPending,
    previewHandlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: stopDragging,
      onPointerCancel: stopDragging
    }
  };
}
