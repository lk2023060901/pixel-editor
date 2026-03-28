import type { EditorController } from "./controller";

export type LayersPanelStore = Pick<
  EditorController,
  | "addTileLayer"
  | "addObjectLayer"
  | "addImageLayer"
  | "addGroupLayer"
  | "setActiveLayer"
  | "toggleLayerVisibility"
  | "toggleLayerLock"
  | "moveActiveLayer"
  | "removeActiveLayer"
  | "toggleOtherLayersVisibility"
  | "toggleOtherLayersLock"
  | "toggleHighlightCurrentLayer"
>;

export type TileAnimationEditorStore = Pick<EditorController, "updateSelectedTileAnimation">;

export type ShapeFillControlsStore = Pick<EditorController, "setShapeFillMode">;

export type TilePropertiesEditorStore = Pick<
  EditorController,
  "updateSelectedTileMetadata" | "upsertSelectedTileProperty" | "removeSelectedTileProperty"
>;

export type ProjectPropertyTypesEditorStore = Pick<
  EditorController,
  "replaceProjectPropertyTypes"
>;

export type MapPropertiesPanelStore = Pick<EditorController, "updateActiveMapDetails">;

export type TilesetDetailsFormStore = Pick<EditorController, "updateActiveTilesetDetails">;

export type TilesetCreateFormsStore = Pick<
  EditorController,
  "createSpriteSheetTileset" | "createImageCollectionTileset"
>;

export type TilesetsPanelStore = TilesetDetailsFormStore &
  TilesetCreateFormsStore &
  TilePropertiesEditorStore &
  Pick<EditorController, "setActiveTileset" | "selectStampTile">;

export type TileCollisionEditorStore = Pick<
  EditorController,
  | "updateSelectedTileCollisionObjectDetails"
  | "removeSelectedTileCollisionObjects"
  | "createSelectedTileCollisionObject"
  | "reorderSelectedTileCollisionObjects"
  | "moveSelectedTileCollisionObjects"
  | "removeSelectedTileCollisionObjectProperty"
  | "upsertSelectedTileCollisionObjectProperty"
>;

export type ObjectsPanelStore = Pick<
  EditorController,
  | "createRectangleObject"
  | "removeSelectedObjects"
  | "copySelectedObjectsToClipboard"
  | "cutSelectedObjectsToClipboard"
  | "pasteClipboardToActiveObjectLayer"
  | "selectObject"
>;

export type SaveTemplateDialogStore = Pick<
  EditorController,
  "createTemplateFromSelectedObject"
>;

export type PropertiesInspectorStore = Pick<
  EditorController,
  | "updateActiveMapDetails"
  | "upsertActiveMapProperty"
  | "removeActiveMapProperty"
  | "updateActiveLayerDetails"
  | "upsertActiveLayerProperty"
  | "removeActiveLayerProperty"
  | "updateSelectedObjectDetails"
  | "upsertSelectedObjectProperty"
  | "removeSelectedObjectProperty"
>;

export type TerrainSetsPanelStore = Pick<
  EditorController,
  | "setActiveTileset"
  | "updateActiveTilesetWangSet"
  | "createActiveTilesetWangSet"
  | "removeActiveTilesetWangSet"
>;

export type TileSelectionControlsStore = Pick<
  EditorController,
  | "copySelectedTilesToClipboard"
  | "cutSelectedTilesToClipboard"
  | "pasteClipboardToSelection"
  | "captureSelectedTilesAsStamp"
>;

export type ProjectPropertiesDialogStore = Pick<
  EditorController,
  "updateProjectDetails"
>;

export type MiniMapPanelStore = Pick<EditorController, "setViewportOrigin">;

export type EditorShellActionStore = Pick<
  EditorController,
  | "setActiveTool"
  | "createQuickMapDocument"
  | "undo"
  | "redo"
  | "saveActiveDocument"
  | "saveAllDocuments"
  | "exportActiveDocumentAsJson"
  | "toggleGrid"
  | "toggleWorlds"
  | "toggleAutoMapWhileDrawing"
  | "toggleHighlightCurrentLayer"
  | "runManualAutomapping"
  | "zoomIn"
  | "zoomOut"
  | "setViewportZoom"
  | "addTileLayer"
  | "addObjectLayer"
  | "addImageLayer"
  | "addGroupLayer"
  | "removeActiveLayer"
  | "toggleLayerVisibility"
  | "toggleLayerLock"
  | "toggleOtherLayersVisibility"
  | "toggleOtherLayersLock"
  | "moveActiveLayer"
  | "setShapeFillMode"
>;

export type EditorShellSnapshotStore = Pick<EditorController, "getSnapshot" | "subscribe">;

export type EditorShellFileActionsStore = Pick<
  EditorController,
  "exportActiveMapImage" | "exportActiveTilesetAsJson"
>;

export type EditorShellTemplateActionsStore = Pick<
  EditorController,
  | "detachSelectedTemplateInstances"
  | "replaceSelectedObjectsWithActiveTemplate"
  | "resetSelectedTemplateInstances"
>;

export type EditorShellDocumentNavigationStore = Pick<
  EditorController,
  "setActiveMap" | "setActiveTileset" | "setActiveTemplate"
>;

export type EditorShellCanvasInteractionStore = Pick<
  EditorController,
  | "setActiveMap"
  | "moveWorldMap"
  | "beginCanvasStroke"
  | "updateCanvasStroke"
  | "endCanvasStroke"
  | "selectObject"
  | "beginObjectMove"
  | "updateObjectMove"
  | "endObjectMove"
  | "beginObjectResize"
  | "updateObjectResize"
  | "endObjectResize"
>;

export type EditorShellIssuesStore = Pick<
  EditorController,
  "clearIssues" | "closeIssuesPanel"
>;

export type EditorShellStatusBarStore = Pick<
  EditorController,
  "toggleIssuesPanel" | "setActiveLayer" | "setViewportZoom"
>;

export type EditorShellStore = EditorShellActionStore &
  MiniMapPanelStore &
  EditorShellSnapshotStore &
  EditorShellFileActionsStore &
  EditorShellTemplateActionsStore &
  EditorShellDocumentNavigationStore &
  EditorShellCanvasInteractionStore &
  EditorShellIssuesStore &
  EditorShellStatusBarStore &
  LayersPanelStore &
  TileAnimationEditorStore &
  TilesetsPanelStore &
  TileCollisionEditorStore &
  ObjectsPanelStore &
  SaveTemplateDialogStore &
  PropertiesInspectorStore &
  TerrainSetsPanelStore &
  TileSelectionControlsStore &
  ProjectPropertiesDialogStore &
  ProjectPropertyTypesEditorStore;
