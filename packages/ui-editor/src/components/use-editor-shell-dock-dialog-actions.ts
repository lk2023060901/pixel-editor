"use client";

import type { ProjectTreeAssetNode } from "@pixel-editor/app-services/ui";
import {
  type EditorShellDocumentNavigationStore,
  type EditorShellFileActionsStore,
  createProjectDockActivationPlan,
  type ProjectDockActivationStore,
  type EditorShellTemplateActionsStore
} from "@pixel-editor/app-services/ui-shell";
import type { Dispatch, SetStateAction } from "react";
import { startTransition } from "react";

import type {
  LowerRightDockTabId,
  UpperRightDockTabId
} from "./use-editor-shell-local-state";

type ProjectDockAsset = ProjectTreeAssetNode["asset"];

export function useEditorShellDockDialogActions(input: {
  templateActionsStore: EditorShellTemplateActionsStore;
  fileActionsStore: EditorShellFileActionsStore;
  documentNavigationStore: EditorShellDocumentNavigationStore;
  snapshot: Parameters<typeof createProjectDockActivationPlan>[0]["snapshot"];
  setUpperRightDockTab: Dispatch<SetStateAction<UpperRightDockTabId>>;
  setLowerRightDockTab: Dispatch<SetStateAction<LowerRightDockTabId>>;
  setSaveTemplateDialogOpen: Dispatch<SetStateAction<boolean>>;
  setTileAnimationEditorOpen: Dispatch<SetStateAction<boolean>>;
  setTileCollisionEditorOpen: Dispatch<SetStateAction<boolean>>;
  setCustomTypesEditorOpen: Dispatch<SetStateAction<boolean>>;
  setProjectPropertiesOpen: Dispatch<SetStateAction<boolean>>;
}) {
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
        input.setLowerRightDockTab("tilesets");
      }
    };

    plan.run(store);
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
        input.setSaveTemplateDialogOpen(true);
      }
    },
    tilesetActions: {
      onExportJson() {
        void input.fileActionsStore.exportActiveTilesetAsJson();
      },
      onOpenTileAnimationEditor() {
        input.setTileAnimationEditorOpen(true);
      },
      onCloseTileAnimationEditor() {
        input.setTileAnimationEditorOpen(false);
      },
      onOpenTileCollisionEditor() {
        input.setTileCollisionEditorOpen(true);
      },
      onCloseTileCollisionEditor() {
        input.setTileCollisionEditorOpen(false);
      },
      onOpenTerrainSets() {
        input.setLowerRightDockTab("terrain-sets");
      }
    },
    dialogActions: {
      onCloseCustomTypesEditor() {
        input.setCustomTypesEditorOpen(false);
      },
      onCloseProjectProperties() {
        input.setProjectPropertiesOpen(false);
      },
      onCloseSaveTemplateDialog() {
        input.setSaveTemplateDialogOpen(false);
      }
    }
  };
}
