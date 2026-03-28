"use client";

import type {
  LayersPanelViewState,
  MiniMapPanelViewState,
  ObjectsPanelViewState,
  ProjectDockViewState,
  PropertiesInspectorViewState,
  RendererCanvasViewState,
  TerrainSetsPanelViewState,
  TilesetsPanelViewState
} from "@pixel-editor/app-services/ui";
import type { EditorShellStore, EditorShellViewState } from "@pixel-editor/app-services/ui-shell";
import type { TranslationFn } from "@pixel-editor/i18n";

import type { EditorRenderBridge } from "../render-bridge";

import { DockPanel } from "./dock-panel";
import { DockStack, type DockStackTab } from "./dock-stack";
import { LayersPanel } from "./layers-panel";
import { MiniMapPanel } from "./mini-map-panel";
import { ObjectsPanel } from "./objects-panel";
import { ProjectDock, type ProjectDockProps } from "./project-dock";
import { PropertiesInspector } from "./properties-inspector";
import { RendererCanvas, type RendererCanvasProps } from "./renderer-canvas";
import { TerrainSetsPanel } from "./terrain-sets-panel";
import { TilesetsPanel } from "./tilesets-panel";
import type {
  LowerRightDockTabId,
  UpperRightDockTabId
} from "./use-editor-shell-local-state";

export interface EditorShellWorkspaceProps {
  store: EditorShellStore;
  renderBridge: EditorRenderBridge;
  t: TranslationFn;
  upperRightDockTab: UpperRightDockTabId;
  lowerRightDockTab: LowerRightDockTabId;
  upperRightDockTabs: DockStackTab<UpperRightDockTabId>[];
  lowerRightDockTabs: DockStackTab<LowerRightDockTabId>[];
  shellViewState: EditorShellViewState;
  projectDockViewState: ProjectDockViewState;
  propertiesInspectorViewState: PropertiesInspectorViewState;
  rendererCanvasViewState: RendererCanvasViewState;
  layersPanelViewState: LayersPanelViewState;
  objectsPanelViewState: ObjectsPanelViewState;
  miniMapPanelViewState: MiniMapPanelViewState | undefined;
  terrainSetsPanelViewState: TerrainSetsPanelViewState;
  tilesetsPanelViewState: TilesetsPanelViewState;
  onMiniMapNavigate: (originX: number, originY: number) => void;
  onProjectAssetActivate: ProjectDockProps["onAssetActivate"];
  onUpperRightDockTabChange: (tabId: UpperRightDockTabId) => void;
  onLowerRightDockTabChange: (tabId: LowerRightDockTabId) => void;
  onDetachTemplateInstances: () => void;
  onReplaceWithTemplate: () => void;
  onResetTemplateInstances: () => void;
  onSaveAsTemplate: () => void;
  onExportTilesetJson: () => void;
  onOpenTileAnimationEditor: () => void;
  onOpenTileCollisionEditor: () => void;
  onOpenTerrainSets: () => void;
  onWorldMapActivate: NonNullable<RendererCanvasProps["onWorldMapActivate"]>;
  onWorldMapMove: NonNullable<RendererCanvasProps["onWorldMapMove"]>;
  onStrokeStart: NonNullable<RendererCanvasProps["onStrokeStart"]>;
  onStrokeMove: NonNullable<RendererCanvasProps["onStrokeMove"]>;
  onStrokeEnd: NonNullable<RendererCanvasProps["onStrokeEnd"]>;
  onStatusInfoChange: NonNullable<RendererCanvasProps["onStatusInfoChange"]>;
  onObjectSelect: NonNullable<RendererCanvasProps["onObjectSelect"]>;
  onObjectMoveStart: NonNullable<RendererCanvasProps["onObjectMoveStart"]>;
  onObjectMove: NonNullable<RendererCanvasProps["onObjectMove"]>;
  onObjectMoveEnd: NonNullable<RendererCanvasProps["onObjectMoveEnd"]>;
  onObjectResizeStart: NonNullable<RendererCanvasProps["onObjectResizeStart"]>;
  onObjectResize: NonNullable<RendererCanvasProps["onObjectResize"]>;
  onObjectResizeEnd: NonNullable<RendererCanvasProps["onObjectResizeEnd"]>;
}

