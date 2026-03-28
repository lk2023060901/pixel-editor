import { describe, expect, it } from "vitest";

import {
  appendProjectClassPropertyFieldDraft,
  appendProjectEnumPropertyTypeValueDraft,
  classPropertyTypeUseAsOptions,
  coerceProjectPropertyTypeDefaultValue,
  createProjectPropertyTypesEditorState,
  createProjectClassPropertyTypeDraft,
  createProjectEnumPropertyTypeDraft,
  deriveProjectPropertyTypesEditorSelection,
  createClassPropertyTypeDefinition,
  createEnumPropertyTypeDefinition,
  deriveProjectPropertyTypeReferenceOptions,
  propertyTypeValueOptions,
  removeProjectClassPropertyFieldDraft,
  removeProjectEnumPropertyTypeValueDraft,
  removeProjectPropertyTypeDraft,
  resolveProjectPropertyTypesSelectedTypeId,
  toggleProjectClassPropertyTypeUseAsDraft,
  updateProjectClassPropertyFieldDefaultValueDraft,
  updateProjectClassPropertyFieldNameDraft,
  updateProjectClassPropertyFieldReferenceTypeDraft,
  updateProjectClassPropertyFieldValueTypeDraft,
  updateProjectClassFieldDraft,
  updateProjectClassPropertyTypeColorDraft,
  updateProjectClassPropertyTypeDrawFillDraft,
  updateProjectEnumPropertyTypeValueDraft,
  updateProjectEnumStorageTypeDraft,
  updateProjectEnumValuesAsFlagsDraft,
  updateProjectPropertyTypeNameDraft,
  updateProjectPropertyTypeDraft,
  validateProjectPropertyTypes,
  withOptionalProjectPropertyTypeName
} from "../src/ui-property-types";

const t = (key: string, params?: Record<string, unknown>): string =>
  params ? `${key}:${JSON.stringify(params)}` : key;

