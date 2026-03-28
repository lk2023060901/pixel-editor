"use client";

import {
  deriveEditorStatusBarViewState,
  deriveIssuesPanelViewState,
  deriveLayersPanelViewState,
  deriveMapImageExportViewState,
  deriveMiniMapPanelViewState,
  deriveObjectsPanelViewState,
  deriveProjectDockViewState,
  derivePropertiesInspectorViewState,
  deriveRendererCanvasViewState,
  deriveTerrainSetsPanelViewState,
  deriveTileAnimationEditorViewState,
  deriveTileCollisionEditorViewState,
  deriveTilesetsPanelViewState
} from "@pixel-editor/app-services/ui";
import {
  deriveEditorShellDialogsViewState,
  deriveEditorShellViewState,
  type EditorShellSnapshotStore
} from "@pixel-editor/app-services/ui-shell";
import { useSyncExternalStore } from "react";

export function useEditorShellViewState(input: {
  snapshotStore: EditorShellSnapshotStore;
}) {
  const snapshot = useSyncExternalStore(
    input.snapshotStore.subscribe.bind(input.snapshotStore),
    input.snapshotStore.getSnapshot.bind(input.snapshotStore),
    input.snapshotStore.getSnapshot.bind(input.snapshotStore)
  );

  const shellViewState = deriveEditorShellViewState(snapshot);

  return {
    snapshot,
    hasActiveObject: shellViewState.activeObject !== undefined,
    view: {
      shellViewState,
      statusBarViewState: deriveEditorStatusBarViewState(snapshot),
      issuesPanelViewState: deriveIssuesPanelViewState(snapshot),
      layersPanelViewState: deriveLayersPanelViewState(snapshot),
      mapImageExportViewState: deriveMapImageExportViewState(snapshot),
      miniMapPanelViewState: deriveMiniMapPanelViewState(snapshot),
      objectsPanelViewState: deriveObjectsPanelViewState(snapshot),
      projectDockViewState: deriveProjectDockViewState(snapshot),
      propertiesInspectorViewState: derivePropertiesInspectorViewState(snapshot),
      rendererCanvasViewState: deriveRendererCanvasViewState(snapshot),
      shellDialogsViewState: deriveEditorShellDialogsViewState(snapshot),
      terrainSetsPanelViewState: deriveTerrainSetsPanelViewState(snapshot),
      tilesetsPanelViewState: deriveTilesetsPanelViewState(snapshot),
      tileAnimationEditorViewState: deriveTileAnimationEditorViewState(snapshot),
      tileCollisionEditorViewState: deriveTileCollisionEditorViewState(snapshot)
    }
  };
}
