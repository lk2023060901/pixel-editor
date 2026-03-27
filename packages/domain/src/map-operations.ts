import {
  createGroupLayer,
  createImageLayer,
  createObjectLayer,
  createTileLayer,
  type GroupLayer,
  type ImageLayer,
  type LayerDefinition,
  type ObjectLayer,
  type TileLayer
} from "./layer";
import type { LayerId } from "./id";
import { type EditorMap, type MapSettings } from "./map";
import {
  convertTileLayerToFinite,
  convertTileLayerToInfinite,
  createTileCell,
  setTileLayerCell
} from "./tile-layer-operations";

export interface UpdateMapDetailsInput {
  name?: string;
  orientation?: MapSettings["orientation"];
  width?: number;
  height?: number;
  tileWidth?: number;
  tileHeight?: number;
  infinite?: boolean;
  renderOrder?: MapSettings["renderOrder"];
  compressionLevel?: number;
  parallaxOriginX?: number;
  parallaxOriginY?: number;
  backgroundColor?: string;
}

function validatePositive(name: string, value: number): void {
  if (value <= 0) {
    throw new Error(`${name} must be greater than zero`);
  }
}

export function getLayerById(
  layers: LayerDefinition[],
  layerId: LayerId
): LayerDefinition | undefined {
  for (const layer of layers) {
    if (layer.id === layerId) {
      return layer;
    }

    if (layer.kind === "group") {
      const child = getLayerById(layer.layers, layerId);

      if (child) {
        return child;
      }
    }
  }

  return undefined;
}

function updateLayerTree(
  layers: LayerDefinition[],
  layerId: LayerId,
  updater: (layer: LayerDefinition) => LayerDefinition
): { layers: LayerDefinition[]; changed: boolean } {
  let changed = false;

  const nextLayers = layers.map((layer) => {
    if (layer.id === layerId) {
      changed = true;
      return updater(layer);
    }

    if (layer.kind === "group") {
      const result = updateLayerTree(layer.layers, layerId, updater);

      if (result.changed) {
        changed = true;
        return {
          ...layer,
          layers: result.layers
        };
      }
    }

    return layer;
  });

  return {
    layers: nextLayers,
    changed
  };
}

function removeLayerTree(
  layers: LayerDefinition[],
  layerId: LayerId
): { layers: LayerDefinition[]; removed: boolean } {
  let removed = false;
  const nextLayers: LayerDefinition[] = [];

  for (const layer of layers) {
    if (layer.id === layerId) {
      removed = true;
      continue;
    }

    if (layer.kind === "group") {
      const result = removeLayerTree(layer.layers, layerId);

      if (result.removed) {
        removed = true;
        nextLayers.push({
          ...layer,
          layers: result.layers
        });
        continue;
      }
    }

    nextLayers.push(layer);
  }

  return {
    layers: nextLayers,
    removed
  };
}

function moveLayerWithinSiblings(
  layers: LayerDefinition[],
  layerId: LayerId,
  direction: "up" | "down"
): { layers: LayerDefinition[]; moved: boolean } {
  const index = layers.findIndex((layer) => layer.id === layerId);

  if (index >= 0) {
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= layers.length) {
      return { layers, moved: false };
    }

    const nextLayers = [...layers];
    const [layer] = nextLayers.splice(index, 1);

    if (!layer) {
      return { layers, moved: false };
    }

    nextLayers.splice(targetIndex, 0, layer);

    return {
      layers: nextLayers,
      moved: true
    };
  }

  let moved = false;
  const nextLayers = layers.map((layer) => {
    if (layer.kind !== "group") {
      return layer;
    }

    const result = moveLayerWithinSiblings(layer.layers, layerId, direction);

    if (!result.moved) {
      return layer;
    }

    moved = true;
    return {
      ...layer,
      layers: result.layers
    };
  });

  return {
    layers: nextLayers,
    moved
  };
}

function updateTileLayersForMapSettings(
  layers: LayerDefinition[],
  nextSettings: MapSettings
): LayerDefinition[] {
  return layers.map((layer) => {
    if (layer.kind === "group") {
      return {
        ...layer,
        layers: updateTileLayersForMapSettings(layer.layers, nextSettings)
      };
    }

    if (layer.kind !== "tile") {
      return layer;
    }

    if (nextSettings.infinite) {
      return convertTileLayerToInfinite(layer);
    }

    return convertTileLayerToFinite(layer, nextSettings.width, nextSettings.height);
  });
}

