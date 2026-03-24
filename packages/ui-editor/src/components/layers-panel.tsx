"use client";

import type { EditorController } from "@pixel-editor/app-services";
import type { EditorMap, LayerId } from "@pixel-editor/domain";
import { startTransition } from "react";

import { Panel } from "./panel";

function ActionButton(props: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
      disabled={props.disabled}
      onClick={props.onClick}
    >
      {props.label}
    </button>
  );
}

export interface LayersPanelProps {
  activeMap: EditorMap | undefined;
  activeLayerId: LayerId | undefined;
  store: EditorController;
}

export function LayersPanel({ activeMap, activeLayerId, store }: LayersPanelProps) {
  const activeLayerIndex = activeMap?.layers.findIndex((layer) => layer.id === activeLayerId) ?? -1;

  return (
    <Panel title="Layers">
      <div className="mb-4 grid grid-cols-2 gap-2">
        <ActionButton
          label="Add Tile"
          onClick={() => {
            startTransition(() => {
              store.addTileLayer();
            });
          }}
        />
        <ActionButton
          label="Add Object"
          onClick={() => {
            startTransition(() => {
              store.addObjectLayer();
            });
          }}
        />
        <ActionButton
          label="Move Up"
          disabled={!activeMap || activeLayerIndex <= 0}
          onClick={() => {
            startTransition(() => {
              store.moveActiveLayer("up");
            });
          }}
        />
        <ActionButton
          label="Move Down"
          disabled={!activeMap || activeLayerIndex < 0 || activeLayerIndex >= activeMap.layers.length - 1}
          onClick={() => {
            startTransition(() => {
              store.moveActiveLayer("down");
            });
          }}
        />
      </div>

      <ActionButton
        label="Remove Active Layer"
        disabled={!activeLayerId}
        onClick={() => {
          startTransition(() => {
            store.removeActiveLayer();
          });
        }}
      />

      <div className="mt-4 space-y-2">
        {activeMap?.layers.map((layer, index) => (
          <article
            key={layer.id}
            className={`cursor-pointer rounded-xl border px-3 py-3 transition ${
              activeLayerId === layer.id
                ? "border-emerald-500/60 bg-emerald-500/10"
                : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
            }`}
            onClick={() => {
              startTransition(() => {
                store.setActiveLayer(layer.id);
              });
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <strong className="text-sm text-slate-100">{layer.name}</strong>
              <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                {layer.kind}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              #{index + 1} · Opacity {layer.opacity} · {layer.visible ? "Visible" : "Hidden"}
            </p>
          </article>
        ))}
        {!activeMap && <p className="text-sm text-slate-400">No active map loaded.</p>}
      </div>
    </Panel>
  );
}
