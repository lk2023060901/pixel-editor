"use client";

import type { EditorController } from "@pixel-editor/app-services";
import { getObjectById } from "@pixel-editor/domain";
import { useI18n } from "@pixel-editor/i18n/client";
import { startTransition, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { LayersPanel } from "./layers-panel";
import { DockPanel } from "./dock-panel";
import { MiniMapPanel } from "./mini-map-panel";
import { DockStack, type DockStackTab } from "./dock-stack";
import { ObjectsPanel } from "./objects-panel";
import { PropertiesInspector } from "./properties-inspector";
import { ProjectDock } from "./project-dock";
import { RendererCanvas } from "./renderer-canvas";
import { EditorStatusBar } from "./editor-status-bar";
import { TerrainSetsPanel } from "./terrain-sets-panel";
import {
  getTiledMainMenus,
  getTiledMainToolbarActions,
  getTiledNewMenuItems,
  getTiledToolOptionItems,
  getTiledToolToolbarItems,
  toolbarIconUrls,
  type TiledMenuItemSpec2,
  type ToolbarActionSpec
} from "./toolbar-spec";
import { TileAnimationEditorDialog } from "./tile-animation-editor-dialog";
import { TileCollisionEditorDialog } from "./tile-collision-editor-dialog";
import { TilesetsPanel } from "./tilesets-panel";

export interface EditorShellProps {
  store: EditorController;
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

export function EditorShell({ store }: EditorShellProps) {
  const { t } = useI18n();
  const [upperRightDockTab, setUpperRightDockTab] = useState<UpperRightDockTabId>("layers");
  const [lowerRightDockTab, setLowerRightDockTab] = useState<LowerRightDockTabId>("tilesets");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const [tileAnimationEditorOpen, setTileAnimationEditorOpen] = useState(false);
  const [tileCollisionEditorOpen, setTileCollisionEditorOpen] = useState(false);
  const [statusInfo, setStatusInfo] = useState("");
  const menuBarRef = useRef<HTMLDivElement | null>(null);
  const snapshot = useSyncExternalStore(
    store.subscribe.bind(store),
    store.getSnapshot.bind(store),
    store.getSnapshot.bind(store)
  );
  const activeMap = snapshot.activeMap;
  const activeLayer = snapshot.activeLayer;
  const activeObjectLayer = activeLayer?.kind === "object" ? activeLayer : undefined;
  const selectedObjectId =
    snapshot.workspace.session.selection.kind === "object"
      ? snapshot.workspace.session.selection.objectIds[0]
      : undefined;
  const activeObject =
    activeObjectLayer && selectedObjectId
      ? getObjectById(activeObjectLayer, selectedObjectId)
      : undefined;
  const activeStamp = snapshot.workspace.session.activeStamp;
  const activeDocument =
    snapshot.bootstrap.documents.find(
      (document) => document.id === snapshot.bootstrap.activeDocumentId
    ) ?? snapshot.bootstrap.documents[0];
  const activeLayerIndex =
    activeMap?.layers.findIndex((layer) => layer.id === snapshot.workspace.session.activeLayerId) ?? -1;
  const activeTool = snapshot.workspace.session.activeTool;
  const toolOptionItems = getTiledToolOptionItems(
    {
      activeTool,
      shapeFillMode: snapshot.workspace.session.shapeFillMode
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
  const issueSummary = {
    errorCount: 0,
    warningCount: 0
  };
  const menuSpecs = getTiledMainMenus(
    {
      activeDocumentKind: activeDocument?.kind,
      canUndo: snapshot.canUndo,
      canRedo: snapshot.canRedo,
      showGrid: snapshot.bootstrap.viewport.showGrid,
      hasActiveMap: Boolean(activeMap),
      hasActiveLayer: Boolean(snapshot.workspace.session.activeLayerId),
      canMoveLayerUp: Boolean(activeMap && activeLayerIndex > 0),
      canMoveLayerDown: Boolean(
        activeMap &&
          activeLayerIndex >= 0 &&
          activeLayerIndex < activeMap.layers.length - 1
      )
    },
    t
  );

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

  function handleToolbarAction(action: ToolbarActionSpec): void {
    if (!action.implemented) {
      return;
    }

    const toolId = action.editorToolId;

    if (toolId !== undefined) {
      startTransition(() => {
        store.setActiveTool(toolId);
      });
      return;
    }

    switch (action.id) {
      case "new":
        startTransition(() => {
          store.createQuickMapDocument();
        });
        return;
      case "undo":
        startTransition(() => {
          store.undo();
        });
        return;
      case "redo":
        startTransition(() => {
          store.redo();
        });
        return;
      case "shape-fill-rectangle":
        startTransition(() => {
          store.setShapeFillMode("rectangle");
        });
        return;
      case "shape-fill-ellipse":
        startTransition(() => {
          store.setShapeFillMode("ellipse");
        });
        return;
      default:
        return;
    }
  }

  function handleNewMenuItem(menuItemId: string): void {
    setNewMenuOpen(false);

    if (menuItemId !== "new-map") {
      return;
    }

    startTransition(() => {
      store.createQuickMapDocument();
    });
  }

  function handleMenuAction(actionId: string): void {
    switch (actionId) {
      case "new-map":
        handleNewMenuItem("new-map");
        return;
      case "undo":
        startTransition(() => {
          store.undo();
        });
        return;
      case "redo":
        startTransition(() => {
          store.redo();
        });
        return;
      case "show-grid":
        startTransition(() => {
          store.toggleGrid();
        });
        return;
      case "zoom-in":
        startTransition(() => {
          store.zoomIn();
        });
        return;
      case "zoom-out":
        startTransition(() => {
          store.zoomOut();
        });
        return;
      case "zoom-normal":
        startTransition(() => {
          store.setViewportZoom(1);
        });
        return;
      case "add-tile-layer":
        startTransition(() => {
          store.addTileLayer();
        });
        return;
      case "add-object-layer":
        startTransition(() => {
          store.addObjectLayer();
        });
        return;
      case "remove-layers":
        startTransition(() => {
          store.removeActiveLayer();
        });
        return;
      case "raise-layers":
        startTransition(() => {
          store.moveActiveLayer("up");
        });
        return;
      case "lower-layers":
        startTransition(() => {
          store.moveActiveLayer("down");
        });
        return;
      case "tile-animation-editor":
        setTileAnimationEditorOpen(true);
        return;
      case "edit-collision":
        setTileCollisionEditorOpen(true);
        return;
      case "edit-wang-sets":
        setLowerRightDockTab("terrain-sets");
        return;
      default:
        return;
    }
  }

  let upperRightDockContent = (
    <LayersPanel
      embedded
      activeMap={activeMap}
      activeLayerId={snapshot.workspace.session.activeLayerId}
      store={store}
    />
  );

  if (upperRightDockTab === "objects") {
    upperRightDockContent = (
      <ObjectsPanel
        embedded
        activeLayer={activeObjectLayer}
        clipboard={snapshot.runtime.clipboard}
        selection={snapshot.workspace.session.selection}
        store={store}
      />
    );
  } else if (upperRightDockTab === "mini-map") {
    upperRightDockContent = (
      <MiniMapPanel
        embedded
        activeMap={activeMap}
        viewportOriginX={snapshot.bootstrap.viewport.originX}
        viewportOriginY={snapshot.bootstrap.viewport.originY}
        viewportZoom={snapshot.bootstrap.viewport.zoom}
      />
    );
  }

  const lowerRightDockContent =
    lowerRightDockTab === "terrain-sets" ? (
      <TerrainSetsPanel
        embedded
        activeMap={activeMap}
        activeTilesetId={snapshot.workspace.session.activeTilesetId}
        store={store}
        tilesets={snapshot.workspace.tilesets}
      />
    ) : (
      <TilesetsPanel
        embedded
        activeMap={activeMap}
        tilesets={snapshot.workspace.tilesets}
        activeTilesetId={snapshot.workspace.session.activeTilesetId}
        activeTileLocalId={snapshot.workspace.session.activeTilesetTileLocalId}
        activeStamp={activeStamp}
        onOpenTileAnimationEditor={() => {
          setTileAnimationEditorOpen(true);
        }}
        onOpenTileCollisionEditor={() => {
          setTileCollisionEditorOpen(true);
        }}
        onOpenTerrainSets={() => {
          setLowerRightDockTab("terrain-sets");
        }}
        propertyTypes={snapshot.workspace.project.propertyTypes}
        store={store}
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
                  (action.id === "undo" && !snapshot.canUndo) ||
                  (action.id === "redo" && !snapshot.canRedo)
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
                  active={item.action.editorToolId === activeTool}
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
                  active={
                    (item.action.id === "shape-fill-rectangle" &&
                      snapshot.workspace.session.shapeFillMode === "rectangle") ||
                    (item.action.id === "shape-fill-ellipse" &&
                      snapshot.workspace.session.shapeFillMode === "ellipse")
                  }
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
            activeDocumentId={snapshot.bootstrap.activeDocumentId}
            documents={snapshot.bootstrap.documents.map((document) => ({
              id: document.id,
              kind: document.kind,
              name: document.name
            }))}
            onDocumentActivate={(documentId) => {
              const document = snapshot.bootstrap.documents.find((item) => item.id === documentId);

              if (document?.kind !== "map") {
                return;
              }

              store.setActiveMap(document.id);
            }}
          />

          <DockPanel
            title={t("shell.dock.properties")}
            bodyClassName="min-h-0 flex-1 overflow-y-auto"
          >
            <PropertiesInspector
              embedded
              activeLayer={activeLayer}
              activeMap={activeMap}
              activeObject={activeObject}
              propertyTypes={snapshot.workspace.project.propertyTypes}
              store={store}
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
                snapshot={snapshot}
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

        <EditorStatusBar
          activeLayerId={snapshot.workspace.session.activeLayerId}
          activeLayerKind={activeLayer?.kind}
          errorCount={issueSummary.errorCount}
          layers={activeMap?.layers ?? []}
          statusInfo={statusInfo}
          warningCount={issueSummary.warningCount}
          zoom={snapshot.bootstrap.viewport.zoom}
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
        {tileAnimationEditorOpen && snapshot.activeTileset ? (
          <TileAnimationEditorDialog
            selectedLocalId={snapshot.workspace.session.activeTilesetTileLocalId}
            store={store}
            tileset={snapshot.activeTileset}
            onClose={() => {
              setTileAnimationEditorOpen(false);
            }}
          />
        ) : null}
        {tileCollisionEditorOpen && snapshot.activeTileset ? (
          <TileCollisionEditorDialog
            propertyTypes={snapshot.workspace.project.propertyTypes}
            selectedLocalId={snapshot.workspace.session.activeTilesetTileLocalId}
            store={store}
            tileset={snapshot.activeTileset}
            onClose={() => {
              setTileCollisionEditorOpen(false);
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
