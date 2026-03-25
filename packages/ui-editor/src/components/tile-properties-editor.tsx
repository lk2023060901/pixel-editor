"use client";

import type { EditorController } from "@pixel-editor/app-services";
import {
  createProperty,
  type PrimitivePropertyType,
  type PropertyDefinition,
  type TilesetDefinition
} from "@pixel-editor/domain";
import { useI18n } from "@pixel-editor/i18n/client";
import { startTransition, useEffect, useState } from "react";

import { getPropertyTypeLabel } from "./i18n-helpers";
import { SelectField, TextField } from "./editor-fields";
import { TilePreview } from "./tile-preview";

type EditablePropertyType = Exclude<PrimitivePropertyType, "object">;

interface PropertyDraft {
  name: string;
  type: EditablePropertyType;
  value: string;
}

function createPropertyDraft(property?: PropertyDefinition): PropertyDraft {
  if (!property || property.type === "object" || property.type === "class" || property.type === "enum") {
    return {
      name: property?.name ?? "",
      type: "string",
      value: property ? String(property.value) : ""
    };
  }

  if (property.type === "bool") {
    return {
      name: property.name,
      type: property.type,
      value: property.value ? "true" : "false"
    };
  }

  return {
    name: property.name,
    type: property.type,
    value: String(property.value)
  };
}

function parseDraft(draft: PropertyDraft): PropertyDefinition | undefined {
  const nextName = draft.name.trim();

  if (!nextName) {
    return undefined;
  }

  if (draft.type === "bool") {
    return createProperty(nextName, draft.type, draft.value === "true");
  }

  if (draft.type === "int") {
    const value = Number.parseInt(draft.value, 10);

    if (Number.isNaN(value)) {
      return undefined;
    }

    return createProperty(nextName, draft.type, value);
  }

  if (draft.type === "float") {
    const value = Number.parseFloat(draft.value);

    if (Number.isNaN(value)) {
      return undefined;
    }

    return createProperty(nextName, draft.type, value);
  }

  return createProperty(nextName, draft.type, draft.value);
}

function PropertyValueField(props: {
  draft: PropertyDraft;
  onChange: (draft: PropertyDraft) => void;
}) {
  const { t } = useI18n();

  if (props.draft.type === "bool") {
    return (
      <SelectField
        label={t("common.value")}
        value={props.draft.value}
        options={[
          { label: t("common.true"), value: "true" },
          { label: t("common.false"), value: "false" }
        ]}
        onChange={(value) => {
          props.onChange({
            ...props.draft,
            value
          });
        }}
      />
    );
  }

  return (
    <TextField
      label={t("common.value")}
      value={props.draft.value}
      onChange={(value) => {
        props.onChange({
          ...props.draft,
          value
        });
      }}
    />
  );
}

function EditablePropertyRow(props: {
  property: PropertyDefinition;
  store: EditorController;
}) {
  const { t } = useI18n();
  const supportedPropertyTypes: Array<{ label: string; value: EditablePropertyType }> = [
    { label: t("propertyType.string"), value: "string" },
    { label: t("propertyType.int"), value: "int" },
    { label: t("propertyType.float"), value: "float" },
    { label: t("propertyType.bool"), value: "bool" },
    { label: t("propertyType.color"), value: "color" },
    { label: t("propertyType.file"), value: "file" }
  ];
  const [draft, setDraft] = useState(() => createPropertyDraft(props.property));

  useEffect(() => {
    setDraft(createPropertyDraft(props.property));
  }, [props.property]);

  const isEditable =
    props.property.type !== "object" &&
    props.property.type !== "class" &&
    props.property.type !== "enum";

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
      {isEditable ? (
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label={t("common.name")}
              value={draft.name}
              onChange={(value) => {
                setDraft((current) => ({ ...current, name: value }));
              }}
            />
            <SelectField
              label={t("common.type")}
              value={draft.type}
              options={supportedPropertyTypes}
              onChange={(value) => {
                setDraft((current) => ({
                  ...current,
                  type: value as EditablePropertyType
                }));
              }}
            />
          </div>
          <PropertyValueField draft={draft} onChange={setDraft} />
          <div className="flex justify-end gap-2">
            <button
              className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-slate-500"
              onClick={() => {
                startTransition(() => {
                  props.store.removeSelectedTileProperty(props.property.name);
                });
              }}
            >
              {t("common.remove")}
            </button>
            <button
              className="rounded-xl border border-emerald-500/50 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-100 transition hover:bg-emerald-500/20"
              onClick={() => {
                const nextProperty = parseDraft(draft);

                if (!nextProperty) {
                  return;
                }

                startTransition(() => {
                  props.store.upsertSelectedTileProperty(nextProperty, props.property.name);
                });
              }}
            >
              {t("tileProperties.saveProperty")}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <p className="text-sm text-slate-100">{props.property.name}</p>
            <p className="mt-1 text-xs text-slate-400">
              {t("tileProperties.unsupportedReadonly", {
                type: getPropertyTypeLabel(props.property.type, t)
              })}
            </p>
          </div>
          <button
            className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-slate-500"
            onClick={() => {
              startTransition(() => {
                props.store.removeSelectedTileProperty(props.property.name);
              });
            }}
          >
            {t("common.remove")}
          </button>
        </div>
      )}
    </div>
  );
}

