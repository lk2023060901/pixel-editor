"use client";

import type {
  TiledMenuItemSpec2,
  TiledMenuSpec
} from "@pixel-editor/app-services/ui-shell";
import type { RefObject } from "react";

import {
  editorShellMenuActionButtonClass,
  editorShellMenuBarButtonClass,
  editorShellMenuBarContainerClass,
  editorShellMenuBarRowClass,
  editorShellMenuCheckmarkClass,
  editorShellMenuLabelClass,
  editorShellMenuPopupClass,
  editorShellMenuSeparatorClass,
  editorShellMenuShortcutClass,
  editorShellMenuSubmenuButtonClass,
  editorShellSubmenuChevronClass
} from "./editor-shell-chrome-styles";
import {
  EditorShellPopupButtonRow,
  EditorShellPopupSeparator,
  EditorShellPopupSurface
} from "./editor-shell-popup-primitives";
import { useEditorShellSubmenuState } from "./use-editor-shell-submenu-state";

function MenuBarButton(props: {
  label: string;
  open: boolean;
  onClick: () => void;
  onPointerEnter: () => void;
}) {
  return (
    <button
      className={editorShellMenuBarButtonClass(props.open)}
      onClick={props.onClick}
      onPointerEnter={props.onPointerEnter}
    >
      {props.label}
    </button>
  );
}

function MenuPopup(props: {
  items: TiledMenuItemSpec2[];
  onAction: (actionId: string) => void;
  onRequestClose: () => void;
}) {
  const submenuState = useEditorShellSubmenuState();

  return (
    <EditorShellPopupSurface
      className={`min-h-4 min-w-[240px] py-1 ${editorShellMenuPopupClass}`}
    >
      {props.items.map((item, index) => {
        if (item.kind === "separator") {
          return (
            <EditorShellPopupSeparator
              key={`separator-${index}`}
              className={editorShellMenuSeparatorClass}
            />
          );
        }

        if (item.kind === "submenu") {
          const isOpen = submenuState.openSubmenuId === item.id;

          return (
            <div
              key={item.id}
              className="relative"
              onMouseEnter={() => {
                submenuState.onSubmenuPointerEnter(item.id);
              }}
            >
              <EditorShellPopupButtonRow className={editorShellMenuSubmenuButtonClass}>
                <span>{item.label}</span>
                <span className={editorShellSubmenuChevronClass}>▸</span>
              </EditorShellPopupButtonRow>
              {isOpen ? (
                <div className="absolute left-full top-0 z-30 ml-1">
                  <MenuPopup
                    items={item.items}
                    onAction={props.onAction}
                    onRequestClose={props.onRequestClose}
                  />
                </div>
              ) : null}
            </div>
          );
        }

        return (
          <EditorShellPopupButtonRow
            key={item.id}
            className={editorShellMenuActionButtonClass(
              item.implemented && item.disabled !== true
            )}
            disabled={!item.implemented || item.disabled === true}
            onClick={() => {
              props.onAction(item.id);
              props.onRequestClose();
            }}
          >
            <span className={editorShellMenuCheckmarkClass}>{item.checked ? "✓" : ""}</span>
            <span className={editorShellMenuLabelClass}>{item.label}</span>
            <span className={editorShellMenuShortcutClass}>{item.shortcut ?? ""}</span>
          </EditorShellPopupButtonRow>
        );
      })}
    </EditorShellPopupSurface>
  );
}

export interface EditorShellMenuBarProps {
  menuBarRef: RefObject<HTMLDivElement | null>;
  menuSpecs: TiledMenuSpec[];
  openMenuId: string | null;
  onMenuPointerEnter: (menuId: string) => void;
  onMenuButtonClick: (menuId: string) => void;
  onMenuAction: (actionId: string) => void;
  onCloseMenu: () => void;
}

export function EditorShellMenuBar(props: EditorShellMenuBarProps) {
  return (
    <div className={editorShellMenuBarContainerClass}>
      <div ref={props.menuBarRef} className={editorShellMenuBarRowClass}>
        {props.menuSpecs.map((menu) => (
          <div
            key={menu.id}
            className="relative"
            onPointerEnter={() => {
              props.onMenuPointerEnter(menu.id);
            }}
          >
            <MenuBarButton
              label={menu.label}
              open={props.openMenuId === menu.id}
              onClick={() => {
                props.onMenuButtonClick(menu.id);
              }}
              onPointerEnter={() => {
                props.onMenuPointerEnter(menu.id);
              }}
            />
            {props.openMenuId === menu.id ? (
              <div className="absolute left-0 top-full z-30 mt-1">
                <MenuPopup
                  items={menu.items}
                  onAction={props.onMenuAction}
                  onRequestClose={props.onCloseMenu}
                />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
