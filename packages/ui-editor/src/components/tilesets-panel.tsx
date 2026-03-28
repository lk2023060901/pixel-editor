"use client";

import {
  type TilesetsPanelViewState
} from "@pixel-editor/app-services/ui";
import type { TilesetsPanelStore } from "@pixel-editor/app-services/ui-store";
import { useI18n } from "@pixel-editor/i18n/client";
import { Panel } from "./panel";
import { TilePropertiesEditor } from "./tile-properties-editor";
import {
  TilesetActiveStampCard,
  TilesetsDockTabs,
  TilesetsDockTilePalette,
  TilesetsDockToolbar,
  TilesetsListSection,
  TilesetsPanelTileGrid
} from "./tilesets-panel-sections";
import { TilesetCreateForms } from "./tileset-create-forms";
import { TilesetDetailsForm } from "./tileset-details-form";
import { useTilesetsPanelState } from "./use-tilesets-panel-state";

export interface TilesetsPanelProps {
  viewState: TilesetsPanelViewState;
  store: TilesetsPanelStore;
  onExportJson?: () => void;
  onOpenTileAnimationEditor?: () => void;
  onOpenTileCollisionEditor?: () => void;
  onOpenTerrainSets?: () => void;
  embedded?: boolean;
}

function TilesetsPanelContent({
  viewState,
  store,
  state
}: Omit<TilesetsPanelProps, "embedded"> & {
  state: ReturnType<typeof useTilesetsPanelState>;
}) {
  const { t } = useI18n();
  const activeTilesetId = viewState.activeTilesetId;
  const selectedLocalId = viewState.selectedLocalId;

  return (
    <>
      {!viewState.availableTilesets.length && (
        <p className="text-sm text-slate-400">{t("tilesets.noAttached")}</p>
      )}

      {viewState.availableTilesets.length > 0 && (
        <>
          <TilesetsListSection
            tilesets={viewState.availableTilesets}
            onActivateTileset={state.actions.activateTileset}
          />

          {activeTilesetId && (
            <>
              <TilesetActiveStampCard
                selectedLocalId={selectedLocalId}
                selectedTileClassName={viewState.selectedTileClassName}
                selectedTilePreview={viewState.selectedTilePreview}
                stampSummary={viewState.stampSummary}
              />

              <TilesetsPanelTileGrid
                activeTilesetId={activeTilesetId}
                tileEntries={viewState.activeTileEntries}
                onSelectTile={(localId) => {
                  state.actions.selectStampTile(activeTilesetId, localId);
                }}
              />

              {viewState.tilesetDetailsViewState ? (
                <TilesetDetailsForm store={store} viewState={viewState.tilesetDetailsViewState} />
              ) : null}
              {viewState.tilePropertiesEditorViewState ? (
                <TilePropertiesEditor store={store} viewState={viewState.tilePropertiesEditorViewState} />
              ) : null}
            </>
          )}
        </>
      )}

      <TilesetCreateForms store={store} />
    </>
  );
}

function TilesetsDockContent({
  viewState,
  state,
  onExportJson,
  onOpenTileAnimationEditor,
  onOpenTileCollisionEditor,
  onOpenTerrainSets
}: Omit<TilesetsPanelProps, "embedded"> & {
  state: ReturnType<typeof useTilesetsPanelState>;
}) {
  const { t } = useI18n();
  const activeTilesetId = viewState.activeTilesetId;
  const selectedLocalId = viewState.selectedLocalId;

  if (!viewState.availableTilesets.length) {
    return (
      <div className="flex h-full min-h-[220px] items-center justify-center bg-[#b8b8b8] px-6 text-center text-sm text-slate-700">
        {t("tilesets.noAttached")}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#b8b8b8]">
      <TilesetsDockTabs
        tilesets={viewState.availableTilesets}
        onActivateTileset={state.actions.activateTileset}
      />

      <div className="min-h-0 flex-1 overflow-auto p-2">
        <TilesetsDockTilePalette
          activeImageColumns={viewState.activeImageColumns}
          activeTileEntries={viewState.activeTileEntries}
          activeTileHeight={viewState.activeTileHeight}
          activeTileWidth={viewState.activeTileWidth}
          activeTilesetId={activeTilesetId}
          activeTilesetKind={viewState.activeTilesetKind}
          zoom={state.zoom}
          onSelectTile={(localId) => {
            if (!activeTilesetId) {
              return;
            }

            state.actions.selectStampTile(activeTilesetId, localId);
          }}
        />
      </div>

      <TilesetsDockToolbar
        activeTilesetId={activeTilesetId}
        selectedLocalId={selectedLocalId}
        zoom={state.zoom}
        setZoom={state.setZoom}
        onExportJson={onExportJson}
        onOpenTerrainSets={onOpenTerrainSets}
        onOpenTileAnimationEditor={onOpenTileAnimationEditor}
        onOpenTileCollisionEditor={onOpenTileCollisionEditor}
      />
    </div>
  );
}

export function TilesetsPanel({
  embedded = false,
  ...props
}: TilesetsPanelProps) {
  const { t } = useI18n();
  const state = useTilesetsPanelState({
    store: props.store
  });
  const content = embedded
    ? <TilesetsDockContent {...props} state={state} />
    : <TilesetsPanelContent {...props} state={state} />;

  if (embedded) {
    return content;
  }

  return <Panel title={t("tilesets.title")}>{content}</Panel>;
}