describe("project property types form helpers", () => {
  it("exports option protocols and update helpers through ui-property-types APIs", () => {
    const rarityType = createEnumPropertyTypeDefinition({
      name: "Rarity",
      storageType: "int",
      values: ["Common", "Rare"]
    });
    const statsType = createClassPropertyTypeDefinition({
      name: "Stats",
      fields: [
        {
          name: "hp",
          valueType: "int",
          defaultValue: 10
        }
      ]
    });

    expect(propertyTypeValueOptions).toEqual([
      "string",
      "int",
      "float",
      "bool",
      "color",
      "file",
      "object",
      "enum",
      "class"
    ]);
    expect(classPropertyTypeUseAsOptions).toContain("project");
    expect(
      updateProjectPropertyTypeDraft([rarityType, statsType], statsType.id, (propertyType) => ({
        ...propertyType,
        name: "CombatStats"
      }))[1]?.name
    ).toBe("CombatStats");
    expect(
      updateProjectClassFieldDraft(statsType, 0, (field) => ({
        ...field,
        name: "health"
      })).fields[0]?.name
    ).toBe("health");
    expect(
      withOptionalProjectPropertyTypeName(
        {
          name: "rarity",
          valueType: "enum" as const,
          defaultValue: 0
        },
        rarityType.name
      )
    ).toMatchObject({
      propertyTypeName: "Rarity"
    });
    expect(deriveProjectPropertyTypeReferenceOptions([rarityType, statsType])).toEqual({
      enumOptions: [{ value: "Rarity", label: "Rarity" }],
      classOptions: [{ value: "Stats", label: "Stats" }]
    });
  });

  it("creates editor draft state and resolves selection through exported APIs", () => {
    const rarityType = createEnumPropertyTypeDefinition({
      name: "Rarity",
      values: ["Common", "Rare"]
    });
    const statsType = createClassPropertyTypeDefinition({
      name: "Stats"
    });

    const state = createProjectPropertyTypesEditorState([rarityType, statsType]);

    expect(state.selectedTypeId).toBe(rarityType.id);
    expect(state.draftPropertyTypes).toEqual([rarityType, statsType]);
    expect(state.draftPropertyTypes[0]).not.toBe(rarityType);
    expect(resolveProjectPropertyTypesSelectedTypeId(state.draftPropertyTypes, null)).toBe(
      rarityType.id
    );
    expect(
      resolveProjectPropertyTypesSelectedTypeId(state.draftPropertyTypes, "missing-id")
    ).toBe(rarityType.id);
    expect(
      deriveProjectPropertyTypesEditorSelection(state.draftPropertyTypes, statsType.id)
    ).toMatchObject({
      selectedTypeId: statsType.id,
      selectedClassType: {
        id: statsType.id,
        kind: "class",
        name: "Stats"
      }
    });
    expect(deriveProjectPropertyTypesEditorSelection([], statsType.id)).toEqual({
      selectedTypeId: null,
      selectedType: undefined,
      selectedEnumType: undefined,
      selectedClassType: undefined
    });
  });

  it("creates project property type drafts and applies enum mutations through exported APIs", () => {
    const rarityType = createProjectEnumPropertyTypeDraft({
      existingPropertyTypes: [],
      defaultEnumName: "Enum",
      defaultValueName: "Value"
    });
    const drafts = updateProjectPropertyTypeNameDraft([rarityType], rarityType.id, "Rarity");

    expect(rarityType.name).toBe("Enum 1");
    expect(
      createProjectClassPropertyTypeDraft({
        existingPropertyTypes: [rarityType],
        defaultClassName: "Class"
      }).name
    ).toBe("Class 1");
    expect(
      appendProjectEnumPropertyTypeValueDraft(drafts, rarityType.id, "Value")[0]
    ).toMatchObject({
      values: ["Value", "Value 2"]
    });
    expect(
      updateProjectEnumPropertyTypeValueDraft(drafts, rarityType.id, 0, "Common")[0]
    ).toMatchObject({
      values: ["Common"]
    });
    expect(
      updateProjectEnumStorageTypeDraft(drafts, rarityType.id, "int")[0]
    ).toMatchObject({
      storageType: "int"
    });
    expect(
      updateProjectEnumValuesAsFlagsDraft(drafts, rarityType.id, true)[0]
    ).toMatchObject({
      valuesAsFlags: true
    });
    expect(removeProjectEnumPropertyTypeValueDraft(drafts, rarityType.id, 0)[0]).toMatchObject({
      values: []
    });
    expect(removeProjectPropertyTypeDraft(drafts, rarityType.id)).toEqual([]);
  });

  it("applies class field mutations through exported APIs", () => {
    const rarityType = createEnumPropertyTypeDefinition({
      name: "Rarity",
      storageType: "int",
      values: ["Common", "Rare"]
    });
    const statsType = createClassPropertyTypeDefinition({
      name: "Stats"
    });
    const baseDrafts = [rarityType, statsType];

    expect(
      appendProjectClassPropertyFieldDraft({
        drafts: baseDrafts,
        propertyTypeId: statsType.id,
        defaultFieldName: "Field",
        defaultValueType: "string"
      })[1]
    ).toMatchObject({
      fields: [
        {
          name: "Field 1",
          valueType: "string",
          defaultValue: ""
        }
      ]
    });

    const withField = appendProjectClassPropertyFieldDraft({
      drafts: baseDrafts,
      propertyTypeId: statsType.id,
      defaultFieldName: "Field",
      defaultValueType: "string"
    });
    expect(
      updateProjectClassPropertyFieldNameDraft(withField, statsType.id, 0, "rarity")[1]
    ).toMatchObject({
      fields: [
        {
          name: "rarity"
        }
      ]
    });
    expect(
      updateProjectClassPropertyFieldValueTypeDraft({
        drafts: withField,
        propertyTypeId: statsType.id,
        fieldIndex: 0,
        nextValueType: "enum"
      })[1]
    ).toMatchObject({
      fields: [
        {
          name: "Field 1",
          valueType: "enum",
          propertyTypeName: "Rarity",
          defaultValue: 0
        }
      ]
    });

    const enumFieldDrafts = updateProjectClassPropertyFieldValueTypeDraft({
      drafts: withField,
      propertyTypeId: statsType.id,
      fieldIndex: 0,
      nextValueType: "enum"
    });
    expect(
      updateProjectClassPropertyFieldReferenceTypeDraft({
        drafts: enumFieldDrafts,
        propertyTypeId: statsType.id,
        fieldIndex: 0,
        propertyTypeName: "Rarity"
      })[1]
    ).toMatchObject({
      fields: [
        {
          propertyTypeName: "Rarity",
          defaultValue: 0
        }
      ]
    });
    expect(
      updateProjectClassPropertyFieldDefaultValueDraft({
        drafts: enumFieldDrafts,
        propertyTypeId: statsType.id,
        fieldIndex: 0,
        defaultValue: 1
      })[1]
    ).toMatchObject({
      fields: [
        {
          defaultValue: 1
        }
      ]
    });
    expect(removeProjectClassPropertyFieldDraft(enumFieldDrafts, statsType.id, 0)[1]).toMatchObject({
      fields: []
    });
    expect(toggleProjectClassPropertyTypeUseAsDraft(baseDrafts, statsType.id, "tile", true)[1]).toMatchObject({
      useAs: ["tile"]
    });
    expect(
      updateProjectClassPropertyTypeColorDraft(baseDrafts, statsType.id, "#123456")[1]
    ).toMatchObject({
      color: "#123456"
    });
    expect(
      updateProjectClassPropertyTypeDrawFillDraft(baseDrafts, statsType.id, true)[1]
    ).toMatchObject({
      drawFill: true
    });
  });

  it("coerces nested default values and validates normalized property types", () => {
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
          defaultValue: "bad" as never
        },
        {
          name: "hp",
          valueType: "int",
          defaultValue: "bad" as never
        }
      ]
    });

    expect(
      coerceProjectPropertyTypeDefaultValue(
        "class",
        statsType.name,
        [rarityType, statsType],
        {
          members: {
            rarity: "oops" as never,
            hp: "oops" as never
          }
        }
      )
    ).toEqual({
      members: {
        rarity: 0,
        hp: 0
      }
    });

    const messyRarityType = {
      ...rarityType,
      name: " Rarity ",
      values: [" Common ", " Rare "]
    };
    const messyStatsType = {
      ...statsType,
      name: " Stats ",
      fields: [
        {
          name: " rarity ",
          valueType: "enum" as const,
          propertyTypeName: " Rarity ",
          defaultValue: "bad" as never
        },
        {
          name: " hp ",
          valueType: "int" as const,
          defaultValue: "bad" as never
        }
      ]
    };

    expect(validateProjectPropertyTypes([messyRarityType, messyStatsType], t)).toEqual({
      propertyTypes: [
        {
          ...messyRarityType,
          name: "Rarity",
          values: ["Common", "Rare"]
        },
        {
          ...messyStatsType,
          name: "Stats",
          fields: [
            {
              name: "rarity",
              valueType: "enum",
              propertyTypeName: "Rarity",
              defaultValue: 0
            },
            {
              name: "hp",
              valueType: "int",
              defaultValue: 0
            }
          ]
        }
      ]
    });
  });

  it("rejects missing enum and class references through exported validation", () => {
    const brokenType = createClassPropertyTypeDefinition({
      name: "Broken",
      fields: [
        {
          name: "biome",
          valueType: "enum",
          propertyTypeName: "MissingEnum",
          defaultValue: "forest"
        }
      ]
    });

    expect(validateProjectPropertyTypes([brokenType], t)).toEqual({
      propertyTypes: [],
      error:
        "propertyTypesEditor.validation.missingReference:" +
        JSON.stringify({
          field: "propertyTypesEditor.referencedType"
        })
    });
  });
});
