import type { UpdateMapDetailsInput } from "@pixel-editor/domain";

import type { MapPropertiesPanelViewState } from "./ui-models";

export interface MapPropertiesDraft {
  name: string;
  orientation: MapPropertiesPanelViewState["orientation"];
  renderOrder: MapPropertiesPanelViewState["renderOrder"];
  width: string;
  height: string;
  tileWidth: string;
  tileHeight: string;
  infinite: boolean;
  backgroundColor: string;
}

export const mapOrientationOptions = [
  "orthogonal",
  "isometric",
  "staggered",
  "hexagonal",
  "oblique"
] as const satisfies readonly MapPropertiesPanelViewState["orientation"][];

export const mapRenderOrderOptions = [
  "right-down",
  "right-up",
  "left-down",
  "left-up"
] as const satisfies readonly MapPropertiesPanelViewState["renderOrder"][];

export function createMapPropertiesDraft(
  viewState?: MapPropertiesPanelViewState
): MapPropertiesDraft {
  return {
    name: viewState?.name ?? "",
    orientation: viewState?.orientation ?? "orthogonal",
    renderOrder: viewState?.renderOrder ?? "right-down",
    width: String(viewState?.width ?? 64),
    height: String(viewState?.height ?? 64),
    tileWidth: String(viewState?.tileWidth ?? 32),
    tileHeight: String(viewState?.tileHeight ?? 32),
    infinite: viewState?.infinite ?? false,
    backgroundColor: viewState?.backgroundColor ?? ""
  };
}

export function buildMapPropertiesUpdatePatch(input: {
  draft: MapPropertiesDraft;
  viewState: MapPropertiesPanelViewState;
}): UpdateMapDetailsInput | undefined {
  const width = Number.parseInt(input.draft.width, 10);
  const height = Number.parseInt(input.draft.height, 10);
  const tileWidth = Number.parseInt(input.draft.tileWidth, 10);
  const tileHeight = Number.parseInt(input.draft.tileHeight, 10);

  if (
    Number.isNaN(tileWidth) ||
    Number.isNaN(tileHeight) ||
    (!input.draft.infinite && (Number.isNaN(width) || Number.isNaN(height)))
  ) {
    return undefined;
  }

  return {
    name: input.draft.name.trim() || input.viewState.name,
    orientation: input.draft.orientation,
    renderOrder: input.draft.renderOrder,
    tileWidth,
    tileHeight,
    infinite: input.draft.infinite,
    ...(input.draft.infinite ? {} : { width, height }),
    ...(input.draft.backgroundColor.trim()
      ? { backgroundColor: input.draft.backgroundColor.trim() }
      : {})
  };
}
