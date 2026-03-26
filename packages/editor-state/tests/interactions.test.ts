import { describe, expect, it } from "vitest";

import { createEntityId } from "@pixel-editor/domain";

import {
  clearCanvasPreview,
  clearObjectTransformPreview,
  createEditorInteractionState,
  createObjectMovePreview,
  createObjectResizePreview,
  createShapeFillCanvasPreview,
  createTileSelectionCanvasPreview,
  updateObjectMovePreview,
  updateObjectResizePreview,
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

  it("creates and updates object move previews through explicit helpers", () => {
    const initial = createEditorInteractionState();
    const preview = createObjectMovePreview({
      mapId: createEntityId("map"),
      layerId: createEntityId("layer"),
      objectIds: [createEntityId("object"), createEntityId("object")],
      anchorX: 32,
      anchorY: 48,
      referenceX: 16,
      referenceY: 24
    });

    const updated = updateObjectMovePreview(preview, {
      currentX: 44,
      currentY: 60,
      deltaX: 16,
      deltaY: 0,
      modifiers: {
        snapToGrid: true
      }
    });
    const next = {
      ...initial,
      objectTransformPreview: updated
    };

    expect(next.objectTransformPreview.kind).toBe("object-move");
    expect(
      next.objectTransformPreview.kind === "object-move"
        ? {
            objectIds: next.objectTransformPreview.objectIds,
            deltaX: next.objectTransformPreview.deltaX,
            deltaY: next.objectTransformPreview.deltaY,
            modifiers: next.objectTransformPreview.modifiers
          }
        : null
    ).toEqual({
      objectIds: preview.objectIds,
      deltaX: 16,
      deltaY: 0,
      modifiers: {
        snapToGrid: true
      }
    });
    expect(clearObjectTransformPreview(next).objectTransformPreview).toEqual({
      kind: "none"
    });
  });

  it("creates and updates object resize previews through explicit helpers", () => {
    const initial = createEditorInteractionState();
    const preview = createObjectResizePreview({
      mapId: createEntityId("map"),
      layerId: createEntityId("layer"),
      objectId: createEntityId("object"),
      handle: "se",
      x: 32,
      y: 48,
      width: 16,
      height: 24,
      currentX: 48,
      currentY: 72
    });

    const updated = updateObjectResizePreview(preview, {
      currentX: 64,
      currentY: 88,
      x: 32,
      y: 48,
      width: 32,
      height: 40,
      modifiers: {
        snapToGrid: true
      }
    });
    const next = {
      ...initial,
      objectTransformPreview: updated
    };

    expect(next.objectTransformPreview.kind).toBe("object-resize");
    expect(
      next.objectTransformPreview.kind === "object-resize"
        ? {
            objectId: next.objectTransformPreview.objectId,
            handle: next.objectTransformPreview.handle,
            x: next.objectTransformPreview.x,
            y: next.objectTransformPreview.y,
            width: next.objectTransformPreview.width,
            height: next.objectTransformPreview.height,
            modifiers: next.objectTransformPreview.modifiers
          }
        : null
    ).toEqual({
      objectId: preview.objectId,
      handle: "se",
      x: 32,
      y: 48,
      width: 32,
      height: 40,
      modifiers: {
        snapToGrid: true
      }
    });
  });
});
