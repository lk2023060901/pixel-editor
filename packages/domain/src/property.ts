import type { ObjectId, PropertyTypeId } from "./id";

export type PrimitivePropertyType =
  | "bool"
  | "color"
  | "file"
  | "float"
  | "int"
  | "object"
  | "string";

export type PropertyTypeName = PrimitivePropertyType | "enum" | "class";

export interface ObjectReferenceValue {
  objectId: ObjectId;
}

export interface ClassPropertyValue {
  members: Record<string, PropertyValue>;
}

export type PropertyValue =
  | boolean
  | number
  | string
  | null
  | ObjectReferenceValue
  | ClassPropertyValue
  | PropertyValue[];

export interface PropertyDefinition {
  name: string;
  type: PropertyTypeName;
  value: PropertyValue;
  propertyTypeName?: string;
}

export interface EnumPropertyTypeDefinition {
  id: PropertyTypeId;
  kind: "enum";
  name: string;
  storageType: "string" | "int";
  values: string[];
  valuesAsFlags: boolean;
}

export interface ClassPropertyFieldDefinition {
  name: string;
  valueType: PropertyTypeName;
  propertyTypeName?: string;
  defaultValue?: PropertyValue;
}

export interface ClassPropertyTypeDefinition {
  id: PropertyTypeId;
  kind: "class";
  name: string;
  useAs: PropertyTypeUseAs[];
  fields: ClassPropertyFieldDefinition[];
}

export type PropertyTypeUseAs =
  | "map"
  | "layer"
  | "object"
  | "tile"
  | "tileset"
  | "project"
  | "world"
  | "template";

export type PropertyTypeDefinition =
  | EnumPropertyTypeDefinition
  | ClassPropertyTypeDefinition;

export function createProperty(
  name: string,
  type: PropertyTypeName,
  value: PropertyValue,
  propertyTypeName?: string
): PropertyDefinition {
  return {
    name,
    type,
    value,
    ...(propertyTypeName !== undefined ? { propertyTypeName } : {})
  };
}

export function clonePropertyValue(value: PropertyValue): PropertyValue {
  if (Array.isArray(value)) {
    return value.map((entry) => clonePropertyValue(entry));
  }

  if (value === null || typeof value !== "object") {
    return value;
  }

  if ("members" in value) {
    return {
      members: Object.fromEntries(
        Object.entries(value.members).map(([key, memberValue]) => [
          key,
          clonePropertyValue(memberValue)
        ])
      )
    };
  }

  if ("objectId" in value) {
    return {
      objectId: value.objectId
    };
  }

  return value;
}

export function clonePropertyDefinition(
  property: PropertyDefinition
): PropertyDefinition {
  return {
    name: property.name,
    type: property.type,
    value: clonePropertyValue(property.value),
    ...(property.propertyTypeName !== undefined
      ? { propertyTypeName: property.propertyTypeName }
      : {})
  };
}

export function getPropertyTypeDefinitionByName(
  propertyTypes: readonly PropertyTypeDefinition[],
  propertyTypeName: string | undefined
): PropertyTypeDefinition | undefined {
  if (!propertyTypeName) {
    return undefined;
  }

  return propertyTypes.find((propertyType) => propertyType.name === propertyTypeName);
}

export function getEnumPropertyTypeDefinitionByName(
  propertyTypes: readonly PropertyTypeDefinition[],
  propertyTypeName: string | undefined
): EnumPropertyTypeDefinition | undefined {
  const propertyType = getPropertyTypeDefinitionByName(propertyTypes, propertyTypeName);

  return propertyType?.kind === "enum" ? propertyType : undefined;
}

export function getClassPropertyTypeDefinitionByName(
  propertyTypes: readonly PropertyTypeDefinition[],
  propertyTypeName: string | undefined
): ClassPropertyTypeDefinition | undefined {
  const propertyType = getPropertyTypeDefinitionByName(propertyTypes, propertyTypeName);

  return propertyType?.kind === "class" ? propertyType : undefined;
}

