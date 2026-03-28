"use client";

import type { ObjectReferenceOption } from "@pixel-editor/app-services/ui";
import {
  deriveCustomPropertyDraftValueControl,
  deriveCustomPropertyFieldEditorControl,
  getDraftTypeSelectValue,
  resolveCustomPropertyDraftValue,
  resolveCustomPropertyFieldEditorValue,
  resolveCustomPropertyValueSummary,
  updateDraftTypeFromValue,
  type CustomPropertyFieldEditorControl,
  type PropertyDraft,
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

function ClassMemberField(props: {
  classType: { name: string; fields: readonly { name: string; valueType: string; propertyTypeName?: string }[] };
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
        const control = deriveCustomPropertyFieldEditorControl({
          valueType: field.valueType as never,
          propertyTypeName: field.propertyTypeName,
          propertyTypes: props.propertyTypes,
          currentValue: props.members[field.name],
          objectReferenceOptions: props.objectReferenceOptions,
          labels: {
            trueLabel: t("common.true"),
            falseLabel: t("common.false"),
            noneLabel: t("common.none")
          },
          lineage
        });

        return (
          <CustomPropertyFieldControl
            control={control}
            fieldName={field.name}
            key={field.name}
            objectReferenceOptions={props.objectReferenceOptions}
            propertyTypes={props.propertyTypes}
            onChange={(value) => {
              props.onChange({
                ...props.members,
                [field.name]: value
              });
            }}
          />
        );
      })}
    </div>
  );
}

function CustomPropertyFieldControl(props: {
  control: CustomPropertyFieldEditorControl;
  fieldName: string;
  propertyTypes: readonly PropertyTypeDefinition[];
  objectReferenceOptions: readonly ObjectReferenceOption[];
  onChange: (value: PropertyValue) => void;
}) {
  const { t } = useI18n();

  switch (props.control.kind) {
    case "boolean":
      return (
        <SelectField
          label={props.fieldName}
          options={props.control.options}
          value={props.control.value}
          onChange={(value) => {
            props.onChange(
              resolveCustomPropertyFieldEditorValue({
                control: props.control,
                nextValue: value
              })
            );
          }}
        />
      );
    case "number":
      return (
        <NumberField
          label={props.fieldName}
          value={props.control.value}
          onChange={(value) => {
            props.onChange(
              resolveCustomPropertyFieldEditorValue({
                control: props.control,
                nextValue: value
              })
            );
          }}
        />
      );
    case "text":
      return (
        <TextField
          label={props.fieldName}
          value={props.control.value}
          onChange={(value) => {
            props.onChange(
              resolveCustomPropertyFieldEditorValue({
                control: props.control,
                nextValue: value
              })
            );
          }}
        />
      );
    case "select":
      return (
        <SelectField
          label={props.fieldName}
          options={props.control.options}
          value={props.control.value}
          onChange={(value) => {
            props.onChange(
              resolveCustomPropertyFieldEditorValue({
                control: props.control,
                nextValue: value
              })
            );
          }}
        />
      );
    case "class":
      return (
        <div className="border border-slate-800 bg-slate-950/60 p-3">
          <p className="mb-3 text-[11px] uppercase tracking-[0.18em] text-slate-500">
            {props.fieldName}
          </p>
          <ClassMemberField
            classType={props.control.classType}
            lineage={props.control.nextLineage}
            members={props.control.members}
            objectReferenceOptions={props.objectReferenceOptions}
            propertyTypes={props.propertyTypes}
            onChange={(members) => {
              props.onChange(
                resolveCustomPropertyFieldEditorValue({
                  control: props.control,
                  nextValue: members
                })
              );
            }}
          />
        </div>
      );
    case "unsupported":
      return (
        <div className="border border-slate-800 bg-slate-950/60 px-3 py-2">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
            {props.fieldName}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            {t("propertiesEditor.unsupportedReadonly", {
              type: getPropertyTypeLabel(props.control.valueType, t)
            })}
          </p>
        </div>
      );
  }
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
  const valueControl = deriveCustomPropertyDraftValueControl({
    draft: props.draft,
    propertyTypes: props.propertyTypes,
    objectReferenceOptions: props.objectReferenceOptions,
    labels: {
      trueLabel: t("common.true"),
      falseLabel: t("common.false"),
      noneLabel: t("common.none")
    }
  });

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

      {valueControl.kind === "class" ? (
        <PropertyBrowserRow label={t("common.value")} multiLine>
          <div className="p-2">
            <ClassMemberField
              classType={valueControl.classType}
              members={valueControl.members}
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

      {valueControl.kind === "select" ? (
        <PropertyBrowserSelectRow
          label={t("common.value")}
          options={valueControl.options}
          value={valueControl.value}
          onChange={(value) => {
            props.onChange({
              ...props.draft,
              value: resolveCustomPropertyDraftValue({
                control: valueControl,
                nextValue: value
              })
            });
          }}
        />
      ) : null}

      {valueControl.kind === "text" ? (
        <PropertyBrowserTextRow
          label={t("common.value")}
          type={valueControl.inputType}
          value={valueControl.value}
          onChange={(value) => {
            props.onChange({
              ...props.draft,
              value: resolveCustomPropertyDraftValue({
                control: valueControl,
                nextValue: value
              })
            });
          }}
        />
      ) : null}

      {valueControl.kind === "unsupported" ? (
        <PropertyBrowserRow label={t("common.value")} multiLine>
          <p className="px-2 py-2 text-xs text-slate-400">
            {t("propertiesEditor.unsupportedReadonly", {
              type: getPropertyTypeLabel(valueControl.valueType, t)
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
        {resolveCustomPropertyValueSummary({
          property: props.property,
          propertyTypes: props.propertyTypes,
          objectReferenceOptions: props.objectReferenceOptions,
          labels: {
            trueLabel: t("common.true"),
            falseLabel: t("common.false"),
            noneLabel: t("common.none")
          }
        })}
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
