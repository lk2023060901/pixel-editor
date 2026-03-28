"use client";

import type {
  TerrainSetsPanelViewState,
  TerrainSetsPanelWangSetItemViewState
} from "@pixel-editor/app-services/ui";
import type { TerrainSetsPanelStore } from "@pixel-editor/app-services/ui-store";
import { startTransition, useEffect, useState } from "react";

type WangSetId = TerrainSetsPanelWangSetItemViewState["id"];
type WangSetType = TerrainSetsPanelWangSetItemViewState["type"];

export function useTerrainSetsPanelState(props: {
  store: TerrainSetsPanelStore;
  viewState: TerrainSetsPanelViewState;
}) {
  const [selectedWangSetId, setSelectedWangSetId] = useState<WangSetId | undefined>();
  const activeTileset =
    props.viewState.availableTilesets.find((tileset) => tileset.isActive) ??
    props.viewState.availableTilesets[0];
  const selectedWangSet =
    props.viewState.wangSets.find((wangSet) => wangSet.id === selectedWangSetId) ??
    props.viewState.wangSets[0];

  useEffect(() => {
    if (!activeTileset) {
      setSelectedWangSetId(undefined);
      return;
    }

    if (
      selectedWangSetId &&
      props.viewState.wangSets.some((wangSet) => wangSet.id === selectedWangSetId)
    ) {
      return;
    }

    setSelectedWangSetId(props.viewState.wangSets[0]?.id);
  }, [activeTileset, props.viewState.wangSets, selectedWangSetId]);

  return {
    activeTileset,
    selectedWangSet,
    selectedWangSetId,
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

        const nextIndex =
          props.viewState.wangSets.findIndex((wangSet) => wangSet.id === selectedWangSet.id) ?? -1;
        const fallbackId =
          nextIndex > 0
            ? props.viewState.wangSets[nextIndex - 1]?.id
            : props.viewState.wangSets[1]?.id;

        startTransition(() => {
          props.store.removeActiveTilesetWangSet(selectedWangSet.id);
          setSelectedWangSetId(fallbackId);
        });
      }
    }
  };
}
