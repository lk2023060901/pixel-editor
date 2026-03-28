import { describe, expect, it, vi } from "vitest";

import {
  createTileAnimationFrameListActionPlan,
  createTileAnimationEditorKeyDownActionPlan,
  createTileAnimationSourceTilesActionPlan,
  createTileAnimationEditorKeyDownPlan,
  defaultTileAnimationEditorZoom,
  deriveTileAnimationEditorHeaderPresentation,
  deriveTileAnimationFrameListPresentation,
  deriveTileAnimationSourceTilesPresentation,
  tileAnimationFrameListActionIds,
  tileAnimationSourceTilesActionIds,
  type TileAnimationEditorViewState
} from "../src/ui";

function createViewState(
  overrides: Partial<TileAnimationEditorViewState> = {}
): TileAnimationEditorViewState {
  return {
    tilesetId: "tileset-1",
    tilesetKind: "image",
    tileWidth: 16,
    tileHeight: 24,
    selectedLocalId: 3,
    frames: [],
    sourceTiles: [{ localId: 3, preview: { kind: "fallback", tileWidth: 16, tileHeight: 24, gid: 5 } }],
    ...overrides
  };
}

describe("tile animation editor presentation helpers", () => {
  it("derives header controls and zoom options through exported APIs", () => {
    expect(defaultTileAnimationEditorZoom).toBe(1);
    expect(
      deriveTileAnimationEditorHeaderPresentation({
        selectedFrameIndex: null
      })
    ).toMatchObject({
      applyFrameDurationDisabled: true
    });
    expect(
      deriveTileAnimationEditorHeaderPresentation({
        selectedFrameIndex: 2
      }).zoomOptions.length
    ).toBeGreaterThan(0);
  });

  it("derives source tile palette modes through exported APIs", () => {
    expect(
      deriveTileAnimationSourceTilesPresentation(
        {
          viewState: createViewState({
            imageColumns: 8
          }),
          sourceLocalId: 3
        }
      )
    ).toEqual({
      kind: "image-grid",
      items: [
        {
          key: "tileset-1:3",
          localId: 3,
          preview: { kind: "fallback", tileWidth: 16, tileHeight: 24, gid: 5 },
          isSelected: true
        }
      ],
      tileWidth: 16,
      tileHeight: 24,
      imageColumns: 8
    });

    expect(
      deriveTileAnimationSourceTilesPresentation(
        {
          viewState: createViewState({
            tilesetKind: "image-collection"
          }),
          sourceLocalId: null
        }
      )
    ).toEqual({
      kind: "collection-grid",
      items: [
        {
          key: "tileset-1:3",
          localId: 3,
          preview: { kind: "fallback", tileWidth: 16, tileHeight: 24, gid: 5 },
          isSelected: false
        }
      ]
    });
  });

  it("derives frame list item presentation through exported APIs", () => {
    expect(
      deriveTileAnimationFrameListPresentation({
        frames: [],
        selectedFrameIndex: null,
        dragFrameIndex: null
      })
    ).toEqual({ kind: "empty" });

    expect(
      deriveTileAnimationFrameListPresentation({
        frames: [
          {
            tileId: 8,
            durationMs: 120,
            preview: { kind: "fallback", tileWidth: 16, tileHeight: 24, gid: 6 }
          },
          {
            tileId: 9,
            durationMs: 240,
            preview: { kind: "fallback", tileWidth: 16, tileHeight: 24, gid: 7 }
          }
        ],
        selectedFrameIndex: 1,
        dragFrameIndex: 0
      })
    ).toEqual({
      kind: "list",
      hasDraggingFrame: true,
      items: [
        {
          key: "0:8:120",
          frameIndex: 0,
          tileId: 8,
          durationMs: 120,
          preview: { kind: "fallback", tileWidth: 16, tileHeight: 24, gid: 6 },
          isSelected: false,
          isDragging: true,
          draggable: true,
          dropDisabled: true
        },
        {
          key: "1:9:240",
          frameIndex: 1,
          tileId: 9,
          durationMs: 240,
          preview: { kind: "fallback", tileWidth: 16, tileHeight: 24, gid: 7 },
          isSelected: true,
          isDragging: false,
          draggable: true,
          dropDisabled: false
        }
      ]
    });
  });

  it("creates frame list action plans through exported APIs", () => {
    const store = {
      selectFrame: vi.fn(),
      startFrameDrag: vi.fn(),
      endFrameDrag: vi.fn(),
      reorderFrameAt: vi.fn()
    };

    const selectPlan = createTileAnimationFrameListActionPlan({
      actionId: tileAnimationFrameListActionIds.selectFrame,
      frameIndex: 2
    });
    expect(selectPlan.kind).toBe("transition");
    if (selectPlan.kind === "transition") {
      selectPlan.run(store);
    }
    expect(store.selectFrame).toHaveBeenCalledWith(2);

    const dragStartPlan = createTileAnimationFrameListActionPlan({
      actionId: tileAnimationFrameListActionIds.startFrameDrag,
      frameIndex: 1
    });
    expect(dragStartPlan.kind).toBe("transition");
    if (dragStartPlan.kind === "transition") {
      dragStartPlan.run(store);
    }
    expect(store.startFrameDrag).toHaveBeenCalledWith(1);

    const dropPlan = createTileAnimationFrameListActionPlan({
      actionId: tileAnimationFrameListActionIds.dropFrameAt,
      frameIndex: 3,
      dropDisabled: false
    });
    expect(dropPlan.kind).toBe("transition");
    if (dropPlan.kind === "transition") {
      dropPlan.run(store);
    }
    expect(store.reorderFrameAt).toHaveBeenCalledWith(3);

    const endPlan = createTileAnimationFrameListActionPlan({
      actionId: tileAnimationFrameListActionIds.endFrameDrag,
      hasDraggingFrame: true
    });
    expect(endPlan.kind).toBe("transition");
    if (endPlan.kind === "transition") {
      endPlan.run(store);
    }
    expect(store.endFrameDrag).toHaveBeenCalledTimes(1);

    expect(
      createTileAnimationFrameListActionPlan({
        actionId: tileAnimationFrameListActionIds.dropFrameAt,
        frameIndex: 3,
        dropDisabled: true
      })
    ).toEqual({ kind: "noop" });
    expect(
      createTileAnimationFrameListActionPlan({
        actionId: tileAnimationFrameListActionIds.endFrameDrag,
        hasDraggingFrame: false
      })
    ).toEqual({ kind: "noop" });
  });

  it("creates source tile action plans through exported APIs", () => {
    const store = {
      selectSourceTile: vi.fn(),
      addFrame: vi.fn()
    };

    const selectPlan = createTileAnimationSourceTilesActionPlan({
      actionId: tileAnimationSourceTilesActionIds.selectSourceTile,
      localId: 12
    });
    expect(selectPlan.kind).toBe("transition");
    if (selectPlan.kind === "transition") {
      selectPlan.run(store);
    }
    expect(store.selectSourceTile).toHaveBeenCalledWith(12);

    const addFramePlan = createTileAnimationSourceTilesActionPlan({
      actionId: tileAnimationSourceTilesActionIds.addFrame,
      localId: 18
    });
    expect(addFramePlan.kind).toBe("transition");
    if (addFramePlan.kind === "transition") {
      addFramePlan.run(store);
    }
    expect(store.addFrame).toHaveBeenCalledWith(18);

    expect(
      createTileAnimationSourceTilesActionPlan({
        actionId: tileAnimationSourceTilesActionIds.addFrame
      })
    ).toEqual({ kind: "noop" });
  });

  it("creates keydown plans through exported APIs", () => {
    expect(
      createTileAnimationEditorKeyDownPlan({
        key: "Escape",
        selectedFrameIndex: null,
        isEditableTarget: false
      })
    ).toEqual({ kind: "close-dialog" });
    expect(
      createTileAnimationEditorKeyDownPlan({
        key: "Delete",
        selectedFrameIndex: 1,
        isEditableTarget: false
      })
    ).toEqual({ kind: "remove-selected-frame" });
    expect(
      createTileAnimationEditorKeyDownPlan({
        key: "Delete",
        selectedFrameIndex: 1,
        isEditableTarget: true
      })
    ).toEqual({ kind: "noop" });
  });

  it("creates keydown action plans through exported APIs", () => {
    const store = {
      closeDialog: vi.fn(),
      removeSelectedFrame: vi.fn()
    };

    const closePlan = createTileAnimationEditorKeyDownActionPlan({
      key: "Escape",
      selectedFrameIndex: null,
      isEditableTarget: false
    });
    expect(closePlan.kind).toBe("transition");
    if (closePlan.kind === "transition") {
      closePlan.run(store);
    }
    expect(store.closeDialog).toHaveBeenCalledTimes(1);

    const removePlan = createTileAnimationEditorKeyDownActionPlan({
      key: "Delete",
      selectedFrameIndex: 1,
      isEditableTarget: false
    });
    expect(removePlan.kind).toBe("transition");
    if (removePlan.kind === "transition") {
      removePlan.run(store);
    }
    expect(store.removeSelectedFrame).toHaveBeenCalledTimes(1);

    expect(
      createTileAnimationEditorKeyDownActionPlan({
        key: "Delete",
        selectedFrameIndex: 1,
        isEditableTarget: true
      })
    ).toEqual({ kind: "noop" });
  });
});
