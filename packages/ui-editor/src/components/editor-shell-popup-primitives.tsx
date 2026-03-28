"use client";

import type { ReactNode } from "react";

export interface EditorShellPopupSurfaceProps {
  children: ReactNode;
  className: string;
  role?: string;
}

export function EditorShellPopupSurface(props: EditorShellPopupSurfaceProps) {
  return (
    <div className={props.className} role={props.role}>
      {props.children}
    </div>
  );
}

export interface EditorShellPopupButtonRowProps {
  children: ReactNode;
  className: string;
  disabled?: boolean;
  role?: string;
  onClick?: () => void;
}

export function EditorShellPopupButtonRow(props: EditorShellPopupButtonRowProps) {
  return (
    <button
      className={props.className}
      disabled={props.disabled}
      role={props.role}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
}

export interface EditorShellPopupSeparatorProps {
  className: string;
}

export function EditorShellPopupSeparator(props: EditorShellPopupSeparatorProps) {
  return <div className={props.className} />;
}
