import { describe, expect, it } from "vitest";

import { deriveObjectsPanelActionAvailability } from "../src/ui";

describe("objects panel presentation helpers", () => {
  it("derives action availability through exported APIs", () => {
    expect(
      deriveObjectsPanelActionAvailability({
        activeTemplateName: "Enemy",
        hasActiveLayer: true,
        hasObjectClipboard: true,
        hasObjectSelection: true,
        hasTemplateInstanceSelection: true,
        saveAsTemplateEnabled: true,
        replaceWithTemplateEnabled: true,
        resetTemplateInstancesEnabled: true,
        detachTemplateInstancesEnabled: true
      })
    ).toEqual({
      canCreateRectangle: true,
      canRemoveSelected: true,
      canCopy: true,
      canCut: true,
      canPaste: true,
      canSaveAsTemplate: true,
      canReplaceWithTemplate: true,
      canResetTemplateInstances: true,
      canDetachTemplateInstances: true
    });
    expect(
      deriveObjectsPanelActionAvailability({
        activeTemplateName: undefined,
        hasActiveLayer: false,
        hasObjectClipboard: true,
        hasObjectSelection: true,
        hasTemplateInstanceSelection: true,
        saveAsTemplateEnabled: true,
        replaceWithTemplateEnabled: true,
        resetTemplateInstancesEnabled: true,
        detachTemplateInstancesEnabled: true
      })
    ).toEqual({
      canCreateRectangle: false,
      canRemoveSelected: false,
      canCopy: false,
      canCut: false,
      canPaste: false,
      canSaveAsTemplate: false,
      canReplaceWithTemplate: false,
      canResetTemplateInstances: false,
      canDetachTemplateInstances: false
    });
  });
});
