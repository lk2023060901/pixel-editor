import { describe, expect, it } from "vitest";

import { createProject } from "@pixel-editor/domain";

import {
  buildProjectPropertiesUpdatePatch,
  createProjectPropertiesDraft,
  projectCompatibilityVersionOptions
} from "../src/ui-shell";

describe("project properties form helpers", () => {
  it("creates project drafts and exports compatibility options through ui-shell APIs", () => {
    const project = createProject({
      name: "demo",
      assetRoots: ["maps"],
      compatibilityVersion: "1.11",
      extensionsDirectory: "custom-ext",
      automappingRulesFile: "rules.txt",
      exportOptions: {
        embedTilesets: true,
        detachTemplateInstances: true,
        resolveObjectTypesAndProperties: true,
        exportMinimized: true
      }
    });

    expect(projectCompatibilityVersionOptions.map((option) => option.value)).toEqual([
      "1.8",
      "1.9",
      "1.10",
      "1.11",
      "1.12",
      "latest"
    ]);
    expect(createProjectPropertiesDraft(project)).toEqual({
      compatibilityVersion: "1.11",
      extensionsDirectory: "custom-ext",
      automappingRulesFile: "rules.txt",
      embedTilesets: true,
      detachTemplateInstances: true,
      resolveObjectTypesAndProperties: true,
      exportMinimized: true
    });
  });

  it("builds normalized project update patches", () => {
    expect(
      buildProjectPropertiesUpdatePatch({
        compatibilityVersion: "latest",
        extensionsDirectory: "  ",
        automappingRulesFile: "  ",
        embedTilesets: true,
        detachTemplateInstances: false,
        resolveObjectTypesAndProperties: true,
        exportMinimized: false
      })
    ).toEqual({
      compatibilityVersion: "latest",
      extensionsDirectory: "extensions",
      automappingRulesFile: null,
      exportOptions: {
        embedTilesets: true,
        detachTemplateInstances: false,
        resolveObjectTypesAndProperties: true,
        exportMinimized: false
      }
    });
  });
});
