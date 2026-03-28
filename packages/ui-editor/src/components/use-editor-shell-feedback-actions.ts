"use client";

import type {
  EditorShellCanvasInteractionStore,
  EditorShellIssuesStore,
  EditorShellStatusBarStore,
  MiniMapPanelStore
} from "@pixel-editor/app-services/ui-shell";
import type { Dispatch, SetStateAction } from "react";
import { startTransition } from "react";

export function useEditorShellFeedbackActions(input: {
  canvasInteractionStore: EditorShellCanvasInteractionStore;
  issuesStore: EditorShellIssuesStore;
  statusBarStore: EditorShellStatusBarStore;
  miniMapStore: MiniMapPanelStore;
  setStatusInfo: Dispatch<SetStateAction<string>>;
}) {
  return {
    rendererActions: {
      onStatusInfoChange: input.setStatusInfo,
      onWorldMapActivate(mapId: string) {
        input.canvasInteractionStore.setActiveMap(mapId);
      },
      onWorldMapMove(worldId: string, fileName: string, x: number, y: number) {
        input.canvasInteractionStore.moveWorldMap(worldId, fileName, x, y);
      },
      onStrokeStart(
        x: number,
        y: number,
        modifiers: Parameters<EditorShellCanvasInteractionStore["beginCanvasStroke"]>[2]
      ) {
        input.canvasInteractionStore.beginCanvasStroke(x, y, modifiers);
      },
      onStrokeMove(
        x: number,
        y: number,
        modifiers: Parameters<EditorShellCanvasInteractionStore["updateCanvasStroke"]>[2]
      ) {
        input.canvasInteractionStore.updateCanvasStroke(x, y, modifiers);
      },
      onStrokeEnd() {
        input.canvasInteractionStore.endCanvasStroke();
      },
      onObjectSelect(
        objectId: Parameters<EditorShellCanvasInteractionStore["selectObject"]>[0]
      ) {
        input.canvasInteractionStore.selectObject(objectId);
      },
      onObjectMoveStart(
        objectId: Parameters<EditorShellCanvasInteractionStore["beginObjectMove"]>[0],
        x: number,
        y: number,
        modifiers: Parameters<EditorShellCanvasInteractionStore["beginObjectMove"]>[3]
      ) {
        input.canvasInteractionStore.beginObjectMove(objectId, x, y, modifiers);
      },
      onObjectMove(
        x: number,
        y: number,
        modifiers: Parameters<EditorShellCanvasInteractionStore["updateObjectMove"]>[2]
      ) {
        input.canvasInteractionStore.updateObjectMove(x, y, modifiers);
      },
      onObjectMoveEnd() {
        input.canvasInteractionStore.endObjectMove();
      },
      onObjectResizeStart(
        objectId: Parameters<EditorShellCanvasInteractionStore["beginObjectResize"]>[0],
        handle: Parameters<EditorShellCanvasInteractionStore["beginObjectResize"]>[1],
        x: number,
        y: number,
        modifiers: Parameters<EditorShellCanvasInteractionStore["beginObjectResize"]>[4]
      ) {
        input.canvasInteractionStore.beginObjectResize(objectId, handle, x, y, modifiers);
      },
      onObjectResize(
        x: number,
        y: number,
        modifiers: Parameters<EditorShellCanvasInteractionStore["updateObjectResize"]>[2]
      ) {
        input.canvasInteractionStore.updateObjectResize(x, y, modifiers);
      },
      onObjectResizeEnd() {
        input.canvasInteractionStore.endObjectResize();
      }
    },
    miniMapActions: {
      onNavigate(originX: number, originY: number) {
        startTransition(() => {
          input.miniMapStore.setViewportOrigin(originX, originY);
        });
      }
    },
    issuesActions: {
      onClear() {
        startTransition(() => {
          input.issuesStore.clearIssues();
        });
      },
      onClose() {
        startTransition(() => {
          input.issuesStore.closeIssuesPanel();
        });
      }
    },
    statusBarActions: {
      onToggleIssues() {
        startTransition(() => {
          input.statusBarStore.toggleIssuesPanel();
        });
      },
      onLayerChange(layerId: Parameters<EditorShellStatusBarStore["setActiveLayer"]>[0]) {
        startTransition(() => {
          input.statusBarStore.setActiveLayer(layerId);
        });
      },
      onZoomChange(zoom: Parameters<EditorShellStatusBarStore["setViewportZoom"]>[0]) {
        startTransition(() => {
          input.statusBarStore.setViewportZoom(zoom);
        });
      }
    }
  };
}
