import { describe, expect, it } from "vitest";

import {
  createPropertiesInspectorLayerDraft,
  createPropertiesInspectorMapDraft,
  createPropertiesInspectorObjectDraft,
  propertiesInspectorBlendModeOptions,
  propertiesInspectorMapOrientationOptions,
  propertiesInspectorMapRenderOrderOptions,
  propertiesInspectorObjectDrawOrderOptions,
  resolvePropertiesInspectorLayerDraftCommit,
  resolvePropertiesInspectorMapDraftCommit,
  resolvePropertiesInspectorObjectDraftCommit
} from "../src/ui";

describe("properties inspector form helpers", () => {
  it("creates drafts and exposes option protocols through exported APIs", () => {
    expect(propertiesInspectorMapOrientationOptions).toContain("orthogonal");
    expect(propertiesInspectorMapRenderOrderOptions).toContain("right-down");
    expect(propertiesInspectorObjectDrawOrderOptions).toEqual(["topdown", "index"]);
    expect(propertiesInspectorBlendModeOptions).toContain("overlay");
    expect(
      createPropertiesInspectorMapDraft({
        name: "Map",
        orientation: "orthogonal",
        renderOrder: "right-down",
        width: 10,
        height: 20,
        tileWidth: 32,
        tileHeight: 32,
        parallaxOriginX: 4,
        parallaxOriginY: 8,
        infinite: false,
        backgroundColor: "#fff",
        properties: []
      })
    ).toMatchObject({
      name: "Map",
      parallaxOriginX: "4",
      parallaxOriginY: "8"
    });
    expect(
      createPropertiesInspectorLayerDraft({
        kind: "image",
        name: "Backdrop",
        className: "sky",
        visible: true,
        locked: false,
        opacity: 0.5,
        offsetX: 1,
        offsetY: 2,
        parallaxX: 0.75,
        parallaxY: 0.5,
        tintColor: "#123456",
        blendMode: "multiply",
        properties: [],
        imagePath: "bg.png",
        repeatX: true,
        repeatY: false
      })
    ).toMatchObject({
      className: "sky",
      imagePath: "bg.png",
      repeatX: true
    });
    expect(
      createPropertiesInspectorObjectDraft({
        shape: "rectangle",
        name: "Crate",
        className: "solid",
        x: 1,
        y: 2,
        width: 3,
        height: 4,
        rotation: 5,
        visible: true,
        properties: []
      })
    ).toMatchObject({
      name: "Crate",
      rotation: "5"
    });
  });

  it("resolves map and object commits and resets invalid drafts", () => {
    const mapViewState = {
      name: "Map",
      orientation: "orthogonal",
      renderOrder: "right-down",
      width: 10,
      height: 20,
      tileWidth: 32,
      tileHeight: 32,
      parallaxOriginX: 4,
      parallaxOriginY: 8,
      infinite: false,
      backgroundColor: "#fff",
      properties: []
    } as const;
    expect(
      resolvePropertiesInspectorMapDraftCommit({
        viewState: mapViewState,
        draft: {
          ...createPropertiesInspectorMapDraft(mapViewState),
          width: "invalid"
        }
      })
    ).toEqual({
      nextDraft: createPropertiesInspectorMapDraft(mapViewState)
    });
    expect(
      resolvePropertiesInspectorMapDraftCommit({
        viewState: mapViewState,
        draft: {
          ...createPropertiesInspectorMapDraft(mapViewState),
          parallaxOriginX: "12.5"
        }
      }).patch
    ).toMatchObject({
      parallaxOriginX: 12.5
    });

    const objectViewState = {
      shape: "ellipse",
      name: "Coin",
      className: "pickup",
      x: 1,
      y: 2,
      width: 3,
      height: 4,
      rotation: 5,
      visible: true,
      properties: []
    } as const;
    expect(
      resolvePropertiesInspectorObjectDraftCommit({
        viewState: objectViewState,
        draft: {
          ...createPropertiesInspectorObjectDraft(objectViewState),
          rotation: "bad"
        }
      })
    ).toEqual({
      nextDraft: createPropertiesInspectorObjectDraft(objectViewState)
    });
    expect(
      resolvePropertiesInspectorObjectDraftCommit({
        viewState: objectViewState,
        draft: {
          ...createPropertiesInspectorObjectDraft(objectViewState),
          className: "",
          x: "10",
          y: "20",
          width: "30",
          height: "40",
          rotation: "50"
        }
      }).patch
    ).toEqual({
      name: "Coin",
      className: "",
      x: 10,
      y: 20,
      width: 30,
      height: 40,
      rotation: 50,
      visible: true
    });
  });

  it("resolves layer commits through exported patch helpers", () => {
    const layerViewState = {
      kind: "object",
      name: "Objects",
      className: "props",
      visible: true,
      locked: false,
      opacity: 1,
      offsetX: 0,
      offsetY: 0,
      parallaxX: 1,
      parallaxY: 1,
      tintColor: "#ffffff",
      blendMode: "normal",
      properties: [],
      drawOrder: "topdown"
    } as const;

    expect(
      resolvePropertiesInspectorLayerDraftCommit({
        viewState: layerViewState,
        draft: {
          ...createPropertiesInspectorLayerDraft(layerViewState),
          opacity: "bad"
        }
      })
    ).toEqual({
      nextDraft: createPropertiesInspectorLayerDraft(layerViewState)
    });

    expect(
      resolvePropertiesInspectorLayerDraftCommit({
        viewState: layerViewState,
        draft: {
          ...createPropertiesInspectorLayerDraft(layerViewState),
          drawOrder: "index",
          opacity: "1.5",
          parallaxX: "0.25",
          parallaxY: "0.5"
        }
      }).patch
    ).toMatchObject({
      name: "Objects",
      opacity: 1,
      parallaxX: 0.25,
      parallaxY: 0.5,
      drawOrder: "index"
    });
  });
});
