"use client";

import type { EditorController } from "@pixel-editor/app-services";
import type {
  EditorMap,
  PropertyTypeDefinition,
  TilesetDefinition
} from "@pixel-editor/domain";
import { useI18n } from "@pixel-editor/i18n/client";
import { startTransition, useEffect, useState } from "react";

import { CustomPropertiesEditor } from "./custom-properties-editor";
import { TextField } from "./editor-fields";
import { buildObjectReferenceOptions } from "./object-reference-options";
import { TilePreview } from "./tile-preview";

export function TilePropertiesEditor(props: {
  activeMap: EditorMap | undefined;
  propertyTypes: readonly PropertyTypeDefinition[] | undefined;
  tileset: TilesetDefinition;
  selectedLocalId: number | null;
  store: EditorController;
}) {
  const { t } = useI18n();
  const objectReferenceOptions = buildObjectReferenceOptions(props.activeMap);
  const selectedLocalId = props.selectedLocalId;
  const selectedTile =
    selectedLocalId !== null
      ? props.tileset.tiles.find((tile) => tile.localId === selectedLocalId)
      : undefined;
  const [className, setClassName] = useState(selectedTile?.className ?? "");

  useEffect(() => {
    setClassName(selectedTile?.className ?? "");
  }, [selectedTile?.className, selectedLocalId]);

  if (selectedLocalId === null || !selectedTile) {
    return (
      <div className="mt-6 space-y-3 border-t border-slate-800 pt-4">
        <p className="text-xs tracking-[0.18em] text-slate-500 uppercase">
          {t("tileProperties.title")}
        </p>
        <p className="text-sm text-slate-400">{t("tileProperties.emptyState")}</p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4 border-t border-slate-800 pt-4">
      <div className="flex items-center gap-3">
        <TilePreview tileset={props.tileset} localId={selectedLocalId} />
        <div>
          <p className="text-xs tracking-[0.18em] text-slate-500 uppercase">
            {t("tileProperties.title")}
          </p>
          <p className="mt-1 text-sm text-slate-100">
            {t("tileProperties.tileLabel", { localId: selectedLocalId })}
            {selectedTile.imageSource ? ` · ${selectedTile.imageSource}` : ""}
          </p>
        </div>
      </div>

      <div className="border border-slate-800 bg-slate-900/60 p-3">
        <div className="grid gap-3">
          <TextField
            label={t("common.class")}
            value={className}
            onChange={setClassName}
          />
          <div className="flex justify-end">
            <button
              className="border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-100 transition hover:bg-amber-500/20"
              onClick={() => {
                startTransition(() => {
                  props.store.updateSelectedTileMetadata({
                    className: className.trim() || null
                  });
                });
              }}
              type="button"
            >
              {t("tileProperties.applyMetadata")}
            </button>
          </div>
        </div>
      </div>

      <CustomPropertiesEditor
        properties={selectedTile.properties}
        objectReferenceOptions={objectReferenceOptions}
        propertyTypes={props.propertyTypes}
        onRemove={(propertyName) => {
          props.store.removeSelectedTileProperty(propertyName);
        }}
        onUpsert={(property, previousName) => {
          props.store.upsertSelectedTileProperty(property, previousName);
        }}
      />
    </div>
  );
}
