"use client";

import {
  type TileAnimationEditorViewState,
  type EditorController
} from "@pixel-editor/app-services/ui";
import type { TileAnimationFrame } from "@pixel-editor/app-services/ui-tiles";
import { useI18n } from "@pixel-editor/i18n/client";
import { startTransition, useEffect, useRef, useState } from "react";

import { TilePreview } from "./tile-preview";
import {
  buildTileVisualStyle,
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
  viewState: TileAnimationEditorViewState;
  store: EditorController;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [sourceLocalId, setSourceLocalId] = useState<number | null>(props.viewState.selectedLocalId);
  const [selectedFrameIndex, setSelectedFrameIndex] = useState<number | null>(null);
  const [dragFrameIndex, setDragFrameIndex] = useState<number | null>(null);
  const [frameDurationText, setFrameDurationText] = useState(String(DEFAULT_FRAME_DURATION_MS));
  const [previewFrameIndex, setPreviewFrameIndex] = useState(0);
  const frames = props.viewState.frames;
  const previewFrame = frames[previewFrameIndex] ?? frames[0];
  const imageColumns = props.viewState.imageColumns;

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  useEffect(() => {
    setSourceLocalId(props.viewState.selectedLocalId ?? props.viewState.sourceTiles[0]?.localId ?? null);
    setSelectedFrameIndex(null);
    setPreviewFrameIndex(0);
  }, [
    props.viewState.selectedLocalId,
    props.viewState.tilesetId,
    props.viewState.sourceTiles.length
  ]);

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
      ...frames.map((frame) => ({
        tileId: frame.tileId,
        durationMs: frame.durationMs
      })),
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

    commitAnimation(
      frames
        .filter((_, frameIndex) => frameIndex !== selectedFrameIndex)
        .map((frame) => ({
          tileId: frame.tileId,
          durationMs: frame.durationMs
        }))
    );
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
              tileId: frame.tileId,
              durationMs: nextDuration
            }
          : {
              tileId: frame.tileId,
              durationMs: frame.durationMs
            }
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

                          commitAnimation(
                            reorderAnimationFrames(
                              frames.map((frame) => ({
                                tileId: frame.tileId,
                                durationMs: frame.durationMs
                              })),
                              dragFrameIndex,
                              frameIndex
                            )
                          );
                          setSelectedFrameIndex(frameIndex);
                          setDragFrameIndex(null);
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
              ) : (
                <div className="flex h-full items-center justify-center px-4 text-center text-sm text-slate-400">
                  {t("tileAnimationEditor.noFrames")}
                </div>
              )}
            </div>

            <div className="flex items-center justify-center border-t border-slate-700 bg-slate-900 px-4 py-4">
              {previewFrame?.preview ? (
                <div className="flex h-full w-full flex-col items-center justify-center gap-3 border border-slate-700 bg-slate-950 text-slate-100">
                  <TilePreview viewState={previewFrame.preview} />
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
            {props.viewState.tilesetKind === "image" && imageColumns ? (
              <div
                className="inline-grid border border-slate-500/20 bg-transparent"
                style={{
                  gridTemplateColumns: `repeat(${imageColumns}, ${props.viewState.tileWidth * zoom}px)`,
                  gridAutoRows: `${props.viewState.tileHeight * zoom}px`
                }}
              >
                {props.viewState.sourceTiles.map((tile) => {
                  const isSelected = sourceLocalId === tile.localId;

                  return (
                    <button
                      key={`${props.viewState.tilesetId}:${tile.localId}`}
                      className={`relative border border-slate-500/10 bg-transparent ${
                        isSelected ? "z-10 ring-2 ring-blue-500 ring-inset" : ""
                      }`}
                      style={{
                        width: `${props.viewState.tileWidth * zoom}px`,
                        height: `${props.viewState.tileHeight * zoom}px`
                      }}
                      type="button"
                      onClick={() => {
                        setSourceLocalId(tile.localId);
                      }}
                      onDoubleClick={() => {
                        addFrame(tile.localId);
                      }}
                    >
                      <span className="block" style={buildTileVisualStyle(tile.preview, zoom)} />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap items-start gap-1">
                {props.viewState.sourceTiles.map((tile) => {
                  const isSelected = sourceLocalId === tile.localId;

                  return (
                    <button
                      key={`${props.viewState.tilesetId}:${tile.localId}`}
                      className={`flex items-center justify-center border bg-slate-900/20 p-1 ${
                        isSelected ? "ring-2 ring-blue-500 ring-inset" : "border-slate-500/20"
                      }`}
                      type="button"
                      onClick={() => {
                        setSourceLocalId(tile.localId);
                      }}
                      onDoubleClick={() => {
                        addFrame(tile.localId);
                      }}
                    >
                      <span className="block" style={buildTileVisualStyle(tile.preview, zoom)} />
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
