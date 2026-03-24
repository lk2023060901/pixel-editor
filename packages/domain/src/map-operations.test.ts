import { describe, expect, it } from "vitest";

import {
  addTopLevelObjectLayer,
  addTopLevelTileLayer,
  createMap,
  getTileLayerCell,
  moveLayerInMap,
  paintTileInMap,
  removeLayerFromMap,
  updateMapDetails
} from "./index";

describe("map operations", () => {
  it("updates finite map details and keeps tile layers aligned to the new size", () => {
    const map = createMap({
      name: "demo",
      orientation: "orthogonal",
      width: 8,
      height: 8,
      tileWidth: 32,
      tileHeight: 32
    });
    const withLayer = addTopLevelTileLayer(map, "Ground").map;
    const painted = paintTileInMap(withLayer, withLayer.layers[0]!.id, 2, 3, 9);

    const updated = updateMapDetails(painted, {
      name: "demo-updated",
      width: 12,
      height: 10,
      tileWidth: 16,
      tileHeight: 16,
      renderOrder: "left-up"
    });

    expect(updated.name).toBe("demo-updated");
    expect(updated.settings.width).toBe(12);
    expect(updated.settings.height).toBe(10);
    expect(updated.settings.tileWidth).toBe(16);
    expect(updated.settings.renderOrder).toBe("left-up");
    expect(updated.layers[0]?.kind).toBe("tile");
    expect(
      updated.layers[0]?.kind === "tile"
        ? getTileLayerCell(updated.layers[0], 2, 3)?.gid
        : null
    ).toBe(9);
  });

  it("adds, moves and removes top-level layers", () => {
    const map = createMap({
      name: "layers",
      orientation: "orthogonal",
      width: 4,
      height: 4,
      tileWidth: 32,
      tileHeight: 32
    });
    const withTile = addTopLevelTileLayer(map, "Ground").map;
    const withObject = addTopLevelObjectLayer(withTile, "Objects").map;
    const activeLayerId = withObject.layers[1]!.id;

    const moved = moveLayerInMap(withObject, activeLayerId, "up");
    const removed = removeLayerFromMap(moved, activeLayerId);

    expect(moved.layers.map((layer) => layer.name)).toEqual(["Objects", "Ground"]);
    expect(removed.layers.map((layer) => layer.name)).toEqual(["Ground"]);
  });

  it("paints and erases finite tile cells", () => {
    const map = createMap({
      name: "paint",
      orientation: "orthogonal",
      width: 6,
      height: 6,
      tileWidth: 32,
      tileHeight: 32
    });
    const withLayer = addTopLevelTileLayer(map, "Ground").map;
    const layerId = withLayer.layers[0]!.id;
    const painted = paintTileInMap(withLayer, layerId, 1, 1, 3);
    const erased = paintTileInMap(painted, layerId, 1, 1, null);

    expect(
      painted.layers[0]?.kind === "tile" ? getTileLayerCell(painted.layers[0], 1, 1)?.gid : null
    ).toBe(3);
    expect(
      erased.layers[0]?.kind === "tile" ? getTileLayerCell(erased.layers[0], 1, 1)?.gid : null
    ).toBeNull();
  });
});
