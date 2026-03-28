"use client";

import type {
  EditorShellOverlaysPresentation,
  EditorShellStore
} from "@pixel-editor/app-services/ui-shell";

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
  presentation: EditorShellOverlaysPresentation;
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
      {props.presentation.issuesPanel ? (
        <IssuesPanel
          viewState={props.presentation.issuesPanel.viewState}
          onClear={props.onClearIssues}
          onClose={props.onCloseIssues}
        />
      ) : null}

      <EditorStatusBar
        statusInfo={props.presentation.statusBar.statusInfo}
        viewState={props.presentation.statusBar.viewState}
        onLayerChange={props.onLayerChange}
        onZoomChange={props.onZoomChange}
        {...(props.onToggleIssues === undefined
          ? {}
          : { onToggleIssues: props.onToggleIssues })}
      />

      {props.presentation.tileAnimationEditor ? (
        <TileAnimationEditorDialog
          store={props.store}
          viewState={props.presentation.tileAnimationEditor.viewState}
          onClose={props.onCloseTileAnimationEditor}
        />
      ) : null}
      {props.presentation.customTypesEditor ? (
        <ProjectPropertyTypesEditorDialog
          propertyTypes={props.presentation.customTypesEditor.propertyTypes}
          store={props.store}
          onClose={props.onCloseCustomTypesEditor}
        />
      ) : null}
      {props.presentation.projectProperties ? (
        <ProjectPropertiesDialog
          project={props.presentation.projectProperties.project}
          store={props.store}
          onClose={props.onCloseProjectProperties}
        />
      ) : null}
      {props.presentation.tileCollisionEditor ? (
        <TileCollisionEditorDialog
          renderBridge={props.renderBridge}
          store={props.store}
          viewState={props.presentation.tileCollisionEditor.viewState}
          onClose={props.onCloseTileCollisionEditor}
        />
      ) : null}
      {props.presentation.saveTemplateDialog ? (
        <SaveTemplateDialog
          objectName={props.presentation.saveTemplateDialog.objectName}
          store={props.store}
          onClose={props.onCloseSaveTemplateDialog}
        />
      ) : null}
    </>
  );
}
