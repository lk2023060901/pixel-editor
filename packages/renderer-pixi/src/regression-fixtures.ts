import {
  createMap,
  createMapObject,
  createGroupLayer,
  createObjectLayer,
  createTileCell,
  createTileLayer,
  setTileLayerCell,
  type EditorMap,
  type LayerId,
  type ObjectId
} from "@pixel-editor/domain";

import type { RendererSnapshot } from "./index";
import type { RendererLayoutMetrics } from "./layout";

export interface RendererRegressionCase {
  id: string;
  description: string;
  width: number;
  height: number;
  snapshot: RendererSnapshot;
  layout?: Partial<RendererLayoutMetrics>;
}

function withCells(
  layer: ReturnType<typeof createTileLayer>,
  cells: Array<{ x: number; y: number; gid: number }>
) {
  return cells.reduce(
    (currentLayer, cell) =>
      setTileLayerCell(currentLayer, cell.x, cell.y, createTileCell(cell.gid)),
    layer
  );
}

function createFiniteTileSelectionMap(): {
  map: EditorMap;
  highlightedLayerId: LayerId;
} {
  const groundLayer = withCells(
    createTileLayer({
      name: "Ground",
      width: 8,
      height: 6
    }),
    [
      { x: 0, y: 0, gid: 1 },
      { x: 1, y: 0, gid: 2 },
      { x: 2, y: 0, gid: 3 },
      { x: 3, y: 0, gid: 4 },
      { x: 1, y: 1, gid: 5 },
      { x: 2, y: 1, gid: 6 },
      { x: 3, y: 1, gid: 7 },
      { x: 4, y: 1, gid: 8 },
      { x: 2, y: 2, gid: 9 },
      { x: 3, y: 2, gid: 10 },
      { x: 4, y: 2, gid: 11 },
      { x: 5, y: 2, gid: 12 },
      { x: 3, y: 3, gid: 13 },
      { x: 4, y: 3, gid: 14 },
      { x: 5, y: 3, gid: 15 },
      { x: 6, y: 3, gid: 16 },
      { x: 4, y: 4, gid: 17 },
      { x: 5, y: 4, gid: 18 },
      { x: 6, y: 4, gid: 19 },
      { x: 7, y: 4, gid: 20 }
    ]
  );
  const detailLayer = withCells(
    createTileLayer({
      name: "Detail",
      width: 8,
      height: 6,
      opacity: 0.68
    }),
    [
      { x: 2, y: 1, gid: 33 },
      { x: 5, y: 1, gid: 34 },
      { x: 1, y: 3, gid: 35 },
      { x: 6, y: 2, gid: 36 },
      { x: 4, y: 4, gid: 37 }
    ]
  );
  const map = createMap({
    name: "orthogonal-finite",
    orientation: "orthogonal",
    width: 8,
    height: 6,
    tileWidth: 32,
    tileHeight: 32,
    layers: [groundLayer, detailLayer]
  });

  return {
    map,
    highlightedLayerId: detailLayer.id
  };
}

function createObjectOverlayMap(): {
  map: EditorMap;
  highlightedLayerId: LayerId;
  selectedObjectIds: ObjectId[];
  previewObjectId: ObjectId;
} {
  const baseLayer = withCells(
    createTileLayer({
      name: "Ground",
      width: 10,
      height: 8
    }),
    [
      { x: 1, y: 1, gid: 4 },
      { x: 2, y: 1, gid: 5 },
      { x: 3, y: 1, gid: 6 },
      { x: 4, y: 2, gid: 7 },
      { x: 5, y: 2, gid: 8 },
      { x: 6, y: 3, gid: 9 },
      { x: 2, y: 4, gid: 10 },
      { x: 3, y: 4, gid: 11 },
      { x: 4, y: 4, gid: 12 },
      { x: 7, y: 5, gid: 13 }
    ]
  );
  const rectangleObject = createMapObject({
    name: "Rect",
    shape: "rectangle",
    x: 32,
    y: 48,
    width: 48,
    height: 32
  });
  const ellipseObject = createMapObject({
    name: "Ellipse",
    shape: "ellipse",
    x: 112,
    y: 44,
    width: 40,
    height: 56
  });
  const capsuleObject = createMapObject({
    name: "Capsule",
    shape: "capsule",
    x: 184,
    y: 132,
    width: 88,
    height: 28
  });
  const objectLayer = createObjectLayer({
    name: "Objects",
    objects: [rectangleObject, ellipseObject, capsuleObject]
  });
  const map = createMap({
    name: "orthogonal-objects",
    orientation: "orthogonal",
    width: 10,
    height: 8,
    tileWidth: 32,
    tileHeight: 32,
    layers: [baseLayer, objectLayer]
  });

  return {
    map,
    highlightedLayerId: objectLayer.id,
    selectedObjectIds: [ellipseObject.id, capsuleObject.id],
    previewObjectId: rectangleObject.id
  };
}

function createInfiniteChunkMap(): {
  map: EditorMap;
  highlightedLayerId: LayerId;
} {
  const terrainLayer = withCells(
    createTileLayer({
      name: "Infinite",
      width: 0,
      height: 0,
      infinite: true,
      chunkWidth: 8,
      chunkHeight: 8
    }),
    [
      { x: -2, y: -1, gid: 41 },
      { x: -1, y: -1, gid: 42 },
      { x: 0, y: -1, gid: 43 },
      { x: -2, y: 0, gid: 44 },
      { x: -1, y: 0, gid: 45 },
      { x: 0, y: 0, gid: 46 },
      { x: 3, y: 1, gid: 47 },
      { x: 4, y: 1, gid: 48 },
      { x: 5, y: 2, gid: 49 },
      { x: 6, y: 2, gid: 50 }
    ]
  );
  const map = createMap({
    name: "orthogonal-infinite",
    orientation: "orthogonal",
    width: 1,
    height: 1,
    tileWidth: 32,
    tileHeight: 32,
    infinite: true,
    layers: [terrainLayer]
  });

  return {
    map,
    highlightedLayerId: terrainLayer.id
  };
}

