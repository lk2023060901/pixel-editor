"use client";

import {
  clonePropertyValue,
  createDefaultPropertyValue,
  createProperty,
  getClassPropertyTypeDefinitionByName,
  getEnumPropertyTypeDefinitionByName,
  type ClassPropertyTypeDefinition,
  type ClassPropertyValue,
  type PrimitivePropertyType,
  type PropertyDefinition,
  type PropertyTypeDefinition,
  type PropertyValue
} from "@pixel-editor/domain";
import { useI18n } from "@pixel-editor/i18n/client";
import { startTransition, useEffect, useState } from "react";

import { NumberField, SelectField, TextField } from "./editor-fields";
import { getPropertyTypeLabel } from "./i18n-helpers";
import type { ObjectReferenceOption } from "./object-reference-options";

type EditablePropertyType = Exclude<PrimitivePropertyType, "object">;
type DraftTypeValue = EditablePropertyType | "enum" | "class" | "object";

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

function PropertyValueField(props: {
  draft: PropertyDraft;
  propertyTypes: readonly PropertyTypeDefinition[];
  objectReferenceOptions: readonly ObjectReferenceOption[];
  onChange: (draft: PropertyDraft) => void;
}) {
  const { t } = useI18n();
  const enumType = getEnumPropertyTypeDefinitionByName(
    props.propertyTypes,
    props.draft.propertyTypeName
  );
  const classType = getClassPropertyTypeDefinitionByName(
    props.propertyTypes,
    props.draft.propertyTypeName
  );

  if (props.draft.type === "class" && classType && props.draft.classMembers) {
    return (
      <div className="border border-slate-800 bg-slate-950/60 p-3">
        <p className="mb-3 text-[11px] uppercase tracking-[0.18em] text-slate-500">
          {classType.name}
        </p>
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
    );
  }

  if (props.draft.type === "object") {
    return (
      <SelectField
        label={t("common.value")}
        value={props.draft.value}
        options={[
          { label: t("common.none"), value: "" },
          ...props.objectReferenceOptions.map((option) => ({
            label: option.label,
            value: option.id
          }))
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

  if (props.draft.type === "enum" && enumType) {
    return (
      <SelectField
        label={t("common.value")}
        value={props.draft.value}
        options={enumType.values.map((value, index) => ({
          label: value,
          value: enumType.storageType === "int" ? String(index) : value
        }))}
        onChange={(value) => {
          props.onChange({
            ...props.draft,
            value
          });
        }}
      />
    );
  }

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

  if (props.draft.type === "int" || props.draft.type === "float") {
    return (
      <NumberField
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
  propertyTypes: readonly PropertyTypeDefinition[];
  objectReferenceOptions: readonly ObjectReferenceOption[];
  onUpsert: (property: PropertyDefinition, previousName?: string) => void;
  onRemove: (propertyName: string) => void;
}) {
  const { t } = useI18n();
  const supportedPropertyTypes: Array<{ label: string; value: string }> = [
    { label: t("propertyType.string"), value: "string" },
    { label: t("propertyType.int"), value: "int" },
    { label: t("propertyType.float"), value: "float" },
    { label: t("propertyType.bool"), value: "bool" },
    { label: t("propertyType.color"), value: "color" },
    { label: t("propertyType.file"), value: "file" },
    { label: t("propertyType.object"), value: "object" },
    ...getEnumPropertyTypes(props.propertyTypes).map((propertyType) => ({
      label: t("propertiesEditor.enumTypeOption", { name: propertyType.name }),
      value: buildTypedOptionValue("enum", propertyType.name)
    })),
    ...getClassPropertyTypes(props.propertyTypes).map((propertyType) => ({
      label: t("propertiesEditor.classTypeOption", { name: propertyType.name }),
      value: buildTypedOptionValue("class", propertyType.name)
    }))
  ];
  const enumType = getEnumPropertyTypeDefinitionByName(
    props.propertyTypes,
    props.property.propertyTypeName
  );
  const classType = getClassPropertyTypeDefinitionByName(
    props.propertyTypes,
    props.property.propertyTypeName
  );
  const [draft, setDraft] = useState(() => createPropertyDraft(props.property, props.propertyTypes));

  useEffect(() => {
    setDraft(createPropertyDraft(props.property, props.propertyTypes));
  }, [props.property, props.propertyTypes]);

  const isEditable =
    (props.property.type !== "enum" || enumType !== undefined) &&
    (props.property.type !== "class" || classType !== undefined);

  return (
    <div className="border border-slate-800 bg-slate-900/60 p-3">
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
              value={
                draft.type === "enum" || draft.type === "class"
                  ? buildTypedOptionValue(draft.type, draft.propertyTypeName ?? "")
                  : draft.type
              }
              options={supportedPropertyTypes}
              onChange={(value) => {
                if (value.startsWith("enum:")) {
                  const propertyTypeName = value.slice("enum:".length);
                  const propertyType = getEnumPropertyTypeDefinitionByName(
                    props.propertyTypes,
                    propertyTypeName
                  );
                  const defaultValue = createDefaultPropertyValue(
                    "enum",
                    propertyTypeName,
                    props.propertyTypes
                  );

                  setDraft((current) => ({
                    ...current,
                    type: "enum",
                    propertyTypeName,
                    value: String(defaultValue),
                    classMembers: undefined
                  }));
                  return;
                }

                if (value.startsWith("class:")) {
                  const propertyTypeName = value.slice("class:".length);
                  const defaultValue = createDefaultPropertyValue(
                    "class",
                    propertyTypeName,
                    props.propertyTypes
                  );

                  setDraft((current) => ({
                    ...current,
                    type: "class",
                    propertyTypeName,
                    value: "",
                    classMembers: isClassPropertyValue(defaultValue)
                      ? defaultValue.members
                      : {}
                  }));
                  return;
                }

                setDraft((current) => ({
                  ...current,
                  type: value as DraftTypeValue,
                  propertyTypeName: undefined,
                  value: String(
                    createDefaultPropertyValue(
                      value as DraftTypeValue,
                      undefined,
                      props.propertyTypes
                    )
                  ),
                  classMembers: undefined
                }));
              }}
            />
          </div>
          <PropertyValueField
            draft={draft}
            objectReferenceOptions={props.objectReferenceOptions}
            propertyTypes={props.propertyTypes}
            onChange={setDraft}
          />
          <div className="flex justify-end gap-2">
            <button
              className="border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-slate-500"
              onClick={() => {
                startTransition(() => {
                  props.onRemove(props.property.name);
                });
              }}
              type="button"
            >
              {t("common.remove")}
            </button>
            <button
              className="border border-emerald-500/50 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-100 transition hover:bg-emerald-500/20"
              onClick={() => {
                const nextProperty = parseDraft(draft, props.propertyTypes);

                if (!nextProperty) {
                  return;
                }

                startTransition(() => {
                  props.onUpsert(nextProperty, props.property.name);
                });
              }}
              type="button"
            >
              {t("propertiesEditor.saveProperty")}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <p className="text-sm text-slate-100">{props.property.name}</p>
            <p className="mt-1 text-xs text-slate-400">
              {t("propertiesEditor.unsupportedReadonly", {
                type: getPropertyTypeLabel(props.property.type, t)
              })}
            </p>
          </div>
          <button
            className="border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-slate-500"
            onClick={() => {
              startTransition(() => {
                props.onRemove(props.property.name);
              });
            }}
            type="button"
          >
            {t("common.remove")}
          </button>
        </div>
      )}
    </div>
  );
}

export interface CustomPropertiesEditorProps {
  properties: readonly PropertyDefinition[];
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
  const [newPropertyDraft, setNewPropertyDraft] = useState<PropertyDraft>({
    name: "",
    type: "string",
    propertyTypeName: undefined,
    value: "",
    classMembers: undefined
  });

  return (
    <div className={props.className}>
      <div className="space-y-3">
        <p className="text-xs tracking-[0.18em] text-slate-500 uppercase">
          {t("propertiesEditor.customProperties")}
        </p>
        {props.properties.length === 0 ? (
          <p className="text-sm text-slate-400">{t("propertiesEditor.noCustomProperties")}</p>
        ) : null}
        {props.properties.map((property) => (
          <EditablePropertyRow
            key={property.name}
            property={property}
            propertyTypes={propertyTypes}
            objectReferenceOptions={objectReferenceOptions}
            onRemove={props.onRemove}
            onUpsert={props.onUpsert}
          />
        ))}
      </div>

      <div className="mt-3 border border-slate-800 bg-slate-900/60 p-3">
        <p className="text-xs tracking-[0.18em] text-slate-500 uppercase">
          {t("propertiesEditor.addProperty")}
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
              value={
                newPropertyDraft.type === "enum" || newPropertyDraft.type === "class"
                  ? buildTypedOptionValue(newPropertyDraft.type, newPropertyDraft.propertyTypeName ?? "")
                  : newPropertyDraft.type
              }
              options={supportedPropertyTypes}
              onChange={(value) => {
                if (value.startsWith("enum:")) {
                  const propertyTypeName = value.slice("enum:".length);
                  const defaultValue = createDefaultPropertyValue(
                    "enum",
                    propertyTypeName,
                    propertyTypes
                  );

                  setNewPropertyDraft((current) => ({
                    ...current,
                    type: "enum",
                    propertyTypeName,
                    value: String(defaultValue),
                    classMembers: undefined
                  }));
                  return;
                }

                if (value.startsWith("class:")) {
                  const propertyTypeName = value.slice("class:".length);
                  const defaultValue = createDefaultPropertyValue(
                    "class",
                    propertyTypeName,
                    propertyTypes
                  );

                  setNewPropertyDraft((current) => ({
                    ...current,
                    type: "class",
                    propertyTypeName,
                    value: "",
                    classMembers: isClassPropertyValue(defaultValue)
                      ? defaultValue.members
                      : {}
                  }));
                  return;
                }

                setNewPropertyDraft((current) => ({
                  ...current,
                  type: value as DraftTypeValue,
                  propertyTypeName: undefined,
                  value: String(
                    createDefaultPropertyValue(
                      value as DraftTypeValue,
                      undefined,
                      propertyTypes
                    )
                  ),
                  classMembers: undefined
                }));
              }}
            />
          </div>
          <PropertyValueField
            draft={newPropertyDraft}
            objectReferenceOptions={objectReferenceOptions}
            propertyTypes={propertyTypes}
            onChange={setNewPropertyDraft}
          />
          <div className="flex justify-end">
            <button
              className="border border-sky-500/50 bg-sky-500/10 px-3 py-2 text-xs font-medium text-sky-100 transition hover:bg-sky-500/20"
              onClick={() => {
                const nextProperty = parseDraft(newPropertyDraft, propertyTypes);

                if (!nextProperty) {
                  return;
                }

                startTransition(() => {
                  props.onUpsert(nextProperty);
                });
                setNewPropertyDraft({
                  name: "",
                  type: "string",
                  propertyTypeName: undefined,
                  value: "",
                  classMembers: undefined
                });
              }}
              type="button"
            >
              {t("propertiesEditor.addProperty")}
            </button>
          </div>
        </div>
      </div>

      {props.showHint ?? true ? (
        <div className="mt-3 border border-slate-800 bg-slate-950/70 px-3 py-3 text-xs text-slate-400">
          {t("propertiesEditor.primitiveHint")}
        </div>
      ) : null}
    </div>
  );
}
