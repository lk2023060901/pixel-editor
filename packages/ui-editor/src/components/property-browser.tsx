"use client";

import type { KeyboardEventHandler, ReactNode, Ref } from "react";

function fieldClassName(): string {
  return "w-full border-0 bg-slate-950 px-2 py-1.5 text-sm text-slate-100 outline-none disabled:text-slate-500";
}

function commitOnEnter(event: Parameters<KeyboardEventHandler<HTMLInputElement>>[0]): void {
  if (event.key !== "Enter") {
    return;
  }

  event.preventDefault();
  event.currentTarget.blur();
}

export function PropertyBrowserGroup(props: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-slate-700 last:border-b-0">
      <div className="border-b border-slate-700 bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-200">
        {props.title}
      </div>
      {props.children}
    </section>
  );
}

export function PropertyBrowserRow(props: {
  label: string;
  children: ReactNode;
  multiLine?: boolean;
}) {
  return (
    <div
      className={`grid border-b border-slate-800 last:border-b-0 ${
        props.multiLine ? "grid-cols-1" : "grid-cols-[108px_1fr]"
      }`}
    >
      <span
        className={`border-slate-800 bg-slate-900 px-2 py-1.5 text-xs text-slate-400 ${
          props.multiLine ? "border-b" : "border-r"
        }`}
      >
        {props.label}
      </span>
      <div className="min-w-0 bg-slate-950">{props.children}</div>
    </div>
  );
}

export function PropertyBrowserReadOnlyRow(props: {
  label: string;
  value: string;
}) {
  return (
    <PropertyBrowserRow label={props.label}>
      <span className="block px-2 py-1.5 text-sm text-slate-300">{props.value}</span>
    </PropertyBrowserRow>
  );
}

export function PropertyBrowserTextRow(props: {
  label: string;
  value: string;
  type?: "text" | "number";
  disabled?: boolean;
  autoFocus?: boolean;
  inputRef?: Ref<HTMLInputElement> | undefined;
  onChange: (value: string) => void;
  onCommit?: () => void;
}) {
  return (
    <PropertyBrowserRow label={props.label}>
      <input
        autoFocus={props.autoFocus}
        className={fieldClassName()}
        disabled={props.disabled}
        inputMode={props.type === "number" ? "numeric" : undefined}
        ref={props.inputRef}
        type={props.type ?? "text"}
        value={props.value}
        onBlur={props.onCommit}
        onChange={(event) => {
          props.onChange(event.target.value);
        }}
        onKeyDown={commitOnEnter}
      />
    </PropertyBrowserRow>
  );
}

export function PropertyBrowserSelectRow(props: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <PropertyBrowserRow label={props.label}>
      <select
        className={fieldClassName()}
        disabled={props.disabled}
        value={props.value}
        onChange={(event) => {
          props.onChange(event.target.value);
        }}
      >
        {props.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </PropertyBrowserRow>
  );
}

export function PropertyBrowserCheckboxRow(props: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <PropertyBrowserRow label={props.label}>
      <span className="flex items-center px-2 py-1.5 text-sm text-slate-200">
        <input
          checked={props.checked}
          type="checkbox"
          onChange={(event) => {
            props.onChange(event.target.checked);
          }}
        />
      </span>
    </PropertyBrowserRow>
  );
}

export function PropertyBrowserContent(props: {
  children: ReactNode;
}) {
  return <div className="flex h-full min-h-0 flex-col">{props.children}</div>;
}
