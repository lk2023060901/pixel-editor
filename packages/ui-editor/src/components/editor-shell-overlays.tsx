"use client";

import type {
  EditorStatusBarViewState,
  IssuesPanelViewState,
  TileAnimationEditorViewState,
  TileCollisionEditorViewState
} from "@pixel-editor/app-services/ui";
import type { EditorShellStore, EditorShellDialogsViewState, EditorShellViewState } from "@pixel-editor/app-services/ui-shell";

import type { EditorRenderBridge } from "../render-bridge";

import { EditorStatusBar, type EditorStatusBarProps } from "./editor-status-bar";
import { IssuesPanel, type IssuesPanelProps } from "./issues-panel";
import { ProjectPropertiesDialog } from "./project-properties-dialog";
import { ProjectPropertyTypesEditorDialog } from "./project-property-types-editor-dialog";
import { SaveTemplateDialog } from "./save-template-dialog";
import { TileAnimationEditorDialog } from "./tile-animation-editor-dialog";
import { TileCollisionEditorDialog } from "./tile-collision-editor-dialog";

export interface EditorShellOverlaysProps {
  store: EditorShellStore;
  renderBridge: EditorRenderBridge;
  statusInfo: string;
  shellViewState: EditorShellViewState;
  shellDialogsViewState: EditorShellDialogsViewState;
  issuesPanelViewState: IssuesPanelViewState;
  statusBarViewState: EditorStatusBarViewState;
  tileAnimationEditorViewState: TileAnimationEditorViewState | undefined;
  tileCollisionEditorViewState: TileCollisionEditorViewState | undefined;
  tileAnimationEditorOpen: boolean;
  tileCollisionEditorOpen: boolean;
  customTypesEditorOpen: boolean;
  projectPropertiesOpen: boolean;
  saveTemplateDialogOpen: boolean;
  onClearIssues: IssuesPanelProps["onClear"];
  onCloseIssues: IssuesPanelProps["onClose"];
  onToggleIssues: EditorStatusBarProps["onToggleIssues"];
  onLayerChange: EditorStatusBarProps["onLayerChange"];
  onZoomChange: EditorStatusBarProps["onZoomChange"];
  onCloseTileAnimationEditor: () => void;
  onCloseCustomTypesEditor: () => void;
  onCloseProjectProperties: () => void;
  onCloseTileCollisionEditor: () => void;
  onCloseSaveTemplateDialog: () => void;
}

export function EditorShellOverlays(props: EditorShellOverlaysProps) {
  return (
    <>
      {props.shellDialogsViewState.issuesPanelOpen ? (
        <IssuesPanel
          viewState={props.issuesPanelViewState}
          onClear={props.onClearIssues}
          onClose={props.onCloseIssues}
        />
      ) : null}

      <EditorStatusBar
        statusInfo={props.statusInfo}
        viewState={props.statusBarViewState}
        onLayerChange={props.onLayerChange}
        onZoomChange={props.onZoomChange}
        {...(props.onToggleIssues === undefined
          ? {}
          : { onToggleIssues: props.onToggleIssues })}
      />

      {props.tileAnimationEditorOpen && props.tileAnimationEditorViewState ? (
        <TileAnimationEditorDialog
          store={props.store}
          viewState={props.tileAnimationEditorViewState}
          onClose={props.onCloseTileAnimationEditor}
        />
      ) : null}
      {props.customTypesEditorOpen ? (
        <ProjectPropertyTypesEditorDialog
          propertyTypes={props.shellDialogsViewState.projectPropertyTypes}
          store={props.store}
          onClose={props.onCloseCustomTypesEditor}
        />
      ) : null}
      {props.projectPropertiesOpen ? (
        <ProjectPropertiesDialog
          project={props.shellDialogsViewState.project}
          store={props.store}
          onClose={props.onCloseProjectProperties}
        />
      ) : null}
      {props.tileCollisionEditorOpen && props.tileCollisionEditorViewState ? (
        <TileCollisionEditorDialog
          renderBridge={props.renderBridge}
          store={props.store}
          viewState={props.tileCollisionEditorViewState}
          onClose={props.onCloseTileCollisionEditor}
        />
      ) : null}
      {props.saveTemplateDialogOpen && props.shellViewState.activeObject ? (
        <SaveTemplateDialog
          objectName={props.shellViewState.activeObject.name}
          store={props.store}
          onClose={props.onCloseSaveTemplateDialog}
        />
      ) : null}
    </>
  );
}
