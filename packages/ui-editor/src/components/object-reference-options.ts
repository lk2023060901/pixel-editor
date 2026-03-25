"use client";

import type {
  EditorMap,
  LayerDefinition
} from "@pixel-editor/domain";

export interface ObjectReferenceOption {
  id: string;
  label: string;
}

function collectLayerObjectReferenceOptions(
  layer: LayerDefinition,
  options: ObjectReferenceOption[]
): void {
  if (layer.kind === "group") {
    for (const childLayer of layer.layers) {
      collectLayerObjectReferenceOptions(childLayer, options);
    }

    return;
  }

  if (layer.kind !== "object") {
    return;
  }

  for (const object of layer.objects) {
    options.push({
      id: object.id,
      label: `${object.name || object.id} · ${layer.name}`
    });
  }
}

export function buildObjectReferenceOptions(
  map: EditorMap | undefined
): ObjectReferenceOption[] {
  if (!map) {
    return [];
  }

  const options: ObjectReferenceOption[] = [];

  for (const layer of map.layers) {
    collectLayerObjectReferenceOptions(layer, options);
  }

  return options;
}
