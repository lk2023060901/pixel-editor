import { describe, expect, it } from "vitest";

import {
  createAssetReference,
  dirnameAssetPath,
  normalizeAssetPath,
  resolveAssetPath
} from "./index";

describe("asset-reference", () => {
  it("normalizes project-relative paths with dot segments", () => {
    expect(normalizeAssetPath("./maps/../tilesets/terrain.tsx")).toBe("tilesets/terrain.tsx");
    expect(normalizeAssetPath("maps\\level\\..\\ground.tmx")).toBe("maps/ground.tmx");
  });

  it("derives a stable directory name for project documents", () => {
    expect(dirnameAssetPath("maps/level-1/demo.tmx")).toBe("maps/level-1");
    expect(dirnameAssetPath("demo.tmx")).toBe("");
  });

  it("resolves relative references against a document path and asset roots", () => {
    expect(
      resolveAssetPath("../tilesets/terrain.tsx", {
        documentPath: "maps/demo.tmx",
        assetRoots: ["maps", "tilesets", "templates"]
      })
    ).toEqual({
      originalPath: "../tilesets/terrain.tsx",
      resolvedPath: "tilesets/terrain.tsx",
      pathKind: "relative",
      assetRoot: "tilesets",
      externalToProject: false,
      documentPath: "maps/demo.tmx"
    });
  });

  it("marks paths outside project roots and URLs as external", () => {
    expect(
      resolveAssetPath("../../shared/terrain.tsx", {
        documentPath: "maps/world/demo.tmx",
        assetRoots: ["maps", "tilesets"]
      })
    ).toEqual({
      originalPath: "../../shared/terrain.tsx",
      resolvedPath: "shared/terrain.tsx",
      pathKind: "relative",
      externalToProject: true,
      documentPath: "maps/world/demo.tmx"
    });

    expect(resolveAssetPath("https://example.com/tileset.tsx")).toEqual({
      originalPath: "https://example.com/tileset.tsx",
      resolvedPath: "https://example.com/tileset.tsx",
      pathKind: "url",
      externalToProject: true
    });
  });

  it("builds typed asset reference descriptors", () => {
    expect(
      createAssetReference("template", "tmx.layers[1].objects[0].template", "../templates/enemy.tx", {
        documentPath: "maps/demo.tmx",
        assetRoots: ["maps", "tilesets", "templates"]
      })
    ).toEqual({
      kind: "template",
      ownerPath: "tmx.layers[1].objects[0].template",
      originalPath: "../templates/enemy.tx",
      resolvedPath: "templates/enemy.tx",
      pathKind: "relative",
      assetRoot: "templates",
      externalToProject: false,
      documentPath: "maps/demo.tmx"
    });
  });
});
