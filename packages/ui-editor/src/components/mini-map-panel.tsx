"use client";

import type { EditorMap } from "@pixel-editor/domain";
import { useI18n } from "@pixel-editor/i18n/client";

import { Panel } from "./panel";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export interface MiniMapPanelProps {
  activeMap: EditorMap | undefined;
  viewportOriginX: number;
  viewportOriginY: number;
  viewportZoom: number;
  embedded?: boolean;
}

function MiniMapPanelContent({
  activeMap,
  viewportOriginX,
  viewportOriginY,
  viewportZoom
}: Omit<MiniMapPanelProps, "embedded">) {
  const { t } = useI18n();

  if (!activeMap) {
    return (
      <div className="flex h-full min-h-[220px] items-center justify-center text-sm text-slate-400">
        {t("miniMap.noActiveMap")}
      </div>
    );
  }

  const mapWidthTiles = Math.max(activeMap.settings.width, activeMap.settings.infinite ? 48 : 1);
  const mapHeightTiles = Math.max(activeMap.settings.height, activeMap.settings.infinite ? 48 : 1);
  const mapWidthPx = Math.max(mapWidthTiles * activeMap.settings.tileWidth, 1);
  const mapHeightPx = Math.max(mapHeightTiles * activeMap.settings.tileHeight, 1);
  const maxDimension = Math.max(mapWidthTiles, mapHeightTiles, 1);
  const previewWidthPercent = (mapWidthTiles / maxDimension) * 100;
  const previewHeightPercent = (mapHeightTiles / maxDimension) * 100;
  const viewportWidthPercent = clamp(100 / Math.max(viewportZoom, 0.25), 14, 100);
  const viewportHeightPercent = clamp(100 / Math.max(viewportZoom, 0.25), 14, 100);
  const viewportLeftPercent = clamp((viewportOriginX / mapWidthPx) * 100, 0, 100 - viewportWidthPercent);
  const viewportTopPercent = clamp((viewportOriginY / mapHeightPx) * 100, 0, 100 - viewportHeightPercent);
  const mapSizeSummary = activeMap.settings.infinite
    ? t("common.infinite")
    : `${activeMap.settings.width} × ${activeMap.settings.height}`;

  return (
    <div className="flex h-full min-h-0 flex-col p-2">
      <div className="relative flex-1 overflow-hidden border border-slate-800 bg-slate-950">
        <div className="absolute inset-2 flex items-center justify-center">
            <div
              className="relative border border-slate-600 bg-slate-800"
              style={{
                width: `${previewWidthPercent}%`,
                height: `${previewHeightPercent}%`
              }}
            >
              <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-[size:12px_12px]" />
              <div
                className="absolute border border-emerald-400/90 bg-transparent"
                style={{
                  left: `${viewportLeftPercent}%`,
                  top: `${viewportTopPercent}%`,
                  width: `${viewportWidthPercent}%`,
                  height: `${viewportHeightPercent}%`
                }}
              />
            </div>
        </div>
      </div>
      <div className="border-t border-slate-800 px-1 py-1 text-[11px] text-slate-400">
        {activeMap.name} · {mapSizeSummary} · {viewportZoom.toFixed(2)}x
      </div>
    </div>
  );
}

export function MiniMapPanel({
  embedded = false,
  ...props
}: MiniMapPanelProps) {
  const { t } = useI18n();
  const content = <MiniMapPanelContent {...props} />;

  if (embedded) {
    return content;
  }

  return <Panel title={t("miniMap.title")}>{content}</Panel>;
}
