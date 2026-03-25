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
  showGrid: boolean;
  hasActiveMap: boolean;
  hasActiveLayer: boolean;
  canMoveLayerUp: boolean;
  canMoveLayerDown: boolean;
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

export function getTiledMainMenus(context: TiledMenuContext): TiledMenuSpec[] {
  const fileMenu: TiledMenuSpec = {
    id: "file",
    label: "File",
    items: [
      menuSubmenu("file-new", "New", [
        menuAction("new-project", "New Project...", {
          implemented: false,
          shortcut: "Ctrl+Shift+N"
        }),
        menuSeparator,
        menuAction("new-map", "New Map...", { implemented: true }),
        menuAction("new-tileset", "New Tileset...", { implemented: false })
      ]),
      menuAction("open", "Open File or Project...", { implemented: false }),
      menuAction("open-file-in-project", "Open File in Project...", {
        implemented: false,
        shortcut: "Ctrl+P"
      }),
      menuSubmenu("recent-files", "Recent Files", [
        menuAction("reopen-closed-file", "Reopen Closed File", {
          implemented: false,
          shortcut: "Ctrl+Shift+T"
        }),
        menuSeparator,
        menuAction("clear-recent-files", "Clear Recent Files", { implemented: false })
      ]),
      menuSubmenu("recent-projects", "Recent Projects", [
        menuAction("clear-recent-projects", "Clear Recent Projects", { implemented: false })
      ]),
      menuSeparator,
      menuAction("save", "Save", { implemented: false }),
      menuAction("save-as", "Save As...", {
        implemented: false,
        shortcut: "Ctrl+Shift+S"
      }),
      menuAction("save-all", "Save All", { implemented: false }),
      menuAction("export", "Export", {
        implemented: false,
        shortcut: "Ctrl+E"
      }),
      menuAction("export-as", "Export As...", {
        implemented: false,
        shortcut: "Ctrl+Shift+E"
      }),
      menuAction("export-as-image", "Export As Image...", { implemented: false }),
      menuAction("reload", "Reload", {
        implemented: false,
        shortcut: "Ctrl+R"
      }),
      menuSeparator,
      menuSubmenu("commands", "Commands", [
        menuAction("edit-commands", "Edit Commands...", { implemented: false })
      ]),
      menuSeparator,
      menuAction("close", "Close", { implemented: false }),
      menuAction("close-all", "Close All", {
        implemented: false,
        shortcut: "Ctrl+Shift+W"
      }),
      menuAction("close-project", "Close Project", { implemented: false }),
      menuAction("quit", "Quit", { implemented: false })
    ]
  };

  const editMenu: TiledMenuSpec = {
    id: "edit",
    label: "Edit",
    items: [
      menuAction("undo", "Undo", {
        implemented: true,
        disabled: !context.canUndo
      }),
      menuAction("redo", "Redo", {
        implemented: true,
        disabled: !context.canRedo
      }),
      menuSeparator,
      menuAction("cut", "Cut", { implemented: false }),
      menuAction("copy", "Copy", { implemented: false }),
      menuAction("paste", "Paste", { implemented: false }),
      menuAction("paste-in-place", "Paste in Place", {
        implemented: false,
        shortcut: "Ctrl+Shift+V"
      }),
      menuAction("delete", "Delete", { implemented: false }),
      menuSeparator,
      menuAction("select-all", "Select All", {
        implemented: false,
        shortcut: "Ctrl+A"
      }),
      menuAction("invert-selection", "Invert Selection", {
        implemented: false,
        shortcut: "Ctrl+I"
      }),
      menuAction("select-none", "Select None", {
        implemented: false,
        shortcut: "Ctrl+Shift+A"
      }),
      menuSeparator,
      menuAction("preferences", "Preferences...", { implemented: false })
    ]
  };

  const viewMenu: TiledMenuSpec = {
    id: "view",
    label: "View",
    items: [
      menuAction("search-actions", "Search Actions...", { implemented: false }),
      menuAction("show-grid", "Show Grid", {
        implemented: true,
        checked: context.showGrid,
        shortcut: "Ctrl+G"
      }),
      menuAction("show-tile-object-outlines", "Show Tile Object Outlines", { implemented: false }),
      menuAction("show-object-references", "Show Object References", { implemented: false }),
      menuSubmenu("show-object-names", "Show Object Names", [
        menuAction("show-object-names-none", "Never", {
          implemented: false,
          checked: false
        }),
        menuAction("show-object-names-selected", "For Selected Objects", {
          implemented: false,
          checked: true
        }),
        menuAction("show-object-names-all", "For All Objects", {
          implemented: false,
          checked: false
        }),
        menuSeparator,
        menuAction("show-object-names-hovered", "For Hovered Object", {
          implemented: false,
          checked: false
        })
      ]),
      menuAction("show-tile-animations", "Show Tile Animations", { implemented: false }),
      menuAction("show-tile-collision-shapes", "Show Tile Collision Shapes", { implemented: false }),
      menuAction("enable-worlds", "Show World", { implemented: false }),
      menuAction("enable-parallax", "Enable Parallax", { implemented: false }),
      menuAction("highlight-current-layer", "Highlight Current Layer", {
        implemented: false,
        shortcut: "H"
      }),
      menuAction("highlight-hovered-object", "Highlight Hovered Object", { implemented: false }),
      menuSeparator,
      menuSubmenu("snapping", "Snapping", [
        menuAction("snap-nothing", "No Snapping", {
          implemented: false,
          checked: true
        }),
        menuAction("snap-to-grid", "Snap to Grid", { implemented: false }),
        menuAction("snap-to-fine-grid", "Snap to Fine Grid", { implemented: false }),
        menuAction("snap-to-pixels", "Snap to Pixels", { implemented: false })
      ]),
      menuSeparator,
      menuAction("zoom-in", "Zoom In", { implemented: true }),
      menuAction("zoom-out", "Zoom Out", { implemented: true }),
      menuAction("zoom-normal", "Normal Size", {
        implemented: true,
        shortcut: "Ctrl+0"
      }),
      menuAction("fit-in-view", "Fit Map in View", {
        implemented: false,
        shortcut: "Ctrl+/"
      }),
      menuSeparator,
      menuAction("full-screen", "Full Screen", {
        implemented: false,
        shortcut: "F11"
      }),
      menuAction("clear-view", "Clear View", {
        implemented: false,
        shortcut: "Tab"
      })
    ]
  };

  const worldMenu: TiledMenuSpec = {
    id: "world",
    label: "World",
    items: [
      menuAction("new-world", "New World...", { implemented: false }),
      menuAction("load-world", "Load World...", { implemented: false }),
      menuSeparator,
      menuSubmenu("unload-world", "Unload World", [
        menuAction("unload-all-worlds", "Unload All Worlds", { implemented: false })
      ]),
      menuSubmenu("save-world", "Save World", []),
      menuSeparator,
      menuAction("world-properties", "World Properties...", { implemented: false })
    ]
  };

  const mapMenu: TiledMenuSpec = {
    id: "map",
    label: "Map",
    items: [
      menuAction("add-external-tileset", "Add External Tileset...", { implemented: false }),
      menuAction("add-automapping-rules-tileset", "Add Automapping Rules Tileset", { implemented: false }),
      menuSeparator,
      menuAction("resize-map", "Resize Map...", { implemented: false }),
      menuAction("crop-to-selection", "Crop to Selection", { implemented: false }),
      menuAction("autocrop", "Autocrop", { implemented: false }),
      menuAction("offset-map", "Offset Map...", { implemented: false }),
      menuSeparator,
      menuAction("auto-map", "AutoMap", {
        implemented: false,
        shortcut: "Ctrl+M"
      }),
      menuAction("auto-map-while-drawing", "AutoMap While Drawing", { implemented: false }),
      menuSeparator,
      menuAction("select-previous-tileset", "Select Previous Tileset", { implemented: false }),
      menuAction("select-next-tileset", "Select Next Tileset", { implemented: false }),
      menuSeparator,
      menuAction("go-to-tile", "Go to Tile...", {
        implemented: false,
        shortcut: "Ctrl+Shift+G"
      }),
      menuSeparator,
      menuAction("map-properties", "Map Properties...", { implemented: false })
    ]
  };

  const layerMenu: TiledMenuSpec = {
    id: "layer",
    label: "Layer",
    items: [
      menuSubmenu("new-layer", "New", [
        menuAction("add-tile-layer", "Tile Layer", {
          implemented: true,
          disabled: !context.hasActiveMap
        }),
        menuAction("add-object-layer", "Object Layer", {
          implemented: true,
          disabled: !context.hasActiveMap
        }),
        menuAction("add-image-layer", "Image Layer", { implemented: false }),
        menuAction("add-group-layer", "Group Layer", { implemented: false }),
        menuSeparator,
        menuAction("layer-via-copy", "Layer via Copy", {
          implemented: false,
          shortcut: "Ctrl+J"
        }),
        menuAction("layer-via-cut", "Layer via Cut", {
          implemented: false,
          shortcut: "Ctrl+Shift+J"
        })
      ]),
      menuSubmenu("group-layer", "Group", [
        menuAction("group-layers", "Group Layers", { implemented: false }),
        menuAction("ungroup-layers", "Ungroup Layers", { implemented: false })
      ]),
      menuAction("duplicate-layers", "Duplicate Layers", {
        implemented: false,
        shortcut: "Ctrl+Shift+D"
      }),
      menuAction("merge-layer-down", "Merge Layer Down", { implemented: false }),
      menuAction("remove-layers", "Remove Layers", {
        implemented: true,
        disabled: !context.hasActiveLayer
      }),
      menuSeparator,
      menuAction("select-previous-layer", "Select Previous Layer", {
        implemented: false,
        shortcut: "Ctrl+PageDown"
      }),
      menuAction("select-next-layer", "Select Next Layer", {
        implemented: false,
        shortcut: "Ctrl+PageUp"
      }),
      menuAction("select-all-layers", "Select All Layers", {
        implemented: false,
        shortcut: "Ctrl+Alt+A"
      }),
      menuAction("raise-layers", "Raise Layers", {
        implemented: true,
        disabled: !context.canMoveLayerUp,
        shortcut: "Ctrl+Shift+Up"
      }),
      menuAction("lower-layers", "Lower Layers", {
        implemented: true,
        disabled: !context.canMoveLayerDown,
        shortcut: "Ctrl+Shift+Down"
      }),
      menuSeparator,
      menuAction("show-hide-layers", "Show/Hide Layers", {
        implemented: false,
        shortcut: "Ctrl+H"
      }),
      menuAction("lock-unlock-layers", "Lock/Unlock Layers", {
        implemented: false,
        shortcut: "Ctrl+L"
      }),
      menuAction("show-hide-other-layers", "Show/Hide Other Layers", {
        implemented: false,
        shortcut: "Ctrl+Shift+H"
      }),
      menuAction("lock-unlock-other-layers", "Lock/Unlock Other Layers", {
        implemented: false,
        shortcut: "Ctrl+Shift+L"
      }),
      menuSeparator,
      menuAction("layer-properties", "Layer Properties...", { implemented: false })
    ]
  };

  const tilesetMenu: TiledMenuSpec = {
    id: "tileset",
    label: "Tileset",
    items: [
      menuAction("tile-animation-editor", "Tile Animation Editor", { implemented: false }),
      menuAction("rearrange-tiles", "Rearrange Tiles", { implemented: false }),
      menuAction("edit-collision", "Edit Collision", { implemented: false }),
      menuAction("edit-wang-sets", "Edit Wang Sets", { implemented: false }),
      menuSeparator,
      menuAction("add-tiles", "Add Tiles", { implemented: false }),
      menuAction("remove-tiles", "Remove Tiles", { implemented: false }),
      menuSeparator,
      menuAction("edit-tileset-image-parameters", "Edit Tileset Image Parameters...", { implemented: false }),
      menuSeparator,
      menuAction("tileset-properties", "Tileset Properties...", { implemented: false })
    ]
  };

  const projectMenu: TiledMenuSpec = {
    id: "project",
    label: "Project",
    items: [
      menuAction("add-folder-to-project", "Add Folder to Project...", { implemented: false }),
      menuAction("refresh-project-folders", "Refresh Folders", { implemented: false }),
      menuSeparator,
      menuAction("project-properties", "Project Properties...", { implemented: false })
    ]
  };

  const helpMenu: TiledMenuSpec = {
    id: "help",
    label: "Help",
    items: [
      menuAction("documentation", "User Manual ↗", { implemented: false }),
      menuAction("forum", "Community Forum ↗", { implemented: false }),
      menuSeparator,
      menuAction("donate", "Support Tiled Development ↗", { implemented: false }),
      menuAction("about", "About Tiled", { implemented: false })
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

export const tiledNewMenuItems: ToolbarMenuItemSpec[] = [
  {
    id: "new-map",
    label: "New Map",
    implemented: true
  },
  {
    id: "new-tileset",
    label: "New Tileset",
    implemented: false
  }
];

export const tiledMainToolbarActions: ToolbarActionSpec[] = [
  {
    id: "new",
    label: "New",
    icon: "document-new",
    implemented: true
  },
  {
    id: "open",
    label: "Open",
    icon: "document-open",
    implemented: false
  },
  {
    id: "save",
    label: "Save",
    icon: "document-save",
    implemented: false
  },
  {
    id: "undo",
    label: "Undo",
    icon: "edit-undo",
    implemented: true
  },
  {
    id: "redo",
    label: "Redo",
    icon: "edit-redo",
    implemented: true
  },
  {
    id: "command",
    label: "Execute Command",
    icon: "system-run",
    implemented: false
  }
];

export const tiledToolToolbarItems: ToolbarItemSpec[] = [
  {
    kind: "button",
    action: {
      id: "stamp",
      label: "Stamp Brush",
      icon: "stamp-brush",
      implemented: true,
      editorToolId: "stamp"
    }
  },
  {
    kind: "button",
    action: {
      id: "terrain-brush",
      label: "Terrain Brush",
      icon: "terrain-brush",
      implemented: false
    }
  },
  {
    kind: "button",
    action: {
      id: "bucket-fill",
      label: "Bucket Fill Tool",
      icon: "bucket-fill",
      implemented: true,
      editorToolId: "bucket-fill"
    }
  },
  {
    kind: "button",
    action: {
      id: "shape-fill",
      label: "Shape Fill Tool",
      icon: "shape-fill",
      implemented: true,
      editorToolId: "shape-fill"
    }
  },
  {
    kind: "button",
    action: {
      id: "eraser",
      label: "Eraser",
      icon: "eraser",
      implemented: true,
      editorToolId: "eraser"
    }
  },
  {
    kind: "button",
    action: {
      id: "select",
      label: "Rectangular Select",
      icon: "tile-select",
      implemented: true,
      editorToolId: "select"
    }
  },
  {
    kind: "button",
    action: {
      id: "magic-wand",
      label: "Magic Wand",
      icon: "magic-wand",
      implemented: false
    }
  },
  {
    kind: "button",
    action: {
      id: "select-same",
      label: "Select Same Tile",
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
      label: "Select Objects",
      icon: "object-select",
      implemented: true,
      editorToolId: "object-select"
    }
  },
  {
    kind: "button",
    action: {
      id: "edit-polygons",
      label: "Edit Polygons",
      icon: "edit-polygons",
      implemented: false
    }
  },
  {
    kind: "button",
    action: {
      id: "insert-rectangle",
      label: "Insert Rectangle",
      icon: "insert-rectangle",
      implemented: false
    }
  },
  {
    kind: "button",
    action: {
      id: "insert-point",
      label: "Insert Point",
      icon: "insert-point",
      implemented: false
    }
  },
  {
    kind: "button",
    action: {
      id: "insert-ellipse",
      label: "Insert Ellipse",
      icon: "insert-ellipse",
      implemented: false
    }
  },
  {
    kind: "button",
    action: {
      id: "insert-capsule",
      label: "Insert Capsule",
      icon: "insert-capsule",
      implemented: false
    }
  },
  {
    kind: "button",
    action: {
      id: "insert-polygon",
      label: "Insert Polygon",
      icon: "insert-polygon",
      implemented: false
    }
  },
  {
    kind: "button",
    action: {
      id: "insert-tile",
      label: "Insert Tile",
      icon: "insert-tile",
      implemented: false
    }
  },
  {
    kind: "button",
    action: {
      id: "insert-template",
      label: "Insert Template",
      icon: "insert-template",
      implemented: false
    }
  },
  {
    kind: "button",
    action: {
      id: "insert-text",
      label: "Insert Text",
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
      label: "World Tool",
      icon: "world-tool",
      implemented: false
    }
  },
  {
    kind: "button",
    action: {
      id: "layer-offset",
      label: "Offset Layers",
      icon: "layer-offset",
      implemented: false
    }
  }
];

function button(action: ToolbarActionSpec): ToolbarButtonSpec {
  return {
    kind: "button",
    action
  };
}

export function getTiledToolOptionItems(input: {
  activeTool: EditorToolId;
  shapeFillMode: ShapeFillMode;
}): ToolbarItemSpec[] {
  const stampTransformOptions: ToolbarItemSpec[] = [
    button({
      id: "random-mode",
      label: "Random Mode",
      icon: "random-mode",
      implemented: false
    }),
    button({
      id: "terrain-fill-mode",
      label: "Terrain Fill Mode",
      icon: "terrain-fill-mode",
      implemented: false
    }),
    { kind: "separator" },
    button({
      id: "flip-horizontal",
      label: "Flip Horizontally",
      icon: "flip-horizontal",
      implemented: false
    }),
    button({
      id: "flip-vertical",
      label: "Flip Vertically",
      icon: "flip-vertical",
      implemented: false
    }),
    button({
      id: "rotate-left",
      label: "Rotate Left",
      icon: "rotate-left",
      implemented: false
    }),
    button({
      id: "rotate-right",
      label: "Rotate Right",
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
        label: "Rectangle Fill",
        icon: "shape-fill",
        implemented: true
      }),
      button({
        id: "shape-fill-ellipse",
        label: "Circle Fill",
        icon: "ellipse-fill",
        implemented: true
      })
    ];
  }

  if (input.activeTool === "select") {
    return [
      button({
        id: "selection-replace",
        label: "Replace Selection",
        icon: "selection-replace",
        implemented: false
      }),
      button({
        id: "selection-add",
        label: "Add Selection",
        icon: "selection-add",
        implemented: false
      }),
      button({
        id: "selection-subtract",
        label: "Subtract Selection",
        icon: "selection-subtract",
        implemented: false
      }),
      button({
        id: "selection-intersect",
        label: "Intersect Selection",
        icon: "selection-intersect",
        implemented: false
      })
    ];
  }

  if (input.activeTool === "object-select") {
    return [
      button({
        id: "object-flip-horizontal",
        label: "Flip Horizontally",
        icon: "flip-horizontal",
        implemented: false
      }),
      button({
        id: "object-flip-vertical",
        label: "Flip Vertically",
        icon: "flip-vertical",
        implemented: false
      }),
      button({
        id: "object-rotate-left",
        label: "Rotate Left",
        icon: "rotate-left",
        implemented: false
      }),
      button({
        id: "object-rotate-right",
        label: "Rotate Right",
        icon: "rotate-right",
        implemented: false
      }),
      { kind: "separator" },
      button({
        id: "select-touch",
        label: "Select Touched Objects",
        icon: "select-touch",
        implemented: false
      }),
      button({
        id: "select-enclose",
        label: "Select Enclosed Objects",
        icon: "select-enclose",
        implemented: false
      })
    ];
  }

  return [];
}
