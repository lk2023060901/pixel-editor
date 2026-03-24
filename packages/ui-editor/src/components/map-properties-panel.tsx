"use client";

import type { EditorController } from "@pixel-editor/app-services";
import type { EditorMap } from "@pixel-editor/domain";
import { startTransition, useEffect, useState } from "react";

import { Panel } from "./panel";

interface MapDetailsDraft {
  name: string;
  orientation: EditorMap["settings"]["orientation"];
  renderOrder: EditorMap["settings"]["renderOrder"];
  width: string;
  height: string;
  tileWidth: string;
  tileHeight: string;
  infinite: boolean;
  backgroundColor: string;
}

const orientationOptions: Array<EditorMap["settings"]["orientation"]> = [
  "orthogonal",
  "isometric",
  "staggered",
  "hexagonal",
  "oblique"
];
const renderOrderOptions: Array<EditorMap["settings"]["renderOrder"]> = [
  "right-down",
  "right-up",
  "left-down",
  "left-up"
];

function createDraft(map?: EditorMap): MapDetailsDraft {
  return {
    name: map?.name ?? "",
    orientation: map?.settings.orientation ?? "orthogonal",
    renderOrder: map?.settings.renderOrder ?? "right-down",
    width: String(map?.settings.width || 64),
    height: String(map?.settings.height || 64),
    tileWidth: String(map?.settings.tileWidth ?? 32),
    tileHeight: String(map?.settings.tileHeight ?? 32),
    infinite: map?.settings.infinite ?? false,
    backgroundColor: map?.settings.backgroundColor ?? ""
  };
}

function NumberField(props: {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs tracking-[0.16em] text-slate-500 uppercase">{props.label}</span>
      <input
        className="w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-emerald-500"
        disabled={props.disabled}
        inputMode="numeric"
        type="number"
        value={props.value}
        onChange={(event) => {
          props.onChange(event.target.value);
        }}
      />
    </label>
  );
}

export interface MapPropertiesPanelProps {
  activeMap: EditorMap | undefined;
  store: EditorController;
}

export function MapPropertiesPanel({ activeMap, store }: MapPropertiesPanelProps) {
  const [draft, setDraft] = useState(() => createDraft(activeMap));

  useEffect(() => {
    setDraft(createDraft(activeMap));
  }, [activeMap]);

  if (!activeMap) {
    return (
      <Panel title="Map Properties">
        <p className="text-sm text-slate-400">No active map selected.</p>
      </Panel>
    );
  }

  return (
    <Panel title="Map Properties">
      <div className="grid gap-3">
        <label className="space-y-2">
          <span className="text-xs tracking-[0.16em] text-slate-500 uppercase">Name</span>
          <input
            className="w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-emerald-500"
            value={draft.name}
            onChange={(event) => {
              const { value } = event.target;
              setDraft((current) => ({ ...current, name: value }));
            }}
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs tracking-[0.16em] text-slate-500 uppercase">Orientation</span>
            <select
              className="w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-emerald-500"
              value={draft.orientation}
              onChange={(event) => {
                const { value } = event.target;
                setDraft((current) => ({
                  ...current,
                  orientation: value as EditorMap["settings"]["orientation"]
                }));
              }}
            >
              {orientationOptions.map((orientation) => (
                <option key={orientation} value={orientation}>
                  {orientation}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs tracking-[0.16em] text-slate-500 uppercase">Render Order</span>
            <select
              className="w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-emerald-500"
              value={draft.renderOrder}
              onChange={(event) => {
                const { value } = event.target;
                setDraft((current) => ({
                  ...current,
                  renderOrder: value as EditorMap["settings"]["renderOrder"]
                }));
              }}
            >
              {renderOrderOptions.map((renderOrder) => (
                <option key={renderOrder} value={renderOrder}>
                  {renderOrder}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <NumberField
            label="Width"
            value={draft.width}
            disabled={draft.infinite}
            onChange={(value) => {
              setDraft((current) => ({ ...current, width: value }));
            }}
          />
          <NumberField
            label="Height"
            value={draft.height}
            disabled={draft.infinite}
            onChange={(value) => {
              setDraft((current) => ({ ...current, height: value }));
            }}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <NumberField
            label="Tile Width"
            value={draft.tileWidth}
            onChange={(value) => {
              setDraft((current) => ({ ...current, tileWidth: value }));
            }}
          />
          <NumberField
            label="Tile Height"
            value={draft.tileHeight}
            onChange={(value) => {
              setDraft((current) => ({ ...current, tileHeight: value }));
            }}
          />
        </div>

        <label className="space-y-2">
          <span className="text-xs tracking-[0.16em] text-slate-500 uppercase">Background Color</span>
          <input
            className="w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-emerald-500"
            placeholder="#0f172a"
            value={draft.backgroundColor}
            onChange={(event) => {
              const { value } = event.target;
              setDraft((current) => ({ ...current, backgroundColor: value }));
            }}
          />
        </label>

        <label className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-3 text-sm text-slate-200">
          <input
            checked={draft.infinite}
            type="checkbox"
            onChange={(event) => {
              const { checked } = event.target;
              setDraft((current) => ({ ...current, infinite: checked }));
            }}
          />
          Infinite map
        </label>

        <button
          className="rounded-xl border border-emerald-500/50 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-500/20"
          onClick={() => {
            const width = Number.parseInt(draft.width, 10);
            const height = Number.parseInt(draft.height, 10);
            const tileWidth = Number.parseInt(draft.tileWidth, 10);
            const tileHeight = Number.parseInt(draft.tileHeight, 10);

            if (
              Number.isNaN(tileWidth) ||
              Number.isNaN(tileHeight) ||
              (!draft.infinite && (Number.isNaN(width) || Number.isNaN(height)))
            ) {
              return;
            }

            startTransition(() => {
              store.updateActiveMapDetails({
                name: draft.name.trim() || activeMap.name,
                orientation: draft.orientation,
                renderOrder: draft.renderOrder,
                tileWidth,
                tileHeight,
                infinite: draft.infinite,
                ...(draft.infinite ? {} : { width, height }),
                ...(draft.backgroundColor.trim()
                  ? { backgroundColor: draft.backgroundColor.trim() }
                  : {})
              });
            });
          }}
        >
          Apply Map Changes
        </button>
      </div>
    </Panel>
  );
}
