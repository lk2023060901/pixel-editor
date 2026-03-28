import type { ObjectReferenceOption } from "./ui-models";
import {
  coercePropertyValue,
  isClassPropertyValue,
  type DraftTypeValue,
  type PropertyDraft
} from "./custom-properties-form";
import type {
  ClassPropertyTypeDefinition,
  PropertyDefinition,
  PropertyTypeDefinition,
  PropertyTypeName,
  PropertyValue
} from "@pixel-editor/domain";
import {
  getClassPropertyTypeDefinitionByName,
  getEnumPropertyTypeDefinitionByName
} from "@pixel-editor/domain";

export interface CustomPropertySummaryLabels {
  trueLabel: string;
  falseLabel: string;
  noneLabel: string;
}

export interface CustomPropertyEditorOption {
  label: string;
  value: string;
}

export type CustomPropertyFieldEditorControl =
  | {
      kind: "boolean";
      value: "true" | "false";
      options: [CustomPropertyEditorOption, CustomPropertyEditorOption];
    }
  | {
      kind: "number";
      value: string;
      valueType: "int" | "float";
    }
  | {
      kind: "text";
      value: string;
      valueType: "string" | "color" | "file";
    }
  | {
      kind: "select";
      value: string;
      valueType: "enum" | "object";
      options: CustomPropertyEditorOption[];
    }
  | {
      kind: "class";
      classType: ClassPropertyTypeDefinition;
      members: Record<string, PropertyValue>;
      nextLineage: readonly string[];
    }
  | {
      kind: "unsupported";
      valueType: PropertyTypeName;
    };

export type CustomPropertyDraftValueControl =
  | {
      kind: "class";
      classType: ClassPropertyTypeDefinition;
      members: Record<string, PropertyValue>;
    }
  | {
      kind: "select";
      value: string;
      valueType: "bool" | "enum" | "object";
      options: CustomPropertyEditorOption[];
    }
  | {
      kind: "text";
      value: string;
      inputType: "text" | "number";
      valueType: "string" | "color" | "file" | "int" | "float";
    }
  | {
      kind: "unsupported";
      valueType: DraftTypeValue;
    };

export function resolveCustomPropertyValueSummary(args: {
  property: PropertyDefinition;
  propertyTypes: readonly PropertyTypeDefinition[];
  objectReferenceOptions: readonly ObjectReferenceOption[];
  labels: CustomPropertySummaryLabels;
}): string {
  const { property, propertyTypes, objectReferenceOptions, labels } = args;

  if (property.type === "bool") {
    return property.value ? labels.trueLabel : labels.falseLabel;
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
      return labels.noneLabel;
    }

    const objectId = property.value.objectId;
    return objectReferenceOptions.find((option) => option.id === objectId)?.label ?? objectId;
  }

  if (property.type === "class") {
    return property.propertyTypeName ?? labels.noneLabel;
  }

  return String(property.value);
}

export function deriveCustomPropertyFieldEditorControl(args: {
  valueType: PropertyTypeName;
  propertyTypeName: string | undefined;
  propertyTypes: readonly PropertyTypeDefinition[];
  currentValue: PropertyValue | undefined;
  objectReferenceOptions: readonly ObjectReferenceOption[];
  labels: CustomPropertySummaryLabels;
  lineage?: readonly string[];
}): CustomPropertyFieldEditorControl {
  const { valueType, propertyTypeName, propertyTypes, currentValue, objectReferenceOptions, labels } =
    args;
  const lineage = args.lineage ?? [];

  switch (valueType) {
    case "bool":
      return {
        kind: "boolean",
        value: currentValue === true ? "true" : "false",
        options: [
          { label: labels.trueLabel, value: "true" },
          { label: labels.falseLabel, value: "false" }
        ]
      };
    case "int":
    case "float":
      return {
        kind: "number",
        value: String(typeof currentValue === "number" ? currentValue : 0),
        valueType
      };
    case "string":
    case "color":
    case "file":
      return {
        kind: "text",
        value: typeof currentValue === "string" ? currentValue : "",
        valueType
      };
    case "enum": {
      const enumType = getEnumPropertyTypeDefinitionByName(propertyTypes, propertyTypeName);

      if (!enumType) {
        return {
          kind: "unsupported",
          valueType
        };
      }

      const fallbackValue = coercePropertyValue("enum", propertyTypeName, propertyTypes, currentValue);

      return {
        kind: "select",
        value: String(fallbackValue),
        valueType: "enum",
        options: enumType.values.map((value: string, index: number) => ({
          label: value,
          value: enumType.storageType === "int" ? String(index) : value
        }))
      };
    }
    case "object": {
      const currentObjectId =
        currentValue !== null &&
        typeof currentValue === "object" &&
        currentValue !== undefined &&
        "objectId" in currentValue
          ? currentValue.objectId
          : "";

      return {
        kind: "select",
        value: currentObjectId,
        valueType: "object",
        options: [
          { label: labels.noneLabel, value: "" },
          ...objectReferenceOptions.map((option) => ({
            label: option.label,
            value: option.id
          }))
        ]
      };
    }
    case "class": {
      const nestedClassType = getClassPropertyTypeDefinitionByName(propertyTypes, propertyTypeName);
      const nestedValue = coercePropertyValue("class", propertyTypeName, propertyTypes, currentValue);

      if (
        nestedClassType &&
        !lineage.includes(nestedClassType.name) &&
        isClassPropertyValue(nestedValue)
      ) {
        return {
          kind: "class",
          classType: nestedClassType,
          members: nestedValue.members,
          nextLineage: [...lineage, nestedClassType.name]
        };
      }

      return {
        kind: "unsupported",
        valueType
      };
    }
  }
}

