import { createHistoryCommand, type HistoryCommand } from "@pixel-editor/command-engine";
import {
  attachTilesetToMap,
  createImageCollectionTileset,
  createImageTileset,
  getMapGlobalTileGid,
  getTilesetTileCount,
  removeTilesetTileProperty,
  updateTilesetTileAnimation,
  updateTilesetDetails,
  updateTilesetTileMetadata,
  upsertTilesetTileProperty,
  type CreateImageCollectionTilesetInput,
  type CreateImageTilesetInput,
  type MapId,
  type TileAnimationFrame,
  type PropertyDefinition,
  type TilesetDefinition,
  type TilesetId,
  type UpdateTileMetadataInput,
  type UpdateTilesetDetailsInput
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
