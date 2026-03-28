"use client";

import type { ObjectReferenceOption } from "@pixel-editor/app-services/ui";
import {
  getClassPropertyTypeDefinitionByName,
  getEnumPropertyTypeDefinitionByName,
  type ClassPropertyTypeDefinition,
  type PropertyDefinition,
  type PropertyTypeDefinition,
  type PropertyValue
} from "@pixel-editor/app-services/ui-custom-properties";
import { useI18n } from "@pixel-editor/i18n/client";
import type { RefObject } from "react";

import { NumberField, SelectField, TextField } from "./editor-fields";
import { getPropertyTypeLabel } from "./i18n-helpers";
import {
  PropertyBrowserGroup,
  PropertyBrowserRow,
  PropertyBrowserSelectRow,
  PropertyBrowserTextRow
} from "./property-browser";
import {
  coercePropertyValue,
  getDraftTypeSelectValue,
  isClassPropertyValue,
  type PropertyDraft,
  updateDraftTypeFromValue
} from "./custom-properties-editor-utils";

function getPropertyValueSummary(
  property: PropertyDefinition,
  propertyTypes: readonly PropertyTypeDefinition[],
  objectReferenceOptions: readonly ObjectReferenceOption[],
  t: ReturnType<typeof useI18n>["t"]
): string {
  if (property.type === "bool") {
    return property.value ? t("common.true") : t("common.false");
  }

  if (property.type === "enum") {
    const enumType = getEnumPropertyTypeDefinitionByName(propertyTypes, property.propertyTypeName);

    if (!enumType) {
      return String(property.value);
    }

    if (enumType.storageType === "int") {
      const optionIndex = typeof property.value === "number" ? property.value : -1;
      return enumType.values[optionIndex] ?? String(property.value);
    }

    return String(property.value);
  }

  if (property.type === "object") {
    if (!property.value || typeof property.value !== "object" || !("objectId" in property.value)) {
      return t("common.none");
    }

    const objectId = property.value.objectId;

    return objectReferenceOptions.find((option) => option.id === objectId)?.label ?? objectId;
  }

  if (property.type === "class") {
    return property.propertyTypeName ?? t("common.none");
  }

  return String(property.value);
}

