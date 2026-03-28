import { describe, expect, it } from "vitest";

import { createMap } from "@pixel-editor/domain";

import {
  createWorldContextOverlayClickPlan,
  createWorldContextOverlayCommitPlan,
  createWorldContextOverlayPointerDownPlan,
  deriveWorldContextOverlayMapPresentation,
  shouldStartWorldContextOverlayDrag
} from "../src/ui";

describe("world context overlay interactions", () => {
  const activeMap = createMap({
    name: "starter-map",
    orientation: "orthogonal",
    width: 10,
    height: 8,
    tileWidth: 32,
    tileHeight: 32
  });
  const eastMap = createMap({
    name: "east-map",
    orientation: "orthogonal",
    width: 10,
    height: 8,
    tileWidth: 32,
    tileHeight: 32
  });
  const mapEntry = {
    worldId: "world-1" as never,
    mapId: eastMap.id,
    fileName: "maps/east-map.tmj",
    name: "East",
    x: 64,
    y: 96,
    width: 320,
    height: 256,
    active: false,
    canActivate: true,
    gridWidth: 32,
    gridHeight: 32
  };

  it("derives map presentation through shared helper", () => {
    const worldToolPresentation = deriveWorldContextOverlayMapPresentation({
      viewState: {
        activeMap,
        activeTool: "world-tool",
        viewport: {
          zoom: 1,
          originX: 0,
          originY: 0,
          showGrid: true
        },
        visible: true,
        modifiable: true,
        activeMapRect: {
          x: 0,
          y: 0
        },
        maps: []
      },
      map: mapEntry
    });
    const stampPresentation = deriveWorldContextOverlayMapPresentation({
      viewState: {
        activeMap,
        activeTool: "stamp",
        viewport: {
          zoom: 1,
          originX: 0,
          originY: 0,
          showGrid: true
        },
        visible: true,
        modifiable: true,
        activeMapRect: {
          x: 0,
          y: 0
        },
        maps: []
      },
      map: mapEntry
    });

    expect(worldToolPresentation).toEqual({
      appearance: "idle",
      canActivateOnClick: false,
      canStartDrag: true,
      isInteractive: true,
      cursor: "pointer"
    });
    expect(stampPresentation).toEqual({
      appearance: "idle",
      canActivateOnClick: true,
      canStartDrag: false,
      isInteractive: true,
      cursor: "pointer"
    });
  });

  it("creates click and pointer-down plans through narrow interaction helpers", () => {
    const clickPlan = createWorldContextOverlayClickPlan({
      presentation: {
        appearance: "idle",
        canActivateOnClick: true,
        canStartDrag: false,
        isInteractive: true,
        cursor: "pointer"
      },
      map: mapEntry
    });
    const pointerDownPlan = createWorldContextOverlayPointerDownPlan({
      presentation: {
        appearance: "idle",
        canActivateOnClick: false,
        canStartDrag: true,
        isInteractive: true,
        cursor: "pointer"
      },
      map: mapEntry,
      button: 0,
      pointerId: 7,
      clientX: 24,
      clientY: 32
    });

    expect(clickPlan).toEqual({
      kind: "activate",
      mapId: eastMap.id
    });
    expect(pointerDownPlan).toEqual({
      kind: "drag",
      dragState: {
        pointerId: 7,
        map: mapEntry,
        startClientX: 24,
        startClientY: 32,
        moved: false
      }
    });
  });

  it("starts drag after shared threshold and resolves commit plans", () => {
    expect(
      shouldStartWorldContextOverlayDrag({
        startClientX: 24,
        startClientY: 32,
        clientX: 26,
        clientY: 34
      })
    ).toBe(false);
    expect(
      shouldStartWorldContextOverlayDrag({
        startClientX: 24,
        startClientY: 32,
        clientX: 28,
        clientY: 36
      })
    ).toBe(true);

    expect(
      createWorldContextOverlayCommitPlan({
        dragState: {
          pointerId: 7,
          map: mapEntry,
          startClientX: 24,
          startClientY: 32,
          moved: true
        },
        position: {
          x: 96,
          y: 128
        }
      })
    ).toEqual({
      kind: "move",
      worldId: mapEntry.worldId,
      fileName: mapEntry.fileName,
      x: 96,
      y: 128
    });
    expect(
      createWorldContextOverlayCommitPlan({
        dragState: {
          pointerId: 7,
          map: mapEntry,
          startClientX: 24,
          startClientY: 32,
          moved: false
        },
        position: {
          x: 64,
          y: 96
        }
      })
    ).toEqual({
      kind: "activate",
      mapId: eastMap.id
    });
  });
});
