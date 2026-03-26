export type EditorIssueSeverity = "warning" | "error";

export type EditorIssueSourceKind =
  | "automapping"
  | "project"
  | "world"
  | "tmj"
  | "tsj"
  | "tmx"
  | "tsx"
  | "tx"
  | "validation";

export interface EditorIssueEntry {
  id: string;
  sourceId: string;
  sourceKind: EditorIssueSourceKind;
  documentName: string;
  documentPath?: string;
  severity: EditorIssueSeverity;
  code: string;
  message: string;
  path: string;
}

export interface EditorIssueState {
  panelOpen: boolean;
  entries: EditorIssueEntry[];
}

export function createEditorIssueState(
  overrides: Partial<EditorIssueState> = {}
): EditorIssueState {
  return {
    panelOpen: overrides.panelOpen ?? false,
    entries: overrides.entries ?? []
  };
}

export function setEditorIssuePanelOpen(
  state: EditorIssueState,
  panelOpen: boolean
): EditorIssueState {
  if (state.panelOpen === panelOpen) {
    return state;
  }

  return {
    ...state,
    panelOpen
  };
}

export function toggleEditorIssuePanel(state: EditorIssueState): EditorIssueState {
  return setEditorIssuePanelOpen(state, !state.panelOpen);
}

export function replaceEditorIssueSourceEntries(
  state: EditorIssueState,
  sourceId: string,
  entries: readonly EditorIssueEntry[]
): EditorIssueState {
  const nextEntries = [
    ...state.entries.filter((entry) => entry.sourceId !== sourceId),
    ...entries
  ];

  if (nextEntries === state.entries) {
    return state;
  }

  return {
    ...state,
    entries: nextEntries
  };
}

export function clearEditorIssueEntries(state: EditorIssueState): EditorIssueState {
  if (state.entries.length === 0) {
    return state;
  }

  return {
    ...state,
    entries: []
  };
}

export function summarizeEditorIssues(state: EditorIssueState): {
  errorCount: number;
  warningCount: number;
} {
  return state.entries.reduce(
    (summary, entry) => ({
      errorCount: summary.errorCount + (entry.severity === "error" ? 1 : 0),
      warningCount: summary.warningCount + (entry.severity === "warning" ? 1 : 0)
    }),
    {
      errorCount: 0,
      warningCount: 0
    }
  );
}
