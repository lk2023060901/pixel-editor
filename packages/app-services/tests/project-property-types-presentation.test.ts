import { describe, expect, it } from "vitest";

import {
  createClassPropertyTypeDefinition,
  createEnumPropertyTypeDefinition,
  deriveProjectPropertyTypeValueEditorControl,
  resolveProjectPropertyTypeValueEditorValue
} from "../src/ui-property-types";

describe("project property types presentation helpers", () => {
  it("derives enum and object controls through exported APIs", () => {
    const rarityType = createEnumPropertyTypeDefinition({
      name: "Rarity",
      storageType: "int",
      values: ["Common", "Rare"]
    });

    const enumControl = deriveProjectPropertyTypeValueEditorControl({
      valueType: "enum",
      propertyTypeName: rarityType.name,
      propertyTypes: [rarityType],
      value: 1
    });
    expect(enumControl).toMatchObject({
      kind: "select",
      value: "1"
    });
    expect(
      resolveProjectPropertyTypeValueEditorValue({
        control: enumControl,
        nextValue: "0"
      })
    ).toBe(0);

    const objectControl = deriveProjectPropertyTypeValueEditorControl({
      valueType: "object",
      propertyTypeName: undefined,
      propertyTypes: [rarityType],
      value: null
    });
    expect(objectControl).toEqual({
      kind: "object",
      value: ""
    });
  });

  it("handles class and recursive controls via exported value editor helpers", () => {
    const statsType = createClassPropertyTypeDefinition({
      name: "Stats",
      fields: [
        {
          name: "speed",
          valueType: "float",
          defaultValue: 1.5
        }
      ]
    });
    const loopType = createClassPropertyTypeDefinition({
      name: "Loop",
      fields: [
        {
          name: "self",
          valueType: "class",
          propertyTypeName: "Loop"
        }
      ]
    });

    const classControl = deriveProjectPropertyTypeValueEditorControl({
      valueType: "class",
      propertyTypeName: statsType.name,
      propertyTypes: [statsType, loopType],
      value: undefined
    });
    expect(classControl).toMatchObject({
      kind: "class",
      members: {
        speed: 1.5
      }
    });
    expect(
      resolveProjectPropertyTypeValueEditorValue({
        control: classControl,
        nextValue: { speed: 3.5 }
      })
    ).toEqual({
      members: {
        speed: 3.5
      }
    });

    expect(
      deriveProjectPropertyTypeValueEditorControl({
        valueType: "class",
        propertyTypeName: loopType.name,
        propertyTypes: [loopType],
        value: undefined,
        lineage: [loopType.name]
      })
    ).toEqual({
      kind: "recursive"
    });
  });
});
