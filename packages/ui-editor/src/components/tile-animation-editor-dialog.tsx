"use client";

import type { EditorController } from "@pixel-editor/app-services";
import {
  getTilesetTileByLocalId,
  listTilesetLocalIds,
  type TileAnimationFrame,
  type TilesetDefinition
} from "@pixel-editor/domain";
import { useI18n } from "@pixel-editor/i18n/client";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";

import { TilePreview } from "./tile-preview";
import {
  buildImageCollectionTileStyle,
  buildImageTilesetTileStyle,
  getImageTilesetColumns,
  TILESET_VIEW_ZOOM_OPTIONS
} from "./tileset-view-helpers";

const DEFAULT_FRAME_DURATION_MS = 100;

function reorderAnimationFrames(
  frames: readonly TileAnimationFrame[],
  fromIndex: number,
  toIndex: number
): TileAnimationFrame[] {
  if (fromIndex === toIndex) {
    return frames.map((frame) => ({ ...frame }));
  }

  const nextFrames = frames.map((frame) => ({ ...frame }));
  const [movedFrame] = nextFrames.splice(fromIndex, 1);

  if (!movedFrame) {
    return nextFrames;
  }

  nextFrames.splice(toIndex, 0, movedFrame);
  return nextFrames;
}

function isEditableElement(target: EventTarget | null): target is HTMLElement {
  return (
    target instanceof HTMLElement &&
    (target instanceof HTMLInputElement ||
      target instanceof HTMLSelectElement ||
      target instanceof HTMLTextAreaElement ||
      target.isContentEditable)
  );
}

