import { describe, expect, it } from "vitest";
import { createMapObject } from "@pixel-editor/domain";

import {
  createRendererCanvasModifierSyncPlan,
  createRendererCanvasObjectGestureCompletionPlan,
  createRendererCanvasPointerDownPlan,
  createRendererCanvasPointerMovePlan,
  resolveRendererCanvasStatusInfo,
  type RendererCanvasPendingObjectGestureState
} from "../src/ui";

describe("renderer canvas interactions", () => {
  const heroObject = createMapObject({
    name: "Hero",
    shape: "rectangle",
    width: 16,
    height: 24
  });
  const treeObject = createMapObject({
    name: "Tree",
    shape: "rectangle",
    width: 16,
    height: 24
  });

  it("routes world tool pointer down through a focus-only plan", () => {
    const plan = createRendererCanvasPointerDownPlan({
      activeTool: "world-tool",
      selectedObjectIds: [],
      pointerId: 7,
      clientX: 24,
      clientY: 32,
      pickResult: { kind: "none" },
      mapPoint: undefined,
      tile: undefined,
      canStartStroke: true,
      canStartObjectResize: true
    });

    expect(plan).toEqual({ kind: "focus" });
  });

  it("creates resize and move plans from object-select hits", () => {
    const resizePlan = createRendererCanvasPointerDownPlan({
      activeTool: "object-select",
      selectedObjectIds: [heroObject.id],
      pointerId: 7,
      clientX: 24,
      clientY: 32,
      pickResult: {
        kind: "object-handle",
        handle: "se"
      },
      mapPoint: {
        worldX: 96,
        worldY: 112
      },
      tile: undefined,
      canStartStroke: false,
      canStartObjectResize: true
    });
    const movePlan = createRendererCanvasPointerDownPlan({
      activeTool: "object-select",
      selectedObjectIds: [heroObject.id],
      pointerId: 9,
      clientX: 48,
      clientY: 56,
      pickResult: {
        kind: "object",
        objectId: treeObject.id
      },
      mapPoint: {
        worldX: 128,
        worldY: 160
      },
      tile: undefined,
      canStartStroke: false,
      canStartObjectResize: true
    });

    expect(resizePlan).toEqual({
      kind: "object-resize",
      pendingGesture: {
        kind: "resize",
        pointerId: 7,
        objectId: heroObject.id,
        handle: "se",
        lastWorldX: 96,
        lastWorldY: 112
      }
    });
    expect(movePlan).toEqual({
      kind: "object-move",
      pendingGesture: {
        kind: "move",
        pointerId: 9,
        objectId: treeObject.id,
        startClientX: 48,
        startClientY: 56,
        startWorldX: 128,
        startWorldY: 160,
        lastWorldX: 128,
        lastWorldY: 160,
        dragging: false
      }
    });
  });

  it("treats rotate handles and missing capabilities as non-mutating plans", () => {
    const rotatePlan = createRendererCanvasPointerDownPlan({
      activeTool: "object-select",
      selectedObjectIds: [heroObject.id],
      pointerId: 7,
      clientX: 24,
      clientY: 32,
      pickResult: {
        kind: "object-handle",
        handle: "rotate"
      },
      mapPoint: {
        worldX: 96,
        worldY: 112
      },
      tile: undefined,
      canStartStroke: false,
      canStartObjectResize: true
    });
    const blockedResizePlan = createRendererCanvasPointerDownPlan({
      activeTool: "object-select",
      selectedObjectIds: [heroObject.id, treeObject.id],
      pointerId: 7,
      clientX: 24,
      clientY: 32,
      pickResult: {
        kind: "object-handle",
        handle: "e"
      },
      mapPoint: {
        worldX: 96,
        worldY: 112
      },
      tile: undefined,
      canStartStroke: false,
      canStartObjectResize: true
    });
    const strokePlan = createRendererCanvasPointerDownPlan({
      activeTool: "stamp",
      selectedObjectIds: [],
      pointerId: 11,
      clientX: 80,
      clientY: 64,
      pickResult: { kind: "none" },
      mapPoint: undefined,
      tile: {
        x: 3,
        y: 2
      },
      canStartStroke: true,
      canStartObjectResize: false
    });

    expect(rotatePlan).toEqual({ kind: "focus" });
    expect(blockedResizePlan).toEqual({ kind: "noop" });
    expect(strokePlan).toEqual({
      kind: "stroke",
      tile: {
        x: 3,
        y: 2
      }
    });
  });

  it("starts object drags only after the exported threshold logic allows it", () => {
    const pendingGesture: RendererCanvasPendingObjectGestureState = {
      kind: "move",
      pointerId: 9,
      objectId: treeObject.id,
      startClientX: 48,
      startClientY: 56,
      startWorldX: 128,
      startWorldY: 160,
      lastWorldX: 128,
      lastWorldY: 160,
      dragging: false
    };

    const earlyPlan = createRendererCanvasPointerMovePlan({
      activeTool: "object-select",
      pendingGesture,
      mapPoint: {
        worldX: 129,
        worldY: 161
      },
      clientX: 50,
      clientY: 58,
      canStartObjectMove: true
    });
    const dragPlan = createRendererCanvasPointerMovePlan({
      activeTool: "object-select",
      pendingGesture,
      mapPoint: {
        worldX: 144,
        worldY: 176
      },
      clientX: 56,
      clientY: 64,
      canStartObjectMove: true
    });

    expect(earlyPlan).toEqual({ kind: "noop" });
    expect(dragPlan).toEqual({
      kind: "object-move",
      worldX: 144,
      worldY: 176,
      startDragging: true
    });
  });

  it("builds completion plans for selection, move commit, and resize commit", () => {
    const selectPlan = createRendererCanvasObjectGestureCompletionPlan({
      pendingGesture: {
        kind: "move",
        pointerId: 9,
        objectId: treeObject.id,
        startClientX: 48,
        startClientY: 56,
        startWorldX: 128,
        startWorldY: 160,
        lastWorldX: 128,
        lastWorldY: 160,
        dragging: false
      },
      selectedObjectIds: [heroObject.id],
      mapPoint: undefined
    });
    const movePlan = createRendererCanvasObjectGestureCompletionPlan({
      pendingGesture: {
        kind: "move",
        pointerId: 9,
        objectId: treeObject.id,
        startClientX: 48,
        startClientY: 56,
        startWorldX: 128,
        startWorldY: 160,
        lastWorldX: 144,
        lastWorldY: 176,
        dragging: true
      },
      selectedObjectIds: [treeObject.id],
      mapPoint: {
        worldX: 160,
        worldY: 192
      }
    });
    const resizePlan = createRendererCanvasObjectGestureCompletionPlan({
      pendingGesture: {
        kind: "resize",
        pointerId: 9,
        objectId: treeObject.id,
        handle: "se",
        lastWorldX: 144,
        lastWorldY: 176
      },
      selectedObjectIds: [treeObject.id],
      mapPoint: {
        worldX: 160,
        worldY: 192
      }
    });

    expect(selectPlan).toEqual({
      kind: "select-object",
      objectId: treeObject.id
    });
    expect(movePlan).toEqual({
      kind: "object-move",
      commitLocation: {
        worldX: 160,
        worldY: 192
      }
    });
    expect(resizePlan).toEqual({
      kind: "object-resize",
      commitLocation: {
        worldX: 160,
        worldY: 192
      }
    });
  });

  it("exposes modifier sync and status formatting through pure helpers", () => {
    const statusInfo = resolveRendererCanvasStatusInfo({
      activeTool: "object-select",
      tile: {
        x: 4,
        y: 2
      },
      mapPoint: {
        worldX: 130.6,
        worldY: 191.4
      }
    });
    const modifierPlan = createRendererCanvasModifierSyncPlan({
      activeTool: "object-select",
      pendingGesture: {
        kind: "resize",
        pointerId: 9,
        objectId: treeObject.id,
        handle: "e",
        lastWorldX: 144,
        lastWorldY: 176
      }
    });

    expect(statusInfo).toBe("4, 2 (131, 191)");
    expect(modifierPlan).toEqual({
      kind: "object-resize",
      worldX: 144,
      worldY: 176
    });
  });
});
