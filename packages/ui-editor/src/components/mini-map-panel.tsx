"use client";

import type { MiniMapPanelViewState } from "@pixel-editor/app-services/ui";
import { useI18n } from "@pixel-editor/i18n/client";

import { Panel } from "./panel";

export interface MiniMapPanelProps {
  viewState: MiniMapPanelViewState | undefined;
  embedded?: boolean;
}

function MiniMapPanelContent({ viewState }: Omit<MiniMapPanelProps, "embedded">) {
  const { t } = useI18n();

  if (!viewState) {
    return (
      <div className="flex h-full min-h-[220px] items-center justify-center text-sm text-slate-400">
        {t("miniMap.noActiveMap")}
      </div>
    );
  }

  const mapSizeSummary = viewState.infinite
    ? t("common.infinite")
    : `${viewState.mapWidth} × ${viewState.mapHeight}`;

  return (
    <div className="flex h-full min-h-0 flex-col p-2">
      <div className="relative flex-1 overflow-hidden border border-slate-800 bg-slate-950">
        <div className="absolute inset-2 flex items-center justify-center">
            <div
              className="relative border border-slate-600 bg-slate-800"
              style={{
                width: `${viewState.previewWidthPercent}%`,
                height: `${viewState.previewHeightPercent}%`
              }}
            >
              <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-[size:12px_12px]" />
              <div
                className="absolute border border-emerald-400/90 bg-transparent"
                style={{
                  left: `${viewState.viewportLeftPercent}%`,
                  top: `${viewState.viewportTopPercent}%`,
                  width: `${viewState.viewportWidthPercent}%`,
                  height: `${viewState.viewportHeightPercent}%`
                }}
              />
            </div>
        </div>
      </div>
      <div className="border-t border-slate-800 px-1 py-1 text-[11px] text-slate-400">
        {viewState.mapName} · {mapSizeSummary} · {viewState.viewportZoom.toFixed(2)}x
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
