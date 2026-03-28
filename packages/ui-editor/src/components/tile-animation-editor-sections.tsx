"use client";

import {
  getTileViewZoomOptionItems,
  type TileAnimationEditorViewState
} from "@pixel-editor/app-services/ui";
import { useI18n } from "@pixel-editor/i18n/client";

import { TilePreview } from "./tile-preview";
import { buildTileVisualStyle } from "./tileset-view-helpers";

type TileAnimationFrameViewState = TileAnimationEditorViewState["frames"][number];
type TileAnimationSourceTileViewState = TileAnimationEditorViewState["sourceTiles"][number];

export function TileAnimationEditorHeader(props: {
  frameDurationText: string;
  selectedFrameIndex: number | null;
  zoom: number;
  onApplyFrameDuration: () => void;
  onFrameDurationTextChange: (value: string) => void;
  onZoomChange: (zoom: number) => void;
}) {
  const { t } = useI18n();
  const zoomOptions = getTileViewZoomOptionItems();

  return (
    <div className="flex items-center gap-3 border-b border-slate-700 px-4 py-2 text-sm">
      <span className="text-slate-200">{t("tileAnimationEditor.frameDuration")}</span>
      <input
        className="h-8 w-24 border border-slate-600 bg-slate-950 px-2 text-sm text-slate-100 outline-none"
        inputMode="numeric"
        type="number"
        value={props.frameDurationText}
        onChange={(event) => {
          props.onFrameDurationTextChange(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.key !== "Enter") {
            return;
          }

          event.preventDefault();
          props.onApplyFrameDuration();
        }}
      />
      <span className="text-xs text-slate-400">{t("tileAnimationEditor.ms")}</span>
      <button
        className="h-8 border border-slate-600 bg-slate-800 px-3 text-sm text-slate-100 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={props.selectedFrameIndex === null}
        type="button"
        onClick={props.onApplyFrameDuration}
      >
        {t("common.apply")}
      </button>
      <div className="min-w-0 flex-1" />
      <select
        className="h-8 border border-slate-600 bg-slate-950 px-2 text-sm text-slate-100 outline-none"
        value={String(props.zoom)}
        onChange={(event) => {
          props.onZoomChange(Number(event.target.value));
        }}
      >
        {zoomOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function TileAnimationFrameList(props: {
  dragFrameIndex: number | null;
  frames: readonly TileAnimationFrameViewState[];
  selectedFrameIndex: number | null;
  onDropFrameAt: (frameIndex: number) => void;
  onEndFrameDrag: () => void;
  onSelectFrame: (frameIndex: number) => void;
  onStartFrameDrag: (frameIndex: number) => void;
}) {
  const { t } = useI18n();

  if (!props.frames.length) {
    return (
      <div className="flex h-full items-center justify-center px-4 text-center text-sm text-slate-400">
        {t("tileAnimationEditor.noFrames")}
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-800">
      {props.frames.map((frame, frameIndex) => {
        const isSelected = props.selectedFrameIndex === frameIndex;

        return (
          <button
            key={`${frameIndex}:${frame.tileId}:${frame.durationMs}`}
            draggable
            className={`flex w-full items-center gap-3 px-3 py-2 text-left transition ${
              isSelected ? "bg-slate-800 text-slate-50" : "text-slate-200 hover:bg-slate-900"
            }`}
            type="button"
            onClick={() => {
              props.onSelectFrame(frameIndex);
            }}
            onDragStart={() => {
              props.onStartFrameDrag(frameIndex);
            }}
            onDragEnd={props.onEndFrameDrag}
            onDragOver={(event) => {
              event.preventDefault();
            }}
            onDrop={(event) => {
              event.preventDefault();
              props.onDropFrameAt(frameIndex);
            }}
          >
            <TilePreview viewState={frame.preview} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm">#{frame.tileId}</div>
              <div className="text-xs text-slate-400">
                {frame.durationMs} {t("tileAnimationEditor.ms")}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function TileAnimationPreviewPanel(props: {
  previewFrame: TileAnimationFrameViewState | undefined;
}) {
  const { t } = useI18n();

  return props.previewFrame?.preview ? (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 border border-slate-700 bg-slate-950 text-slate-100">
      <TilePreview viewState={props.previewFrame.preview} />
      <span className="text-xs text-slate-400">{t("tileAnimationEditor.preview")}</span>
    </div>
  ) : (
    <div className="flex h-full w-full items-center justify-center border border-slate-700 bg-slate-950 text-sm text-slate-400">
      {t("tileAnimationEditor.preview")}
    </div>
  );
}

export function TileAnimationSourceTilesPanel(props: {
  imageColumns: number | undefined;
  sourceLocalId: number | null;
  sourceTiles: readonly TileAnimationSourceTileViewState[];
  tileHeight: number;
  tileWidth: number;
  tilesetId: string;
  tilesetKind: TileAnimationEditorViewState["tilesetKind"];
  zoom: number;
  onAddFrame: (localId: number) => void;
  onSelectSourceTile: (localId: number) => void;
}) {
  if (props.tilesetKind === "image" && props.imageColumns) {
    return (
      <div
        className="inline-grid border border-slate-500/20 bg-transparent"
        style={{
          gridTemplateColumns: `repeat(${props.imageColumns}, ${props.tileWidth * props.zoom}px)`,
          gridAutoRows: `${props.tileHeight * props.zoom}px`
        }}
      >
        {props.sourceTiles.map((tile) => {
          const isSelected = props.sourceLocalId === tile.localId;

          return (
            <button
              key={`${props.tilesetId}:${tile.localId}`}
              className={`relative border border-slate-500/10 bg-transparent ${
                isSelected ? "z-10 ring-2 ring-blue-500 ring-inset" : ""
              }`}
              style={{
                width: `${props.tileWidth * props.zoom}px`,
                height: `${props.tileHeight * props.zoom}px`
              }}
              type="button"
              onClick={() => {
                props.onSelectSourceTile(tile.localId);
              }}
              onDoubleClick={() => {
                props.onAddFrame(tile.localId);
              }}
            >
              <span className="block" style={buildTileVisualStyle(tile.preview, props.zoom)} />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-start gap-1">
      {props.sourceTiles.map((tile) => {
        const isSelected = props.sourceLocalId === tile.localId;

        return (
          <button
            key={`${props.tilesetId}:${tile.localId}`}
            className={`flex items-center justify-center border bg-slate-900/20 p-1 ${
              isSelected ? "ring-2 ring-blue-500 ring-inset" : "border-slate-500/20"
            }`}
            type="button"
            onClick={() => {
              props.onSelectSourceTile(tile.localId);
            }}
            onDoubleClick={() => {
              props.onAddFrame(tile.localId);
            }}
          >
            <span className="block" style={buildTileVisualStyle(tile.preview, props.zoom)} />
          </button>
        );
      })}
    </div>
  );
}
