"use client";

import type { MapImageExportViewState } from "@pixel-editor/app-services/ui";
import {
  createEditorShellActionPlan,
  type EditorShellActionPlan,
  type EditorShellActionStore,
  type EditorShellChromeViewState,
  type EditorShellFileActionsStore,
  type ToolbarActionSpec
} from "@pixel-editor/app-services/ui-shell";
import type { TranslationFn } from "@pixel-editor/i18n";
import type { Dispatch, SetStateAction } from "react";
import { startTransition } from "react";

import type { EditorRenderBridge } from "../render-bridge";

import type { LowerRightDockTabId } from "./use-editor-shell-local-state";

export function useEditorShellMenuActions(input: {
  actionStore: EditorShellActionStore;
  fileActionsStore: EditorShellFileActionsStore;
  renderBridge: EditorRenderBridge;
  t: TranslationFn;
  shellChromeViewState: EditorShellChromeViewState;
  mapImageExportViewState: MapImageExportViewState | undefined;
  openMenuId: string | null;
  setOpenMenuId: Dispatch<SetStateAction<string | null>>;
  setNewMenuOpen: Dispatch<SetStateAction<boolean>>;
  setCustomTypesEditorOpen: Dispatch<SetStateAction<boolean>>;
  setProjectPropertiesOpen: Dispatch<SetStateAction<boolean>>;
  setTileAnimationEditorOpen: Dispatch<SetStateAction<boolean>>;
  setTileCollisionEditorOpen: Dispatch<SetStateAction<boolean>>;
  setLowerRightDockTab: Dispatch<SetStateAction<LowerRightDockTabId>>;
}) {
  async function handleExportAsImage(): Promise<void> {
    if (!input.mapImageExportViewState) {
      return;
    }

    try {
      const dataUrl = await input.renderBridge.exportSnapshotImageDataUrl({
        snapshot: input.mapImageExportViewState.snapshot,
        width: input.mapImageExportViewState.width,
        height: input.mapImageExportViewState.height,
        labels: {
          noActiveMap: input.t("canvas.noActiveMap")
        }
      });

      await input.fileActionsStore.exportActiveMapImage(dataUrl);
    } catch (error) {
      console.error("Failed to export map image.", error);
    }
  }

  function executeActionPlan(plan: EditorShellActionPlan): void {
    switch (plan.kind) {
      case "transition":
        startTransition(() => {
          plan.run(input.actionStore);
        });
        return;
      case "async":
        void plan.run(input.actionStore);
        return;
      case "local":
        switch (plan.action) {
          case "export-as-image":
            void handleExportAsImage();
            return;
          case "toggle-custom-types-editor":
            input.setCustomTypesEditorOpen((current) => !current);
            return;
          case "toggle-project-properties":
            input.setProjectPropertiesOpen((current) => !current);
            return;
          case "open-tile-animation-editor":
            input.setTileAnimationEditorOpen(true);
            return;
          case "open-tile-collision-editor":
            input.setTileCollisionEditorOpen(true);
            return;
          case "focus-terrain-sets":
            input.setLowerRightDockTab("terrain-sets");
            return;
        }
      case "noop":
        return;
    }
  }

  function buildShellActionPlan(
    actionId: string,
    editorToolId?: ToolbarActionSpec["editorToolId"]
  ): EditorShellActionPlan {
    return createEditorShellActionPlan({
      actionId,
      canUseWorldTool: input.shellChromeViewState.canUseWorldTool,
      ...(editorToolId === undefined ? {} : { editorToolId }),
      ...(input.shellChromeViewState.activeLayerId === undefined
        ? {}
        : { activeLayerId: input.shellChromeViewState.activeLayerId })
    });
  }

  function handleToolbarAction(action: ToolbarActionSpec): void {
    if (!action.implemented) {
      return;
    }

    executeActionPlan(buildShellActionPlan(action.id, action.editorToolId));
  }

  return {
    onMenuButtonClick(menuId: string) {
      input.setOpenMenuId((current) => (current === menuId ? null : menuId));
    },
    onMenuPointerEnter(menuId: string) {
      if (input.openMenuId !== null) {
        input.setOpenMenuId(menuId);
      }
    },
    onCloseMenu() {
      input.setOpenMenuId(null);
    },
    onNewMenuBlur() {
      input.setNewMenuOpen(false);
    },
    onToggleNewMenu() {
      input.setNewMenuOpen((current) => !current);
    },
    onNewActionPrimaryClick(action: ToolbarActionSpec) {
      handleToolbarAction(action);
      input.setNewMenuOpen(false);
    },
    onNewMenuItem(menuItemId: string) {
      input.setNewMenuOpen(false);
      executeActionPlan(buildShellActionPlan(menuItemId));
    },
    onMenuAction(actionId: string) {
      executeActionPlan(buildShellActionPlan(actionId));
    },
    onToolbarAction: handleToolbarAction
  };
}
