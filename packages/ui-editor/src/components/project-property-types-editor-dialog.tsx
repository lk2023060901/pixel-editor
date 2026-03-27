"use client";

import { createIndexedName } from "@pixel-editor/app-services/ui";
import type { EditorController } from "@pixel-editor/app-services/ui";
import {
  clonePropertyTypeDefinition,
  clonePropertyValue,
  createClassPropertyTypeDefinition,
  createDefaultPropertyValue,
  createEnumPropertyTypeDefinition,
  getClassPropertyTypeDefinitionByName,
  getEnumPropertyTypeDefinitionByName,
  type ClassPropertyTypeDefinition,
  type ClassPropertyValue,
  type PropertyTypeDefinition,
  type PropertyTypeName,
  type PropertyTypeUseAs,
  type PropertyValue
} from "@pixel-editor/app-services/ui-property-types";
import { useI18n } from "@pixel-editor/i18n/client";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";

import {
  getPropertyTypeLabel,
  getPropertyTypeUseAsLabel
} from "./i18n-helpers";

const PROPERTY_VALUE_TYPE_OPTIONS: PropertyTypeName[] = [
  "string",
  "int",
  "float",
  "bool",
  "color",
  "file",
  "object",
  "enum",
  "class"
];
const CLASS_USE_AS_OPTIONS: PropertyTypeUseAs[] = [
  "property",
  "map",
  "layer",
  "object",
  "tile",
  "tileset",
  "wangcolor",
  "wangset",
  "project",
  "world",
  "template"
];

function isClassPropertyValue(value: PropertyValue | undefined): value is ClassPropertyValue {
  return value !== null && typeof value === "object" && value !== undefined && "members" in value;
}

function coerceDefaultValue(
  valueType: PropertyTypeName,
  propertyTypeName: string | undefined,
  propertyTypes: readonly PropertyTypeDefinition[],
  currentValue: PropertyValue | undefined,
  lineage: readonly string[] = []
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

      if (!classType || lineage.includes(classType.name)) {
        return fallback;
      }

      const fallbackMembers = isClassPropertyValue(fallback) ? fallback.members : {};
      const currentMembers = isClassPropertyValue(currentValue) ? currentValue.members : {};

      return {
        members: Object.fromEntries(
          classType.fields.map((field) => [
            field.name,
            coerceDefaultValue(
              field.valueType,
              field.propertyTypeName,
              propertyTypes,
              currentMembers[field.name] ?? field.defaultValue ?? fallbackMembers[field.name],
              [...lineage, classType.name]
            )
          ])
        )
      };
    }
  }
}

function updatePropertyTypeDraft(
  drafts: readonly PropertyTypeDefinition[],
  propertyTypeId: string,
  updater: (propertyType: PropertyTypeDefinition) => PropertyTypeDefinition
): PropertyTypeDefinition[] {
  return drafts.map((propertyType) =>
    propertyType.id === propertyTypeId ? updater(propertyType) : propertyType
  );
}

function updateClassFieldDraft(
  propertyType: ClassPropertyTypeDefinition,
  fieldIndex: number,
  updater: (
    field: ClassPropertyTypeDefinition["fields"][number]
  ) => ClassPropertyTypeDefinition["fields"][number]
): ClassPropertyTypeDefinition {
  return {
    ...propertyType,
    fields: propertyType.fields.map((field, index) =>
      index === fieldIndex ? updater(field) : field
    )
  };
}

function withOptionalPropertyTypeName<T extends { propertyTypeName?: string }>(
  value: Omit<T, "propertyTypeName">,
  propertyTypeName: string | undefined
): T {
  return {
    ...value,
    ...(propertyTypeName !== undefined ? { propertyTypeName } : {})
  } as T;
}

