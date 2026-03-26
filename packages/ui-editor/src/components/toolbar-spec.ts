import type { TranslationFn } from "@pixel-editor/i18n";
import type { EditorToolId, ShapeFillMode } from "@pixel-editor/editor-state";

export type ToolbarIconId =
  | "document-new"
  | "document-open"
  | "document-save"
  | "edit-undo"
  | "edit-redo"
  | "system-run"
  | "stamp-brush"
  | "terrain-brush"
  | "bucket-fill"
  | "shape-fill"
  | "eraser"
  | "tile-select"
  | "magic-wand"
  | "object-select"
  | "edit-polygons"
  | "insert-rectangle"
  | "insert-point"
  | "insert-ellipse"
  | "insert-capsule"
  | "insert-polygon"
  | "insert-tile"
  | "insert-template"
  | "insert-text"
  | "world-tool"
  | "layer-offset"
  | "random-mode"
  | "terrain-fill-mode"
  | "flip-horizontal"
  | "flip-vertical"
  | "rotate-left"
  | "rotate-right"
  | "selection-replace"
  | "selection-add"
  | "selection-subtract"
  | "selection-intersect"
  | "select-touch"
  | "select-enclose"
  | "ellipse-fill";

export interface ToolbarActionSpec {
  id: string;
  label: string;
  icon: ToolbarIconId;
  implemented: boolean;
  editorToolId?: EditorToolId;
}

export interface ToolbarSeparatorSpec {
  kind: "separator";
}

export interface ToolbarButtonSpec {
  kind: "button";
  action: ToolbarActionSpec;
}

export type ToolbarItemSpec = ToolbarSeparatorSpec | ToolbarButtonSpec;

export interface ToolbarMenuItemSpec {
  id: string;
  label: string;
  implemented: boolean;
}

export type TiledMenuDocumentKind = "map" | "tileset" | "template" | "world";

export interface TiledMenuActionSpec {
  kind: "action";
  id: string;
  label: string;
  implemented: boolean;
  disabled?: boolean;
  checked?: boolean;
  shortcut?: string;
}

export interface TiledMenuSeparatorSpec {
  kind: "separator";
}

export interface TiledSubmenuSpec {
  kind: "submenu";
  id: string;
  label: string;
  items: TiledMenuItemSpec2[];
}

export type TiledMenuItemSpec2 =
  | TiledMenuActionSpec
  | TiledMenuSeparatorSpec
  | TiledSubmenuSpec;

export interface TiledMenuSpec {
  id: string;
  label: string;
  items: TiledMenuItemSpec2[];
}

export const toolbarIconUrls: Record<ToolbarIconId, string> = {
  "document-new": "/vendor/tiled-toolbar/document-new.png",
  "document-open": "/vendor/tiled-toolbar/document-open.png",
  "document-save": "/vendor/tiled-toolbar/document-save.png",
  "edit-undo": "/vendor/tiled-toolbar/edit-undo.png",
  "edit-redo": "/vendor/tiled-toolbar/edit-redo.png",
  "system-run": "/vendor/tiled-toolbar/system-run.png",
  "stamp-brush": "/vendor/tiled-toolbar/stamp-brush.png",
  "terrain-brush": "/vendor/tiled-toolbar/terrain-brush.png",
  "bucket-fill": "/vendor/tiled-toolbar/bucket-fill.png",
  "shape-fill": "/vendor/tiled-toolbar/shape-fill.png",
  eraser: "/vendor/tiled-toolbar/eraser.png",
  "tile-select": "/vendor/tiled-toolbar/tile-select.png",
  "magic-wand": "/vendor/tiled-toolbar/magic-wand.png",
  "object-select": "/vendor/tiled-toolbar/object-select.png",
  "edit-polygons": "/vendor/tiled-toolbar/edit-polygons.png",
  "insert-rectangle": "/vendor/tiled-toolbar/insert-rectangle.png",
  "insert-point": "/vendor/tiled-toolbar/insert-point.png",
  "insert-ellipse": "/vendor/tiled-toolbar/insert-ellipse.png",
  "insert-capsule": "/vendor/tiled-toolbar/insert-capsule.png",
  "insert-polygon": "/vendor/tiled-toolbar/insert-polygon.png",
  "insert-tile": "/vendor/tiled-toolbar/insert-tile.png",
  "insert-template": "/vendor/tiled-toolbar/insert-template.png",
  "insert-text": "/vendor/tiled-toolbar/insert-text.png",
  "world-tool": "/vendor/tiled-toolbar/world-tool.png",
  "layer-offset": "/vendor/tiled-toolbar/layer-offset.png",
  "random-mode": "/vendor/tiled-toolbar/random-mode.png",
  "terrain-fill-mode": "/vendor/tiled-toolbar/terrain-fill-mode.png",
  "flip-horizontal": "/vendor/tiled-toolbar/flip-horizontal.png",
  "flip-vertical": "/vendor/tiled-toolbar/flip-vertical.png",
  "rotate-left": "/vendor/tiled-toolbar/rotate-left.png",
  "rotate-right": "/vendor/tiled-toolbar/rotate-right.png",
  "selection-replace": "/vendor/tiled-toolbar/selection-replace.png",
  "selection-add": "/vendor/tiled-toolbar/selection-add.png",
  "selection-subtract": "/vendor/tiled-toolbar/selection-subtract.png",
  "selection-intersect": "/vendor/tiled-toolbar/selection-intersect.png",
  "select-touch": "/vendor/tiled-toolbar/select-touch.svg",
  "select-enclose": "/vendor/tiled-toolbar/select-enclose.svg",
  "ellipse-fill": "/vendor/tiled-toolbar/ellipse-fill.png"
};

