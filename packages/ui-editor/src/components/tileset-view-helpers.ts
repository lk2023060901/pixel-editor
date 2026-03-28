"use client";

import type { CSSProperties } from "react";

import type { TileVisualViewState } from "@pixel-editor/app-services/ui";

export function buildTileVisualStyle(
  viewState: TileVisualViewState,
  zoom: number
): CSSProperties {
  switch (viewState.kind) {
    case "sprite":
      return {
        width: `${viewState.tileWidth * zoom}px`,
        height: `${viewState.tileHeight * zoom}px`,
        backgroundImage: `url(${viewState.imagePath})`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: `-${viewState.offsetX * zoom}px -${viewState.offsetY * zoom}px`,
        backgroundSize: `${viewState.imageWidth * zoom}px ${viewState.imageHeight * zoom}px`
      };
    case "image-collection":
      return {
        width: `${viewState.tileWidth * zoom}px`,
        height: `${viewState.tileHeight * zoom}px`,
        backgroundImage: `url(${viewState.imagePath})`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundSize: "contain"
      };
    case "fallback":
      return {
        width: `${viewState.tileWidth * zoom}px`,
        height: `${viewState.tileHeight * zoom}px`,
        backgroundColor:
          viewState.gid !== undefined
            ? `hsl(${(viewState.gid * 47) % 360} 62% 52%)`
            : "#334155"
      };
  }
}
