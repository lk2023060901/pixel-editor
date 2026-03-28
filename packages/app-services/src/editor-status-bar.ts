import type { EditorStatusBarViewState } from "./ui-models";

export const tiledZoomFactors = [
  0.015625,
  0.03125,
  0.0625,
  0.125,
  0.25,
  0.33,
  0.5,
  0.75,
  1,
  1.5,
  2,
  3,
  4,
  5.5,
  8,
  11,
  16,
  23,
  32,
  45,
  64,
  90,
  128,
  180,
  256
] as const;

const layerKindIconUrls: Record<
  NonNullable<EditorStatusBarViewState["activeLayerKind"]>,
  string
> = {
  tile: "/vendor/tiled-statusbar/layer-tile.png",
  object: "/vendor/tiled-statusbar/layer-object.png",
  image: "/vendor/tiled-statusbar/layer-image.png",
  group: "/vendor/tiled-statusbar/layer-tile.png"
};

export interface EditorStatusBarZoomDraftResolution {
  nextDraft: string;
  zoom?: number;
}

export interface EditorStatusBarPresentation {
  activeLayerIconUrl: string;
  zoomDraft: string;
  zoomOptions: string[];
}

export function formatEditorStatusBarZoom(scale: number): string {
  return `${Math.round(scale * 100)} %`;
}

export function parseEditorStatusBarZoom(value: string): number | undefined {
  const match = /^\s*(\d+(?:\.\d+)?)\s*%?\s*$/.exec(value);

  if (!match) {
    return undefined;
  }

  const zoom = Number.parseFloat(match[1] ?? "");

  if (!Number.isFinite(zoom)) {
    return undefined;
  }

  return zoom / 100;
}

export function resolveEditorStatusBarLayerIconUrl(
  activeLayerKind: EditorStatusBarViewState["activeLayerKind"]
): string {
  return activeLayerKind !== undefined
    ? layerKindIconUrls[activeLayerKind]
    : layerKindIconUrls.tile;
}

export function resolveEditorStatusBarZoomDraft(input: {
  draft: string;
  fallbackZoom: number;
}): EditorStatusBarZoomDraftResolution {
  const zoom = parseEditorStatusBarZoom(input.draft);

  if (zoom === undefined) {
    return {
      nextDraft: formatEditorStatusBarZoom(input.fallbackZoom)
    };
  }

  return {
    nextDraft: formatEditorStatusBarZoom(zoom),
    zoom
  };
}

export function deriveEditorStatusBarPresentation(
  viewState: EditorStatusBarViewState
): EditorStatusBarPresentation {
  return {
    activeLayerIconUrl: resolveEditorStatusBarLayerIconUrl(viewState.activeLayerKind),
    zoomDraft: formatEditorStatusBarZoom(viewState.zoom),
    zoomOptions: tiledZoomFactors.map((zoom) => formatEditorStatusBarZoom(zoom))
  };
}
