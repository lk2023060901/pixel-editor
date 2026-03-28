import type {
  UpdateMapDetailsInput,
  UpdateMapObjectDetailsInput
} from "@pixel-editor/domain";
import type { UpdateLayerDetailsInput } from "@pixel-editor/map";

import {
  buildMapPropertiesUpdatePatch,
  createMapPropertiesDraft,
  mapOrientationOptions,
  mapRenderOrderOptions,
  type MapPropertiesDraft
} from "./map-properties-form";
import type { PropertiesInspectorViewState } from "./ui-models";

export type InspectorMapViewState = NonNullable<PropertiesInspectorViewState["map"]>;
export type InspectorLayerViewState = NonNullable<PropertiesInspectorViewState["layer"]>;
export type InspectorObjectViewState = NonNullable<PropertiesInspectorViewState["object"]>;
export type PropertiesInspectorBlendMode = Exclude<
  InspectorLayerViewState["blendMode"],
  undefined
>;
export type PropertiesInspectorObjectDrawOrder = Exclude<
  InspectorLayerViewState["drawOrder"],
  undefined
>;

export interface PropertiesInspectorMapDraft extends MapPropertiesDraft {
  parallaxOriginX: string;
  parallaxOriginY: string;
}

export interface PropertiesInspectorLayerDraft {
  name: string;
  className: string;
  visible: boolean;
  locked: boolean;
  opacity: string;
  offsetX: string;
  offsetY: string;
  parallaxX: string;
  parallaxY: string;
  tintColor: string;
  blendMode: PropertiesInspectorBlendMode;
  drawOrder: PropertiesInspectorObjectDrawOrder;
  imagePath: string;
  repeatX: boolean;
  repeatY: boolean;
}

export interface PropertiesInspectorObjectDraft {
  name: string;
  className: string;
  x: string;
  y: string;
  width: string;
  height: string;
  rotation: string;
  visible: boolean;
}

export interface PropertiesInspectorDraftCommitResolution<
  TDraft,
  TPatch
> {
  nextDraft: TDraft;
  patch?: TPatch;
}

export const propertiesInspectorBlendModeOptions = [
  "normal",
  "add",
  "multiply",
  "screen",
  "overlay",
  "darken",
  "lighten",
  "color-dodge",
  "color-burn",
  "hard-light",
  "soft-light",
  "difference",
  "exclusion"
] as const satisfies readonly PropertiesInspectorBlendMode[];

export const propertiesInspectorObjectDrawOrderOptions = [
  "topdown",
  "index"
] as const satisfies readonly PropertiesInspectorObjectDrawOrder[];

export {
  mapOrientationOptions as propertiesInspectorMapOrientationOptions,
  mapRenderOrderOptions as propertiesInspectorMapRenderOrderOptions
};

export function createPropertiesInspectorMapDraft(
  map?: InspectorMapViewState
): PropertiesInspectorMapDraft {
  return {
    ...createMapPropertiesDraft(map),
    parallaxOriginX: String(map?.parallaxOriginX ?? 0),
    parallaxOriginY: String(map?.parallaxOriginY ?? 0)
  };
}

export function createPropertiesInspectorLayerDraft(
  layer?: InspectorLayerViewState
): PropertiesInspectorLayerDraft {
  return {
    name: layer?.name ?? "",
    className: layer?.className ?? "",
    visible: layer?.visible ?? true,
    locked: layer?.locked ?? false,
    opacity: String(layer?.opacity ?? 1),
    offsetX: String(layer?.offsetX ?? 0),
    offsetY: String(layer?.offsetY ?? 0),
    parallaxX: String(layer?.parallaxX ?? 1),
    parallaxY: String(layer?.parallaxY ?? 1),
    tintColor: layer?.tintColor ?? "",
    blendMode: layer?.blendMode ?? "normal",
    drawOrder: layer?.kind === "object" ? (layer.drawOrder ?? "topdown") : "topdown",
    imagePath: layer?.kind === "image" ? (layer.imagePath ?? "") : "",
    repeatX: layer?.kind === "image" ? (layer.repeatX ?? false) : false,
    repeatY: layer?.kind === "image" ? (layer.repeatY ?? false) : false
  };
}

export function createPropertiesInspectorObjectDraft(
  object?: InspectorObjectViewState
): PropertiesInspectorObjectDraft {
  return {
    name: object?.name ?? "",
    className: object?.className ?? "",
    x: String(object?.x ?? 0),
    y: String(object?.y ?? 0),
    width: String(object?.width ?? 0),
    height: String(object?.height ?? 0),
    rotation: String(object?.rotation ?? 0),
    visible: object?.visible ?? true
  };
}

