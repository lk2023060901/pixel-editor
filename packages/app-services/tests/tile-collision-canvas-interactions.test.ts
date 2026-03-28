import { describe, expect, it } from "vitest";
import { createMap, createMapObject, createObjectLayer } from "@pixel-editor/domain";

import {
  createTileCollisionCanvasObjectTransformPreview,
  createTileCollisionCanvasPointerDownPlan,
  createTileCollisionCanvasPointerMovePlan,
  createTileCollisionCanvasPointerUpPlan,
  defaultTileCollisionCanvasDimensions,
  deriveTileCollisionCanvasLayout
} from "../src/ui";

const rectangle = createMapObject({
  name: "Collider",
  shape: "rectangle",
  width: 16,
  height: 10
});
const polygon = createMapObject({
  name: "Polygon",
  shape: "polygon",
  points: [
    { x: 0, y: 0 },
    { x: 16, y: 0 },
    { x: 16, y: 16 }
  ]
});

const canvasViewState = {
  tileWidth: 32,
  tileHeight: 16,
  tilePreview: {
    kind: "fallback" as const,
    tileWidth: 32,
    tileHeight: 16,
    gid: 5
  },
  previewMap: createMap({
    name: "tile-collision-preview",
    orientation: "orthogonal",
    width: 1,
    height: 1,
    tileWidth: 32,
    tileHeight: 16,
    layers: [
      createObjectLayer({
        name: "Collision",
        objects: [rectangle, polygon]
      })
    ]
  }),
  objects: [rectangle, polygon]
};

describe("tile collision canvas interaction helpers", () => {
  it("derives the canvas layout through exported APIs", () => {
    expect(
      deriveTileCollisionCanvasLayout({
        viewState: canvasViewState
      })
    ).toEqual({
      ...defaultTileCollisionCanvasDimensions,
      scale: 9.75,
      tileWidth: 312,
      tileHeight: 156,
      originX: 24,
      originY: 102
    });
  });

  it("creates pointer-down plans that clear selection or start dragging", () => {
    expect(
      createTileCollisionCanvasPointerDownPlan({
        pointerId: 7,
        point: { x: 40, y: 48 },
        pickedObjectId: undefined,
        selectedObjectIds: [rectangle.id]
      })
    ).toEqual({ kind: "clear-selection" });

    expect(
      createTileCollisionCanvasPointerDownPlan({
        pointerId: 7,
        point: { x: 40, y: 48 },
        pickedObjectId: rectangle.id,
        selectedObjectIds: [rectangle.id, polygon.id]
      })
    ).toEqual({
      kind: "select-and-drag",
      nextSelectedObjectIds: [rectangle.id, polygon.id],
      dragState: {
        pointerId: 7,
        objectIds: [rectangle.id, polygon.id],
        startLocalX: 40,
        startLocalY: 48,
        deltaX: 0,
        deltaY: 0
      }
    });

    expect(
      createTileCollisionCanvasPointerDownPlan({
        pointerId: 9,
        point: { x: 18, y: 22 },
        pickedObjectId: polygon.id,
        selectedObjectIds: [rectangle.id]
      })
    ).toEqual({
      kind: "select-and-drag",
      nextSelectedObjectIds: [polygon.id],
      dragState: {
        pointerId: 9,
        objectIds: [polygon.id],
        startLocalX: 18,
        startLocalY: 22,
        deltaX: 0,
        deltaY: 0
      }
    });
  });

  it("derives drag updates, previews, and commits through shared helpers", () => {
    const dragState = {
      pointerId: 7,
      objectIds: [rectangle.id],
      startLocalX: 40,
      startLocalY: 48,
      deltaX: 0,
      deltaY: 0
    };

    expect(
      createTileCollisionCanvasPointerMovePlan({
        dragState,
        pointerId: 8,
        point: { x: 64, y: 80 },
        scale: 8
      })
    ).toEqual({ kind: "noop" });

    const movePlan = createTileCollisionCanvasPointerMovePlan({
      dragState,
      pointerId: 7,
      point: { x: 64, y: 80 },
      scale: 8
    });

    expect(movePlan).toEqual({
      kind: "drag",
      dragState: {
        ...dragState,
        deltaX: 3,
        deltaY: 4
      }
    });
    expect(
      createTileCollisionCanvasObjectTransformPreview(
        movePlan.kind === "drag" ? movePlan.dragState : undefined
      )
    ).toEqual({
      kind: "move",
      objectIds: [rectangle.id],
      deltaX: 3,
      deltaY: 4
    });
    expect(
      createTileCollisionCanvasPointerUpPlan({
        dragState: movePlan.kind === "drag" ? movePlan.dragState : undefined,
        pointerId: 7
      })
    ).toEqual({
      kind: "finish-drag",
      commit: {
        objectIds: [rectangle.id],
        deltaX: 3,
        deltaY: 4
      }
    });
  });

  it("omits move commits when the drag never left the starting tile position", () => {
    const dragState = {
      pointerId: 7,
      objectIds: [rectangle.id],
      startLocalX: 40,
      startLocalY: 48,
      deltaX: 0,
      deltaY: 0
    };

    expect(createTileCollisionCanvasObjectTransformPreview(undefined)).toBeUndefined();
    expect(
      createTileCollisionCanvasPointerUpPlan({
        dragState,
        pointerId: 7
      })
    ).toEqual({
      kind: "finish-drag"
    });
  });
});
