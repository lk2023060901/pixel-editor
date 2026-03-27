"use client";

import type { TileVisualViewState } from "@pixel-editor/app-services/ui";

import { buildTileVisualStyle } from "./tileset-view-helpers";

export function TilePreview(props: {
  viewState: TileVisualViewState;
}) {
  return (
    <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-md border border-white/15 bg-slate-950/80">
      <span className="rounded-sm" style={buildTileVisualStyle(props.viewState, 0.75)} />
    </span>
  );
}
