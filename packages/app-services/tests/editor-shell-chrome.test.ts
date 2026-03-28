import { describe, expect, it } from "vitest";

import { createMap, createProject } from "@pixel-editor/domain";
import { createEditorWorkspaceState } from "@pixel-editor/editor-state";
import type { TranslationFn } from "@pixel-editor/i18n";

import { createEditorStore } from "../src";
import {
  defaultEditorShellLowerRightDockTabId,
  defaultEditorShellUpperRightDockTabId,
  deriveEditorShellChromePresentation,
  resolveEditorShellDockPanel
} from "../src/ui-shell";

describe("editor shell chrome presentation", () => {
  const t = ((key: string) => key) as TranslationFn;

  it("derives shell chrome config and dock tabs through a single exported builder", () => {
    const map = createMap({
      name: "starter-map",
      orientation: "orthogonal",
      width: 8,
      height: 8,
      tileWidth: 32,
      tileHeight: 32
    });
    const store = createEditorStore(
      createEditorWorkspaceState({
        project: createProject({
          name: "demo",
          assetRoots: ["maps"]
        }),
        maps: [map],
        session: {
          activeMapId: map.id,
          activeTool: "shape-fill",
          shapeFillMode: "ellipse"
        }
      })
    );

    const presentation = deriveEditorShellChromePresentation({
      snapshot: store.getSnapshot(),
      customTypesEditorOpen: true,
      t
    });

    expect(presentation.shellChromeViewState).toMatchObject({
      activeTool: "shape-fill",
      shapeFillMode: "ellipse"
    });
    expect(presentation.chrome.upperRightDockTabs).toEqual([
      { id: "layers", label: "shell.dock.layers", panelId: "layers-panel" },
      { id: "objects", label: "shell.dock.objects", panelId: "objects-panel" },
      { id: "mini-map", label: "shell.dock.miniMap", panelId: "mini-map-panel" }
    ]);
    expect(presentation.chrome.lowerRightDockTabs).toEqual([
      { id: "tilesets", label: "shell.dock.tilesets", panelId: "tilesets-panel" },
      {
        id: "terrain-sets",
        label: "shell.dock.terrainSets",
        panelId: "terrain-sets-panel"
      }
    ]);
    expect(
      resolveEditorShellDockPanel(presentation.chrome.upperRightDockTabs, "mini-map")
    ).toBe("mini-map-panel");
    expect(
      resolveEditorShellDockPanel(presentation.chrome.lowerRightDockTabs, "tilesets")
    ).toBe("tilesets-panel");
    expect(presentation.chrome.newAction).toEqual(presentation.chrome.mainToolbarActions[0]);
    expect(presentation.chrome.remainingMainActions).toEqual(
      presentation.chrome.mainToolbarActions.slice(1)
    );
    expect(presentation.chrome.toolOptionItems.length).toBeGreaterThan(0);
    expect(presentation.chrome.toolToolbarItems.length).toBeGreaterThan(0);
    expect(presentation.chrome.newMenuItems.length).toBeGreaterThan(0);
    expect(presentation.chrome.menuSpecs.length).toBeGreaterThan(0);
  });

  it("exports default dock tab ids for UI state initialization", () => {
    expect(defaultEditorShellUpperRightDockTabId).toBe("layers");
    expect(defaultEditorShellLowerRightDockTabId).toBe("tilesets");
  });
});