function ClassMemberField(props: {
  classType: ClassPropertyTypeDefinition;
  propertyTypes: readonly PropertyTypeDefinition[];
  objectReferenceOptions: readonly ObjectReferenceOption[];
  members: Record<string, PropertyValue>;
  lineage?: readonly string[];
  onChange: (members: Record<string, PropertyValue>) => void;
}) {
  const { t } = useI18n();
  const lineage = props.lineage ?? [props.classType.name];

  return (
    <div className="grid gap-3">
      {props.classType.fields.map((field) => {
        const currentValue = props.members[field.name];

        if (field.valueType === "bool") {
          return (
            <SelectField
              key={field.name}
              label={field.name}
              value={currentValue === true ? "true" : "false"}
              options={[
                { label: t("common.true"), value: "true" },
                { label: t("common.false"), value: "false" }
              ]}
              onChange={(value) => {
                props.onChange({
                  ...props.members,
                  [field.name]: value === "true"
                });
              }}
            />
          );
        }

        if (field.valueType === "int" || field.valueType === "float") {
          return (
            <NumberField
              key={field.name}
              label={field.name}
              value={String(typeof currentValue === "number" ? currentValue : 0)}
              onChange={(value) => {
                const parsedValue =
                  field.valueType === "int"
                    ? Number.parseInt(value || "0", 10)
                    : Number.parseFloat(value || "0");

                props.onChange({
                  ...props.members,
                  [field.name]: Number.isNaN(parsedValue) ? 0 : parsedValue
                });
              }}
            />
          );
        }

        if (
          field.valueType === "string" ||
          field.valueType === "color" ||
          field.valueType === "file"
        ) {
          return (
            <TextField
              key={field.name}
              label={field.name}
              value={typeof currentValue === "string" ? currentValue : ""}
              onChange={(value) => {
                props.onChange({
                  ...props.members,
                  [field.name]: value
                });
              }}
            />
          );
        }

        if (field.valueType === "enum") {
          const enumType = getEnumPropertyTypeDefinitionByName(
            props.propertyTypes,
            field.propertyTypeName
          );

          if (enumType) {
            const fallbackValue = coercePropertyValue(
              "enum",
              field.propertyTypeName,
              props.propertyTypes,
              currentValue
            );

            return (
              <SelectField
                key={field.name}
                label={field.name}
                value={String(fallbackValue)}
                options={enumType.values.map((value, index) => ({
                  label: value,
                  value: enumType.storageType === "int" ? String(index) : value
                }))}
                onChange={(value) => {
                  props.onChange({
                    ...props.members,
                    [field.name]:
                      enumType.storageType === "int"
                        ? Number.parseInt(value, 10)
                        : value
                  });
                }}
              />
            );
          }
        }

        if (field.valueType === "object") {
          const currentObjectId =
            currentValue !== null &&
            typeof currentValue === "object" &&
            "objectId" in currentValue
              ? currentValue.objectId
              : "";

          return (
            <SelectField
              key={field.name}
              label={field.name}
              value={currentObjectId}
              options={[
                { label: t("common.none"), value: "" },
                ...props.objectReferenceOptions.map((option) => ({
                  label: option.label,
                  value: option.id
                }))
              ]}
              onChange={(value) => {
                props.onChange({
                  ...props.members,
                  [field.name]: value ? { objectId: value as never } : null
                });
              }}
            />
          );
        }

        if (field.valueType === "class") {
          const nestedClassType = getClassPropertyTypeDefinitionByName(
            props.propertyTypes,
            field.propertyTypeName
          );
          const nestedValue = coercePropertyValue(
            "class",
            field.propertyTypeName,
            props.propertyTypes,
            currentValue
          );

          if (
            nestedClassType &&
            !lineage.includes(nestedClassType.name) &&
            isClassPropertyValue(nestedValue)
          ) {
            return (
              <div key={field.name} className="border border-slate-800 bg-slate-950/60 p-3">
                <p className="mb-3 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                  {field.name}
                </p>
                <ClassMemberField
                  classType={nestedClassType}
                  lineage={[...lineage, nestedClassType.name]}
                  members={nestedValue.members}
                  objectReferenceOptions={props.objectReferenceOptions}
                  propertyTypes={props.propertyTypes}
                  onChange={(members) => {
                    props.onChange({
                      ...props.members,
                      [field.name]: { members }
                    });
                  }}
                />
              </div>
            );
          }
        }

        return (
          <div key={field.name} className="border border-slate-800 bg-slate-950/60 px-3 py-2">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
              {field.name}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              {t("propertiesEditor.unsupportedReadonly", {
                type: getPropertyTypeLabel(field.valueType, t)
              })}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export function PropertyDraftEditor(props: {
  draft: PropertyDraft;
  identityLocked?: boolean;
  propertyTypes: readonly PropertyTypeDefinition[];
  objectReferenceOptions: readonly ObjectReferenceOption[];
  supportedPropertyTypes: Array<{ label: string; value: string }>;
  nameInputRef?: RefObject<HTMLInputElement | null>;
  onChange: (draft: PropertyDraft) => void;
}) {
  const { t } = useI18n();
  const identityLocked = props.identityLocked ?? false;
  const enumType = getEnumPropertyTypeDefinitionByName(
    props.propertyTypes,
    props.draft.propertyTypeName
  );
  const classType = getClassPropertyTypeDefinitionByName(
    props.propertyTypes,
    props.draft.propertyTypeName
  );

  return (
    <>
      <PropertyBrowserTextRow
        disabled={identityLocked}
        inputRef={props.nameInputRef}
        label={t("common.name")}
        value={props.draft.name}
        onChange={(value) => {
          props.onChange({
            ...props.draft,
            name: value
          });
        }}
      />
      <PropertyBrowserSelectRow
        disabled={identityLocked}
        label={t("common.type")}
        options={props.supportedPropertyTypes}
        value={getDraftTypeSelectValue(props.draft)}
        onChange={(value) => {
          props.onChange(updateDraftTypeFromValue(props.draft, value, props.propertyTypes));
        }}
      />

      {props.draft.type === "class" && classType && props.draft.classMembers ? (
        <PropertyBrowserRow label={t("common.value")} multiLine>
          <div className="p-2">
            <ClassMemberField
              classType={classType}
              members={props.draft.classMembers}
              objectReferenceOptions={props.objectReferenceOptions}
              propertyTypes={props.propertyTypes}
              onChange={(members) => {
                props.onChange({
                  ...props.draft,
                  classMembers: members
                });
              }}
            />
          </div>
        </PropertyBrowserRow>
      ) : null}

      {props.draft.type === "object" ? (
        <PropertyBrowserSelectRow
          label={t("common.value")}
          options={[
            { label: t("common.none"), value: "" },
            ...props.objectReferenceOptions.map((option) => ({
              label: option.label,
              value: option.id
            }))
          ]}
          value={props.draft.value}
          onChange={(value) => {
            props.onChange({
              ...props.draft,
              value
            });
          }}
        />
      ) : null}

      {props.draft.type === "enum" && enumType ? (
        <PropertyBrowserSelectRow
          label={t("common.value")}
          options={enumType.values.map((value, index) => ({
            label: value,
            value: enumType.storageType === "int" ? String(index) : value
          }))}
          value={props.draft.value}
          onChange={(value) => {
            props.onChange({
              ...props.draft,
              value
            });
          }}
        />
      ) : null}

      {props.draft.type === "bool" ? (
        <PropertyBrowserSelectRow
          label={t("common.value")}
          options={[
            { label: t("common.true"), value: "true" },
            { label: t("common.false"), value: "false" }
          ]}
          value={props.draft.value}
          onChange={(value) => {
            props.onChange({
              ...props.draft,
              value
            });
          }}
        />
      ) : null}

      {props.draft.type === "int" || props.draft.type === "float" ? (
        <PropertyBrowserTextRow
          label={t("common.value")}
          type="number"
          value={props.draft.value}
          onChange={(value) => {
            props.onChange({
              ...props.draft,
              value
            });
          }}
        />
      ) : null}

      {props.draft.type === "string" ||
      props.draft.type === "color" ||
      props.draft.type === "file" ? (
        <PropertyBrowserTextRow
          label={t("common.value")}
          value={props.draft.value}
          onChange={(value) => {
            props.onChange({
              ...props.draft,
              value
            });
          }}
        />
      ) : null}

      {props.draft.type === "enum" && !enumType ? (
        <PropertyBrowserRow label={t("common.value")} multiLine>
          <p className="px-2 py-2 text-xs text-slate-400">
            {t("propertiesEditor.unsupportedReadonly", {
              type: getPropertyTypeLabel("enum", t)
            })}
          </p>
        </PropertyBrowserRow>
      ) : null}
    </>
  );
}

export function PropertyListRow(props: {
  property: PropertyDefinition;
  explicit: boolean;
  selected: boolean;
  propertyTypes: readonly PropertyTypeDefinition[];
  objectReferenceOptions: readonly ObjectReferenceOption[];
  onSelect: () => void;
}) {
  const { t } = useI18n();

  return (
    <button
      className={`grid w-full grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-3 border-b border-slate-800 px-2 py-1.5 text-left transition last:border-b-0 ${
        props.selected ? "bg-blue-600/25 text-slate-50" : "bg-slate-950 text-slate-200 hover:bg-slate-900"
      }`}
      onClick={props.onSelect}
      type="button"
    >
      <span className={`min-w-0 truncate text-sm ${props.explicit ? "" : "italic text-slate-400"}`}>
        {props.property.name}
      </span>
      <span className="min-w-0 truncate text-right text-xs text-slate-400">
        {getPropertyValueSummary(
          props.property,
          props.propertyTypes,
          props.objectReferenceOptions,
          t
        )}
      </span>
    </button>
  );
}

export function CustomPropertiesActionBar(props: {
  activeDraft: PropertyDraft | null;
  activePropertyKey: string | null;
  canRemove: boolean;
  canRename: boolean;
  previousName: string | undefined;
  onBeginCreate: () => void;
  onFocusPropertyName: () => void;
  onRemoveSelectedProperty: () => void;
  onSaveActiveDraft: () => void;
}) {
  const { t } = useI18n();

  return (
    <div className="flex items-center gap-px border-t border-slate-700 bg-slate-800 p-1">
      <button
        className="border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200 transition hover:bg-slate-800"
        onClick={props.onBeginCreate}
        type="button"
      >
        {t("common.add")}
      </button>
      <button
        className="border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-500"
        disabled={!props.canRemove}
        onClick={props.onRemoveSelectedProperty}
        type="button"
      >
        {t("common.remove")}
      </button>
      <button
        className="border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-500"
        disabled={!props.activeDraft || !props.canRename}
        onClick={props.onFocusPropertyName}
        type="button"
      >
        {t("common.rename")}
      </button>
      <div className="ml-auto">
        <button
          className="border border-sky-500/50 bg-sky-500/10 px-2 py-1 text-xs text-sky-100 transition hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:border-slate-800 disabled:bg-slate-900 disabled:text-slate-500"
          disabled={!props.activeDraft}
          onClick={props.onSaveActiveDraft}
          type="button"
        >
          {props.previousName ? t("propertiesEditor.saveProperty") : t("propertiesEditor.addProperty")}
        </button>
      </div>
    </div>
  );
}

export function CustomPropertiesHint() {
  const { t } = useI18n();

  return (
    <div className="mt-3 border border-slate-800 bg-slate-950/70 px-3 py-3 text-xs text-slate-400">
      {t("propertiesEditor.primitiveHint")}
    </div>
  );
}
