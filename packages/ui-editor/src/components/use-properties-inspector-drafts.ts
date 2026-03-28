"use client";

import { type PropertiesInspectorViewState } from "@pixel-editor/app-services/ui";
import type { PropertiesInspectorStore } from "@pixel-editor/app-services/ui-store";
import { startTransition, useEffect, useState } from "react";

import {
  type LayerDraft,
  type MapDraft,
  type ObjectDraft,
  createLayerDraft,
  createMapDraft,
  createObjectDraft
} from "./properties-inspector-sections";

export function usePropertiesInspectorDrafts(input: {
  viewState: PropertiesInspectorViewState;
  store: PropertiesInspectorStore;
}) {
  const activeMap = input.viewState.map;
  const activeLayer = input.viewState.layer;
  const activeObject = input.viewState.object;
  const [mapDraft, setMapDraft] = useState(() => createMapDraft(activeMap));
  const [layerDraft, setLayerDraft] = useState(() => createLayerDraft(activeLayer));
  const [objectDraft, setObjectDraft] = useState(() => createObjectDraft(activeObject));

  useEffect(() => {
    setMapDraft(createMapDraft(activeMap));
  }, [activeMap]);

  useEffect(() => {
    setLayerDraft(createLayerDraft(activeLayer));
  }, [activeLayer]);

  useEffect(() => {
    setObjectDraft(createObjectDraft(activeObject));
  }, [activeObject]);

  function applyMapDraft(nextDraft: MapDraft = mapDraft): void {
    if (!activeMap) {
      return;
    }

    const width = Number.parseInt(nextDraft.width, 10);
    const height = Number.parseInt(nextDraft.height, 10);
    const tileWidth = Number.parseInt(nextDraft.tileWidth, 10);
    const tileHeight = Number.parseInt(nextDraft.tileHeight, 10);
    const parallaxOriginX = Number.parseFloat(nextDraft.parallaxOriginX);
    const parallaxOriginY = Number.parseFloat(nextDraft.parallaxOriginY);

    if (
      Number.isNaN(tileWidth) ||
      Number.isNaN(tileHeight) ||
      Number.isNaN(parallaxOriginX) ||
      Number.isNaN(parallaxOriginY) ||
      (!nextDraft.infinite && (Number.isNaN(width) || Number.isNaN(height)))
    ) {
      setMapDraft(createMapDraft(activeMap));
      return;
    }

    startTransition(() => {
      input.store.updateActiveMapDetails({
        name: nextDraft.name.trim() || activeMap.name,
        orientation: nextDraft.orientation,
        renderOrder: nextDraft.renderOrder,
        tileWidth,
        tileHeight,
        parallaxOriginX,
        parallaxOriginY,
        infinite: nextDraft.infinite,
        ...(nextDraft.infinite ? {} : { width, height }),
        ...(nextDraft.backgroundColor.trim()
          ? { backgroundColor: nextDraft.backgroundColor.trim() }
          : {})
      });
    });
  }

  function applyLayerDraft(nextDraft: LayerDraft = layerDraft): void {
    if (!activeLayer) {
      return;
    }

    const opacity = Number.parseFloat(nextDraft.opacity);
    const offsetX = Number.parseFloat(nextDraft.offsetX);
    const offsetY = Number.parseFloat(nextDraft.offsetY);
    const parallaxX = Number.parseFloat(nextDraft.parallaxX);
    const parallaxY = Number.parseFloat(nextDraft.parallaxY);

    if (
      Number.isNaN(opacity) ||
      Number.isNaN(offsetX) ||
      Number.isNaN(offsetY) ||
      Number.isNaN(parallaxX) ||
      Number.isNaN(parallaxY)
    ) {
      setLayerDraft(createLayerDraft(activeLayer));
      return;
    }

    startTransition(() => {
      input.store.updateActiveLayerDetails({
        name: nextDraft.name.trim() || activeLayer.name,
        className: nextDraft.className,
        visible: nextDraft.visible,
        locked: nextDraft.locked,
        opacity: Math.max(0, Math.min(opacity, 1)),
        offsetX,
        offsetY,
        parallaxX,
        parallaxY,
        tintColor: nextDraft.tintColor,
        blendMode: nextDraft.blendMode,
        ...(activeLayer.kind === "object" ? { drawOrder: nextDraft.drawOrder } : {}),
        ...(activeLayer.kind === "image"
          ? {
              imagePath: nextDraft.imagePath.trim(),
              repeatX: nextDraft.repeatX,
              repeatY: nextDraft.repeatY
            }
          : {})
      });
    });
  }

  function applyObjectDraft(nextDraft: ObjectDraft = objectDraft): void {
    if (!activeObject) {
      return;
    }

    const x = Number.parseFloat(nextDraft.x);
    const y = Number.parseFloat(nextDraft.y);
    const width = Number.parseFloat(nextDraft.width);
    const height = Number.parseFloat(nextDraft.height);
    const rotation = Number.parseFloat(nextDraft.rotation);

    if (
      Number.isNaN(x) ||
      Number.isNaN(y) ||
      Number.isNaN(width) ||
      Number.isNaN(height) ||
      Number.isNaN(rotation)
    ) {
      setObjectDraft(createObjectDraft(activeObject));
      return;
    }

    startTransition(() => {
      input.store.updateSelectedObjectDetails({
        name: nextDraft.name.trim() || activeObject.name,
        className: nextDraft.className,
        x,
        y,
        width,
        height,
        rotation,
        visible: nextDraft.visible
      });
    });
  }

  return {
    activeMap,
    activeLayer,
    activeObject,
    objectReferenceOptions: input.viewState.objectReferenceOptions,
    propertyTypes: input.viewState.propertyTypes,
    drafts: {
      mapDraft,
      layerDraft,
      objectDraft
    },
    setters: {
      setMapDraft,
      setLayerDraft,
      setObjectDraft
    },
    apply: {
      applyMapDraft,
      applyLayerDraft,
      applyObjectDraft
    }
  };
}
