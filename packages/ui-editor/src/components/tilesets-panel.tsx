"use client";

import {
  createTilesetsPanelSurfaceActionPlan,
  deriveTilesetsPanelActiveStampPresentation,
  deriveTilesetsPanelPalettePresentation,
  deriveTilesetsPanelTileGridPresentation,
  deriveTilesetsPanelToolbarPresentation,
  type TilesetsPanelSurfaceStore,
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
  const activeStampPresentation = deriveTilesetsPanelActiveStampPresentation(viewState);
  const tileGridPresentation = deriveTilesetsPanelTileGridPresentation(viewState);

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
                presentation={activeStampPresentation}
              />

              <TilesetsPanelTileGrid
                presentation={tileGridPresentation}
                onSelectTile={(localId) => {
                  state.actions.selectStampTile(viewState.activeTilesetId, localId);
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
  const palettePresentation = deriveTilesetsPanelPalettePresentation(viewState);
  const toolbarPresentation = deriveTilesetsPanelToolbarPresentation({
    viewState,
    hasExportJsonAction: onExportJson !== undefined,
    hasOpenTerrainSetsAction: onOpenTerrainSets !== undefined,
    hasOpenTileCollisionEditorAction: onOpenTileCollisionEditor !== undefined,
    hasOpenTileAnimationEditorAction: onOpenTileAnimationEditor !== undefined,
    t
  });
  const surfaceStore: TilesetsPanelSurfaceStore = {
    exportJson: () => {
      onExportJson?.();
    },
    openTerrainSets: () => {
      onOpenTerrainSets?.();
    },
    openTileCollisionEditor: () => {
      onOpenTileCollisionEditor?.();
    },
    openTileAnimationEditor: () => {
      onOpenTileAnimationEditor?.();
    }
  };

  function runSurfaceAction(actionId: Parameters<typeof createTilesetsPanelSurfaceActionPlan>[0]["actionId"]): void {
    const plan = createTilesetsPanelSurfaceActionPlan({
      actionId,
      viewState,
      hasExportJsonAction: onExportJson !== undefined,
      hasOpenTerrainSetsAction: onOpenTerrainSets !== undefined,
      hasOpenTileCollisionEditorAction: onOpenTileCollisionEditor !== undefined,
      hasOpenTileAnimationEditorAction: onOpenTileAnimationEditor !== undefined
    });

    if (plan.kind !== "transition") {
      return;
    }

    plan.run(surfaceStore);
  }

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
          presentation={palettePresentation}
          zoom={state.zoom}
          onSelectTile={(localId) => {
            state.actions.selectStampTile(activeTilesetId, localId);
          }}
        />
      </div>

      <TilesetsDockToolbar
        presentation={toolbarPresentation}
        zoom={state.zoom}
        setZoom={state.setZoom}
        onAction={runSurfaceAction}
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
