import { createEntityId } from "@pixel-editor/domain";
import { describe, expect, it } from "vitest";

import {
  deriveFilteredObjectsPanelItems,
  normalizeObjectsPanelFilterKeyword
} from "../src/ui";

describe("objects panel state helpers", () => {
  it("normalizes filter keywords and filters objects through exported APIs", () => {
    const firstObjectId = createEntityId("object");
    const secondObjectId = createEntityId("object");
    const objects = [
      {
        id: firstObjectId,
        name: "Pine Tree",
        shape: "rectangle" as const,
        x: 0,
        y: 0,
        width: 16,
        height: 32,
        isSelected: false
      },
      {
        id: secondObjectId,
        name: "Boulder",
        shape: "ellipse" as const,
        x: 4,
        y: 8,
        width: 12,
        height: 10,
        isSelected: true
      }
    ];

    expect(normalizeObjectsPanelFilterKeyword("  Tree ")).toBe("tree");
    expect(
      deriveFilteredObjectsPanelItems({
        objects,
        filterText: " tree ",
        getShapeLabel: (shape) => (shape === "rectangle" ? "Rectangle" : "Ellipse")
      })
    ).toEqual([objects[0]]);
    expect(
      deriveFilteredObjectsPanelItems({
        objects,
        filterText: "ELLIPSE",
        getShapeLabel: (shape) => (shape === "rectangle" ? "Rectangle" : "Ellipse")
      })
    ).toEqual([objects[1]]);
    expect(
      deriveFilteredObjectsPanelItems({
        objects,
        filterText: "   ",
        getShapeLabel: (shape) => (shape === "rectangle" ? "Rectangle" : "Ellipse")
      })
    ).toBe(objects);
  });
});
