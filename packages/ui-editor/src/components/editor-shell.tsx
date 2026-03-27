"use client";

import {
  createEditorShellActionPlan,
  deriveEditorShellChromeViewState,
  deriveEditorShellDialogsViewState,
  deriveEditorStatusBarViewState,
  deriveEditorShellViewState,
  deriveIssuesPanelViewState,
  deriveLayersPanelViewState,
  deriveMapImageExportViewState,
  deriveMiniMapPanelViewState,
  deriveObjectsPanelViewState,
  deriveProjectDockViewState,
  derivePropertiesInspectorViewState,
  deriveRendererCanvasViewState,
  deriveTerrainSetsPanelViewState,
  deriveTileAnimationEditorViewState,
  deriveTileCollisionEditorViewState,
  deriveTilesetsPanelViewState,
  getTiledMainMenus,
  getTiledMainToolbarActions,
  getTiledNewMenuItems,
  getTiledToolOptionItems,
  getTiledToolToolbarItems,
  isEditorShellMainToolbarActionDisabled,
  isEditorShellToolActionDisabled,
  isEditorShellToolOptionActive,
  resolveProjectDockActivation,
  toolbarIconUrls,
  type EditorController,
  type EditorShellActionPlan,
  type TiledMenuItemSpec2,
  type ToolbarActionSpec
} from "@pixel-editor/app-services/ui";
import { useI18n } from "@pixel-editor/i18n/client";
import { startTransition, useEffect, useRef, useState, useSyncExternalStore } from "react";

import type { EditorRenderBridge } from "../render-bridge";

import { LayersPanel } from "./layers-panel";
import { DockPanel } from "./dock-panel";
import { MiniMapPanel } from "./mini-map-panel";
import { DockStack, type DockStackTab } from "./dock-stack";
import { ObjectsPanel } from "./objects-panel";
import { PropertiesInspector } from "./properties-inspector";
import { ProjectPropertyTypesEditorDialog } from "./project-property-types-editor-dialog";
import { ProjectDock } from "./project-dock";
import { SaveTemplateDialog } from "./save-template-dialog";
import { RendererCanvas } from "./renderer-canvas";
import { EditorStatusBar } from "./editor-status-bar";
import { IssuesPanel } from "./issues-panel";
import { ProjectPropertiesDialog } from "./project-properties-dialog";
import { TerrainSetsPanel } from "./terrain-sets-panel";
import { TileAnimationEditorDialog } from "./tile-animation-editor-dialog";
import { TileCollisionEditorDialog } from "./tile-collision-editor-dialog";
import { TilesetsPanel } from "./tilesets-panel";

export interface EditorShellProps {
  store: EditorController;
  renderBridge: EditorRenderBridge;
}

type UpperRightDockTabId = "layers" | "objects" | "mini-map";
type LowerRightDockTabId = "terrain-sets" | "tilesets";

function MenuBarButton(props: {
  label: string;
  open: boolean;
  onClick: () => void;
  onPointerEnter: () => void;
}) {
  return (
    <button
      className={`rounded-sm px-2 py-1 text-sm transition ${
        props.open
          ? "bg-slate-700/90 text-slate-50"
          : "text-slate-200 hover:bg-slate-700/70"
      }`}
      onClick={props.onClick}
      onPointerEnter={props.onPointerEnter}
    >
      {props.label}
    </button>
  );
}

