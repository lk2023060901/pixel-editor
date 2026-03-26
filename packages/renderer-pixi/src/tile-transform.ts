import type { TileCell } from "@pixel-editor/domain";
import { Matrix } from "pixi.js";

export interface TileTransformInput {
  cell: Pick<
    TileCell,
    "flipHorizontally" | "flipVertically" | "flipDiagonally"
  >;
  textureWidth: number;
  textureHeight: number;
  cellWidth: number;
  cellHeight: number;
  screenX: number;
  screenY: number;
}

export function createTileTransformMatrix(
  input: TileTransformInput
): Matrix {
  const textureWidth = Math.max(1, input.textureWidth);
  const textureHeight = Math.max(1, input.textureHeight);
  const scaleX = input.cellWidth / textureWidth;
  const scaleY = input.cellHeight / textureHeight;
  const diagonalScaleX = input.cellWidth / textureHeight;
  const diagonalScaleY = input.cellHeight / textureWidth;

  if (!input.cell.flipDiagonally) {
    return new Matrix(
      input.cell.flipHorizontally ? -scaleX : scaleX,
      0,
      0,
      input.cell.flipVertically ? -scaleY : scaleY,
      input.screenX + (input.cell.flipHorizontally ? input.cellWidth : 0),
      input.screenY + (input.cell.flipVertically ? input.cellHeight : 0)
    );
  }

  return new Matrix(
    0,
    input.cell.flipVertically ? -diagonalScaleY : diagonalScaleY,
    input.cell.flipHorizontally ? -diagonalScaleX : diagonalScaleX,
    0,
    input.screenX + (input.cell.flipHorizontally ? input.cellWidth : 0),
    input.screenY + (input.cell.flipVertically ? input.cellHeight : 0)
  );
}