function buildPropertiesInspectorMapUpdatePatch(input: {
  draft: PropertiesInspectorMapDraft;
  viewState: InspectorMapViewState;
}): UpdateMapDetailsInput | undefined {
  const basePatch = buildMapPropertiesUpdatePatch({
    draft: input.draft,
    viewState: input.viewState
  });
  const parallaxOriginX = Number.parseFloat(input.draft.parallaxOriginX);
  const parallaxOriginY = Number.parseFloat(input.draft.parallaxOriginY);

  if (
    basePatch === undefined ||
    Number.isNaN(parallaxOriginX) ||
    Number.isNaN(parallaxOriginY)
  ) {
    return undefined;
  }

  return {
    ...basePatch,
    parallaxOriginX,
    parallaxOriginY
  };
}

function buildPropertiesInspectorLayerUpdatePatch(input: {
  draft: PropertiesInspectorLayerDraft;
  viewState: InspectorLayerViewState;
}): UpdateLayerDetailsInput | undefined {
  const opacity = Number.parseFloat(input.draft.opacity);
  const offsetX = Number.parseFloat(input.draft.offsetX);
  const offsetY = Number.parseFloat(input.draft.offsetY);
  const parallaxX = Number.parseFloat(input.draft.parallaxX);
  const parallaxY = Number.parseFloat(input.draft.parallaxY);

  if (
    Number.isNaN(opacity) ||
    Number.isNaN(offsetX) ||
    Number.isNaN(offsetY) ||
    Number.isNaN(parallaxX) ||
    Number.isNaN(parallaxY)
  ) {
    return undefined;
  }

  return {
    name: input.draft.name.trim() || input.viewState.name,
    className: input.draft.className,
    visible: input.draft.visible,
    locked: input.draft.locked,
    opacity: Math.max(0, Math.min(opacity, 1)),
    offsetX,
    offsetY,
    parallaxX,
    parallaxY,
    tintColor: input.draft.tintColor,
    blendMode: input.draft.blendMode,
    ...(input.viewState.kind === "object"
      ? { drawOrder: input.draft.drawOrder }
      : {}),
    ...(input.viewState.kind === "image"
      ? {
          imagePath: input.draft.imagePath.trim(),
          repeatX: input.draft.repeatX,
          repeatY: input.draft.repeatY
        }
      : {})
  };
}

function buildPropertiesInspectorObjectUpdatePatch(input: {
  draft: PropertiesInspectorObjectDraft;
  viewState: InspectorObjectViewState;
}): UpdateMapObjectDetailsInput | undefined {
  const x = Number.parseFloat(input.draft.x);
  const y = Number.parseFloat(input.draft.y);
  const width = Number.parseFloat(input.draft.width);
  const height = Number.parseFloat(input.draft.height);
  const rotation = Number.parseFloat(input.draft.rotation);

  if (
    Number.isNaN(x) ||
    Number.isNaN(y) ||
    Number.isNaN(width) ||
    Number.isNaN(height) ||
    Number.isNaN(rotation)
  ) {
    return undefined;
  }

  return {
    name: input.draft.name.trim() || input.viewState.name,
    className: input.draft.className,
    x,
    y,
    width,
    height,
    rotation,
    visible: input.draft.visible
  };
}

export function resolvePropertiesInspectorMapDraftCommit(input: {
  draft: PropertiesInspectorMapDraft;
  viewState: InspectorMapViewState;
}): PropertiesInspectorDraftCommitResolution<
  PropertiesInspectorMapDraft,
  UpdateMapDetailsInput
> {
  const patch = buildPropertiesInspectorMapUpdatePatch(input);

  return {
    nextDraft:
      patch === undefined
        ? createPropertiesInspectorMapDraft(input.viewState)
        : input.draft,
    ...(patch === undefined ? {} : { patch })
  };
}

export function resolvePropertiesInspectorLayerDraftCommit(input: {
  draft: PropertiesInspectorLayerDraft;
  viewState: InspectorLayerViewState;
}): PropertiesInspectorDraftCommitResolution<
  PropertiesInspectorLayerDraft,
  UpdateLayerDetailsInput
> {
  const patch = buildPropertiesInspectorLayerUpdatePatch(input);

  return {
    nextDraft:
      patch === undefined
        ? createPropertiesInspectorLayerDraft(input.viewState)
        : input.draft,
    ...(patch === undefined ? {} : { patch })
  };
}

export function resolvePropertiesInspectorObjectDraftCommit(input: {
  draft: PropertiesInspectorObjectDraft;
  viewState: InspectorObjectViewState;
}): PropertiesInspectorDraftCommitResolution<
  PropertiesInspectorObjectDraft,
  UpdateMapObjectDetailsInput
> {
  const patch = buildPropertiesInspectorObjectUpdatePatch(input);

  return {
    nextDraft:
      patch === undefined
        ? createPropertiesInspectorObjectDraft(input.viewState)
        : input.draft,
    ...(patch === undefined ? {} : { patch })
  };
}
