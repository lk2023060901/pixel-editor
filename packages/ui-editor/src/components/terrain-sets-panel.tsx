"use client";

import type {
  TerrainSetsPanelViewState,
} from "@pixel-editor/app-services/ui";
import type { TerrainSetsPanelStore } from "@pixel-editor/app-services/ui-store";
import { useI18n } from "@pixel-editor/i18n/client";
import { Panel } from "./panel";
import {
  TerrainSetDetails,
  TerrainSetsEmptyState,
  TerrainSetsList,
  TerrainSetsTabs,
  TerrainSetsToolbar
} from "./terrain-sets-panel-sections";
import { useTerrainSetsPanelState } from "./use-terrain-sets-panel-state";

export interface TerrainSetsPanelProps {
  viewState: TerrainSetsPanelViewState;
  store: TerrainSetsPanelStore;
  embedded?: boolean;
}

function TerrainSetsDockContent({
  viewState,
  state
}: Omit<TerrainSetsPanelProps, "embedded"> & {
  state: ReturnType<typeof useTerrainSetsPanelState>;
}) {
  const { t } = useI18n();

  if (!viewState.availableTilesets.length) {
    return (
      <div className="flex h-full min-h-[220px] items-center justify-center bg-[#b8b8b8] px-6 text-center text-sm text-slate-700">
        {t("terrainSets.noneAvailable")}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#b8b8b8]">
      <TerrainSetsTabs
        tilesets={viewState.availableTilesets}
        onActivateTileset={state.actions.activateTileset}
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        {viewState.wangSets.length ? (
          <TerrainSetsList
            selectedWangSetId={state.selectedWangSetId}
            wangSets={viewState.wangSets}
            onSelectWangSet={state.actions.selectWangSet}
          />
        ) : (
          <TerrainSetsEmptyState activeTilesetName={viewState.activeTilesetName} />
        )}
      </div>

      <TerrainSetDetails
        wangSet={state.selectedWangSet}
        onRename={state.actions.renameSelectedWangSet}
        onTypeChange={state.actions.updateSelectedWangSetType}
      />

      <TerrainSetsToolbar
        hasSelectedWangSet={Boolean(state.selectedWangSet)}
        onAddCorner={() => {
          state.actions.createWangSet("corner");
        }}
        onAddEdge={() => {
          state.actions.createWangSet("edge");
        }}
        onAddMixed={() => {
          state.actions.createWangSet("mixed");
        }}
        onRemove={state.actions.removeSelectedWangSet}
      />
    </div>
  );
}

export function TerrainSetsPanel({
  embedded = false,
  ...props
}: TerrainSetsPanelProps) {
  const { t } = useI18n();
  const state = useTerrainSetsPanelState(props);
  const content = <TerrainSetsDockContent {...props} state={state} />;

  if (embedded) {
    return content;
  }

  return <Panel title={t("terrainSets.title")}>{content}</Panel>;
}
