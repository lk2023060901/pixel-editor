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
  framePadding: 24,
  canvasOffsetX: 28,
  canvasOffsetY: 84,
  minCanvasWidth: 180,
  minCanvasHeight: 180,
  minFrameWidth: 240,
  minFrameHeight: 200,
  titleOffsetX: 28,
  titleOffsetY: 24,
  subtitleOffsetY: 52,
  emptyStateOffsetX: 28,
  emptyStateOffsetY: 28,
  frameRadius: 20
};

export function createRendererLayoutMetrics(
  overrides: Partial<RendererLayoutMetrics> = {}
): RendererLayoutMetrics {
  return {
    ...defaultRendererLayoutMetrics,
    ...overrides
  };
}
