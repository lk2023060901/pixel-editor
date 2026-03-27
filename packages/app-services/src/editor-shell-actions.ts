import type { EditorToolId, ShapeFillMode } from "@pixel-editor/editor-state";
import type { LayerId } from "@pixel-editor/domain";

import type { EditorController } from "./controller";

export type EditorShellLocalAction =
  | "export-as-image"
  | "toggle-custom-types-editor"
  | "toggle-project-properties"
  | "open-tile-animation-editor"
  | "open-tile-collision-editor"
  | "focus-terrain-sets";

export type EditorShellActionPlan =
  | { kind: "noop" }
  | {
      kind: "transition";
      run: (store: EditorController) => void;
    }
  | {
      kind: "async";
      run: (store: EditorController) => Promise<unknown>;
    }
  | {
      kind: "local";
      action: EditorShellLocalAction;
    };

export function createEditorShellActionPlan(input: {
  actionId: string;
  editorToolId?: EditorToolId;
  activeLayerId?: LayerId;
  canUseWorldTool: boolean;
}): EditorShellActionPlan {
  const toolId = input.editorToolId;

  if (toolId !== undefined) {
    if (toolId === "world-tool" && !input.canUseWorldTool) {
      return { kind: "noop" };
    }

    return {
      kind: "transition",
      run: (store) => {
        store.setActiveTool(toolId);
      }
    };
  }

  switch (input.actionId) {
    case "new":
    case "new-map":
      return {
        kind: "transition",
        run: (store) => {
          store.createQuickMapDocument();
        }
      };
    case "undo":
      return {
        kind: "transition",
        run: (store) => {
          store.undo();
        }
      };
    case "redo":
      return {
        kind: "transition",
        run: (store) => {
          store.redo();
        }
      };
    case "save":
      return {
        kind: "async",
        run: (store) => store.saveActiveDocument()
      };
    case "save-all":
      return {
        kind: "async",
        run: (store) => store.saveAllDocuments()
      };
    case "export":
      return {
        kind: "async",
        run: (store) => store.exportActiveDocumentAsJson()
      };
    case "export-as-image":
      return {
        kind: "local",
        action: "export-as-image"
      };
    case "show-grid":
      return {
        kind: "transition",
        run: (store) => {
          store.toggleGrid();
        }
      };
    case "enable-worlds":
      return {
        kind: "transition",
        run: (store) => {
          store.toggleWorlds();
        }
      };
    case "auto-map-while-drawing":
      return {
        kind: "transition",
        run: (store) => {
          store.toggleAutoMapWhileDrawing();
        }
      };
    case "highlight-current-layer":
      return {
        kind: "transition",
        run: (store) => {
          store.toggleHighlightCurrentLayer();
        }
      };
    case "custom-types-editor":
      return {
        kind: "local",
        action: "toggle-custom-types-editor"
      };
    case "project-properties":
      return {
        kind: "local",
        action: "toggle-project-properties"
      };
    case "auto-map":
      return {
        kind: "transition",
        run: (store) => {
          store.runManualAutomapping();
        }
      };
    case "zoom-in":
      return {
        kind: "transition",
        run: (store) => {
          store.zoomIn();
        }
      };
    case "zoom-out":
      return {
        kind: "transition",
        run: (store) => {
          store.zoomOut();
        }
      };
    case "zoom-normal":
      return {
        kind: "transition",
        run: (store) => {
          store.setViewportZoom(1);
        }
      };
    case "add-tile-layer":
      return {
        kind: "transition",
        run: (store) => {
          store.addTileLayer();
        }
      };
    case "add-object-layer":
      return {
        kind: "transition",
        run: (store) => {
          store.addObjectLayer();
        }
      };
    case "add-image-layer":
      return {
        kind: "transition",
        run: (store) => {
          store.addImageLayer();
        }
      };
    case "add-group-layer":
      return {
        kind: "transition",
        run: (store) => {
          store.addGroupLayer();
        }
      };
    case "remove-layers":
      return {
        kind: "transition",
        run: (store) => {
          store.removeActiveLayer();
        }
      };
    case "show-hide-layers":
      if (input.activeLayerId === undefined) {
        return { kind: "noop" };
      }

      return {
        kind: "transition",
        run: (store) => {
          store.toggleLayerVisibility(input.activeLayerId!);
        }
      };
    case "lock-unlock-layers":
      if (input.activeLayerId === undefined) {
        return { kind: "noop" };
      }

      return {
        kind: "transition",
        run: (store) => {
          store.toggleLayerLock(input.activeLayerId!);
        }
      };
    case "show-hide-other-layers":
      return {
        kind: "transition",
        run: (store) => {
          store.toggleOtherLayersVisibility();
        }
      };
    case "lock-unlock-other-layers":
      return {
        kind: "transition",
        run: (store) => {
          store.toggleOtherLayersLock();
        }
      };
    case "raise-layers":
      return {
        kind: "transition",
        run: (store) => {
          store.moveActiveLayer("up");
        }
      };
    case "lower-layers":
      return {
        kind: "transition",
        run: (store) => {
          store.moveActiveLayer("down");
        }
      };
    case "tile-animation-editor":
      return {
        kind: "local",
        action: "open-tile-animation-editor"
      };
    case "edit-collision":
      return {
        kind: "local",
        action: "open-tile-collision-editor"
      };
    case "edit-wang-sets":
      return {
        kind: "local",
        action: "focus-terrain-sets"
      };
    case "shape-fill-rectangle":
      return {
        kind: "transition",
        run: (store) => {
          store.setShapeFillMode("rectangle" satisfies ShapeFillMode);
        }
      };
    case "shape-fill-ellipse":
      return {
        kind: "transition",
        run: (store) => {
          store.setShapeFillMode("ellipse" satisfies ShapeFillMode);
        }
      };
    default:
      return { kind: "noop" };
  }
}