export interface TiledMenuContext {
  activeDocumentKind: TiledMenuDocumentKind | undefined;
  canUndo: boolean;
  canRedo: boolean;
  canSaveActiveDocument: boolean;
  canSaveAllDocuments: boolean;
  canExportActiveDocument: boolean;
  canExportActiveMapImage: boolean;
  showGrid: boolean;
  showWorlds: boolean;
  autoMapWhileDrawing: boolean;
  hasProject: boolean;
  hasActiveMap: boolean;
  hasAutomappingRulesFile: boolean;
  hasActiveLayer: boolean;
  hasWorldContext: boolean;
  canMoveWorldMaps: boolean;
  canMoveLayerUp: boolean;
  canMoveLayerDown: boolean;
  customTypesEditorOpen: boolean;
}

function menuAction(
  id: string,
  label: string,
  options: Partial<Omit<TiledMenuActionSpec, "kind" | "id" | "label">> = {}
): TiledMenuActionSpec {
  return {
    kind: "action",
    id,
    label,
    implemented: false,
    ...options
  };
}

function menuSubmenu(id: string, label: string, items: TiledMenuItemSpec2[]): TiledSubmenuSpec {
  return {
    kind: "submenu",
    id,
    label,
    items
  };
}

const menuSeparator: TiledMenuSeparatorSpec = {
  kind: "separator"
};