export function TilePropertiesEditor(props: {
  tileset: TilesetDefinition;
  selectedLocalId: number | null;
  store: EditorController;
}) {
  const { t } = useI18n();
  const supportedPropertyTypes: Array<{ label: string; value: EditablePropertyType }> = [
    { label: t("propertyType.string"), value: "string" },
    { label: t("propertyType.int"), value: "int" },
    { label: t("propertyType.float"), value: "float" },
    { label: t("propertyType.bool"), value: "bool" },
    { label: t("propertyType.color"), value: "color" },
    { label: t("propertyType.file"), value: "file" }
  ];
  const selectedLocalId = props.selectedLocalId;
  const selectedTile =
    selectedLocalId !== null ? props.tileset.tiles.find((tile) => tile.localId === selectedLocalId) : undefined;
  const [className, setClassName] = useState(selectedTile?.className ?? "");
  const [newPropertyDraft, setNewPropertyDraft] = useState<PropertyDraft>({
    name: "",
    type: "string",
    value: ""
  });

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

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
        <div className="grid gap-3">
          <TextField
            label={t("common.class")}
            value={className}
            onChange={setClassName}
          />
          <div className="flex justify-end">
            <button
              className="rounded-xl border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-100 transition hover:bg-amber-500/20"
              onClick={() => {
                startTransition(() => {
                  props.store.updateSelectedTileMetadata({
                    className: className.trim() || null
                  });
                });
              }}
            >
              {t("tileProperties.applyMetadata")}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs tracking-[0.18em] text-slate-500 uppercase">
          {t("tileProperties.customProperties")}
        </p>
        {selectedTile.properties.length === 0 && (
          <p className="text-sm text-slate-400">{t("tileProperties.noCustomProperties")}</p>
        )}
        {selectedTile.properties.map((property) => (
          <EditablePropertyRow
            key={property.name}
            property={property}
            store={props.store}
          />
        ))}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
        <p className="text-xs tracking-[0.18em] text-slate-500 uppercase">
          {t("tileProperties.addProperty")}
        </p>
        <div className="mt-3 grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label={t("common.name")}
              value={newPropertyDraft.name}
              onChange={(value) => {
                setNewPropertyDraft((current) => ({ ...current, name: value }));
              }}
            />
            <SelectField
              label={t("common.type")}
              value={newPropertyDraft.type}
              options={supportedPropertyTypes}
              onChange={(value) => {
                setNewPropertyDraft((current) => ({
                  ...current,
                  type: value as EditablePropertyType
                }));
              }}
            />
          </div>
          <PropertyValueField draft={newPropertyDraft} onChange={setNewPropertyDraft} />
          <div className="flex justify-end">
            <button
              className="rounded-xl border border-sky-500/50 bg-sky-500/10 px-3 py-2 text-xs font-medium text-sky-100 transition hover:bg-sky-500/20"
              onClick={() => {
                const nextProperty = parseDraft(newPropertyDraft);

                if (!nextProperty) {
                  return;
                }

                startTransition(() => {
                  props.store.upsertSelectedTileProperty(nextProperty);
                });
                setNewPropertyDraft({
                  name: "",
                  type: "string",
                  value: ""
                });
              }}
            >
              {t("tileProperties.addProperty")}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-3 text-xs text-slate-400">
        {t("tileProperties.primitiveHint")}
      </div>
    </div>
  );
}
