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

export const tiledMainMenuItems = ["File", "Edit", "View", "Map", "Tileset", "Project", "Help"];

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
