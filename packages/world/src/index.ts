import { createHistoryCommand, type HistoryCommand } from "@pixel-editor/command-engine";
import {
  clonePropertyDefinition,
  type EditorWorld
} from "@pixel-editor/domain";
import type { EditorWorkspaceState } from "@pixel-editor/editor-state";

function cloneWorld(world: EditorWorld): EditorWorld {
  return {
    ...world,
    maps: world.maps.map((map) => ({
      fileName: map.fileName,
      x: map.x,
      y: map.y,
      ...(map.width !== undefined ? { width: map.width } : {}),
      ...(map.height !== undefined ? { height: map.height } : {})
    })),
    patterns: world.patterns.map((pattern) => ({
      regexp: pattern.regexp,
      multiplierX: pattern.multiplierX,
      multiplierY: pattern.multiplierY,
      offsetX: pattern.offsetX,
      offsetY: pattern.offsetY,
      mapWidth: pattern.mapWidth,
      mapHeight: pattern.mapHeight
    })),
    properties: world.properties.map((property) => clonePropertyDefinition(property))
  };
}

export function addImportedWorldCommand(
  world: EditorWorld
): HistoryCommand<EditorWorkspaceState> {
  const clonedWorld = cloneWorld(world);

  return createHistoryCommand({
    id: "world.import",
    description: `Import world ${clonedWorld.name}`,
    run: (state) => ({
      ...state,
      worlds: [...state.worlds, clonedWorld],
      session: {
        ...state.session,
        hasUnsavedChanges: true
      }
    })
  });
}
