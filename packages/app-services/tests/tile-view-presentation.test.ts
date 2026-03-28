import { describe, expect, it } from "vitest";

import {
  formatTileViewZoomLabel,
  getTileViewZoomOptionItems,
  tileViewZoomOptions
} from "../src/ui";

describe("tile view presentation helpers", () => {
  it("exports zoom options and labels through shared APIs", () => {
    expect(tileViewZoomOptions).toEqual([0.5, 1, 2, 4]);
    expect(formatTileViewZoomLabel(0.5)).toBe("50 %");
    expect(formatTileViewZoomLabel(2)).toBe("200 %");
    expect(getTileViewZoomOptionItems()).toEqual([
      { value: 0.5, label: "50 %" },
      { value: 1, label: "100 %" },
      { value: 2, label: "200 %" },
      { value: 4, label: "400 %" }
    ]);
  });
});
