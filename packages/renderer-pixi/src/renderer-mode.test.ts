import { describe, expect, it } from "vitest";

import { createMap } from "@pixel-editor/domain";

import { getRendererMode } from "./renderer-mode";

describe("renderer mode", () => {
  it("returns empty when there is no active map", () => {
    expect(getRendererMode()).toBe("empty");
  });

  it("returns unsupported for non-orthogonal maps", () => {
    const map = createMap({
      name: "iso-map",
      orientation: "isometric",
      width: 4,
      height: 4,
      tileWidth: 32,
      tileHeight: 32
    });

    expect(getRendererMode(map)).toBe("unsupported");
  });

  it("returns ready for orthogonal maps", () => {
    const map = createMap({
      name: "ortho-map",
      orientation: "orthogonal",
      width: 4,
      height: 4,
      tileWidth: 32,
      tileHeight: 32
    });

    expect(getRendererMode(map)).toBe("ready");
  });
});
