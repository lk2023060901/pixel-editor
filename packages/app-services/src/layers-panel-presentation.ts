import type { LayerId } from "@pixel-editor/domain";
import type { TranslationFn } from "@pixel-editor/i18n";

import type { LayersPanelLayerItemViewState, LayersPanelViewState } from "./ui-models";
import type { LayersPanelStore } from "./ui-store";

export const layersPanelActionIds = {
  addTileLayer: "add-tile-layer",
  addObjectLayer: "add-object-layer",
  addImageLayer: "add-image-layer",
  addGroupLayer: "add-group-layer",
  raiseLayers: "raise-layers",
  lowerLayers: "lower-layers",
  duplicateLayers: "duplicate-layers",
  removeLayers: "remove-layers",
  showHideOtherLayers: "show-hide-other-layers",
  lockUnlockOtherLayers: "lock-unlock-other-layers",
  highlightCurrentLayer: "highlight-current-layer",
  selectLayer: "select-layer",
  toggleLayerVisibility: "toggle-layer-visibility",
  toggleLayerLock: "toggle-layer-lock"
} as const;

export const layersPanelIconKeys = {
  tileLayer: "tile-layer",
  objectLayer: "object-layer",
  imageLayer: "image-layer",
  groupLayer: "group-layer",
  raiseLayers: "raise-layers",
  lowerLayers: "lower-layers",
  duplicateLayers: "duplicate-layers",
  removeLayers: "remove-layers",
  showHideOtherLayers: "show-hide-other-layers",
  lockUnlockOtherLayers: "lock-unlock-other-layers",
  highlightCurrentLayer: "highlight-current-layer"
} as const;

export type LayersPanelActionId =
  (typeof layersPanelActionIds)[keyof typeof layersPanelActionIds];
export type LayersPanelNewLayerActionId =
  | typeof layersPanelActionIds.addTileLayer
  | typeof layersPanelActionIds.addObjectLayer
  | typeof layersPanelActionIds.addImageLayer
  | typeof layersPanelActionIds.addGroupLayer;
export type LayersPanelToolbarActionId =
  | typeof layersPanelActionIds.raiseLayers
  | typeof layersPanelActionIds.lowerLayers
  | typeof layersPanelActionIds.duplicateLayers
  | typeof layersPanelActionIds.removeLayers
  | typeof layersPanelActionIds.showHideOtherLayers
  | typeof layersPanelActionIds.lockUnlockOtherLayers
  | typeof layersPanelActionIds.highlightCurrentLayer;
export type LayersPanelIconKey = (typeof layersPanelIconKeys)[keyof typeof layersPanelIconKeys];

export interface LayersPanelNewLayerItem {
  actionId: LayersPanelNewLayerActionId;
  kind: LayersPanelLayerItemViewState["kind"];
  iconKey: LayersPanelIconKey;
  label: string;
}

export interface LayersPanelToolbarActionItem {
  kind: "action";
  actionId: LayersPanelToolbarActionId;
  iconKey: LayersPanelIconKey;
  title: string;
  disabled: boolean;
  active: boolean;
}

export interface LayersPanelToolbarSeparatorItem {
  kind: "separator";
  id: string;
}

export interface LayersPanelToolbarSpacerItem {
  kind: "spacer";
  id: string;
}

export type LayersPanelToolbarItem =
  | LayersPanelToolbarActionItem
  | LayersPanelToolbarSeparatorItem
  | LayersPanelToolbarSpacerItem;

export interface LayersPanelToolbarPresentation {
  newLayerTitle: string;
  newLayerItems: LayersPanelNewLayerItem[];
  toolbarItems: LayersPanelToolbarItem[];
}

export interface LayersPanelLayerRowPresentation {
  layerId: LayerId;
  kind: LayersPanelLayerItemViewState["kind"];
  iconKey: LayersPanelIconKey;
  name: string;
  visible: boolean;
  locked: boolean;
  isSelected: boolean;
  highlightName: boolean;
  visibilityTitle: string;
  lockTitle: string;
}

export type LayersPanelNewLayerMenuAction =
  | "toggle-menu"
  | "close-menu"
  | "blur-menu";

export type LayersPanelActionPlan =
  | { kind: "noop" }
  | {
      kind: "transition";
      run: (store: LayersPanelStore) => void;
    };

export function resolveLayersPanelLayerKindIconKey(
  kind: LayersPanelLayerItemViewState["kind"]
): LayersPanelIconKey {
  switch (kind) {
    case "object":
      return layersPanelIconKeys.objectLayer;
    case "image":
      return layersPanelIconKeys.imageLayer;
    case "group":
      return layersPanelIconKeys.groupLayer;
    default:
      return layersPanelIconKeys.tileLayer;
  }
}

