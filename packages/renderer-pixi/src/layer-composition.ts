import type {
  ImageLayer,
  LayerDefinition,
  LayerId,
  ObjectLayer,
  TileLayer
} from "@pixel-editor/domain";

interface BaseRenderableLayerEntry<TLayer extends TileLayer | ObjectLayer | ImageLayer> {
  kind: TLayer["kind"];
  layer: TLayer;
  opacity: number;
  highlighted: boolean;
  offsetX: number;
  offsetY: number;
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
  inheritedOffsetY = 0
): RenderableLayerEntry[] {
  const renderableLayers: RenderableLayerEntry[] = [];

  for (const layer of layers) {
    const isVisible = inheritedVisible && layer.visible;
    const nextOpacity = inheritedOpacity * layer.opacity;
    const nextOffsetX = inheritedOffsetX + layer.offsetX;
    const nextOffsetY = inheritedOffsetY + layer.offsetY;

    if (!isVisible) {
      continue;
    }

    if (layer.kind === "group") {
      renderableLayers.push(
        ...collectRenderableLayers(
          layer.layers,
          highlightedLayerId,
          isVisible,
          nextOpacity,
          nextOffsetX,
          nextOffsetY
        )
      );
      continue;
    }

    if (layer.kind === "tile") {
      renderableLayers.push({
        kind: "tile",
        layer,
        opacity: nextOpacity,
        highlighted: layer.id === highlightedLayerId,
        offsetX: nextOffsetX,
        offsetY: nextOffsetY
      });
      continue;
    }

    if (layer.kind === "object") {
      renderableLayers.push({
        kind: "object",
        layer,
        opacity: nextOpacity,
        highlighted: layer.id === highlightedLayerId,
        offsetX: nextOffsetX,
        offsetY: nextOffsetY
      });
      continue;
    }

    renderableLayers.push({
      kind: "image",
      layer,
      opacity: nextOpacity,
      highlighted: layer.id === highlightedLayerId,
      offsetX: nextOffsetX,
      offsetY: nextOffsetY
    });
  }

  return renderableLayers;
}
