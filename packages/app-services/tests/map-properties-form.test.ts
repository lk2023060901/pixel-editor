import { describe, expect, it } from "vitest";

import {
  buildMapPropertiesUpdatePatch,
  createMapPropertiesDraft,
  mapOrientationOptions,
  mapRenderOrderOptions
} from "../src/ui";

describe("map properties form helpers", () => {
  it("creates drafts and exports option lists through app-services APIs", () => {
    expect(mapOrientationOptions).toEqual([
      "orthogonal",
      "isometric",
      "staggered",
      "hexagonal",
      "oblique"
    ]);
    expect(mapRenderOrderOptions).toEqual([
      "right-down",
      "right-up",
      "left-down",
      "left-up"
    ]);
    expect(
      createMapPropertiesDraft({
        name: "Overworld",
        orientation: "isometric",
        renderOrder: "left-up",
        width: 120,
        height: 80,
        tileWidth: 64,
        tileHeight: 32,
        infinite: true,
        backgroundColor: "#123456"
      })
    ).toEqual({
      name: "Overworld",
      orientation: "isometric",
      renderOrder: "left-up",
      width: "120",
      height: "80",
      tileWidth: "64",
      tileHeight: "32",
      infinite: true,
      backgroundColor: "#123456"
    });
  });

  it("builds map detail patches and rejects invalid numeric input", () => {
    const viewState = {
      name: "Overworld",
      orientation: "orthogonal",
      renderOrder: "right-down",
      width: 100,
      height: 80,
      tileWidth: 32,
      tileHeight: 32,
      infinite: false,
      backgroundColor: "#000000"
    } as const;

    expect(
      buildMapPropertiesUpdatePatch({
        viewState,
        draft: {
          name: "  ",
          orientation: "oblique",
          renderOrder: "left-up",
          width: "256",
          height: "128",
          tileWidth: "48",
          tileHeight: "24",
          infinite: false,
          backgroundColor: "  #334455  "
        }
      })
    ).toEqual({
      name: "Overworld",
      orientation: "oblique",
      renderOrder: "left-up",
      width: 256,
      height: 128,
      tileWidth: 48,
      tileHeight: 24,
      infinite: false,
      backgroundColor: "#334455"
    });

    expect(
      buildMapPropertiesUpdatePatch({
        viewState,
        draft: {
          name: "Infinite",
          orientation: "orthogonal",
          renderOrder: "right-down",
          width: "",
          height: "",
          tileWidth: "16",
          tileHeight: "16",
          infinite: true,
          backgroundColor: ""
        }
      })
    ).toEqual({
      name: "Infinite",
      orientation: "orthogonal",
      renderOrder: "right-down",
      tileWidth: 16,
      tileHeight: 16,
      infinite: true
    });

    expect(
      buildMapPropertiesUpdatePatch({
        viewState,
        draft: {
          name: "Broken",
          orientation: "orthogonal",
          renderOrder: "right-down",
          width: "",
          height: "10",
          tileWidth: "16",
          tileHeight: "16",
          infinite: false,
          backgroundColor: ""
        }
      })
    ).toBeUndefined();
  });
});
