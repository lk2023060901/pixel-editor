import {
  createEmptyClipboardState,
  type ClipboardState
} from "./clipboard";
import {
  clearCanvasPreview,
  createEditorInteractionState,
  type EditorInteractionState
} from "./interactions";

export interface EditorRuntimeState {
  clipboard: ClipboardState;
  interactions: EditorInteractionState;
}

export function createEditorRuntimeState(
  overrides: Partial<EditorRuntimeState> = {}
): EditorRuntimeState {
  return {
    clipboard: overrides.clipboard ?? createEmptyClipboardState(),
    interactions: overrides.interactions ?? createEditorInteractionState()
  };
}

export function clearEditorRuntimeInteractions(
  state: EditorRuntimeState
): EditorRuntimeState {
  if (state.interactions.canvasPreview.kind === "none") {
    return state;
  }

  return {
    ...state,
    interactions: clearCanvasPreview(state.interactions)
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
