"use client";

import {
  createPropertiesInspectorLayerDraft,
  createPropertiesInspectorMapDraft,
  createPropertiesInspectorObjectDraft,
  resolvePropertiesInspectorLayerDraftCommit,
  resolvePropertiesInspectorMapDraftCommit,
  resolvePropertiesInspectorObjectDraftCommit,
  type PropertiesInspectorLayerDraft,
  type PropertiesInspectorMapDraft,
  type PropertiesInspectorObjectDraft,
  type PropertiesInspectorViewState
} from "@pixel-editor/app-services/ui";
import type { PropertiesInspectorStore } from "@pixel-editor/app-services/ui-store";
import { startTransition, useEffect, useState } from "react";

export function usePropertiesInspectorDrafts(input: {
  viewState: PropertiesInspectorViewState;
  store: PropertiesInspectorStore;
}) {
  const activeMap = input.viewState.map;
  const activeLayer = input.viewState.layer;
  const activeObject = input.viewState.object;
  const [mapDraft, setMapDraft] = useState<PropertiesInspectorMapDraft>(() =>
    createPropertiesInspectorMapDraft(activeMap)
  );
  const [layerDraft, setLayerDraft] = useState<PropertiesInspectorLayerDraft>(() =>
    createPropertiesInspectorLayerDraft(activeLayer)
  );
  const [objectDraft, setObjectDraft] = useState<PropertiesInspectorObjectDraft>(() =>
    createPropertiesInspectorObjectDraft(activeObject)
  );

  useEffect(() => {
    setMapDraft(createPropertiesInspectorMapDraft(activeMap));
  }, [activeMap]);

  useEffect(() => {
    setLayerDraft(createPropertiesInspectorLayerDraft(activeLayer));
  }, [activeLayer]);

  useEffect(() => {
    setObjectDraft(createPropertiesInspectorObjectDraft(activeObject));
  }, [activeObject]);

  function applyMapDraft(nextDraft: PropertiesInspectorMapDraft = mapDraft): void {
    if (!activeMap) {
      return;
    }

    const resolution = resolvePropertiesInspectorMapDraftCommit({
      draft: nextDraft,
      viewState: activeMap
    });

    if (resolution.patch === undefined) {
      setMapDraft(resolution.nextDraft);
      return;
    }

    const patch = resolution.patch;

    startTransition(() => {
      input.store.updateActiveMapDetails(patch);
    });
  }

  function applyLayerDraft(nextDraft: PropertiesInspectorLayerDraft = layerDraft): void {
    if (!activeLayer) {
      return;
    }

    const resolution = resolvePropertiesInspectorLayerDraftCommit({
      draft: nextDraft,
      viewState: activeLayer
    });

    if (resolution.patch === undefined) {
      setLayerDraft(resolution.nextDraft);
      return;
    }

    const patch = resolution.patch;

    startTransition(() => {
      input.store.updateActiveLayerDetails(patch);
    });
  }

  function applyObjectDraft(nextDraft: PropertiesInspectorObjectDraft = objectDraft): void {
    if (!activeObject) {
      return;
    }

    const resolution = resolvePropertiesInspectorObjectDraftCommit({
      draft: nextDraft,
      viewState: activeObject
    });

    if (resolution.patch === undefined) {
      setObjectDraft(resolution.nextDraft);
      return;
    }

    const patch = resolution.patch;

    startTransition(() => {
      input.store.updateSelectedObjectDetails(patch);
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
