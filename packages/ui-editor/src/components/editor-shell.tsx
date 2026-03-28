"use client";
import { type EditorShellStore } from "@pixel-editor/app-services/ui-shell";
import { useI18n } from "@pixel-editor/i18n/client";

import type { EditorRenderBridge } from "../render-bridge";

import { EditorShellChrome } from "./editor-shell-chrome";
import { EditorShellOverlays } from "./editor-shell-overlays";
import { EditorShellWorkspace } from "./editor-shell-workspace";
import { useEditorShellPresenter } from "./use-editor-shell-presenter";

export interface EditorShellProps {
  store: EditorShellStore;
  renderBridge: EditorRenderBridge;
}

export function EditorShell({ store, renderBridge }: EditorShellProps) {
  const { t } = useI18n();
  const presenter = useEditorShellPresenter({
    store,
    renderBridge,
    t
  });

  const {
    refs,
    state,
    view,
    chrome,
    menuActions,
    dockActions,
    objectActions,
    tilesetActions,
    dialogActions,
    rendererActions,
    miniMapActions,
    issuesActions,
    statusBarActions
  } = presenter;

  return (
    <div className="min-h-screen overflow-x-auto bg-slate-950 text-slate-100">
      <div className="flex min-h-screen min-w-[1520px] flex-col">
        <EditorShellChrome
          t={t}
          menuBarRef={refs.menuBarRef}
          menuSpecs={chrome.menuSpecs}
          openMenuId={state.openMenuId}
          newMenuOpen={state.newMenuOpen}
          shellChromeViewState={view.shellChromeViewState}
          newAction={chrome.newAction}
          remainingMainActions={chrome.remainingMainActions}
          newMenuItems={chrome.newMenuItems}
          toolToolbarItems={chrome.toolToolbarItems}
          toolOptionItems={chrome.toolOptionItems}
          onMenuPointerEnter={menuActions.onMenuPointerEnter}
          onMenuButtonClick={menuActions.onMenuButtonClick}
          onMenuAction={menuActions.onMenuAction}
          onCloseMenu={menuActions.onCloseMenu}
          onNewMenuBlur={menuActions.onNewMenuBlur}
          onNewMenuItem={menuActions.onNewMenuItem}
          onNewActionPrimaryClick={menuActions.onNewActionPrimaryClick}
          onToggleNewMenu={menuActions.onToggleNewMenu}
          onToolbarAction={menuActions.onToolbarAction}
        />

        <EditorShellWorkspace
          store={store}
          renderBridge={renderBridge}
          t={t}
          upperRightDockTab={state.upperRightDockTab}
          lowerRightDockTab={state.lowerRightDockTab}
          upperRightDockTabs={chrome.upperRightDockTabs}
          lowerRightDockTabs={chrome.lowerRightDockTabs}
          shellViewState={view.shellViewState}
          projectDockViewState={view.projectDockViewState}
          propertiesInspectorViewState={view.propertiesInspectorViewState}
          rendererCanvasViewState={view.rendererCanvasViewState}
          layersPanelViewState={view.layersPanelViewState}
          objectsPanelViewState={view.objectsPanelViewState}
          miniMapPanelViewState={view.miniMapPanelViewState}
          terrainSetsPanelViewState={view.terrainSetsPanelViewState}
          tilesetsPanelViewState={view.tilesetsPanelViewState}
          onMiniMapNavigate={miniMapActions.onNavigate}
          onProjectAssetActivate={dockActions.onProjectAssetActivate}
          onUpperRightDockTabChange={dockActions.onUpperRightDockTabChange}
          onLowerRightDockTabChange={dockActions.onLowerRightDockTabChange}
          onDetachTemplateInstances={objectActions.onDetachTemplateInstances}
          onReplaceWithTemplate={objectActions.onReplaceWithTemplate}
          onResetTemplateInstances={objectActions.onResetTemplateInstances}
          onSaveAsTemplate={objectActions.onSaveAsTemplate}
          onExportTilesetJson={tilesetActions.onExportJson}
          onOpenTileAnimationEditor={tilesetActions.onOpenTileAnimationEditor}
          onOpenTileCollisionEditor={tilesetActions.onOpenTileCollisionEditor}
          onOpenTerrainSets={tilesetActions.onOpenTerrainSets}
          onWorldMapActivate={rendererActions.onWorldMapActivate}
          onWorldMapMove={rendererActions.onWorldMapMove}
          onStrokeStart={rendererActions.onStrokeStart}
          onStrokeMove={rendererActions.onStrokeMove}
          onStrokeEnd={rendererActions.onStrokeEnd}
          onStatusInfoChange={rendererActions.onStatusInfoChange}
          onObjectSelect={rendererActions.onObjectSelect}
          onObjectMoveStart={rendererActions.onObjectMoveStart}
          onObjectMove={rendererActions.onObjectMove}
          onObjectMoveEnd={rendererActions.onObjectMoveEnd}
          onObjectResizeStart={rendererActions.onObjectResizeStart}
          onObjectResize={rendererActions.onObjectResize}
          onObjectResizeEnd={rendererActions.onObjectResizeEnd}
        />

        <EditorShellOverlays
          store={store}
          renderBridge={renderBridge}
          presentation={view.overlayPresentation}
          onClearIssues={issuesActions.onClear}
          onCloseIssues={issuesActions.onClose}
          onToggleIssues={statusBarActions.onToggleIssues}
          onLayerChange={statusBarActions.onLayerChange}
          onZoomChange={statusBarActions.onZoomChange}
          onCloseTileAnimationEditor={tilesetActions.onCloseTileAnimationEditor}
          onCloseCustomTypesEditor={dialogActions.onCloseCustomTypesEditor}
          onCloseProjectProperties={dialogActions.onCloseProjectProperties}
          onCloseTileCollisionEditor={tilesetActions.onCloseTileCollisionEditor}
          onCloseSaveTemplateDialog={dialogActions.onCloseSaveTemplateDialog}
        />
      </div>
    </div>
  );
}
