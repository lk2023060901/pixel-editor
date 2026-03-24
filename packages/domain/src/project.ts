import { createEntityId, type ProjectId } from "./id";
import type { PropertyTypeDefinition } from "./property";

export interface EditorProject {
  id: ProjectId;
  kind: "project";
  name: string;
  assetRoots: string[];
  compatibilityVersion: string;
  extensionsDirectory: string;
  automappingRulesFile?: string;
  propertyTypes: PropertyTypeDefinition[];
}

export interface CreateProjectInput {
  name: string;
  assetRoots: string[];
  compatibilityVersion?: string;
  extensionsDirectory?: string;
  automappingRulesFile?: string;
  propertyTypes?: PropertyTypeDefinition[];
}

export function createProject(input: CreateProjectInput): EditorProject {
  return {
    id: createEntityId("project"),
    kind: "project",
    name: input.name,
    assetRoots: input.assetRoots,
    compatibilityVersion: input.compatibilityVersion ?? "1.12",
    extensionsDirectory: input.extensionsDirectory ?? "extensions",
    propertyTypes: input.propertyTypes ?? [],
    ...(input.automappingRulesFile !== undefined
      ? { automappingRulesFile: input.automappingRulesFile }
      : {})
  };
}
