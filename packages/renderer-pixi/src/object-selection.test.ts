import { describe, expect, it } from "vitest";

import type { ProjectedMapObject } from "./object-layer";
import {
  collectProjectedObjectSelectionBounds,
  pickProjectedObjectSelectionHandle
} from "./object-selection";

describe("object selection overlay geometry", () => {
  it("collects union bounds for selected rectangle-like objects", () => {
    const bounds = collectProjectedObjectSelectionBounds(
      [
        {
          objectId: "object-1" as never,
          layerId: "layer-1" as never,
          name: "Rect",
          shape: "rectangle",
          opacity: 1,
          highlighted: false,
          selected: true,
          screenX: 20,
          screenY: 30,
          screenWidth: 40,
          screenHeight: 24
        },
        {
          objectId: "object-2" as never,
          layerId: "layer-1" as never,
          name: "Ellipse",
          shape: "ellipse",
          opacity: 1,
          highlighted: false,
          selected: true,
          screenX: 80,
          screenY: 26,
          screenWidth: 28,
          screenHeight: 38
        }
      ],
      {
        tileWidth: 32,
        tileHeight: 32
      }
    );

    expect(bounds).toEqual({
      left: 20,
      top: 26,
      right: 108,
      bottom: 64,
      width: 88,
      height: 38,
      centerX: 64,
      centerY: 45
    });
  });

  it("includes point markers and polyline extents in selection bounds", () => {
    const bounds = collectProjectedObjectSelectionBounds(
      [
        {
          objectId: "object-1" as never,
          layerId: "layer-1" as never,
          name: "Marker",
          shape: "point",
          opacity: 1,
          highlighted: false,
          selected: true,
          screenX: 48,
          screenY: 60,
          screenWidth: 0,
          screenHeight: 0
        },
        {
          objectId: "object-2" as never,
          layerId: "layer-1" as never,
          name: "Path",
          shape: "polyline",
          opacity: 1,
          highlighted: false,
          selected: true,
          screenX: 0,
          screenY: 0,
          screenWidth: 0,
          screenHeight: 0,
          screenPoints: [
            { x: 72, y: 18 },
            { x: 96, y: 30 },
            { x: 84, y: 54 }
          ]
        }
      ],
      {
        tileWidth: 32,
        tileHeight: 32
      }
    );

    expect(bounds).toEqual({
      left: 41.28,
      top: 18,
      right: 96,
      bottom: 66.72,
      width: 54.72,
      height: 48.72,
      centerX: 68.64,
      centerY: 42.36
    });
  });

  it("picks resize and rotation handles from the selection overlay", () => {
    const objects: ProjectedMapObject[] = [
      {
        objectId: "object-1" as never,
        layerId: "layer-1" as never,
        name: "Rect",
        shape: "rectangle",
        opacity: 1,
        highlighted: false,
        selected: true,
        screenX: 20,
        screenY: 30,
        screenWidth: 40,
        screenHeight: 24
      }
    ];

    expect(
      pickProjectedObjectSelectionHandle(
        objects,
        {
          tileWidth: 32,
          tileHeight: 32
        },
        60,
        54
      )
    ).toBe("se");
    expect(
      pickProjectedObjectSelectionHandle(
        objects,
        {
          tileWidth: 32,
          tileHeight: 32
        },
        40,
        17.75
      )
    ).toBe("rotate");
  });
});
