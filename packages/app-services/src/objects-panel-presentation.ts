export interface ObjectsPanelActionAvailability {
  canCreateRectangle: boolean;
  canRemoveSelected: boolean;
  canCopy: boolean;
  canCut: boolean;
  canPaste: boolean;
  canSaveAsTemplate: boolean;
  canReplaceWithTemplate: boolean;
  canResetTemplateInstances: boolean;
  canDetachTemplateInstances: boolean;
}

export interface ObjectsPanelActionAvailabilityInput {
  activeTemplateName: string | undefined;
  hasActiveLayer: boolean;
  hasObjectClipboard: boolean;
  hasObjectSelection: boolean;
  hasTemplateInstanceSelection: boolean;
  saveAsTemplateEnabled: boolean;
  replaceWithTemplateEnabled: boolean;
  resetTemplateInstancesEnabled: boolean;
  detachTemplateInstancesEnabled: boolean;
}

export function deriveObjectsPanelActionAvailability(
  input: ObjectsPanelActionAvailabilityInput
): ObjectsPanelActionAvailability {
  return {
    canCreateRectangle: input.hasActiveLayer,
    canRemoveSelected: input.hasActiveLayer && input.hasObjectSelection,
    canCopy: input.hasActiveLayer && input.hasObjectSelection,
    canCut: input.hasActiveLayer && input.hasObjectSelection,
    canPaste: input.hasActiveLayer && input.hasObjectClipboard,
    canSaveAsTemplate:
      input.hasActiveLayer && input.hasObjectSelection && input.saveAsTemplateEnabled,
    canReplaceWithTemplate:
      input.hasActiveLayer &&
      input.hasObjectSelection &&
      Boolean(input.activeTemplateName) &&
      input.replaceWithTemplateEnabled,
    canResetTemplateInstances:
      input.hasActiveLayer &&
      input.hasTemplateInstanceSelection &&
      input.resetTemplateInstancesEnabled,
    canDetachTemplateInstances:
      input.hasActiveLayer &&
      input.hasTemplateInstanceSelection &&
      input.detachTemplateInstancesEnabled
  };
}
