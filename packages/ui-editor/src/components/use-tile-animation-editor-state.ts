"use client";

import {
  createTileAnimationEditorLocalState,
  deriveTileAnimationEditorSelection,
  resolveTileAnimationAddFrame,
  resolveTileAnimationFrameDurationCommit,
  resolveTileAnimationFrameDurationText,
  resolveTileAnimationFrameReorder,
  resolveTileAnimationFrameSelection,
  resolveTileAnimationPreviewDurationMs,
  resolveTileAnimationRemoveSelectedFrame,
  type TileAnimationEditorViewState
} from "@pixel-editor/app-services/ui";
import type { TileAnimationEditorStore } from "@pixel-editor/app-services/ui-store";
import { startTransition, useEffect, useState } from "react";

export function useTileAnimationEditorState(props: {
  store: TileAnimationEditorStore;
  viewState: TileAnimationEditorViewState;
}) {
  const [zoom, setZoom] = useState<number>(1);
  const [sourceLocalId, setSourceLocalId] = useState<number | null>(() =>
    createTileAnimationEditorLocalState({
      selectedLocalId: props.viewState.selectedLocalId,
      sourceTiles: props.viewState.sourceTiles
    }).sourceLocalId
  );
  const [selectedFrameIndex, setSelectedFrameIndex] = useState<number | null>(null);
  const [dragFrameIndex, setDragFrameIndex] = useState<number | null>(null);
  const [frameDurationText, setFrameDurationText] = useState(
    () =>
      createTileAnimationEditorLocalState({
        selectedLocalId: props.viewState.selectedLocalId,
        sourceTiles: props.viewState.sourceTiles
      }).frameDurationText
  );
  const [previewFrameIndex, setPreviewFrameIndex] = useState(0);
  const frames = props.viewState.frames;
  const selection = deriveTileAnimationEditorSelection({
    frames,
    selectedFrameIndex,
    previewFrameIndex
  });
  const previewFrame = selection.previewFrame;

  useEffect(() => {
    const nextState = createTileAnimationEditorLocalState({
      selectedLocalId: props.viewState.selectedLocalId,
      sourceTiles: props.viewState.sourceTiles
    });

    setSourceLocalId(nextState.sourceLocalId);
    setSelectedFrameIndex(nextState.selectedFrameIndex);
    setDragFrameIndex(null);
    setFrameDurationText(nextState.frameDurationText);
    setPreviewFrameIndex(nextState.previewFrameIndex);
  }, [
    props.viewState.selectedLocalId,
    props.viewState.tilesetId,
    props.viewState.sourceTiles.length
  ]);

  useEffect(() => {
    if (selection.selectedFrameIndex !== selectedFrameIndex) {
      setSelectedFrameIndex(selection.selectedFrameIndex);
      setFrameDurationText(
        resolveTileAnimationFrameDurationText({
          frames,
          selectedFrameIndex: selection.selectedFrameIndex
        })
      );
    }

    if (selection.previewFrameIndex !== previewFrameIndex) {
      setPreviewFrameIndex(selection.previewFrameIndex);
    }
  }, [
    frames,
    previewFrameIndex,
    selectedFrameIndex,
    selection.previewFrameIndex,
    selection.selectedFrameIndex
  ]);

  useEffect(() => {
    const durationMs = resolveTileAnimationPreviewDurationMs({
      frames,
      previewFrameIndex: selection.previewFrameIndex
    });

    if (durationMs === undefined) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setPreviewFrameIndex((currentIndex) => (currentIndex + 1) % frames.length);
    }, durationMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [frames, selection.previewFrameIndex]);

  function commitAnimation(
    nextFrames: Parameters<TileAnimationEditorStore["updateSelectedTileAnimation"]>[0]
  ): void {
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
        const resolution = resolveTileAnimationFrameSelection({
          frames,
          frameIndex
        });

        setSelectedFrameIndex(resolution.selectedFrameIndex);
        setFrameDurationText(resolution.nextFrameDurationText);
      },
      startFrameDrag: setDragFrameIndex,
      endFrameDrag: () => {
        setDragFrameIndex(null);
      },
      reorderFrameAt: (frameIndex: number) => {
        const resolution = resolveTileAnimationFrameReorder({
          frames,
          dragFrameIndex,
          frameIndex
        });

        if (!resolution) {
          return;
        }

        commitAnimation(resolution.frames);
        setSelectedFrameIndex(resolution.selectedFrameIndex);
        setDragFrameIndex(null);
      },
      addFrame: (localId: number) => {
        const resolution = resolveTileAnimationAddFrame({
          frames,
          localId,
          frameDurationText
        });

        commitAnimation(resolution.frames);
        setSelectedFrameIndex(resolution.selectedFrameIndex);
        setFrameDurationText(resolution.nextFrameDurationText);
      },
      removeSelectedFrame: () => {
        const resolution = resolveTileAnimationRemoveSelectedFrame({
          frames,
          selectedFrameIndex
        });

        if (!resolution) {
          return;
        }

        commitAnimation(resolution.frames);
        setSelectedFrameIndex(resolution.selectedFrameIndex);
        setFrameDurationText(resolution.nextFrameDurationText);
      },
      applyFrameDuration: () => {
        const resolution = resolveTileAnimationFrameDurationCommit({
          frames,
          selectedFrameIndex,
          frameDurationText
        });

        setFrameDurationText(resolution.nextFrameDurationText);

        if (!resolution.frames) {
          return;
        }

        commitAnimation(resolution.frames);
      }
    }
  };
}
