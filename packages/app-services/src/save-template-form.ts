export const defaultTemplateAssetName = "template";

export interface SaveTemplateDraft {
  templateName: string;
  templatePath: string;
}

export function slugifyTemplateAssetName(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || defaultTemplateAssetName;
}

export function createDefaultTemplatePath(name: string): string {
  return `templates/${slugifyTemplateAssetName(name)}.tx`;
}

export function resolveDefaultTemplateName(objectName: string): string {
  return objectName.trim() || defaultTemplateAssetName;
}

export function createSaveTemplateDraft(objectName: string): SaveTemplateDraft {
  const templateName = resolveDefaultTemplateName(objectName);

  return {
    templateName,
    templatePath: createDefaultTemplatePath(templateName)
  };
}

export function resolveSaveTemplateNameChange(args: {
  currentTemplateName: string;
  currentTemplatePath: string;
  nextTemplateName: string;
}): SaveTemplateDraft {
  const currentDefaultPath = createDefaultTemplatePath(args.currentTemplateName);

  return {
    templateName: args.nextTemplateName,
    templatePath:
      args.currentTemplatePath === currentDefaultPath
        ? createDefaultTemplatePath(args.nextTemplateName)
        : args.currentTemplatePath
  };
}
