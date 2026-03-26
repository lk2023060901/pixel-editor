import { describe, expect, it } from "vitest";

import {
  createTileCell,
  createTileLayer,
  setTileLayerCell
} from "@pixel-editor/domain";

import {
  collectVisibleTileCells,
  collectVisibleTileSegments
} from "./tile-visibility";

describe("tile visibility", () => {
  it("collects only visible non-empty cells from finite layers", () => {
    let layer = createTileLayer({
      name: "Ground",
      width: 5,
      height: 4
    });

    layer = setTileLayerCell(layer, 1, 1, createTileCell(3));
    layer = setTileLayerCell(layer, 3, 2, createTileCell(5));
    layer = setTileLayerCell(layer, 4, 3, createTileCell(7));

    expect(
      collectVisibleTileCells(layer, {
        startTileX: 0,
        startTileY: 0,
        endTileX: 3,
        endTileY: 2
      }).map(({ x, y, cell }) => ({ x, y, gid: cell.gid }))
    ).toEqual([
      { x: 1, y: 1, gid: 3 },
      { x: 3, y: 2, gid: 5 }
    ]);
  });

  it("collects visible non-empty cells by chunk intersection for infinite layers", () => {
    let layer = createTileLayer({
      name: "Infinite",
      width: 1,
      height: 1,
      infinite: true,
      chunkWidth: 2,
      chunkHeight: 2
    });

    layer = setTileLayerCell(layer, 0, 0, createTileCell(1));
    layer = setTileLayerCell(layer, 1, 1, createTileCell(2));
    layer = setTileLayerCell(layer, 3, 0, createTileCell(3));

    expect(
      collectVisibleTileCells(layer, {
        startTileX: 0,
        startTileY: 0,
        endTileX: 1,
        endTileY: 1
      }).map(({ x, y, cell }) => ({ x, y, gid: cell.gid }))
    ).toEqual([
      { x: 0, y: 0, gid: 1 },
      { x: 1, y: 1, gid: 2 }
    ]);

    expect(
      collectVisibleTileCells(layer, {
        startTileX: 2,
        startTileY: -1,
        endTileX: 4,
        endTileY: 1
      }).map(({ x, y, cell }) => ({ x, y, gid: cell.gid }))
    ).toEqual([{ x: 3, y: 0, gid: 3 }]);
  });

  it("groups visible cells into stable finite and chunk segments", () => {
    let finiteLayer = createTileLayer({
      name: "Finite",
      width: 4,
      height: 4
    });
    finiteLayer = setTileLayerCell(finiteLayer, 1, 0, createTileCell(9));
    finiteLayer = setTileLayerCell(finiteLayer, 2, 2, createTileCell(11));

    expect(
      collectVisibleTileSegments(finiteLayer, {
        startTileX: 0,
        startTileY: 0,
        endTileX: 2,
        endTileY: 2
      }).map((segment) => ({
        key: segment.key,
        originTileX: segment.originTileX,
        originTileY: segment.originTileY,
        gids: segment.cells.map((cell) => cell.cell.gid)
      }))
    ).toEqual([
      {
        key: "finite",
        originTileX: 0,
        originTileY: 0,
        gids: [9, 11]
      }
    ]);

    let infiniteLayer = createTileLayer({
      name: "Infinite Segments",
      width: 1,
      height: 1,
      infinite: true,
      chunkWidth: 2,
      chunkHeight: 2
    });
    infiniteLayer = setTileLayerCell(infiniteLayer, 0, 0, createTileCell(1));
    infiniteLayer = setTileLayerCell(infiniteLayer, 3, 0, createTileCell(2));
    infiniteLayer = setTileLayerCell(infiniteLayer, 2, 2, createTileCell(3));

    expect(
      collectVisibleTileSegments(infiniteLayer, {
        startTileX: 0,
        startTileY: 0,
        endTileX: 3,
        endTileY: 2
      }).map((segment) => ({
        key: segment.key,
        originTileX: segment.originTileX,
        originTileY: segment.originTileY,
        gids: segment.cells.map((cell) => cell.cell.gid)
      }))
    ).toEqual([
      {
        key: "0:0",
        originTileX: 0,
        originTileY: 0,
        gids: [1]
      },
      {
        key: "2:0",
        originTileX: 2,
        originTileY: 0,
        gids: [2]
      },
      {
        key: "2:2",
        originTileX: 2,
        originTileY: 2,
        gids: [3]
      }
    ]);
  });
});
