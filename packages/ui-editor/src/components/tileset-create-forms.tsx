"use client";

import {
  buildCreateCollectionTilesetInput,
  buildCreateSpriteTilesetInput,
  createCollectionTilesetDraft,
  createSpriteTilesetDraft,
  updateCollectionTilesetDraftField,
  updateSpriteTilesetDraftField
} from "@pixel-editor/app-services/ui";
import type { TilesetCreateFormsStore } from "@pixel-editor/app-services/ui-store";
import { useI18n } from "@pixel-editor/i18n/client";
import { startTransition, useState } from "react";

import { NumberField, TextAreaField, TextField } from "./editor-fields";

export function TilesetCreateForms(props: {
  store: TilesetCreateFormsStore;
}) {
  const { t } = useI18n();
  const [spriteDraft, setSpriteDraft] = useState(() =>
    createSpriteTilesetDraft(t("tilesetCreate.defaultSpriteName"))
  );
  const [collectionDraft, setCollectionDraft] = useState(() =>
    createCollectionTilesetDraft(t("tilesetCreate.defaultCollectionName"))
  );

  return (
    <div className="mt-6 space-y-4 border-t border-slate-800 pt-4">
      <div>
        <p className="text-xs tracking-[0.18em] text-slate-500 uppercase">
          {t("tilesetCreate.spriteTitle")}
        </p>
        <div className="mt-3 grid gap-3">
          <TextField
            label={t("common.name")}
            value={spriteDraft.name}
            onChange={(value) => {
              setSpriteDraft((current) =>
                updateSpriteTilesetDraftField({
                  draft: current,
                  field: "name",
                  value
                })
              );
            }}
          />
          <TextField
            label={t("common.imagePath")}
            value={spriteDraft.imagePath}
            onChange={(value) => {
              setSpriteDraft((current) =>
                updateSpriteTilesetDraftField({
                  draft: current,
                  field: "imagePath",
                  value
                })
              );
            }}
          />
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label={t("common.imageWidth")}
              value={spriteDraft.imageWidth}
              onChange={(value) => {
                setSpriteDraft((current) =>
                  updateSpriteTilesetDraftField({
                    draft: current,
                    field: "imageWidth",
                    value
                  })
                );
              }}
            />
            <NumberField
              label={t("common.imageHeight")}
              value={spriteDraft.imageHeight}
              onChange={(value) => {
                setSpriteDraft((current) =>
                  updateSpriteTilesetDraftField({
                    draft: current,
                    field: "imageHeight",
                    value
                  })
                );
              }}
            />
            <NumberField
              label={t("common.tileWidth")}
              value={spriteDraft.tileWidth}
              onChange={(value) => {
                setSpriteDraft((current) =>
                  updateSpriteTilesetDraftField({
                    draft: current,
                    field: "tileWidth",
                    value
                  })
                );
              }}
            />
            <NumberField
              label={t("common.tileHeight")}
              value={spriteDraft.tileHeight}
              onChange={(value) => {
                setSpriteDraft((current) =>
                  updateSpriteTilesetDraftField({
                    draft: current,
                    field: "tileHeight",
                    value
                  })
                );
              }}
            />
            <NumberField
              label={t("common.columns")}
              value={spriteDraft.columns}
              onChange={(value) => {
                setSpriteDraft((current) =>
                  updateSpriteTilesetDraftField({
                    draft: current,
                    field: "columns",
                    value
                  })
                );
              }}
            />
          </div>
          <button
            className="rounded-xl border border-emerald-500/50 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-500/20"
            onClick={() => {
              const input = buildCreateSpriteTilesetInput({
                draft: spriteDraft,
                untitledName: t("tilesetCreate.untitledTileset")
              });

              if (!input) {
                return;
              }

              startTransition(() => {
                props.store.createSpriteSheetTileset(input);
              });
            }}
          >
            {t("tilesetCreate.createSprite")}
          </button>
        </div>
      </div>

      <div>
        <p className="text-xs tracking-[0.18em] text-slate-500 uppercase">
          {t("tilesetCreate.collectionTitle")}
        </p>
        <div className="mt-3 grid gap-3">
          <TextField
            label={t("common.name")}
            value={collectionDraft.name}
            onChange={(value) => {
              setCollectionDraft((current) =>
                updateCollectionTilesetDraftField({
                  draft: current,
                  field: "name",
                  value
                })
              );
            }}
          />
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label={t("common.tileWidth")}
              value={collectionDraft.tileWidth}
              onChange={(value) => {
                setCollectionDraft((current) =>
                  updateCollectionTilesetDraftField({
                    draft: current,
                    field: "tileWidth",
                    value
                  })
                );
              }}
            />
            <NumberField
              label={t("common.tileHeight")}
              value={collectionDraft.tileHeight}
              onChange={(value) => {
                setCollectionDraft((current) =>
                  updateCollectionTilesetDraftField({
                    draft: current,
                    field: "tileHeight",
                    value
                  })
                );
              }}
            />
          </div>
          <TextAreaField
            label={t("tilesetCreate.imageSources")}
            value={collectionDraft.imageSources}
            onChange={(value) => {
              setCollectionDraft((current) =>
                updateCollectionTilesetDraftField({
                  draft: current,
                  field: "imageSources",
                  value
                })
              );
            }}
          />
          <button
            className="rounded-xl border border-sky-500/50 bg-sky-500/10 px-3 py-2 text-sm font-medium text-sky-100 transition hover:bg-sky-500/20"
            onClick={() => {
              const input = buildCreateCollectionTilesetInput({
                draft: collectionDraft,
                untitledName: t("tilesetCreate.untitledCollection")
              });

              if (!input) {
                return;
              }

              startTransition(() => {
                props.store.createImageCollectionTileset(input);
              });
            }}
          >
            {t("tilesetCreate.createCollection")}
          </button>
        </div>
      </div>
    </div>
  );
}