export function resolveLayersPanelToolbarActionIconKey(
  actionId: LayersPanelToolbarActionId
): LayersPanelIconKey {
  switch (actionId) {
    case layersPanelActionIds.raiseLayers:
      return layersPanelIconKeys.raiseLayers;
    case layersPanelActionIds.lowerLayers:
      return layersPanelIconKeys.lowerLayers;
    case layersPanelActionIds.duplicateLayers:
      return layersPanelIconKeys.duplicateLayers;
    case layersPanelActionIds.removeLayers:
      return layersPanelIconKeys.removeLayers;
    case layersPanelActionIds.showHideOtherLayers:
      return layersPanelIconKeys.showHideOtherLayers;
    case layersPanelActionIds.lockUnlockOtherLayers:
      return layersPanelIconKeys.lockUnlockOtherLayers;
    case layersPanelActionIds.highlightCurrentLayer:
      return layersPanelIconKeys.highlightCurrentLayer;
  }
}

export function getLayersPanelNewLayerItems(t: TranslationFn): LayersPanelNewLayerItem[] {
  return [
    {
      actionId: layersPanelActionIds.addTileLayer,
      kind: "tile",
      iconKey: resolveLayersPanelLayerKindIconKey("tile"),
      label: t("layerKind.tile")
    },
    {
      actionId: layersPanelActionIds.addObjectLayer,
      kind: "object",
      iconKey: resolveLayersPanelLayerKindIconKey("object"),
      label: t("layerKind.object")
    },
    {
      actionId: layersPanelActionIds.addImageLayer,
      kind: "image",
      iconKey: resolveLayersPanelLayerKindIconKey("image"),
      label: t("layerKind.image")
    },
    {
      actionId: layersPanelActionIds.addGroupLayer,
      kind: "group",
      iconKey: resolveLayersPanelLayerKindIconKey("group"),
      label: t("layerKind.group")
    }
  ];
}

export function deriveLayersPanelToolbarPresentation(input: {
  viewState: LayersPanelViewState;
  t: TranslationFn;
}): LayersPanelToolbarPresentation {
  const { t, viewState } = input;

  return {
    newLayerTitle: t("layers.newLayer"),
    newLayerItems: getLayersPanelNewLayerItems(t),
    toolbarItems: [
      {
        kind: "action",
        actionId: layersPanelActionIds.raiseLayers,
        iconKey: resolveLayersPanelToolbarActionIconKey(layersPanelActionIds.raiseLayers),
        title: t("action.raiseLayers"),
        disabled: !viewState.canMoveActiveLayerUp,
        active: false
      },
      {
        kind: "action",
        actionId: layersPanelActionIds.lowerLayers,
        iconKey: resolveLayersPanelToolbarActionIconKey(layersPanelActionIds.lowerLayers),
        title: t("action.lowerLayers"),
        disabled: !viewState.canMoveActiveLayerDown,
        active: false
      },
      {
        kind: "action",
        actionId: layersPanelActionIds.duplicateLayers,
        iconKey: resolveLayersPanelToolbarActionIconKey(layersPanelActionIds.duplicateLayers),
        title: t("action.duplicateLayers"),
        disabled: true,
        active: false
      },
      {
        kind: "action",
        actionId: layersPanelActionIds.removeLayers,
        iconKey: resolveLayersPanelToolbarActionIconKey(layersPanelActionIds.removeLayers),
        title: t("action.removeLayers"),
        disabled: !viewState.hasActiveLayer,
        active: false
      },
      {
        kind: "separator",
        id: "other-layer-controls"
      },
      {
        kind: "action",
        actionId: layersPanelActionIds.showHideOtherLayers,
        iconKey: resolveLayersPanelToolbarActionIconKey(layersPanelActionIds.showHideOtherLayers),
        title: t("action.showHideOtherLayers"),
        disabled: !viewState.hasSiblingLayers,
        active: viewState.otherLayersHidden
      },
      {
        kind: "action",
        actionId: layersPanelActionIds.lockUnlockOtherLayers,
        iconKey: resolveLayersPanelToolbarActionIconKey(layersPanelActionIds.lockUnlockOtherLayers),
        title: t("action.lockUnlockOtherLayers"),
        disabled: !viewState.hasSiblingLayers,
        active: viewState.otherLayersLocked
      },
      {
        kind: "spacer",
        id: "highlight-current-layer"
      },
      {
        kind: "action",
        actionId: layersPanelActionIds.highlightCurrentLayer,
        iconKey: resolveLayersPanelToolbarActionIconKey(layersPanelActionIds.highlightCurrentLayer),
        title: t("action.highlightCurrentLayer"),
        disabled: !viewState.hasActiveLayer,
        active: viewState.highlightCurrentLayer
      }
    ]
  };
}

