import { describe, expect, it } from "vitest";

import {
  clonePropertyDefinition,
  createDefaultPropertyValue,
  createProperty,
  type PropertyTypeDefinition,
  removePropertyDefinition,
  upsertPropertyDefinition
} from "./property";

describe("property helpers", () => {
  it("upserts and renames property definitions by name", () => {
    const original = [
      createProperty("music", "string", "forest"),
      createProperty("spawnWeight", "int", 2)
    ];

    const updated = upsertPropertyDefinition(
      original,
      createProperty("spawnTier", "int", 3),
      "spawnWeight"
    );

    expect(updated).toEqual([
      createProperty("music", "string", "forest"),
      createProperty("spawnTier", "int", 3)
    ]);
  });

  it("removes property definitions by sanitized name", () => {
    const original = [
      createProperty("music", "string", "forest"),
      createProperty("spawnWeight", "int", 2)
    ];

    expect(removePropertyDefinition(original, " spawnWeight ")).toEqual([
      createProperty("music", "string", "forest")
    ]);
  });

  it("creates default enum and class property values from project property types", () => {
    const propertyTypes: PropertyTypeDefinition[] = [
      {
        id: "propertyType_biome" as never,
        kind: "enum",
        name: "Biome",
        storageType: "string",
        values: ["forest", "ruins", "cave"],
        valuesAsFlags: false
      },
      {
        id: "propertyType_encounter" as never,
        kind: "class",
        name: "EncounterConfig",
        useAs: ["map"],
        fields: [
          {
            name: "enabled",
            valueType: "bool",
            defaultValue: true
          },
          {
            name: "biome",
            valueType: "enum",
            propertyTypeName: "Biome"
          },
          {
            name: "difficulty",
            valueType: "int",
            defaultValue: 2
          }
        ]
      }
    ];

    expect(createDefaultPropertyValue("enum", "Biome", propertyTypes)).toBe("forest");
    expect(createDefaultPropertyValue("object", undefined, propertyTypes)).toBeNull();
    expect(createDefaultPropertyValue("class", "EncounterConfig", propertyTypes)).toEqual({
      members: {
        enabled: true,
        biome: "forest",
        difficulty: 2
      }
    });
  });

  it("deep clones nested class property values", () => {
    const property = createProperty("encounter", "class", {
      members: {
        enabled: true,
        nested: {
          members: {
            biome: "ruins"
          }
        }
      }
    }, "EncounterConfig");

    const clone = clonePropertyDefinition(property);

    expect(clone).toEqual(property);
    expect(clone).not.toBe(property);
    expect(clone.value).not.toBe(property.value);
  });
});
