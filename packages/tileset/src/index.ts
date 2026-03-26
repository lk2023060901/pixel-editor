import { createHistoryCommand, type HistoryCommand } from "@pixel-editor/command-engine";
import {
  attachTilesetToMap,
  createTilesetWangSet,
  createTilesetTileCollisionObject,
  createImageCollectionTileset,
  createImageTileset,
  getTilesetTileCollisionObject,
  getTilesetWangSet,
  getMapGlobalTileGid,
  getTilesetTileCount,
  moveTilesetTileCollisionObjects,
  removeTilesetWangSet,
  removeTilesetTileCollisionObjectProperty,
  removeTilesetTileCollisionObjects,
  removeTilesetTileProperty,
  reorderTilesetTileCollisionObjects,
  type MapObject,
  type WangSetDefinition,
  updateTilesetTileAnimation,
  updateTilesetWangSet,
  updateTilesetTileCollisionObject,
  updateTilesetDetails,
  updateTilesetTileMetadata,
  type UpdateMapObjectDetailsInput,
  upsertTilesetTileProperty,
  upsertTilesetTileCollisionObjectProperty,
  type CreateImageCollectionTilesetInput,
  type CreateImageTilesetInput,
  type MapId,
  type TileAnimationFrame,
  type PropertyDefinition,
  type TilesetDefinition,
  type TilesetId,
  type UpdateTileMetadataInput,
  type UpdateTilesetDetailsInput,
  type UpdateWangSetInput
} from "@pixel-editor/domain";
import {
  createSingleTileStamp,
  getActiveMap,
  type EditorWorkspaceState
} from "@pixel-editor/editor-state";

function getDefaultTilesetLocalId(tileset: TilesetDefinition): number | null {
  return getTilesetTileCount(tileset) > 0 ? 0 : null;
}

function patchActiveTilesetSession(
  state: EditorWorkspaceState,
  tileset: TilesetDefinition,
  preferredLocalId?: number | null
): EditorWorkspaceState["session"] {
  const activeMap = getActiveMap(state);
  const availableTileCount = getTilesetTileCount(tileset);
  const candidateLocalId = preferredLocalId ?? state.session.activeTilesetTileLocalId;
  const nextLocalId =
    availableTileCount === 0
      ? null
      : Math.max(0, Math.min(candidateLocalId ?? 0, availableTileCount - 1));
  const nextGid =
    activeMap && nextLocalId !== null
      ? getMapGlobalTileGid(activeMap, state.tilesets, tileset.id, nextLocalId)
      : undefined;

  return {
    ...state.session,
    activeTilesetId: tileset.id,
    activeTilesetTileLocalId: nextLocalId,
    ...(nextGid !== undefined ? { activeStamp: createSingleTileStamp(nextGid) } : {}),
    ...(nextGid !== undefined ? { activeTool: "stamp" as const } : {})
  };
}

function updateWorkspaceTileset(
  state: EditorWorkspaceState,
  tilesetId: TilesetId,
  updater: (tileset: TilesetDefinition) => TilesetDefinition
): EditorWorkspaceState {
  let updatedTileset: TilesetDefinition | undefined;
  const nextTilesets = state.tilesets.map((tileset) => {
    if (tileset.id !== tilesetId) {
      return tileset;
    }

    updatedTileset = updater(tileset);
    return updatedTileset;
  });

  if (!updatedTileset) {
    return state;
  }

  return {
    ...state,
    tilesets: nextTilesets,
    session:
      state.session.activeTilesetId === tilesetId
        ? patchActiveTilesetSession(
            {
              ...state,
              tilesets: nextTilesets
            },
            updatedTileset
          )
        : state.session
  };
}

export function setActiveTilesetCommand(
  tilesetId: TilesetId
): HistoryCommand<EditorWorkspaceState> {
  return createHistoryCommand({
    id: "tileset.setActive",
    description: `Set active tileset ${tilesetId}`,
    run: (state) => {
      const tileset = state.tilesets.find((entry) => entry.id === tilesetId);

      if (!tileset) {
        return state;
      }

      return {
        ...state,
        session: patchActiveTilesetSession(state, tileset, getDefaultTilesetLocalId(tileset))
      };
    },
    canMerge: (next) => next.id === "tileset.setActive",
    merge: (next) => next
  });
}

