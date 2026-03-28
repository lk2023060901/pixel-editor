import type { TileAnimationFrame } from "@pixel-editor/domain";

import type { TileAnimationEditorViewState } from "./ui-models";

export const defaultTileAnimationFrameDurationMs = 100;

export interface TileAnimationFrameLike {
  tileId: number;
  durationMs: number;
}

export interface TileAnimationEditorLocalState {
  sourceLocalId: number | null;
  selectedFrameIndex: number | null;
  frameDurationText: string;
  previewFrameIndex: number;
}

export interface TileAnimationEditorSelection<TFrame extends TileAnimationFrameLike> {
  selectedFrameIndex: number | null;
  selectedFrame: TFrame | undefined;
  previewFrameIndex: number;
  previewFrame: TFrame | undefined;
}

export interface TileAnimationFrameSelectionResult {
  selectedFrameIndex: number;
  nextFrameDurationText: string;
}

export interface TileAnimationFrameReorderResult {
  frames: TileAnimationFrame[];
  selectedFrameIndex: number;
}

export interface TileAnimationAddFrameResult {
  frames: TileAnimationFrame[];
  selectedFrameIndex: number;
  nextFrameDurationText: string;
}

export interface TileAnimationRemoveFrameResult {
  frames: TileAnimationFrame[];
  selectedFrameIndex: number | null;
  nextFrameDurationText: string;
}

export interface TileAnimationFrameDurationCommitResult {
  nextFrameDurationText: string;
  frames?: TileAnimationFrame[];
}

function parseTileAnimationFrameDuration(frameDurationText: string): number | undefined {
  const parsedDuration = Number.parseInt(frameDurationText, 10);

  if (Number.isNaN(parsedDuration) || parsedDuration < 0) {
    return undefined;
  }

  return parsedDuration;
}

export function cloneTileAnimationFrames(
  frames: readonly TileAnimationFrameLike[]
): TileAnimationFrame[] {
  return frames.map((frame) => ({
    tileId: frame.tileId,
    durationMs: frame.durationMs
  }));
}

export function resolveTileAnimationSourceLocalId(args: {
  selectedLocalId: number | null;
  sourceTiles: readonly TileAnimationEditorViewState["sourceTiles"][number][];
}): number | null {
  return args.selectedLocalId ?? args.sourceTiles[0]?.localId ?? null;
}

export function createTileAnimationEditorLocalState(args: {
  selectedLocalId: number | null;
  sourceTiles: readonly TileAnimationEditorViewState["sourceTiles"][number][];
}): TileAnimationEditorLocalState {
  return {
    sourceLocalId: resolveTileAnimationSourceLocalId(args),
    selectedFrameIndex: null,
    frameDurationText: String(defaultTileAnimationFrameDurationMs),
    previewFrameIndex: 0
  };
}

export function resolveTileAnimationFrameDurationText(args: {
  frames: readonly TileAnimationFrameLike[];
  selectedFrameIndex: number | null;
}): string {
  const frame =
    args.selectedFrameIndex === null ? undefined : args.frames[args.selectedFrameIndex];

  return String(frame?.durationMs ?? defaultTileAnimationFrameDurationMs);
}

export function deriveTileAnimationEditorSelection<TFrame extends TileAnimationFrameLike>(args: {
  frames: readonly TFrame[];
  selectedFrameIndex: number | null;
  previewFrameIndex: number;
}): TileAnimationEditorSelection<TFrame> {
  if (args.frames.length === 0) {
    return {
      selectedFrameIndex: null,
      selectedFrame: undefined,
      previewFrameIndex: 0,
      previewFrame: undefined
    };
  }

  const selectedFrameIndex =
    args.selectedFrameIndex === null
      ? 0
      : Math.max(0, Math.min(args.selectedFrameIndex, args.frames.length - 1));
  const previewFrameIndex = Math.max(0, Math.min(args.previewFrameIndex, args.frames.length - 1));

  return {
    selectedFrameIndex,
    selectedFrame: args.frames[selectedFrameIndex],
    previewFrameIndex,
    previewFrame: args.frames[previewFrameIndex]
  };
}

