"use client";

import {
  deriveEditorShellChromeViewState,
  getTiledMainMenus,
  getTiledMainToolbarActions,
  getTiledNewMenuItems,
  getTiledToolOptionItems,
  getTiledToolToolbarItems
} from "@pixel-editor/app-services/ui-shell";
import type { TranslationFn } from "@pixel-editor/i18n";

import type { DockStackTab } from "./dock-stack";
import type {
  LowerRightDockTabId,
  UpperRightDockTabId
} from "./use-editor-shell-local-state";

export function useEditorShellChrome(input: {
  snapshot: Parameters<typeof deriveEditorShellChromeViewState>[0]["snapshot"];
  t: TranslationFn;
  customTypesEditorOpen: boolean;
}) {
  const shellChromeViewState = deriveEditorShellChromeViewState({
    snapshot: input.snapshot,
    customTypesEditorOpen: input.customTypesEditorOpen
  });
  const toolOptionItems = getTiledToolOptionItems(
    {
      activeTool: shellChromeViewState.activeTool,
      shapeFillMode: shellChromeViewState.shapeFillMode
    },
    input.t
  );
  const mainToolbarActions = getTiledMainToolbarActions(input.t);
  const newMenuItems = getTiledNewMenuItems(input.t);
  const toolToolbarItems = getTiledToolToolbarItems(input.t);
  const upperRightDockTabs: DockStackTab<UpperRightDockTabId>[] = [
    { id: "layers", label: input.t("shell.dock.layers") },
    { id: "objects", label: input.t("shell.dock.objects") },
    { id: "mini-map", label: input.t("shell.dock.miniMap") }
  ];
  const lowerRightDockTabs: DockStackTab<LowerRightDockTabId>[] = [
    { id: "tilesets", label: input.t("shell.dock.tilesets") },
    { id: "terrain-sets", label: input.t("shell.dock.terrainSets") }
  ];

  return {
    shellChromeViewState,
    chrome: {
      toolOptionItems,
      mainToolbarActions,
      newMenuItems,
      toolToolbarItems,
      upperRightDockTabs,
      lowerRightDockTabs,
      newAction: mainToolbarActions[0],
      remainingMainActions: mainToolbarActions.slice(1),
      menuSpecs: getTiledMainMenus(shellChromeViewState.menuContext, input.t)
    }
  };
}
