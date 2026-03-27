import { describe, expect, it } from "vitest";

import {
  combineLayerTintColor,
  DEFAULT_LAYER_BLEND_MODE,
  resolveEffectiveLayerBlendMode,
  resolveLayerTintColor
} from "./layer-style";

describe("layer style", () => {
  it("normalizes valid tint colors and ignores invalid values", () => {
    expect(resolveLayerTintColor("#80ff00")).toBe(0x80ff00);
    expect(resolveLayerTintColor("not-a-color")).toBeUndefined();
  });

  it("multiplies inherited and local tint colors", () => {
    expect(combineLayerTintColor(undefined, "#ff0000")).toBe(0xff0000);
    expect(combineLayerTintColor(0x808080, "#ff0000")).toBe(0x800000);
    expect(combineLayerTintColor(0x123456, undefined)).toBe(0x123456);
  });

  it("inherits blend mode until a child overrides it", () => {
    expect(resolveEffectiveLayerBlendMode(DEFAULT_LAYER_BLEND_MODE, "normal")).toBe("normal");
    expect(resolveEffectiveLayerBlendMode("overlay", "normal")).toBe("overlay");
    expect(resolveEffectiveLayerBlendMode("overlay", "screen")).toBe("screen");
  });
});
