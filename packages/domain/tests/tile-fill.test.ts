import { describe, expect, it } from "vitest";

import {
  collectConnectedTileRegion,
  createTileCell,
  createTileLayer,
  getTileLayerBounds,
  setTileLayerCell
} from "@pixel-editor/domain";

function sortCoordinates(coordinates: Array<{ x: number; y: number }>) {
  return [...coordinates].sort((left, right) =>
    left.y === right.y ? left.x - right.x : left.y - right.y
  );
}

describe("tile fill region helpers", () => {
  it("collects a connected finite region using four-way adjacency", () => {
    let layer = createTileLayer({
      name: "Ground",
      width: 4,
      height: 4
    });

    layer = setTileLayerCell(layer, 0, 0, createTileCell(1));
    layer = setTileLayerCell(layer, 1, 0, createTileCell(1));
    layer = setTileLayerCell(layer, 0, 1, createTileCell(1));
    layer = setTileLayerCell(layer, 2, 0, createTileCell(2));

    const region = collectConnectedTileRegion(
      layer,
      0,
      0,
      (cell) => cell.gid === 1
    );

    expect(sortCoordinates(region)).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 }
    ]);
  });

  it("limits infinite fills to the current chunk bounds", () => {
    let layer = createTileLayer({
      name: "Infinite",
      width: 1,
      height: 1,
      infinite: true,
      chunkWidth: 2,
      chunkHeight: 2
    });

    layer = setTileLayerCell(layer, 0, 0, createTileCell(9));

    const bounds = getTileLayerBounds(layer);
    const region = collectConnectedTileRegion(
      layer,
      1,
      1,
      (cell) => cell.gid === null
    );

    expect(bounds).toEqual([{ x: 0, y: 0, width: 2, height: 2 }]);
    expect(sortCoordinates(region)).toEqual([
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 }
    ]);
    expect(
      collectConnectedTileRegion(layer, 3, 3, (cell) => cell.gid === null)
    ).toEqual([]);
  });
});
