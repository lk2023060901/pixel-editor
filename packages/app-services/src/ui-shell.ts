export {
  defaultEditorShellLowerRightDockTabId,
  defaultEditorShellUpperRightDockTabId,
  deriveEditorShellChromePresentation,
  editorShellLowerRightDockPanelIds,
  editorShellLowerRightDockTabIds,
  editorShellUpperRightDockPanelIds,
  editorShellUpperRightDockTabIds,
  getEditorShellLowerRightDockTabs,
  getEditorShellUpperRightDockTabs,
  resolveEditorShellDockPanel,
  type EditorShellChromeConfig,
  type EditorShellChromePresentation,
  type EditorShellDockTab,
  type EditorShellLowerRightDockPanelId,
  type EditorShellLowerRightDockTabId,
  type EditorShellUpperRightDockPanelId,
  type EditorShellUpperRightDockTabId
} from "./editor-shell-chrome";
export {
  deriveEditorShellOverlaysPresentation,
  type EditorShellOverlaysPresentation,
  type EditorShellOverlaysState
} from "./editor-shell-overlays";
export {
  resolveEditorShellNewMenuOpen,
  resolveEditorShellOpenMenuId,
  resolveEditorShellSaveTemplateDialogOpen,
  type EditorShellMenuTransition,
  type EditorShellNewMenuTransition
} from "./editor-shell-local-state";
export {
  deriveEditorShellDialogsViewState,
  deriveEditorShellChromeViewState,
  deriveEditorShellViewState,
  isEditorShellMainToolbarActionDisabled,
  isEditorShellToolActionDisabled,
  isEditorShellToolOptionActive,
  resolveProjectDockActivation,
  type EditorShellChromeViewState,
  type EditorShellDialogsViewState,
  type EditorShellViewState,
  type ProjectDockActivationTarget
} from "./ui-models";
export {
  createEditorShellActionPlan,
  createEditorShellSurfaceActionPlan,
  createProjectDockActivationPlan,
  type EditorShellActionPlan,
  type EditorShellLocalAction,
  type EditorShellSurfaceAction,
  type EditorShellSurfaceActionPlan,
  type EditorShellSurfaceStore,
  type ProjectDockActivationPlan,
  type ProjectDockActivationStore
} from "./editor-shell-actions";
export {
  getTiledMainMenus,
  getTiledMainToolbarActions,
  getTiledNewMenuItems,
  getTiledToolOptionItems,
  getTiledToolToolbarItems,
  toolbarIconUrls,
  type TiledMenuSpec,
  type TiledMenuItemSpec2,
  type ToolbarActionSpec,
  type ToolbarItemSpec,
  type ToolbarMenuItemSpec
} from "./toolbar-spec";
export type {
  EditorShellActionStore,
  EditorShellCanvasInteractionStore,
  EditorShellDocumentNavigationStore,
  EditorShellFileActionsStore,
  EditorShellIssuesStore,
  MiniMapPanelStore,
  EditorShellSnapshotStore,
  EditorShellStatusBarStore,
  EditorShellStore,
  EditorShellTemplateActionsStore
} from "./ui-store";
