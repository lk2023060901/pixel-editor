"use client";

import {
  toolbarIconUrls,
  type ToolbarActionSpec
} from "@pixel-editor/app-services/ui-shell";

import {
  editorShellToolbarButtonClass,
  editorShellToolbarSeparatorClass
} from "./editor-shell-chrome-styles";

export interface EditorShellToolbarButtonProps {
  action: ToolbarActionSpec;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export function EditorShellToolbarButton(props: EditorShellToolbarButtonProps) {
  return (
    <button
      aria-label={props.action.label}
      className={editorShellToolbarButtonClass(props.active ?? false)}
      disabled={props.disabled ?? !props.action.implemented}
      title={props.action.label}
      onClick={props.onClick}
    >
      <img
        alt=""
        className="h-5 w-5 object-contain"
        draggable={false}
        src={toolbarIconUrls[props.action.icon]}
      />
    </button>
  );
}

export function EditorShellToolbarSeparator() {
  return <div className={editorShellToolbarSeparatorClass} />;
}
