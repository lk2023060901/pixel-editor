import { createEntityId, type ProjectId } from "./id";
import type { PropertyTypeDefinition } from "./property";

export interface EditorProjectExportOptions {
  embedTilesets: boolean;
  detachTemplateInstances: boolean;
  resolveObjectTypesAndProperties: boolean;
  exportMinimized: boolean;
}

export interface EditorProject {
  id: ProjectId;
  kind: "project";
  name: string;
  assetRoots: string[];
  compatibilityVersion: string;
  extensionsDirectory: string;
  automappingRulesFile?: string;
  exportOptions: EditorProjectExportOptions;
  propertyTypes: PropertyTypeDefinition[];
}

export interface CreateProjectInput {
  name: string;
  assetRoots: string[];
  compatibilityVersion?: string;
  extensionsDirectory?: string;
  automappingRulesFile?: string;
  exportOptions?: Partial<EditorProjectExportOptions>;
  propertyTypes?: PropertyTypeDefinition[];
}

export interface UpdateProjectDetailsInput {
  compatibilityVersion?: string;
  extensionsDirectory?: string;
  automappingRulesFile?: string | null;
  exportOptions?: Partial<EditorProjectExportOptions>;
}

export function createProjectExportOptions(
  input?: Partial<EditorProjectExportOptions>
): EditorProjectExportOptions {
  return {
    embedTilesets: input?.embedTilesets ?? false,
    detachTemplateInstances: input?.detachTemplateInstances ?? false,
    resolveObjectTypesAndProperties: input?.resolveObjectTypesAndProperties ?? false,
    exportMinimized: input?.exportMinimized ?? false
  };
}

export function createProject(input: CreateProjectInput): EditorProject {
  return {
    id: createEntityId("project"),
    kind: "project",
    name: input.name,
    assetRoots: input.assetRoots,
    compatibilityVersion: input.compatibilityVersion ?? "1.12",
    extensionsDirectory: input.extensionsDirectory ?? "extensions",
    exportOptions: createProjectExportOptions(input.exportOptions),
    propertyTypes: input.propertyTypes ?? [],
    ...(input.automappingRulesFile !== undefined
      ? { automappingRulesFile: input.automappingRulesFile }
      : {})
  };
}
