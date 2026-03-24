import type { LayerId, ObjectId, TileCoordinate } from "@pixel-editor/domain";

export type SelectionState =
  | { kind: "none" }
  | { kind: "layer"; layerIds: LayerId[] }
  | { kind: "object"; objectIds: ObjectId[] }
  | { kind: "tile"; coordinates: TileCoordinate[] };

export interface TileSelectionBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function isTileSelectionState(
  selection: SelectionState
): selection is Extract<SelectionState, { kind: "tile" }> {
  return selection.kind === "tile";
}

export function getTileSelectionBounds(
  selection: SelectionState
): TileSelectionBounds | undefined {
  if (!isTileSelectionState(selection) || selection.coordinates.length === 0) {
    return undefined;
  }

  const xValues = selection.coordinates.map((coordinate) => coordinate.x);
  const yValues = selection.coordinates.map((coordinate) => coordinate.y);
  const minX = Math.min(...xValues);
  const minY = Math.min(...yValues);
  const maxX = Math.max(...xValues);
  const maxY = Math.max(...yValues);

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1
  };
}
