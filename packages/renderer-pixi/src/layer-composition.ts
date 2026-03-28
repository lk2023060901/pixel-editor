import type {
  BlendMode,
  ImageLayer,
  LayerDefinition,
  LayerId,
  ObjectLayer,
  TileLayer
} from "@pixel-editor/domain";

import {
  combineLayerTintColor,
  DEFAULT_LAYER_BLEND_MODE,
  resolveLayerTintColor,
  resolveEffectiveLayerBlendMode
} from "./layer-style";

export interface RenderableGroupPathEntry {
  layerId: LayerId;
  opacity: number;
  tintColor: number | undefined;
  blendMode: BlendMode;
}

interface BaseRenderableLayerEntry<TLayer extends TileLayer | ObjectLayer | ImageLayer> {
  kind: TLayer["kind"];
  layer: TLayer;
  opacity: number;
  localOpacity: number;
  highlighted: boolean;
  offsetX: number;
  offsetY: number;
  parallaxX: number;
  parallaxY: number;
  tintColor: number | undefined;
  localTintColor: number | undefined;
  blendMode: BlendMode;
  localBlendMode: BlendMode;
  groupPath: readonly RenderableGroupPathEntry[];
}

export type RenderableTileLayerEntry = BaseRenderableLayerEntry<TileLayer>;
export type RenderableObjectLayerEntry = BaseRenderableLayerEntry<ObjectLayer>;
export type RenderableImageLayerEntry = BaseRenderableLayerEntry<ImageLayer>;

export type RenderableLayerEntry =
  | RenderableTileLayerEntry
  | RenderableObjectLayerEntry
  | RenderableImageLayerEntry;

export function collectRenderableLayers(
  layers: LayerDefinition[],
  highlightedLayerId?: LayerId,
  inheritedVisible = true,
  inheritedOpacity = 1,
  inheritedOffsetX = 0,
  inheritedOffsetY = 0,
  inheritedParallaxX = 1,
  inheritedParallaxY = 1,
  inheritedTintColor: number | undefined = undefined,
  inheritedBlendMode: BlendMode = DEFAULT_LAYER_BLEND_MODE,
  groupPath: readonly RenderableGroupPathEntry[] = []
): RenderableLayerEntry[] {
  const renderableLayers: RenderableLayerEntry[] = [];

  for (const layer of layers) {
    const isVisible = inheritedVisible && layer.visible;
    const localOpacity = layer.opacity;
    const nextOpacity = inheritedOpacity * layer.opacity;
    const nextOffsetX = inheritedOffsetX + layer.offsetX;
    const nextOffsetY = inheritedOffsetY + layer.offsetY;
    const nextParallaxX = inheritedParallaxX * layer.parallaxX;
    const nextParallaxY = inheritedParallaxY * layer.parallaxY;
    const localTintColor = resolveLayerTintColor(layer.tintColor);
    const nextTintColor = combineLayerTintColor(inheritedTintColor, layer.tintColor);
    const localBlendMode = layer.blendMode;
    const nextBlendMode = resolveEffectiveLayerBlendMode(
      inheritedBlendMode,
      layer.blendMode
    );

    if (!isVisible) {
      continue;
    }

    if (layer.kind === "group") {
      const nextGroupPath = [
        ...groupPath,
        {
          layerId: layer.id,
          opacity: localOpacity,
          tintColor: localTintColor,
          blendMode: localBlendMode
        }
      ];

      renderableLayers.push(
        ...collectRenderableLayers(
          layer.layers,
          highlightedLayerId,
          isVisible,
          nextOpacity,
          nextOffsetX,
          nextOffsetY,
          nextParallaxX,
          nextParallaxY,
          nextTintColor,
          nextBlendMode,
          nextGroupPath
        )
      );
      continue;
    }

    if (layer.kind === "tile") {
      renderableLayers.push({
        kind: "tile",
        layer,
        opacity: nextOpacity,
        localOpacity,
        highlighted: layer.id === highlightedLayerId,
        offsetX: nextOffsetX,
        offsetY: nextOffsetY,
        parallaxX: nextParallaxX,
        parallaxY: nextParallaxY,
        tintColor: nextTintColor,
        localTintColor,
        blendMode: nextBlendMode,
        localBlendMode,
        groupPath
      });
      continue;
    }

    if (layer.kind === "object") {
      renderableLayers.push({
        kind: "object",
        layer,
        opacity: nextOpacity,
        localOpacity,
        highlighted: layer.id === highlightedLayerId,
        offsetX: nextOffsetX,
        offsetY: nextOffsetY,
        parallaxX: nextParallaxX,
        parallaxY: nextParallaxY,
        tintColor: nextTintColor,
        localTintColor,
        blendMode: nextBlendMode,
        localBlendMode,
        groupPath
      });
      continue;
    }

    renderableLayers.push({
      kind: "image",
      layer,
      opacity: nextOpacity,
      localOpacity,
      highlighted: layer.id === highlightedLayerId,
      offsetX: nextOffsetX,
      offsetY: nextOffsetY,
      parallaxX: nextParallaxX,
      parallaxY: nextParallaxY,
      tintColor: nextTintColor,
      localTintColor,
      blendMode: nextBlendMode,
      localBlendMode,
      groupPath
    });
  }

  return renderableLayers;
}
