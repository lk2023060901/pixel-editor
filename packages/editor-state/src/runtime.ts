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

export interface EditorRuntimeState {
  clipboard: ClipboardState;
  interactions: EditorInteractionState;
}

export function createEditorRuntimeState(
  overrides: Partial<EditorRuntimeState> = {}
): EditorRuntimeState {
  return {
    clipboard: overrides.clipboard ?? createEmptyClipboardState(),
    interactions: createEditorInteractionState(overrides.interactions)
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
