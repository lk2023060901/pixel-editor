import type { TranslationFn } from "@pixel-editor/i18n";
import { describe, expect, it, vi } from "vitest";

import {
  createLayersPanelActionPlan,
  deriveLayersPanelLayerRowsPresentation,
  deriveLayersPanelToolbarPresentation,
  getLayersPanelNewLayerItems,
  layersPanelActionIds,
  layersPanelIconKeys,
  resolveLayersPanelLayerKindIconKey,
  resolveLayersPanelLayerLockTitle,
  resolveLayersPanelNewLayerMenuOpen,
  resolveLayersPanelToolbarActionIconKey,
  resolveLayersPanelLayerVisibilityTitle,
  type LayersPanelActionPlan,
  type LayersPanelViewState
} from "../src/ui";

const t = ((key: string) => key) as TranslationFn;

function createLayersPanelStoreSpy() {
  return {
    addTileLayer: vi.fn(),
    addObjectLayer: vi.fn(),
    addImageLayer: vi.fn(),
    addGroupLayer: vi.fn(),
    setActiveLayer: vi.fn(),
    toggleLayerVisibility: vi.fn(),
    toggleLayerLock: vi.fn(),
    moveActiveLayer: vi.fn(),
    removeActiveLayer: vi.fn(),
    toggleOtherLayersVisibility: vi.fn(),
    toggleOtherLayersLock: vi.fn(),
    toggleHighlightCurrentLayer: vi.fn()
  };
}

function runTransitionPlan(plan: LayersPanelActionPlan, store: ReturnType<typeof createLayersPanelStoreSpy>) {
  expect(plan.kind).toBe("transition");

  if (plan.kind !== "transition") {
    throw new Error("Expected a transition plan.");
  }

  plan.run(store);
}

