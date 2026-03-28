"use client";

import type { MapImageExportViewState } from "@pixel-editor/app-services/ui";
import {
  createEditorShellActionPlan,
  createEditorShellSurfaceActionPlan,
  editorShellLowerRightDockTabIds,
  resolveEditorShellNewMenuOpen,
  resolveEditorShellOpenMenuId,
  type EditorShellActionPlan,
  type EditorShellActionStore,
  type EditorShellChromeViewState,
  type EditorShellLowerRightDockTabId,
  type EditorShellFileActionsStore,
  type EditorShellSurfaceStore,
  type ToolbarActionSpec
} from "@pixel-editor/app-services/ui-shell";
import type { TranslationFn } from "@pixel-editor/i18n";
import type { Dispatch, SetStateAction } from "react";
import { startTransition } from "react";

import type { EditorRenderBridge } from "../render-bridge";
export function useEditorShellMenuActions(input: {
  actionStore: EditorShellActionStore;
  fileActionsStore: EditorShellFileActionsStore;
  renderBridge: EditorRenderBridge;
  t: TranslationFn;
  shellChromeViewState: EditorShellChromeViewState;
  mapImageExportViewState: MapImageExportViewState | undefined;
  setOpenMenuId: Dispatch<SetStateAction<string | null>>;
  setNewMenuOpen: Dispatch<SetStateAction<boolean>>;
  setCustomTypesEditorOpen: Dispatch<SetStateAction<boolean>>;
  setProjectPropertiesOpen: Dispatch<SetStateAction<boolean>>;
  setTileAnimationEditorOpen: Dispatch<SetStateAction<boolean>>;
  setTileCollisionEditorOpen: Dispatch<SetStateAction<boolean>>;
  setLowerRightDockTab: Dispatch<SetStateAction<EditorShellLowerRightDockTabId>>;
}) {
  const surfaceStore: EditorShellSurfaceStore = {
    toggleCustomTypesEditor() {
      input.setCustomTypesEditorOpen((current) => !current);
    },
    closeCustomTypesEditor() {
      input.setCustomTypesEditorOpen(false);
    },
    toggleProjectProperties() {
      input.setProjectPropertiesOpen((current) => !current);
    },
    closeProjectProperties() {
      input.setProjectPropertiesOpen(false);
    },
    openSaveTemplateDialog() {
      return;
    },
    closeSaveTemplateDialog() {
      return;
    },
    openTileAnimationEditor() {
      input.setTileAnimationEditorOpen(true);
    },
    closeTileAnimationEditor() {
      input.setTileAnimationEditorOpen(false);
    },
    openTileCollisionEditor() {
      input.setTileCollisionEditorOpen(true);
    },
    closeTileCollisionEditor() {
      input.setTileCollisionEditorOpen(false);
    },
    focusTerrainSetsPanel() {
      input.setLowerRightDockTab(editorShellLowerRightDockTabIds.terrainSets);
    }
  };

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

  function runSurfaceAction(
    action: Parameters<typeof createEditorShellSurfaceActionPlan>[0]
  ): void {
    const plan = createEditorShellSurfaceActionPlan(action);

    if (plan.kind !== "transition") {
      return;
    }

    plan.run(surfaceStore);
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
        if (plan.action === "export-as-image") {
          void handleExportAsImage();
          return;
        }

        runSurfaceAction(plan.action);
        return;
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
      input.setOpenMenuId((current) =>
        resolveEditorShellOpenMenuId({
          openMenuId: current,
          transition: {
            kind: "toggle-button",
            menuId
          }
        })
      );
    },
    onMenuPointerEnter(menuId: string) {
      input.setOpenMenuId((current) =>
        resolveEditorShellOpenMenuId({
          openMenuId: current,
          transition: {
            kind: "pointer-enter",
            menuId
          }
        })
      );
    },
    onCloseMenu() {
      input.setOpenMenuId((current) =>
        resolveEditorShellOpenMenuId({
          openMenuId: current,
          transition: {
            kind: "close"
          }
        })
      );
    },
    onNewMenuBlur() {
      input.setNewMenuOpen((current) =>
        resolveEditorShellNewMenuOpen({
          open: current,
          transition: {
            kind: "close"
          }
        })
      );
    },
    onToggleNewMenu() {
      input.setNewMenuOpen((current) =>
        resolveEditorShellNewMenuOpen({
          open: current,
          transition: {
            kind: "toggle"
          }
        })
      );
    },
    onNewActionPrimaryClick(action: ToolbarActionSpec) {
      handleToolbarAction(action);
      input.setNewMenuOpen((current) =>
        resolveEditorShellNewMenuOpen({
          open: current,
          transition: {
            kind: "close"
          }
        })
      );
    },
    onNewMenuItem(menuItemId: string) {
      input.setNewMenuOpen((current) =>
        resolveEditorShellNewMenuOpen({
          open: current,
          transition: {
            kind: "close"
          }
        })
      );
      executeActionPlan(buildShellActionPlan(menuItemId));
    },
    onMenuAction(actionId: string) {
      executeActionPlan(buildShellActionPlan(actionId));
    },
    onToolbarAction: handleToolbarAction
  };
}