export function selectTilesetStampCommand(
  tilesetId: TilesetId,
  localId: number
): HistoryCommand<EditorWorkspaceState> {
  return createHistoryCommand({
    id: "tileset.selectStamp",
    description: `Select tile ${localId} from tileset ${tilesetId}`,
    run: (state) => {
      const tileset = state.tilesets.find((entry) => entry.id === tilesetId);

      if (!tileset) {
        return state;
      }

      return {
        ...state,
        session: patchActiveTilesetSession(state, tileset, localId)
      };
    },
    canMerge: (next) => next.id === "tileset.selectStamp",
    merge: (next) => next
  });
}

function addTilesetToWorkspace(
  state: EditorWorkspaceState,
  tileset: TilesetDefinition,
  mapId?: MapId
): EditorWorkspaceState {
  const nextTilesets = [...state.tilesets, tileset];
  const nextMaps = state.maps.map((map) =>
    map.id === mapId ? attachTilesetToMap(map, tileset.id) : map
  );
  const nextState = {
    ...state,
    maps: nextMaps,
    tilesets: nextTilesets
  };
  const nextSession = patchActiveTilesetSession(
    nextState,
    tileset,
    getDefaultTilesetLocalId(tileset)
  );

  return {
    ...nextState,
    session: {
      ...nextSession,
      hasUnsavedChanges: true
    }
  };
}

export function addImportedTilesetCommand(input: {
  mapId?: MapId;
  tileset: TilesetDefinition;
}): HistoryCommand<EditorWorkspaceState> {
  return createHistoryCommand({
    id: "tileset.import",
    description: `Import tileset ${input.tileset.name}`,
    run: (state) => addTilesetToWorkspace(state, input.tileset, input.mapId)
  });
}

export function createImageTilesetCommand(input: {
  mapId?: MapId;
  tileset: CreateImageTilesetInput;
}): HistoryCommand<EditorWorkspaceState> {
  const tileset = createImageTileset(input.tileset);

  return createHistoryCommand({
    id: "tileset.createImage",
    description: `Create image tileset ${tileset.name}`,
    run: (state) => addTilesetToWorkspace(state, tileset, input.mapId)
  });
}

export function createImageCollectionTilesetCommand(input: {
  mapId?: MapId;
  tileset: CreateImageCollectionTilesetInput;
}): HistoryCommand<EditorWorkspaceState> {
  const tileset = createImageCollectionTileset(input.tileset);

  return createHistoryCommand({
    id: "tileset.createCollection",
    description: `Create image collection tileset ${tileset.name}`,
    run: (state) => addTilesetToWorkspace(state, tileset, input.mapId)
  });
}

export function updateTilesetDetailsCommand(
  tilesetId: TilesetId,
  patch: UpdateTilesetDetailsInput
): HistoryCommand<EditorWorkspaceState> {
  return createHistoryCommand({
    id: `tileset.update:${tilesetId}`,
    description: `Update tileset ${tilesetId}`,
    run: (state) =>
      updateWorkspaceTileset(state, tilesetId, (tileset) => updateTilesetDetails(tileset, patch)),
    canMerge: (next) => next.id === `tileset.update:${tilesetId}`,
    merge: (next) => next
  });
}

export function updateTilesetTileMetadataCommand(
  tilesetId: TilesetId,
  localId: number,
  patch: UpdateTileMetadataInput
): HistoryCommand<EditorWorkspaceState> {
  return createHistoryCommand({
    id: `tileset.tile.update:${tilesetId}:${localId}`,
    description: `Update tile ${localId} in tileset ${tilesetId}`,
    run: (state) =>
      updateWorkspaceTileset(state, tilesetId, (tileset) =>
        updateTilesetTileMetadata(tileset, localId, patch)
      ),
    canMerge: (next) => next.id === `tileset.tile.update:${tilesetId}:${localId}`,
    merge: (next) => next
  });
}

export function upsertTilesetTilePropertyCommand(
  tilesetId: TilesetId,
  localId: number,
  property: PropertyDefinition,
  previousName?: string
): HistoryCommand<EditorWorkspaceState> {
  return createHistoryCommand({
    id: `tileset.tile.property.upsert:${tilesetId}:${localId}`,
    description: `Upsert property ${property.name} on tile ${localId}`,
    run: (state) =>
      updateWorkspaceTileset(state, tilesetId, (tileset) =>
        upsertTilesetTileProperty(tileset, localId, property, previousName)
      )
  });
}

