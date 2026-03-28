import {
  coerceProjectPropertyTypeDefaultValue,
  isProjectPropertyTypeClassValue
} from "./project-property-types-form";
import type {
  ClassPropertyTypeDefinition,
  PropertyTypeDefinition,
  PropertyTypeName,
  PropertyValue
} from "@pixel-editor/domain";
import {
  getClassPropertyTypeDefinitionByName,
  getEnumPropertyTypeDefinitionByName
} from "@pixel-editor/domain";

export interface ProjectPropertyTypeEditorOption {
  label: string;
  value: string;
}

export type ProjectPropertyTypeValueEditorControl =
  | {
      kind: "boolean";
      checked: boolean;
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
      kind: "object";
      value: string;
    }
  | {
      kind: "select";
      value: string;
      valueType: "enum";
      options: ProjectPropertyTypeEditorOption[];
    }
  | {
      kind: "class";
      classType: ClassPropertyTypeDefinition;
      members: Record<string, PropertyValue>;
      nextLineage: readonly string[];
    }
  | {
      kind: "recursive";
    }
  | {
      kind: "unsupported";
      valueType: "enum" | "class";
    };

export function deriveProjectPropertyTypeValueEditorControl(args: {
  valueType: PropertyTypeName;
  propertyTypeName: string | undefined;
  propertyTypes: readonly PropertyTypeDefinition[];
  value: PropertyValue | undefined;
  lineage?: readonly string[];
}): ProjectPropertyTypeValueEditorControl {
  const { valueType, propertyTypeName, propertyTypes, value } = args;
  const lineage = args.lineage ?? [];

  switch (valueType) {
    case "bool":
      return {
        kind: "boolean",
        checked: Boolean(value)
      };
    case "int":
    case "float":
      return {
        kind: "number",
        value: String(
          typeof value === "number"
            ? value
            : coerceProjectPropertyTypeDefaultValue(valueType, propertyTypeName, propertyTypes, value)
        ),
        valueType
      };
    case "string":
    case "color":
    case "file":
      return {
        kind: "text",
        value: typeof value === "string" ? value : "",
        valueType
      };
    case "object":
      return {
        kind: "object",
        value:
          value !== null && value !== undefined && typeof value === "object" && "objectId" in value
            ? value.objectId
            : ""
      };
    case "enum": {
      const enumType = getEnumPropertyTypeDefinitionByName(propertyTypes, propertyTypeName);

      if (!enumType) {
        return {
          kind: "unsupported",
          valueType
        };
      }

      const fallbackValue = coerceProjectPropertyTypeDefaultValue(
        "enum",
        propertyTypeName,
        propertyTypes,
        value
      );

      return {
        kind: "select",
        value:
          enumType.storageType === "int"
            ? String(typeof fallbackValue === "number" ? fallbackValue : 0)
            : String(fallbackValue),
        valueType: "enum",
        options: enumType.values.map((entry: string, index: number) => ({
          value: enumType.storageType === "int" ? String(index) : entry,
          label: entry
        }))
      };
    }
    case "class": {
      const classType = getClassPropertyTypeDefinitionByName(propertyTypes, propertyTypeName);

      if (!classType) {
        return {
          kind: "unsupported",
          valueType
        };
      }

      if (lineage.includes(classType.name)) {
        return {
          kind: "recursive"
        };
      }

      const classValue = coerceProjectPropertyTypeDefaultValue(
        "class",
        classType.name,
        propertyTypes,
        value,
        lineage
      );

      return {
        kind: "class",
        classType,
        members: isProjectPropertyTypeClassValue(classValue) ? classValue.members : {},
        nextLineage: [...lineage, classType.name]
      };
    }
  }
}

export function resolveProjectPropertyTypeValueEditorValue(args: {
  control: ProjectPropertyTypeValueEditorControl;
  nextValue: string | boolean | Record<string, PropertyValue>;
}): PropertyValue {
  const { control, nextValue } = args;

  switch (control.kind) {
    case "boolean":
      return Boolean(nextValue);
    case "number": {
      const parsedValue =
        control.valueType === "int"
          ? Number.parseInt(String(nextValue || "0"), 10)
          : Number.parseFloat(String(nextValue || "0"));
      return Number.isNaN(parsedValue) ? 0 : parsedValue;
    }
    case "text":
      return String(nextValue);
    case "object":
      return String(nextValue).trim() ? { objectId: String(nextValue).trim() as never } : null;
    case "select":
      return control.options.every((option, index) => option.value === String(index))
        ? Number(String(nextValue))
        : String(nextValue);
    case "class":
      return {
        members: nextValue as Record<string, PropertyValue>
      };
    case "recursive":
    case "unsupported":
      return null;
  }
}
