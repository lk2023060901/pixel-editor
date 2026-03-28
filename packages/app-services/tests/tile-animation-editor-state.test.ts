import { describe, expect, it } from "vitest";

import {
  createTileAnimationEditorLocalState,
  defaultTileAnimationFrameDurationMs,
  deriveTileAnimationEditorSelection,
  resolveTileAnimationAddFrame,
  resolveTileAnimationFrameDurationCommit,
  resolveTileAnimationFrameDurationText,
  resolveTileAnimationFrameReorder,
  resolveTileAnimationFrameSelection,
  resolveTileAnimationPreviewDurationMs,
  resolveTileAnimationRemoveSelectedFrame,
  resolveTileAnimationSourceLocalId
} from "../src/ui";

describe("tile animation editor state helpers", () => {
  it("creates local state and resolves source tile fallback through exported APIs", () => {
    const sourceTiles = [{ localId: 7, preview: {} as never }];

    expect(
      resolveTileAnimationSourceLocalId({
        selectedLocalId: 3,
        sourceTiles
      })
    ).toBe(3);
    expect(
      resolveTileAnimationSourceLocalId({
        selectedLocalId: null,
        sourceTiles
      })
    ).toBe(7);
    expect(
      createTileAnimationEditorLocalState({
        selectedLocalId: null,
        sourceTiles
      })
    ).toEqual({
      sourceLocalId: 7,
      selectedFrameIndex: null,
      frameDurationText: String(defaultTileAnimationFrameDurationMs),
      previewFrameIndex: 0
    });
  });

  it("derives selection and preview duration through shared helpers", () => {
    const frames = [
      { tileId: 1, durationMs: 120, preview: {} as never },
      { tileId: 2, durationMs: 0, preview: {} as never }
    ];

    expect(
      deriveTileAnimationEditorSelection({
        frames,
        selectedFrameIndex: null,
        previewFrameIndex: 8
      })
    ).toMatchObject({
      selectedFrameIndex: 0,
      selectedFrame: frames[0],
      previewFrameIndex: 1,
      previewFrame: frames[1]
    });
    expect(
      resolveTileAnimationPreviewDurationMs({
        frames,
        previewFrameIndex: 1
      })
    ).toBe(1);
    expect(
      resolveTileAnimationFrameDurationText({
        frames,
        selectedFrameIndex: 0
      })
    ).toBe("120");
  });

  it("resolves selection, reorder, and add frame flows through exported APIs", () => {
    const frames = [
      { tileId: 1, durationMs: 120 },
      { tileId: 2, durationMs: 240 }
    ];

    expect(
      resolveTileAnimationFrameSelection({
        frames,
        frameIndex: 1
      })
    ).toEqual({
      selectedFrameIndex: 1,
      nextFrameDurationText: "240"
    });
    expect(
      resolveTileAnimationFrameReorder({
        frames,
        dragFrameIndex: 0,
        frameIndex: 1
      })
    ).toEqual({
      frames: [
        { tileId: 2, durationMs: 240 },
        { tileId: 1, durationMs: 120 }
      ],
      selectedFrameIndex: 1
    });
    expect(
      resolveTileAnimationAddFrame({
        frames,
        localId: 9,
        frameDurationText: "oops"
      })
    ).toEqual({
      frames: [
        { tileId: 1, durationMs: 120 },
        { tileId: 2, durationMs: 240 },
        { tileId: 9, durationMs: 100 }
      ],
      selectedFrameIndex: 2,
      nextFrameDurationText: "100"
    });
  });

  it("resolves remove and duration commit flows through exported APIs", () => {
    const frames = [
      { tileId: 1, durationMs: 120 },
      { tileId: 2, durationMs: 240 },
      { tileId: 3, durationMs: 360 }
    ];

    expect(
      resolveTileAnimationRemoveSelectedFrame({
        frames,
        selectedFrameIndex: 2
      })
    ).toEqual({
      frames: [
        { tileId: 1, durationMs: 120 },
        { tileId: 2, durationMs: 240 }
      ],
      selectedFrameIndex: 1,
      nextFrameDurationText: "240"
    });
    expect(
      resolveTileAnimationFrameDurationCommit({
        frames,
        selectedFrameIndex: 1,
        frameDurationText: "bad"
      })
    ).toEqual({
      nextFrameDurationText: "240"
    });
    expect(
      resolveTileAnimationFrameDurationCommit({
        frames,
        selectedFrameIndex: 1,
        frameDurationText: "75"
      })
    ).toEqual({
      nextFrameDurationText: "75",
      frames: [
        { tileId: 1, durationMs: 120 },
        { tileId: 2, durationMs: 75 },
        { tileId: 3, durationMs: 360 }
      ]
    });
  });
});
