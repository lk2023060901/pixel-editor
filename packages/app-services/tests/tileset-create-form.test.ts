import { describe, expect, it } from "vitest";

import {
  buildCreateCollectionTilesetInput,
  buildCreateSpriteTilesetInput,
  createCollectionTilesetDraft,
  createSpriteTilesetDraft,
  resolveCollectionTilesetImageSources,
  updateCollectionTilesetDraftField,
  updateSpriteTilesetDraftField
} from "../src/ui";

describe("tileset create form helpers", () => {
  it("creates default drafts and updates fields through exported APIs", () => {
    expect(createSpriteTilesetDraft("Sprite")).toEqual({
      name: "Sprite",
      imagePath: "",
      imageWidth: "256",
      imageHeight: "256",
      tileWidth: "32",
      tileHeight: "32",
      columns: "8"
    });
    expect(createCollectionTilesetDraft("Collection")).toEqual({
      name: "Collection",
      tileWidth: "32",
      tileHeight: "32",
      imageSources: ""
    });
    expect(
      updateSpriteTilesetDraftField({
        draft: createSpriteTilesetDraft("Sprite"),
        field: "imagePath",
        value: "tiles.png"
      })
    ).toMatchObject({
      imagePath: "tiles.png"
    });
    expect(
      updateCollectionTilesetDraftField({
        draft: createCollectionTilesetDraft("Collection"),
        field: "imageSources",
        value: "a.png"
      })
    ).toMatchObject({
      imageSources: "a.png"
    });
  });

  it("builds sprite sheet create input through exported APIs", () => {
    expect(
      buildCreateSpriteTilesetInput({
        draft: {
          ...createSpriteTilesetDraft(" Sprite Tiles "),
          imagePath: " assets/terrain.png ",
          imageWidth: "512",
          imageHeight: "256",
          tileWidth: "32",
          tileHeight: "16",
          columns: "16"
        },
        untitledName: "Untitled"
      })
    ).toEqual({
      name: "Sprite Tiles",
      imagePath: "assets/terrain.png",
      imageWidth: 512,
      imageHeight: 256,
      tileWidth: 32,
      tileHeight: 16,
      columns: 16
    });
    expect(
      buildCreateSpriteTilesetInput({
        draft: createSpriteTilesetDraft("Sprite"),
        untitledName: "Untitled"
      })
    ).toBeUndefined();
  });

  it("normalizes collection image sources and builds collection create input", () => {
    expect(resolveCollectionTilesetImageSources(" a.png,\n b.png \n\n c.png ")).toEqual([
      "a.png",
      "b.png",
      "c.png"
    ]);
    expect(
      buildCreateCollectionTilesetInput({
        draft: {
          ...createCollectionTilesetDraft(" Collection "),
          tileWidth: "24",
          tileHeight: "24",
          imageSources: " a.png,\n b.png "
        },
        untitledName: "Untitled Collection"
      })
    ).toEqual({
      name: "Collection",
      tileWidth: 24,
      tileHeight: 24,
      imageSources: ["a.png", "b.png"]
    });
    expect(
      buildCreateCollectionTilesetInput({
        draft: createCollectionTilesetDraft("Collection"),
        untitledName: "Untitled Collection"
      })
    ).toBeUndefined();
  });
});
