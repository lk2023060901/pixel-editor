import {
  createHistoryCommand,
  type HistoryCommand
} from "@pixel-editor/command-engine";
import {
  appendObjectsToLayer,
  cloneMapObject,
  createMapObject,
  removePropertyDefinition,
  removeObjectsFromLayer,
  translateObjectsInLayer,
  upsertPropertyDefinition,
  updateMapObject,
  updateLayerInMap,
  type LayerId,
  type MapId,
  type MapObject,
  type ObjectBoundsRect,
  type ObjectId,
  type PropertyDefinition,
  type UpdateMapObjectDetailsInput
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

export function moveObjectsCommand(
  mapId: MapId,
  layerId: LayerId,
  objectIds: readonly ObjectId[],
  deltaX: number,
  deltaY: number
): HistoryCommand<EditorWorkspaceState> {
  if (objectIds.length === 0 || (deltaX === 0 && deltaY === 0)) {
    return createHistoryCommand<EditorWorkspaceState>({
      id: "object.move",
      description: "Move empty object selection",
      run: (state) => state
    });
  }

  const selection = [...objectIds];

  return createHistoryCommand({
    id: "object.move",
    description: `Move ${selection.length} object(s)`,
    run: (state) => ({
      ...state,
      maps: state.maps.map((map) =>
        map.id === mapId
          ? updateLayerInMap(map, layerId, (layer) =>
              layer.kind === "object"
                ? translateObjectsInLayer(layer, selection, deltaX, deltaY)
                : layer
            )
          : map
      ),
      session: {
        ...state.session,
        activeLayerId: layerId,
        selection: {
          kind: "object",
          objectIds: selection
        },
        hasUnsavedChanges: true
      }
    })
  });
}

export function updateObjectDetailsCommand(
  mapId: MapId,
  layerId: LayerId,
  objectId: ObjectId,
  patch: UpdateMapObjectDetailsInput
): HistoryCommand<EditorWorkspaceState> {
  return createHistoryCommand({
    id: "object.updateDetails",
    description: `Update object ${objectId}`,
    run: (state) => ({
      ...state,
      maps: state.maps.map((map) =>
        map.id === mapId
          ? updateLayerInMap(map, layerId, (layer) => {
              if (layer.kind !== "object") {
                return layer;
              }

              let changed = false;
              const objects = layer.objects.map((object) => {
                if (object.id !== objectId) {
                  return object;
                }

                changed = true;
                return updateMapObject(object, patch);
              });

              return changed
                ? {
                    ...layer,
                    objects
                  }
                : layer;
            })
          : map
      ),
      session: {
        ...state.session,
        activeLayerId: layerId,
        selection: {
          kind: "object",
          objectIds: [objectId]
        },
        hasUnsavedChanges: true
      }
    })
  });
}

export function upsertObjectPropertyCommand(
  mapId: MapId,
  layerId: LayerId,
  objectId: ObjectId,
  property: PropertyDefinition,
  previousName?: string
): HistoryCommand<EditorWorkspaceState> {
  return createHistoryCommand({
    id: `object.property.upsert:${objectId}`,
    description: `Upsert property ${property.name} on object ${objectId}`,
    run: (state) => ({
      ...state,
      maps: state.maps.map((map) =>
        map.id === mapId
          ? updateLayerInMap(map, layerId, (layer) => {
              if (layer.kind !== "object") {
                return layer;
              }

              return {
                ...layer,
                objects: layer.objects.map((object) =>
                  object.id === objectId
                    ? updateMapObject(object, {
                        properties: upsertPropertyDefinition(
                          object.properties,
                          property,
                          previousName
                        )
                      })
                    : object
                )
              };
            })
          : map
      ),
      session: {
        ...state.session,
        activeLayerId: layerId,
        selection: {
          kind: "object",
          objectIds: [objectId]
        },
        hasUnsavedChanges: true
      }
    })
  });
}

export function removeObjectPropertyCommand(
  mapId: MapId,
  layerId: LayerId,
  objectId: ObjectId,
  propertyName: string
): HistoryCommand<EditorWorkspaceState> {
  return createHistoryCommand({
    id: `object.property.remove:${objectId}:${propertyName}`,
    description: `Remove property ${propertyName} from object ${objectId}`,
    run: (state) => ({
      ...state,
      maps: state.maps.map((map) =>
        map.id === mapId
          ? updateLayerInMap(map, layerId, (layer) => {
              if (layer.kind !== "object") {
                return layer;
              }

              return {
                ...layer,
                objects: layer.objects.map((object) =>
                  object.id === objectId
                    ? updateMapObject(object, {
                        properties: removePropertyDefinition(object.properties, propertyName)
                      })
                    : object
                )
              };
            })
          : map
      ),
      session: {
        ...state.session,
        activeLayerId: layerId,
        selection: {
          kind: "object",
          objectIds: [objectId]
        },
        hasUnsavedChanges: true
      }
    })
  });
}
