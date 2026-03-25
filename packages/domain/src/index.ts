export {
  createEntityId,
  type EntityId,
  type LayerId,
  type MapId,
  type ObjectId,
  type ProjectId,
  type PropertyTypeId,
  type TemplateId,
  type TileId,
  type TilesetId,
  type WorldId
} from "./id";
export {
  clonePropertyDefinition,
  clonePropertyValue,
  createDefaultPropertyValue,
  createProperty,
  getClassPropertyTypeDefinitionByName,
  getEnumPropertyTypeDefinitionByName,
  getPropertyTypeDefinitionByName,
  removePropertyDefinition,
  type ClassPropertyFieldDefinition,
  type ClassPropertyValue,
  type ClassPropertyTypeDefinition,
  type EnumPropertyTypeDefinition,
  type ObjectReferenceValue,
  type PropertyDefinition,
  type PropertyTypeDefinition,
  type PropertyTypeName,
  type PropertyValue,
  type PrimitivePropertyType,
  upsertPropertyDefinition
} from "./property";
export { createMapObject, type CreateObjectInput, type MapObject, type ObjectShape, type Point } from "./object";
export {
  appendObjectsToLayer,
  cloneMapObject,
  getMapObjectBounds,
  getObjectById,
  removeObjectsFromLayer,
  translateMapObject,
  translateObjectsInLayer,
  updateMapObject,
  type UpdateMapObjectDetailsInput,
  type ObjectBoundsRect
} from "./object-operations";
export {
  createTileDefinition,
  createTileset,
  type CreateTilesetInput,
  type TilesetFillMode,
  type TileAnimationFrame,
  type TileDefinition,
  type TilesetDefinition,
  type TilesetImageSource,
  type TilesetKind,
  type TilesetObjectAlignment,
  type TilesetTileRenderSize,
  type WangSetDefinition
} from "./tileset";
export {
  attachTilesetToMap,
  createImageCollectionTileset,
  createImageTileset,
  getMapGlobalTileGid,
  getTilesetTileByLocalId,
  getTilesetTileCount,
  listTilesetLocalIds,
  removeTilesetTileProperty,
  resolveMapTileGid,
  updateTilesetDetails,
  updateTilesetTileMetadata,
  upsertTilesetTileProperty,
  type CreateImageCollectionTilesetInput,
  type CreateImageTilesetInput,
  type UpdateTileMetadataInput,
  type UpdateTilesetDetailsInput
} from "./tileset-operations";
export {
  createEmptyTileCell,
  createGroupLayer,
  createImageLayer,
  createObjectLayer,
  createTileLayer,
  type BlendMode,
  type CreateGroupLayerInput,
  type CreateImageLayerInput,
  type CreateObjectLayerInput,
  type CreateTileLayerInput,
  type GroupLayer,
  type ImageLayer,
  type LayerDefinition,
  type ObjectLayer,
  type TileCell,
  type TileChunk,
  type TileLayer
} from "./layer";
export { createMap, type CreateMapInput, type EditorMap, type MapOrientation, type MapRenderOrder, type MapSettings } from "./map";
export {
  addTopLevelObjectLayer,
  addTopLevelTileLayer,
  getLayerById,
  moveLayerInMap,
  paintTileInMap,
  removeLayerFromMap,
  updateLayerInMap,
  updateMapDetails,
  type UpdateMapDetailsInput
} from "./map-operations";
export { createProject, type CreateProjectInput, type EditorProject } from "./project";
export { createObjectTemplate, type ObjectTemplate } from "./template";
export {
  areTileCellsEqual,
  collectConnectedTileRegion,
  convertTileLayerToFinite,
  convertTileLayerToInfinite,
  createTileCell,
  getTileLayerCell,
  getTileLayerBounds,
  isTileCellEmpty,
  resizeTileLayer,
  setTileLayerCell,
  type TileCoordinate,
  type TileLayerBoundsRect
} from "./tile-layer-operations";
export {
  collectEllipseShapeTiles,
  collectRectangleShapeTiles,
  normalizeTileShapeBounds,
  type TileShapeBounds,
  type TileShapeGestureOptions
} from "./tile-shape-operations";
export { createWorld, type EditorWorld, type WorldMapReference } from "./world";
