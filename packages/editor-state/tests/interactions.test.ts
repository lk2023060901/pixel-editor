import { describe, expect, it } from "vitest";

import { createEntityId } from "@pixel-editor/domain";

import {
  clearCanvasPreview,
  createEditorInteractionState,
  createShapeFillCanvasPreview,
  createTileSelectionCanvasPreview,
  updateShapeFillCanvasPreview
} from "../src/index";

describe("editor interaction state", () => {
  it("creates and clears shape fill previews through explicit helpers", () => {
    const initial = createEditorInteractionState();
    const preview = createShapeFillCanvasPreview({
      mapId: createEntityId("map"),
      layerId: createEntityId("layer"),
      mode: "rectangle",
      originX: 2,
      originY: 3,
      gid: 7,
      modifiers: {
        lockAspectRatio: true
      }
    });

    const updated = updateShapeFillCanvasPreview(preview, {
      currentX: 4,
      currentY: 5,
      coordinates: [
        { x: 2, y: 3 },
        { x: 3, y: 3 }
      ],
      modifiers: {
        lockAspectRatio: true
      }
    });
    const next = {
      ...initial,
      canvasPreview: updated
    };

    expect(next.canvasPreview.kind).toBe("shape-fill");
    expect(next.canvasPreview.kind === "shape-fill" ? next.canvasPreview.coordinates : []).toEqual([
      { x: 2, y: 3 },
      { x: 3, y: 3 }
    ]);
    expect(clearCanvasPreview(next).canvasPreview).toEqual({ kind: "none" });
  });

  it("creates tile selection previews through explicit helpers", () => {
    const preview = createTileSelectionCanvasPreview({
      mapId: createEntityId("map"),
      layerId: createEntityId("layer"),
      originX: 4,
      originY: 5
    });

    expect(preview.kind).toBe("tile-selection");
    expect(preview.coordinates).toEqual([]);
    expect(preview.currentX).toBe(4);
    expect(preview.currentY).toBe(5);
  });
});