export function getTiledMainMenus(
  context: TiledMenuContext,
  t: TranslationFn
): TiledMenuSpec[] {
  const fileMenu: TiledMenuSpec = {
    id: "file",
    label: t("menu.file"),
    items: [
      menuSubmenu("file-new", t("menu.new"), [
        menuAction("new-project", t("action.newProject"), {
          implemented: false,
          shortcut: "Ctrl+Shift+N"
        }),
        menuSeparator,
        menuAction("new-map", t("action.newMap"), { implemented: true }),
        menuAction("new-tileset", t("action.newTileset"), { implemented: false })
      ]),
      menuAction("open", t("action.openFileOrProject"), { implemented: false }),
      menuAction("open-file-in-project", t("action.openFileInProject"), {
        implemented: false,
        shortcut: "Ctrl+P"
      }),
      menuSubmenu("recent-files", t("menu.recentFiles"), [
        menuAction("reopen-closed-file", t("action.reopenClosedFile"), {
          implemented: false,
          shortcut: "Ctrl+Shift+T"
        }),
        menuSeparator,
        menuAction("clear-recent-files", t("action.clearRecentFiles"), { implemented: false })
      ]),
      menuSubmenu("recent-projects", t("menu.recentProjects"), [
        menuAction("clear-recent-projects", t("action.clearRecentProjects"), {
          implemented: false
        })
      ]),
      menuSeparator,
      menuAction("save", t("action.save"), {
        implemented: true,
        disabled: !context.canSaveActiveDocument
      }),
      menuAction("save-as", t("action.saveAs"), {
        implemented: false,
        shortcut: "Ctrl+Shift+S"
      }),
      menuAction("save-all", t("action.saveAll"), {
        implemented: true,
        disabled: !context.canSaveAllDocuments
      }),
      menuAction("export", t("action.export"), {
        implemented: true,
        disabled: !context.canExportActiveDocument,
        shortcut: "Ctrl+E"
      }),
      menuAction("export-as", t("action.exportAs"), {
        implemented: false,
        shortcut: "Ctrl+Shift+E"
      }),
      menuAction("export-as-image", t("action.exportAsImage"), {
        implemented: true,
        disabled: !context.canExportActiveMapImage
      }),
      menuAction("reload", t("action.reload"), {
        implemented: false,
        shortcut: "Ctrl+R"
      }),
      menuSeparator,
      menuSubmenu("commands", t("menu.commands"), [
        menuAction("edit-commands", t("action.editCommands"), { implemented: false })
      ]),
      menuSeparator,
      menuAction("close", t("action.close"), { implemented: false }),
      menuAction("close-all", t("action.closeAll"), {
        implemented: false,
        shortcut: "Ctrl+Shift+W"
      }),
      menuAction("close-project", t("action.closeProject"), { implemented: false }),
      menuAction("quit", t("action.quit"), { implemented: false })
    ]
  };

  const editMenu: TiledMenuSpec = {
    id: "edit",
    label: t("menu.edit"),
    items: [
      menuAction("undo", t("action.undo"), {
        implemented: true,
        disabled: !context.canUndo
      }),
      menuAction("redo", t("action.redo"), {
        implemented: true,
        disabled: !context.canRedo
      }),
      menuSeparator,
      menuAction("cut", t("action.cut"), { implemented: false }),
      menuAction("copy", t("action.copy"), { implemented: false }),
      menuAction("paste", t("action.paste"), { implemented: false }),
      menuAction("paste-in-place", t("action.pasteInPlace"), {
        implemented: false,
        shortcut: "Ctrl+Shift+V"
      }),
      menuAction("delete", t("action.delete"), { implemented: false }),
      menuSeparator,
      menuAction("select-all", t("action.selectAll"), {
        implemented: false,
        shortcut: "Ctrl+A"
      }),
      menuAction("invert-selection", t("action.invertSelection"), {
        implemented: false,
        shortcut: "Ctrl+I"
      }),
      menuAction("select-none", t("action.selectNone"), {
        implemented: false,
        shortcut: "Ctrl+Shift+A"
      }),
      menuSeparator,
      menuAction("preferences", t("action.preferences"), { implemented: false })
    ]
  };

  const viewMenu: TiledMenuSpec = {
    id: "view",
    label: t("menu.view"),
    items: [
      menuAction("search-actions", t("action.searchActions"), { implemented: false }),
      menuAction("custom-types-editor", t("action.customTypesEditor"), {
        implemented: context.hasProject,
        checked: context.customTypesEditorOpen
      }),
      menuSeparator,
      menuAction("show-grid", t("action.showGrid"), {
        implemented: true,
        checked: context.showGrid,
        shortcut: "Ctrl+G"
      }),
      menuAction("show-tile-object-outlines", t("action.showTileObjectOutlines"), {
        implemented: false
      }),
      menuAction("show-object-references", t("action.showObjectReferences"), {
        implemented: false
      }),
      menuSubmenu("show-object-names", t("menu.showObjectNames"), [
        menuAction("show-object-names-none", t("action.showObjectNamesNever"), {
          implemented: false,
          checked: false
        }),
        menuAction("show-object-names-selected", t("action.showObjectNamesSelected"), {
          implemented: false,
          checked: true
        }),
        menuAction("show-object-names-all", t("action.showObjectNamesAll"), {
          implemented: false,
          checked: false
        }),
        menuSeparator,
        menuAction("show-object-names-hovered", t("action.showObjectNamesHovered"), {
          implemented: false,
          checked: false
        })
      ]),
      menuAction("show-tile-animations", t("action.showTileAnimations"), { implemented: false }),
      menuAction("show-tile-collision-shapes", t("action.showTileCollisionShapes"), {
        implemented: false
      }),
      menuAction("enable-worlds", t("action.showWorld"), {
        implemented: context.hasWorldContext,
        checked: context.showWorlds
      }),
      menuAction("enable-parallax", t("action.enableParallax"), { implemented: false }),
      menuAction("highlight-current-layer", t("action.highlightCurrentLayer"), {
        implemented: false,
        shortcut: "H"
      }),
      menuAction("highlight-hovered-object", t("action.highlightHoveredObject"), {
        implemented: false
      }),
      menuSeparator,
      menuSubmenu("snapping", t("menu.snapping"), [
        menuAction("snap-nothing", t("action.noSnapping"), {
          implemented: false,
          checked: true
        }),
        menuAction("snap-to-grid", t("action.snapToGrid"), { implemented: false }),
        menuAction("snap-to-fine-grid", t("action.snapToFineGrid"), { implemented: false }),
        menuAction("snap-to-pixels", t("action.snapToPixels"), { implemented: false })
      ]),
      menuSeparator,
      menuAction("zoom-in", t("action.zoomIn"), { implemented: true }),
      menuAction("zoom-out", t("action.zoomOut"), { implemented: true }),
      menuAction("zoom-normal", t("action.normalSize"), {
        implemented: true,
        shortcut: "Ctrl+0"
      }),
      menuAction("fit-in-view", t("action.fitMapInView"), {
        implemented: false,
        shortcut: "Ctrl+/"
      }),
      menuSeparator,
      menuAction("full-screen", t("action.fullScreen"), {
        implemented: false,
        shortcut: "F11"
      }),
      menuAction("clear-view", t("action.clearView"), {
        implemented: false,
        shortcut: "Tab"
      })
    ]
  };

  const worldMenu: TiledMenuSpec = {
    id: "world",
    label: t("menu.world"),
    items: [
      menuAction("new-world", t("action.newWorld"), { implemented: false }),
      menuAction("load-world", t("action.loadWorld"), { implemented: false }),
      menuSeparator,
      menuSubmenu("unload-world", t("menu.unloadWorld"), [
        menuAction("unload-all-worlds", t("action.unloadAllWorlds"), { implemented: false })
      ]),
      menuSubmenu("save-world", t("menu.saveWorld"), []),
      menuSeparator,
      menuAction("world-properties", t("action.worldProperties"), { implemented: false })
    ]
  };

  const mapMenu: TiledMenuSpec = {
    id: "map",
    label: t("menu.map"),
    items: [
      menuAction("add-external-tileset", t("action.addExternalTileset"), { implemented: false }),
      menuAction("add-automapping-rules-tileset", t("action.addAutomappingRulesTileset"), {
        implemented: false
      }),
      menuSeparator,
      menuAction("resize-map", t("action.resizeMap"), { implemented: false }),
      menuAction("crop-to-selection", t("action.cropToSelection"), { implemented: false }),
      menuAction("autocrop", t("action.autocrop"), { implemented: false }),
      menuAction("offset-map", t("action.offsetMap"), { implemented: false }),
      menuSeparator,
      menuAction("auto-map", t("action.autoMap"), {
        implemented: context.hasActiveMap,
        disabled: !context.hasAutomappingRulesFile,
        shortcut: "Ctrl+M"
      }),
      menuAction("auto-map-while-drawing", t("action.autoMapWhileDrawing"), {
        implemented: context.hasActiveMap,
        disabled: !context.hasAutomappingRulesFile,
        checked: context.autoMapWhileDrawing
      }),
      menuSeparator,
      menuAction("select-previous-tileset", t("action.selectPreviousTileset"), {
        implemented: false
      }),
      menuAction("select-next-tileset", t("action.selectNextTileset"), {
        implemented: false
      }),
      menuSeparator,
      menuAction("go-to-tile", t("action.goToTile"), {
        implemented: false,
        shortcut: "Ctrl+Shift+G"
      }),
      menuSeparator,
      menuAction("map-properties", t("action.mapProperties"), { implemented: false })
    ]
  };

  const layerMenu: TiledMenuSpec = {
    id: "layer",
    label: t("menu.layer"),
    items: [
      menuSubmenu("new-layer", t("menu.new"), [
        menuAction("add-tile-layer", t("action.addTileLayer"), {
          implemented: true,
          disabled: !context.hasActiveMap
        }),
        menuAction("add-object-layer", t("action.addObjectLayer"), {
          implemented: true,
          disabled: !context.hasActiveMap
        }),
        menuAction("add-image-layer", t("action.addImageLayer"), { implemented: false }),
        menuAction("add-group-layer", t("action.addGroupLayer"), { implemented: false }),
        menuSeparator,
        menuAction("layer-via-copy", t("action.layerViaCopy"), {
          implemented: false,
          shortcut: "Ctrl+J"
        }),
        menuAction("layer-via-cut", t("action.layerViaCut"), {
          implemented: false,
          shortcut: "Ctrl+Shift+J"
        })
      ]),
      menuSubmenu("group-layer", t("menu.layerGroup"), [
        menuAction("group-layers", t("action.groupLayers"), { implemented: false }),
        menuAction("ungroup-layers", t("action.ungroupLayers"), { implemented: false })
      ]),
      menuAction("duplicate-layers", t("action.duplicateLayers"), {
        implemented: false,
        shortcut: "Ctrl+Shift+D"
      }),
      menuAction("merge-layer-down", t("action.mergeLayerDown"), { implemented: false }),
      menuAction("remove-layers", t("action.removeLayers"), {
        implemented: true,
        disabled: !context.hasActiveLayer
      }),
      menuSeparator,
      menuAction("select-previous-layer", t("action.selectPreviousLayer"), {
        implemented: false,
        shortcut: "Ctrl+PageDown"
      }),
      menuAction("select-next-layer", t("action.selectNextLayer"), {
        implemented: false,
        shortcut: "Ctrl+PageUp"
      }),
      menuAction("select-all-layers", t("action.selectAllLayers"), {
        implemented: false,
        shortcut: "Ctrl+Alt+A"
      }),
      menuAction("raise-layers", t("action.raiseLayers"), {
        implemented: true,
        disabled: !context.canMoveLayerUp,
        shortcut: "Ctrl+Shift+Up"
      }),
      menuAction("lower-layers", t("action.lowerLayers"), {
        implemented: true,
        disabled: !context.canMoveLayerDown,
        shortcut: "Ctrl+Shift+Down"
      }),
      menuSeparator,
      menuAction("show-hide-layers", t("action.showHideLayers"), {
        implemented: false,
        shortcut: "Ctrl+H"
      }),
      menuAction("lock-unlock-layers", t("action.lockUnlockLayers"), {
        implemented: false,
        shortcut: "Ctrl+L"
      }),
      menuAction("show-hide-other-layers", t("action.showHideOtherLayers"), {
        implemented: false,
        shortcut: "Ctrl+Shift+H"
      }),
      menuAction("lock-unlock-other-layers", t("action.lockUnlockOtherLayers"), {
        implemented: false,
        shortcut: "Ctrl+Shift+L"
      }),
      menuSeparator,
      menuAction("layer-properties", t("action.layerProperties"), { implemented: false })
    ]
  };

  const tilesetMenu: TiledMenuSpec = {
    id: "tileset",
    label: t("menu.tileset"),
    items: [
      menuAction("tile-animation-editor", t("action.tileAnimationEditor"), { implemented: true }),
      menuAction("rearrange-tiles", t("action.rearrangeTiles"), { implemented: false }),
      menuAction("edit-collision", t("action.editCollision"), { implemented: true }),
      menuAction("edit-wang-sets", t("action.editWangSets"), { implemented: true }),
      menuSeparator,
      menuAction("add-tiles", t("action.addTiles"), { implemented: false }),
      menuAction("remove-tiles", t("action.removeTiles"), { implemented: false }),
      menuSeparator,
      menuAction("edit-tileset-image-parameters", t("action.editTilesetImageParameters"), {
        implemented: false
      }),
      menuSeparator,
      menuAction("tileset-properties", t("action.tilesetProperties"), { implemented: false })
    ]
  };

  const projectMenu: TiledMenuSpec = {
    id: "project",
    label: t("menu.project"),
    items: [
      menuAction("add-folder-to-project", t("action.addFolderToProject"), {
        implemented: false
      }),
      menuAction("refresh-project-folders", t("action.refreshFolders"), { implemented: false }),
      menuSeparator,
      menuAction("project-properties", t("action.projectProperties"), {
        implemented: context.hasProject
      })
    ]
  };

  const helpMenu: TiledMenuSpec = {
    id: "help",
    label: t("menu.help"),
    items: [
      menuAction("documentation", t("action.userManual"), { implemented: false }),
      menuAction("forum", t("action.communityForum"), { implemented: false }),
      menuSeparator,
      menuAction("donate", t("action.supportTiledDevelopment"), { implemented: false }),
      menuAction("about", t("action.aboutTiled"), { implemented: false })
    ]
  };

  if (context.activeDocumentKind === "tileset") {
    return [fileMenu, editMenu, viewMenu, tilesetMenu, projectMenu, helpMenu];
  }

  if (context.activeDocumentKind === "map" || context.activeDocumentKind === undefined) {
    return [fileMenu, editMenu, viewMenu, worldMenu, mapMenu, layerMenu, projectMenu, helpMenu];
  }

  return [fileMenu, editMenu, viewMenu, projectMenu, helpMenu];
}

