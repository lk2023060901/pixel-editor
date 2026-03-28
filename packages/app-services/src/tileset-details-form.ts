import type { UpdateTilesetDetailsInput } from "@pixel-editor/domain";

import type { TilesetDetailsViewState } from "./ui-models";

export interface TilesetDetailsDraft {
  name: string;
  tileWidth: string;
  tileHeight: string;
  tileOffsetX: string;
  tileOffsetY: string;
  objectAlignment: TilesetDetailsViewState["objectAlignment"];
  tileRenderSize: TilesetDetailsViewState["tileRenderSize"];
  fillMode: TilesetDetailsViewState["fillMode"];
  imagePath: string;
  imageWidth: string;
  imageHeight: string;
  margin: string;
  spacing: string;
  columns: string;
}

export const tilesetObjectAlignmentOptions = [
  "unspecified",
  "topleft",
  "top",
  "topright",
  "left",
  "center",
  "right",
  "bottomleft",
  "bottom",
  "bottomright"
] as const satisfies readonly TilesetDetailsViewState["objectAlignment"][];

export const tilesetTileRenderSizeOptions = [
  "tile",
  "grid"
] as const satisfies readonly TilesetDetailsViewState["tileRenderSize"][];

export const tilesetFillModeOptions = [
  "stretch",
  "preserve-aspect-fit"
] as const satisfies readonly TilesetDetailsViewState["fillMode"][];

function parseInteger(value: string): number | undefined {
  if (!value.trim()) {
    return undefined;
  }

  const parsedValue = Number.parseInt(value, 10);

  return Number.isNaN(parsedValue) ? undefined : parsedValue;
}

export function createTilesetDetailsDraft(
  viewState: TilesetDetailsViewState
): TilesetDetailsDraft {
  return {
    name: viewState.name,
    tileWidth: String(viewState.tileWidth),
    tileHeight: String(viewState.tileHeight),
    tileOffsetX: String(viewState.tileOffsetX),
    tileOffsetY: String(viewState.tileOffsetY),
    objectAlignment: viewState.objectAlignment,
    tileRenderSize: viewState.tileRenderSize,
    fillMode: viewState.fillMode,
    imagePath: viewState.kind === "image" ? viewState.imagePath : "",
    imageWidth:
      viewState.kind === "image" && viewState.imageWidth !== undefined
        ? String(viewState.imageWidth)
        : "",
    imageHeight:
      viewState.kind === "image" && viewState.imageHeight !== undefined
        ? String(viewState.imageHeight)
        : "",
    margin: viewState.kind === "image" ? String(viewState.margin) : "0",
    spacing: viewState.kind === "image" ? String(viewState.spacing) : "0",
    columns:
      viewState.kind === "image" && viewState.columns !== undefined
        ? String(viewState.columns)
        : ""
  };
}

export function buildTilesetDetailsUpdatePatch(input: {
  draft: TilesetDetailsDraft;
  viewState: TilesetDetailsViewState;
}): UpdateTilesetDetailsInput | undefined {
  const tileWidth = parseInteger(input.draft.tileWidth);
  const tileHeight = parseInteger(input.draft.tileHeight);
  const tileOffsetX = parseInteger(input.draft.tileOffsetX);
  const tileOffsetY = parseInteger(input.draft.tileOffsetY);
  const imageWidth = parseInteger(input.draft.imageWidth);
  const imageHeight = parseInteger(input.draft.imageHeight);
  const margin = parseInteger(input.draft.margin);
  const spacing = parseInteger(input.draft.spacing);
  const columns = input.draft.columns.trim()
    ? parseInteger(input.draft.columns)
    : null;

  if (
    tileWidth === undefined ||
    tileHeight === undefined ||
    tileOffsetX === undefined ||
    tileOffsetY === undefined
  ) {
    return undefined;
  }

  return {
    name: input.draft.name.trim() || input.viewState.name,
    tileWidth,
    tileHeight,
    tileOffsetX,
    tileOffsetY,
    objectAlignment: input.draft.objectAlignment,
    tileRenderSize: input.draft.tileRenderSize,
    fillMode: input.draft.fillMode,
    ...(input.viewState.kind === "image"
      ? {
          ...(input.draft.imagePath.trim()
            ? { imagePath: input.draft.imagePath.trim() }
            : {}),
          ...(imageWidth !== undefined ? { imageWidth } : {}),
          ...(imageHeight !== undefined ? { imageHeight } : {}),
          ...(margin !== undefined ? { margin } : {}),
          ...(spacing !== undefined ? { spacing } : {}),
          ...(columns !== undefined ? { columns } : {})
        }
      : {})
  };
}
