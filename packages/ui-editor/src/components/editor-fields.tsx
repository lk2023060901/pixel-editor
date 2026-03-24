"use client";

import type { ChangeEventHandler, ReactNode } from "react";

function FieldLabel(props: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="space-y-2">
      <span className="text-[11px] tracking-[0.18em] text-slate-500 uppercase">
        {props.label}
      </span>
      {props.children}
    </label>
  );
}

function baseFieldClassName(): string {
  return "w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-emerald-500";
}

export function TextField(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <FieldLabel label={props.label}>
      <input
        className={baseFieldClassName()}
        value={props.value}
        onChange={(event) => {
          props.onChange(event.target.value);
        }}
      />
    </FieldLabel>
  );
}

export function NumberField(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <FieldLabel label={props.label}>
      <input
        className={baseFieldClassName()}
        inputMode="numeric"
        type="number"
        value={props.value}
        onChange={(event) => {
          props.onChange(event.target.value);
        }}
      />
    </FieldLabel>
  );
}

export function TextAreaField(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <FieldLabel label={props.label}>
      <textarea
        className={`min-h-28 ${baseFieldClassName()}`}
        value={props.value}
        onChange={(event) => {
          props.onChange(event.target.value);
        }}
      />
    </FieldLabel>
  );
}

export function SelectField(props: {
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
}) {
  const handleChange: ChangeEventHandler<HTMLSelectElement> = (event) => {
    props.onChange(event.target.value);
  };

  return (
    <FieldLabel label={props.label}>
      <select
        className={baseFieldClassName()}
        value={props.value}
        onChange={handleChange}
      >
        {props.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldLabel>
  );
}