export function resolveLayersPanelLayerVisibilityTitle(input: {
  visible: boolean;
  t: TranslationFn;
}): string {
  return input.visible ? input.t("layers.visible") : input.t("layers.hidden");
}

export function resolveLayersPanelLayerLockTitle(input: {
  locked: boolean;
  t: TranslationFn;
}): string {
  return input.locked ? input.t("layers.locked") : input.t("layers.unlocked");
}

export function deriveLayersPanelLayerRowsPresentation(input: {
  viewState: LayersPanelViewState;
  t: TranslationFn;
}): LayersPanelLayerRowPresentation[] {
  return input.viewState.layers.map((layer) => ({
    layerId: layer.id,
    kind: layer.kind,
    iconKey: resolveLayersPanelLayerKindIconKey(layer.kind),
    name: layer.name,
    visible: layer.visible,
    locked: layer.locked,
    isSelected: layer.isSelected,
    highlightName: layer.isSelected && input.viewState.highlightCurrentLayer,
    visibilityTitle: resolveLayersPanelLayerVisibilityTitle({
      visible: layer.visible,
      t: input.t
    }),
    lockTitle: resolveLayersPanelLayerLockTitle({
      locked: layer.locked,
      t: input.t
    })
  }));
}

export function resolveLayersPanelNewLayerMenuOpen(input: {
  open: boolean;
  action: LayersPanelNewLayerMenuAction;
  relatedTargetInside?: boolean;
}): boolean {
  switch (input.action) {
    case "toggle-menu":
      return !input.open;
    case "close-menu":
      return false;
    case "blur-menu":
      return input.relatedTargetInside ? input.open : false;
  }
}

export function createLayersPanelActionPlan(input: {
  actionId: LayersPanelActionId;
  layerId?: LayerId;
}): LayersPanelActionPlan {
  switch (input.actionId) {
    case layersPanelActionIds.addTileLayer:
      return {
        kind: "transition",
        run: (store) => {
          store.addTileLayer();
        }
      };
    case layersPanelActionIds.addObjectLayer:
      return {
        kind: "transition",
        run: (store) => {
          store.addObjectLayer();
        }
      };
    case layersPanelActionIds.addImageLayer:
      return {
        kind: "transition",
        run: (store) => {
          store.addImageLayer();
        }
      };
    case layersPanelActionIds.addGroupLayer:
      return {
        kind: "transition",
        run: (store) => {
          store.addGroupLayer();
        }
      };
    case layersPanelActionIds.raiseLayers:
      return {
        kind: "transition",
        run: (store) => {
          store.moveActiveLayer("up");
        }
      };
    case layersPanelActionIds.lowerLayers:
      return {
        kind: "transition",
        run: (store) => {
          store.moveActiveLayer("down");
        }
      };
    case layersPanelActionIds.removeLayers:
      return {
        kind: "transition",
        run: (store) => {
          store.removeActiveLayer();
        }
      };
    case layersPanelActionIds.showHideOtherLayers:
      return {
        kind: "transition",
        run: (store) => {
          store.toggleOtherLayersVisibility();
        }
      };
    case layersPanelActionIds.lockUnlockOtherLayers:
      return {
        kind: "transition",
        run: (store) => {
          store.toggleOtherLayersLock();
        }
      };
    case layersPanelActionIds.highlightCurrentLayer:
      return {
        kind: "transition",
        run: (store) => {
          store.toggleHighlightCurrentLayer();
        }
      };
    case layersPanelActionIds.selectLayer:
      if (input.layerId === undefined) {
        return { kind: "noop" };
      }

      return {
        kind: "transition",
        run: (store) => {
          store.setActiveLayer(input.layerId!);
        }
      };
    case layersPanelActionIds.toggleLayerVisibility:
      if (input.layerId === undefined) {
        return { kind: "noop" };
      }

      return {
        kind: "transition",
        run: (store) => {
          store.toggleLayerVisibility(input.layerId!);
        }
      };
    case layersPanelActionIds.toggleLayerLock:
      if (input.layerId === undefined) {
        return { kind: "noop" };
      }

      return {
        kind: "transition",
        run: (store) => {
          store.toggleLayerLock(input.layerId!);
        }
      };
    case layersPanelActionIds.duplicateLayers:
    default:
      return { kind: "noop" };
  }
}
