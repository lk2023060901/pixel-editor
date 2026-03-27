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
