import { createHistoryCommand, type HistoryCommand } from "@pixel-editor/command-engine";
import {
  cloneMapObject,
  createObjectTemplate,
  type MapObject,
  type ObjectTemplate,
  type TemplateId,
  type TilesetId
} from "@pixel-editor/domain";
import type { EditorWorkspaceState } from "@pixel-editor/editor-state";

function patchSessionActiveTemplate(
  state: EditorWorkspaceState,
  activeTemplateId: TemplateId | undefined
): EditorWorkspaceState["session"] {
  const nextSession = {
    ...state.session
  };

  if (activeTemplateId !== undefined) {
    return {
      ...nextSession,
      activeTemplateId
    };
  }

  delete nextSession.activeTemplateId;
  return nextSession;
}

function normalizeTemplateObject(object: MapObject): MapObject {
  const nextObject = cloneMapObject(object);
  delete nextObject.templateId;
  return nextObject;
}

export function buildObjectTemplateDocument(input: {
  name: string;
  object: MapObject;
  tilesetIds?: readonly TilesetId[];
}): ObjectTemplate {
  return createObjectTemplate(
    input.name,
    normalizeTemplateObject(input.object),
    [...(input.tilesetIds ?? [])]
  );
}

function addTemplateToWorkspace(
  state: EditorWorkspaceState,
  template: ObjectTemplate
): EditorWorkspaceState {
  return {
    ...state,
    templates: [...state.templates, template],
    session: {
      ...patchSessionActiveTemplate(state, template.id),
      hasUnsavedChanges: true
    }
  };
}

export function setActiveTemplateCommand(
  templateId: TemplateId
): HistoryCommand<EditorWorkspaceState> {
  return createHistoryCommand({
    id: "template.setActive",
    description: `Set active template ${templateId}`,
    run: (state) => {
      const template = state.templates.find((entry) => entry.id === templateId);

      if (!template) {
        return state;
      }

      return {
        ...state,
        session: patchSessionActiveTemplate(state, template.id)
      };
    }
  });
}

export function addImportedTemplateCommand(
  template: ObjectTemplate
): HistoryCommand<EditorWorkspaceState> {
  return createHistoryCommand({
    id: "template.import",
    description: `Import template ${template.name}`,
    run: (state) => addTemplateToWorkspace(state, template)
  });
}

export function createObjectTemplateDocumentCommand(input: {
  name: string;
  object: MapObject;
  tilesetIds?: readonly TilesetId[];
}): HistoryCommand<EditorWorkspaceState> {
  const template = buildObjectTemplateDocument(input);

  return createHistoryCommand({
    id: "template.create",
    description: `Create template ${template.name}`,
    run: (state) => addTemplateToWorkspace(state, template)
  });
}
