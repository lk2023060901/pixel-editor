export interface ImageLayerTilingInput {
  screenX: number;
  screenY: number;
  screenWidth: number;
  screenHeight: number;
  repeatX: boolean;
  repeatY: boolean;
  canvasX: number;
  canvasY: number;
  canvasWidth: number;
  canvasHeight: number;
}

function collectAxisPositions(input: {
  start: number;
  size: number;
  repeat: boolean;
  canvasStart: number;
  canvasSize: number;
}): number[] {
  if (!input.repeat) {
    return [0];
  }

  const localCanvasStart = input.canvasStart - input.start;
  const localCanvasEnd = localCanvasStart + input.canvasSize;
  const firstPosition = Math.floor(localCanvasStart / input.size) * input.size;
  const positions: number[] = [];

  for (let position = firstPosition; position < localCanvasEnd; position += input.size) {
    positions.push(position);
  }

  return positions.length > 0 ? positions : [0];
}

export function collectImageLayerTilePositions(
  input: ImageLayerTilingInput
): Array<{ x: number; y: number }> {
  const positionsX = collectAxisPositions({
    start: input.screenX,
    size: input.screenWidth,
    repeat: input.repeatX,
    canvasStart: input.canvasX,
    canvasSize: input.canvasWidth
  });
  const positionsY = collectAxisPositions({
    start: input.screenY,
    size: input.screenHeight,
    repeat: input.repeatY,
    canvasStart: input.canvasY,
    canvasSize: input.canvasHeight
  });

  return positionsX.flatMap((x) => positionsY.map((y) => ({ x, y })));
}
