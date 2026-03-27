"use client";

import type {
  EditorController,
  TilesetDetailsViewState
} from "@pixel-editor/app-services/ui";
import type {
  TilesetFillMode,
  TilesetObjectAlignment,
  TilesetTileRenderSize
} from "@pixel-editor/app-services/ui-tiles";
import { useI18n } from "@pixel-editor/i18n/client";
import { startTransition, useEffect, useState } from "react";

import {
  getTilesetFillModeLabel,
  getTilesetObjectAlignmentLabel,
  getTilesetRenderSizeLabel
} from "./i18n-helpers";
import { NumberField, SelectField, TextField } from "./editor-fields";

interface TilesetDetailsDraft {
  name: string;
  tileWidth: string;
  tileHeight: string;
  tileOffsetX: string;
  tileOffsetY: string;
  objectAlignment: TilesetObjectAlignment;
  tileRenderSize: TilesetTileRenderSize;
  fillMode: TilesetFillMode;
  imagePath: string;
  imageWidth: string;
  imageHeight: string;
  margin: string;
  spacing: string;
  columns: string;
}

function createDetailsDraft(tileset: TilesetDetailsViewState): TilesetDetailsDraft {
  return {
    name: tileset.name,
    tileWidth: String(tileset.tileWidth),
    tileHeight: String(tileset.tileHeight),
    tileOffsetX: String(tileset.tileOffsetX),
    tileOffsetY: String(tileset.tileOffsetY),
    objectAlignment: tileset.objectAlignment,
    tileRenderSize: tileset.tileRenderSize,
    fillMode: tileset.fillMode,
    imagePath: tileset.kind === "image" ? tileset.imagePath : "",
    imageWidth: tileset.kind === "image" && tileset.imageWidth !== undefined ? String(tileset.imageWidth) : "",
    imageHeight:
      tileset.kind === "image" && tileset.imageHeight !== undefined
        ? String(tileset.imageHeight)
        : "",
    margin: tileset.kind === "image" ? String(tileset.margin) : "0",
    spacing: tileset.kind === "image" ? String(tileset.spacing) : "0",
    columns: tileset.kind === "image" && tileset.columns !== undefined ? String(tileset.columns) : ""
  };
}

function parseInteger(value: string): number | undefined {
  if (!value.trim()) {
    return undefined;
  }

  const parsedValue = Number.parseInt(value, 10);

  return Number.isNaN(parsedValue) ? undefined : parsedValue;
}

