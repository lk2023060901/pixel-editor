import { describe, expect, it } from "vitest";

import {
  resolveEditorShellNewMenuOpen,
  resolveEditorShellOpenMenuId,
  resolveEditorShellSaveTemplateDialogOpen
} from "../src/ui-shell";

describe("editor shell local state helpers", () => {
  it("resolves open menu transitions through a single exported helper", () => {
    expect(
      resolveEditorShellOpenMenuId({
        openMenuId: null,
        transition: {
          kind: "toggle-button",
          menuId: "file"
        }
      })
    ).toBe("file");
    expect(
      resolveEditorShellOpenMenuId({
        openMenuId: "file",
        transition: {
          kind: "toggle-button",
          menuId: "file"
        }
      })
    ).toBeNull();
    expect(
      resolveEditorShellOpenMenuId({
        openMenuId: "file",
        transition: {
          kind: "pointer-enter",
          menuId: "edit"
        }
      })
    ).toBe("edit");
    expect(
      resolveEditorShellOpenMenuId({
        openMenuId: null,
        transition: {
          kind: "pointer-enter",
          menuId: "edit"
        }
      })
    ).toBeNull();
    expect(
      resolveEditorShellOpenMenuId({
        openMenuId: "file",
        transition: {
          kind: "pointer-down",
          pointerWithinMenuBar: true
        }
      })
    ).toBe("file");
    expect(
      resolveEditorShellOpenMenuId({
        openMenuId: "file",
        transition: {
          kind: "pointer-down",
          pointerWithinMenuBar: false
        }
      })
    ).toBeNull();
    expect(
      resolveEditorShellOpenMenuId({
        openMenuId: "edit",
        transition: {
          kind: "close"
        }
      })
    ).toBeNull();
  });

  it("resolves new menu open state through an exported helper", () => {
    expect(
      resolveEditorShellNewMenuOpen({
        open: false,
        transition: {
          kind: "toggle"
        }
      })
    ).toBe(true);
    expect(
      resolveEditorShellNewMenuOpen({
        open: true,
        transition: {
          kind: "toggle"
        }
      })
    ).toBe(false);
    expect(
      resolveEditorShellNewMenuOpen({
        open: true,
        transition: {
          kind: "close"
        }
      })
    ).toBe(false);
  });

  it("auto-closes save-template dialog when its required selection disappears", () => {
    expect(
      resolveEditorShellSaveTemplateDialogOpen({
        open: false,
        hasActiveObject: false
      })
    ).toBe(false);
    expect(
      resolveEditorShellSaveTemplateDialogOpen({
        open: true,
        hasActiveObject: true
      })
    ).toBe(true);
    expect(
      resolveEditorShellSaveTemplateDialogOpen({
        open: true,
        hasActiveObject: false
      })
    ).toBe(false);
  });
});
