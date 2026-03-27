import type { EditorMap } from "@pixel-editor/domain";

export interface ScreenScaleGeometry {
  tileWidth: number;
  tileHeight: number;
}

export function worldLengthToScreenWidth(
  worldWidth: number,
  map: EditorMap,
  geometry: ScreenScaleGeometry
): number {
  return (worldWidth / map.settings.tileWidth) * geometry.tileWidth;
}

export function worldLengthToScreenHeight(
  worldHeight: number,
  map: EditorMap,
  geometry: ScreenScaleGeometry
): number {
  return (worldHeight / map.settings.tileHeight) * geometry.tileHeight;
}

export function computeParallaxAdjustedViewportOriginX(input: {
  viewportOriginX: number;
  parallaxFactorX: number;
  map: EditorMap;
  geometry: ScreenScaleGeometry;
}): number {
  const parallaxOriginX = worldLengthToScreenWidth(
    input.map.settings.parallaxOriginX,
    input.map,
    input.geometry
  );

  return (
    input.viewportOriginX * input.parallaxFactorX -
    parallaxOriginX * (input.parallaxFactorX - 1)
  );
}

export function computeParallaxAdjustedViewportOriginY(input: {
  viewportOriginY: number;
  parallaxFactorY: number;
  map: EditorMap;
  geometry: ScreenScaleGeometry;
}): number {
  const parallaxOriginY = worldLengthToScreenHeight(
    input.map.settings.parallaxOriginY,
    input.map,
    input.geometry
  );

  return (
    input.viewportOriginY * input.parallaxFactorY -
    parallaxOriginY * (input.parallaxFactorY - 1)
  );
}
