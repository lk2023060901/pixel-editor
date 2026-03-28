"use client";

import type {
  ToolbarActionSpec,
  ToolbarItemSpec
} from "@pixel-editor/app-services/ui-shell";

import {
  EditorShellToolbarButton,
  EditorShellToolbarSeparator
} from "./editor-shell-toolbar-button";

export interface EditorShellToolbarItemGroupProps {
  items: ToolbarItemSpec[];
  isActionActive?: (action: ToolbarActionSpec) => boolean;
  isActionDisabled?: (action: ToolbarActionSpec) => boolean;
  onAction: (action: ToolbarActionSpec) => void;
  separatorKeyPrefix: string;
}

export function EditorShellToolbarItemGroup(props: EditorShellToolbarItemGroupProps) {
  return (
    <>
      {props.items.map((item, index) =>
        item.kind === "separator" ? (
          <EditorShellToolbarSeparator key={`${props.separatorKeyPrefix}-${index}`} />
        ) : (
          <EditorShellToolbarButton
            key={item.action.id}
            action={item.action}
            {...(props.isActionActive === undefined
              ? {}
              : { active: props.isActionActive(item.action) })}
            {...(props.isActionDisabled === undefined
              ? {}
              : { disabled: props.isActionDisabled(item.action) })}
            onClick={() => {
              props.onAction(item.action);
            }}
          />
        )
      )}
    </>
  );
}
