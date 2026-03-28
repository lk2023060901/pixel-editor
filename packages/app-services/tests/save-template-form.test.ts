import { describe, expect, it } from "vitest";

import {
  createDefaultTemplatePath,
  createSaveTemplateDraft,
  defaultTemplateAssetName,
  resolveDefaultTemplateName,
  resolveSaveTemplateNameChange,
  slugifyTemplateAssetName
} from "../src/ui-shell";

describe("save template form helpers", () => {
  it("derives default template names and paths through exported APIs", () => {
    expect(defaultTemplateAssetName).toBe("template");
    expect(resolveDefaultTemplateName("  Hero Spawn  ")).toBe("Hero Spawn");
    expect(resolveDefaultTemplateName("   ")).toBe("template");
    expect(slugifyTemplateAssetName(" Hero Spawn ")).toBe("hero-spawn");
    expect(createDefaultTemplatePath("Hero Spawn")).toBe("templates/hero-spawn.tx");
    expect(createSaveTemplateDraft(" Hero Spawn ")).toEqual({
      templateName: "Hero Spawn",
      templatePath: "templates/hero-spawn.tx"
    });
  });

  it("only auto-updates the path when the user is still on the default path", () => {
    expect(
      resolveSaveTemplateNameChange({
        currentTemplateName: "Hero Spawn",
        currentTemplatePath: "templates/hero-spawn.tx",
        nextTemplateName: "Forest Boss"
      })
    ).toEqual({
      templateName: "Forest Boss",
      templatePath: "templates/forest-boss.tx"
    });
    expect(
      resolveSaveTemplateNameChange({
        currentTemplateName: "Hero Spawn",
        currentTemplatePath: "custom/spawn.tx",
        nextTemplateName: "Forest Boss"
      })
    ).toEqual({
      templateName: "Forest Boss",
      templatePath: "custom/spawn.tx"
    });
  });
});
