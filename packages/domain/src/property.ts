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
  useAs: Array<
    | "map"
    | "layer"
    | "object"
    | "tile"
    | "tileset"
    | "project"
    | "world"
    | "template"
  >;
  fields: ClassPropertyFieldDefinition[];
}

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