export function TilesetDetailsForm(props: {
  viewState: TilesetDetailsViewState;
  store: EditorController;
}) {
  const { t } = useI18n();
  const objectAlignmentOptions: Array<{ label: string; value: TilesetObjectAlignment }> = ([
    "unspecified",
    "topleft",
    "top",
    "topright",
    "left",
    "center",
    "right",
    "bottomleft",
    "bottom",
    "bottomright"
  ] as const).map((value) => ({
    label: getTilesetObjectAlignmentLabel(value, t),
    value
  }));
  const tileRenderSizeOptions: Array<{ label: string; value: TilesetTileRenderSize }> = ([
    "tile",
    "grid"
  ] as const).map((value) => ({
    label: getTilesetRenderSizeLabel(value, t),
    value
  }));
  const fillModeOptions: Array<{ label: string; value: TilesetFillMode }> = ([
    "stretch",
    "preserve-aspect-fit"
  ] as const).map((value) => ({
    label: getTilesetFillModeLabel(value, t),
    value
  }));
  const [draft, setDraft] = useState(() => createDetailsDraft(props.viewState));

  useEffect(() => {
    setDraft(createDetailsDraft(props.viewState));
  }, [props.viewState]);

  return (
    <div className="mt-6 space-y-4 border-t border-slate-800 pt-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs tracking-[0.18em] text-slate-500 uppercase">
          {t("tilesetDetails.parameters")}
        </p>
        <button
          className="rounded-xl border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-100 transition hover:bg-amber-500/20"
          onClick={() => {
            const tileWidth = parseInteger(draft.tileWidth);
            const tileHeight = parseInteger(draft.tileHeight);
            const tileOffsetX = parseInteger(draft.tileOffsetX);
            const tileOffsetY = parseInteger(draft.tileOffsetY);
            const imageWidth = parseInteger(draft.imageWidth);
            const imageHeight = parseInteger(draft.imageHeight);
            const margin = parseInteger(draft.margin);
            const spacing = parseInteger(draft.spacing);
            const columns = draft.columns.trim() ? parseInteger(draft.columns) : null;

            if (
              tileWidth === undefined ||
              tileHeight === undefined ||
              tileOffsetX === undefined ||
              tileOffsetY === undefined
            ) {
              return;
            }

            startTransition(() => {
              const nextPatch = {
                name: draft.name.trim() || props.viewState.name,
                tileWidth,
                tileHeight,
                tileOffsetX,
                tileOffsetY,
                objectAlignment: draft.objectAlignment,
                tileRenderSize: draft.tileRenderSize,
                fillMode: draft.fillMode
              };

              props.store.updateActiveTilesetDetails({
                ...nextPatch,
                ...(props.viewState.kind === "image"
                  ? {
                      ...(draft.imagePath.trim()
                        ? { imagePath: draft.imagePath.trim() }
                        : {}),
                      ...(imageWidth !== undefined ? { imageWidth } : {}),
                      ...(imageHeight !== undefined ? { imageHeight } : {}),
                      ...(margin !== undefined ? { margin } : {}),
                      ...(spacing !== undefined ? { spacing } : {}),
                      ...(columns !== undefined ? { columns } : {})
                    }
                  : {})
              });
            });
          }}
        >
          {t("tilesetDetails.applyChanges")}
        </button>
      </div>

      <div className="grid gap-3">
        <TextField
          label={t("common.name")}
          value={draft.name}
          onChange={(value) => {
            setDraft((current) => ({ ...current, name: value }));
          }}
        />
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            label={t("common.tileWidth")}
            value={draft.tileWidth}
            onChange={(value) => {
              setDraft((current) => ({ ...current, tileWidth: value }));
            }}
          />
          <NumberField
            label={t("common.tileHeight")}
            value={draft.tileHeight}
            onChange={(value) => {
              setDraft((current) => ({ ...current, tileHeight: value }));
            }}
          />
          <NumberField
            label={t("tilesetDetails.tileOffsetX")}
            value={draft.tileOffsetX}
            onChange={(value) => {
              setDraft((current) => ({ ...current, tileOffsetX: value }));
            }}
          />
          <NumberField
            label={t("tilesetDetails.tileOffsetY")}
            value={draft.tileOffsetY}
            onChange={(value) => {
              setDraft((current) => ({ ...current, tileOffsetY: value }));
            }}
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <SelectField
            label={t("tilesetDetails.objectAlignment")}
            value={draft.objectAlignment}
            options={objectAlignmentOptions}
            onChange={(value) => {
              setDraft((current) => ({
                ...current,
                objectAlignment: value as TilesetObjectAlignment
              }));
            }}
          />
          <SelectField
            label={t("tilesetDetails.renderSize")}
            value={draft.tileRenderSize}
            options={tileRenderSizeOptions}
            onChange={(value) => {
              setDraft((current) => ({
                ...current,
                tileRenderSize: value as TilesetTileRenderSize
              }));
            }}
          />
          <SelectField
            label={t("tilesetDetails.fillMode")}
            value={draft.fillMode}
            options={fillModeOptions}
            onChange={(value) => {
              setDraft((current) => ({
                ...current,
                fillMode: value as TilesetFillMode
              }));
            }}
          />
        </div>

        {props.viewState.kind === "image" && (
          <>
            <TextField
              label={t("common.imagePath")}
              value={draft.imagePath}
              onChange={(value) => {
                setDraft((current) => ({ ...current, imagePath: value }));
              }}
            />
            <div className="grid grid-cols-2 gap-3">
              <NumberField
                label={t("common.imageWidth")}
                value={draft.imageWidth}
                onChange={(value) => {
                  setDraft((current) => ({ ...current, imageWidth: value }));
                }}
              />
              <NumberField
                label={t("common.imageHeight")}
                value={draft.imageHeight}
                onChange={(value) => {
                  setDraft((current) => ({ ...current, imageHeight: value }));
                }}
              />
              <NumberField
                label={t("common.margin")}
                value={draft.margin}
                onChange={(value) => {
                  setDraft((current) => ({ ...current, margin: value }));
                }}
              />
              <NumberField
                label={t("common.spacing")}
                value={draft.spacing}
                onChange={(value) => {
                  setDraft((current) => ({ ...current, spacing: value }));
                }}
              />
              <NumberField
                label={t("common.columns")}
                value={draft.columns}
                onChange={(value) => {
                  setDraft((current) => ({ ...current, columns: value }));
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
