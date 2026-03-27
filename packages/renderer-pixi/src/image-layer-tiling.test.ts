import { describe, expect, it } from "vitest";

import { collectImageLayerTilePositions } from "./image-layer-tiling";

describe("image layer tiling", () => {
  it("returns a single origin tile when repeat is disabled", () => {
    expect(
      collectImageLayerTilePositions({
        screenX: 40,
        screenY: 30,
        screenWidth: 100,
        screenHeight: 80,
        repeatX: false,
        repeatY: false,
        canvasX: 0,
        canvasY: 0,
        canvasWidth: 320,
        canvasHeight: 240
      })
    ).toEqual([{ x: 0, y: 0 }]);
  });

  it("tiles across the visible canvas range when horizontal repeat is enabled", () => {
    expect(
      collectImageLayerTilePositions({
        screenX: 40,
        screenY: 30,
        screenWidth: 100,
        screenHeight: 80,
        repeatX: true,
        repeatY: false,
        canvasX: 0,
        canvasY: 0,
        canvasWidth: 320,
        canvasHeight: 240
      })
    ).toEqual([
      { x: -100, y: 0 },
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 200, y: 0 }
    ]);
  });

  it("tiles in both axes when repeatX and repeatY are enabled", () => {
    expect(
      collectImageLayerTilePositions({
        screenX: -20,
        screenY: 10,
        screenWidth: 64,
        screenHeight: 48,
        repeatX: true,
        repeatY: true,
        canvasX: 0,
        canvasY: 0,
        canvasWidth: 160,
        canvasHeight: 120
      })
    ).toEqual([
      { x: 0, y: -48 },
      { x: 0, y: 0 },
      { x: 0, y: 48 },
      { x: 0, y: 96 },
      { x: 64, y: -48 },
      { x: 64, y: 0 },
      { x: 64, y: 48 },
      { x: 64, y: 96 },
      { x: 128, y: -48 },
      { x: 128, y: 0 },
      { x: 128, y: 48 },
      { x: 128, y: 96 }
    ]);
  });
});
