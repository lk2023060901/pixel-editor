import type { EditorProject, PropertyTypeDefinition } from "@pixel-editor/domain";

import type {
  EditorShellDialogsViewState,
  EditorShellViewState,
  EditorStatusBarViewState,
  IssuesPanelViewState,
  TileAnimationEditorViewState,
  TileCollisionEditorViewState
} from "./ui-models";

export interface EditorShellOverlaysState {
  statusInfo: string;
  tileAnimationEditorOpen: boolean;
  tileCollisionEditorOpen: boolean;
  customTypesEditorOpen: boolean;
  projectPropertiesOpen: boolean;
  saveTemplateDialogOpen: boolean;
}

export interface EditorShellOverlaysPresentation {
  statusBar: {
    statusInfo: string;
    viewState: EditorStatusBarViewState;
  };
  issuesPanel?: {
    viewState: IssuesPanelViewState;
  };
  tileAnimationEditor?: {
    viewState: TileAnimationEditorViewState;
  };
  customTypesEditor?: {
    propertyTypes: readonly PropertyTypeDefinition[];
  };
  projectProperties?: {
    project: EditorProject;
  };
  tileCollisionEditor?: {
    viewState: TileCollisionEditorViewState;
  };
  saveTemplateDialog?: {
    objectName: string;
  };
}

export function deriveEditorShellOverlaysPresentation(input: {
  shellViewState: EditorShellViewState;
  shellDialogsViewState: EditorShellDialogsViewState;
  issuesPanelViewState: IssuesPanelViewState;
  statusBarViewState: EditorStatusBarViewState;
  tileAnimationEditorViewState: TileAnimationEditorViewState | undefined;
  tileCollisionEditorViewState: TileCollisionEditorViewState | undefined;
  overlaysState: EditorShellOverlaysState;
}): EditorShellOverlaysPresentation {
  return {
    statusBar: {
      statusInfo: input.overlaysState.statusInfo,
      viewState: input.statusBarViewState
    },
    ...(input.shellDialogsViewState.issuesPanelOpen
      ? {
          issuesPanel: {
            viewState: input.issuesPanelViewState
          }
        }
      : {}),
    ...(input.overlaysState.tileAnimationEditorOpen &&
    input.tileAnimationEditorViewState !== undefined
      ? {
          tileAnimationEditor: {
            viewState: input.tileAnimationEditorViewState
          }
        }
      : {}),
    ...(input.overlaysState.customTypesEditorOpen
      ? {
          customTypesEditor: {
            propertyTypes: input.shellDialogsViewState.projectPropertyTypes
          }
        }
      : {}),
    ...(input.overlaysState.projectPropertiesOpen
      ? {
          projectProperties: {
            project: input.shellDialogsViewState.project
          }
        }
      : {}),
    ...(input.overlaysState.tileCollisionEditorOpen &&
    input.tileCollisionEditorViewState !== undefined
      ? {
          tileCollisionEditor: {
            viewState: input.tileCollisionEditorViewState
          }
        }
      : {}),
    ...(input.overlaysState.saveTemplateDialogOpen &&
    input.shellViewState.activeObject !== undefined
      ? {
          saveTemplateDialog: {
            objectName: input.shellViewState.activeObject.name
          }
        }
      : {})
  };
}