export function resolveTileAnimationPreviewDurationMs(args: {
  frames: readonly TileAnimationFrameLike[];
  previewFrameIndex: number;
}): number | undefined {
  if (args.frames.length === 0) {
    return undefined;
  }

  return Math.max(
    1,
    args.frames[args.previewFrameIndex]?.durationMs ?? defaultTileAnimationFrameDurationMs
  );
}

export function resolveTileAnimationFrameSelection(args: {
  frames: readonly TileAnimationFrameLike[];
  frameIndex: number;
}): TileAnimationFrameSelectionResult {
  return {
    selectedFrameIndex: args.frameIndex,
    nextFrameDurationText: resolveTileAnimationFrameDurationText({
      frames: args.frames,
      selectedFrameIndex: args.frameIndex
    })
  };
}

export function resolveTileAnimationFrameReorder(args: {
  frames: readonly TileAnimationFrameLike[];
  dragFrameIndex: number | null;
  frameIndex: number;
}): TileAnimationFrameReorderResult | undefined {
  if (args.dragFrameIndex === null || args.dragFrameIndex === args.frameIndex) {
    return undefined;
  }

  const nextFrames = cloneTileAnimationFrames(args.frames);
  const [movedFrame] = nextFrames.splice(args.dragFrameIndex, 1);

  if (!movedFrame) {
    return undefined;
  }

  nextFrames.splice(args.frameIndex, 0, movedFrame);

  return {
    frames: nextFrames,
    selectedFrameIndex: args.frameIndex
  };
}

export function resolveTileAnimationAddFrame(args: {
  frames: readonly TileAnimationFrameLike[];
  localId: number;
  frameDurationText: string;
}): TileAnimationAddFrameResult {
  const durationMs =
    parseTileAnimationFrameDuration(args.frameDurationText) ?? defaultTileAnimationFrameDurationMs;

  return {
    frames: [
      ...cloneTileAnimationFrames(args.frames),
      {
        tileId: args.localId,
        durationMs
      }
    ],
    selectedFrameIndex: args.frames.length,
    nextFrameDurationText: String(durationMs)
  };
}

export function resolveTileAnimationRemoveSelectedFrame(args: {
  frames: readonly TileAnimationFrameLike[];
  selectedFrameIndex: number | null;
}): TileAnimationRemoveFrameResult | undefined {
  if (args.selectedFrameIndex === null || !args.frames[args.selectedFrameIndex]) {
    return undefined;
  }

  const frames = cloneTileAnimationFrames(args.frames).filter(
    (_frame, frameIndex) => frameIndex !== args.selectedFrameIndex
  );
  const selectedFrameIndex =
    args.frames.length <= 1 ? null : Math.max(0, args.selectedFrameIndex - 1);

  return {
    frames,
    selectedFrameIndex,
    nextFrameDurationText: resolveTileAnimationFrameDurationText({
      frames,
      selectedFrameIndex
    })
  };
}

export function resolveTileAnimationFrameDurationCommit(args: {
  frames: readonly TileAnimationFrameLike[];
  selectedFrameIndex: number | null;
  frameDurationText: string;
}): TileAnimationFrameDurationCommitResult {
  if (args.selectedFrameIndex === null || !args.frames[args.selectedFrameIndex]) {
    return {
      nextFrameDurationText: args.frameDurationText
    };
  }

  const nextDuration = parseTileAnimationFrameDuration(args.frameDurationText);

  if (nextDuration === undefined) {
    return {
      nextFrameDurationText: resolveTileAnimationFrameDurationText({
        frames: args.frames,
        selectedFrameIndex: args.selectedFrameIndex
      })
    };
  }

  return {
    nextFrameDurationText: String(nextDuration),
    frames: args.frames.map((frame, frameIndex) =>
      frameIndex === args.selectedFrameIndex
        ? {
            tileId: frame.tileId,
            durationMs: nextDuration
          }
        : {
            tileId: frame.tileId,
            durationMs: frame.durationMs
          }
    )
  };
}
