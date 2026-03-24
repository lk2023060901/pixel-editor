import { describe, expect, it } from "vitest";

import {
  createPatternTileStamp,
  createSingleTileStamp,
  getTileStampFootprint,
  getTileStampPrimaryGid,
  materializeTileStampCells
} from "../src/index";

describe("tile stamp helpers", () => {
  it("materializes single-tile and pattern stamps deterministically", () => {
    const single = createSingleTileStamp(9);
    const pattern = createPatternTileStamp({
      width: 2,
      height: 2,
      cells: [
        { offsetX: 1, offsetY: 0, gid: 4 },
        { offsetX: 0, offsetY: 0, gid: 3 },
        { offsetX: 0, offsetY: 1, gid: null }
      ]
    });

    expect(getTileStampPrimaryGid(single)).toBe(9);
    expect(getTileStampPrimaryGid(pattern)).toBe(3);
    expect(getTileStampFootprint(pattern)).toEqual({
      width: 2,
      height: 2,
      cellCount: 3
    });
    expect(materializeTileStampCells(pattern, 5, 7)).toEqual([
      { x: 5, y: 7, gid: 3 },
      { x: 6, y: 7, gid: 4 },
      { x: 5, y: 8, gid: null }
    ]);
  });
});