export function TileAnimationEditorDialog(props: {
  tileset: TilesetDefinition;
  selectedLocalId: number | null;
  store: EditorController;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [sourceLocalId, setSourceLocalId] = useState<number | null>(props.selectedLocalId);
  const [selectedFrameIndex, setSelectedFrameIndex] = useState<number | null>(null);
  const [dragFrameIndex, setDragFrameIndex] = useState<number | null>(null);
  const [frameDurationText, setFrameDurationText] = useState(String(DEFAULT_FRAME_DURATION_MS));
  const [previewFrameIndex, setPreviewFrameIndex] = useState(0);
  const tileIds = useMemo(() => listTilesetLocalIds(props.tileset), [props.tileset]);
  const selectedTile =
    props.selectedLocalId !== null
      ? getTilesetTileByLocalId(props.tileset, props.selectedLocalId)
      : undefined;
  const frames = selectedTile?.animation ?? [];
  const previewFrame = frames[previewFrameIndex] ?? frames[0];
  const previewTileLocalId = previewFrame?.tileId;
  const imageColumns =
    props.tileset.kind === "image" ? getImageTilesetColumns(props.tileset) : undefined;

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  useEffect(() => {
    setSourceLocalId(props.selectedLocalId ?? tileIds[0] ?? null);
    setSelectedFrameIndex(null);
    setPreviewFrameIndex(0);
  }, [props.selectedLocalId, props.tileset.id, tileIds]);

  useEffect(() => {
    if (!frames.length) {
      setSelectedFrameIndex(null);
      setPreviewFrameIndex(0);
      return;
    }

    setSelectedFrameIndex((currentIndex) => {
      if (currentIndex === null) {
        return 0;
      }

      return Math.min(currentIndex, frames.length - 1);
    });
    setPreviewFrameIndex((currentIndex) => Math.min(currentIndex, frames.length - 1));
  }, [frames]);

  useEffect(() => {
    if (!frames.length) {
      return;
    }

    const durationMs = Math.max(1, frames[previewFrameIndex]?.durationMs ?? DEFAULT_FRAME_DURATION_MS);
    const timeoutId = window.setTimeout(() => {
      setPreviewFrameIndex((currentIndex) => (currentIndex + 1) % frames.length);
    }, durationMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [frames, previewFrameIndex]);

  function commitAnimation(nextFrames: readonly TileAnimationFrame[]): void {
    startTransition(() => {
      props.store.updateSelectedTileAnimation(nextFrames);
    });
  }

  function addFrame(localId: number): void {
    const parsedDuration = Number.parseInt(frameDurationText, 10);

    commitAnimation([
      ...frames,
      {
        tileId: localId,
        durationMs:
          Number.isNaN(parsedDuration) || parsedDuration < 0
            ? DEFAULT_FRAME_DURATION_MS
            : parsedDuration
      }
    ]);
    setSelectedFrameIndex(frames.length);
  }

  function removeSelectedFrame(): void {
    if (selectedFrameIndex === null || !frames[selectedFrameIndex]) {
      return;
    }

    commitAnimation(frames.filter((_, frameIndex) => frameIndex !== selectedFrameIndex));
    setSelectedFrameIndex((currentIndex) => {
      if (currentIndex === null) {
        return null;
      }

      if (frames.length <= 1) {
        return null;
      }

      return Math.max(0, currentIndex - 1);
    });
  }

  function applyFrameDuration(): void {
    if (selectedFrameIndex === null || !frames[selectedFrameIndex]) {
      return;
    }

    const nextDuration = Number.parseInt(frameDurationText, 10);

    if (Number.isNaN(nextDuration) || nextDuration < 0) {
      setFrameDurationText(String(frames[selectedFrameIndex].durationMs));
      return;
    }

    commitAnimation(
      frames.map((frame, frameIndex) =>
        frameIndex === selectedFrameIndex
          ? {
              ...frame,
              durationMs: nextDuration
            }
          : { ...frame }
      )
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-6 py-8">
      <div
        ref={dialogRef}
        className="flex h-[560px] w-[840px] flex-col border border-slate-700 bg-slate-900 shadow-[0_18px_60px_rgba(2,6,23,0.7)] outline-none"
        role="dialog"
        tabIndex={-1}
        aria-modal="true"
        aria-label={t("action.tileAnimationEditor")}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            props.onClose();
            return;
          }

          if (
            (event.key === "Delete" || event.key === "Backspace") &&
            !isEditableElement(event.target)
          ) {
            event.preventDefault();
            removeSelectedFrame();
          }
        }}
      >
        <div className="flex items-center gap-3 border-b border-slate-700 px-4 py-2 text-sm">
          <span className="text-slate-200">{t("tileAnimationEditor.frameDuration")}</span>
          <input
            className="h-8 w-24 border border-slate-600 bg-slate-950 px-2 text-sm text-slate-100 outline-none"
            inputMode="numeric"
            type="number"
            value={frameDurationText}
            onChange={(event) => {
              setFrameDurationText(event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key !== "Enter") {
                return;
              }

              event.preventDefault();
              applyFrameDuration();
            }}
          />
          <span className="text-xs text-slate-400">{t("tileAnimationEditor.ms")}</span>
          <button
            className="h-8 border border-slate-600 bg-slate-800 px-3 text-sm text-slate-100 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={selectedFrameIndex === null}
            type="button"
            onClick={applyFrameDuration}
          >
            {t("common.apply")}
          </button>
          <div className="min-w-0 flex-1" />
          <select
            className="h-8 border border-slate-600 bg-slate-950 px-2 text-sm text-slate-100 outline-none"
            value={String(zoom)}
            onChange={(event) => {
              setZoom(Number(event.target.value));
            }}
          >
            {TILESET_VIEW_ZOOM_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {Math.round(option * 100)} %
              </option>
            ))}
          </select>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-[220px_minmax(0,1fr)]">
          <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_160px] border-r border-slate-700">
            <div className="min-h-0 overflow-auto bg-slate-950">
              {frames.length ? (
                <div className="divide-y divide-slate-800">
                  {frames.map((frame, frameIndex) => {
                    const isSelected = selectedFrameIndex === frameIndex;

                    return (
                      <button
                        key={`${frameIndex}:${frame.tileId}:${frame.durationMs}`}
                        draggable
                        className={`flex w-full items-center gap-3 px-3 py-2 text-left transition ${
                          isSelected ? "bg-slate-800 text-slate-50" : "text-slate-200 hover:bg-slate-900"
                        }`}
                        type="button"
                        onClick={() => {
                          setSelectedFrameIndex(frameIndex);
                          setFrameDurationText(String(frame.durationMs));
                        }}
                        onDragStart={() => {
                          setDragFrameIndex(frameIndex);
                        }}
                        onDragEnd={() => {
                          setDragFrameIndex(null);
                        }}
                        onDragOver={(event) => {
                          event.preventDefault();
                        }}
                        onDrop={(event) => {
                          event.preventDefault();

                          if (dragFrameIndex === null || dragFrameIndex === frameIndex) {
                            return;
                          }

                          commitAnimation(reorderAnimationFrames(frames, dragFrameIndex, frameIndex));
                          setSelectedFrameIndex(frameIndex);
                          setDragFrameIndex(null);
                        }}
                      >
                        <TilePreview localId={frame.tileId} tileset={props.tileset} />
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
              ) : (
                <div className="flex h-full items-center justify-center px-4 text-center text-sm text-slate-400">
                  {t("tileAnimationEditor.noFrames")}
                </div>
              )}
            </div>

            <div className="flex items-center justify-center border-t border-slate-700 bg-slate-900 px-4 py-4">
              {previewTileLocalId !== undefined ? (
                <div className="flex h-full w-full flex-col items-center justify-center gap-3 border border-slate-700 bg-slate-950 text-slate-100">
                  <TilePreview localId={previewTileLocalId} tileset={props.tileset} />
                  <span className="text-xs text-slate-400">{t("tileAnimationEditor.preview")}</span>
                </div>
              ) : (
                <div className="flex h-full w-full items-center justify-center border border-slate-700 bg-slate-950 text-sm text-slate-400">
                  {t("tileAnimationEditor.preview")}
                </div>
              )}
            </div>
          </div>

          <div className="min-h-0 overflow-auto bg-[#b8b8b8] p-3">
            {props.tileset.kind === "image" && imageColumns ? (
              <div
                className="inline-grid border border-slate-500/20 bg-transparent"
                style={{
                  gridTemplateColumns: `repeat(${imageColumns}, ${props.tileset.tileWidth * zoom}px)`,
                  gridAutoRows: `${props.tileset.tileHeight * zoom}px`
                }}
              >
                {tileIds.map((localId) => {
                  const isSelected = sourceLocalId === localId;

                  return (
                    <button
                      key={`${props.tileset.id}:${localId}`}
                      className={`relative border border-slate-500/10 bg-transparent ${
                        isSelected ? "z-10 ring-2 ring-blue-500 ring-inset" : ""
                      }`}
                      style={{
                        width: `${props.tileset.tileWidth * zoom}px`,
                        height: `${props.tileset.tileHeight * zoom}px`
                      }}
                      type="button"
                      onClick={() => {
                        setSourceLocalId(localId);
                      }}
                      onDoubleClick={() => {
                        addFrame(localId);
                      }}
                    >
                      <span
                        className="block"
                        style={buildImageTilesetTileStyle(props.tileset, localId, zoom)}
                      />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap items-start gap-1">
                {tileIds.map((localId) => {
                  const isSelected = sourceLocalId === localId;

                  return (
                    <button
                      key={`${props.tileset.id}:${localId}`}
                      className={`flex items-center justify-center border bg-slate-900/20 p-1 ${
                        isSelected ? "ring-2 ring-blue-500 ring-inset" : "border-slate-500/20"
                      }`}
                      type="button"
                      onClick={() => {
                        setSourceLocalId(localId);
                      }}
                      onDoubleClick={() => {
                        addFrame(localId);
                      }}
                    >
                      <span
                        className="block"
                        style={
                          buildImageCollectionTileStyle(props.tileset, localId, zoom) ?? {
                            width: `${props.tileset.tileWidth * zoom}px`,
                            height: `${props.tileset.tileHeight * zoom}px`,
                            backgroundColor: "#64748b"
                          }
                        }
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-700 px-4 py-3">
          <button
            className="h-8 border border-slate-600 bg-slate-800 px-3 text-sm text-slate-100 transition hover:bg-slate-700"
            type="button"
            onClick={props.onClose}
          >
            {t("action.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
