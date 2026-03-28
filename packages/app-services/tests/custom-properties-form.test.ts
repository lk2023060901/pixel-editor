import { describe, expect, it } from "vitest";

import {
  createClassPropertyTypeDefinition,
  createEnumPropertyTypeDefinition
} from "../src/ui-property-types";
import {
  buildTypedOptionValue,
  createEmptyPropertyDraft,
  createProperty,
  createPropertyDraft,
  getClassPropertyTypes,
  getDraftTypeSelectValue,
  getEnumPropertyTypes,
  NEW_PROPERTY_KEY,
  parsePropertyDraft,
  updateDraftTypeFromValue
} from "../src/ui-custom-properties";

describe("custom properties form helpers", () => {
  it("creates and parses typed drafts through exported custom property APIs", () => {
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
        },
        {
          name: "hp",
          valueType: "int",
          defaultValue: 10
        }
      ]
    });
    const propertyTypes = [rarityType, statsType] as const;

    expect(NEW_PROPERTY_KEY).toBe("__new__");
    expect(getEnumPropertyTypes(propertyTypes).map((propertyType) => propertyType.name)).toEqual([
      "Rarity"
    ]);
    expect(getClassPropertyTypes(propertyTypes).map((propertyType) => propertyType.name)).toEqual([
      "Stats"
    ]);

    const draft = createPropertyDraft(
      createProperty(
        "stats",
        "class",
        {
          members: {
            rarity: 1,
            hp: 25
          }
        },
        statsType.name
      ),
      propertyTypes
    );

    expect(draft).toMatchObject({
      name: "stats",
      type: "class",
      propertyTypeName: "Stats",
      classMembers: {
        rarity: 1,
        hp: 25
      }
    });
    expect(getDraftTypeSelectValue(draft)).toBe(buildTypedOptionValue("class", "Stats"));

    expect(
      parsePropertyDraft(
        {
          name: " rarity ",
          type: "enum",
          propertyTypeName: rarityType.name,
          value: "1",
          classMembers: undefined
        },
        propertyTypes
      )
    ).toEqual(createProperty("rarity", "enum", 1, rarityType.name));
  });

  it("updates empty drafts from exported type selection protocols", () => {
    const rarityType = createEnumPropertyTypeDefinition({
      name: "Rarity",
      values: ["Common", "Rare"]
    });
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
    const propertyTypes = [rarityType, statsType] as const;

    expect(
      updateDraftTypeFromValue(
        createEmptyPropertyDraft(),
        buildTypedOptionValue("enum", rarityType.name),
        propertyTypes
      )
    ).toMatchObject({
      type: "enum",
      propertyTypeName: "Rarity",
      value: "Common"
    });

    expect(
      updateDraftTypeFromValue(
        createEmptyPropertyDraft(),
        buildTypedOptionValue("class", statsType.name),
        propertyTypes
      )
    ).toMatchObject({
      type: "class",
      propertyTypeName: "Stats",
      classMembers: {
        speed: 1.5
      }
    });

    expect(
      parsePropertyDraft(
        {
          name: "broken",
          type: "int",
          propertyTypeName: undefined,
          value: "NaN",
          classMembers: undefined
        },
        propertyTypes
      )
    ).toBeUndefined();
  });
});
