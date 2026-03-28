"use client";

import type { TileAnimationEditorViewState } from "@pixel-editor/app-services/ui";
import type { TileAnimationEditorStore } from "@pixel-editor/app-services/ui-store";
import { startTransition, useEffect, useState } from "react";

const DEFAULT_FRAME_DURATION_MS = 100;

export type TileAnimationFrame = Parameters<
  TileAnimationEditorStore["updateSelectedTileAnimation"]
>[0][number];

function reorderAnimationFrames(
  frames: readonly TileAnimationFrame[],
  fromIndex: number,
  toIndex: number
): TileAnimationFrame[] {
  if (fromIndex === toIndex) {
    return frames.map((frame) => ({ ...frame }));
  }

  const nextFrames = frames.map((frame) => ({ ...frame }));
  const [movedFrame] = nextFrames.splice(fromIndex, 1);

  if (!movedFrame) {
    return nextFrames;
  }

  nextFrames.splice(toIndex, 0, movedFrame);
  return nextFrames;
}

function cloneAnimationFrames(
  frames: readonly TileAnimationEditorViewState["frames"][number][]
): TileAnimationFrame[] {
  return frames.map((frame) => ({
    tileId: frame.tileId,
    durationMs: frame.durationMs
  }));
}

export function useTileAnimationEditorState(props: {
  store: TileAnimationEditorStore;
  viewState: TileAnimationEditorViewState;
}) {
  const [zoom, setZoom] = useState<number>(1);
  const [sourceLocalId, setSourceLocalId] = useState<number | null>(props.viewState.selectedLocalId);
  const [selectedFrameIndex, setSelectedFrameIndex] = useState<number | null>(null);
  const [dragFrameIndex, setDragFrameIndex] = useState<number | null>(null);
  const [frameDurationText, setFrameDurationText] = useState(String(DEFAULT_FRAME_DURATION_MS));
  const [previewFrameIndex, setPreviewFrameIndex] = useState(0);
  const frames = props.viewState.frames;
  const previewFrame = frames[previewFrameIndex] ?? frames[0];

  useEffect(() => {
    setSourceLocalId(props.viewState.selectedLocalId ?? props.viewState.sourceTiles[0]?.localId ?? null);
    setSelectedFrameIndex(null);
    setPreviewFrameIndex(0);
  }, [
    props.viewState.selectedLocalId,
    props.viewState.tilesetId,
    props.viewState.sourceTiles.length
  ]);

  useEffect(() => {
    if (!frames.length) {
      setSelectedFrameIndex(null);
      setPreviewFrameIndex(0);
      return;
    }

    setSelectedFrameIndex((currentIndex) => {
      if (currentIndex === null) {
        return 0;
      }

      return Math.min(currentIndex, frames.length - 1);
    });
    setPreviewFrameIndex((currentIndex) => Math.min(currentIndex, frames.length - 1));
  }, [frames]);

  useEffect(() => {
    if (!frames.length) {
      return;
    }

    const durationMs = Math.max(1, frames[previewFrameIndex]?.durationMs ?? DEFAULT_FRAME_DURATION_MS);
    const timeoutId = window.setTimeout(() => {
      setPreviewFrameIndex((currentIndex) => (currentIndex + 1) % frames.length);
    }, durationMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [frames, previewFrameIndex]);

  function commitAnimation(nextFrames: readonly TileAnimationFrame[]): void {
    startTransition(() => {
      props.store.updateSelectedTileAnimation(nextFrames);
    });
  }

  return {
    dragFrameIndex,
    frameDurationText,
    frames,
    previewFrame,
    selectedFrameIndex,
    sourceLocalId,
    zoom,
    setters: {
      setFrameDurationText,
      setZoom
    },
    actions: {
      selectSourceTile: setSourceLocalId,
      selectFrame: (frameIndex: number) => {
        const frame = frames[frameIndex];

        setSelectedFrameIndex(frameIndex);
        setFrameDurationText(String(frame?.durationMs ?? DEFAULT_FRAME_DURATION_MS));
      },
      startFrameDrag: setDragFrameIndex,
      endFrameDrag: () => {
        setDragFrameIndex(null);
      },
      reorderFrameAt: (frameIndex: number) => {
        if (dragFrameIndex === null || dragFrameIndex === frameIndex) {
          return;
        }

        commitAnimation(reorderAnimationFrames(cloneAnimationFrames(frames), dragFrameIndex, frameIndex));
        setSelectedFrameIndex(frameIndex);
        setDragFrameIndex(null);
      },
      addFrame: (localId: number) => {
        const parsedDuration = Number.parseInt(frameDurationText, 10);

        commitAnimation([
          ...cloneAnimationFrames(frames),
          {
            tileId: localId,
            durationMs:
              Number.isNaN(parsedDuration) || parsedDuration < 0
                ? DEFAULT_FRAME_DURATION_MS
                : parsedDuration
          }
        ]);
        setSelectedFrameIndex(frames.length);
      },
      removeSelectedFrame: () => {
        if (selectedFrameIndex === null || !frames[selectedFrameIndex]) {
          return;
        }

        commitAnimation(
          frames
            .filter((_, frameIndex) => frameIndex !== selectedFrameIndex)
            .map((frame) => ({
              tileId: frame.tileId,
              durationMs: frame.durationMs
            }))
        );
        setSelectedFrameIndex((currentIndex) => {
          if (currentIndex === null) {
            return null;
          }

          if (frames.length <= 1) {
            return null;
          }

          return Math.max(0, currentIndex - 1);
        });
      },
      applyFrameDuration: () => {
        if (selectedFrameIndex === null || !frames[selectedFrameIndex]) {
          return;
        }

        const nextDuration = Number.parseInt(frameDurationText, 10);

        if (Number.isNaN(nextDuration) || nextDuration < 0) {
          setFrameDurationText(String(frames[selectedFrameIndex].durationMs));
          return;
        }

        commitAnimation(
          frames.map((frame, frameIndex) =>
            frameIndex === selectedFrameIndex
              ? {
                  tileId: frame.tileId,
                  durationMs: nextDuration
                }
              : {
                  tileId: frame.tileId,
                  durationMs: frame.durationMs
                }
          )
        );
      }
    }
  };
}
