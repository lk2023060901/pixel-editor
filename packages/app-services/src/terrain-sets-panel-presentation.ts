import type { TerrainSetsPanelWangSetItemViewState } from "./ui-models";

export type TerrainSetsWangSetType = TerrainSetsPanelWangSetItemViewState["type"];

export interface TerrainSetsWangSetTypeOption {
  value: TerrainSetsWangSetType;
  label: string;
}

export const terrainSetsWangSetTypes: TerrainSetsWangSetType[] = [
  "corner",
  "edge",
  "mixed"
];

export function getTerrainSetsWangSetTypeOptions(
  getLabel: (type: TerrainSetsWangSetType) => string
): TerrainSetsWangSetTypeOption[] {
  return terrainSetsWangSetTypes.map((value) => ({
    value,
    label: getLabel(value)
  }));
}
