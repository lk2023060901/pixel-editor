import {
  clonePropertyValue,
  createDefaultPropertyValue,
  createProperty,
  getClassPropertyTypeDefinitionByName,
  getEnumPropertyTypeDefinitionByName,
  type ClassPropertyValue,
  type PrimitivePropertyType,
  type PropertyDefinition,
  type PropertyTypeDefinition,
  type PropertyValue
} from "@pixel-editor/domain";

export type EditablePropertyType = Exclude<PrimitivePropertyType, "object">;
export type DraftTypeValue = EditablePropertyType | "enum" | "class" | "object";
export const NEW_PROPERTY_KEY = "__new__";

export interface PropertyDraft {
  name: string;
  type: DraftTypeValue;
  propertyTypeName: string | undefined;
  value: string;
  classMembers: Record<string, PropertyValue> | undefined;
}

export function getEnumPropertyTypes(
  propertyTypes: readonly PropertyTypeDefinition[]
): PropertyTypeDefinition[] {
  return propertyTypes.filter((propertyType) => propertyType.kind === "enum");
}

export function getClassPropertyTypes(
  propertyTypes: readonly PropertyTypeDefinition[]
): PropertyTypeDefinition[] {
  return propertyTypes.filter((propertyType) => propertyType.kind === "class");
}

export function buildTypedOptionValue(
  kind: "enum" | "class",
  propertyTypeName: string
): string {
  return `${kind}:${propertyTypeName}`;
}

export function isClassPropertyValue(
  value: PropertyValue | undefined
): value is ClassPropertyValue {
  return value !== undefined && value !== null && typeof value === "object" && "members" in value;
}

export function coercePropertyValue(
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

export function createPropertyDraft(
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

export function parsePropertyDraft(
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

export function createEmptyPropertyDraft(): PropertyDraft {
  return {
    name: "",
    type: "string",
    propertyTypeName: undefined,
    value: "",
    classMembers: undefined
  };
}

export function getDraftTypeSelectValue(draft: PropertyDraft): string {
  return draft.type === "enum" || draft.type === "class"
    ? buildTypedOptionValue(draft.type, draft.propertyTypeName ?? "")
    : draft.type;
}

export function updateDraftTypeFromValue(
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