export function removeTilesetTilePropertyCommand(
  tilesetId: TilesetId,
  localId: number,
  propertyName: string
): HistoryCommand<EditorWorkspaceState> {
  return createHistoryCommand({
    id: `tileset.tile.property.remove:${tilesetId}:${localId}:${propertyName}`,
    description: `Remove property ${propertyName} from tile ${localId}`,
    run: (state) =>
      updateWorkspaceTileset(state, tilesetId, (tileset) =>
        removeTilesetTileProperty(tileset, localId, propertyName)
      )
  });
}

export function updateTilesetTileAnimationCommand(
  tilesetId: TilesetId,
  localId: number,
  animation: readonly TileAnimationFrame[]
): HistoryCommand<EditorWorkspaceState> {
  return createHistoryCommand({
    id: `tileset.tile.animation:${tilesetId}:${localId}`,
    description: `Update animation for tile ${localId} in tileset ${tilesetId}`,
    run: (state) =>
      updateWorkspaceTileset(state, tilesetId, (tileset) =>
        updateTilesetTileAnimation(tileset, localId, animation)
      ),
    canMerge: (next) => next.id === `tileset.tile.animation:${tilesetId}:${localId}`,
    merge: (next) => next
  });
}

export function createTilesetWangSetCommand(
  tilesetId: TilesetId,
  wangSet: WangSetDefinition
): HistoryCommand<EditorWorkspaceState> {
  return createHistoryCommand({
    id: `tileset.wangSet.create:${tilesetId}:${wangSet.id}`,
    description: `Create Wang set ${wangSet.name} in tileset ${tilesetId}`,
    run: (state) =>
      updateWorkspaceTileset(state, tilesetId, (tileset) =>
        createTilesetWangSet(tileset, wangSet)
      )
  });
}

export function updateTilesetWangSetCommand(
  tilesetId: TilesetId,
  wangSetId: WangSetDefinition["id"],
  patch: UpdateWangSetInput
): HistoryCommand<EditorWorkspaceState> {
  return createHistoryCommand({
    id: `tileset.wangSet.update:${tilesetId}:${wangSetId}`,
    description: `Update Wang set ${wangSetId} in tileset ${tilesetId}`,
    run: (state) =>
      updateWorkspaceTileset(state, tilesetId, (tileset) =>
        updateTilesetWangSet(tileset, wangSetId, patch)
      ),
    canMerge: (next) => next.id === `tileset.wangSet.update:${tilesetId}:${wangSetId}`,
    merge: (next) => next
  });
}

export function removeTilesetWangSetCommand(
  tilesetId: TilesetId,
  wangSetId: WangSetDefinition["id"]
): HistoryCommand<EditorWorkspaceState> {
  return createHistoryCommand({
    id: `tileset.wangSet.remove:${tilesetId}:${wangSetId}`,
    description: `Remove Wang set ${wangSetId} from tileset ${tilesetId}`,
    run: (state) =>
      updateWorkspaceTileset(state, tilesetId, (tileset) =>
        removeTilesetWangSet(tileset, wangSetId)
      )
  });
}

export function createTilesetTileCollisionObjectCommand(
  tilesetId: TilesetId,
  localId: number,
  object: MapObject
): HistoryCommand<EditorWorkspaceState> {
  return createHistoryCommand({
    id: `tileset.tile.collision.object.add:${tilesetId}:${localId}`,
    description: `Add collision object ${object.name} to tile ${localId}`,
    run: (state) =>
      updateWorkspaceTileset(state, tilesetId, (tileset) =>
        createTilesetTileCollisionObject(tileset, localId, object)
      )
  });
}

export function updateTilesetTileCollisionObjectCommand(
  tilesetId: TilesetId,
  localId: number,
  objectId: MapObject["id"],
  patch: UpdateMapObjectDetailsInput
): HistoryCommand<EditorWorkspaceState> {
  return createHistoryCommand({
    id: `tileset.tile.collision.object.update:${tilesetId}:${localId}:${objectId}`,
    description: `Update collision object ${objectId} on tile ${localId}`,
    run: (state) =>
      updateWorkspaceTileset(state, tilesetId, (tileset) =>
        updateTilesetTileCollisionObject(tileset, localId, objectId, patch)
      ),
    canMerge: (next) =>
      next.id === `tileset.tile.collision.object.update:${tilesetId}:${localId}:${objectId}`,
    merge: (next) => next
  });
}

