import { describe, expect, it } from "vitest";

import {
  cloneMapObject,
  createMapObject,
  createProperty,
  getMapObjectBounds
} from "@pixel-editor/domain";

describe("object operations", () => {
  it("clones objects with deep-copied properties and a fresh id", () => {
    const source = createMapObject({
      name: "Spawn Marker",
      shape: "rectangle",
      x: 16,
      y: 24,
      width: 32,
      height: 32,
      properties: [
        createProperty("spawnGroup", "string", "alpha"),
        createProperty("metadata", "class", {
          members: {
            weight: 2,
            tags: ["boss", "north"]
          }
        })
      ]
    });

    const clone = cloneMapObject(source, {
      x: 48
    });

    expect(clone.id).not.toBe(source.id);
    expect(clone).toMatchObject({
      name: "Spawn Marker",
      shape: "rectangle",
      x: 48,
      y: 24,
      width: 32,
      height: 32
    });
    expect(clone.properties).toEqual(source.properties);
    expect(clone.properties).not.toBe(source.properties);
  });

  it("computes the bounding box of multiple objects", () => {
    const objects = [
      createMapObject({
        name: "A",
        shape: "rectangle",
        x: 10,
        y: 15,
        width: 16,
        height: 8
      }),
      createMapObject({
        name: "B",
        shape: "point",
        x: 48,
        y: 27,
        width: 0,
        height: 0
      }),
      createMapObject({
        name: "C",
        shape: "rectangle",
        x: 24,
        y: 12,
        width: 10,
        height: 24
      })
    ];

    expect(getMapObjectBounds(objects)).toEqual({
      x: 10,
      y: 12,
      width: 38,
      height: 24
    });
  });
});
