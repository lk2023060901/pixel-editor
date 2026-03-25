"use client";

import {
  clonePropertyValue,
  createDefaultPropertyValue,
  createProperty,
  getClassPropertyTypeDefinitionByName,
  getEnumPropertyTypeDefinitionByName,
  mergeSuggestedPropertyDefinitions,
  type ClassPropertyTypeDefinition,
  type ClassPropertyValue,
  type PrimitivePropertyType,
  type PropertyDefinition,
  type PropertyTypeDefinition,
  type PropertyValue
} from "@pixel-editor/domain";
import { useI18n } from "@pixel-editor/i18n/client";
import { startTransition, useEffect, useMemo, useRef, useState, type RefObject } from "react";

import { NumberField, SelectField, TextField } from "./editor-fields";
import { getPropertyTypeLabel } from "./i18n-helpers";
import type { ObjectReferenceOption } from "./object-reference-options";
import {
  PropertyBrowserGroup,
  PropertyBrowserRow,
  PropertyBrowserSelectRow,
  PropertyBrowserTextRow
} from "./property-browser";

type EditablePropertyType = Exclude<PrimitivePropertyType, "object">;
type DraftTypeValue = EditablePropertyType | "enum" | "class" | "object";
const NEW_PROPERTY_KEY = "__new__";

interface PropertyDraft {
  name: string;
  type: DraftTypeValue;
  propertyTypeName: string | undefined;
  value: string;
  classMembers: Record<string, PropertyValue> | undefined;
}

function getEnumPropertyTypes(
  propertyTypes: readonly PropertyTypeDefinition[]
) {
  return propertyTypes.filter((propertyType) => propertyType.kind === "enum");
}

function getClassPropertyTypes(
  propertyTypes: readonly PropertyTypeDefinition[]
) {
  return propertyTypes.filter((propertyType) => propertyType.kind === "class");
}

function buildTypedOptionValue(
  kind: "enum" | "class",
  propertyTypeName: string
): string {
  return `${kind}:${propertyTypeName}`;
}

function isClassPropertyValue(value: PropertyValue | undefined): value is ClassPropertyValue {
  return value !== undefined && value !== null && typeof value === "object" && "members" in value;
}

function coercePropertyValue(
  valueType: DraftTypeValue | "object",
  propertyTypeName: string | undefined,
  propertyTypes: readonly PropertyTypeDefinition[],
  currentValue: PropertyValue | undefined
): PropertyValue {
  const fallback = createDefaultPropertyValue(valueType, propertyTypeName, propertyTypes);

  switch (valueType) {
    case "bool":
      return typeof currentValue === "boolean" ? currentValue : fallback;
    case "int":
    case "float":
      return typeof currentValue === "number" ? currentValue : fallback;
    case "string":
    case "color":
    case "file":
      return typeof currentValue === "string" ? currentValue : fallback;
    case "object":
      return currentValue !== undefined ? clonePropertyValue(currentValue) : fallback;
    case "enum": {
      const enumType = getEnumPropertyTypeDefinitionByName(propertyTypes, propertyTypeName);

      if (!enumType) {
        return fallback;
      }

      if (enumType.storageType === "int") {
        return typeof currentValue === "number" ? currentValue : fallback;
      }

      return typeof currentValue === "string" ? currentValue : fallback;
    }
    case "class": {
      const classType = getClassPropertyTypeDefinitionByName(propertyTypes, propertyTypeName);

      if (!classType) {
        return fallback;
      }

      const baseMembers = isClassPropertyValue(fallback) ? fallback.members : {};
      const nextMembers = isClassPropertyValue(currentValue) ? currentValue.members : {};

      return {
        members: Object.fromEntries(
          classType.fields.map((field) => [
            field.name,
            coercePropertyValue(
              field.valueType,
              field.propertyTypeName,
              propertyTypes,
              nextMembers[field.name] ?? baseMembers[field.name]
            )
          ])
        )
      };
    }
  }
}

