import { describe, expect, it, vi } from "vitest";

import { createEditorShellActionPlan, type EditorController } from "../src/ui";

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

    const store: Pick<EditorController, "toggleLayerVisibility"> = {
      toggleLayerVisibility: vi.fn()
    };

    plan.run(store as EditorController);

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
});