export function getTiledNewMenuItems(t: TranslationFn): ToolbarMenuItemSpec[] {
  return [
    {
      id: "new-map",
      label: t("action.newMap"),
      implemented: true
    },
    {
      id: "new-tileset",
      label: t("action.newTileset"),
      implemented: false
    }
  ];
}

export function getTiledMainToolbarActions(t: TranslationFn): ToolbarActionSpec[] {
  return [
    {
      id: "new",
      label: t("menu.new"),
      icon: "document-new",
      implemented: true
    },
    {
      id: "open",
      label: t("action.openFileOrProject"),
      icon: "document-open",
      implemented: false
    },
    {
      id: "save",
      label: t("action.save"),
      icon: "document-save",
      implemented: true
    },
    {
      id: "undo",
      label: t("action.undo"),
      icon: "edit-undo",
      implemented: true
    },
    {
      id: "redo",
      label: t("action.redo"),
      icon: "edit-redo",
      implemented: true
    },
    {
      id: "command",
      label: t("action.executeCommand"),
      icon: "system-run",
      implemented: false
    }
  ];
}

export function getTiledToolToolbarItems(t: TranslationFn): ToolbarItemSpec[] {
  return [
    {
      kind: "button",
      action: {
        id: "stamp",
        label: t("action.stampBrush"),
        icon: "stamp-brush",
        implemented: true,
        editorToolId: "stamp"
      }
    },
    {
      kind: "button",
      action: {
        id: "terrain-brush",
        label: t("action.terrainBrush"),
        icon: "terrain-brush",
        implemented: false
      }
    },
    {
      kind: "button",
      action: {
        id: "bucket-fill",
        label: t("action.bucketFillTool"),
        icon: "bucket-fill",
        implemented: true,
        editorToolId: "bucket-fill"
      }
    },
    {
      kind: "button",
      action: {
        id: "shape-fill",
        label: t("action.shapeFillTool"),
        icon: "shape-fill",
        implemented: true,
        editorToolId: "shape-fill"
      }
    },
    {
      kind: "button",
      action: {
        id: "eraser",
        label: t("action.eraser"),
        icon: "eraser",
        implemented: true,
        editorToolId: "eraser"
      }
    },
    {
      kind: "button",
      action: {
        id: "select",
        label: t("action.rectangularSelect"),
        icon: "tile-select",
        implemented: true,
        editorToolId: "select"
      }
    },
    {
      kind: "button",
      action: {
        id: "magic-wand",
        label: t("action.magicWand"),
        icon: "magic-wand",
        implemented: false
      }
    },
    {
      kind: "button",
      action: {
        id: "select-same",
        label: t("action.selectSameTile"),
        icon: "magic-wand",
        implemented: false
      }
    },
    {
      kind: "separator"
    },
    {
      kind: "button",
      action: {
        id: "object-select",
        label: t("action.selectObjects"),
        icon: "object-select",
        implemented: true,
        editorToolId: "object-select"
      }
    },
    {
      kind: "button",
      action: {
        id: "edit-polygons",
        label: t("action.editPolygons"),
        icon: "edit-polygons",
        implemented: false
      }
    },
    {
      kind: "button",
      action: {
        id: "insert-rectangle",
        label: t("action.insertRectangle"),
        icon: "insert-rectangle",
        implemented: false
      }
    },
    {
      kind: "button",
      action: {
        id: "insert-point",
        label: t("action.insertPoint"),
        icon: "insert-point",
        implemented: false
      }
    },
    {
      kind: "button",
      action: {
        id: "insert-ellipse",
        label: t("action.insertEllipse"),
        icon: "insert-ellipse",
        implemented: false
      }
    },
    {
      kind: "button",
      action: {
        id: "insert-capsule",
        label: t("action.insertCapsule"),
        icon: "insert-capsule",
        implemented: false
      }
    },
    {
      kind: "button",
      action: {
        id: "insert-polygon",
        label: t("action.insertPolygon"),
        icon: "insert-polygon",
        implemented: false
      }
    },
    {
      kind: "button",
      action: {
        id: "insert-tile",
        label: t("action.insertTile"),
        icon: "insert-tile",
        implemented: false
      }
    },
    {
      kind: "button",
      action: {
        id: "insert-template",
        label: t("action.insertTemplate"),
        icon: "insert-template",
        implemented: false
      }
    },
    {
      kind: "button",
      action: {
        id: "insert-text",
        label: t("action.insertText"),
        icon: "insert-text",
        implemented: false
      }
    },
    {
      kind: "separator"
    },
    {
      kind: "button",
      action: {
        id: "world-tool",
        label: t("action.worldTool"),
        icon: "world-tool",
        implemented: true,
        editorToolId: "world-tool"
      }
    },
    {
      kind: "button",
      action: {
        id: "layer-offset",
        label: t("action.offsetLayers"),
        icon: "layer-offset",
        implemented: false
      }
    }
  ];
}

