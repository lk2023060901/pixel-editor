import type { TranslationFn } from "@pixel-editor/i18n";

import type { EditorRuntimeSnapshot } from "./controller";
import {
  deriveEditorShellChromeViewState,
  type EditorShellChromeViewState
} from "./ui-models";
import {
  getTiledMainMenus,
  getTiledMainToolbarActions,
  getTiledNewMenuItems,
  getTiledToolOptionItems,
  getTiledToolToolbarItems,
  type TiledMenuSpec,
  type ToolbarActionSpec,
  type ToolbarItemSpec,
  type ToolbarMenuItemSpec
} from "./toolbar-spec";

export const editorShellUpperRightDockTabIds = {
  layers: "layers",
  objects: "objects",
  miniMap: "mini-map"
} as const;

export const editorShellLowerRightDockTabIds = {
  terrainSets: "terrain-sets",
  tilesets: "tilesets"
} as const;

export const editorShellUpperRightDockPanelIds = {
  layers: "layers-panel",
  objects: "objects-panel",
  miniMap: "mini-map-panel"
} as const;

export const editorShellLowerRightDockPanelIds = {
  terrainSets: "terrain-sets-panel",
  tilesets: "tilesets-panel"
} as const;

export type EditorShellUpperRightDockTabId =
  (typeof editorShellUpperRightDockTabIds)[keyof typeof editorShellUpperRightDockTabIds];
export type EditorShellLowerRightDockTabId =
  (typeof editorShellLowerRightDockTabIds)[keyof typeof editorShellLowerRightDockTabIds];
export type EditorShellUpperRightDockPanelId =
  (typeof editorShellUpperRightDockPanelIds)[keyof typeof editorShellUpperRightDockPanelIds];
export type EditorShellLowerRightDockPanelId =
  (typeof editorShellLowerRightDockPanelIds)[keyof typeof editorShellLowerRightDockPanelIds];

export interface EditorShellDockTab<
  TTabId extends string = string,
  TPanelId extends string = string
> {
  id: TTabId;
  label: string;
  panelId: TPanelId;
}

export interface EditorShellChromeConfig {
  menuSpecs: TiledMenuSpec[];
  mainToolbarActions: ToolbarActionSpec[];
  newAction: ToolbarActionSpec | undefined;
  remainingMainActions: ToolbarActionSpec[];
  newMenuItems: ToolbarMenuItemSpec[];
  toolToolbarItems: ToolbarItemSpec[];
  toolOptionItems: ToolbarItemSpec[];
  upperRightDockTabs: EditorShellDockTab<
    EditorShellUpperRightDockTabId,
    EditorShellUpperRightDockPanelId
  >[];
  lowerRightDockTabs: EditorShellDockTab<
    EditorShellLowerRightDockTabId,
    EditorShellLowerRightDockPanelId
  >[];
}

export interface EditorShellChromePresentation {
  shellChromeViewState: EditorShellChromeViewState;
  chrome: EditorShellChromeConfig;
}

export const defaultEditorShellUpperRightDockTabId: EditorShellUpperRightDockTabId =
  editorShellUpperRightDockTabIds.layers;
export const defaultEditorShellLowerRightDockTabId: EditorShellLowerRightDockTabId =
  editorShellLowerRightDockTabIds.tilesets;

export function getEditorShellUpperRightDockTabs(
  t: TranslationFn
): EditorShellDockTab<EditorShellUpperRightDockTabId, EditorShellUpperRightDockPanelId>[] {
  return [
    {
      id: editorShellUpperRightDockTabIds.layers,
      label: t("shell.dock.layers"),
      panelId: editorShellUpperRightDockPanelIds.layers
    },
    {
      id: editorShellUpperRightDockTabIds.objects,
      label: t("shell.dock.objects"),
      panelId: editorShellUpperRightDockPanelIds.objects
    },
    {
      id: editorShellUpperRightDockTabIds.miniMap,
      label: t("shell.dock.miniMap"),
      panelId: editorShellUpperRightDockPanelIds.miniMap
    }
  ];
}

export function getEditorShellLowerRightDockTabs(
  t: TranslationFn
): EditorShellDockTab<EditorShellLowerRightDockTabId, EditorShellLowerRightDockPanelId>[] {
  return [
    {
      id: editorShellLowerRightDockTabIds.tilesets,
      label: t("shell.dock.tilesets"),
      panelId: editorShellLowerRightDockPanelIds.tilesets
    },
    {
      id: editorShellLowerRightDockTabIds.terrainSets,
      label: t("shell.dock.terrainSets"),
      panelId: editorShellLowerRightDockPanelIds.terrainSets
    }
  ];
}

export function resolveEditorShellDockPanel<
  TTabId extends string,
  TPanelId extends string
>(
  tabs: readonly EditorShellDockTab<TTabId, TPanelId>[],
  activeTab: TTabId
): TPanelId {
  const activeEntry = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  if (activeEntry === undefined) {
    throw new Error("Editor shell dock tabs must not be empty.");
  }

  return activeEntry.panelId;
}

export function deriveEditorShellChromePresentation(input: {
  snapshot: EditorRuntimeSnapshot;
  customTypesEditorOpen: boolean;
  t: TranslationFn;
}): EditorShellChromePresentation {
  const shellChromeViewState = deriveEditorShellChromeViewState({
    snapshot: input.snapshot,
    customTypesEditorOpen: input.customTypesEditorOpen
  });
  const mainToolbarActions = getTiledMainToolbarActions(input.t);
  const [newAction, ...remainingMainActions] = mainToolbarActions;

  return {
    shellChromeViewState,
    chrome: {
      menuSpecs: getTiledMainMenus(shellChromeViewState.menuContext, input.t),
      mainToolbarActions,
      newAction,
      remainingMainActions,
      newMenuItems: getTiledNewMenuItems(input.t),
      toolToolbarItems: getTiledToolToolbarItems(input.t),
      toolOptionItems: getTiledToolOptionItems(
        {
          activeTool: shellChromeViewState.activeTool,
          shapeFillMode: shellChromeViewState.shapeFillMode
        },
        input.t
      ),
      upperRightDockTabs: getEditorShellUpperRightDockTabs(input.t),
      lowerRightDockTabs: getEditorShellLowerRightDockTabs(input.t)
    }
  };
}
