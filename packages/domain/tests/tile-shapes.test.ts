import { describe, expect, it } from "vitest";

import {
  collectEllipseShapeTiles,
  collectRectangleShapeTiles,
  normalizeTileShapeBounds
} from "@pixel-editor/domain";

function sortCoordinates(coordinates: Array<{ x: number; y: number }>) {
  return [...coordinates].sort((left, right) =>
    left.y === right.y ? left.x - right.x : left.y - right.y
  );
}

describe("tile shape helpers", () => {
  it("collects filled rectangle coordinates", () => {
    expect(
      sortCoordinates(collectRectangleShapeTiles(2, 3, 4, 4))
    ).toEqual([
      { x: 2, y: 3 },
      { x: 3, y: 3 },
      { x: 4, y: 3 },
      { x: 2, y: 4 },
      { x: 3, y: 4 },
      { x: 4, y: 4 }
    ]);
  });

  it("normalizes square bounds with aspect ratio lock and center origin", () => {
    expect(
      normalizeTileShapeBounds(5, 5, 8, 7, {
        lockAspectRatio: true,
        fromCenter: true
      })
    ).toEqual({
      x: 3,
      y: 3,
      width: 5,
      height: 5
    });
  });

  it("collects ellipse coordinates inside the normalized bounds", () => {
    const ellipse = collectEllipseShapeTiles(5, 5, 8, 7, {
      lockAspectRatio: true,
      fromCenter: true
    });

    expect(ellipse).toContainEqual({ x: 5, y: 5 });
    expect(ellipse).toContainEqual({ x: 5, y: 3 });
    expect(ellipse).toContainEqual({ x: 3, y: 5 });
    expect(ellipse).not.toContainEqual({ x: 3, y: 3 });
    expect(ellipse).not.toContainEqual({ x: 7, y: 7 });
  });
});
