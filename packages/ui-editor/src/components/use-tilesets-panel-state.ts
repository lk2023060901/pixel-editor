"use client";

import type { TilesetsPanelStore } from "@pixel-editor/app-services/ui-store";
import { startTransition, useState } from "react";

export function useTilesetsPanelState(props: {
  store: TilesetsPanelStore;
}) {
  const [zoom, setZoom] = useState<number>(1);

  return {
    zoom,
    setZoom,
    actions: {
      activateTileset: (tilesetId: string) => {
        startTransition(() => {
          props.store.setActiveTileset(tilesetId);
        });
      },
      selectStampTile: (tilesetId: string, localId: number) => {
        startTransition(() => {
          props.store.selectStampTile(tilesetId, localId);
        });
      }
    }
  };
}
