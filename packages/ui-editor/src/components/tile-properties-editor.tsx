"use client";

import type {
  EditorController,
  TilePropertiesEditorViewState
} from "@pixel-editor/app-services/ui";
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
  store: EditorController;
}) {
  const { t } = useI18n();
  const selectedTile = props.viewState.tile;
  const selectedLocalId = selectedTile?.localId ?? null;
  const [className, setClassName] = useState(selectedTile?.className ?? "");
  const [probability, setProbability] = useState(String(selectedTile?.probability ?? 1));

  useEffect(() => {
    setClassName(selectedTile?.className ?? "");
    setProbability(String(selectedTile?.probability ?? 1));
  }, [selectedTile?.className, selectedTile?.probability, selectedLocalId]);

  if (selectedLocalId === null || !selectedTile) {
    return (
      <div className="px-3 py-3 text-sm text-slate-400">{t("tileProperties.emptyState")}</div>
    );
  }

  const currentProbability = selectedTile.probability;

  function commitTileMetadata(input?: {
    className?: string;
    probability?: string;
  }): void {
    const nextClassName = input?.className ?? className;
    const nextProbabilityText = input?.probability ?? probability;
    const nextProbability = Number.parseFloat(nextProbabilityText);

    if (Number.isNaN(nextProbability) || nextProbability < 0) {
      setProbability(String(currentProbability));
      return;
    }

    startTransition(() => {
      props.store.updateSelectedTileMetadata({
        className: nextClassName.trim() || null,
        probability: nextProbability
      });
    });
  }

  return (
    <PropertyBrowserContent>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <PropertyBrowserGroup title={t("tileProperties.title")}>
          <PropertyBrowserReadOnlyRow label={t("common.id")} value={String(selectedLocalId)} />
          <PropertyBrowserTextRow
            label={t("common.class")}
            value={className}
            onCommit={() => {
              commitTileMetadata();
            }}
            onChange={setClassName}
          />
          <PropertyBrowserTextRow
            label={t("common.probability")}
            type="number"
            value={probability}
            onCommit={() => {
              commitTileMetadata();
            }}
            onChange={setProbability}
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