export function upsertTilesetTileCollisionObjectPropertyCommand(
  tilesetId: TilesetId,
  localId: number,
  objectId: MapObject["id"],
  property: PropertyDefinition,
  previousName?: string
): HistoryCommand<EditorWorkspaceState> {
  return createHistoryCommand({
    id: `tileset.tile.collision.object.property.upsert:${tilesetId}:${localId}:${objectId}`,
    description: `Upsert property ${property.name} on collision object ${objectId}`,
    run: (state) =>
      updateWorkspaceTileset(state, tilesetId, (tileset) =>
        upsertTilesetTileCollisionObjectProperty(
          tileset,
          localId,
          objectId,
          property,
          previousName
        )
      )
  });
}

export function removeTilesetTileCollisionObjectPropertyCommand(
  tilesetId: TilesetId,
  localId: number,
  objectId: MapObject["id"],
  propertyName: string
): HistoryCommand<EditorWorkspaceState> {
  return createHistoryCommand({
    id: `tileset.tile.collision.object.property.remove:${tilesetId}:${localId}:${objectId}:${propertyName}`,
    description: `Remove property ${propertyName} from collision object ${objectId}`,
    run: (state) =>
      updateWorkspaceTileset(state, tilesetId, (tileset) =>
        removeTilesetTileCollisionObjectProperty(tileset, localId, objectId, propertyName)
      )
  });
}

export function removeTilesetTileCollisionObjectsCommand(
  tilesetId: TilesetId,
  localId: number,
  objectIds: readonly MapObject["id"][]
): HistoryCommand<EditorWorkspaceState> {
  return createHistoryCommand({
    id: `tileset.tile.collision.object.remove:${tilesetId}:${localId}`,
    description: `Remove ${objectIds.length} collision object(s) from tile ${localId}`,
    run: (state) =>
      updateWorkspaceTileset(state, tilesetId, (tileset) =>
        removeTilesetTileCollisionObjects(tileset, localId, objectIds)
      )
  });
}

export function moveTilesetTileCollisionObjectsCommand(
  tilesetId: TilesetId,
  localId: number,
  objectIds: readonly MapObject["id"][],
  deltaX: number,
  deltaY: number
): HistoryCommand<EditorWorkspaceState> {
  return createHistoryCommand({
    id: `tileset.tile.collision.object.move:${tilesetId}:${localId}`,
    description: `Move ${objectIds.length} collision object(s) on tile ${localId}`,
    run: (state) =>
      updateWorkspaceTileset(state, tilesetId, (tileset) =>
        moveTilesetTileCollisionObjects(tileset, localId, objectIds, deltaX, deltaY)
      )
  });
}

export function reorderTilesetTileCollisionObjectsCommand(
  tilesetId: TilesetId,
  localId: number,
  objectIds: readonly MapObject["id"][],
  direction: "up" | "down"
): HistoryCommand<EditorWorkspaceState> {
  return createHistoryCommand({
    id: `tileset.tile.collision.object.reorder:${tilesetId}:${localId}:${direction}`,
    description: `Reorder ${objectIds.length} collision object(s) ${direction} on tile ${localId}`,
    run: (state) =>
      updateWorkspaceTileset(state, tilesetId, (tileset) =>
        reorderTilesetTileCollisionObjects(tileset, localId, objectIds, direction)
      )
  });
}

export function getActiveTilesetTileCollisionObject(
  state: EditorWorkspaceState,
  tilesetId: TilesetId,
  localId: number,
  objectId: MapObject["id"]
): MapObject | undefined {
  const tileset = state.tilesets.find((entry) => entry.id === tilesetId);

  if (!tileset) {
    return undefined;
  }

  return getTilesetTileCollisionObject(tileset, localId, objectId);
}

export function getActiveTilesetWangSet(
  state: EditorWorkspaceState,
  tilesetId: TilesetId,
  wangSetId: WangSetDefinition["id"]
): WangSetDefinition | undefined {
  const tileset = state.tilesets.find((entry) => entry.id === tilesetId);

  if (!tileset) {
    return undefined;
  }

  return getTilesetWangSet(tileset, wangSetId);
}
