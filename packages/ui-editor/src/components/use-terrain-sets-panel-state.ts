"use client";

import {
  deriveTerrainSetsPanelSelection,
  resolveTerrainSetsRemovedWangSetFallbackId,
  type TerrainSetsPanelViewState,
  type TerrainSetsPanelWangSetId as WangSetId,
  type TerrainSetsPanelWangSetItemViewState
} from "@pixel-editor/app-services/ui";
import type { TerrainSetsPanelStore } from "@pixel-editor/app-services/ui-store";
import { startTransition, useEffect, useState } from "react";

type WangSetType = TerrainSetsPanelWangSetItemViewState["type"];

export function useTerrainSetsPanelState(props: {
  store: TerrainSetsPanelStore;
  viewState: TerrainSetsPanelViewState;
}) {
  const [selectedWangSetId, setSelectedWangSetId] = useState<WangSetId | undefined>();
  const selection = deriveTerrainSetsPanelSelection({
    availableTilesets: props.viewState.availableTilesets,
    wangSets: props.viewState.wangSets,
    selectedWangSetId
  });
  const activeTileset = selection.activeTileset;
  const currentSelectedWangSetId = selection.selectedWangSetId;
  const selectedWangSet = selection.selectedWangSet;

  useEffect(() => {
    if (currentSelectedWangSetId === selectedWangSetId) {
      return;
    }

    setSelectedWangSetId(currentSelectedWangSetId);
  }, [currentSelectedWangSetId, selectedWangSetId]);

  return {
    activeTileset,
    selectedWangSet,
    selectedWangSetId: currentSelectedWangSetId,
    actions: {
      activateTileset: (tilesetId: string) => {
        startTransition(() => {
          props.store.setActiveTileset(tilesetId);
        });
      },
      selectWangSet: setSelectedWangSetId,
      renameSelectedWangSet: (name: string) => {
        if (!selectedWangSet) {
          return;
        }

        startTransition(() => {
          props.store.updateActiveTilesetWangSet(selectedWangSet.id, { name });
        });
      },
      updateSelectedWangSetType: (type: WangSetType) => {
        if (!selectedWangSet) {
          return;
        }

        startTransition(() => {
          props.store.updateActiveTilesetWangSet(selectedWangSet.id, { type });
        });
      },
      createWangSet: (type: WangSetType) => {
        startTransition(() => {
          const createdId = props.store.createActiveTilesetWangSet(type);

          if (createdId) {
            setSelectedWangSetId(createdId);
          }
        });
      },
      removeSelectedWangSet: () => {
        if (!selectedWangSet) {
          return;
        }

        const fallbackId = resolveTerrainSetsRemovedWangSetFallbackId({
          wangSets: props.viewState.wangSets,
          selectedWangSetId: selectedWangSet.id
        });

        startTransition(() => {
          props.store.removeActiveTilesetWangSet(selectedWangSet.id);
          setSelectedWangSetId(fallbackId);
        });
      }
    }
  };
}
