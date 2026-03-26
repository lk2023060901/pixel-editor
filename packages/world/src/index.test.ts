import { describe, expect, it } from "vitest";

import { createMap, createProject, createProperty, createWorld } from "@pixel-editor/domain";
import { createEditorWorkspaceState } from "@pixel-editor/editor-state";

import {
  addImportedWorldCommand,
  moveWorldMapCommand,
  toggleShowWorldsCommand
} from "./index";

describe("@pixel-editor/world", () => {
  it("adds imported worlds to the workspace and marks it dirty", () => {
    const world = createWorld(
      "demo-world",
      [
        {
          fileName: "maps/start.tmx",
          x: 0,
          y: 0,
          width: 320,
          height: 320
        }
      ],
      [createProperty("theme", "string", "forest")],
      {
        patterns: [
          {
            regexp: "chunk_(\\d+)_(\\d+)\\.tmx",
            multiplierX: 32,
            multiplierY: 32,
            offsetX: 0,
            offsetY: 0,
            mapWidth: 32,
            mapHeight: 32
          }
        ],
        onlyShowAdjacentMaps: true
      }
    );
    const before = createEditorWorkspaceState({
      project: createProject({
        name: "demo",
        assetRoots: ["maps", "worlds"]
      })
    });

    const after = addImportedWorldCommand(world).run(before);

    expect(after.worlds).toHaveLength(1);
    expect(after.worlds[0]?.id).toBe(world.id);
    expect(after.worlds[0]).toMatchObject({
      name: "demo-world",
      maps: [
        {
          fileName: "maps/start.tmx",
          x: 0,
          y: 0,
          width: 320,
          height: 320
        }
      ],
      patterns: [
        {
          regexp: "chunk_(\\d+)_(\\d+)\\.tmx",
          multiplierX: 32,
          multiplierY: 32
        }
      ],
      onlyShowAdjacentMaps: true,
      properties: [createProperty("theme", "string", "forest")]
    });
    expect(after.session.hasUnsavedChanges).toBe(true);
  });

  it("toggles world visibility in session state without marking workspace dirty", () => {
    const before = createEditorWorkspaceState({
      project: createProject({
        name: "demo",
        assetRoots: ["maps", "worlds"]
      })
    });

    const after = toggleShowWorldsCommand().run(before);

    expect(after.session.showWorlds).toBe(true);
    expect(after.session.hasUnsavedChanges).toBe(false);
  });

  it("moves a world map reference and marks the workspace dirty", () => {
    const world = createWorld("demo-world", [
      {
        fileName: "maps/start.tmx",
        x: 0,
        y: 0,
        width: 320,
        height: 320
      }
    ]);
    const before = createEditorWorkspaceState({
      project: createProject({
        name: "demo",
        assetRoots: ["maps", "worlds"]
      }),
      maps: [
        createMap({
          name: "start",
          orientation: "orthogonal",
          width: 10,
          height: 10,
          tileWidth: 32,
          tileHeight: 32
        })
      ],
      worlds: [world]
    });

    const after = moveWorldMapCommand({
      worldId: world.id,
      fileName: "maps/start.tmx",
      x: 64,
      y: 96,
      width: 320,
      height: 320
    }).run(before);

    expect(after.worlds[0]?.maps).toEqual([
      {
        fileName: "maps/start.tmx",
        x: 64,
        y: 96,
        width: 320,
        height: 320
      }
    ]);
    expect(after.session.hasUnsavedChanges).toBe(true);
  });
});