function MenuPopup(props: {
  items: TiledMenuItemSpec2[];
  onAction: (actionId: string) => void;
  onRequestClose: () => void;
}) {
  const [openSubmenuId, setOpenSubmenuId] = useState<string | null>(null);

  return (
    <div className="min-h-4 min-w-[240px] border border-slate-700 bg-slate-900/98 py-1 shadow-[0_12px_32px_rgba(2,6,23,0.6)]">
      {props.items.map((item, index) => {
        if (item.kind === "separator") {
          return <div key={`separator-${index}`} className="my-1 border-t border-slate-800" />;
        }

        if (item.kind === "submenu") {
          const isOpen = openSubmenuId === item.id;

          return (
            <div
              key={item.id}
              className="relative"
              onMouseEnter={() => {
                setOpenSubmenuId(item.id);
              }}
            >
              <button
                className="flex w-full items-center justify-between gap-4 px-3 py-1.5 text-left text-sm text-slate-200 transition hover:bg-slate-800/90"
              >
                <span>{item.label}</span>
                <span className="text-[11px] text-slate-500">▸</span>
              </button>
              {isOpen ? (
                <div className="absolute left-full top-0 z-30 ml-1">
                  <MenuPopup
                    items={item.items}
                    onAction={props.onAction}
                    onRequestClose={props.onRequestClose}
                  />
                </div>
              ) : null}
            </div>
          );
        }

        return (
          <button
            key={item.id}
            className={`grid w-full grid-cols-[16px_minmax(0,1fr)_auto] items-center gap-3 px-3 py-1.5 text-left text-sm transition ${
              item.implemented && !item.disabled
                ? "text-slate-200 hover:bg-slate-800/90"
                : "cursor-not-allowed text-slate-500"
            }`}
            disabled={!item.implemented || item.disabled}
            onClick={() => {
              props.onAction(item.id);
              props.onRequestClose();
            }}
          >
            <span className="w-4 text-xs text-slate-300">{item.checked ? "✓" : ""}</span>
            <span className="min-w-0 truncate">{item.label}</span>
            <span className="pl-6 text-[11px] text-slate-500">{item.shortcut ?? ""}</span>
          </button>
        );
      })}
    </div>
  );
}

function ToolbarSeparator() {
  return <div className="mx-1 h-8 w-px bg-slate-600/80" />;
}

function ToolbarIconButton(props: {
  action: ToolbarActionSpec;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      aria-label={props.action.label}
      className={`flex h-8 w-8 items-center justify-center rounded-sm border transition disabled:cursor-not-allowed disabled:opacity-40 ${
        props.active
          ? "border-emerald-500/80 bg-emerald-500/15"
          : "border-transparent bg-transparent hover:border-slate-500 hover:bg-slate-700/70"
      }`}
      disabled={props.disabled ?? !props.action.implemented}
      title={props.action.label}
      onClick={props.onClick}
    >
      <img
        alt=""
        className="h-5 w-5 object-contain"
        draggable={false}
        src={toolbarIconUrls[props.action.icon]}
      />
    </button>
  );
}

