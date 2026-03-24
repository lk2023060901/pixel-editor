import { describe, expect, it } from "vitest";

import { CommandHistory } from "@pixel-editor/command-engine";
import { createProject, getTileLayerCell } from "@pixel-editor/domain";
import { createEditorWorkspaceState } from "@pixel-editor/editor-state";

import {
  createMapDocumentCommand,
  paintTileAtCommand,
  paintTileFillCommand
} from "../src/index";

describe("bucket fill command", () => {
  it("fills only the contiguous region and undoes as a single history entry", () => {
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
        width: 4,
        height: 4,
        tileWidth: 32,
        tileHeight: 32
      })
    );

    const map = history.state.maps[0]!;
    const tileLayer = map.layers.find((layer) => layer.kind === "tile");

    history.execute(paintTileAtCommand(map.id, tileLayer!.id, 2, 0, 9));
    history.execute(paintTileAtCommand(map.id, tileLayer!.id, 2, 1, 9));
    history.execute(paintTileAtCommand(map.id, tileLayer!.id, 2, 2, 9));
    history.execute(paintTileAtCommand(map.id, tileLayer!.id, 0, 2, 9));
    history.execute(paintTileAtCommand(map.id, tileLayer!.id, 1, 2, 9));

    const filledLayer = history.state.maps[0]!.layers.find(
      (layer) => layer.kind === "tile"
    );

    history.execute(
      paintTileFillCommand(map.id, tileLayer!.id, filledLayer!, 0, 0, 6)
    );

    const nextLayer = history.state.maps[0]!.layers[0];

    expect(history.state.session.selection).toEqual({
      kind: "tile",
      coordinates: [{ x: 0, y: 0 }]
    });
    expect(
      nextLayer?.kind === "tile" ? getTileLayerCell(nextLayer, 0, 0)?.gid : null
    ).toBe(6);
    expect(
      nextLayer?.kind === "tile" ? getTileLayerCell(nextLayer, 1, 1)?.gid : null
    ).toBe(6);
    expect(
      nextLayer?.kind === "tile" ? getTileLayerCell(nextLayer, 2, 1)?.gid : null
    ).toBe(9);
    expect(history.past).toHaveLength(7);

    history.undo();

    const revertedLayer = history.state.maps[0]!.layers[0];

    expect(
      revertedLayer?.kind === "tile" ? getTileLayerCell(revertedLayer, 0, 0)?.gid : null
    ).toBeNull();
    expect(
      revertedLayer?.kind === "tile" ? getTileLayerCell(revertedLayer, 1, 1)?.gid : null
    ).toBeNull();
    expect(
      revertedLayer?.kind === "tile" ? getTileLayerCell(revertedLayer, 2, 1)?.gid : null
    ).toBe(9);
  });
});
