"use client";

import {
  isEditorShellMainToolbarActionDisabled,
  isEditorShellToolActionDisabled,
  isEditorShellToolOptionActive,
  type EditorShellChromeViewState,
  type ToolbarActionSpec,
  type ToolbarItemSpec,
  type ToolbarMenuItemSpec
} from "@pixel-editor/app-services/ui-shell";
import type { TranslationFn } from "@pixel-editor/i18n";

import {
  editorShellToolbarContainerClass,
  editorShellToolbarRowClass
} from "./editor-shell-chrome-styles";
import {
  EditorShellToolbarButton,
  EditorShellToolbarSeparator
} from "./editor-shell-toolbar-button";
import { EditorShellToolbarItemGroup } from "./editor-shell-toolbar-item-group";
import { EditorShellToolbarSplitButton } from "./editor-shell-toolbar-split-button";

export interface EditorShellToolbarProps {
  t: TranslationFn;
  newAction: ToolbarActionSpec | undefined;
  newMenuOpen: boolean;
  shellChromeViewState: EditorShellChromeViewState;
  remainingMainActions: ToolbarActionSpec[];
  newMenuItems: ToolbarMenuItemSpec[];
  toolToolbarItems: ToolbarItemSpec[];
  toolOptionItems: ToolbarItemSpec[];
  onNewMenuBlur: () => void;
  onNewMenuItem: (menuItemId: string) => void;
  onNewActionPrimaryClick: (action: ToolbarActionSpec) => void;
  onToggleNewMenu: () => void;
  onToolbarAction: (action: ToolbarActionSpec) => void;
}

export function EditorShellToolbar(props: EditorShellToolbarProps) {
  return (
    <div className={editorShellToolbarContainerClass}>
      <div className={editorShellToolbarRowClass}>
        {props.newAction ? (
          <EditorShellToolbarSplitButton
            action={props.newAction}
            menuItems={props.newMenuItems}
            menuOpen={props.newMenuOpen}
            onBlur={props.onNewMenuBlur}
            onMenuItemClick={props.onNewMenuItem}
            onPrimaryClick={() => {
              props.onNewActionPrimaryClick(props.newAction!);
            }}
            onToggleMenu={props.onToggleNewMenu}
            menuLabel={props.t("common.menu")}
            soonLabel={props.t("common.soon")}
          />
        ) : null}
        {props.remainingMainActions.map((action) => (
          <EditorShellToolbarButton
            key={action.id}
            action={action}
            disabled={
              !action.implemented ||
              isEditorShellMainToolbarActionDisabled(props.shellChromeViewState, action.id)
            }
            onClick={() => {
              props.onToolbarAction(action);
            }}
          />
        ))}
        <EditorShellToolbarSeparator />
        <EditorShellToolbarItemGroup
          items={props.toolToolbarItems}
          separatorKeyPrefix="tool-separator"
          isActionActive={(action) => action.editorToolId === props.shellChromeViewState.activeTool}
          isActionDisabled={(action) =>
            !action.implemented ||
            isEditorShellToolActionDisabled(
              props.shellChromeViewState,
              action.editorToolId
            )
          }
          onAction={props.onToolbarAction}
        />
        {props.toolOptionItems.length > 0 ? <EditorShellToolbarSeparator /> : null}
        <EditorShellToolbarItemGroup
          items={props.toolOptionItems}
          separatorKeyPrefix="option-separator"
          isActionActive={(action) =>
            isEditorShellToolOptionActive(props.shellChromeViewState, action.id)
          }
          onAction={props.onToolbarAction}
        />
      </div>
    </div>
  );
}
