import {
  createEmptyClipboardState,
  type ClipboardState
} from "./clipboard";
import {
  clearCanvasPreview,
  clearObjectTransformPreview,
  createEditorInteractionState,
  type EditorInteractionState
} from "./interactions";
import {
  clearEditorIssueEntries,
  createEditorIssueState,
  replaceEditorIssueSourceEntries,
  setEditorIssuePanelOpen,
  toggleEditorIssuePanel,
  type EditorIssueEntry,
  type EditorIssueState
} from "./issues";

export interface EditorRuntimeState {
  clipboard: ClipboardState;
  interactions: EditorInteractionState;
  issues: EditorIssueState;
}

export function createEditorRuntimeState(
  overrides: Partial<EditorRuntimeState> = {}
): EditorRuntimeState {
  return {
    clipboard: overrides.clipboard ?? createEmptyClipboardState(),
    interactions: createEditorInteractionState(overrides.interactions),
    issues: createEditorIssueState(overrides.issues)
  };
}

export function clearEditorRuntimeInteractions(
  state: EditorRuntimeState
): EditorRuntimeState {
  if (
    state.interactions.canvasPreview.kind === "none" &&
    state.interactions.objectTransformPreview.kind === "none"
  ) {
    return state;
  }

  return {
    ...state,
    interactions: clearObjectTransformPreview(clearCanvasPreview(state.interactions))
  };
}

export function setEditorRuntimeClipboard(
  state: EditorRuntimeState,
  clipboard: ClipboardState
): EditorRuntimeState {
  return {
    ...state,
    clipboard
  };
}

export function replaceEditorRuntimeIssueSourceEntries(
  state: EditorRuntimeState,
  sourceId: string,
  entries: readonly EditorIssueEntry[]
): EditorRuntimeState {
  const issues = replaceEditorIssueSourceEntries(state.issues, sourceId, entries);

  if (issues === state.issues) {
    return state;
  }

  return {
    ...state,
    issues
  };
}

export function clearEditorRuntimeIssueEntries(
  state: EditorRuntimeState
): EditorRuntimeState {
  const issues = clearEditorIssueEntries(state.issues);

  if (issues === state.issues) {
    return state;
  }

  return {
    ...state,
    issues
  };
}

export function setEditorRuntimeIssuePanelOpen(
  state: EditorRuntimeState,
  panelOpen: boolean
): EditorRuntimeState {
  const issues = setEditorIssuePanelOpen(state.issues, panelOpen);

  if (issues === state.issues) {
    return state;
  }

  return {
    ...state,
    issues
  };
}

export function toggleEditorRuntimeIssuePanel(
  state: EditorRuntimeState
): EditorRuntimeState {
  return {
    ...state,
    issues: toggleEditorIssuePanel(state.issues)
  };
}
