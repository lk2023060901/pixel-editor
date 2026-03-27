import type { BlendMode } from "@pixel-editor/domain";
import { Color } from "pixi.js";

export const DEFAULT_LAYER_BLEND_MODE: BlendMode = "normal";
export const DEFAULT_LAYER_TINT = 0xffffff;

export function resolveLayerTintColor(
  tintColor?: string
): number | undefined {
  const normalizedTintColor = tintColor?.trim();

  if (!normalizedTintColor) {
    return undefined;
  }

  try {
    return new Color(normalizedTintColor).toNumber();
  } catch {
    return undefined;
  }
}

export function combineLayerTintColor(
  inheritedTintColor: number | undefined,
  tintColor?: string
): number | undefined {
  const localTintColor = resolveLayerTintColor(tintColor);

  if (inheritedTintColor === undefined) {
    return localTintColor;
  }

  if (localTintColor === undefined) {
    return inheritedTintColor;
  }

  return new Color(inheritedTintColor).multiply(localTintColor).toNumber();
}

export function resolveEffectiveLayerBlendMode(
  inheritedBlendMode: BlendMode,
  blendMode: BlendMode
): BlendMode {
  return blendMode !== DEFAULT_LAYER_BLEND_MODE
    ? blendMode
    : inheritedBlendMode;
}