function validatePropertyTypes(
  propertyTypes: readonly PropertyTypeDefinition[],
  t: ReturnType<typeof useI18n>["t"]
): { propertyTypes: PropertyTypeDefinition[]; error?: string } {
  const normalizedNames = new Set<string>();
  const normalizedPropertyTypes = propertyTypes.map((propertyType) => {
    const nextPropertyType = clonePropertyTypeDefinition(propertyType);
    nextPropertyType.name = nextPropertyType.name.trim();
    return nextPropertyType;
  });

  for (const propertyType of normalizedPropertyTypes) {
    if (!propertyType.name) {
      return {
        propertyTypes: [],
        error: t("propertyTypesEditor.validation.required", {
          field: t("propertyTypesEditor.typeName")
        })
      };
    }

    if (normalizedNames.has(propertyType.name)) {
      return {
        propertyTypes: [],
        error: t("propertyTypesEditor.validation.duplicate", {
          field: t("propertyTypesEditor.typeName"),
          value: propertyType.name
        })
      };
    }

    normalizedNames.add(propertyType.name);
  }

  const propertyTypesByName = new Map(
    normalizedPropertyTypes.map((propertyType) => [propertyType.name, propertyType])
  );

  for (const propertyType of normalizedPropertyTypes) {
    if (propertyType.kind === "enum") {
      const valueNames = new Set<string>();
      const nextValues: string[] = [];

      for (const value of propertyType.values) {
        const nextValue = value.trim();

        if (!nextValue) {
          return {
            propertyTypes: [],
            error: t("propertyTypesEditor.validation.required", {
              field: t("propertyTypesEditor.enumValue")
            })
          };
        }

        if (valueNames.has(nextValue)) {
          return {
            propertyTypes: [],
            error: t("propertyTypesEditor.validation.duplicate", {
              field: t("propertyTypesEditor.enumValue"),
              value: nextValue
            })
          };
        }

        valueNames.add(nextValue);
        nextValues.push(nextValue);
      }

      propertyType.values = nextValues;
      continue;
    }

    const fieldNames = new Set<string>();

    for (const field of propertyType.fields) {
      field.name = field.name.trim();

      if (!field.name) {
        return {
          propertyTypes: [],
          error: t("propertyTypesEditor.validation.required", {
            field: t("propertyTypesEditor.fieldName")
          })
        };
      }

      if (fieldNames.has(field.name)) {
        return {
          propertyTypes: [],
          error: t("propertyTypesEditor.validation.duplicate", {
            field: t("propertyTypesEditor.fieldName"),
            value: field.name
          })
        };
      }

      fieldNames.add(field.name);
      const nextPropertyTypeName = field.propertyTypeName?.trim() || undefined;

      if (nextPropertyTypeName !== undefined) {
        field.propertyTypeName = nextPropertyTypeName;
      } else {
        delete field.propertyTypeName;
      }

      if (field.valueType === "enum" || field.valueType === "class") {
        const referencedType = field.propertyTypeName
          ? propertyTypesByName.get(field.propertyTypeName)
          : undefined;

        if (!referencedType || referencedType.kind !== field.valueType) {
          return {
            propertyTypes: [],
            error: t("propertyTypesEditor.validation.missingReference", {
              field: t("propertyTypesEditor.referencedType")
            })
          };
        }
      } else {
        delete field.propertyTypeName;
      }

      field.defaultValue = clonePropertyValue(
        coerceDefaultValue(
          field.valueType,
          field.propertyTypeName,
          normalizedPropertyTypes,
          field.defaultValue
        )
      );
    }
  }

  return {
    propertyTypes: normalizedPropertyTypes
  };
}

function DialogTextInput(props: {
  value: string;
  type?: "text" | "number" | "color";
  onChange: (value: string) => void;
}) {
  return (
    <input
      className="h-8 w-full border border-slate-600 bg-slate-950 px-2 text-sm text-slate-100 outline-none"
      inputMode={props.type === "number" ? "numeric" : undefined}
      type={props.type ?? "text"}
      value={props.value}
      onChange={(event) => {
        props.onChange(event.target.value);
      }}
    />
  );
}

