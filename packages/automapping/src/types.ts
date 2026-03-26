import type {
  EditorMap,
  LayerId,
  PropertyDefinition,
  TileCell,
  TileLayerBoundsRect
} from "@pixel-editor/domain";

export interface AutomappingEngineIssue {
  severity: "warning" | "error";
  code: string;
  message: string;
  path: string;
}

export interface AutomappingRuleOptions {
  applyChance: number;
  modX: number;
  modY: number;
  offsetX: number;
  offsetY: number;
  disabled: boolean;
  ignoreLock: boolean;
}

export type AutomappingRuleTileMatchType =
  | "Empty"
  | "NonEmpty"
  | "Other"
  | "Negate"
  | "Ignore";

export interface AutomappingRuleTileMetadata {
  matchType?: AutomappingRuleTileMatchType;
}

export type AutomappingRuleTileMetadataResolver = (
  gid: number
) => AutomappingRuleTileMetadata | undefined;

export interface AutomappingPatternCell {
  matchKind: "tile" | "empty";
  cell?: TileCell;
  ignoreHorizontalFlip: boolean;
  ignoreVerticalFlip: boolean;
  ignoreDiagonalFlip: boolean;
}

export interface AutomappingInputConstraint {
  x: number;
  y: number;
  anyOf: AutomappingPatternCell[];
  noneOf: AutomappingPatternCell[];
}

export interface AutomappingCompiledInputLayer {
  layerName: string;
  constraints: AutomappingInputConstraint[];
}

export interface AutomappingCompiledInputSet {
  name: string;
  layers: AutomappingCompiledInputLayer[];
}

export interface AutomappingOutputCell {
  x: number;
  y: number;
  cell: TileCell;
}

export interface AutomappingCompiledOutputLayer {
  targetLayerName: string;
  cells: AutomappingOutputCell[];
  properties: PropertyDefinition[];
}

export interface AutomappingCompiledOutputSet {
  name: string;
  probability: number;
  layers: AutomappingCompiledOutputLayer[];
}

export interface AutomappingCompiledRule {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  inputSets: AutomappingCompiledInputSet[];
  defaultOutput?: AutomappingCompiledOutputSet;
  randomOutputs: AutomappingCompiledOutputSet[];
  options: AutomappingRuleOptions;
}

export interface CompiledAutomappingRuleMap {
  ruleMapName: string;
  rules: AutomappingCompiledRule[];
  inputLayerNames: string[];
  outputLayerNames: string[];
  matchInOrder: boolean;
  issues: AutomappingEngineIssue[];
}

export interface CompileAutomappingRuleMapOptions {
  ruleTileMetadataResolver?: AutomappingRuleTileMetadataResolver;
}

export interface ExecuteAutomappingOptions {
  region?: TileLayerBoundsRect[];
  random?: () => number;
}

export interface RunAutomappingRuleMapOptions
  extends ExecuteAutomappingOptions,
    CompileAutomappingRuleMapOptions {}

export interface AppliedAutomappingRuleMatch {
  ruleId: string;
  x: number;
  y: number;
  randomOutputSetName?: string;
}

export interface ExecutedAutomappingRuleMap {
  map: EditorMap;
  matches: AppliedAutomappingRuleMatch[];
  createdLayerIds: LayerId[];
  issues: AutomappingEngineIssue[];
}
