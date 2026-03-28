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
} from "@pixel-editor/domain";
import { createIndexedName } from "./config";

export const propertyTypeValueOptions: PropertyTypeName[] = [
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

export const classPropertyTypeUseAsOptions: PropertyTypeUseAs[] = [
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

export type ProjectPropertyTypesTranslationValues = Record<
  string,
  string | number | boolean | null | undefined
>;
export type ProjectPropertyTypesValidationTranslator = (...args: never[]) => string;

export interface ProjectPropertyTypeReferenceOption {
  label: string;
  value: string;
}

export interface ProjectPropertyTypesEditorState {
  draftPropertyTypes: PropertyTypeDefinition[];
  selectedTypeId: string | null;
  validationError: string | null;
}

export interface ProjectPropertyTypesEditorSelection {
  selectedTypeId: string | null;
  selectedType: PropertyTypeDefinition | undefined;
  selectedEnumType: Extract<PropertyTypeDefinition, { kind: "enum" }> | undefined;
  selectedClassType: Extract<PropertyTypeDefinition, { kind: "class" }> | undefined;
}

export interface ProjectPropertyTypesApplyResult {
  nextState: ProjectPropertyTypesEditorState;
  propertyTypes?: PropertyTypeDefinition[];
}

export function resolveProjectPropertyTypesEditorState(args: {
  draftPropertyTypes: readonly PropertyTypeDefinition[];
  selectedTypeId: string | null;
  validationError?: string | null;
}): ProjectPropertyTypesEditorState {
  return {
    draftPropertyTypes: [...args.draftPropertyTypes],
    selectedTypeId: resolveProjectPropertyTypesSelectedTypeId(
      args.draftPropertyTypes,
      args.selectedTypeId
    ),
    validationError: args.validationError ?? null
  };
}

export function resolveProjectPropertyTypesSelectedTypeId(
  propertyTypes: readonly PropertyTypeDefinition[],
  selectedTypeId: string | null
): string | null {
  if (propertyTypes.length === 0) {
    return null;
  }

  if (!selectedTypeId) {
    return propertyTypes[0]?.id ?? null;
  }

  return propertyTypes.some((propertyType) => propertyType.id === selectedTypeId)
    ? selectedTypeId
    : (propertyTypes[0]?.id ?? null);
}

export function createProjectPropertyTypesEditorState(
  propertyTypes: readonly PropertyTypeDefinition[]
): ProjectPropertyTypesEditorState {
  const draftPropertyTypes = propertyTypes.map((propertyType) =>
    clonePropertyTypeDefinition(propertyType)
  );

  return resolveProjectPropertyTypesEditorState({
    draftPropertyTypes,
    selectedTypeId: null,
    validationError: null
  });
}

export function deriveProjectPropertyTypesEditorSelection(
  propertyTypes: readonly PropertyTypeDefinition[],
  selectedTypeId: string | null
): ProjectPropertyTypesEditorSelection {
  const resolvedSelectedTypeId = resolveProjectPropertyTypesSelectedTypeId(
    propertyTypes,
    selectedTypeId
  );
  const selectedType = resolvedSelectedTypeId
    ? propertyTypes.find((propertyType) => propertyType.id === resolvedSelectedTypeId)
    : undefined;

  return {
    selectedTypeId: resolvedSelectedTypeId,
    selectedType,
    selectedEnumType: selectedType?.kind === "enum" ? selectedType : undefined,
    selectedClassType: selectedType?.kind === "class" ? selectedType : undefined
  };
}

export function updateProjectPropertyTypesEditorDraftsState(args: {
  state: ProjectPropertyTypesEditorState;
  draftPropertyTypes: readonly PropertyTypeDefinition[];
  selectedTypeId?: string | null;
}): ProjectPropertyTypesEditorState {
  return resolveProjectPropertyTypesEditorState({
    draftPropertyTypes: args.draftPropertyTypes,
    selectedTypeId: args.selectedTypeId ?? args.state.selectedTypeId,
    validationError: null
  });
}

export function selectProjectPropertyTypesEditorType(
  state: ProjectPropertyTypesEditorState,
  selectedTypeId: string | null
): ProjectPropertyTypesEditorState {
  return resolveProjectPropertyTypesEditorState({
    draftPropertyTypes: state.draftPropertyTypes,
    selectedTypeId,
    validationError: null
  });
}

export function isProjectPropertyTypeClassValue(
  value: PropertyValue | undefined
): value is ClassPropertyValue {
  return value !== null && typeof value === "object" && value !== undefined && "members" in value;
}

export function coerceProjectPropertyTypeDefaultValue(
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

      const fallbackMembers = isProjectPropertyTypeClassValue(fallback) ? fallback.members : {};
      const currentMembers = isProjectPropertyTypeClassValue(currentValue)
        ? currentValue.members
        : {};

      return {
        members: Object.fromEntries(
          classType.fields.map((field) => [
            field.name,
            coerceProjectPropertyTypeDefaultValue(
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

export function updateProjectPropertyTypeDraft(
  drafts: readonly PropertyTypeDefinition[],
  propertyTypeId: string,
  updater: (propertyType: PropertyTypeDefinition) => PropertyTypeDefinition
): PropertyTypeDefinition[] {
  return drafts.map((propertyType) =>
    propertyType.id === propertyTypeId ? updater(propertyType) : propertyType
  );
}

export function updateProjectClassFieldDraft(
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

export function deriveProjectPropertyTypeReferenceOptions(
  propertyTypes: readonly PropertyTypeDefinition[]
): {
  enumOptions: ProjectPropertyTypeReferenceOption[];
  classOptions: ProjectPropertyTypeReferenceOption[];
} {
  return {
    enumOptions: propertyTypes
      .filter((propertyType) => propertyType.kind === "enum")
      .map((propertyType) => ({
        value: propertyType.name,
        label: propertyType.name
      })),
    classOptions: propertyTypes
      .filter((propertyType) => propertyType.kind === "class")
      .map((propertyType) => ({
        value: propertyType.name,
        label: propertyType.name
      }))
  };
}

export function createProjectEnumPropertyTypeDraft(args: {
  existingPropertyTypes: readonly PropertyTypeDefinition[];
  defaultEnumName: string;
  defaultValueName: string;
}) {
  return createEnumPropertyTypeDefinition({
    name: createIndexedName(
      args.defaultEnumName,
      args.existingPropertyTypes.filter((propertyType) => propertyType.kind === "enum").length + 1
    ),
    values: [args.defaultValueName]
  });
}

export function createProjectClassPropertyTypeDraft(args: {
  existingPropertyTypes: readonly PropertyTypeDefinition[];
  defaultClassName: string;
}) {
  return createClassPropertyTypeDefinition({
    name: createIndexedName(
      args.defaultClassName,
      args.existingPropertyTypes.filter((propertyType) => propertyType.kind === "class").length + 1
    )
  });
}

export function removeProjectPropertyTypeDraft(
  drafts: readonly PropertyTypeDefinition[],
  propertyTypeId: string
): PropertyTypeDefinition[] {
  return drafts.filter((propertyType) => propertyType.id !== propertyTypeId);
}

export function updateProjectPropertyTypeNameDraft(
  drafts: readonly PropertyTypeDefinition[],
  propertyTypeId: string,
  name: string
): PropertyTypeDefinition[] {
  return updateProjectPropertyTypeDraft(drafts, propertyTypeId, (propertyType) => ({
    ...propertyType,
    name
  }));
}

export function updateProjectEnumStorageTypeDraft(
  drafts: readonly PropertyTypeDefinition[],
  propertyTypeId: string,
  storageType: "string" | "int"
): PropertyTypeDefinition[] {
  return updateProjectPropertyTypeDraft(drafts, propertyTypeId, (propertyType) =>
    propertyType.kind === "enum"
      ? {
          ...propertyType,
          storageType
        }
      : propertyType
  );
}

export function updateProjectEnumValuesAsFlagsDraft(
  drafts: readonly PropertyTypeDefinition[],
  propertyTypeId: string,
  valuesAsFlags: boolean
): PropertyTypeDefinition[] {
  return updateProjectPropertyTypeDraft(drafts, propertyTypeId, (propertyType) =>
    propertyType.kind === "enum"
      ? {
          ...propertyType,
          valuesAsFlags
        }
      : propertyType
  );
}

export function appendProjectEnumPropertyTypeValueDraft(
  drafts: readonly PropertyTypeDefinition[],
  propertyTypeId: string,
  defaultValueName: string
): PropertyTypeDefinition[] {
  return updateProjectPropertyTypeDraft(drafts, propertyTypeId, (propertyType) =>
    propertyType.kind === "enum"
      ? {
          ...propertyType,
          values: [
            ...propertyType.values,
            createIndexedName(defaultValueName, propertyType.values.length + 1)
          ]
        }
      : propertyType
  );
}

export function updateProjectEnumPropertyTypeValueDraft(
  drafts: readonly PropertyTypeDefinition[],
  propertyTypeId: string,
  valueIndex: number,
  nextValue: string
): PropertyTypeDefinition[] {
  return updateProjectPropertyTypeDraft(drafts, propertyTypeId, (propertyType) =>
    propertyType.kind === "enum"
      ? {
          ...propertyType,
          values: propertyType.values.map((entry, index) =>
            index === valueIndex ? nextValue : entry
          )
        }
      : propertyType
  );
}

export function removeProjectEnumPropertyTypeValueDraft(
  drafts: readonly PropertyTypeDefinition[],
  propertyTypeId: string,
  valueIndex: number
): PropertyTypeDefinition[] {
  return updateProjectPropertyTypeDraft(drafts, propertyTypeId, (propertyType) =>
    propertyType.kind === "enum"
      ? {
          ...propertyType,
          values: propertyType.values.filter((_entry, index) => index !== valueIndex)
        }
      : propertyType
  );
}

export function updateProjectClassPropertyTypeColorDraft(
  drafts: readonly PropertyTypeDefinition[],
  propertyTypeId: string,
  color: string
): PropertyTypeDefinition[] {
  return updateProjectPropertyTypeDraft(drafts, propertyTypeId, (propertyType) =>
    propertyType.kind === "class"
      ? {
          ...propertyType,
          color
        }
      : propertyType
  );
}

export function updateProjectClassPropertyTypeDrawFillDraft(
  drafts: readonly PropertyTypeDefinition[],
  propertyTypeId: string,
  drawFill: boolean
): PropertyTypeDefinition[] {
  return updateProjectPropertyTypeDraft(drafts, propertyTypeId, (propertyType) =>
    propertyType.kind === "class"
      ? {
          ...propertyType,
          drawFill
        }
      : propertyType
  );
}

export function toggleProjectClassPropertyTypeUseAsDraft(
  drafts: readonly PropertyTypeDefinition[],
  propertyTypeId: string,
  useAs: PropertyTypeUseAs,
  checked: boolean
): PropertyTypeDefinition[] {
  return updateProjectPropertyTypeDraft(drafts, propertyTypeId, (propertyType) =>
    propertyType.kind === "class"
      ? {
          ...propertyType,
          useAs: checked
            ? [...propertyType.useAs, useAs]
            : propertyType.useAs.filter((entry) => entry !== useAs)
        }
      : propertyType
  );
}

function resolveProjectPropertyTypeDefaultReferenceName(
  propertyTypes: readonly PropertyTypeDefinition[],
  valueType: PropertyTypeName
): string | undefined {
  if (valueType === "enum") {
    return propertyTypes.find((propertyType) => propertyType.kind === "enum")?.name;
  }

  if (valueType === "class") {
    return propertyTypes.find((propertyType) => propertyType.kind === "class")?.name;
  }

  return undefined;
}

export function appendProjectClassPropertyFieldDraft(args: {
  drafts: readonly PropertyTypeDefinition[];
  propertyTypeId: string;
  defaultFieldName: string;
  defaultValueType?: PropertyTypeName;
}): PropertyTypeDefinition[] {
  const defaultValueType = args.defaultValueType ?? "string";
  const nextPropertyTypeName = resolveProjectPropertyTypeDefaultReferenceName(
    args.drafts,
    defaultValueType
  );

  return updateProjectPropertyTypeDraft(args.drafts, args.propertyTypeId, (propertyType) =>
    propertyType.kind === "class"
      ? {
          ...propertyType,
          fields: [
            ...propertyType.fields,
            withOptionalProjectPropertyTypeName(
              {
                name: createIndexedName(args.defaultFieldName, propertyType.fields.length + 1),
                valueType: defaultValueType,
                defaultValue: createDefaultPropertyValue(
                  defaultValueType,
                  nextPropertyTypeName,
                  args.drafts
                )
              },
              nextPropertyTypeName
            )
          ]
        }
      : propertyType
  );
}

export function removeProjectClassPropertyFieldDraft(
  drafts: readonly PropertyTypeDefinition[],
  propertyTypeId: string,
  fieldIndex: number
): PropertyTypeDefinition[] {
  return updateProjectPropertyTypeDraft(drafts, propertyTypeId, (propertyType) =>
    propertyType.kind === "class"
      ? {
          ...propertyType,
          fields: propertyType.fields.filter((_field, index) => index !== fieldIndex)
        }
      : propertyType
  );
}

export function updateProjectClassPropertyFieldNameDraft(
  drafts: readonly PropertyTypeDefinition[],
  propertyTypeId: string,
  fieldIndex: number,
  name: string
): PropertyTypeDefinition[] {
  return updateProjectPropertyTypeDraft(drafts, propertyTypeId, (propertyType) =>
    propertyType.kind === "class"
      ? updateProjectClassFieldDraft(propertyType, fieldIndex, (entry) => ({
          ...entry,
          name
        }))
      : propertyType
  );
}

export function updateProjectClassPropertyFieldValueTypeDraft(args: {
  drafts: readonly PropertyTypeDefinition[];
  propertyTypeId: string;
  fieldIndex: number;
  nextValueType: PropertyTypeName;
}): PropertyTypeDefinition[] {
  const nextPropertyTypeName = resolveProjectPropertyTypeDefaultReferenceName(
    args.drafts,
    args.nextValueType
  );

  return updateProjectPropertyTypeDraft(args.drafts, args.propertyTypeId, (propertyType) =>
    propertyType.kind === "class"
      ? updateProjectClassFieldDraft(propertyType, args.fieldIndex, (entry) =>
          withOptionalProjectPropertyTypeName(
            {
              ...entry,
              valueType: args.nextValueType,
              defaultValue: createDefaultPropertyValue(
                args.nextValueType,
                nextPropertyTypeName,
                args.drafts
              )
            },
            nextPropertyTypeName
          )
        )
      : propertyType
  );
}

export function updateProjectClassPropertyFieldReferenceTypeDraft(args: {
  drafts: readonly PropertyTypeDefinition[];
  propertyTypeId: string;
  fieldIndex: number;
  propertyTypeName: string | undefined;
}): PropertyTypeDefinition[] {
  return updateProjectPropertyTypeDraft(args.drafts, args.propertyTypeId, (propertyType) =>
    propertyType.kind === "class"
      ? updateProjectClassFieldDraft(propertyType, args.fieldIndex, (entry) =>
          withOptionalProjectPropertyTypeName(
            {
              ...entry,
              defaultValue: createDefaultPropertyValue(
                entry.valueType,
                args.propertyTypeName,
                args.drafts
              )
            },
            args.propertyTypeName
          )
        )
      : propertyType
  );
}

export function updateProjectClassPropertyFieldDefaultValueDraft(args: {
  drafts: readonly PropertyTypeDefinition[];
  propertyTypeId: string;
  fieldIndex: number;
  defaultValue: PropertyValue;
}): PropertyTypeDefinition[] {
  return updateProjectPropertyTypeDraft(args.drafts, args.propertyTypeId, (propertyType) =>
    propertyType.kind === "class"
      ? updateProjectClassFieldDraft(propertyType, args.fieldIndex, (entry) => ({
          ...entry,
          defaultValue: clonePropertyValue(args.defaultValue)
        }))
      : propertyType
  );
}

export function withOptionalProjectPropertyTypeName<T extends { propertyTypeName?: string }>(
  value: Omit<T, "propertyTypeName">,
  propertyTypeName: string | undefined
): T {
  return {
    ...value,
    ...(propertyTypeName !== undefined ? { propertyTypeName } : {})
  } as T;
}

export function validateProjectPropertyTypes(
  propertyTypes: readonly PropertyTypeDefinition[],
  t: ProjectPropertyTypesValidationTranslator
): { propertyTypes: PropertyTypeDefinition[]; error?: string } {
  const translate = t as (
    key: string,
    params?: ProjectPropertyTypesTranslationValues
  ) => string;
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
        error: translate("propertyTypesEditor.validation.required", {
          field: translate("propertyTypesEditor.typeName")
        })
      };
    }

    if (normalizedNames.has(propertyType.name)) {
      return {
        propertyTypes: [],
        error: translate("propertyTypesEditor.validation.duplicate", {
          field: translate("propertyTypesEditor.typeName"),
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
            error: translate("propertyTypesEditor.validation.required", {
              field: translate("propertyTypesEditor.enumValue")
            })
          };
        }

        if (valueNames.has(nextValue)) {
          return {
            propertyTypes: [],
            error: translate("propertyTypesEditor.validation.duplicate", {
              field: translate("propertyTypesEditor.enumValue"),
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
          error: translate("propertyTypesEditor.validation.required", {
            field: translate("propertyTypesEditor.fieldName")
          })
        };
      }

      if (fieldNames.has(field.name)) {
        return {
          propertyTypes: [],
          error: translate("propertyTypesEditor.validation.duplicate", {
            field: translate("propertyTypesEditor.fieldName"),
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
            error: translate("propertyTypesEditor.validation.missingReference", {
              field: translate("propertyTypesEditor.referencedType")
            })
          };
        }
      } else {
        delete field.propertyTypeName;
      }

      field.defaultValue = clonePropertyValue(
        coerceProjectPropertyTypeDefaultValue(
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

export function resolveProjectPropertyTypesApplyResult(args: {
  state: ProjectPropertyTypesEditorState;
  t: ProjectPropertyTypesValidationTranslator;
}): ProjectPropertyTypesApplyResult {
  const validation = validateProjectPropertyTypes(args.state.draftPropertyTypes, args.t);

  if (validation.error) {
    return {
      nextState: resolveProjectPropertyTypesEditorState({
        draftPropertyTypes: args.state.draftPropertyTypes,
        selectedTypeId: args.state.selectedTypeId,
        validationError: validation.error
      })
    };
  }

  return {
    nextState: resolveProjectPropertyTypesEditorState({
      draftPropertyTypes: validation.propertyTypes,
      selectedTypeId: args.state.selectedTypeId,
      validationError: null
    }),
    propertyTypes: validation.propertyTypes
  };
}
