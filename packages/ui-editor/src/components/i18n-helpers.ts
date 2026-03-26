import type {
  DocumentSummary,
  FeatureStatusValue,
  ProjectAssetKind
} from "@pixel-editor/contracts";
import type {
  EditorMap,
  LayerDefinition,
  ObjectShape,
  PropertyDefinition,
  PropertyTypeUseAs,
  TilesetDefinition,
  TilesetFillMode,
  TilesetObjectAlignment,
  TilesetTileRenderSize,
  WangSetDefinition
} from "@pixel-editor/domain";
import type { I18nMessageKey, TranslationFn } from "@pixel-editor/i18n";

export function getDocumentKindLabel(
  kind: DocumentSummary["kind"],
  t: TranslationFn
): string {
  return t(`documentKind.${kind}` as I18nMessageKey);
}

export function getProjectAssetKindLabel(
  kind: ProjectAssetKind,
  t: TranslationFn
): string {
  switch (kind) {
    case "map":
    case "template":
    case "tileset":
    case "world":
      return getDocumentKindLabel(kind, t);
    default:
      return t(`project.assetKind.${kind}` as I18nMessageKey);
  }
}

export function getLayerKindLabel(
  kind: LayerDefinition["kind"],
  t: TranslationFn
): string {
  return t(`layerKind.${kind}` as I18nMessageKey);
}

export function getObjectShapeLabel(
  shape: ObjectShape,
  t: TranslationFn
): string {
  return t(`objectShape.${shape}` as I18nMessageKey);
}

export function getTilesetKindLabel(
  kind: TilesetDefinition["kind"],
  t: TranslationFn
): string {
  return t(`tilesetKind.${kind}` as I18nMessageKey);
}

export function getWangSetTypeLabel(
  type: WangSetDefinition["type"],
  t: TranslationFn
): string {
  return t(`wangSetType.${type}` as I18nMessageKey);
}

export function getOrientationLabel(
  orientation: EditorMap["settings"]["orientation"],
  t: TranslationFn
): string {
  return t(`mapOrientation.${orientation}` as I18nMessageKey);
}

export function getRenderOrderLabel(
  renderOrder: EditorMap["settings"]["renderOrder"],
  t: TranslationFn
): string {
  return t(`mapRenderOrder.${renderOrder}` as I18nMessageKey);
}

export function getObjectDrawOrderLabel(
  drawOrder: "topdown" | "index",
  t: TranslationFn
): string {
  return t(`objectDrawOrder.${drawOrder}` as I18nMessageKey);
}

export function getTilesetObjectAlignmentLabel(
  value: TilesetObjectAlignment,
  t: TranslationFn
): string {
  return t(`tilesetObjectAlignment.${value}` as I18nMessageKey);
}

export function getTilesetRenderSizeLabel(
  value: TilesetTileRenderSize,
  t: TranslationFn
): string {
  return t(`tilesetRenderSize.${value}` as I18nMessageKey);
}

export function getTilesetFillModeLabel(
  value: TilesetFillMode,
  t: TranslationFn
): string {
  return t(`tilesetFillMode.${value}` as I18nMessageKey);
}

export function getPropertyTypeLabel(
  value: PropertyDefinition["type"],
  t: TranslationFn
): string {
  return t(`propertyType.${value}` as I18nMessageKey);
}

export function getPropertyTypeUseAsLabel(
  value: PropertyTypeUseAs,
  t: TranslationFn
): string {
  return t(`propertyTypeUseAs.${value}` as I18nMessageKey);
}

export function getFeatureStatusLabel(
  status: FeatureStatusValue,
  t: TranslationFn
): string {
  return t(`featureStatus.${status}` as I18nMessageKey);
}