function ToolbarSplitButton(props: {
  action: ToolbarActionSpec;
  menuItems: Array<{ id: string; label: string; implemented: boolean }>;
  menuLabel: string;
  soonLabel: string;
  menuOpen: boolean;
  onPrimaryClick: () => void;
  onToggleMenu: () => void;
  onMenuItemClick: (id: string) => void;
  onBlur: () => void;
}) {
  return (
    <div
      className="relative flex"
      onBlur={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
          return;
        }

        props.onBlur();
      }}
    >
      <button
        aria-label={props.action.label}
        className="flex h-8 w-8 items-center justify-center rounded-l-sm border border-transparent bg-transparent transition hover:border-slate-500 hover:bg-slate-700/70"
        title={props.action.label}
        onClick={props.onPrimaryClick}
      >
        <img
          alt=""
          className="h-5 w-5 object-contain"
          draggable={false}
          src={toolbarIconUrls[props.action.icon]}
        />
      </button>
      <button
        aria-expanded={props.menuOpen}
        aria-haspopup="menu"
        aria-label={`${props.action.label} ${props.menuLabel}`}
        className="flex h-8 w-4 items-center justify-center rounded-r-sm border border-transparent bg-transparent text-[9px] text-slate-300 transition hover:border-slate-500 hover:bg-slate-700/70"
        onClick={props.onToggleMenu}
      >
        ▼
      </button>
      {props.menuOpen ? (
        <div
          className="absolute top-9 z-20 min-w-[168px] overflow-hidden rounded-sm border border-slate-700 bg-slate-900/98 shadow-[0_12px_32px_rgba(2,6,23,0.6)]"
          role="menu"
        >
          {props.menuItems.map((item) => (
            <button
              key={item.id}
              className="flex w-full items-center justify-between gap-4 border-b border-slate-800 px-3 py-2 text-left text-sm text-slate-200 transition last:border-b-0 hover:bg-slate-800/90 disabled:cursor-not-allowed disabled:text-slate-500"
              disabled={!item.implemented}
              role="menuitem"
              onClick={() => {
                props.onMenuItemClick(item.id);
              }}
            >
              <span>{item.label}</span>
              {!item.implemented ? (
                <span className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                  {props.soonLabel}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function EditorShell({ store, renderBridge }: EditorShellProps) {
  const { t } = useI18n();
  const [upperRightDockTab, setUpperRightDockTab] = useState<UpperRightDockTabId>("layers");
  const [lowerRightDockTab, setLowerRightDockTab] = useState<LowerRightDockTabId>("tilesets");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const [customTypesEditorOpen, setCustomTypesEditorOpen] = useState(false);
  const [projectPropertiesOpen, setProjectPropertiesOpen] = useState(false);
  const [tileAnimationEditorOpen, setTileAnimationEditorOpen] = useState(false);
  const [tileCollisionEditorOpen, setTileCollisionEditorOpen] = useState(false);
  const [saveTemplateDialogOpen, setSaveTemplateDialogOpen] = useState(false);
  const [statusInfo, setStatusInfo] = useState("");
  const menuBarRef = useRef<HTMLDivElement | null>(null);
  const snapshot = useSyncExternalStore(
    store.subscribe.bind(store),
    store.getSnapshot.bind(store),
    store.getSnapshot.bind(store)
  );
  const shellViewState = deriveEditorShellViewState(snapshot);
  const statusBarViewState = deriveEditorStatusBarViewState(snapshot);
  const issuesPanelViewState = deriveIssuesPanelViewState(snapshot);
  const layersPanelViewState = deriveLayersPanelViewState(snapshot);
  const mapImageExportViewState = deriveMapImageExportViewState(snapshot);
  const miniMapPanelViewState = deriveMiniMapPanelViewState(snapshot);
  const objectsPanelViewState = deriveObjectsPanelViewState(snapshot);
  const projectDockViewState = deriveProjectDockViewState(snapshot);
  const propertiesInspectorViewState = derivePropertiesInspectorViewState(snapshot);
  const rendererCanvasViewState = deriveRendererCanvasViewState(snapshot);
  const shellChromeViewState = deriveEditorShellChromeViewState({
    snapshot,
    customTypesEditorOpen
  });
  const shellDialogsViewState = deriveEditorShellDialogsViewState(snapshot);
  const terrainSetsPanelViewState = deriveTerrainSetsPanelViewState(snapshot);
  const tilesetsPanelViewState = deriveTilesetsPanelViewState(snapshot);
  const tileAnimationEditorViewState = deriveTileAnimationEditorViewState(snapshot);
  const tileCollisionEditorViewState = deriveTileCollisionEditorViewState(snapshot);
  const activeObject = shellViewState.activeObject;
  const activeDocument = shellViewState.activeDocument;
  const toolOptionItems = getTiledToolOptionItems(
    {
      activeTool: shellChromeViewState.activeTool,
      shapeFillMode: shellChromeViewState.shapeFillMode
    },
    t
  );
  const mainToolbarActions = getTiledMainToolbarActions(t);
  const newMenuItems = getTiledNewMenuItems(t);
  const toolToolbarItems = getTiledToolToolbarItems(t);
  const upperRightDockTabs: DockStackTab<UpperRightDockTabId>[] = [
    { id: "layers", label: t("shell.dock.layers") },
    { id: "objects", label: t("shell.dock.objects") },
    { id: "mini-map", label: t("shell.dock.miniMap") }
  ];
  const lowerRightDockTabs: DockStackTab<LowerRightDockTabId>[] = [
    { id: "tilesets", label: t("shell.dock.tilesets") },
    { id: "terrain-sets", label: t("shell.dock.terrainSets") }
  ];
  const newAction = mainToolbarActions[0];
  const remainingMainActions = mainToolbarActions.slice(1);
  const menuSpecs = getTiledMainMenus(shellChromeViewState.menuContext, t);

  useEffect(() => {
    if (!openMenuId) {
      return;
    }

    function handlePointerDown(event: PointerEvent): void {
      if (menuBarRef.current?.contains(event.target as Node)) {
        return;
      }

      setOpenMenuId(null);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [openMenuId]);

  useEffect(() => {
    if (!saveTemplateDialogOpen || activeObject) {
      return;
    }

    setSaveTemplateDialogOpen(false);
  }, [activeObject, saveTemplateDialogOpen]);

  async function handleExportAsImage(): Promise<void> {
    if (!mapImageExportViewState) {
      return;
    }

    try {
      const dataUrl = await renderBridge.exportSnapshotImageDataUrl({
        snapshot: mapImageExportViewState.snapshot,
        width: mapImageExportViewState.width,
        height: mapImageExportViewState.height,
        labels: {
          noActiveMap: t("canvas.noActiveMap")
        }
      });

      await store.exportActiveMapImage(dataUrl);
    } catch (error) {
      console.error("Failed to export map image.", error);
    }
  }

  function executeActionPlan(plan: EditorShellActionPlan): void {
    switch (plan.kind) {
      case "transition":
        startTransition(() => {
          plan.run(store);
        });
        return;
      case "async":
        void plan.run(store);
        return;
      case "local":
        switch (plan.action) {
          case "export-as-image":
            void handleExportAsImage();
            return;
          case "toggle-custom-types-editor":
            setCustomTypesEditorOpen((current) => !current);
            return;
          case "toggle-project-properties":
            setProjectPropertiesOpen((current) => !current);
            return;
          case "open-tile-animation-editor":
            setTileAnimationEditorOpen(true);
            return;
          case "open-tile-collision-editor":
            setTileCollisionEditorOpen(true);
            return;
          case "focus-terrain-sets":
            setLowerRightDockTab("terrain-sets");
            return;
        }
      case "noop":
        return;
    }
  }

  function buildShellActionPlan(
    actionId: string,
    editorToolId?: ToolbarActionSpec["editorToolId"]
  ): EditorShellActionPlan {
    return createEditorShellActionPlan({
      actionId,
      canUseWorldTool: shellChromeViewState.canUseWorldTool,
      ...(editorToolId === undefined ? {} : { editorToolId }),
      ...(shellChromeViewState.activeLayerId === undefined
        ? {}
        : { activeLayerId: shellChromeViewState.activeLayerId })
    });
  }

  function handleToolbarAction(action: ToolbarActionSpec): void {
    if (!action.implemented) {
      return;
    }

    executeActionPlan(buildShellActionPlan(action.id, action.editorToolId));
  }

  function handleNewMenuItem(menuItemId: string): void {
    setNewMenuOpen(false);
    executeActionPlan(buildShellActionPlan(menuItemId));
  }

  function handleMenuAction(actionId: string): void {
    executeActionPlan(buildShellActionPlan(actionId));
  }

  let upperRightDockContent = (
    <LayersPanel embedded store={store} viewState={layersPanelViewState} />
  );

  if (upperRightDockTab === "objects") {
    upperRightDockContent = (
      <ObjectsPanel
        embedded
        viewState={objectsPanelViewState}
        onDetachTemplateInstances={() => {
          startTransition(() => {
            store.detachSelectedTemplateInstances();
          });
        }}
        onReplaceWithTemplate={() => {
          startTransition(() => {
            store.replaceSelectedObjectsWithActiveTemplate();
          });
        }}
        onResetTemplateInstances={() => {
          startTransition(() => {
            store.resetSelectedTemplateInstances();
          });
        }}
        onSaveAsTemplate={() => {
          setSaveTemplateDialogOpen(true);
        }}
        store={store}
      />
    );
  } else if (upperRightDockTab === "mini-map") {
    upperRightDockContent = <MiniMapPanel embedded viewState={miniMapPanelViewState} />;
  }

  const lowerRightDockContent =
    lowerRightDockTab === "terrain-sets" ? (
      <TerrainSetsPanel embedded store={store} viewState={terrainSetsPanelViewState} />
    ) : (
      <TilesetsPanel
        embedded
        onOpenTileAnimationEditor={() => {
          setTileAnimationEditorOpen(true);
        }}
        onExportJson={() => {
          void store.exportActiveTilesetAsJson();
        }}
        onOpenTileCollisionEditor={() => {
          setTileCollisionEditorOpen(true);
        }}
        onOpenTerrainSets={() => {
          setLowerRightDockTab("terrain-sets");
        }}
        store={store}
        viewState={tilesetsPanelViewState}
      />
    );

  return (
    <div className="min-h-screen overflow-x-auto bg-slate-950 text-slate-100">
      <div className="flex min-h-screen min-w-[1520px] flex-col">
        <div className="border-b border-slate-700 bg-slate-800/95 px-3 py-1.5">
          <div ref={menuBarRef} className="flex items-center gap-1">
            {menuSpecs.map((menu) => (
              <div
                key={menu.id}
                className="relative"
                onPointerEnter={() => {
                  if (openMenuId !== null) {
                    setOpenMenuId(menu.id);
                  }
                }}
              >
                <MenuBarButton
                  label={menu.label}
                  open={openMenuId === menu.id}
                  onClick={() => {
                    setOpenMenuId((current) => (current === menu.id ? null : menu.id));
                  }}
                  onPointerEnter={() => {
                    if (openMenuId !== null) {
                      setOpenMenuId(menu.id);
                    }
                  }}
                />
                {openMenuId === menu.id ? (
                  <div className="absolute left-0 top-full z-30 mt-1">
                    <MenuPopup
                      items={menu.items}
                      onAction={handleMenuAction}
                      onRequestClose={() => {
                        setOpenMenuId(null);
                      }}
                    />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="border-b border-slate-700 bg-slate-900/95 px-3 py-1.5">
          <div className="flex items-center gap-1 overflow-x-auto">
            {newAction ? (
              <ToolbarSplitButton
                action={newAction}
                menuItems={newMenuItems}
                menuOpen={newMenuOpen}
                onBlur={() => {
                  setNewMenuOpen(false);
                }}
                onMenuItemClick={handleNewMenuItem}
                onPrimaryClick={() => {
                  handleToolbarAction(newAction);
                  setNewMenuOpen(false);
                }}
                onToggleMenu={() => {
                  setNewMenuOpen((current) => !current);
                }}
                menuLabel={t("common.menu")}
                soonLabel={t("common.soon")}
              />
            ) : null}
            {remainingMainActions.map((action) => (
              <ToolbarIconButton
                key={action.id}
                action={action}
                disabled={
                  !action.implemented ||
                  isEditorShellMainToolbarActionDisabled(shellChromeViewState, action.id)
                }
                onClick={() => {
                  handleToolbarAction(action);
                }}
              />
            ))}
            <ToolbarSeparator />
            {toolToolbarItems.map((item, index) =>
              item.kind === "separator" ? (
                <ToolbarSeparator key={`tool-separator-${index}`} />
              ) : (
                <ToolbarIconButton
                  key={item.action.id}
                  action={item.action}
                  active={item.action.editorToolId === shellChromeViewState.activeTool}
                  disabled={
                    !item.action.implemented ||
                    isEditorShellToolActionDisabled(
                      shellChromeViewState,
                      item.action.editorToolId
                    )
                  }
                  onClick={() => {
                    handleToolbarAction(item.action);
                  }}
                />
              )
            )}
            {toolOptionItems.length > 0 ? <ToolbarSeparator /> : null}
            {toolOptionItems.map((item, index) =>
              item.kind === "separator" ? (
                <ToolbarSeparator key={`option-separator-${index}`} />
              ) : (
                <ToolbarIconButton
                  key={item.action.id}
                  action={item.action}
                  active={isEditorShellToolOptionActive(shellChromeViewState, item.action.id)}
                  onClick={() => {
                    handleToolbarAction(item.action);
                  }}
                />
              )
            )}
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-[250px_280px_minmax(0,1fr)_360px] gap-px bg-slate-700">
          <ProjectDock
            viewState={projectDockViewState}
            onAssetActivate={(asset) => {
              const activation = resolveProjectDockActivation(snapshot, asset);

              if (activation === undefined) {
                return;
              }

              switch (activation.kind) {
                case "map":
                  store.setActiveMap(activation.documentId);
                  return;
                case "tileset":
                  setLowerRightDockTab("tilesets");
                  store.setActiveTileset(activation.documentId);
                  return;
                case "template":
                  store.setActiveTemplate(activation.documentId);
                  return;
              }
            }}
          />

          <DockPanel
            title={t("shell.dock.properties")}
            bodyClassName="min-h-0 flex-1 overflow-y-auto"
          >
            <PropertiesInspector
              embedded
              store={store}
              viewState={propertiesInspectorViewState}
            />
          </DockPanel>

          <main className="flex min-h-0 flex-col border border-slate-700 bg-slate-950/95">
            <div className="flex items-center gap-2 border-b border-slate-700 bg-slate-800/90 px-3 py-2">
              <div className="border border-slate-600 bg-slate-900 px-3 py-1 text-sm text-slate-100">
                {activeDocument?.name ?? t("shell.untitledMap")}
              </div>
            </div>

            <div className="min-h-0 flex-1">
              <RendererCanvas
                renderBridge={renderBridge}
                viewState={rendererCanvasViewState}
                onWorldMapActivate={(mapId) => {
                  store.setActiveMap(mapId);
                }}
                onWorldMapMove={(worldId, fileName, x, y) => {
                  store.moveWorldMap(worldId, fileName, x, y);
                }}
                onStrokeStart={(x, y, modifiers) => {
                  store.beginCanvasStroke(x, y, modifiers);
                }}
                onStrokeMove={(x, y, modifiers) => {
                  store.updateCanvasStroke(x, y, modifiers);
                }}
                onStrokeEnd={() => {
                  store.endCanvasStroke();
                }}
                onStatusInfoChange={setStatusInfo}
                onObjectSelect={(objectId) => {
                  store.selectObject(objectId);
                }}
                onObjectMoveStart={(objectId, x, y, modifiers) => {
                  store.beginObjectMove(objectId, x, y, modifiers);
                }}
                onObjectMove={(x, y, modifiers) => {
                  store.updateObjectMove(x, y, modifiers);
                }}
                onObjectMoveEnd={() => {
                  store.endObjectMove();
                }}
                onObjectResizeStart={(objectId, handle, x, y, modifiers) => {
                  store.beginObjectResize(objectId, handle, x, y, modifiers);
                }}
                onObjectResize={(x, y, modifiers) => {
                  store.updateObjectResize(x, y, modifiers);
                }}
                onObjectResizeEnd={() => {
                  store.endObjectResize();
                }}
              />
            </div>
          </main>

          <aside className="grid min-h-0 grid-rows-[minmax(260px,0.9fr)_minmax(360px,1.1fr)] gap-3">
            <DockStack
              activeTab={upperRightDockTab}
              bodyClassName="min-h-0 flex-1 bg-slate-900/95"
              tabs={upperRightDockTabs}
              onTabChange={setUpperRightDockTab}
            >
              <div className="min-h-0 h-full overflow-y-auto">{upperRightDockContent}</div>
            </DockStack>

            <DockStack
              activeTab={lowerRightDockTab}
              bodyClassName="min-h-0 flex-1 bg-slate-900/95"
              tabPosition="bottom"
              tabs={lowerRightDockTabs}
              onTabChange={setLowerRightDockTab}
            >
              <div className="min-h-0 h-full overflow-y-auto">{lowerRightDockContent}</div>
            </DockStack>
          </aside>
        </div>

        {shellDialogsViewState.issuesPanelOpen ? (
          <IssuesPanel
            viewState={issuesPanelViewState}
            onClear={() => {
              startTransition(() => {
                store.clearIssues();
              });
            }}
            onClose={() => {
              startTransition(() => {
                store.closeIssuesPanel();
              });
            }}
          />
        ) : null}

        <EditorStatusBar
          statusInfo={statusInfo}
          viewState={statusBarViewState}
          onToggleIssues={() => {
            startTransition(() => {
              store.toggleIssuesPanel();
            });
          }}
          onLayerChange={(layerId) => {
            startTransition(() => {
              store.setActiveLayer(layerId);
            });
          }}
          onZoomChange={(zoom) => {
            startTransition(() => {
              store.setViewportZoom(zoom);
            });
          }}
        />
        {tileAnimationEditorOpen && tileAnimationEditorViewState ? (
          <TileAnimationEditorDialog
            store={store}
            viewState={tileAnimationEditorViewState}
            onClose={() => {
              setTileAnimationEditorOpen(false);
            }}
          />
        ) : null}
        {customTypesEditorOpen ? (
          <ProjectPropertyTypesEditorDialog
            propertyTypes={shellDialogsViewState.projectPropertyTypes}
            store={store}
            onClose={() => {
              setCustomTypesEditorOpen(false);
            }}
          />
        ) : null}
        {projectPropertiesOpen ? (
          <ProjectPropertiesDialog
            project={shellDialogsViewState.project}
            store={store}
            onClose={() => {
              setProjectPropertiesOpen(false);
            }}
          />
        ) : null}
        {tileCollisionEditorOpen && tileCollisionEditorViewState ? (
          <TileCollisionEditorDialog
            renderBridge={renderBridge}
            store={store}
            viewState={tileCollisionEditorViewState}
            onClose={() => {
              setTileCollisionEditorOpen(false);
            }}
          />
        ) : null}
        {saveTemplateDialogOpen && activeObject ? (
          <SaveTemplateDialog
            objectName={activeObject.name}
            store={store}
            onClose={() => {
              setSaveTemplateDialogOpen(false);
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
