"use client";

import type {
  TilesetDetailsDraft,
  TilesetDetailsViewState
} from "@pixel-editor/app-services/ui";
import {
  buildTilesetDetailsUpdatePatch,
  createTilesetDetailsDraft,
  tilesetFillModeOptions,
  tilesetObjectAlignmentOptions,
  tilesetTileRenderSizeOptions
} from "@pixel-editor/app-services/ui";
import type { TilesetDetailsFormStore } from "@pixel-editor/app-services/ui-store";
import { useI18n } from "@pixel-editor/i18n/client";
import { startTransition, useEffect, useState } from "react";

import {
  getTilesetFillModeLabel,
  getTilesetObjectAlignmentLabel,
  getTilesetRenderSizeLabel
} from "./i18n-helpers";
import { NumberField, SelectField, TextField } from "./editor-fields";

type TilesetObjectAlignment = TilesetDetailsViewState["objectAlignment"];
type TilesetTileRenderSize = TilesetDetailsViewState["tileRenderSize"];
type TilesetFillMode = TilesetDetailsViewState["fillMode"];

export function TilesetDetailsForm(props: {
  viewState: TilesetDetailsViewState;
  store: TilesetDetailsFormStore;
}) {
  const { t } = useI18n();
  const objectAlignmentOptions: Array<{ label: string; value: TilesetObjectAlignment }> =
    tilesetObjectAlignmentOptions.map((value) => ({
      label: getTilesetObjectAlignmentLabel(value, t),
      value
    }));
  const tileRenderSizeOptions: Array<{ label: string; value: TilesetTileRenderSize }> =
    tilesetTileRenderSizeOptions.map((value) => ({
      label: getTilesetRenderSizeLabel(value, t),
      value
    }));
  const fillModeOptions: Array<{ label: string; value: TilesetFillMode }> =
    tilesetFillModeOptions.map((value) => ({
      label: getTilesetFillModeLabel(value, t),
      value
    }));
  const [draft, setDraft] = useState<TilesetDetailsDraft>(() =>
    createTilesetDetailsDraft(props.viewState)
  );

  useEffect(() => {
    setDraft(createTilesetDetailsDraft(props.viewState));
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
            const nextPatch = buildTilesetDetailsUpdatePatch({
              draft,
              viewState: props.viewState
            });

            if (nextPatch === undefined) {
              return;
            }

            startTransition(() => {
              props.store.updateActiveTilesetDetails(nextPatch);
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
