import { describe, expect, it } from "vitest";

import { createMap } from "@pixel-editor/domain";

import {
  computeParallaxAdjustedViewportOriginX,
  computeParallaxAdjustedViewportOriginY
} from "./projection-utils";

describe("projection utils", () => {
  it("keeps viewport origin unchanged when parallax factors are 1", () => {
    const map = createMap({
      name: "demo",
      orientation: "orthogonal",
      width: 10,
      height: 10,
      tileWidth: 32,
      tileHeight: 32,
      parallaxOriginX: 24,
      parallaxOriginY: 12
    });

    expect(
      computeParallaxAdjustedViewportOriginX({
        viewportOriginX: 180,
        parallaxFactorX: 1,
        map,
        geometry: {
          tileWidth: 64,
          tileHeight: 64
        }
      })
    ).toBe(180);
    expect(
      computeParallaxAdjustedViewportOriginY({
        viewportOriginY: 90,
        parallaxFactorY: 1,
        map,
        geometry: {
          tileWidth: 64,
          tileHeight: 64
        }
      })
    ).toBe(90);
  });

  it("anchors parallax around the map parallax origin", () => {
    const map = createMap({
      name: "demo",
      orientation: "orthogonal",
      width: 10,
      height: 10,
      tileWidth: 32,
      tileHeight: 32,
      parallaxOriginX: 32,
      parallaxOriginY: 16
    });
    const geometry = {
      tileWidth: 64,
      tileHeight: 64
    };

    expect(
      computeParallaxAdjustedViewportOriginX({
        viewportOriginX: 64,
        parallaxFactorX: 0.5,
        map,
        geometry
      })
    ).toBe(64);
    expect(
      computeParallaxAdjustedViewportOriginY({
        viewportOriginY: 32,
        parallaxFactorY: 0.5,
        map,
        geometry
      })
    ).toBe(32);
  });
});