export function resolveCustomPropertyFieldEditorValue(args: {
  control: CustomPropertyFieldEditorControl;
  nextValue: string | Record<string, PropertyValue>;
}): PropertyValue {
  const { control, nextValue } = args;

  switch (control.kind) {
    case "boolean":
      return nextValue === "true";
    case "number": {
      const parsedValue =
        control.valueType === "int"
          ? Number.parseInt(String(nextValue || "0"), 10)
          : Number.parseFloat(String(nextValue || "0"));
      return Number.isNaN(parsedValue) ? 0 : parsedValue;
    }
    case "text":
      return String(nextValue);
    case "select":
      if (control.valueType === "enum") {
        const selectedOption = control.options.find((option) => option.value === String(nextValue));
        const nextOptionIndex = control.options.findIndex(
          (option) => option.value === String(nextValue)
        );
        return nextOptionIndex >= 0 &&
          control.options.every((option, index) => option.value === String(index))
          ? nextOptionIndex
          : selectedOption?.value ?? String(nextValue);
      }

      return nextValue ? { objectId: String(nextValue) as never } : null;
    case "class":
      return {
        members: nextValue as Record<string, PropertyValue>
      };
    case "unsupported":
      return null;
  }
}

export function deriveCustomPropertyDraftValueControl(args: {
  draft: PropertyDraft;
  propertyTypes: readonly PropertyTypeDefinition[];
  objectReferenceOptions: readonly ObjectReferenceOption[];
  labels: CustomPropertySummaryLabels;
}): CustomPropertyDraftValueControl {
  const { draft, propertyTypes, objectReferenceOptions, labels } = args;
  const enumType = getEnumPropertyTypeDefinitionByName(propertyTypes, draft.propertyTypeName);
  const classType = getClassPropertyTypeDefinitionByName(propertyTypes, draft.propertyTypeName);

  if (draft.type === "class" && classType && draft.classMembers) {
    return {
      kind: "class",
      classType,
      members: draft.classMembers
    };
  }

  if (draft.type === "object") {
    return {
      kind: "select",
      value: draft.value,
      valueType: "object",
      options: [
        { label: labels.noneLabel, value: "" },
        ...objectReferenceOptions.map((option) => ({
          label: option.label,
          value: option.id
        }))
      ]
    };
  }

  if (draft.type === "enum" && enumType) {
    return {
      kind: "select",
      value: draft.value,
      valueType: "enum",
      options: enumType.values.map((value: string, index: number) => ({
        label: value,
        value: enumType.storageType === "int" ? String(index) : value
      }))
    };
  }

  if (draft.type === "bool") {
    return {
      kind: "select",
      value: draft.value,
      valueType: "bool",
      options: [
        { label: labels.trueLabel, value: "true" },
        { label: labels.falseLabel, value: "false" }
      ]
    };
  }

  if (draft.type === "int" || draft.type === "float") {
    return {
      kind: "text",
      value: draft.value,
      inputType: "number",
      valueType: draft.type
    };
  }

  if (draft.type === "string" || draft.type === "color" || draft.type === "file") {
    return {
      kind: "text",
      value: draft.value,
      inputType: "text",
      valueType: draft.type
    };
  }

  return {
    kind: "unsupported",
    valueType: draft.type
  };
}

export function resolveCustomPropertyDraftValue(args: {
  control: Exclude<CustomPropertyDraftValueControl, { kind: "unsupported" | "class" }>;
  nextValue: string;
}): string {
  return args.control.kind === "select" || args.control.kind === "text"
    ? args.nextValue
    : "";
}
