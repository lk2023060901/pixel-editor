import {
  createHistoryCommand,
  type HistoryCommand
} from "@pixel-editor/command-engine";
import {
  appendObjectsToLayer,
  cloneMapObject,
  createMapObject,
  removeObjectsFromLayer,
  updateLayerInMap,
  type LayerId,
  type MapId,
  type MapObject,
  type ObjectBoundsRect,
  type ObjectId
} from "@pixel-editor/domain";
import type {
  EditorWorkspaceState,
  SelectionState
} from "@pixel-editor/editor-state";

export function selectObjectsCommand(
  objectIds: ObjectId[]
): HistoryCommand<EditorWorkspaceState> {
  return createHistoryCommand({
    id: "selection.object",
    description: `Select ${objectIds.length} object(s)`,
    run: (state) => ({
      ...state,
      session: {
        ...state.session,
        selection: {
          kind: "object",
          objectIds
        }
      }
    }),
    canMerge: (next) => next.id === "selection.object",
    merge: (next) => next
  });
}

export function selectObjectCommand(
  objectId: ObjectId
): HistoryCommand<EditorWorkspaceState> {
  return selectObjectsCommand([objectId]);
}

export function addObjectCommand(
  mapId: MapId,
  layerId: LayerId,
  object: MapObject
): HistoryCommand<EditorWorkspaceState> {
  return createHistoryCommand({
    id: "object.add",
    description: `Add object ${object.name}`,
    run: (state) => ({
      ...state,
      maps: state.maps.map((map) =>
        map.id === mapId
          ? updateLayerInMap(map, layerId, (layer) =>
              layer.kind === "object"
                ? appendObjectsToLayer(layer, [object])
                : layer
            )
          : map
      ),
      session: {
        ...state.session,
        activeLayerId: layerId,
        selection: {
          kind: "object",
          objectIds: [object.id]
        },
        hasUnsavedChanges: true
      }
    })
  });
}

export function createRectangleObjectCommand(
  mapId: MapId,
  layerId: LayerId,
  input: {
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }
): HistoryCommand<EditorWorkspaceState> {
  return addObjectCommand(
    mapId,
    layerId,
    createMapObject({
      name: input.name,
      shape: "rectangle",
      x: input.x,
      y: input.y,
      width: input.width,
      height: input.height
    })
  );
}

export function removeSelectedObjectsCommand(
  mapId: MapId,
  layerId: LayerId,
  selection: SelectionState
): HistoryCommand<EditorWorkspaceState> {
  if (selection.kind !== "object" || selection.objectIds.length === 0) {
    return createHistoryCommand<EditorWorkspaceState>({
      id: "object.remove",
      description: "Remove empty object selection",
      run: (state) => state
    });
  }

  const objectIds = [...selection.objectIds];

  return createHistoryCommand({
    id: "object.remove",
    description: `Remove ${objectIds.length} object(s)`,
    run: (state) => ({
      ...state,
      maps: state.maps.map((map) =>
        map.id === mapId
          ? updateLayerInMap(map, layerId, (layer) =>
              layer.kind === "object"
                ? removeObjectsFromLayer(layer, objectIds)
                : layer
            )
          : map
      ),
      session: {
        ...state.session,
        selection: { kind: "none" },
        hasUnsavedChanges: true
      }
    })
  });
}

export function pasteObjectClipboardCommand(
  mapId: MapId,
  layerId: LayerId,
  anchorX: number,
  anchorY: number,
  objects: readonly MapObject[],
  sourceBounds: ObjectBoundsRect
): HistoryCommand<EditorWorkspaceState> {
  if (objects.length === 0) {
    return createHistoryCommand<EditorWorkspaceState>({
      id: "clipboard.objectPaste",
      description: "Paste empty object clipboard",
      run: (state) => state
    });
  }

  const offsetX = anchorX - sourceBounds.x;
  const offsetY = anchorY - sourceBounds.y;
  const clonedObjects = objects.map((object) =>
    cloneMapObject(object, {
      x: object.x + offsetX,
      y: object.y + offsetY
    })
  );

  return createHistoryCommand({
    id: "clipboard.objectPaste",
    description: `Paste ${clonedObjects.length} object(s)`,
    run: (state) => ({
      ...state,
      maps: state.maps.map((map) =>
        map.id === mapId
          ? updateLayerInMap(map, layerId, (layer) =>
              layer.kind === "object"
                ? appendObjectsToLayer(layer, clonedObjects)
                : layer
            )
          : map
      ),
      session: {
        ...state.session,
        activeLayerId: layerId,
        selection: {
          kind: "object",
          objectIds: clonedObjects.map((object) => object.id)
        },
        hasUnsavedChanges: true
      }
    })
  });
}
