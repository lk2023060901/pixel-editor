import { describe, expect, it } from "vitest";

import {
  createEmptyClipboardState,
  createSingleTileStamp,
  createTileClipboardState,
  hasClipboardContent
} from "../src/index";

describe("clipboard helpers", () => {
  it("builds empty and tile clipboard snapshots explicitly", () => {
    const emptyClipboard = createEmptyClipboardState();
    const tileClipboard = createTileClipboardState({
      stamp: createSingleTileStamp(8),
      sourceBounds: {
        x: 2,
        y: 3,
        width: 1,
        height: 1
      }
    });

    expect(hasClipboardContent(emptyClipboard)).toBe(false);
    expect(hasClipboardContent(tileClipboard)).toBe(true);
    expect(tileClipboard.kind === "tile" ? tileClipboard.sourceBounds : null).toEqual({
      x: 2,
      y: 3,
      width: 1,
      height: 1
    });
  });
});
