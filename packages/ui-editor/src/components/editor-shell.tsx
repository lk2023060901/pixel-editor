"use client";

import type { EditorController } from "@pixel-editor/app-services";
import {
  getTileStampFootprint,
  getTileStampPrimaryGid,
  type EditorToolId
} from "@pixel-editor/editor-state";
import { startTransition, useSyncExternalStore } from "react";

import { LayersPanel } from "./layers-panel";
import { MapPropertiesPanel } from "./map-properties-panel";
import { Panel } from "./panel";
import { RendererCanvas } from "./renderer-canvas";
import { ShapeFillControls } from "./shape-fill-controls";
import { StatusPill } from "./status-pill";
import { TileSelectionControls } from "./tile-selection-controls";
import { TilesetsPanel } from "./tilesets-panel";

export interface EditorShellProps {
  store: EditorController;
}

const editorToolOrder: EditorToolId[] = [
  "stamp",
  "eraser",
  "bucket-fill",
  "shape-fill",
  "select",
  "object-select"
];

export function EditorShell({ store }: EditorShellProps) {
  const snapshot = useSyncExternalStore(
    store.subscribe.bind(store),
    store.getSnapshot.bind(store),
    store.getSnapshot.bind(store)
  );
  const activeMap = snapshot.activeMap;
  const activeStamp = snapshot.workspace.session.activeStamp;
  const activeStampGid = getTileStampPrimaryGid(activeStamp);
  const activeStampFootprint = getTileStampFootprint(activeStamp);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(20,83,45,0.18),_transparent_35%),linear-gradient(180deg,_#020617_0%,_#0f172a_55%,_#111827_100%)] text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col gap-4 p-4 lg:p-6">
        <header className="flex flex-col gap-3 rounded-3xl border border-slate-800 bg-slate-950/80 p-5 backdrop-blur">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-medium tracking-[0.26em] text-emerald-300 uppercase">
                Pixel Editor
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                {snapshot.bootstrap.project.name}
              </h1>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-slate-300">
              <span>Compatibility {snapshot.bootstrap.project.compatibilityVersion}</span>
              <span>Tool {snapshot.bootstrap.activeTool}</span>
              <span>Zoom {snapshot.bootstrap.viewport.zoom.toFixed(2)}x</span>
              <span>{snapshot.canUndo ? "Undo ready" : "Undo empty"}</span>
            </div>
          </div>
        </header>

        <div className="grid flex-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)_340px]">
          <div className="flex flex-col gap-4">
            <Panel title="Documents">
              <div className="space-y-2">
                {snapshot.bootstrap.documents.map((document) => (
                  <article
                    key={document.id}
                    className={`cursor-pointer rounded-xl border px-3 py-3 transition ${
                      document.id === snapshot.bootstrap.activeDocumentId
                        ? "border-emerald-500/60 bg-emerald-500/10"
                        : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                    }`}
                    onClick={() => {
                      if (document.kind !== "map") {
                        return;
                      }

                      startTransition(() => {
                        store.setActiveMap(document.id);
                      });
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <strong className="text-sm text-slate-100">{document.name}</strong>
                      <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                        {document.kind}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      Layers {document.layerCount ?? 0} · Objects {document.objectCount ?? 0}
                    </p>
                  </article>
                ))}
              </div>

              <button
                className="mt-4 w-full rounded-xl border border-emerald-500/50 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-500/20"
                onClick={() =>
                  startTransition(() => {
                    store.createQuickMapDocument();
                  })
                }
              >
                New Map
              </button>
            </Panel>

            <Panel title="Asset Roots">
              <ul className="space-y-2 text-sm text-slate-300">
                {snapshot.bootstrap.project.assetRoots.map((assetRoot) => (
                  <li key={assetRoot} className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2">
                    {assetRoot}
                  </li>
                ))}
              </ul>
            </Panel>

            <TilesetsPanel
              activeMap={activeMap}
              tilesets={snapshot.workspace.tilesets}
              activeTilesetId={snapshot.workspace.session.activeTilesetId}
              activeTileLocalId={snapshot.workspace.session.activeTilesetTileLocalId}
              activeStamp={activeStamp}
              store={store}
            />
          </div>

          <main className="flex min-h-[640px] flex-col gap-4">
            <Panel title="Toolbar">
              <div className="flex flex-wrap gap-2">
                {editorToolOrder.map((tool) => {
                  const isActive = tool === snapshot.bootstrap.activeTool;

                  return (
                    <button
                      key={tool}
                      className={`rounded-full border px-4 py-2 text-sm transition ${
                        isActive
                          ? "border-emerald-400/70 bg-emerald-400/15 text-emerald-100"
                          : "border-slate-700 bg-slate-900/70 text-slate-200 hover:border-slate-500"
                      }`}
                      onClick={() =>
                        startTransition(() => {
                          store.setActiveTool(tool);
                        })
                      }
                    >
                      {tool}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-3 text-sm text-slate-300">
                Active stamp{" "}
                {activeStamp.kind === "pattern"
                  ? `${activeStampFootprint.width}×${activeStampFootprint.height} pattern`
                  : activeStampGid ?? "None"}
                {activeStamp.kind === "pattern" && activeStampGid !== null
                  ? ` · primary gid ${activeStampGid}`
                  : ""}
                {activeStamp.kind === "single" && snapshot.activeTileset
                  ? ` · ${snapshot.activeTileset.name}`
                  : ""}
              </div>

              {snapshot.workspace.session.activeTool === "shape-fill" && (
                <ShapeFillControls
                  activeMode={snapshot.workspace.session.shapeFillMode}
                  store={store}
                />
              )}

              <TileSelectionControls
                selection={snapshot.workspace.session.selection}
                canCaptureStamp={snapshot.activeLayer?.kind === "tile"}
                store={store}
              />
            </Panel>

            <Panel title="Canvas" className="flex-1">
              <RendererCanvas
                snapshot={snapshot}
                onStrokeStart={(x, y, modifiers) => {
                  store.beginCanvasStroke(x, y, modifiers);
                }}
                onStrokeMove={(x, y, modifiers) => {
                  store.updateCanvasStroke(x, y, modifiers);
                }}
                onStrokeEnd={() => {
                  store.endCanvasStroke();
                }}
              />
            </Panel>
          </main>

          <div className="flex flex-col gap-4">
            <Panel title="Foundation Status">
              <div className="space-y-3">
                {snapshot.bootstrap.featureStatuses.map((feature) => (
                  <div
                    key={feature.id}
                    className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs tracking-[0.18em] text-slate-500 uppercase">
                          {feature.id}
                        </p>
                        <p className="mt-1 text-sm text-slate-100">{feature.name}</p>
                      </div>
                      <StatusPill status={feature.status} />
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Viewport">
              <div className="mb-4 flex flex-wrap gap-2">
                <button
                  className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 transition hover:border-slate-500"
                  onClick={() =>
                    startTransition(() => {
                      store.zoomOut();
                    })
                  }
                >
                  Zoom -
                </button>
                <button
                  className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 transition hover:border-slate-500"
                  onClick={() =>
                    startTransition(() => {
                      store.zoomIn();
                    })
                  }
                >
                  Zoom +
                </button>
                <button
                  className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 transition hover:border-slate-500"
                  onClick={() =>
                    startTransition(() => {
                      store.toggleGrid();
                    })
                  }
                >
                  Toggle Grid
                </button>
              </div>

              <div className="mb-4 grid grid-cols-3 gap-2">
                <button
                  className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 transition hover:border-slate-500"
                  onClick={() =>
                    startTransition(() => {
                      store.panBy(0, -32);
                    })
                  }
                >
                  Up
                </button>
                <button
                  className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 transition hover:border-slate-500"
                  onClick={() =>
                    startTransition(() => {
                      store.panBy(-32, 0);
                    })
                  }
                >
                  Left
                </button>
                <button
                  className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 transition hover:border-slate-500"
                  onClick={() =>
                    startTransition(() => {
                      store.panBy(32, 0);
                    })
                  }
                >
                  Right
                </button>
                <button
                  className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 transition hover:border-slate-500"
                  onClick={() =>
                    startTransition(() => {
                      store.panBy(0, 32);
                    })
                  }
                >
                  Down
                </button>
                <button
                  className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 transition hover:border-slate-500"
                  disabled={!snapshot.canUndo}
                  onClick={() =>
                    startTransition(() => {
                      store.undo();
                    })
                  }
                >
                  Undo
                </button>
                <button
                  className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 transition hover:border-slate-500"
                  disabled={!snapshot.canRedo}
                  onClick={() =>
                    startTransition(() => {
                      store.redo();
                    })
                  }
                >
                  Redo
                </button>
              </div>

              <dl className="space-y-3 text-sm text-slate-300">
                <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2">
                  <dt>Origin</dt>
                  <dd>
                    {snapshot.bootstrap.viewport.originX}, {snapshot.bootstrap.viewport.originY}
                  </dd>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2">
                  <dt>Grid</dt>
                  <dd>{snapshot.bootstrap.viewport.showGrid ? "Visible" : "Hidden"}</dd>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2">
                  <dt>Active Map</dt>
                  <dd>{activeMap?.name ?? "None"}</dd>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2">
                  <dt>Map Size</dt>
                  <dd>
                    {activeMap
                      ? `${activeMap.settings.width || "∞"} × ${activeMap.settings.height || "∞"}`
                      : "N/A"}
                  </dd>
                </div>
              </dl>
            </Panel>

            <MapPropertiesPanel activeMap={activeMap} store={store} />
            <LayersPanel
              activeMap={activeMap}
              activeLayerId={snapshot.workspace.session.activeLayerId}
              store={store}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
