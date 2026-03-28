import type { EditorProject, UpdateProjectDetailsInput } from "@pixel-editor/domain";

export interface ProjectPropertiesDraft {
  compatibilityVersion: string;
  extensionsDirectory: string;
  automappingRulesFile: string;
  embedTilesets: boolean;
  detachTemplateInstances: boolean;
  resolveObjectTypesAndProperties: boolean;
  exportMinimized: boolean;
}

export const projectCompatibilityVersionOptions = [
  {
    value: "1.8",
    labelKey: "projectPropertiesDialog.compatibilityVersion.v1_8"
  },
  {
    value: "1.9",
    labelKey: "projectPropertiesDialog.compatibilityVersion.v1_9"
  },
  {
    value: "1.10",
    labelKey: "projectPropertiesDialog.compatibilityVersion.v1_10"
  },
  {
    value: "1.11",
    labelKey: "projectPropertiesDialog.compatibilityVersion.v1_11"
  },
  {
    value: "1.12",
    labelKey: "projectPropertiesDialog.compatibilityVersion.v1_12"
  },
  {
    value: "latest",
    labelKey: "projectPropertiesDialog.compatibilityVersion.latest"
  }
] as const;

export function createProjectPropertiesDraft(
  project: EditorProject
): ProjectPropertiesDraft {
  return {
    compatibilityVersion: project.compatibilityVersion,
    extensionsDirectory: project.extensionsDirectory,
    automappingRulesFile: project.automappingRulesFile ?? "",
    embedTilesets: project.exportOptions.embedTilesets,
    detachTemplateInstances: project.exportOptions.detachTemplateInstances,
    resolveObjectTypesAndProperties: project.exportOptions.resolveObjectTypesAndProperties,
    exportMinimized: project.exportOptions.exportMinimized
  };
}

export function buildProjectPropertiesUpdatePatch(
  draft: ProjectPropertiesDraft
): UpdateProjectDetailsInput {
  const extensionsDirectory = draft.extensionsDirectory.trim();
  const automappingRulesFile = draft.automappingRulesFile.trim();

  return {
    compatibilityVersion: draft.compatibilityVersion,
    extensionsDirectory:
      extensionsDirectory.length > 0 ? extensionsDirectory : "extensions",
    automappingRulesFile:
      automappingRulesFile.length > 0 ? automappingRulesFile : null,
    exportOptions: {
      embedTilesets: draft.embedTilesets,
      detachTemplateInstances: draft.detachTemplateInstances,
      resolveObjectTypesAndProperties: draft.resolveObjectTypesAndProperties,
      exportMinimized: draft.exportMinimized
    }
  };
}
