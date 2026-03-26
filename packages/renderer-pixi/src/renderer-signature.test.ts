import { describe, expect, it } from "vitest";

import {
  createProjectedObjectRenderSignature,
  createProjectedObjectSelectionSignature,
  createBoundsRenderSignature,
  createGridRenderSignature,
  createProjectedObjectsRenderSignature,
  createTileLayerSegmentRenderSignature,
  createTileLayersRenderSignature,
  createTileOverlayRenderSignature
} from "./renderer-signature";

describe("renderer signatures", () => {
  it("changes tile layer signatures when geometry or textures change", () => {
    const baseSignature = createTileLayersRenderSignature({
      zoom: 1,
      originX: 0,
      originY: 0,
      tileWidth: 32,
      tileHeight: 32,
      assetVersion: 1,
      layers: [
        {
          layerId: "layer-1" as never,
          opacity: 1,
          highlighted: false,
          segments: [
            {
              key: "0:0",
              cells: [
                {
                  x: 1,
                  y: 2,
                  gid: 3,
                  flipHorizontally: false,
                  flipVertically: false,
                  flipDiagonally: false,
                  texture: {
                    imagePath: "/terrain.png",
                    frame: { x: 0, y: 0, width: 32, height: 32 }
                  }
                }
              ]
            }
          ]
        }
      ]
    });
    const changedTextureSignature = createTileLayersRenderSignature({
      zoom: 1,
      originX: 0,
      originY: 0,
      tileWidth: 32,
      tileHeight: 32,
      assetVersion: 1,
      layers: [
        {
          layerId: "layer-1" as never,
          opacity: 1,
          highlighted: false,
          segments: [
            {
              key: "0:0",
              cells: [
                {
                  x: 1,
                  y: 2,
                  gid: 3,
                  flipHorizontally: false,
                  flipVertically: false,
                  flipDiagonally: false,
                  texture: {
                    imagePath: "/terrain.png",
                    frame: { x: 32, y: 0, width: 32, height: 32 }
                  }
                }
              ]
            }
          ]
        }
      ]
    });

    expect(baseSignature).not.toBe(changedTextureSignature);
  });

  it("changes segment signatures when cell content changes", () => {
    const baseSignature = createTileLayerSegmentRenderSignature({
      opacity: 1,
      highlighted: false,
      tileWidth: 32,
      tileHeight: 32,
      assetVersion: 1,
      cells: [
        {
          x: 0,
          y: 0,
          gid: 1,
          flipHorizontally: false,
          flipVertically: false,
          flipDiagonally: false,
          texture: undefined
        }
      ]
    });
    const changedCellSignature = createTileLayerSegmentRenderSignature({
      opacity: 1,
      highlighted: false,
      tileWidth: 32,
      tileHeight: 32,
      assetVersion: 1,
      cells: [
        {
          x: 1,
          y: 0,
          gid: 1,
          flipHorizontally: false,
          flipVertically: false,
          flipDiagonally: false,
          texture: undefined
        }
      ]
    });

    expect(baseSignature).not.toBe(changedCellSignature);
  });

  it("changes object signatures when projected object state changes", () => {
    const baseSignature = createProjectedObjectsRenderSignature([
      {
        objectId: "object-1" as never,
        layerId: "layer-1" as never,
        name: "Object 1",
        shape: "rectangle",
        opacity: 1,
        highlighted: false,
        selected: false,
        screenX: 10,
        screenY: 12,
        screenWidth: 32,
        screenHeight: 24
      }
    ]);
    const selectedSignature = createProjectedObjectsRenderSignature([
      {
        objectId: "object-1" as never,
        layerId: "layer-1" as never,
        name: "Object 1",
        shape: "rectangle",
        opacity: 1,
        highlighted: false,
        selected: true,
        screenX: 10,
        screenY: 12,
        screenWidth: 32,
        screenHeight: 24
      }
    ]);

    expect(baseSignature).not.toBe(selectedSignature);
  });

  it("keeps per-object draw signatures stable across pure translation", () => {
    const baseSignature = createProjectedObjectRenderSignature({
      object: {
        objectId: "object-1" as never,
        layerId: "layer-1" as never,
        name: "Object 1",
        shape: "polygon",
        opacity: 1,
        highlighted: false,
        selected: false,
        screenX: 10,
        screenY: 12,
        screenWidth: 32,
        screenHeight: 24,
        screenPoints: [
          { x: 10, y: 12 },
          { x: 42, y: 12 },
          { x: 42, y: 36 }
        ]
      }
    });
    const translatedSignature = createProjectedObjectRenderSignature({
      object: {
        objectId: "object-1" as never,
        layerId: "layer-1" as never,
        name: "Object 1",
        shape: "polygon",
        opacity: 1,
        highlighted: false,
        selected: false,
        screenX: 30,
        screenY: 22,
        screenWidth: 32,
        screenHeight: 24,
        screenPoints: [
          { x: 30, y: 22 },
          { x: 62, y: 22 },
          { x: 62, y: 46 }
        ]
      }
    });

    expect(baseSignature).toBe(translatedSignature);
  });

  it("captures overlay, grid, and bounds changes", () => {
    expect(
      createTileOverlayRenderSignature({
        coordinates: [{ x: 1, y: 1 }],
        gridOriginX: 20,
        gridOriginY: 40,
        tileWidth: 32,
        tileHeight: 32
      })
    ).not.toBe(
      createTileOverlayRenderSignature({
        coordinates: [{ x: 2, y: 1 }],
        gridOriginX: 20,
        gridOriginY: 40,
        tileWidth: 32,
        tileHeight: 32
      })
    );
    expect(
      createGridRenderSignature({
        showGrid: true,
        gridOriginX: 20,
        gridOriginY: 40,
        canvasWidth: 320,
        canvasHeight: 240,
        tileWidth: 32,
        tileHeight: 32,
        startTileX: 0,
        startTileY: 0,
        endTileX: 10,
        endTileY: 8
      })
    ).not.toBe(
      createGridRenderSignature({
        showGrid: false,
        gridOriginX: 20,
        gridOriginY: 40,
        canvasWidth: 320,
        canvasHeight: 240,
        tileWidth: 32,
        tileHeight: 32,
        startTileX: 0,
        startTileY: 0,
        endTileX: 10,
        endTileY: 8
      })
    );
    expect(
      createBoundsRenderSignature({
        infinite: false,
        gridOriginX: 20,
        gridOriginY: 40,
        originX: 0,
        originY: 0,
        width: 12,
        height: 10,
        tileWidth: 32,
        tileHeight: 32
      })
    ).not.toBe(
      createBoundsRenderSignature({
        infinite: true,
        gridOriginX: 20,
        gridOriginY: 40,
        originX: 0,
        originY: 0,
        width: 12,
        height: 10,
        tileWidth: 32,
        tileHeight: 32
      })
    );
  });

  it("tracks selected-object overlay changes independently", () => {
    const baseSignature = createProjectedObjectSelectionSignature({
      tileWidth: 32,
      tileHeight: 32,
      objects: [
        {
          objectId: "object-1" as never,
          layerId: "layer-1" as never,
          name: "A",
          shape: "rectangle",
          opacity: 1,
          highlighted: false,
          selected: true,
          screenX: 10,
          screenY: 20,
          screenWidth: 30,
          screenHeight: 40
        }
      ]
    });
    const movedSignature = createProjectedObjectSelectionSignature({
      tileWidth: 32,
      tileHeight: 32,
      objects: [
        {
          objectId: "object-1" as never,
          layerId: "layer-1" as never,
          name: "A",
          shape: "rectangle",
          opacity: 1,
          highlighted: false,
          selected: true,
          screenX: 12,
          screenY: 24,
          screenWidth: 30,
          screenHeight: 40
        }
      ]
    });
    const unselectedSignature = createProjectedObjectSelectionSignature({
      tileWidth: 32,
      tileHeight: 32,
      objects: [
        {
          objectId: "object-1" as never,
          layerId: "layer-1" as never,
          name: "A",
          shape: "rectangle",
          opacity: 1,
          highlighted: false,
          selected: false,
          screenX: 10,
          screenY: 20,
          screenWidth: 30,
          screenHeight: 40
        }
      ]
    });

    expect(baseSignature).not.toBe(movedSignature);
    expect(baseSignature).not.toBe(unselectedSignature);
  });
});