function createGroupedCompositingMap(): {
  map: EditorMap;
  highlightedLayerId: LayerId;
  selectedObjectIds: ObjectId[];
} {
  const groundLayer = withCells(
    createTileLayer({
      name: "Ground",
      width: 9,
      height: 7
    }),
    [
      { x: 0, y: 1, gid: 1 },
      { x: 1, y: 1, gid: 2 },
      { x: 2, y: 1, gid: 3 },
      { x: 3, y: 2, gid: 4 },
      { x: 4, y: 2, gid: 5 },
      { x: 5, y: 3, gid: 6 },
      { x: 6, y: 3, gid: 7 },
      { x: 7, y: 4, gid: 8 }
    ]
  );
  const glowLayer = withCells(
    createTileLayer({
      name: "Glow",
      width: 9,
      height: 7,
      opacity: 0.78
    }),
    [
      { x: 2, y: 1, gid: 33 },
      { x: 3, y: 1, gid: 34 },
      { x: 4, y: 2, gid: 35 },
      { x: 5, y: 2, gid: 36 },
      { x: 6, y: 3, gid: 37 },
      { x: 3, y: 4, gid: 38 },
      { x: 4, y: 4, gid: 39 }
    ]
  );
  const markerObject = createMapObject({
    name: "Marker",
    shape: "rectangle",
    x: 120,
    y: 72,
    width: 56,
    height: 44
  });
  const orbObject = createMapObject({
    name: "Orb",
    shape: "ellipse",
    x: 196,
    y: 128,
    width: 48,
    height: 48
  });
  const objectLayer = createObjectLayer({
    name: "Props",
    opacity: 0.84,
    objects: [markerObject, orbObject]
  });
  const innerGroup = createGroupLayer({
    name: "Inner FX",
    opacity: 0.62,
    tintColor: "#ffd080",
    blendMode: "screen",
    offsetX: 8,
    offsetY: -6,
    layers: [glowLayer, objectLayer]
  });
  const outerGroup = createGroupLayer({
    name: "Composite FX",
    opacity: 0.76,
    tintColor: "#80c0ff",
    blendMode: "overlay",
    offsetX: 10,
    offsetY: 12,
    layers: [innerGroup]
  });
  const map = createMap({
    name: "orthogonal-grouped-compositing",
    orientation: "orthogonal",
    width: 9,
    height: 7,
    tileWidth: 32,
    tileHeight: 32,
    layers: [groundLayer, outerGroup]
  });

  return {
    map,
    highlightedLayerId: glowLayer.id,
    selectedObjectIds: [orbObject.id]
  };
}

export function createRendererRegressionCases(): RendererRegressionCase[] {
  const finiteSelection = createFiniteTileSelectionMap();
  const objectOverlay = createObjectOverlayMap();
  const infiniteChunk = createInfiniteChunkMap();
  const groupedCompositing = createGroupedCompositingMap();

  return [
    {
      id: "orthogonal-tile-selection",
      description: "finite tile layers with selection and preview overlay",
      width: 512,
      height: 320,
      snapshot: {
        map: finiteSelection.map,
        tilesets: [],
        viewport: {
          zoom: 1,
          originX: 0,
          originY: 0,
          showGrid: true
        },
        highlightedLayerId: finiteSelection.highlightedLayerId,
        selectedTiles: [
          { x: 2, y: 1 },
          { x: 3, y: 1 },
          { x: 4, y: 1 }
        ],
        previewTiles: [
          { x: 5, y: 3 },
          { x: 6, y: 3 }
        ]
      }
    },
    {
      id: "orthogonal-object-overlay",
      description: "object selection and move preview",
      width: 512,
      height: 352,
      snapshot: {
        map: objectOverlay.map,
        tilesets: [],
        viewport: {
          zoom: 1,
          originX: 0,
          originY: 0,
          showGrid: false
        },
        highlightedLayerId: objectOverlay.highlightedLayerId,
        selectedObjectIds: objectOverlay.selectedObjectIds,
        objectTransformPreview: {
          kind: "move",
          objectIds: [objectOverlay.previewObjectId],
          deltaX: 24,
          deltaY: -16
        }
      }
    },
    {
      id: "orthogonal-infinite-grid",
      description: "infinite map chunk bounds with scrolled viewport",
      width: 448,
      height: 288,
      snapshot: {
        map: infiniteChunk.map,
        tilesets: [],
        viewport: {
          zoom: 1,
          originX: 0,
          originY: 0,
          showGrid: true
        },
        highlightedLayerId: infiniteChunk.highlightedLayerId,
        previewTiles: [
          { x: 3, y: 2 },
          { x: 6, y: 2 }
        ]
      }
    },
    {
      id: "orthogonal-grouped-compositing",
      description: "nested group tint blend and object compositing",
      width: 544,
      height: 352,
      snapshot: {
        map: groupedCompositing.map,
        tilesets: [],
        viewport: {
          zoom: 1,
          originX: 0,
          originY: 0,
          showGrid: false
        },
        highlightedLayerId: groupedCompositing.highlightedLayerId,
        selectedObjectIds: groupedCompositing.selectedObjectIds,
        previewTiles: [
          { x: 5, y: 2 },
          { x: 6, y: 2 }
        ]
      }
    }
  ];
}
