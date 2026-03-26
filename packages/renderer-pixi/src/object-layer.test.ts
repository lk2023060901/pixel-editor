import { describe, expect, it } from "vitest";

import {
  createMap,
  createMapObject,
  createObjectLayer
} from "@pixel-editor/domain";

import {
  collectProjectedMapObjects,
  pickProjectedObject
} from "./object-layer";

describe("object layer projection", () => {
  it("projects object layers in draw order and marks selected objects", () => {
    const backObject = createMapObject({
      name: "Back",
      shape: "rectangle",
      x: 16,
      y: 16,
      width: 32,
      height: 32
    });
    const frontObject = createMapObject({
      name: "Front",
      shape: "ellipse",
      x: 24,
      y: 24,
      width: 32,
      height: 32
    });
    const objectLayer = createObjectLayer({
      name: "Objects",
      drawOrder: "index",
      objects: [backObject, frontObject]
    });
    const map = createMap({
      name: "map-1",
      orientation: "orthogonal",
      width: 10,
      height: 10,
      tileWidth: 32,
      tileHeight: 32,
      layers: [objectLayer]
    });

    const projectedObjects = collectProjectedMapObjects({
      map,
      geometry: {
        tileWidth: 32,
        tileHeight: 32,
        gridOriginX: 0,
        gridOriginY: 0
      },
      viewport: {
        originX: 0,
        originY: 0
      },
      highlightedLayerId: objectLayer.id,
      selectedObjectIds: [frontObject.id]
    });

    expect(projectedObjects.map((object) => object.objectId)).toEqual([
      backObject.id,
      frontObject.id
    ]);
    expect(projectedObjects[1]).toMatchObject({
      selected: true,
      highlighted: true,
      screenX: 24,
      screenY: 24,
      screenWidth: 32,
      screenHeight: 32
    });
    expect(pickProjectedObject(projectedObjects, 30, 30)).toBe(frontObject.id);
  });

  it("applies object move previews during projection and picking", () => {
    const object = createMapObject({
      name: "Mover",
      shape: "rectangle",
      x: 32,
      y: 48,
      width: 32,
      height: 16
    });
    const objectLayer = createObjectLayer({
      name: "Objects",
      objects: [object]
    });
    const map = createMap({
      name: "map-1",
      orientation: "orthogonal",
      width: 10,
      height: 10,
      tileWidth: 32,
      tileHeight: 32,
      layers: [objectLayer]
    });

    const projectedObjects = collectProjectedMapObjects({
      map,
      geometry: {
        tileWidth: 32,
        tileHeight: 32,
        gridOriginX: 0,
        gridOriginY: 0
      },
      viewport: {
        originX: 0,
        originY: 0
      },
      objectTransformPreview: {
        kind: "move",
        objectIds: [object.id],
        deltaX: 16,
        deltaY: -8
      }
    });

    expect(projectedObjects[0]).toMatchObject({
      objectId: object.id,
      screenX: 48,
      screenY: 40,
      screenWidth: 32,
      screenHeight: 16
    });
    expect(pickProjectedObject(projectedObjects, 60, 48)).toBe(object.id);
  });

  it("picks polyline and point objects using shape-aware hit testing", () => {
    const polylineObject = createMapObject({
      name: "Path",
      shape: "polyline",
      x: 32,
      y: 64,
      points: [
        { x: 0, y: 0 },
        { x: 48, y: 0 },
        { x: 48, y: 24 }
      ]
    });
    const pointObject = createMapObject({
      name: "Marker",
      shape: "point",
      x: 96,
      y: 96
    });
    const objectLayer = createObjectLayer({
      name: "Objects",
      objects: [polylineObject, pointObject]
    });
    const map = createMap({
      name: "map-1",
      orientation: "orthogonal",
      width: 10,
      height: 10,
      tileWidth: 32,
      tileHeight: 32,
      layers: [objectLayer]
    });

    const projectedObjects = collectProjectedMapObjects({
      map,
      geometry: {
        tileWidth: 32,
        tileHeight: 32,
        gridOriginX: 0,
        gridOriginY: 0
      },
      viewport: {
        originX: 0,
        originY: 0
      }
    });

    expect(pickProjectedObject(projectedObjects, 56, 64)).toBe(polylineObject.id);
    expect(pickProjectedObject(projectedObjects, 96, 96)).toBe(pointObject.id);
  });

  it("projects tile object gid metadata for renderer texture resolution", () => {
    const tileObject = createMapObject({
      name: "Crate",
      shape: "tile",
      x: 64,
      y: 96,
      width: 32,
      height: 32,
      tile: {
        gid: 17
      }
    });
    const objectLayer = createObjectLayer({
      name: "Objects",
      objects: [tileObject]
    });
    const map = createMap({
      name: "map-1",
      orientation: "orthogonal",
      width: 10,
      height: 10,
      tileWidth: 32,
      tileHeight: 32,
      layers: [objectLayer]
    });

    const projectedObjects = collectProjectedMapObjects({
      map,
      geometry: {
        tileWidth: 32,
        tileHeight: 32,
        gridOriginX: 0,
        gridOriginY: 0
      },
      viewport: {
        originX: 0,
        originY: 0
      }
    });

    expect(projectedObjects[0]).toMatchObject({
      objectId: tileObject.id,
      shape: "tile",
      tileGid: 17,
      screenX: 64,
      screenY: 96
    });
  });

  it("applies object resize previews during projection", () => {
    const object = createMapObject({
      name: "Sizer",
      shape: "rectangle",
      x: 32,
      y: 48,
      width: 32,
      height: 16
    });
    const objectLayer = createObjectLayer({
      name: "Objects",
      objects: [object]
    });
    const map = createMap({
      name: "map-1",
      orientation: "orthogonal",
      width: 10,
      height: 10,
      tileWidth: 32,
      tileHeight: 32,
      layers: [objectLayer]
    });

    const projectedObjects = collectProjectedMapObjects({
      map,
      geometry: {
        tileWidth: 32,
        tileHeight: 32,
        gridOriginX: 0,
        gridOriginY: 0
      },
      viewport: {
        originX: 0,
        originY: 0
      },
      objectTransformPreview: {
        kind: "resize",
        objectId: object.id,
        x: 24,
        y: 40,
        width: 56,
        height: 28
      }
    });

    expect(projectedObjects[0]).toMatchObject({
      objectId: object.id,
      screenX: 24,
      screenY: 40,
      screenWidth: 56,
      screenHeight: 28
    });
  });

  it("projects text object style metadata for renderer fidelity", () => {
    const textObject = createMapObject({
      name: "Label",
      shape: "text",
      x: 32,
      y: 48,
      width: 96,
      height: 32,
      text: {
        content: "Spawn",
        color: "#112233",
        fontFamily: "Fira Code",
        pixelSize: 18,
        wrap: true
      }
    });
    const objectLayer = createObjectLayer({
      name: "Objects",
      objects: [textObject]
    });
    const map = createMap({
      name: "map-1",
      orientation: "orthogonal",
      width: 10,
      height: 10,
      tileWidth: 32,
      tileHeight: 32,
      layers: [objectLayer]
    });

    const projectedObjects = collectProjectedMapObjects({
      map,
      geometry: {
        tileWidth: 64,
        tileHeight: 64,
        gridOriginX: 0,
        gridOriginY: 0
      },
      viewport: {
        originX: 0,
        originY: 0
      }
    });

    expect(projectedObjects[0]).toMatchObject({
      objectId: textObject.id,
      shape: "text",
      textContent: "Spawn",
      textColor: "#112233",
      textFontFamily: "Fira Code",
      textPixelSize: 36,
      textWrap: true
    });
  });
});
