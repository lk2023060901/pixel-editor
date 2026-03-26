import {
  createHistoryCommand,
  type HistoryCommand
} from "@pixel-editor/command-engine";
import type { EditorProject } from "@pixel-editor/domain";
import type { EditorWorkspaceState } from "@pixel-editor/editor-state";

export function replaceProjectCommand(
  project: EditorProject
): HistoryCommand<EditorWorkspaceState> {
  return createHistoryCommand({
    id: "project.replace",
    description: `Replace project metadata with ${project.name}`,
    run: (state) => ({
      ...state,
      project,
      session: {
        ...state.session,
        hasUnsavedChanges: true
      }
    })
  });
}
