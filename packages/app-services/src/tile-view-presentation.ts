export const tileViewZoomOptions = [0.5, 1, 2, 4] as const;

export interface TileViewZoomOptionItem {
  value: number;
  label: string;
}

export function formatTileViewZoomLabel(zoom: number): string {
  return `${Math.round(zoom * 100)} %`;
}

export function getTileViewZoomOptionItems(): TileViewZoomOptionItem[] {
  return tileViewZoomOptions.map((value) => ({
    value,
    label: formatTileViewZoomLabel(value)
  }));
}