describe("layers panel presentation helpers", () => {
  it("derives new-layer items and toolbar state through exported APIs", () => {
    const viewState: LayersPanelViewState = {
      layers: [],
      hasMap: true,
      hasActiveLayer: true,
      canMoveActiveLayerUp: true,
      canMoveActiveLayerDown: false,
      hasSiblingLayers: true,
      otherLayersHidden: true,
      otherLayersLocked: false,
      highlightCurrentLayer: true
    };

    expect(getLayersPanelNewLayerItems(t)).toEqual([
      {
        actionId: layersPanelActionIds.addTileLayer,
        kind: "tile",
        iconKey: layersPanelIconKeys.tileLayer,
        label: "layerKind.tile"
      },
      {
        actionId: layersPanelActionIds.addObjectLayer,
        kind: "object",
        iconKey: layersPanelIconKeys.objectLayer,
        label: "layerKind.object"
      },
      {
        actionId: layersPanelActionIds.addImageLayer,
        kind: "image",
        iconKey: layersPanelIconKeys.imageLayer,
        label: "layerKind.image"
      },
      {
        actionId: layersPanelActionIds.addGroupLayer,
        kind: "group",
        iconKey: layersPanelIconKeys.groupLayer,
        label: "layerKind.group"
      }
    ]);

    expect(deriveLayersPanelToolbarPresentation({ viewState, t })).toMatchObject({
      newLayerTitle: "layers.newLayer",
      toolbarItems: [
        {
          kind: "action",
          actionId: layersPanelActionIds.raiseLayers,
          iconKey: layersPanelIconKeys.raiseLayers,
          title: "action.raiseLayers",
          disabled: false,
          active: false
        },
        {
          kind: "action",
          actionId: layersPanelActionIds.lowerLayers,
          iconKey: layersPanelIconKeys.lowerLayers,
          title: "action.lowerLayers",
          disabled: true,
          active: false
        },
        {
          kind: "action",
          actionId: layersPanelActionIds.duplicateLayers,
          iconKey: layersPanelIconKeys.duplicateLayers,
          title: "action.duplicateLayers",
          disabled: true,
          active: false
        },
        {
          kind: "action",
          actionId: layersPanelActionIds.removeLayers,
          iconKey: layersPanelIconKeys.removeLayers,
          title: "action.removeLayers",
          disabled: false,
          active: false
        },
        {
          kind: "separator",
          id: "other-layer-controls"
        },
        {
          kind: "action",
          actionId: layersPanelActionIds.showHideOtherLayers,
          iconKey: layersPanelIconKeys.showHideOtherLayers,
          title: "action.showHideOtherLayers",
          disabled: false,
          active: true
        },
        {
          kind: "action",
          actionId: layersPanelActionIds.lockUnlockOtherLayers,
          iconKey: layersPanelIconKeys.lockUnlockOtherLayers,
          title: "action.lockUnlockOtherLayers",
          disabled: false,
          active: false
        },
        {
          kind: "spacer",
          id: "highlight-current-layer"
        },
        {
          kind: "action",
          actionId: layersPanelActionIds.highlightCurrentLayer,
          iconKey: layersPanelIconKeys.highlightCurrentLayer,
          title: "action.highlightCurrentLayer",
          disabled: false,
          active: true
        }
      ]
    });
  });

  it("resolves row titles through exported helpers", () => {
    expect(resolveLayersPanelLayerVisibilityTitle({ visible: true, t })).toBe("layers.visible");
    expect(resolveLayersPanelLayerVisibilityTitle({ visible: false, t })).toBe("layers.hidden");
    expect(resolveLayersPanelLayerLockTitle({ locked: true, t })).toBe("layers.locked");
    expect(resolveLayersPanelLayerLockTitle({ locked: false, t })).toBe("layers.unlocked");
    expect(resolveLayersPanelLayerKindIconKey("tile")).toBe(layersPanelIconKeys.tileLayer);
    expect(resolveLayersPanelLayerKindIconKey("object")).toBe(layersPanelIconKeys.objectLayer);
    expect(resolveLayersPanelToolbarActionIconKey(layersPanelActionIds.raiseLayers)).toBe(
      layersPanelIconKeys.raiseLayers
    );
  });

  it("resolves new-layer menu open state through exported helpers", () => {
    expect(
      resolveLayersPanelNewLayerMenuOpen({
        open: false,
        action: "toggle-menu"
      })
    ).toBe(true);
    expect(
      resolveLayersPanelNewLayerMenuOpen({
        open: true,
        action: "toggle-menu"
      })
    ).toBe(false);
    expect(
      resolveLayersPanelNewLayerMenuOpen({
        open: true,
        action: "blur-menu",
        relatedTargetInside: true
      })
    ).toBe(true);
    expect(
      resolveLayersPanelNewLayerMenuOpen({
        open: true,
        action: "blur-menu",
        relatedTargetInside: false
      })
    ).toBe(false);
    expect(
      resolveLayersPanelNewLayerMenuOpen({
        open: true,
        action: "close-menu"
      })
    ).toBe(false);
  });

  it("derives layer row presentation through exported helpers", () => {
    const viewState: LayersPanelViewState = {
      layers: [
        {
          id: "layer-1" as never,
          kind: "tile",
          name: "Ground",
          visible: true,
          locked: false,
          isSelected: true
        },
        {
          id: "layer-2" as never,
          kind: "object",
          name: "Objects",
          visible: false,
          locked: true,
          isSelected: false
        }
      ],
      hasMap: true,
      hasActiveLayer: true,
      canMoveActiveLayerUp: false,
      canMoveActiveLayerDown: false,
      hasSiblingLayers: true,
      otherLayersHidden: false,
      otherLayersLocked: false,
      highlightCurrentLayer: true
    };

    expect(deriveLayersPanelLayerRowsPresentation({ viewState, t })).toEqual([
      {
        layerId: "layer-1",
        kind: "tile",
        iconKey: layersPanelIconKeys.tileLayer,
        name: "Ground",
        visible: true,
        locked: false,
        isSelected: true,
        highlightName: true,
        visibilityTitle: "layers.visible",
        lockTitle: "layers.unlocked"
      },
      {
        layerId: "layer-2",
        kind: "object",
        iconKey: layersPanelIconKeys.objectLayer,
        name: "Objects",
        visible: false,
        locked: true,
        isSelected: false,
        highlightName: false,
        visibilityTitle: "layers.hidden",
        lockTitle: "layers.locked"
      }
    ]);
  });

  it("creates store-backed action plans for toolbar, new-layer, and row actions", () => {
    const store = createLayersPanelStoreSpy();

    runTransitionPlan(createLayersPanelActionPlan({
      actionId: layersPanelActionIds.addGroupLayer
    }), store);
    runTransitionPlan(createLayersPanelActionPlan({
      actionId: layersPanelActionIds.raiseLayers
    }), store);
    runTransitionPlan(createLayersPanelActionPlan({
      actionId: layersPanelActionIds.removeLayers
    }), store);
    runTransitionPlan(createLayersPanelActionPlan({
      actionId: layersPanelActionIds.selectLayer,
      layerId: "layer-1" as never
    }), store);
    runTransitionPlan(createLayersPanelActionPlan({
      actionId: layersPanelActionIds.toggleLayerVisibility,
      layerId: "layer-2" as never
    }), store);
    runTransitionPlan(createLayersPanelActionPlan({
      actionId: layersPanelActionIds.toggleLayerLock,
      layerId: "layer-3" as never
    }), store);

    expect(store.addGroupLayer).toHaveBeenCalledOnce();
    expect(store.moveActiveLayer).toHaveBeenCalledWith("up");
    expect(store.removeActiveLayer).toHaveBeenCalledOnce();
    expect(store.setActiveLayer).toHaveBeenCalledWith("layer-1");
    expect(store.toggleLayerVisibility).toHaveBeenCalledWith("layer-2");
    expect(store.toggleLayerLock).toHaveBeenCalledWith("layer-3");
  });

  it("returns noop plans for unsupported or incomplete actions", () => {
    expect(
      createLayersPanelActionPlan({
        actionId: layersPanelActionIds.duplicateLayers
      })
    ).toEqual({ kind: "noop" });
    expect(
      createLayersPanelActionPlan({
        actionId: layersPanelActionIds.selectLayer
      })
    ).toEqual({ kind: "noop" });
  });
});