function DialogSelect(props: {
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <select
      className="h-8 w-full border border-slate-600 bg-slate-950 px-2 text-sm text-slate-100 outline-none"
      value={props.value}
      onChange={(event) => {
        props.onChange(event.target.value);
      }}
    >
      {props.options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function DialogCheckbox(props: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-200">
      <input
        checked={props.checked}
        type="checkbox"
        onChange={(event) => {
          props.onChange(event.target.checked);
        }}
      />
      <span>{props.label}</span>
    </label>
  );
}

function PropertyValueEditor(props: {
  valueType: PropertyTypeName;
  propertyTypeName?: string;
  propertyTypes: readonly PropertyTypeDefinition[];
  value: PropertyValue | undefined;
  lineage?: readonly string[];
  onChange: (value: PropertyValue) => void;
}) {
  const { t } = useI18n();
  const lineage = props.lineage ?? [];

  switch (props.valueType) {
    case "bool":
      return (
        <DialogCheckbox
          checked={Boolean(props.value)}
          label={Boolean(props.value) ? t("common.true") : t("common.false")}
          onChange={(checked) => {
            props.onChange(checked);
          }}
        />
      );
    case "int":
    case "float":
      return (
        <DialogTextInput
          type="number"
          value={String(
            typeof props.value === "number"
              ? props.value
              : createDefaultPropertyValue(
                  props.valueType,
                  props.propertyTypeName,
                  props.propertyTypes
                )
          )}
          onChange={(value) => {
            const nextValue =
              props.valueType === "int"
                ? Number.parseInt(value || "0", 10)
                : Number.parseFloat(value || "0");
            props.onChange(Number.isNaN(nextValue) ? 0 : nextValue);
          }}
        />
      );
    case "string":
    case "color":
    case "file":
      return (
        <DialogTextInput
          value={typeof props.value === "string" ? props.value : ""}
          onChange={(value) => {
            props.onChange(value);
          }}
        />
      );
    case "object":
      return (
        <DialogTextInput
          value={
            props.value !== null &&
            props.value !== undefined &&
            typeof props.value === "object" &&
            "objectId" in props.value
              ? props.value.objectId
              : ""
          }
          onChange={(value) => {
            props.onChange(value.trim() ? { objectId: value.trim() as never } : null);
          }}
        />
      );
    case "enum": {
      const enumType = getEnumPropertyTypeDefinitionByName(
        props.propertyTypes,
        props.propertyTypeName
      );

      if (!enumType) {
        return (
          <div className="text-sm text-slate-400">
            {t("propertyTypesEditor.unsupportedDefaultValue")}
          </div>
        );
      }

      return (
        <DialogSelect
          value={
            enumType.storageType === "int"
              ? String(
                  typeof props.value === "number"
                    ? props.value
                    : createDefaultPropertyValue(
                        "enum",
                        props.propertyTypeName,
                        props.propertyTypes
                      )
                )
              : String(
                  typeof props.value === "string"
                    ? props.value
                    : createDefaultPropertyValue(
                        "enum",
                        props.propertyTypeName,
                        props.propertyTypes
                      )
                )
          }
          options={enumType.values.map((value, index) => ({
            value: enumType.storageType === "int" ? String(index) : value,
            label: value
          }))}
          onChange={(value) => {
            props.onChange(enumType.storageType === "int" ? Number(value) : value);
          }}
        />
      );
    }
    case "class": {
      const classType = getClassPropertyTypeDefinitionByName(
        props.propertyTypes,
        props.propertyTypeName
      );

      if (!classType) {
        return (
          <div className="text-sm text-slate-400">
            {t("propertyTypesEditor.unsupportedDefaultValue")}
          </div>
        );
      }

      if (lineage.includes(classType.name)) {
        return (
          <div className="text-sm text-slate-400">
            {t("propertyTypesEditor.recursiveDefaultValue")}
          </div>
        );
      }

      const classValue = coerceDefaultValue(
        "class",
        classType.name,
        props.propertyTypes,
        props.value,
        lineage
      );
      const members = isClassPropertyValue(classValue) ? classValue.members : {};

      return (
        <div className="space-y-2">
          {classType.fields.map((field) => (
            <div
              key={`${field.name}:${field.valueType}`}
              className="rounded border border-slate-700 bg-slate-950/60 p-2"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-sm text-slate-200">{field.name}</span>
                <span className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  {getPropertyTypeLabel(field.valueType, t)}
                </span>
              </div>
              <PropertyValueEditor
                lineage={[...lineage, classType.name]}
                propertyTypes={props.propertyTypes}
                value={members[field.name] ?? field.defaultValue}
                valueType={field.valueType}
                {...(field.propertyTypeName !== undefined
                  ? { propertyTypeName: field.propertyTypeName }
                  : {})}
                onChange={(value) => {
                  props.onChange({
                    members: {
                      ...members,
                      [field.name]: value
                    }
                  });
                }}
              />
            </div>
          ))}
        </div>
      );
    }
  }
}

export function ProjectPropertyTypesEditorDialog(props: {
  propertyTypes: readonly PropertyTypeDefinition[];
  store: EditorController;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const [draftPropertyTypes, setDraftPropertyTypes] = useState<PropertyTypeDefinition[]>(() =>
    props.propertyTypes.map((propertyType) => clonePropertyTypeDefinition(propertyType))
  );
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(
    props.propertyTypes[0]?.id ?? null
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  const selectedType = draftPropertyTypes.find((propertyType) => propertyType.id === selectedTypeId);
  const selectedEnumType = selectedType?.kind === "enum" ? selectedType : undefined;
  const selectedClassType = selectedType?.kind === "class" ? selectedType : undefined;

  const enumOptions = useMemo(
    () =>
      draftPropertyTypes
        .filter((propertyType) => propertyType.kind === "enum")
        .map((propertyType) => ({
          value: propertyType.name,
          label: propertyType.name
        })),
    [draftPropertyTypes]
  );
  const classOptions = useMemo(
    () =>
      draftPropertyTypes
        .filter((propertyType) => propertyType.kind === "class")
        .map((propertyType) => ({
          value: propertyType.name,
          label: propertyType.name
        })),
    [draftPropertyTypes]
  );

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  useEffect(() => {
    setDraftPropertyTypes(
      props.propertyTypes.map((propertyType) => clonePropertyTypeDefinition(propertyType))
    );
    setSelectedTypeId(props.propertyTypes[0]?.id ?? null);
    setValidationError(null);
  }, [props.propertyTypes]);

  useEffect(() => {
    if (!selectedTypeId && draftPropertyTypes[0]) {
      setSelectedTypeId(draftPropertyTypes[0].id);
      return;
    }

    if (selectedTypeId && !draftPropertyTypes.some((propertyType) => propertyType.id === selectedTypeId)) {
      setSelectedTypeId(draftPropertyTypes[0]?.id ?? null);
    }
  }, [draftPropertyTypes, selectedTypeId]);

  function addEnumType(): void {
    const nextType = createEnumPropertyTypeDefinition({
      name: createIndexedName(
        t("propertyTypesEditor.defaultEnumName"),
        draftPropertyTypes.filter((propertyType) => propertyType.kind === "enum").length + 1
      ),
      values: [t("propertyTypesEditor.defaultValueName")]
    });

    setDraftPropertyTypes((current) => [...current, nextType]);
    setSelectedTypeId(nextType.id);
    setValidationError(null);
  }

  function addClassType(): void {
    const nextType = createClassPropertyTypeDefinition({
      name: createIndexedName(
        t("propertyTypesEditor.defaultClassName"),
        draftPropertyTypes.filter((propertyType) => propertyType.kind === "class").length + 1
      )
    });

    setDraftPropertyTypes((current) => [...current, nextType]);
    setSelectedTypeId(nextType.id);
    setValidationError(null);
  }

  function removeSelectedType(): void {
    if (!selectedTypeId) {
      return;
    }

    setDraftPropertyTypes((current) =>
      current.filter((propertyType) => propertyType.id !== selectedTypeId)
    );
    setValidationError(null);
  }

  function applyDrafts(): void {
    const validation = validatePropertyTypes(draftPropertyTypes, t);

    if (validation.error) {
      setValidationError(validation.error);
      return;
    }

    startTransition(() => {
      props.store.replaceProjectPropertyTypes(validation.propertyTypes);
    });
    props.onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-6 py-8">
      <div
        ref={dialogRef}
        aria-label={t("propertyTypesEditor.title")}
        aria-modal="true"
        className="flex h-[680px] w-[1080px] flex-col border border-slate-700 bg-slate-900 shadow-[0_18px_60px_rgba(2,6,23,0.7)] outline-none"
        role="dialog"
        tabIndex={-1}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            props.onClose();
          }
        }}
      >
        <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
          <div>
            <div className="text-sm font-medium text-slate-100">
              {t("propertyTypesEditor.title")}
            </div>
            <div className="text-xs text-slate-400">{t("propertyTypesEditor.customTypes")}</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="h-8 border border-slate-600 bg-slate-800 px-3 text-sm text-slate-100 transition hover:bg-slate-700"
              type="button"
              onClick={addEnumType}
            >
              {t("propertyTypesEditor.addEnum")}
            </button>
            <button
              className="h-8 border border-slate-600 bg-slate-800 px-3 text-sm text-slate-100 transition hover:bg-slate-700"
              type="button"
              onClick={addClassType}
            >
              {t("propertyTypesEditor.addClass")}
            </button>
            <button
              className="h-8 border border-slate-600 bg-slate-800 px-3 text-sm text-slate-100 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!selectedType}
              type="button"
              onClick={removeSelectedType}
            >
              {t("propertyTypesEditor.removeType")}
            </button>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-[260px_minmax(0,1fr)]">
          <div className="min-h-0 border-r border-slate-700 bg-slate-950">
            <div className="h-full overflow-y-auto">
              {draftPropertyTypes.length > 0 ? (
                <div className="divide-y divide-slate-800">
                  {draftPropertyTypes.map((propertyType) => (
                    <button
                      key={propertyType.id}
                      className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition ${
                        propertyType.id === selectedTypeId
                          ? "bg-blue-600/40 text-slate-50"
                          : "text-slate-200 hover:bg-slate-800"
                      }`}
                      type="button"
                      onClick={() => {
                        setSelectedTypeId(propertyType.id);
                        setValidationError(null);
                      }}
                    >
                      <span className="min-w-0 truncate">{propertyType.name}</span>
                      <span className="text-[10px] uppercase tracking-[0.14em] text-slate-400">
                        {propertyType.kind}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-3 py-3 text-sm text-slate-400">
                  {t("propertyTypesEditor.noSelection")}
                </div>
              )}
            </div>
          </div>

          <div className="min-h-0 overflow-y-auto bg-slate-900">
            {selectedType ? (
              <div className="space-y-4 p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-xs tracking-[0.16em] text-slate-500 uppercase">
                      {t("propertyTypesEditor.typeName")}
                    </span>
                    <DialogTextInput
                      value={selectedType.name}
                      onChange={(value) => {
                        setDraftPropertyTypes((current) =>
                          updatePropertyTypeDraft(current, selectedType.id, (propertyType) => ({
                            ...propertyType,
                            name: value
                          }))
                        );
                      }}
                    />
                  </label>
                  <div className="space-y-2">
                    <span className="text-xs tracking-[0.16em] text-slate-500 uppercase">
                      {t("common.type")}
                    </span>
                    <div className="flex h-8 items-center border border-slate-700 bg-slate-950 px-2 text-sm text-slate-300">
                      {getPropertyTypeLabel(selectedType.kind, t)}
                    </div>
                  </div>
                </div>

                {selectedEnumType ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="space-y-2">
                        <span className="text-xs tracking-[0.16em] text-slate-500 uppercase">
                          {t("propertyTypesEditor.storageType")}
                        </span>
                        <DialogSelect
                          options={[
                            { value: "string", label: getPropertyTypeLabel("string", t) },
                            { value: "int", label: getPropertyTypeLabel("int", t) }
                          ]}
                          value={selectedEnumType.storageType}
                          onChange={(value) => {
                            setDraftPropertyTypes((current) =>
                              updatePropertyTypeDraft(current, selectedEnumType.id, (propertyType) => ({
                                ...propertyType,
                                storageType: value as "string" | "int"
                              }))
                            );
                          }}
                        />
                      </label>
                      <div className="space-y-2">
                        <span className="text-xs tracking-[0.16em] text-slate-500 uppercase">
                          {t("propertyTypesEditor.valuesAsFlags")}
                        </span>
                        <div className="flex h-8 items-center border border-slate-700 bg-slate-950 px-2">
                          <DialogCheckbox
                            checked={selectedEnumType.valuesAsFlags}
                            label={t("propertyTypesEditor.valuesAsFlags")}
                            onChange={(checked) => {
                              setDraftPropertyTypes((current) =>
                                updatePropertyTypeDraft(current, selectedEnumType.id, (propertyType) => ({
                                  ...propertyType,
                                  valuesAsFlags: checked
                                }))
                              );
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-medium text-slate-100">
                          {t("propertyTypesEditor.enumValues")}
                        </h3>
                        <button
                          className="h-8 border border-slate-600 bg-slate-800 px-3 text-sm text-slate-100 transition hover:bg-slate-700"
                          type="button"
                          onClick={() => {
                            setDraftPropertyTypes((current) =>
                              updatePropertyTypeDraft(current, selectedEnumType.id, (propertyType) => {
                                const enumPropertyType = propertyType as Extract<
                                  PropertyTypeDefinition,
                                  { kind: "enum" }
                                >;

                                return {
                                  ...enumPropertyType,
                                  values: [
                                    ...enumPropertyType.values,
                                    createIndexedName(
                                      t("propertyTypesEditor.defaultValueName"),
                                      enumPropertyType.values.length + 1
                                    )
                                  ]
                                };
                              })
                            );
                          }}
                        >
                          {t("propertyTypesEditor.addValue")}
                        </button>
                      </div>
                      {selectedEnumType.values.length > 0 ? (
                        <div className="space-y-2">
                          {selectedEnumType.values.map((value, valueIndex) => (
                            <div
                              key={`${selectedEnumType.id}:value:${valueIndex}`}
                              className="flex items-center gap-2"
                            >
                              <DialogTextInput
                                value={value}
                                onChange={(nextValue) => {
                                  setDraftPropertyTypes((current) =>
                                    updatePropertyTypeDraft(
                                      current,
                                      selectedEnumType.id,
                                      (propertyType) => {
                                        const enumPropertyType = propertyType as Extract<
                                          PropertyTypeDefinition,
                                          { kind: "enum" }
                                        >;

                                        return {
                                          ...enumPropertyType,
                                          values: enumPropertyType.values.map((entry, index) =>
                                          index === valueIndex ? nextValue : entry
                                          )
                                        };
                                      }
                                    )
                                  );
                                }}
                              />
                              <button
                                className="h-8 border border-slate-600 bg-slate-800 px-3 text-sm text-slate-100 transition hover:bg-slate-700"
                                type="button"
                                onClick={() => {
                                  setDraftPropertyTypes((current) =>
                                    updatePropertyTypeDraft(
                                      current,
                                      selectedEnumType.id,
                                      (propertyType) => {
                                        const enumPropertyType = propertyType as Extract<
                                          PropertyTypeDefinition,
                                          { kind: "enum" }
                                        >;

                                        return {
                                          ...enumPropertyType,
                                          values: enumPropertyType.values.filter(
                                            (_entry, index) => index !== valueIndex
                                          )
                                        };
                                      }
                                    )
                                  );
                                }}
                              >
                                {t("common.remove")}
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded border border-dashed border-slate-700 bg-slate-950/50 px-3 py-4 text-sm text-slate-400">
                          {t("propertyTypesEditor.noEnumValues")}
                        </div>
                      )}
                    </div>
                  </div>
                ) : selectedClassType ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="space-y-2">
                        <span className="text-xs tracking-[0.16em] text-slate-500 uppercase">
                          {t("propertyTypesEditor.color")}
                        </span>
                        <DialogTextInput
                          value={selectedClassType.color ?? ""}
                          onChange={(value) => {
                            setDraftPropertyTypes((current) =>
                              updatePropertyTypeDraft(current, selectedClassType.id, (propertyType) => ({
                                ...propertyType,
                                color: value
                              }))
                            );
                          }}
                        />
                      </label>
                      <div className="space-y-2">
                        <span className="text-xs tracking-[0.16em] text-slate-500 uppercase">
                          {t("propertyTypesEditor.drawFill")}
                        </span>
                        <div className="flex h-8 items-center border border-slate-700 bg-slate-950 px-2">
                          <DialogCheckbox
                            checked={selectedClassType.drawFill ?? false}
                            label={t("propertyTypesEditor.drawFill")}
                            onChange={(checked) => {
                              setDraftPropertyTypes((current) =>
                                updatePropertyTypeDraft(current, selectedClassType.id, (propertyType) => ({
                                  ...propertyType,
                                  drawFill: checked
                                }))
                              );
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-slate-100">
                        {t("propertyTypesEditor.usage")}
                      </h3>
                      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                        {CLASS_USE_AS_OPTIONS.map((useAs) => (
                          <div
                            key={useAs}
                            className="rounded border border-slate-700 bg-slate-950/60 px-3 py-2"
                          >
                            <DialogCheckbox
                              checked={selectedClassType.useAs.includes(useAs)}
                              label={getPropertyTypeUseAsLabel(useAs, t)}
                              onChange={(checked) => {
                                setDraftPropertyTypes((current) =>
                                  updatePropertyTypeDraft(current, selectedClassType.id, (propertyType) => {
                                    const classPropertyType = propertyType as Extract<
                                      PropertyTypeDefinition,
                                      { kind: "class" }
                                    >;

                                    return {
                                      ...classPropertyType,
                                      useAs: checked
                                        ? [...classPropertyType.useAs, useAs]
                                        : classPropertyType.useAs.filter((entry) => entry !== useAs)
                                    };
                                  })
                                );
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-medium text-slate-100">
                          {t("propertyTypesEditor.classFields")}
                        </h3>
                        <button
                          className="h-8 border border-slate-600 bg-slate-800 px-3 text-sm text-slate-100 transition hover:bg-slate-700"
                          type="button"
                          onClick={() => {
                            const defaultValueType: PropertyTypeName = "string";
                            setDraftPropertyTypes((current) =>
                              updatePropertyTypeDraft(current, selectedClassType.id, (propertyType) => {
                                const classPropertyType = propertyType as Extract<
                                  PropertyTypeDefinition,
                                  { kind: "class" }
                                >;

                                return {
                                  ...classPropertyType,
                                  fields: [
                                    ...classPropertyType.fields,
                                  {
                                    name: createIndexedName(
                                      t("propertyTypesEditor.defaultFieldName"),
                                      classPropertyType.fields.length + 1
                                    ),
                                    valueType: defaultValueType,
                                    defaultValue: createDefaultPropertyValue(
                                      defaultValueType,
                                      undefined,
                                      current
                                    )
                                  }
                                  ]
                                };
                              })
                            );
                          }}
                        >
                          {t("propertyTypesEditor.addField")}
                        </button>
                      </div>
                      {selectedClassType.fields.length > 0 ? (
                        <div className="space-y-3">
                          {selectedClassType.fields.map((field, fieldIndex) => (
                            <div
                              key={`${selectedClassType.id}:field:${fieldIndex}:${field.name}`}
                              className="space-y-3 border border-slate-700 bg-slate-950/60 p-3"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-sm font-medium text-slate-100">
                                  {field.name || t("propertyTypesEditor.fieldName")}
                                </span>
                                <button
                                  className="h-8 border border-slate-600 bg-slate-800 px-3 text-sm text-slate-100 transition hover:bg-slate-700"
                                  type="button"
                                  onClick={() => {
                                    setDraftPropertyTypes((current) =>
                                      updatePropertyTypeDraft(current, selectedClassType.id, (propertyType) => {
                                        const classPropertyType = propertyType as Extract<
                                          PropertyTypeDefinition,
                                          { kind: "class" }
                                        >;

                                        return {
                                          ...classPropertyType,
                                          fields: classPropertyType.fields.filter(
                                            (_field, index) => index !== fieldIndex
                                          )
                                        };
                                      })
                                    );
                                  }}
                                >
                                  {t("propertyTypesEditor.removeField")}
                                </button>
                              </div>

                              <div className="grid gap-3 md:grid-cols-2">
                                <label className="space-y-2">
                                  <span className="text-xs tracking-[0.16em] text-slate-500 uppercase">
                                    {t("propertyTypesEditor.fieldName")}
                                  </span>
                                  <DialogTextInput
                                    value={field.name}
                                    onChange={(value) => {
                                      setDraftPropertyTypes((current) =>
                                        updatePropertyTypeDraft(current, selectedClassType.id, (propertyType) =>
                                          updateClassFieldDraft(
                                            propertyType as ClassPropertyTypeDefinition,
                                            fieldIndex,
                                            (entry) => ({
                                              ...entry,
                                              name: value
                                            })
                                          )
                                        )
                                      );
                                    }}
                                  />
                                </label>

                                <label className="space-y-2">
                                  <span className="text-xs tracking-[0.16em] text-slate-500 uppercase">
                                    {t("common.type")}
                                  </span>
                                  <DialogSelect
                                    options={PROPERTY_VALUE_TYPE_OPTIONS.map((valueType) => ({
                                      value: valueType,
                                      label: getPropertyTypeLabel(valueType, t)
                                    }))}
                                    value={field.valueType}
                                    onChange={(value) => {
                                      const nextValueType = value as PropertyTypeName;
                                      const nextPropertyTypeName =
                                        nextValueType === "enum"
                                          ? enumOptions[0]?.value
                                          : nextValueType === "class"
                                            ? classOptions[0]?.value
                                            : undefined;
                                      setDraftPropertyTypes((current) =>
                                        updatePropertyTypeDraft(current, selectedClassType.id, (propertyType) =>
                                          updateClassFieldDraft(
                                            propertyType as ClassPropertyTypeDefinition,
                                            fieldIndex,
                                            (entry) =>
                                              withOptionalPropertyTypeName(
                                                {
                                                  ...entry,
                                                  valueType: nextValueType,
                                                  defaultValue: createDefaultPropertyValue(
                                                    nextValueType,
                                                    nextPropertyTypeName,
                                                    current
                                                  )
                                                },
                                                nextPropertyTypeName
                                              )
                                          )
                                        )
                                      );
                                    }}
                                  />
                                </label>
                              </div>

                              {field.valueType === "enum" || field.valueType === "class" ? (
                                <label className="space-y-2">
                                  <span className="text-xs tracking-[0.16em] text-slate-500 uppercase">
                                    {t("propertyTypesEditor.referencedType")}
                                  </span>
                                  <DialogSelect
                                    options={
                                      field.valueType === "enum" ? enumOptions : classOptions
                                    }
                                    value={field.propertyTypeName ?? ""}
                                    onChange={(value) => {
                                      setDraftPropertyTypes((current) =>
                                        updatePropertyTypeDraft(current, selectedClassType.id, (propertyType) =>
                                          updateClassFieldDraft(
                                            propertyType as ClassPropertyTypeDefinition,
                                            fieldIndex,
                                            (entry) => ({
                                              ...entry,
                                              propertyTypeName: value,
                                              defaultValue: createDefaultPropertyValue(
                                                entry.valueType,
                                                value,
                                                current
                                              )
                                            })
                                          )
                                        )
                                      );
                                    }}
                                  />
                                </label>
                              ) : null}

                              <div className="space-y-2">
                                <span className="text-xs tracking-[0.16em] text-slate-500 uppercase">
                                  {t("propertyTypesEditor.defaultValue")}
                                </span>
                                <PropertyValueEditor
                                  propertyTypes={draftPropertyTypes}
                                  value={field.defaultValue}
                                  valueType={field.valueType}
                                  {...(field.propertyTypeName !== undefined
                                    ? { propertyTypeName: field.propertyTypeName }
                                    : {})}
                                  onChange={(value) => {
                                    setDraftPropertyTypes((current) =>
                                      updatePropertyTypeDraft(current, selectedClassType.id, (propertyType) =>
                                        updateClassFieldDraft(
                                          propertyType as ClassPropertyTypeDefinition,
                                          fieldIndex,
                                          (entry) => ({
                                            ...entry,
                                            defaultValue: clonePropertyValue(value)
                                          })
                                        )
                                      )
                                    );
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded border border-dashed border-slate-700 bg-slate-950/50 px-3 py-4 text-sm text-slate-400">
                          {t("propertyTypesEditor.noFields")}
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="px-4 py-4 text-sm text-slate-400">
                {t("propertyTypesEditor.noSelection")}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-700 px-4 py-3">
          <div className="min-h-[20px] text-sm text-rose-300">
            {validationError ?? ""}
          </div>
          <div className="flex items-center gap-3">
            <button
              className="h-8 border border-slate-600 bg-slate-800 px-3 text-sm text-slate-100 transition hover:bg-slate-700"
              type="button"
              onClick={props.onClose}
            >
              {t("action.close")}
            </button>
            <button
              className="h-8 border border-emerald-500/60 bg-emerald-500/10 px-3 text-sm text-emerald-100 transition hover:bg-emerald-500/20"
              type="button"
              onClick={applyDrafts}
            >
              {t("common.apply")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
