import type {
  MapPropertiesPanelViewState,
  ObjectsPanelObjectItem,
  PropertiesInspectorLayerViewState,
  PropertiesInspectorObjectViewState,
  TerrainSetsPanelWangSetItemViewState,
  TilesetDetailsViewState,
  TilesetsPanelTilesetItemViewState
} from "@pixel-editor/app-services/ui";
import type { I18nMessageKey, TranslationFn } from "@pixel-editor/i18n";

type DocumentKind = "map" | "tileset" | "template" | "world";
type FeatureStatusValue = "未开始" | "开发中" | "测试中" | "已完成";
type MapOrientation = MapPropertiesPanelViewState["orientation"];
type MapRenderOrder = MapPropertiesPanelViewState["renderOrder"];
type ObjectShape = PropertiesInspectorObjectViewState["shape"] | ObjectsPanelObjectItem["shape"];
type BlendMode = Exclude<PropertiesInspectorLayerViewState["blendMode"], undefined>;
type ProjectAssetKind = "folder" | "project" | "map" | "tileset" | "template" | "world" | "image" | "file";
type TilesetKind =
  | TilesetsPanelTilesetItemViewState["kind"]
  | TilesetDetailsViewState["kind"];
type TilesetObjectAlignment = TilesetDetailsViewState["objectAlignment"];
type TilesetTileRenderSize = TilesetDetailsViewState["tileRenderSize"];
type TilesetFillMode = TilesetDetailsViewState["fillMode"];
type WangSetType = TerrainSetsPanelWangSetItemViewState["type"];
type PropertyTypeName =
  | "string"
  | "int"
  | "float"
  | "bool"
  | "color"
  | "file"
  | "object"
  | "enum"
  | "class";
type PropertyTypeUseAs =
  | "property"
  | "map"
  | "layer"
  | "object"
  | "tile"
  | "tileset"
  | "wangcolor"
  | "wangset"
  | "project"
  | "world"
  | "template";

export function getDocumentKindLabel(
  kind: DocumentKind,
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
  kind: "tile" | "object" | "image" | "group",
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
  kind: TilesetKind,
  t: TranslationFn
): string {
  return t(`tilesetKind.${kind}` as I18nMessageKey);
}

export function getWangSetTypeLabel(
  type: WangSetType,
  t: TranslationFn
): string {
  return t(`wangSetType.${type}` as I18nMessageKey);
}

export function getOrientationLabel(
  orientation: MapOrientation,
  t: TranslationFn
): string {
  return t(`mapOrientation.${orientation}` as I18nMessageKey);
}

export function getRenderOrderLabel(
  renderOrder: MapRenderOrder,
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

export function getBlendModeLabel(
  blendMode: BlendMode,
  t: TranslationFn
): string {
  return t(`layerBlendMode.${blendMode}` as I18nMessageKey);
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
  value: PropertyTypeName,
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
