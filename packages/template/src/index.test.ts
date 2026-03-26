import { describe, expect, it } from "vitest";

import { createMapObject, createObjectTemplate, createProject } from "@pixel-editor/domain";
import { createEditorWorkspaceState } from "@pixel-editor/editor-state";

import {
  addImportedTemplateCommand,
  buildObjectTemplateDocument,
  setActiveTemplateCommand
} from "./index";

describe("template commands", () => {
  it("builds a template document from an object without preserving template instance linkage", () => {
    const existingTemplate = createObjectTemplate(
      "Existing Template",
      createMapObject({
        name: "Existing",
        shape: "rectangle"
      })
    );
    const template = buildObjectTemplateDocument({
      name: "Spawn Template",
      object: createMapObject({
        name: "Spawn",
        shape: "rectangle",
        templateId: existingTemplate.id
      })
    });

    expect(template.name).toBe("Spawn Template");
    expect(template.object.name).toBe("Spawn");
    expect(template.object.templateId).toBeUndefined();
  });

  it("adds imported templates and activates them in workspace session state", () => {
    const before = createEditorWorkspaceState({
      project: createProject({
        name: "demo",
        assetRoots: ["maps", "tilesets", "templates"],
        compatibilityVersion: "1.12"
      })
    });
    const template = createObjectTemplate(
      "Spawn Template",
      createMapObject({
        name: "Spawn",
        shape: "rectangle"
      })
    );

    const afterImport = addImportedTemplateCommand(template).run(before);
    const afterActivate = setActiveTemplateCommand(template.id).run(afterImport);

    expect(afterImport.templates).toEqual([template]);
    expect(afterImport.session.activeTemplateId).toBe(template.id);
    expect(afterImport.session.hasUnsavedChanges).toBe(true);
    expect(afterActivate.session.activeTemplateId).toBe(template.id);
  });
});
