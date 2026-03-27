"use client";

import type { EditorNamingConfig } from "@pixel-editor/app-services";
import type { TranslationFn } from "@pixel-editor/i18n";
import { useI18n } from "@pixel-editor/i18n/client";
import {
  collectProjectedMapObjects,
  createPixiEditorRenderer,
  exportRendererSnapshotImageDataUrl,
  pickProjectedObject,
  projectWorldRectToScreenRect,
  resolveRendererViewportProjection
} from "@pixel-editor/renderer-pixi";
import {
  EditorShell,
  type EditorRenderBridge
} from "@pixel-editor/ui-editor";
import { useState } from "react";

import { createEditorStoreFromExampleSeed } from "../../../lib/example-projects/create-store-from-seed";
import type { ExampleProjectSeed } from "../../../lib/example-projects/schema";

export interface ProjectEditorClientProps {
  seed: ExampleProjectSeed;
}

const pixiRenderBridge: EditorRenderBridge = {
  createRenderer: createPixiEditorRenderer,
  exportSnapshotImageDataUrl: exportRendererSnapshotImageDataUrl,
  collectProjectedMapObjects,
  pickProjectedObject,
  resolveViewportProjection: resolveRendererViewportProjection,
  projectWorldRectToScreenRect
};

function createLocalizedEditorNaming(t: TranslationFn): EditorNamingConfig {
  return {
    mapNamePrefix: t("naming.mapNamePrefix"),
    defaultMapLayerNames: {
      tile: t("naming.defaultTileLayerName"),
      object: t("naming.defaultObjectLayerName")
    },
    layerNamePrefixes: {
      tile: t("naming.tileLayerPrefix"),
      object: t("naming.objectLayerPrefix"),
      image: t("naming.imageLayerPrefix"),
      group: t("naming.groupLayerPrefix")
    },
    objectNamePrefix: t("naming.objectNamePrefix"),
    defaultWangSetName: t("naming.defaultWangSetName")
  };
}

export function ProjectEditorClient({
  seed
}: ProjectEditorClientProps) {
  const { t } = useI18n();
  const [store] = useState(() =>
    createEditorStoreFromExampleSeed(seed, {
      naming: createLocalizedEditorNaming(t)
    })
  );

  return <EditorShell renderBridge={pixiRenderBridge} store={store} />;
}
