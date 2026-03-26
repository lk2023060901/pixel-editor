import { describe, expect, it } from "vitest";

import { createProject, createProperty, createWorld } from "@pixel-editor/domain";
import { createEditorWorkspaceState } from "@pixel-editor/editor-state";

import { addImportedWorldCommand } from "./index";

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
});
