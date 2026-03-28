"use client";

import {
  type EditorShellChromeViewState,
  type TiledMenuSpec,
  type ToolbarActionSpec,
  type ToolbarItemSpec,
  type ToolbarMenuItemSpec
} from "@pixel-editor/app-services/ui-shell";
import type { TranslationFn } from "@pixel-editor/i18n";
import type { RefObject } from "react";
import { EditorShellMenuBar } from "./editor-shell-menu-bar";
import { EditorShellToolbar } from "./editor-shell-toolbar";

export interface EditorShellChromeProps {
  t: TranslationFn;
  menuBarRef: RefObject<HTMLDivElement | null>;
  menuSpecs: TiledMenuSpec[];
  openMenuId: string | null;
  newMenuOpen: boolean;
  shellChromeViewState: EditorShellChromeViewState;
  newAction: ToolbarActionSpec | undefined;
  remainingMainActions: ToolbarActionSpec[];
  newMenuItems: ToolbarMenuItemSpec[];
  toolToolbarItems: ToolbarItemSpec[];
  toolOptionItems: ToolbarItemSpec[];
  onMenuPointerEnter: (menuId: string) => void;
  onMenuButtonClick: (menuId: string) => void;
  onMenuAction: (actionId: string) => void;
  onCloseMenu: () => void;
  onNewMenuBlur: () => void;
  onNewMenuItem: (menuItemId: string) => void;
  onNewActionPrimaryClick: (action: ToolbarActionSpec) => void;
  onToggleNewMenu: () => void;
  onToolbarAction: (action: ToolbarActionSpec) => void;
}

export function EditorShellChrome(props: EditorShellChromeProps) {
  return (
    <>
      <EditorShellMenuBar
        menuBarRef={props.menuBarRef}
        menuSpecs={props.menuSpecs}
        openMenuId={props.openMenuId}
        onMenuPointerEnter={props.onMenuPointerEnter}
        onMenuButtonClick={props.onMenuButtonClick}
        onMenuAction={props.onMenuAction}
        onCloseMenu={props.onCloseMenu}
      />
      <EditorShellToolbar
        t={props.t}
        newAction={props.newAction}
        newMenuOpen={props.newMenuOpen}
        shellChromeViewState={props.shellChromeViewState}
        remainingMainActions={props.remainingMainActions}
        newMenuItems={props.newMenuItems}
        toolToolbarItems={props.toolToolbarItems}
        toolOptionItems={props.toolOptionItems}
        onNewMenuBlur={props.onNewMenuBlur}
        onNewMenuItem={props.onNewMenuItem}
        onNewActionPrimaryClick={props.onNewActionPrimaryClick}
        onToggleNewMenu={props.onToggleNewMenu}
        onToolbarAction={props.onToolbarAction}
      />
    </>
  );
}
