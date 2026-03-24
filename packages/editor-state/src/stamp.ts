export interface TileStampCell {
  offsetX: number;
  offsetY: number;
  gid: number | null;
}

export type TileStamp =
  | {
      kind: "single";
      gid: number | null;
    }
  | {
      kind: "pattern";
      width: number;
      height: number;
      primaryGid: number | null;
      cells: TileStampCell[];
    };

function compareStampCells(left: TileStampCell, right: TileStampCell): number {
  if (left.offsetY !== right.offsetY) {
    return left.offsetY - right.offsetY;
  }

  return left.offsetX - right.offsetX;
}

function resolvePrimaryGid(cells: TileStampCell[]): number | null {
  const anchorCell = cells.find((cell) => cell.offsetX === 0 && cell.offsetY === 0);

  if (anchorCell) {
    return anchorCell.gid;
  }

  return cells.find((cell) => cell.gid !== null)?.gid ?? null;
}

export function createSingleTileStamp(gid: number | null): TileStamp {
  return {
    kind: "single",
    gid
  };
}

export function createPatternTileStamp(input: {
  width: number;
  height: number;
  cells: TileStampCell[];
  primaryGid?: number | null;
}): TileStamp {
  const width = Math.max(1, input.width);
  const height = Math.max(1, input.height);
  const cells = [...input.cells].sort(compareStampCells);

  return {
    kind: "pattern",
    width,
    height,
    primaryGid: input.primaryGid ?? resolvePrimaryGid(cells),
    cells
  };
}

export function getTileStampPrimaryGid(stamp: TileStamp): number | null {
  return stamp.kind === "single" ? stamp.gid : stamp.primaryGid;
}

export function materializeTileStampCells(
  stamp: TileStamp,
  originX: number,
  originY: number
): Array<{ x: number; y: number; gid: number | null }> {
  if (stamp.kind === "single") {
    return [
      {
        x: originX,
        y: originY,
        gid: stamp.gid
      }
    ];
  }

  return stamp.cells.map((cell) => ({
    x: originX + cell.offsetX,
    y: originY + cell.offsetY,
    gid: cell.gid
  }));
}

export function getTileStampFootprint(stamp: TileStamp): {
  width: number;
  height: number;
  cellCount: number;
} {
  if (stamp.kind === "single") {
    return {
      width: 1,
      height: 1,
      cellCount: 1
    };
  }

  return {
    width: stamp.width,
    height: stamp.height,
    cellCount: stamp.cells.length
  };
}
