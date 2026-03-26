import { describe, expect, it } from "vitest";

import { createTileTransformMatrix } from "./tile-transform";

describe("tile transform matrix", () => {
  it("scales unflipped tiles into the target cell", () => {
    const matrix = createTileTransformMatrix({
      cell: {
        flipHorizontally: false,
        flipVertically: false,
        flipDiagonally: false
      },
      textureWidth: 32,
      textureHeight: 16,
      cellWidth: 64,
      cellHeight: 48,
      screenX: 10,
      screenY: 20
    });

    expect(matrix.apply({ x: 0, y: 0 })).toEqual({ x: 10, y: 20 });
    expect(matrix.apply({ x: 32, y: 16 })).toEqual({ x: 74, y: 68 });
  });

  it("applies horizontal and vertical flips around the cell bounds", () => {
    const matrix = createTileTransformMatrix({
      cell: {
        flipHorizontally: true,
        flipVertically: true,
        flipDiagonally: false
      },
      textureWidth: 32,
      textureHeight: 16,
      cellWidth: 64,
      cellHeight: 48,
      screenX: 10,
      screenY: 20
    });

    expect(matrix.apply({ x: 0, y: 0 })).toEqual({ x: 74, y: 68 });
    expect(matrix.apply({ x: 32, y: 16 })).toEqual({ x: 10, y: 20 });
  });

  it("applies diagonal flip before horizontal and vertical flips", () => {
    const diagonalOnly = createTileTransformMatrix({
      cell: {
        flipHorizontally: false,
        flipVertically: false,
        flipDiagonally: true
      },
      textureWidth: 32,
      textureHeight: 16,
      cellWidth: 64,
      cellHeight: 48,
      screenX: 10,
      screenY: 20
    });
    const diagonalAndHorizontal = createTileTransformMatrix({
      cell: {
        flipHorizontally: true,
        flipVertically: false,
        flipDiagonally: true
      },
      textureWidth: 32,
      textureHeight: 16,
      cellWidth: 64,
      cellHeight: 48,
      screenX: 10,
      screenY: 20
    });

    expect(diagonalOnly.apply({ x: 32, y: 0 })).toEqual({ x: 10, y: 68 });
    expect(diagonalOnly.apply({ x: 0, y: 16 })).toEqual({ x: 74, y: 20 });
    expect(diagonalAndHorizontal.apply({ x: 0, y: 0 })).toEqual({
      x: 74,
      y: 20
    });
    expect(diagonalAndHorizontal.apply({ x: 0, y: 16 })).toEqual({
      x: 10,
      y: 20
    });
  });
});
