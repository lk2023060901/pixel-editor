export type EditorShellMenuTransition =
  | {
      kind: "toggle-button";
      menuId: string;
    }
  | {
      kind: "pointer-enter";
      menuId: string;
    }
  | {
      kind: "pointer-down";
      pointerWithinMenuBar: boolean;
    }
  | {
      kind: "close";
    };

export type EditorShellNewMenuTransition =
  | {
      kind: "toggle";
    }
  | {
      kind: "close";
    };

export function resolveEditorShellOpenMenuId(input: {
  openMenuId: string | null;
  transition: EditorShellMenuTransition;
}): string | null {
  switch (input.transition.kind) {
    case "toggle-button":
      return input.openMenuId === input.transition.menuId
        ? null
        : input.transition.menuId;
    case "pointer-enter":
      return input.openMenuId === null ? null : input.transition.menuId;
    case "pointer-down":
      return input.transition.pointerWithinMenuBar ? input.openMenuId : null;
    case "close":
      return null;
  }
}

export function resolveEditorShellNewMenuOpen(input: {
  open: boolean;
  transition: EditorShellNewMenuTransition;
}): boolean {
  switch (input.transition.kind) {
    case "toggle":
      return !input.open;
    case "close":
      return false;
  }
}

export function resolveEditorShellSaveTemplateDialogOpen(input: {
  open: boolean;
  hasActiveObject: boolean;
}): boolean {
  if (!input.open) {
    return false;
  }

  return input.hasActiveObject;
}
