import type {
  AssetReferenceDescriptor,
  AssetReferenceResolveOptions
} from "@pixel-editor/asset-reference";

export interface AutomappingRulesImportIssue {
  severity: "warning";
  code: string;
  message: string;
  path: string;
}

export interface AutomappingRulesImportOptions extends AssetReferenceResolveOptions {
  loadTextFile?: (resolvedPath: string) => string | undefined;
}

export interface AutomappingRuleMapReference {
  filePath: string;
  line: number;
  mapNameFilter?: string;
  sourceFilePath?: string;
}

export interface AutomappingRulesIncludeReference {
  filePath: string;
  line: number;
  mapNameFilter?: string;
  sourceFilePath?: string;
}

export interface ImportedAutomappingRulesFile {
  ruleMaps: AutomappingRuleMapReference[];
  includes: AutomappingRulesIncludeReference[];
  assetReferences: AssetReferenceDescriptor[];
  issues: AutomappingRulesImportIssue[];
}
