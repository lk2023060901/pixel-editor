import type { TranslationFn } from "@pixel-editor/i18n";
import { describe, expect, it, vi } from "vitest";

import {
  createProjectDockAssetActivationPlan,
  deriveProjectDockRowsPresentation,
  getProjectDockAssetKindLabel,
  projectDockIconKeys,
  resolveProjectDockKindIconKey,
  type ProjectDockViewState
} from "../src/ui";

const t = ((key: string) => key) as TranslationFn;

function createViewState(
  overrides: Partial<ProjectDockViewState> = {}
): ProjectDockViewState {
  return {
    tree: [],
    activeDocumentIds: [],
    ...overrides
  };
}

describe("project dock presentation helpers", () => {
  it("derives flattened rows through exported APIs", () => {
    const viewState = createViewState({
      tree: [
        {
          id: "folder:maps",
          kind: "folder",
          name: "maps",
          path: "maps",
          children: [
            {
              id: "asset:map",
              kind: "asset",
              asset: {
                id: "asset:map",
                name: "Overworld",
                kind: "map",
                path: "maps/overworld.tmx",
                documentId: "doc-map"
              }
            },
            {
              id: "asset:file",
              kind: "asset",
              asset: {
                id: "asset:file",
                name: "Readme",
                kind: "file",
                path: "maps/readme.txt"
              }
            }
          ]
        }
      ],
      activeDocumentIds: ["doc-map"]
    });

    expect(deriveProjectDockRowsPresentation({ viewState, t })).toEqual([
      {
        kind: "folder",
        id: "folder:maps",
        depth: 0,
        paddingLeft: 8,
        iconKey: projectDockIconKeys.folder,
        tone: "folder",
        title: "maps",
        name: "maps",
        kindLabel: "project.assetKind.folder"
      },
      {
        kind: "asset",
        id: "asset:map",
        depth: 1,
        paddingLeft: 36,
        iconKey: projectDockIconKeys.map,
        tone: "active",
        interaction: "activate",
        title: "maps/overworld.tmx",
        name: "Overworld",
        kindLabel: "documentKind.map",
        asset: {
          id: "asset:map",
          name: "Overworld",
          kind: "map",
          path: "maps/overworld.tmx",
          documentId: "doc-map"
        }
      },
      {
        kind: "asset",
        id: "asset:file",
        depth: 1,
        paddingLeft: 36,
        iconKey: projectDockIconKeys.file,
        tone: "muted",
        interaction: "static",
        title: "maps/readme.txt",
        name: "Readme",
        kindLabel: "project.assetKind.file",
        asset: {
          id: "asset:file",
          name: "Readme",
          kind: "file",
          path: "maps/readme.txt"
        }
      }
    ]);
  });

  it("resolves kind labels and activation plans through exported APIs", () => {
    expect(getProjectDockAssetKindLabel("folder", t)).toBe("project.assetKind.folder");
    expect(getProjectDockAssetKindLabel("world", t)).toBe("documentKind.world");
    expect(resolveProjectDockKindIconKey("folder")).toBe(projectDockIconKeys.folder);
    expect(resolveProjectDockKindIconKey("template")).toBe(projectDockIconKeys.template);
    expect(resolveProjectDockKindIconKey("file")).toBe(projectDockIconKeys.file);

    const store = {
      activateAsset: vi.fn()
    };
    const interactiveRow = {
      kind: "asset" as const,
      id: "asset:template",
      depth: 0,
      paddingLeft: 22,
      iconKey: projectDockIconKeys.template,
      tone: "interactive" as const,
      interaction: "activate" as const,
      title: "templates/base.tx",
      name: "Base",
      kindLabel: "documentKind.template",
      asset: {
        id: "asset:template",
        name: "Base",
        kind: "template" as const,
        path: "templates/base.tx",
        documentId: "doc-template"
      }
    };
    const interactivePlan = createProjectDockAssetActivationPlan(interactiveRow);

    expect(interactivePlan.kind).toBe("transition");
    if (interactivePlan.kind === "transition") {
      interactivePlan.run(store);
    }
    expect(store.activateAsset).toHaveBeenCalledWith(interactiveRow.asset);

    expect(
      createProjectDockAssetActivationPlan({
        kind: "asset",
        id: "asset:image",
        depth: 0,
        paddingLeft: 22,
        iconKey: projectDockIconKeys.image,
        tone: "muted",
        interaction: "static",
        title: "images/preview.png",
        name: "Preview",
        kindLabel: "project.assetKind.image",
        asset: {
          id: "asset:image",
          name: "Preview",
          kind: "image",
          path: "images/preview.png"
        }
      })
    ).toEqual({ kind: "noop" });
  });
});
