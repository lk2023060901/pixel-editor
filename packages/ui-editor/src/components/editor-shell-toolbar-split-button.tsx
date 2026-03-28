"use client";

import type {
  ToolbarActionSpec,
  ToolbarMenuItemSpec
} from "@pixel-editor/app-services/ui-shell";

import {
  editorShellToolbarSoonBadgeClass,
  editorShellToolbarSplitMenuClass,
  editorShellToolbarSplitMenuItemClass,
  editorShellToolbarSplitToggleClass,
  editorShellToolbarSplitWrapperClass
} from "./editor-shell-chrome-styles";
import {
  EditorShellPopupButtonRow,
  EditorShellPopupSurface
} from "./editor-shell-popup-primitives";
import { EditorShellToolbarButton } from "./editor-shell-toolbar-button";

export interface EditorShellToolbarSplitButtonProps {
  action: ToolbarActionSpec;
  menuItems: ToolbarMenuItemSpec[];
  menuLabel: string;
  soonLabel: string;
  menuOpen: boolean;
  onPrimaryClick: () => void;
  onToggleMenu: () => void;
  onMenuItemClick: (id: string) => void;
  onBlur: () => void;
}

export function EditorShellToolbarSplitButton(
  props: EditorShellToolbarSplitButtonProps
) {
  return (
    <div
      className={editorShellToolbarSplitWrapperClass}
      onBlur={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
          return;
        }

        props.onBlur();
      }}
    >
      <EditorShellToolbarButton
        action={props.action}
        onClick={props.onPrimaryClick}
      />
      <button
        aria-expanded={props.menuOpen}
        aria-haspopup="menu"
        aria-label={`${props.action.label} ${props.menuLabel}`}
        className={editorShellToolbarSplitToggleClass}
        onClick={props.onToggleMenu}
      >
        ▼
      </button>
      {props.menuOpen ? (
        <EditorShellPopupSurface
          className={editorShellToolbarSplitMenuClass}
          role="menu"
        >
          {props.menuItems.map((item) => (
            <EditorShellPopupButtonRow
              key={item.id}
              className={editorShellToolbarSplitMenuItemClass}
              disabled={!item.implemented}
              role="menuitem"
              onClick={() => {
                props.onMenuItemClick(item.id);
              }}
            >
              <span>{item.label}</span>
              {!item.implemented ? (
                <span className={editorShellToolbarSoonBadgeClass}>
                  {props.soonLabel}
                </span>
              ) : null}
            </EditorShellPopupButtonRow>
          ))}
        </EditorShellPopupSurface>
      ) : null}
    </div>
  );
}
