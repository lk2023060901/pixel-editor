import { describe, expect, it } from "vitest";

import {
  getTerrainSetsWangSetTypeOptions,
  type TerrainSetsWangSetType,
  terrainSetsWangSetTypes
} from "../src/ui";

describe("terrain sets panel presentation helpers", () => {
  it("exports wang set types and options through shared APIs", () => {
    expect(terrainSetsWangSetTypes).toEqual(["corner", "edge", "mixed"]);
    expect(
      getTerrainSetsWangSetTypeOptions((type: TerrainSetsWangSetType) => `label:${type}`)
    ).toEqual([
      { value: "corner", label: "label:corner" },
      { value: "edge", label: "label:edge" },
      { value: "mixed", label: "label:mixed" }
    ]);
  });
});
