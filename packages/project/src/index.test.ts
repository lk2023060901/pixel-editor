import { describe, expect, it } from "vitest";

import { createProject } from "@pixel-editor/domain";
import { createEditorWorkspaceState } from "@pixel-editor/editor-state";

import { replaceProjectCommand } from "./index";

describe("replaceProjectCommand", () => {
  it("replaces project metadata and marks the workspace dirty", () => {
    const before = createEditorWorkspaceState({
      project: createProject({
        name: "Before",
        assetRoots: ["maps"]
      })
    });
    const nextProject = createProject({
      name: "After",
      assetRoots: ["maps", "tilesets"],
      compatibilityVersion: "1.12",
      extensionsDirectory: "extensions",
      automappingRulesFile: "rules.txt"
    });

    const after = replaceProjectCommand(nextProject).run(before);

    expect(after.project).toEqual(nextProject);
    expect(after.session.hasUnsavedChanges).toBe(true);
  });
});
