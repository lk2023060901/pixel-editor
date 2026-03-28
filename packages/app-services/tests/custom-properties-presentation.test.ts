import { describe, expect, it } from "vitest";

import {
  createClassPropertyTypeDefinition,
  createEnumPropertyTypeDefinition
} from "../src/ui-property-types";
import {
  createProperty,
  deriveCustomPropertyDraftValueControl,
  deriveCustomPropertyFieldEditorControl,
  resolveCustomPropertyDraftValue,
  resolveCustomPropertyFieldEditorValue,
  resolveCustomPropertyValueSummary
} from "../src/ui-custom-properties";

const labels = {
  trueLabel: "True",
  falseLabel: "False",
  noneLabel: "None"
} as const;

describe("custom properties presentation helpers", () => {
  it("resolves property summaries through exported helpers", () => {
    const rarityType = createEnumPropertyTypeDefinition({
      name: "Rarity",
      storageType: "int",
      values: ["Common", "Rare"]
    });

    expect(
      resolveCustomPropertyValueSummary({
        property: createProperty("visible", "bool", true),
        propertyTypes: [rarityType],
        objectReferenceOptions: [],
        labels
      })
    ).toBe("True");

    expect(
      resolveCustomPropertyValueSummary({
        property: createProperty("rarity", "enum", 1, rarityType.name),
        propertyTypes: [rarityType],
        objectReferenceOptions: [],
        labels
      })
    ).toBe("Rare");

    expect(
      resolveCustomPropertyValueSummary({
        property: createProperty("target", "object", { objectId: "spawn-point" as never }),
        propertyTypes: [rarityType],
        objectReferenceOptions: [{ id: "spawn-point" as never, label: "Spawn Point" }],
        labels
      })
    ).toBe("Spawn Point");
  });

  it("derives field controls and resolves normalized values through exported APIs", () => {
    const rarityType = createEnumPropertyTypeDefinition({
      name: "Rarity",
      storageType: "int",
      values: ["Common", "Rare"]
    });
    const statsType = createClassPropertyTypeDefinition({
      name: "Stats",
      fields: [
        {
          name: "rarity",
          valueType: "enum",
          propertyTypeName: rarityType.name,
          defaultValue: 0
        }
      ]
    });

    const enumControl = deriveCustomPropertyFieldEditorControl({
      valueType: "enum",
      propertyTypeName: rarityType.name,
      propertyTypes: [rarityType, statsType],
      currentValue: 1,
      objectReferenceOptions: [],
      labels
    });
    expect(enumControl).toMatchObject({
      kind: "select",
      value: "1"
    });
    expect(
      resolveCustomPropertyFieldEditorValue({
        control: enumControl,
        nextValue: "0"
      })
    ).toBe(0);

    const classControl = deriveCustomPropertyFieldEditorControl({
      valueType: "class",
      propertyTypeName: statsType.name,
      propertyTypes: [rarityType, statsType],
      currentValue: undefined,
      objectReferenceOptions: [],
      labels
    });
    expect(classControl).toMatchObject({
      kind: "class",
      members: {
        rarity: 0
      }
    });
  });

  it("derives draft controls without leaking branch logic into ui-editor", () => {
    const rarityType = createEnumPropertyTypeDefinition({
      name: "Rarity",
      values: ["Common", "Rare"]
    });

    const boolControl = deriveCustomPropertyDraftValueControl({
      draft: {
        name: "visible",
        type: "bool",
        propertyTypeName: undefined,
        value: "false",
        classMembers: undefined
      },
      propertyTypes: [rarityType],
      objectReferenceOptions: [],
      labels
    });
    expect(boolControl).toMatchObject({
      kind: "select",
      valueType: "bool",
      value: "false"
    });
    expect(
      boolControl.kind === "select"
        ? resolveCustomPropertyDraftValue({
            control: boolControl,
            nextValue: "true"
          })
        : ""
    ).toBe("true");

    expect(
      deriveCustomPropertyDraftValueControl({
        draft: {
          name: "broken",
          type: "enum",
          propertyTypeName: "MissingType",
          value: "bad",
          classMembers: undefined
        },
        propertyTypes: [rarityType],
        objectReferenceOptions: [],
        labels
      })
    ).toEqual({
      kind: "unsupported",
      valueType: "enum"
    });
  });
});
