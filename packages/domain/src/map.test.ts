import { describe, expect, it } from "vitest";

import { createMap } from "./map";

describe("createMap", () => {
  it("creates finite maps with positive dimensions", () => {
    const map = createMap({
      name: "demo",
      orientation: "orthogonal",
      width: 32,
      height: 16,
      tileWidth: 16,
      tileHeight: 16
    });

    expect(map.settings.infinite).toBe(false);
    expect(map.settings.width).toBe(32);
    expect(map.settings.height).toBe(16);
  });

  it("normalizes infinite maps to chunk-driven dimensions", () => {
    const map = createMap({
      name: "infinite-demo",
      orientation: "orthogonal",
      width: 1,
      height: 1,
      tileWidth: 16,
      tileHeight: 16,
      infinite: true
    });

    expect(map.settings.infinite).toBe(true);
    expect(map.settings.width).toBe(0);
    expect(map.settings.height).toBe(0);
  });
});

