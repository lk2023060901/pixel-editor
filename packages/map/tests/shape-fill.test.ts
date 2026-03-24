import { describe, expect, it } from "vitest";

import { CommandHistory } from "@pixel-editor/command-engine";
import { createProject, getTileLayerCell } from "@pixel-editor/domain";
import { createEditorWorkspaceState } from "@pixel-editor/editor-state";

import {
  createMapDocumentCommand,
  paintTileShapeCommand
} from "../src/index";

describe("shape fill command", () => {
  it("fills a rectangle and undoes as a single history entry", () => {
    const workspace = createEditorWorkspaceState({
      project: createProject({
        name: "demo",
        assetRoots: ["maps"]
      })
    });
    const history = new CommandHistory(workspace);

    history.execute(
      createMapDocumentCommand({
        name: "map-1",
        orientation: "orthogonal",
        width: 8,
        height: 8,
        tileWidth: 32,
        tileHeight: 32
      })
    );

    const map = history.state.maps[0]!;
    const tileLayer = map.layers.find((layer) => layer.kind === "tile")!;

    history.execute(
      paintTileShapeCommand(
        map.id,
        tileLayer.id,
        "rectangle",
        1,
        1,
        3,
        2,
        7
      )
    );

    const nextLayer = history.state.maps[0]!.layers[0];

    expect(history.state.session.selection).toEqual({
      kind: "tile",
      coordinates: [{ x: 3, y: 2 }]
    });
    expect(
      nextLayer?.kind === "tile" ? getTileLayerCell(nextLayer, 1, 1)?.gid : null
    ).toBe(7);
    expect(
      nextLayer?.kind === "tile" ? getTileLayerCell(nextLayer, 3, 2)?.gid : null
    ).toBe(7);
    expect(history.past).toHaveLength(2);

    history.undo();

    const revertedLayer = history.state.maps[0]!.layers[0];

    expect(
      revertedLayer?.kind === "tile" ? getTileLayerCell(revertedLayer, 1, 1)?.gid : null
    ).toBeNull();
    expect(
      revertedLayer?.kind === "tile" ? getTileLayerCell(revertedLayer, 3, 2)?.gid : null
    ).toBeNull();
  });
});
