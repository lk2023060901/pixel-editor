import { createMapObject } from "@pixel-editor/domain";
import { describe, expect, it } from "vitest";

import {
  createTileCollisionObjectDraft,
  deriveTileCollisionEditorSelection,
  formatTileCollisionObjectPoints,
  parseTileCollisionObjectPoints,
  resolveTileCollisionEditorSelectedObjectId,
  resolveTileCollisionObjectClassNameCommit,
  resolveTileCollisionObjectNameCommit,
  resolveTileCollisionObjectNumericFieldCommit,
  resolveTileCollisionObjectPointsCommit
} from "../src/ui";

describe("tile collision editor state helpers", () => {
  it("derives selection and draft state through exported APIs", () => {
    const rectangle = createMapObject({
      name: "Collider",
      className: "solid",
      shape: "rectangle",
      x: 12,
      y: 8,
      width: 16,
      height: 10,
      rotation: 45
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

    expect(resolveTileCollisionEditorSelectedObjectId([rectangle, polygon], undefined)).toBe(
      rectangle.id
    );
    expect(resolveTileCollisionEditorSelectedObjectId([rectangle, polygon], polygon.id)).toBe(
      polygon.id
    );
    expect(resolveTileCollisionEditorSelectedObjectId([rectangle, polygon], rectangle.id)).toBe(
      rectangle.id
    );
    expect(
      resolveTileCollisionEditorSelectedObjectId([rectangle, polygon], "missing" as never)
    ).toBe(rectangle.id);
    expect(deriveTileCollisionEditorSelection([], rectangle.id)).toEqual({
      selectedObjectId: undefined,
      selectedObject: undefined,
      selectedObjectIds: []
    });
    expect(deriveTileCollisionEditorSelection([rectangle, polygon], polygon.id)).toEqual({
      selectedObjectId: polygon.id,
      selectedObject: polygon,
      selectedObjectIds: [polygon.id]
    });
    expect(createTileCollisionObjectDraft(polygon)).toEqual({
      name: "Polygon",
      className: "",
      x: "0",
      y: "0",
      width: "0",
      height: "0",
      rotation: "0",
      points: "0,0 16,0 16,16"
    });
  });

  it("formats and parses collision points through shared helpers", () => {
    expect(formatTileCollisionObjectPoints([{ x: 1, y: 2 }, { x: 3.5, y: 4 }])).toBe(
      "1,2 3.5,4"
    );
    expect(parseTileCollisionObjectPoints("1,2 3.5,4")).toEqual([
      { x: 1, y: 2 },
      { x: 3.5, y: 4 }
    ]);
    expect(parseTileCollisionObjectPoints("   ")).toEqual([]);
    expect(() => parseTileCollisionObjectPoints("1,2 bad")).toThrow("Invalid point");
  });

  it("resolves name and class patches through exported APIs", () => {
    const collisionObject = createMapObject({
      name: "Collider",
      className: "solid",
      shape: "rectangle"
    });
    const draft = createTileCollisionObjectDraft(collisionObject);

    expect(
      resolveTileCollisionObjectNameCommit({
        draft: {
          ...draft,
          name: "  "
        },
        selectedObject: collisionObject
      })
    ).toEqual({
      name: "Collider"
    });
    expect(
      resolveTileCollisionObjectClassNameCommit({
        draft: {
          ...draft,
          className: "trigger"
        }
      })
    ).toEqual({
      className: "trigger"
    });
  });

  it("normalizes numeric and points commits through exported APIs", () => {
    const polygon = createMapObject({
      name: "Polygon",
      shape: "polygon",
      x: 5,
      y: 6,
      width: 16,
      height: 12,
      points: [
        { x: 0, y: 0 },
        { x: 16, y: 0 },
        { x: 16, y: 16 }
      ]
    });
    const draft = createTileCollisionObjectDraft(polygon);

    expect(
      resolveTileCollisionObjectNumericFieldCommit({
        draft: {
          ...draft,
          width: "24.5"
        },
        selectedObject: polygon,
        field: "width"
      })
    ).toEqual({
      nextDraft: {
        ...draft,
        width: "24.5"
      },
      patch: {
        width: 24.5
      }
    });
    expect(
      resolveTileCollisionObjectNumericFieldCommit({
        draft: {
          ...draft,
          width: "oops"
        },
        selectedObject: polygon,
        field: "width"
      })
    ).toEqual({
      nextDraft: {
        ...draft,
        width: "16"
      }
    });
    expect(
      resolveTileCollisionObjectPointsCommit({
        draft: {
          ...draft,
          points: "1,2 3,4"
        },
        selectedObject: polygon
      })
    ).toEqual({
      nextDraft: {
        ...draft,
        points: "1,2 3,4"
      },
      patch: {
        points: [
          { x: 1, y: 2 },
          { x: 3, y: 4 }
        ]
      }
    });
    expect(
      resolveTileCollisionObjectPointsCommit({
        draft: {
          ...draft,
          points: "bad"
        },
        selectedObject: polygon
      })
    ).toEqual({
      nextDraft: {
        ...draft,
        points: "0,0 16,0 16,16"
      }
    });
  });
});
