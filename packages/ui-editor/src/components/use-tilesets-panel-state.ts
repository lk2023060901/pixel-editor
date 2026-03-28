"use client";

import {
  createTilesetsPanelStoreActionPlan,
  defaultTilesetsPanelZoom,
  tilesetsPanelStoreActionIds
} from "@pixel-editor/app-services/ui";
import type { TilesetsPanelStore } from "@pixel-editor/app-services/ui-store";
import { startTransition, useState } from "react";

export function useTilesetsPanelState(props: {
  store: TilesetsPanelStore;
}) {
  const [zoom, setZoom] = useState<number>(defaultTilesetsPanelZoom);

  function runStoreAction(
    plan: ReturnType<typeof createTilesetsPanelStoreActionPlan>
  ): void {
    if (plan.kind !== "transition") {
      return;
    }

    startTransition(() => {
      plan.run(props.store);
    });
  }

  return {
    zoom,
    setZoom,
    actions: {
      activateTileset: (tilesetId: string) => {
        runStoreAction(
          createTilesetsPanelStoreActionPlan({
            actionId: tilesetsPanelStoreActionIds.activateTileset,
            tilesetId
          })
        );
      },
      selectStampTile: (tilesetId: string | undefined, localId: number) => {
        runStoreAction(
          createTilesetsPanelStoreActionPlan({
            actionId: tilesetsPanelStoreActionIds.selectStampTile,
            tilesetId,
            localId
          })
        );
      }
    }
  };
}