export function updateMapDetails(
  map: EditorMap,
  patch: UpdateMapDetailsInput
): EditorMap {
  const nextInfinite = patch.infinite ?? map.settings.infinite;
  const nextWidth = nextInfinite ? 0 : patch.width ?? map.settings.width;
  const nextHeight = nextInfinite ? 0 : patch.height ?? map.settings.height;
  const nextTileWidth = patch.tileWidth ?? map.settings.tileWidth;
  const nextTileHeight = patch.tileHeight ?? map.settings.tileHeight;

  validatePositive("tileWidth", nextTileWidth);
  validatePositive("tileHeight", nextTileHeight);

  if (!nextInfinite) {
    validatePositive("width", nextWidth);
    validatePositive("height", nextHeight);
  }

  const nextSettings: MapSettings = {
    ...map.settings,
    width: nextWidth,
    height: nextHeight,
    tileWidth: nextTileWidth,
    tileHeight: nextTileHeight,
    infinite: nextInfinite,
    ...(patch.orientation !== undefined ? { orientation: patch.orientation } : {}),
    ...(patch.renderOrder !== undefined ? { renderOrder: patch.renderOrder } : {}),
    ...(patch.compressionLevel !== undefined
      ? { compressionLevel: patch.compressionLevel }
      : {}),
    ...(patch.parallaxOriginX !== undefined
      ? { parallaxOriginX: patch.parallaxOriginX }
      : {}),
    ...(patch.parallaxOriginY !== undefined
      ? { parallaxOriginY: patch.parallaxOriginY }
      : {}),
    ...(patch.backgroundColor !== undefined
      ? { backgroundColor: patch.backgroundColor }
      : {})
  };

  return {
    ...map,
    name: patch.name ?? map.name,
    settings: nextSettings,
    layers: updateTileLayersForMapSettings(map.layers, nextSettings)
  };
}

export function addTopLevelTileLayer(
  map: EditorMap,
  name: string
): { map: EditorMap; layer: TileLayer } {
  const layer = createTileLayer({
    name,
    width: map.settings.infinite ? 1 : map.settings.width,
    height: map.settings.infinite ? 1 : map.settings.height,
    ...(map.settings.infinite ? { infinite: true } : {})
  });

  return {
    map: {
      ...map,
      layers: [...map.layers, layer],
      nextLayerOrder: map.nextLayerOrder + 1
    },
    layer
  };
}

export function addTopLevelObjectLayer(
  map: EditorMap,
  name: string
): { map: EditorMap; layer: ObjectLayer } {
  const layer = createObjectLayer({
    name
  });

  return {
    map: {
      ...map,
      layers: [...map.layers, layer],
      nextLayerOrder: map.nextLayerOrder + 1
    },
    layer
  };
}

export function addTopLevelImageLayer(
  map: EditorMap,
  name: string
): { map: EditorMap; layer: ImageLayer } {
  const layer = createImageLayer({
    name,
    imagePath: ""
  });

  return {
    map: {
      ...map,
      layers: [...map.layers, layer],
      nextLayerOrder: map.nextLayerOrder + 1
    },
    layer
  };
}

export function addTopLevelGroupLayer(
  map: EditorMap,
  name: string
): { map: EditorMap; layer: GroupLayer } {
  const layer = createGroupLayer({
    name
  });

  return {
    map: {
      ...map,
      layers: [...map.layers, layer],
      nextLayerOrder: map.nextLayerOrder + 1
    },
    layer
  };
}

export function removeLayerFromMap(map: EditorMap, layerId: LayerId): EditorMap {
  const result = removeLayerTree(map.layers, layerId);

  if (!result.removed) {
    return map;
  }

  return {
    ...map,
    layers: result.layers
  };
}

export function moveLayerInMap(
  map: EditorMap,
  layerId: LayerId,
  direction: "up" | "down"
): EditorMap {
  const result = moveLayerWithinSiblings(map.layers, layerId, direction);

  if (!result.moved) {
    return map;
  }

  return {
    ...map,
    layers: result.layers
  };
}

export function updateLayerInMap(
  map: EditorMap,
  layerId: LayerId,
  updater: (layer: LayerDefinition) => LayerDefinition
): EditorMap {
  const result = updateLayerTree(map.layers, layerId, updater);

  if (!result.changed) {
    return map;
  }

  return {
    ...map,
    layers: result.layers
  };
}

export function paintTileInMap(
  map: EditorMap,
  layerId: LayerId,
  x: number,
  y: number,
  gid: number | null
): EditorMap {
  return updateLayerInMap(map, layerId, (layer) => {
    if (layer.kind !== "tile") {
      return layer;
    }

    return setTileLayerCell(layer, x, y, createTileCell(gid));
  });
}
