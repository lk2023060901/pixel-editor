export interface RendererLayoutMetrics {
  framePadding: number;
  canvasOffsetX: number;
  canvasOffsetY: number;
  minCanvasWidth: number;
  minCanvasHeight: number;
  minFrameWidth: number;
  minFrameHeight: number;
  titleOffsetX: number;
  titleOffsetY: number;
  subtitleOffsetY: number;
  emptyStateOffsetX: number;
  emptyStateOffsetY: number;
  frameRadius: number;
}

export const defaultRendererLayoutMetrics: RendererLayoutMetrics = {
  framePadding: 0,
  canvasOffsetX: 0,
  canvasOffsetY: 0,
  minCanvasWidth: 64,
  minCanvasHeight: 64,
  minFrameWidth: 64,
  minFrameHeight: 64,
  titleOffsetX: 0,
  titleOffsetY: 0,
  subtitleOffsetY: 0,
  emptyStateOffsetX: 16,
  emptyStateOffsetY: 16,
  frameRadius: 0
};

export function createRendererLayoutMetrics(
  overrides: Partial<RendererLayoutMetrics> = {}
): RendererLayoutMetrics {
  return {
    ...defaultRendererLayoutMetrics,
    ...overrides
  };
}
