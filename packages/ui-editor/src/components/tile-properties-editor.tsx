"use client";

import type {
  TileMetadataDraft,
  TilePropertiesEditorViewState
} from "@pixel-editor/app-services/ui";
import {
  createTileMetadataDraft,
  resolveTileMetadataDraftCommit
} from "@pixel-editor/app-services/ui";
import type { TilePropertiesEditorStore } from "@pixel-editor/app-services/ui-store";
import { useI18n } from "@pixel-editor/i18n/client";
import { startTransition, useEffect, useState } from "react";

import { CustomPropertiesEditor } from "./custom-properties-editor";
import {
  PropertyBrowserContent,
  PropertyBrowserGroup,
  PropertyBrowserReadOnlyRow,
  PropertyBrowserTextRow
} from "./property-browser";

export function TilePropertiesEditor(props: {
  viewState: TilePropertiesEditorViewState;
  store: TilePropertiesEditorStore;
}) {
  const { t } = useI18n();
  const selectedTile = props.viewState.tile;
  const selectedLocalId = selectedTile?.localId ?? null;
  const [draft, setDraft] = useState<TileMetadataDraft>(() =>
    createTileMetadataDraft(selectedTile)
  );

  useEffect(() => {
    setDraft(createTileMetadataDraft(selectedTile));
  }, [selectedTile, selectedLocalId]);

  if (selectedLocalId === null || !selectedTile) {
    return (
      <div className="px-3 py-3 text-sm text-slate-400">{t("tileProperties.emptyState")}</div>
    );
  }

  const activeTile = selectedTile;

  function commitTileMetadata(input?: {
    className?: string;
    probability?: string;
  }): void {
    const resolution = resolveTileMetadataDraftCommit({
      draft: {
        className: input?.className ?? draft.className,
        probability: input?.probability ?? draft.probability
      },
      tile: activeTile
    });

    if (resolution.patch === undefined) {
      setDraft(resolution.nextDraft);
      return;
    }

    const patch = resolution.patch;

    startTransition(() => {
      props.store.updateSelectedTileMetadata(patch);
    });
  }

  return (
    <PropertyBrowserContent>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <PropertyBrowserGroup title={t("tileProperties.title")}>
          <PropertyBrowserReadOnlyRow label={t("common.id")} value={String(selectedLocalId)} />
          <PropertyBrowserTextRow
            label={t("common.class")}
            value={draft.className}
            onCommit={() => {
              commitTileMetadata();
            }}
            onChange={(className) => {
              setDraft((current) => ({ ...current, className }));
            }}
          />
          <PropertyBrowserTextRow
            label={t("common.probability")}
            type="number"
            value={draft.probability}
            onCommit={() => {
              commitTileMetadata();
            }}
            onChange={(probability) => {
              setDraft((current) => ({ ...current, probability }));
            }}
          />
          {selectedTile.imageSource ? (
            <PropertyBrowserReadOnlyRow
              label={t("common.image")}
              value={selectedTile.imageSource}
            />
          ) : null}
        </PropertyBrowserGroup>

        <div className="border-t border-slate-700">
          <CustomPropertiesEditor
            className="bg-slate-950"
            properties={selectedTile.properties}
            objectReferenceOptions={props.viewState.objectReferenceOptions}
            propertyTypes={props.viewState.propertyTypes}
            suggestedProperties={selectedTile.suggestedProperties}
            onRemove={(propertyName) => {
              props.store.removeSelectedTileProperty(propertyName);
            }}
            onUpsert={(property, previousName) => {
              props.store.upsertSelectedTileProperty(property, previousName);
            }}
            showHint={false}
          />
        </div>
      </div>
    </PropertyBrowserContent>
  );
}
