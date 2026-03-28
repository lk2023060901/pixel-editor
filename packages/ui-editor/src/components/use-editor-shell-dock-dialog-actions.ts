"use client";

import type { ProjectTreeAssetNode } from "@pixel-editor/app-services/ui";
import {
  type EditorShellLowerRightDockTabId,
  type EditorShellUpperRightDockTabId,
  type EditorShellDocumentNavigationStore,
  type EditorShellFileActionsStore,
  createEditorShellSurfaceActionPlan,
  createProjectDockActivationPlan,
  editorShellLowerRightDockTabIds,
  type ProjectDockActivationStore,
  type EditorShellSurfaceStore,
  type EditorShellTemplateActionsStore
} from "@pixel-editor/app-services/ui-shell";
import type { Dispatch, SetStateAction } from "react";
import { startTransition } from "react";

type ProjectDockAsset = ProjectTreeAssetNode["asset"];

export function useEditorShellDockDialogActions(input: {
  templateActionsStore: EditorShellTemplateActionsStore;
  fileActionsStore: EditorShellFileActionsStore;
  documentNavigationStore: EditorShellDocumentNavigationStore;
  snapshot: Parameters<typeof createProjectDockActivationPlan>[0]["snapshot"];
  setUpperRightDockTab: Dispatch<SetStateAction<EditorShellUpperRightDockTabId>>;
  setLowerRightDockTab: Dispatch<SetStateAction<EditorShellLowerRightDockTabId>>;
  setSaveTemplateDialogOpen: Dispatch<SetStateAction<boolean>>;
  setTileAnimationEditorOpen: Dispatch<SetStateAction<boolean>>;
  setTileCollisionEditorOpen: Dispatch<SetStateAction<boolean>>;
  setCustomTypesEditorOpen: Dispatch<SetStateAction<boolean>>;
  setProjectPropertiesOpen: Dispatch<SetStateAction<boolean>>;
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
      input.setSaveTemplateDialogOpen(true);
    },
    closeSaveTemplateDialog() {
      input.setSaveTemplateDialogOpen(false);
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

  function handleProjectDockAssetActivate(asset: ProjectDockAsset): void {
    const plan = createProjectDockActivationPlan({
      snapshot: input.snapshot,
      asset
    });

    if (plan.kind !== "transition") {
      return;
    }

    const store: ProjectDockActivationStore = {
      ...input.documentNavigationStore,
      focusTilesetsPanel() {
        input.setLowerRightDockTab(editorShellLowerRightDockTabIds.tilesets);
      }
    };

    plan.run(store);
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

  return {
    dockActions: {
      onUpperRightDockTabChange: input.setUpperRightDockTab,
      onLowerRightDockTabChange: input.setLowerRightDockTab,
      onProjectAssetActivate: handleProjectDockAssetActivate
    },
    objectActions: {
      onDetachTemplateInstances() {
        startTransition(() => {
          input.templateActionsStore.detachSelectedTemplateInstances();
        });
      },
      onReplaceWithTemplate() {
        startTransition(() => {
          input.templateActionsStore.replaceSelectedObjectsWithActiveTemplate();
        });
      },
      onResetTemplateInstances() {
        startTransition(() => {
          input.templateActionsStore.resetSelectedTemplateInstances();
        });
      },
      onSaveAsTemplate() {
        runSurfaceAction("open-save-template-dialog");
      }
    },
    tilesetActions: {
      onExportJson() {
        void input.fileActionsStore.exportActiveTilesetAsJson();
      },
      onOpenTileAnimationEditor() {
        runSurfaceAction("open-tile-animation-editor");
      },
      onCloseTileAnimationEditor() {
        runSurfaceAction("close-tile-animation-editor");
      },
      onOpenTileCollisionEditor() {
        runSurfaceAction("open-tile-collision-editor");
      },
      onCloseTileCollisionEditor() {
        runSurfaceAction("close-tile-collision-editor");
      },
      onOpenTerrainSets() {
        runSurfaceAction("focus-terrain-sets");
      }
    },
    dialogActions: {
      onCloseCustomTypesEditor() {
        runSurfaceAction("close-custom-types-editor");
      },
      onCloseProjectProperties() {
        runSurfaceAction("close-project-properties");
      },
      onCloseSaveTemplateDialog() {
        runSurfaceAction("close-save-template-dialog");
      }
    }
  };
}
