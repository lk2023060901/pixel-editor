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

function patchSessionShowWorlds(
  state: EditorWorkspaceState,
  showWorlds: boolean
): EditorWorkspaceState["session"] {
  return {
    ...state.session,
    showWorlds
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

export function toggleShowWorldsCommand(): HistoryCommand<EditorWorkspaceState> {
  return createHistoryCommand({
    id: "world.toggleVisibility",
    description: "Toggle world visibility",
    run: (state) => ({
      ...state,
      session: patchSessionShowWorlds(state, !state.session.showWorlds)
    })
  });
}

export function moveWorldMapCommand(input: {
  worldId: EditorWorld["id"];
  fileName: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
}): HistoryCommand<EditorWorkspaceState> {
  return createHistoryCommand({
    id: `world.map.move:${input.worldId}:${input.fileName}`,
    description: `Move world map ${input.fileName}`,
    run: (state) => ({
      ...state,
      worlds: state.worlds.map((world) =>
        world.id === input.worldId
          ? {
              ...world,
              maps: world.maps.map((map) =>
                map.fileName === input.fileName
                  ? {
                      ...map,
                      x: input.x,
                      y: input.y,
                      ...(input.width !== undefined ? { width: input.width } : {}),
                      ...(input.height !== undefined ? { height: input.height } : {})
                    }
                  : map
              )
            }
          : world
      ),
      session: {
        ...state.session,
        hasUnsavedChanges: true
      }
    })
  });
}