function createPropertyDraft(
  property: PropertyDefinition | undefined,
  propertyTypes: readonly PropertyTypeDefinition[]
): PropertyDraft {
  if (!property || property.type === "object") {
    return {
      name: property?.name ?? "",
      type: property?.type === "object" ? "object" : "string",
      propertyTypeName: undefined,
      value:
        property?.type === "object" &&
        property.value !== null &&
        typeof property.value === "object" &&
        "objectId" in property.value
          ? property.value.objectId
          : property
            ? String(property.value)
            : "",
      classMembers: undefined
    };
  }

  if (property.type === "class") {
    const classValue = coercePropertyValue(
      "class",
      property.propertyTypeName,
      propertyTypes,
      property.value
    );

    return {
      name: property.name,
      type: "class",
      propertyTypeName: property.propertyTypeName,
      value: "",
      classMembers: isClassPropertyValue(classValue) ? classValue.members : {}
    };
  }

  if (property.type === "enum") {
    const value = coercePropertyValue(
      "enum",
      property.propertyTypeName,
      propertyTypes,
      property.value
    );

    return {
      name: property.name,
      type: "enum",
      propertyTypeName: property.propertyTypeName,
      value: String(value),
      classMembers: undefined
    };
  }

  if (property.type === "bool") {
    return {
      name: property.name,
      type: property.type,
      propertyTypeName: undefined,
      value: property.value ? "true" : "false",
      classMembers: undefined
    };
  }

  return {
    name: property.name,
    type: property.type,
    propertyTypeName: undefined,
    value: String(property.value),
    classMembers: undefined
  };
}

