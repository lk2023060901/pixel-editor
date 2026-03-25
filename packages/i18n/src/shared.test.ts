import { describe, expect, it } from "vitest";

import { createTranslator, getMessages, resolveLocale } from "./shared";

describe("resolveLocale", () => {
  it("resolves Chinese accept-language headers", () => {
    expect(resolveLocale("zh-CN,zh;q=0.9,en;q=0.8")).toBe("zh-CN");
  });

  it("falls back to English", () => {
    expect(resolveLocale("en-US,en;q=0.9")).toBe("en");
    expect(resolveLocale(undefined)).toBe("en");
  });
});

describe("createTranslator", () => {
  it("formats interpolation values", () => {
    const t = createTranslator("en", getMessages("en"));

    expect(t("tilesets.footerSelection", { localId: 7, gid: 42 })).toBe("Tile 7 · gid 42");
  });
});
