import type { TranslationFn } from "@pixel-editor/i18n";
import { describe, expect, it, vi } from "vitest";

import {
  createTileCollisionEditorDialogActionPlan,
  createTileCollisionEditorKeyDownPlan,
  createTileCollisionObjectListActionPlan,
  createTileCollisionEditorToolbarActionPlan,
  deriveTileCollisionObjectListPresentation,
  deriveTileCollisionEditorToolbarPresentation,
  tileCollisionEditorToolbarActionIds
} from "../src/ui";

const t = ((key: string) => key) as TranslationFn;

describe("tile collision editor presentation helpers", () => {
  it("derives toolbar actions and disabled state through exported APIs", () => {
    expect(
      deriveTileCollisionEditorToolbarPresentation({
        selectedObjectId: undefined,
        t
      })
    ).toEqual({
      createActions: [
        {
          actionId: tileCollisionEditorToolbarActionIds.createRectangle,
          label: "objectShape.rectangle",
          disabled: false
        },
        {
          actionId: tileCollisionEditorToolbarActionIds.createPoint,
          label: "objectShape.point",
          disabled: false
        },
        {
          actionId: tileCollisionEditorToolbarActionIds.createEllipse,
          label: "objectShape.ellipse",
          disabled: false
        },
        {
          actionId: tileCollisionEditorToolbarActionIds.createCapsule,
          label: "objectShape.capsule",
          disabled: false
        },
        {
          actionId: tileCollisionEditorToolbarActionIds.createPolygon,
          label: "objectShape.polygon",
          disabled: false
        }
      ],
      commandActions: [
        {
          actionId: tileCollisionEditorToolbarActionIds.removeSelectedObject,
          label: "common.remove",
          disabled: true
        },
        {
          actionId: tileCollisionEditorToolbarActionIds.moveSelectedObjectUp,
          label: "tileCollisionEditor.moveUp",
          disabled: true
        },
        {
          actionId: tileCollisionEditorToolbarActionIds.moveSelectedObjectDown,
          label: "tileCollisionEditor.moveDown",
          disabled: true
        }
      ]
    });
  });

  it("derives object list presentation through exported APIs", () => {
    expect(
      deriveTileCollisionObjectListPresentation({
        collisionObjects: [],
        selectedObjectId: undefined,
        t
      })
    ).toEqual({ kind: "empty" });

    expect(
      deriveTileCollisionObjectListPresentation({
        collisionObjects: [
          {
            id: "object-1" as never,
            name: "Collider A",
            shape: "rectangle",
            visible: true
          } as never,
          {
            id: "object-2" as never,
            name: "Collider B",
            shape: "polygon",
            visible: true
          } as never
        ],
        selectedObjectId: "object-2" as never,
        t
      })
    ).toEqual({
      kind: "list",
      items: [
        {
          id: "object-1",
          name: "Collider A",
          shapeLabel: "objectShape.rectangle",
          tone: "interactive"
        },
        {
          id: "object-2",
          name: "Collider B",
          shapeLabel: "objectShape.polygon",
          tone: "selected"
        }
      ]
    });
  });

  it("creates toolbar action plans through exported APIs", () => {
    expect(
      createTileCollisionEditorToolbarActionPlan({
        actionId: tileCollisionEditorToolbarActionIds.createCapsule,
        selectedObjectId: undefined
      })
    ).toEqual({
      kind: "create-object",
      shape: "capsule"
    });
    expect(
      createTileCollisionEditorToolbarActionPlan({
        actionId: tileCollisionEditorToolbarActionIds.removeSelectedObject,
        selectedObjectId: "object-1" as never
      })
    ).toEqual({
      kind: "remove-selected-object"
    });
    expect(
      createTileCollisionEditorToolbarActionPlan({
        actionId: tileCollisionEditorToolbarActionIds.moveSelectedObjectUp,
        selectedObjectId: "object-1" as never
      })
    ).toEqual({
      kind: "reorder-selected-object",
      direction: "up"
    });
    expect(
      createTileCollisionEditorToolbarActionPlan({
        actionId: tileCollisionEditorToolbarActionIds.moveSelectedObjectDown,
        selectedObjectId: "object-1" as never
      })
    ).toEqual({
      kind: "reorder-selected-object",
      direction: "down"
    });
    expect(
      createTileCollisionEditorToolbarActionPlan({
        actionId: tileCollisionEditorToolbarActionIds.removeSelectedObject,
        selectedObjectId: undefined
      })
    ).toEqual({ kind: "noop" });
  });

  it("creates keydown plans through exported APIs", () => {
    expect(
      createTileCollisionEditorKeyDownPlan({
        key: "Escape",
        selectedObjectId: undefined
      })
    ).toEqual({ kind: "close-dialog" });
    expect(
      createTileCollisionEditorKeyDownPlan({
        key: "Delete",
        selectedObjectId: "object-1" as never
      })
    ).toEqual({ kind: "remove-selected-object" });
    expect(
      createTileCollisionEditorKeyDownPlan({
        key: "Backspace",
        selectedObjectId: undefined
      })
    ).toEqual({ kind: "noop" });
  });

  it("creates object list action plans through exported APIs", () => {
    const store = {
      selectObject: vi.fn()
    };

    const plan = createTileCollisionObjectListActionPlan({
      objectId: "object-2" as never
    });
    expect(plan.kind).toBe("transition");
    if (plan.kind === "transition") {
      plan.run(store);
    }
    expect(store.selectObject).toHaveBeenCalledWith("object-2");

    expect(createTileCollisionObjectListActionPlan({ objectId: undefined })).toEqual({
      kind: "noop"
    });
  });

  it("creates dialog action plans through exported APIs", () => {
    const store = {
      createObject: vi.fn(),
      removeSelectedObject: vi.fn(),
      reorderSelectedObject: vi.fn(),
      closeDialog: vi.fn()
    };

    const createPlan = createTileCollisionEditorDialogActionPlan({
      kind: "create-object",
      shape: "ellipse"
    });
    expect(createPlan.kind).toBe("transition");
    if (createPlan.kind === "transition") {
      createPlan.run(store);
    }
    expect(store.createObject).toHaveBeenCalledWith("ellipse");

    const removePlan = createTileCollisionEditorDialogActionPlan({
      kind: "remove-selected-object"
    });
    expect(removePlan.kind).toBe("transition");
    if (removePlan.kind === "transition") {
      removePlan.run(store);
    }
    expect(store.removeSelectedObject).toHaveBeenCalledTimes(1);

    const reorderPlan = createTileCollisionEditorDialogActionPlan({
      kind: "reorder-selected-object",
      direction: "down"
    });
    expect(reorderPlan.kind).toBe("transition");
    if (reorderPlan.kind === "transition") {
      reorderPlan.run(store);
    }
    expect(store.reorderSelectedObject).toHaveBeenCalledWith("down");

    const closePlan = createTileCollisionEditorDialogActionPlan({
      kind: "close-dialog"
    });
    expect(closePlan.kind).toBe("transition");
    if (closePlan.kind === "transition") {
      closePlan.run(store);
    }
    expect(store.closeDialog).toHaveBeenCalledTimes(1);

    expect(createTileCollisionEditorDialogActionPlan({ kind: "noop" })).toEqual({
      kind: "noop"
    });
  });
});