export function EditorShellWorkspace(props: EditorShellWorkspaceProps) {
  let upperRightDockContent = (
    <LayersPanel embedded store={props.store} viewState={props.layersPanelViewState} />
  );

  if (props.upperRightDockTab === "objects") {
    upperRightDockContent = (
      <ObjectsPanel
        embedded
        viewState={props.objectsPanelViewState}
        onDetachTemplateInstances={props.onDetachTemplateInstances}
        onReplaceWithTemplate={props.onReplaceWithTemplate}
        onResetTemplateInstances={props.onResetTemplateInstances}
        onSaveAsTemplate={props.onSaveAsTemplate}
        store={props.store}
      />
    );
  } else if (props.upperRightDockTab === "mini-map") {
    upperRightDockContent = (
      <MiniMapPanel
        embedded
        renderBridge={props.renderBridge}
        viewState={props.miniMapPanelViewState}
        onNavigate={props.onMiniMapNavigate}
      />
    );
  }

  const lowerRightDockContent =
    props.lowerRightDockTab === "terrain-sets" ? (
      <TerrainSetsPanel
        embedded
        store={props.store}
        viewState={props.terrainSetsPanelViewState}
      />
    ) : (
      <TilesetsPanel
        embedded
        onOpenTileAnimationEditor={props.onOpenTileAnimationEditor}
        onExportJson={props.onExportTilesetJson}
        onOpenTileCollisionEditor={props.onOpenTileCollisionEditor}
        onOpenTerrainSets={props.onOpenTerrainSets}
        store={props.store}
        viewState={props.tilesetsPanelViewState}
      />
    );

  return (
    <div className="grid min-h-0 flex-1 grid-cols-[250px_280px_minmax(0,1fr)_360px] gap-px bg-slate-700">
      <ProjectDock
        viewState={props.projectDockViewState}
        onAssetActivate={props.onProjectAssetActivate}
      />

      <DockPanel
        title={props.t("shell.dock.properties")}
        bodyClassName="min-h-0 flex-1 overflow-y-auto"
      >
        <PropertiesInspector
          embedded
          store={props.store}
          viewState={props.propertiesInspectorViewState}
        />
      </DockPanel>

      <main className="flex min-h-0 flex-col border border-slate-700 bg-slate-950/95">
        <div className="flex items-center gap-2 border-b border-slate-700 bg-slate-800/90 px-3 py-2">
          <div className="border border-slate-600 bg-slate-900 px-3 py-1 text-sm text-slate-100">
            {props.shellViewState.activeDocument?.name ?? props.t("shell.untitledMap")}
          </div>
        </div>

        <div className="min-h-0 flex-1">
          <RendererCanvas
            renderBridge={props.renderBridge}
            viewState={props.rendererCanvasViewState}
            onWorldMapActivate={props.onWorldMapActivate}
            onWorldMapMove={props.onWorldMapMove}
            onStrokeStart={props.onStrokeStart}
            onStrokeMove={props.onStrokeMove}
            onStrokeEnd={props.onStrokeEnd}
            onStatusInfoChange={props.onStatusInfoChange}
            onObjectSelect={props.onObjectSelect}
            onObjectMoveStart={props.onObjectMoveStart}
            onObjectMove={props.onObjectMove}
            onObjectMoveEnd={props.onObjectMoveEnd}
            onObjectResizeStart={props.onObjectResizeStart}
            onObjectResize={props.onObjectResize}
            onObjectResizeEnd={props.onObjectResizeEnd}
          />
        </div>
      </main>

      <aside className="grid min-h-0 grid-rows-[minmax(260px,0.9fr)_minmax(360px,1.1fr)] gap-3">
        <DockStack
          activeTab={props.upperRightDockTab}
          bodyClassName="min-h-0 flex-1 bg-slate-900/95"
          tabs={props.upperRightDockTabs}
          onTabChange={props.onUpperRightDockTabChange}
        >
          <div className="min-h-0 h-full overflow-y-auto">{upperRightDockContent}</div>
        </DockStack>

        <DockStack
          activeTab={props.lowerRightDockTab}
          bodyClassName="min-h-0 flex-1 bg-slate-900/95"
          tabPosition="bottom"
          tabs={props.lowerRightDockTabs}
          onTabChange={props.onLowerRightDockTabChange}
        >
          <div className="min-h-0 h-full overflow-y-auto">{lowerRightDockContent}</div>
        </DockStack>
      </aside>
    </div>
  );
}
