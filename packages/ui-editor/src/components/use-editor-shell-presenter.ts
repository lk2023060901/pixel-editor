"use client";

import {
  deriveEditorShellOverlaysPresentation,
  type EditorShellActionStore,
  type EditorShellCanvasInteractionStore,
  type EditorShellDocumentNavigationStore,
  type EditorShellFileActionsStore,
  type EditorShellIssuesStore,
  type MiniMapPanelStore,
  type EditorShellSnapshotStore,
  type EditorShellStatusBarStore,
  type EditorShellStore,
  type EditorShellTemplateActionsStore
} from "@pixel-editor/app-services/ui-shell";
import type { TranslationFn } from "@pixel-editor/i18n";

import type { EditorRenderBridge } from "../render-bridge";

import { useEditorShellChrome } from "./use-editor-shell-chrome";
import { useEditorShellDockDialogActions } from "./use-editor-shell-dock-dialog-actions";
import { useEditorShellFeedbackActions } from "./use-editor-shell-feedback-actions";
import { useEditorShellLocalState } from "./use-editor-shell-local-state";
import { useEditorShellMenuActions } from "./use-editor-shell-menu-actions";
import { useEditorShellNewMenuState } from "./use-editor-shell-new-menu-state";
import { useEditorShellViewState } from "./use-editor-shell-view-state";

export interface UseEditorShellPresenterInput {
  store: EditorShellStore;
  renderBridge: EditorRenderBridge;
  t: TranslationFn;
}

export function useEditorShellPresenter(input: UseEditorShellPresenterInput) {
  const actionStore: EditorShellActionStore = input.store;
  const snapshotStore: EditorShellSnapshotStore = input.store;
  const fileActionsStore: EditorShellFileActionsStore = input.store;
  const templateActionsStore: EditorShellTemplateActionsStore = input.store;
  const documentNavigationStore: EditorShellDocumentNavigationStore = input.store;
  const canvasInteractionStore: EditorShellCanvasInteractionStore = input.store;
  const issuesStore: EditorShellIssuesStore = input.store;
  const statusBarStore: EditorShellStatusBarStore = input.store;
  const miniMapStore: MiniMapPanelStore = input.store;

  const derived = useEditorShellViewState({
    snapshotStore
  });
  const local = useEditorShellLocalState({
    hasActiveObject: derived.hasActiveObject
  });
  const newMenu = useEditorShellNewMenuState();
  const chrome = useEditorShellChrome({
    snapshot: derived.snapshot,
    t: input.t,
    customTypesEditorOpen: local.state.customTypesEditorOpen
  });
  const menuActions = useEditorShellMenuActions({
    actionStore,
    fileActionsStore,
    renderBridge: input.renderBridge,
    t: input.t,
    shellChromeViewState: chrome.shellChromeViewState,
    mapImageExportViewState: derived.view.mapImageExportViewState,
    setOpenMenuId: local.setters.setOpenMenuId,
    setNewMenuOpen: newMenu.setters.setNewMenuOpen,
    setCustomTypesEditorOpen: local.setters.setCustomTypesEditorOpen,
    setProjectPropertiesOpen: local.setters.setProjectPropertiesOpen,
    setTileAnimationEditorOpen: local.setters.setTileAnimationEditorOpen,
    setTileCollisionEditorOpen: local.setters.setTileCollisionEditorOpen,
    setLowerRightDockTab: local.setters.setLowerRightDockTab
  });
  const {
    dockActions,
    objectActions,
    tilesetActions,
    dialogActions
  } = useEditorShellDockDialogActions({
    templateActionsStore,
    fileActionsStore,
    documentNavigationStore,
    snapshot: derived.snapshot,
    setUpperRightDockTab: local.setters.setUpperRightDockTab,
    setLowerRightDockTab: local.setters.setLowerRightDockTab,
    setSaveTemplateDialogOpen: local.setters.setSaveTemplateDialogOpen,
    setTileAnimationEditorOpen: local.setters.setTileAnimationEditorOpen,
    setTileCollisionEditorOpen: local.setters.setTileCollisionEditorOpen,
    setCustomTypesEditorOpen: local.setters.setCustomTypesEditorOpen,
    setProjectPropertiesOpen: local.setters.setProjectPropertiesOpen
  });
  const {
    rendererActions,
    miniMapActions,
    issuesActions,
    statusBarActions
  } = useEditorShellFeedbackActions({
    canvasInteractionStore,
    issuesStore,
    statusBarStore,
    miniMapStore,
    setStatusInfo: local.setters.setStatusInfo
  });
  const overlayPresentation = deriveEditorShellOverlaysPresentation({
    shellViewState: derived.view.shellViewState,
    shellDialogsViewState: derived.view.shellDialogsViewState,
    issuesPanelViewState: derived.view.issuesPanelViewState,
    statusBarViewState: derived.view.statusBarViewState,
    tileAnimationEditorViewState: derived.view.tileAnimationEditorViewState,
    tileCollisionEditorViewState: derived.view.tileCollisionEditorViewState,
    overlaysState: {
      statusInfo: local.state.statusInfo,
      tileAnimationEditorOpen: local.state.tileAnimationEditorOpen,
      tileCollisionEditorOpen: local.state.tileCollisionEditorOpen,
      customTypesEditorOpen: local.state.customTypesEditorOpen,
      projectPropertiesOpen: local.state.projectPropertiesOpen,
      saveTemplateDialogOpen: local.state.saveTemplateDialogOpen
    }
  });

  return {
    refs: {
      menuBarRef: local.refs.menuBarRef
    },
    state: {
      ...local.state,
      newMenuOpen: newMenu.state.newMenuOpen
    },
    view: {
      ...derived.view,
      shellChromeViewState: chrome.shellChromeViewState,
      overlayPresentation
    },
    chrome: chrome.chrome,
    menuActions,
    dockActions,
    objectActions,
    tilesetActions,
    dialogActions,
    rendererActions,
    miniMapActions,
    issuesActions,
    statusBarActions
  };
}
