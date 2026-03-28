import { describe, expect, it } from "vitest";

import {
  createGroupLayer,
  createImageLayer,
  createObjectLayer,
  createTileLayer
} from "@pixel-editor/domain";

import { collectRenderableLayers } from "./layer-composition";

describe("layer composition", () => {
  it("flattens tile, image, and object layers in tree order", () => {
    const groundLayer = createTileLayer({
      name: "Ground",
      width: 8,
      height: 6
    });
    const backdropLayer = createImageLayer({
      name: "Backdrop",
      imagePath: "/backdrop.png",
      opacity: 0.75
    });
    const objectLayer = createObjectLayer({
      name: "Objects"
    });
    const groupLayer = createGroupLayer({
      name: "Decor",
      layers: [backdropLayer, objectLayer]
    });

    const renderableLayers = collectRenderableLayers(
      [groundLayer, groupLayer],
      objectLayer.id
    );

    expect(
      renderableLayers.map((layer) => `${layer.kind}:${layer.layer.name}`)
    ).toEqual(["tile:Ground", "image:Backdrop", "object:Objects"]);
    expect(renderableLayers[2]).toMatchObject({
      highlighted: true
    });
  });

  it("inherits visibility, opacity, offsets, tint, and blend through group layers", () => {
    const hiddenGroup = createGroupLayer({
      name: "Hidden",
      visible: false,
      opacity: 0.5,
      layers: [
        createTileLayer({
          name: "Skipped",
          width: 4,
          height: 4
        })
      ]
    });
    const imageLayer = createImageLayer({
      name: "Parallax",
      imagePath: "/parallax.png",
      opacity: 0.6,
      offsetX: 8,
      offsetY: -4,
      parallaxX: 0.75,
      parallaxY: 0.5,
      tintColor: "#80ff00"
    });
    const groupedImageLayer = createGroupLayer({
      name: "Foreground",
      opacity: 0.5,
      offsetX: 12,
      offsetY: 24,
      parallaxX: 0.5,
      parallaxY: 0.25,
      tintColor: "#808080",
      blendMode: "overlay",
      layers: [imageLayer]
    });

    const renderableLayers = collectRenderableLayers([hiddenGroup, groupedImageLayer]);

    expect(renderableLayers).toHaveLength(1);
    expect(renderableLayers[0]).toMatchObject({
      kind: "image",
      opacity: 0.3,
      localOpacity: 0.6,
      offsetX: 20,
      offsetY: 20,
      parallaxX: 0.375,
      parallaxY: 0.125,
      tintColor: 0x408000,
      localTintColor: 0x80ff00,
      blendMode: "overlay"
    });
    expect(renderableLayers[0]?.groupPath).toEqual([
      {
        layerId: groupedImageLayer.id,
        opacity: 0.5,
        tintColor: 0x808080,
        blendMode: "overlay"
      }
    ]);
  });

  it("captures nested group paths with local style values", () => {
    const imageLayer = createImageLayer({
      name: "Clouds",
      imagePath: "/clouds.png",
      opacity: 0.6,
      tintColor: "#80ff00",
      blendMode: "screen"
    });
    const innerGroup = createGroupLayer({
      name: "Inner",
      opacity: 0.5,
      tintColor: "#808080",
      layers: [imageLayer]
    });
    const outerGroup = createGroupLayer({
      name: "Outer",
      opacity: 0.25,
      blendMode: "overlay",
      layers: [innerGroup]
    });

    const renderableLayers = collectRenderableLayers([outerGroup]);

    expect(renderableLayers).toHaveLength(1);
    expect(renderableLayers[0]).toMatchObject({
      opacity: 0.075,
      localOpacity: 0.6,
      tintColor: 0x408000,
      localTintColor: 0x80ff00,
      blendMode: "screen",
      localBlendMode: "screen"
    });
    expect(renderableLayers[0]?.groupPath).toEqual([
      {
        layerId: outerGroup.id,
        opacity: 0.25,
        tintColor: undefined,
        blendMode: "overlay"
      },
      {
        layerId: innerGroup.id,
        opacity: 0.5,
        tintColor: 0x808080,
        blendMode: "normal"
      }
    ]);
  });
});
