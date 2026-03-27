import type {
  PropertiesInspectorObjectViewState,
  RendererCanvasObjectTransformPreviewViewState,
  RendererCanvasRenderViewState
} from "@pixel-editor/app-services/ui";

type EditorRenderLayerId = NonNullable<RendererCanvasRenderViewState["highlightedLayerId"]>;
type EditorRenderObjectId = NonNullable<
  NonNullable<RendererCanvasRenderViewState["selectedObjectIds"]>[number]
>;
type EditorRenderObjectShape = PropertiesInspectorObjectViewState["shape"];

export type EditorRenderViewportSnapshot = RendererCanvasRenderViewState["viewport"];
export type EditorRenderProjectionMap = NonNullable<RendererCanvasRenderViewState["map"]>;

export interface EditorRenderProjectedPoint {
  x: number;
  y: number;
}

export interface EditorRenderProjectedMapObject {
  objectId: EditorRenderObjectId;
  layerId: EditorRenderLayerId;
  name: string;
  shape: EditorRenderObjectShape;
  opacity: number;
  highlighted: boolean;
  selected: boolean;
  screenX: number;
  screenY: number;
  screenWidth: number;
  screenHeight: number;
  tileGid?: number;
  screenPoints?: EditorRenderProjectedPoint[];
  textContent?: string;
  textColor?: string;
  textFontFamily?: string;
  textPixelSize?: number;
  textWrap?: boolean;
}

export type EditorRenderObjectTransformPreview =
  RendererCanvasObjectTransformPreviewViewState;

export type EditorCanvasRendererPickResult =
  | { kind: "none" }
  | { kind: "layer"; layerId: EditorRenderLayerId }
  | { kind: "object"; objectId: EditorRenderObjectId }
  | {
      kind: "object-handle";
      handle:
        | "nw"
        | "n"
        | "ne"
        | "e"
        | "se"
        | "s"
        | "sw"
        | "w"
        | "rotate";
    }
  | { kind: "tile"; x: number; y: number };

export interface EditorCanvasRendererPickOptions {
  mode?: "tile" | "object" | "topmost";
}

export type EditorCanvasRendererLocationResult =
  | { kind: "none" }
  | {
      kind: "map";
      worldX: number;
      worldY: number;
      tileX: number;
      tileY: number;
    };

export type EditorRenderSnapshot = RendererCanvasRenderViewState;

export interface EditorCanvasRenderer {
  mount(host: HTMLElement): Promise<void>;
  update(snapshot: EditorRenderSnapshot): void;
  pick(
    clientX: number,
    clientY: number,
    options?: EditorCanvasRendererPickOptions
  ): EditorCanvasRendererPickResult;
  locate(clientX: number, clientY: number): EditorCanvasRendererLocationResult;
  destroy(): void;
}

export interface EditorRenderObjectProjectionGeometry {
  tileWidth: number;
  tileHeight: number;
  gridOriginX: number;
  gridOriginY: number;
}

export interface EditorRenderObjectProjectionViewport {
  originX: number;
  originY: number;
}

export interface EditorRenderViewportProjection {
  canvasX: number;
  canvasY: number;
  canvasWidth: number;
  canvasHeight: number;
  mapLeft: number;
  mapTop: number;
  pixelScaleX: number;
  pixelScaleY: number;
}

export interface EditorRenderProjectedRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface EditorRenderBridge {
  createRenderer(options?: {
    labels?: {
      noActiveMap?: string;
    };
  }): EditorCanvasRenderer;
  exportSnapshotImageDataUrl(input: {
    snapshot: EditorRenderSnapshot;
    width: number;
    height: number;
    labels?: {
      noActiveMap?: string;
    };
    mimeType?: "image/png" | "image/jpeg" | "image/webp";
  }): Promise<string>;
  collectProjectedMapObjects(input: {
    map: EditorRenderProjectionMap;
    geometry: EditorRenderObjectProjectionGeometry;
    viewport: EditorRenderObjectProjectionViewport;
    highlightedLayerId?: EditorRenderLayerId;
    selectedObjectIds?: EditorRenderObjectId[];
    objectTransformPreview?: EditorRenderObjectTransformPreview;
  }): EditorRenderProjectedMapObject[];
  pickProjectedObject(
    objects: readonly EditorRenderProjectedMapObject[],
    localX: number,
    localY: number
  ): EditorRenderObjectId | undefined;
  resolveViewportProjection(input: {
    map: EditorRenderProjectionMap;
    viewport: EditorRenderViewportSnapshot;
    width: number;
    height: number;
  }): EditorRenderViewportProjection;
  projectWorldRectToScreenRect(input: {
    projection: EditorRenderViewportProjection;
    activeWorldRect: {
      x: number;
      y: number;
    };
    worldRect: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }): EditorRenderProjectedRect;
}