function parseDraft(
  draft: PropertyDraft,
  propertyTypes: readonly PropertyTypeDefinition[]
): PropertyDefinition | undefined {
  const nextName = draft.name.trim();

  if (!nextName) {
    return undefined;
  }

  if (draft.type === "class") {
    const classType = getClassPropertyTypeDefinitionByName(propertyTypes, draft.propertyTypeName);

    if (!classType || !draft.classMembers) {
      return undefined;
    }

    return createProperty(
      nextName,
      "class",
      {
        members: Object.fromEntries(
          Object.entries(draft.classMembers).map(([memberName, value]) => [
            memberName,
            clonePropertyValue(value)
          ])
        )
      },
      classType.name
    );
  }

  if (draft.type === "object") {
    return createProperty(
      nextName,
      "object",
      draft.value ? { objectId: draft.value as never } : null
    );
  }

  if (draft.type === "enum") {
    const enumType = getEnumPropertyTypeDefinitionByName(propertyTypes, draft.propertyTypeName);

    if (!enumType) {
      return undefined;
    }

    const value =
      enumType.storageType === "int"
        ? Number.parseInt(draft.value, 10)
        : draft.value;

    if (enumType.storageType === "int" && Number.isNaN(value)) {
      return undefined;
    }

    return createProperty(nextName, "enum", value, enumType.name);
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

function createEmptyPropertyDraft(): PropertyDraft {
  return {
    name: "",
    type: "string",
    propertyTypeName: undefined,
    value: "",
    classMembers: undefined
  };
}

function getDraftTypeSelectValue(draft: PropertyDraft): string {
  return draft.type === "enum" || draft.type === "class"
    ? buildTypedOptionValue(draft.type, draft.propertyTypeName ?? "")
    : draft.type;
}

function updateDraftTypeFromValue(
  draft: PropertyDraft,
  nextValue: string,
  propertyTypes: readonly PropertyTypeDefinition[]
): PropertyDraft {
  if (nextValue.startsWith("enum:")) {
    const propertyTypeName = nextValue.slice("enum:".length);
    const defaultValue = createDefaultPropertyValue("enum", propertyTypeName, propertyTypes);

    return {
      ...draft,
      type: "enum",
      propertyTypeName,
      value: String(defaultValue),
      classMembers: undefined
    };
  }

  if (nextValue.startsWith("class:")) {
    const propertyTypeName = nextValue.slice("class:".length);
    const defaultValue = createDefaultPropertyValue("class", propertyTypeName, propertyTypes);

    return {
      ...draft,
      type: "class",
      propertyTypeName,
      value: "",
      classMembers: isClassPropertyValue(defaultValue) ? defaultValue.members : {}
    };
  }

  return {
    ...draft,
    type: nextValue as DraftTypeValue,
    propertyTypeName: undefined,
    value: String(createDefaultPropertyValue(nextValue as DraftTypeValue, undefined, propertyTypes)),
    classMembers: undefined
  };
}

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

    return (
      objectReferenceOptions.find((option) => option.id === objectId)?.label ??
      objectId
    );
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

function PropertyDraftEditor(props: {
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

function PropertyListRow(props: {
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

export interface CustomPropertiesEditorProps {
  properties: readonly PropertyDefinition[];
  suggestedProperties?: readonly PropertyDefinition[];
  propertyTypes: readonly PropertyTypeDefinition[] | undefined;
  objectReferenceOptions: readonly ObjectReferenceOption[] | undefined;
  onUpsert: (property: PropertyDefinition, previousName?: string) => void;
  onRemove: (propertyName: string) => void;
  className?: string;
  showHint?: boolean;
}

export function CustomPropertiesEditor(props: CustomPropertiesEditorProps) {
  const { t } = useI18n();
  const propertyTypes = props.propertyTypes ?? [];
  const objectReferenceOptions = props.objectReferenceOptions ?? [];
  const suggestedProperties = props.suggestedProperties ?? [];
  const nameInputRef = useRef<HTMLInputElement>(null);
  const supportedPropertyTypes: Array<{ label: string; value: string }> = [
    { label: t("propertyType.string"), value: "string" },
    { label: t("propertyType.int"), value: "int" },
    { label: t("propertyType.float"), value: "float" },
    { label: t("propertyType.bool"), value: "bool" },
    { label: t("propertyType.color"), value: "color" },
    { label: t("propertyType.file"), value: "file" },
    { label: t("propertyType.object"), value: "object" },
    ...getEnumPropertyTypes(propertyTypes).map((propertyType) => ({
      label: t("propertiesEditor.enumTypeOption", { name: propertyType.name }),
      value: buildTypedOptionValue("enum", propertyType.name)
    })),
    ...getClassPropertyTypes(propertyTypes).map((propertyType) => ({
      label: t("propertiesEditor.classTypeOption", { name: propertyType.name }),
      value: buildTypedOptionValue("class", propertyType.name)
    }))
  ];
  const [activePropertyKey, setActivePropertyKey] = useState<string | null>(null);
  const [activeDraft, setActiveDraft] = useState<PropertyDraft | null>(null);
  const [previousName, setPreviousName] = useState<string | undefined>(undefined);
  const [nameFocusToken, setNameFocusToken] = useState(0);
  const explicitPropertyNames = useMemo(
    () => new Set(props.properties.map((property) => property.name)),
    [props.properties]
  );
  const mergedProperties = useMemo(
    () => mergeSuggestedPropertyDefinitions(props.properties, suggestedProperties),
    [props.properties, suggestedProperties]
  );

  useEffect(() => {
    if (!activePropertyKey || activePropertyKey === NEW_PROPERTY_KEY) {
      return;
    }

    const property = mergedProperties.find((item) => item.name === activePropertyKey);

    if (!property) {
      setActivePropertyKey(null);
      setActiveDraft(null);
      setPreviousName(undefined);
      return;
    }

    setActiveDraft(createPropertyDraft(property, propertyTypes));
    setPreviousName(explicitPropertyNames.has(property.name) ? property.name : undefined);
  }, [activePropertyKey, explicitPropertyNames, mergedProperties, propertyTypes]);

  useEffect(() => {
    if (nameFocusToken === 0) {
      return;
    }

    nameInputRef.current?.focus();
    nameInputRef.current?.select();
  }, [nameFocusToken]);

  const selectedExistingProperty =
    activePropertyKey && activePropertyKey !== NEW_PROPERTY_KEY
      ? props.properties.find((property) => property.name === activePropertyKey)
      : undefined;
  const selectedMergedProperty =
    activePropertyKey && activePropertyKey !== NEW_PROPERTY_KEY
      ? mergedProperties.find((property) => property.name === activePropertyKey)
      : undefined;
  const selectedPropertyIsExplicit = selectedMergedProperty
    ? explicitPropertyNames.has(selectedMergedProperty.name)
    : false;

  function beginCreate(): void {
    setActivePropertyKey(NEW_PROPERTY_KEY);
    setActiveDraft(createEmptyPropertyDraft());
    setPreviousName(undefined);
    setNameFocusToken((current) => current + 1);
  }

  function selectProperty(propertyName: string): void {
    if (activePropertyKey === propertyName) {
      setActivePropertyKey(null);
      setActiveDraft(null);
      setPreviousName(undefined);
      return;
    }

    setActivePropertyKey(propertyName);
  }

  function focusPropertyName(): void {
    if (!activeDraft) {
      return;
    }

    setNameFocusToken((current) => current + 1);
  }

  function removeSelectedProperty(): void {
    if (!selectedExistingProperty) {
      return;
    }

    startTransition(() => {
      props.onRemove(selectedExistingProperty.name);
    });
    setActivePropertyKey(null);
    setActiveDraft(null);
    setPreviousName(undefined);
  }

  function saveActiveDraft(): void {
    if (!activeDraft) {
      return;
    }

    const nextProperty = parseDraft(activeDraft, propertyTypes);

    if (!nextProperty) {
      return;
    }

    startTransition(() => {
      props.onUpsert(nextProperty, previousName);
    });
    setActivePropertyKey(nextProperty.name);
    setActiveDraft(createPropertyDraft(nextProperty, propertyTypes));
    setPreviousName(nextProperty.name);
  }

  return (
    <div className={props.className}>
      <PropertyBrowserGroup title={t("propertiesEditor.customProperties")}>
        {mergedProperties.length === 0 ? (
          <div className="border-b border-slate-800 bg-slate-950 px-2 py-2 text-sm text-slate-400">
            {t("propertiesEditor.noCustomProperties")}
          </div>
        ) : (
          mergedProperties.map((property) => (
            <PropertyListRow
              explicit={explicitPropertyNames.has(property.name)}
              key={property.name}
              objectReferenceOptions={objectReferenceOptions}
              property={property}
              propertyTypes={propertyTypes}
              selected={activePropertyKey === property.name}
              onSelect={() => {
                selectProperty(property.name);
              }}
            />
          ))
        )}

        {activeDraft ? (
          <div className="border-t border-slate-700">
            <PropertyDraftEditor
              draft={activeDraft}
              identityLocked={activePropertyKey !== NEW_PROPERTY_KEY && !selectedPropertyIsExplicit}
              nameInputRef={nameInputRef}
              objectReferenceOptions={objectReferenceOptions}
              propertyTypes={propertyTypes}
              supportedPropertyTypes={supportedPropertyTypes}
              onChange={setActiveDraft}
            />
          </div>
        ) : null}

        <div className="flex items-center gap-px border-t border-slate-700 bg-slate-800 p-1">
          <button
            className="border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200 transition hover:bg-slate-800"
            onClick={beginCreate}
            type="button"
          >
            {t("common.add")}
          </button>
          <button
            className="border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-500"
            disabled={!selectedPropertyIsExplicit}
            onClick={removeSelectedProperty}
            type="button"
          >
            {t("common.remove")}
          </button>
          <button
            className="border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-500"
            disabled={!activeDraft || (activePropertyKey !== NEW_PROPERTY_KEY && !selectedPropertyIsExplicit)}
            onClick={focusPropertyName}
            type="button"
          >
            {t("common.rename")}
          </button>
          <div className="ml-auto">
            <button
              className="border border-sky-500/50 bg-sky-500/10 px-2 py-1 text-xs text-sky-100 transition hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:border-slate-800 disabled:bg-slate-900 disabled:text-slate-500"
              disabled={!activeDraft}
              onClick={saveActiveDraft}
              type="button"
            >
              {previousName ? t("propertiesEditor.saveProperty") : t("propertiesEditor.addProperty")}
            </button>
          </div>
        </div>
      </PropertyBrowserGroup>

      {props.showHint ?? true ? (
        <div className="mt-3 border border-slate-800 bg-slate-950/70 px-3 py-3 text-xs text-slate-400">
          {t("propertiesEditor.primitiveHint")}
        </div>
      ) : null}
    </div>
  );
}
