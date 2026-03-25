"use client";

import type { LayerDefinition, LayerId } from "@pixel-editor/domain";
import { useI18n } from "@pixel-editor/i18n/client";
import { useEffect, useMemo, useState } from "react";

const TILED_ZOOM_FACTORS = [
  0.015625,
  0.03125,
  0.0625,
  0.125,
  0.25,
  0.33,
  0.5,
  0.75,
  1,
  1.5,
  2,
  3,
  4,
  5.5,
  8,
  11,
  16,
  23,
  32,
  45,
  64,
  90,
  128,
  180,
  256
] as const;

const layerKindIconUrls: Record<LayerDefinition["kind"], string> = {
  tile: "/vendor/tiled-statusbar/layer-tile.png",
  object: "/vendor/tiled-statusbar/layer-object.png",
  image: "/vendor/tiled-statusbar/layer-image.png",
  group: "/vendor/tiled-statusbar/layer-tile.png"
};

function formatZoom(scale: number): string {
  return `${Math.round(scale * 100)} %`;
}

function parseZoom(value: string): number | undefined {
  const match = /^\s*(\d+(?:\.\d+)?)\s*%?\s*$/.exec(value);

  if (!match) {
    return undefined;
  }

  const zoom = Number.parseFloat(match[1] ?? "");

  if (!Number.isFinite(zoom)) {
    return undefined;
  }

  return zoom / 100;
}

export interface EditorStatusBarProps {
  errorCount: number;
  warningCount: number;
  statusInfo: string;
  layers: LayerDefinition[];
  activeLayerId: LayerId | undefined;
  activeLayerKind: LayerDefinition["kind"] | undefined;
  zoom: number;
  onLayerChange: (layerId: LayerId) => void;
  onZoomChange: (zoom: number) => void;
  onToggleConsole?: () => void;
  onToggleIssues?: () => void;
}

export function EditorStatusBar(props: EditorStatusBarProps) {
  const { t } = useI18n();
  const [zoomDraft, setZoomDraft] = useState(() => formatZoom(props.zoom));

  useEffect(() => {
    setZoomDraft(formatZoom(props.zoom));
  }, [props.zoom]);

  const layerOptions = useMemo(() => [...props.layers].reverse(), [props.layers]);
  const activeLayerIcon =
    props.activeLayerKind !== undefined
      ? layerKindIconUrls[props.activeLayerKind]
      : layerKindIconUrls.tile;

  function commitZoomDraft(): void {
    const zoom = parseZoom(zoomDraft);

    if (zoom === undefined) {
      setZoomDraft(formatZoom(props.zoom));
      return;
    }

    props.onZoomChange(zoom);
  }

  return (
    <footer className="border-t border-slate-700 bg-slate-800/95 px-3 py-1.5">
      <div className="flex items-center gap-2 overflow-x-auto text-sm text-slate-200">
        <button
          className="flex h-7 w-7 items-center justify-center rounded-sm border border-slate-600 bg-slate-700/40 transition hover:border-slate-500 hover:bg-slate-700/70"
          title={t("statusBar.console")}
          type="button"
          onClick={props.onToggleConsole}
        >
          <img
            alt=""
            className="h-4 w-4 object-contain"
            draggable={false}
            src="/vendor/tiled-statusbar/terminal.png"
          />
        </button>

        <button
          className="flex h-7 items-center gap-2 rounded-sm border border-slate-600 bg-slate-700/40 px-2 transition hover:border-slate-500 hover:bg-slate-700/70"
          title={t("statusBar.issuesSummary", {
            errorCount: props.errorCount,
            warningCount: props.warningCount
          })}
          type="button"
          onClick={props.onToggleIssues}
        >
          <img
            alt=""
            className={`h-4 w-4 object-contain ${props.errorCount > 0 ? "" : "opacity-45"}`}
            draggable={false}
            src="/vendor/tiled-statusbar/dialog-error.png"
          />
          <span className={props.errorCount > 0 ? "font-semibold text-slate-100" : "text-slate-400"}>
            {props.errorCount}
          </span>
          <img
            alt=""
            className={`h-4 w-4 object-contain ${props.warningCount > 0 ? "" : "opacity-45"}`}
            draggable={false}
            src="/vendor/tiled-statusbar/dialog-warning.png"
          />
          <span className={props.warningCount > 0 ? "font-semibold text-slate-100" : "text-slate-400"}>
            {props.warningCount}
          </span>
        </button>

        <div className="min-w-[120px] text-sm text-slate-100">{props.statusInfo || "\u00a0"}</div>

        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <img
              alt=""
              className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 object-contain"
              draggable={false}
              src={activeLayerIcon}
            />
            <select
              className="h-7 min-w-[176px] rounded-sm border border-slate-600 bg-slate-700/50 pl-8 pr-6 text-sm text-slate-100 outline-none transition focus:border-slate-400"
              disabled={layerOptions.length === 0 || props.activeLayerId === undefined}
              value={props.activeLayerId ?? ""}
              onChange={(event) => {
                const layerId = event.target.value;

                if (!layerId) {
                  return;
                }

                props.onLayerChange(layerId as LayerId);
              }}
            >
              {layerOptions.length === 0 ? (
                <option value="">{t("statusBar.noLayer")}</option>
              ) : (
                layerOptions.map((layer) => (
                  <option key={layer.id} value={layer.id}>
                    {layer.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="relative">
            <input
              className="h-7 w-20 rounded-sm border border-slate-600 bg-slate-700/50 px-2 text-sm text-slate-100 outline-none transition focus:border-slate-400"
              list="editor-status-bar-zoom-options"
              value={zoomDraft}
              onBlur={() => {
                commitZoomDraft();
              }}
              onChange={(event) => {
                setZoomDraft(event.target.value);
              }}
              onKeyDown={(event) => {
                if (event.key !== "Enter") {
                  return;
                }

                event.currentTarget.blur();
              }}
            />
            <datalist id="editor-status-bar-zoom-options">
              {TILED_ZOOM_FACTORS.map((zoom) => (
                <option key={zoom} value={formatZoom(zoom)} />
              ))}
            </datalist>
          </div>
        </div>
      </div>
    </footer>
  );
}