function createDefaultPropertyValueInternal(
  valueType: PropertyTypeName,
  propertyTypeName: string | undefined,
  propertyTypes: readonly PropertyTypeDefinition[],
  lineage: readonly string[]
): PropertyValue {
  switch (valueType) {
    case "bool":
      return false;
    case "int":
    case "float":
      return 0;
    case "string":
    case "color":
    case "file":
      return "";
    case "object":
      return null;
    case "enum": {
      const enumType = getEnumPropertyTypeDefinitionByName(propertyTypes, propertyTypeName);

      if (!enumType) {
        return "";
      }

      return enumType.storageType === "int" ? 0 : enumType.values[0] ?? "";
    }
    case "class": {
      const classType = getClassPropertyTypeDefinitionByName(propertyTypes, propertyTypeName);

      if (!classType || lineage.includes(classType.name)) {
        return { members: {} };
      }

      return {
        members: Object.fromEntries(
          classType.fields.map((field) => [
            field.name,
            field.defaultValue !== undefined
              ? clonePropertyValue(field.defaultValue)
              : createDefaultPropertyValueInternal(
                  field.valueType,
                  field.propertyTypeName,
                  propertyTypes,
                  [...lineage, classType.name]
                )
          ])
        )
      };
    }
  }
}

export function createDefaultPropertyValue(
  valueType: PropertyTypeName,
  propertyTypeName: string | undefined,
  propertyTypes: readonly PropertyTypeDefinition[]
): PropertyValue {
  return createDefaultPropertyValueInternal(valueType, propertyTypeName, propertyTypes, []);
}

export function createSuggestedPropertiesForClassType(
  propertyTypes: readonly PropertyTypeDefinition[],
  classTypeName: string | undefined,
  useAs: PropertyTypeUseAs
): PropertyDefinition[] {
  const classType = getClassPropertyTypeDefinitionByName(propertyTypes, classTypeName);

  if (!classType || !classType.useAs.includes(useAs)) {
    return [];
  }

  return classType.fields.map((field) =>
    createProperty(
      field.name,
      field.valueType,
      field.defaultValue !== undefined
        ? clonePropertyValue(field.defaultValue)
        : createDefaultPropertyValue(
            field.valueType,
            field.propertyTypeName,
            propertyTypes
          ),
      field.propertyTypeName
    )
  );
}

export function mergeSuggestedPropertyDefinitions(
  explicitProperties: readonly PropertyDefinition[],
  suggestedProperties: readonly PropertyDefinition[]
): PropertyDefinition[] {
  const explicitPropertiesByName = new Map(
    explicitProperties.map((property) => [property.name, property])
  );
  const mergedProperties: PropertyDefinition[] = [];

  for (const suggestedProperty of suggestedProperties) {
    mergedProperties.push(
      clonePropertyDefinition(
        explicitPropertiesByName.get(suggestedProperty.name) ?? suggestedProperty
      )
    );
    explicitPropertiesByName.delete(suggestedProperty.name);
  }

  for (const explicitProperty of explicitProperties) {
    if (!explicitPropertiesByName.has(explicitProperty.name)) {
      continue;
    }

    mergedProperties.push(clonePropertyDefinition(explicitProperty));
  }

  return mergedProperties;
}

function sanitizePropertyName(name: string): string {
  const nextName = name.trim();

  if (!nextName) {
    throw new Error("Property name must not be empty");
  }

  return nextName;
}

export function upsertPropertyDefinition(
  properties: readonly PropertyDefinition[],
  property: PropertyDefinition,
  previousName = property.name
): PropertyDefinition[] {
  const nextProperty: PropertyDefinition = {
    ...property,
    name: sanitizePropertyName(property.name)
  };
  const previousPropertyName = sanitizePropertyName(previousName);

  return [
    ...properties.filter(
      (entry) =>
        entry.name !== previousPropertyName && entry.name !== nextProperty.name
    ),
    nextProperty
  ];
}

export function removePropertyDefinition(
  properties: readonly PropertyDefinition[],
  propertyName: string
): PropertyDefinition[] {
  const nextPropertyName = sanitizePropertyName(propertyName);

  return properties.filter((property) => property.name !== nextPropertyName);
}
