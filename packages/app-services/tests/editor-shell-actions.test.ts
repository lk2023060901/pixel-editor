import { describe, expect, it, vi } from "vitest";

import { createMap, createProject, createTileset } from "@pixel-editor/domain";
import { createEditorWorkspaceState } from "@pixel-editor/editor-state";

import {
  createEditorStore
} from "../src";
import {
  createEditorShellActionPlan,
  createEditorShellSurfaceActionPlan,
  createProjectDockActivationPlan,
  type EditorShellActionStore
} from "../src/ui-shell";
import type { EditorShellSurfaceStore, ProjectDockActivationStore } from "../src/ui-shell";

describe("editor shell actions", () => {
  it("creates a transition plan for store-backed layer actions", () => {
    const plan = createEditorShellActionPlan({
      actionId: "show-hide-layers",
      activeLayerId: "layer-1" as never,
      canUseWorldTool: true
    });

    expect(plan.kind).toBe("transition");

    if (plan.kind !== "transition") {
      return;
    }

    const store: Pick<EditorShellActionStore, "toggleLayerVisibility"> = {
      toggleLayerVisibility: vi.fn()
    };

    plan.run(store as EditorShellActionStore);

    expect(store.toggleLayerVisibility).toHaveBeenCalledWith("layer-1");
  });

  it("creates a local plan for UI-managed editor shell actions", () => {
    const plan = createEditorShellActionPlan({
      actionId: "edit-collision",
      canUseWorldTool: true
    });

    expect(plan).toEqual({
      kind: "local",
      action: "open-tile-collision-editor"
    });
  });

  it("creates surface plans for UI-only shell actions through a narrow store API", () => {
    const plan = createEditorShellSurfaceActionPlan("focus-terrain-sets");

    expect(plan.kind).toBe("transition");

    if (plan.kind !== "transition") {
      return;
    }

    const surfaceStore: EditorShellSurfaceStore = {
      toggleCustomTypesEditor: vi.fn(),
      closeCustomTypesEditor: vi.fn(),
      toggleProjectProperties: vi.fn(),
      closeProjectProperties: vi.fn(),
      openSaveTemplateDialog: vi.fn(),
      closeSaveTemplateDialog: vi.fn(),
      openTileAnimationEditor: vi.fn(),
      closeTileAnimationEditor: vi.fn(),
      openTileCollisionEditor: vi.fn(),
      closeTileCollisionEditor: vi.fn(),
      focusTerrainSetsPanel: vi.fn()
    };

    plan.run(surfaceStore);

    expect(surfaceStore.focusTerrainSetsPanel).toHaveBeenCalledOnce();
  });

  it("returns noop when world tool is unavailable", () => {
    const plan = createEditorShellActionPlan({
      actionId: "world-tool",
      editorToolId: "world-tool",
      canUseWorldTool: false
    });

    expect(plan).toEqual({
      kind: "noop"
    });
  });

  it("creates a project dock activation plan for tilesets through a narrow store API", () => {
    const map = createMap({
      name: "starter-map",
      orientation: "orthogonal",
      width: 4,
      height: 4,
      tileWidth: 32,
      tileHeight: 32
    });
    const tileset = createTileset({
      name: "terrain",
      kind: "image",
      tileWidth: 32,
      tileHeight: 32,
      source: {
        imagePath: "tiles/terrain.png",
        imageWidth: 256,
        imageHeight: 256,
        margin: 0,
        spacing: 0
      }
    });
    const store = createEditorStore(
      createEditorWorkspaceState({
        project: createProject({
          name: "demo",
          assetRoots: ["maps", "tilesets"]
        }),
        maps: [map],
        tilesets: [tileset]
      })
    );
    const plan = createProjectDockActivationPlan({
      snapshot: store.getSnapshot(),
      asset: {
        id: `asset:${tileset.id}`,
        name: tileset.name,
        kind: "tileset",
        path: "tilesets/terrain.tsj",
        documentId: tileset.id
      }
    });

    expect(plan.kind).toBe("transition");

    if (plan.kind !== "transition") {
      return;
    }

    const calls: string[] = [];
    const activationStore: ProjectDockActivationStore = {
      focusTilesetsPanel: vi.fn(() => {
        calls.push("focus");
      }),
      setActiveMap: vi.fn(),
      setActiveTemplate: vi.fn(),
      setActiveTileset: vi.fn(() => {
        calls.push("tileset");
      })
    };

    plan.run(activationStore);

    expect(calls).toEqual(["focus", "tileset"]);
    expect(activationStore.setActiveTileset).toHaveBeenCalledWith(tileset.id);
  });

  it("returns noop project dock activation plan when the asset has no document target", () => {
    const store = createEditorStore(
      createEditorWorkspaceState({
        project: createProject({
          name: "demo",
          assetRoots: ["images"]
        })
      })
    );
    const plan = createProjectDockActivationPlan({
      snapshot: store.getSnapshot(),
      asset: {
        id: "asset:image",
        name: "terrain.png",
        kind: "image",
        path: "images/terrain.png"
      }
    });

    expect(plan).toEqual({
      kind: "noop"
    });
  });
});