function button(action: ToolbarActionSpec): ToolbarButtonSpec {
  return {
    kind: "button",
    action
  };
}

export function getTiledToolOptionItems(
  input: {
    activeTool: EditorToolId;
    shapeFillMode: ShapeFillMode;
  },
  t: TranslationFn
): ToolbarItemSpec[] {
  const stampTransformOptions: ToolbarItemSpec[] = [
    button({
      id: "random-mode",
      label: t("action.randomMode"),
      icon: "random-mode",
      implemented: false
    }),
    button({
      id: "terrain-fill-mode",
      label: t("action.terrainFillMode"),
      icon: "terrain-fill-mode",
      implemented: false
    }),
    { kind: "separator" },
    button({
      id: "flip-horizontal",
      label: t("action.flipHorizontally"),
      icon: "flip-horizontal",
      implemented: false
    }),
    button({
      id: "flip-vertical",
      label: t("action.flipVertically"),
      icon: "flip-vertical",
      implemented: false
    }),
    button({
      id: "rotate-left",
      label: t("action.rotateLeft"),
      icon: "rotate-left",
      implemented: false
    }),
    button({
      id: "rotate-right",
      label: t("action.rotateRight"),
      icon: "rotate-right",
      implemented: false
    })
  ];

  if (input.activeTool === "stamp" || input.activeTool === "bucket-fill") {
    return stampTransformOptions;
  }

  if (input.activeTool === "shape-fill") {
    return [
      ...stampTransformOptions,
      { kind: "separator" },
      button({
        id: "shape-fill-rectangle",
        label: t("action.rectangleFill"),
        icon: "shape-fill",
        implemented: true
      }),
      button({
        id: "shape-fill-ellipse",
        label: t("action.circleFill"),
        icon: "ellipse-fill",
        implemented: true
      })
    ];
  }

  if (input.activeTool === "select") {
    return [
      button({
        id: "selection-replace",
        label: t("action.replaceSelection"),
        icon: "selection-replace",
        implemented: false
      }),
      button({
        id: "selection-add",
        label: t("action.addSelection"),
        icon: "selection-add",
        implemented: false
      }),
      button({
        id: "selection-subtract",
        label: t("action.subtractSelection"),
        icon: "selection-subtract",
        implemented: false
      }),
      button({
        id: "selection-intersect",
        label: t("action.intersectSelection"),
        icon: "selection-intersect",
        implemented: false
      })
    ];
  }

  if (input.activeTool === "object-select") {
    return [
      button({
        id: "object-flip-horizontal",
        label: t("action.flipHorizontally"),
        icon: "flip-horizontal",
        implemented: false
      }),
      button({
        id: "object-flip-vertical",
        label: t("action.flipVertically"),
        icon: "flip-vertical",
        implemented: false
      }),
      button({
        id: "object-rotate-left",
        label: t("action.rotateLeft"),
        icon: "rotate-left",
        implemented: false
      }),
      button({
        id: "object-rotate-right",
        label: t("action.rotateRight"),
        icon: "rotate-right",
        implemented: false
      }),
      { kind: "separator" },
      button({
        id: "select-touch",
        label: t("action.selectTouchedObjects"),
        icon: "select-touch",
        implemented: false
      }),
      button({
        id: "select-enclose",
        label: t("action.selectEnclosedObjects"),
        icon: "select-enclose",
        implemented: false
      })
    ];
  }

  return [];
}
