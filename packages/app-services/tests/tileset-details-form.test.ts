import { describe, expect, it } from "vitest";

import {
  buildTilesetDetailsUpdatePatch,
  createTilesetDetailsDraft,
  tilesetFillModeOptions,
  tilesetObjectAlignmentOptions,
  tilesetTileRenderSizeOptions
} from "../src/ui";

describe("tileset details form helpers", () => {
  it("creates drafts and exports tileset option lists through app-services APIs", () => {
    expect(tilesetObjectAlignmentOptions).toContain("center");
    expect(tilesetTileRenderSizeOptions).toEqual(["tile", "grid"]);
    expect(tilesetFillModeOptions).toEqual([
      "stretch",
      "preserve-aspect-fit"
    ]);
    expect(
      createTilesetDetailsDraft({
        kind: "image",
        name: "terrain",
        tileWidth: 32,
        tileHeight: 32,
        tileOffsetX: 1,
        tileOffsetY: 2,
        objectAlignment: "center",
        tileRenderSize: "grid",
        fillMode: "stretch",
        imagePath: "tiles/terrain.png",
        imageWidth: 256,
        imageHeight: 128,
        margin: 0,
        spacing: 1,
        columns: 8
      })
    ).toEqual({
      name: "terrain",
      tileWidth: "32",
      tileHeight: "32",
      tileOffsetX: "1",
      tileOffsetY: "2",
      objectAlignment: "center",
      tileRenderSize: "grid",
      fillMode: "stretch",
      imagePath: "tiles/terrain.png",
      imageWidth: "256",
      imageHeight: "128",
      margin: "0",
      spacing: "1",
      columns: "8"
    });
  });

  it("builds tileset patches and preserves image-specific semantics", () => {
    const imageViewState = {
      kind: "image",
      name: "terrain",
      tileWidth: 32,
      tileHeight: 32,
      tileOffsetX: 0,
      tileOffsetY: 0,
      objectAlignment: "unspecified",
      tileRenderSize: "tile",
      fillMode: "stretch",
      imagePath: "tiles/terrain.png",
      imageWidth: 256,
      imageHeight: 128,
      margin: 0,
      spacing: 0,
      columns: 8
    } as const;

    expect(
      buildTilesetDetailsUpdatePatch({
        viewState: imageViewState,
        draft: {
          name: "  ",
          tileWidth: "16",
          tileHeight: "20",
          tileOffsetX: "3",
          tileOffsetY: "4",
          objectAlignment: "bottom",
          tileRenderSize: "grid",
          fillMode: "preserve-aspect-fit",
          imagePath: "  tiles/next.png  ",
          imageWidth: "128",
          imageHeight: "64",
          margin: "2",
          spacing: "1",
          columns: ""
        }
      })
    ).toEqual({
      name: "terrain",
      tileWidth: 16,
      tileHeight: 20,
      tileOffsetX: 3,
      tileOffsetY: 4,
      objectAlignment: "bottom",
      tileRenderSize: "grid",
      fillMode: "preserve-aspect-fit",
      imagePath: "tiles/next.png",
      imageWidth: 128,
      imageHeight: 64,
      margin: 2,
      spacing: 1,
      columns: null
    });

    expect(
      buildTilesetDetailsUpdatePatch({
        viewState: {
          kind: "image-collection",
          name: "props",
          tileWidth: 32,
          tileHeight: 32,
          tileOffsetX: 0,
          tileOffsetY: 0,
          objectAlignment: "unspecified",
          tileRenderSize: "tile",
          fillMode: "stretch",
          imagePath: "",
          margin: 0,
          spacing: 0
        },
        draft: {
          name: "props",
          tileWidth: "",
          tileHeight: "32",
          tileOffsetX: "0",
          tileOffsetY: "0",
          objectAlignment: "unspecified",
          tileRenderSize: "tile",
          fillMode: "stretch",
          imagePath: "",
          imageWidth: "",
          imageHeight: "",
          margin: "0",
          spacing: "0",
          columns: ""
        }
      })
    ).toBeUndefined();
  });
});
