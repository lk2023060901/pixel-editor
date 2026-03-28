import { describe, expect, it } from "vitest";

import { createMapObject, createProject } from "@pixel-editor/domain";

import {
  deriveEditorShellOverlaysPresentation,
  type EditorShellDialogsViewState,
  type EditorShellOverlaysState,
  type EditorShellViewState
} from "../src/ui-shell";
import type {
  EditorStatusBarViewState,
  IssuesPanelViewState,
  TileAnimationEditorViewState,
  TileCollisionEditorViewState
} from "../src/ui";

describe("editor shell overlays presentation", () => {
  it("derives shell overlay visibility and payloads through a single exported builder", () => {
    const project = createProject({
      name: "demo",
      assetRoots: ["maps"]
    });
    const activeObject = createMapObject({
      name: "Crate",
      shape: "rectangle",
      width: 32,
      height: 32
    });
    const shellViewState: EditorShellViewState = {
      activeObject,
      activeLayerIndex: 0,
      activeProjectDocumentIds: [],
      canMoveWorldMaps: false
    };
    const shellDialogsViewState: EditorShellDialogsViewState = {
      issuesPanelOpen: true,
      project,
      projectPropertyTypes: project.propertyTypes
    };
    const issuesPanelViewState: IssuesPanelViewState = {
      issues: [
        {
          id: "issue:1",
          sourceKind: "map",
          documentName: "starter-map",
          severity: "error",
          code: "MAP_001",
          message: "Broken tile reference",
          path: "/layers/0/data/0"
        }
      ]
    };
    const statusBarViewState: EditorStatusBarViewState = {
      errorCount: 1,
      warningCount: 2,
      layerOptions: [],
      zoom: 1
    };
    const tileAnimationEditorViewState: TileAnimationEditorViewState = {
      tilesetId: "tileset:terrain",
      tilesetKind: "image",
      tileWidth: 32,
      tileHeight: 32,
      selectedLocalId: 0,
      frames: [],
      sourceTiles: []
    };
    const tileCollisionEditorViewState: TileCollisionEditorViewState = {
      selectedLocalId: 4,
      collisionObjects: [],
      propertyTypes: []
    };
    const overlaysState: EditorShellOverlaysState = {
      statusInfo: "Painting layer 1",
      tileAnimationEditorOpen: true,
      tileCollisionEditorOpen: true,
      customTypesEditorOpen: true,
      projectPropertiesOpen: true,
      saveTemplateDialogOpen: true
    };

    const presentation = deriveEditorShellOverlaysPresentation({
      shellViewState,
      shellDialogsViewState,
      issuesPanelViewState,
      statusBarViewState,
      tileAnimationEditorViewState,
      tileCollisionEditorViewState,
      overlaysState
    });

    expect(presentation.statusBar).toEqual({
      statusInfo: "Painting layer 1",
      viewState: statusBarViewState
    });
    expect(presentation.issuesPanel).toEqual({
      viewState: issuesPanelViewState
    });
    expect(presentation.tileAnimationEditor).toEqual({
      viewState: tileAnimationEditorViewState
    });
    expect(presentation.customTypesEditor).toEqual({
      propertyTypes: project.propertyTypes
    });
    expect(presentation.projectProperties).toEqual({
      project
    });
    expect(presentation.tileCollisionEditor).toEqual({
      viewState: tileCollisionEditorViewState
    });
    expect(presentation.saveTemplateDialog).toEqual({
      objectName: "Crate"
    });
  });

  it("omits optional overlays when required UI state or payload is missing", () => {
    const presentation = deriveEditorShellOverlaysPresentation({
      shellViewState: {
        activeLayerIndex: 0,
        activeProjectDocumentIds: [],
        canMoveWorldMaps: false
      },
      shellDialogsViewState: {
        issuesPanelOpen: false,
        project: createProject({
          name: "demo",
          assetRoots: ["maps"]
        }),
        projectPropertyTypes: []
      },
      issuesPanelViewState: {
        issues: []
      },
      statusBarViewState: {
        errorCount: 0,
        warningCount: 0,
        layerOptions: [],
        zoom: 2
      },
      tileAnimationEditorViewState: undefined,
      tileCollisionEditorViewState: undefined,
      overlaysState: {
        statusInfo: "",
        tileAnimationEditorOpen: true,
        tileCollisionEditorOpen: true,
        customTypesEditorOpen: false,
        projectPropertiesOpen: false,
        saveTemplateDialogOpen: true
      }
    });

    expect(presentation.issuesPanel).toBeUndefined();
    expect(presentation.tileAnimationEditor).toBeUndefined();
    expect(presentation.customTypesEditor).toBeUndefined();
    expect(presentation.projectProperties).toBeUndefined();
    expect(presentation.tileCollisionEditor).toBeUndefined();
    expect(presentation.saveTemplateDialog).toBeUndefined();
  });
});
