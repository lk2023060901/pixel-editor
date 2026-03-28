import type { TileCollisionEditorViewState } from "./ui-models";
import type { TileCollisionEditorStore } from "./ui-store";

export type TileCollisionEditorObject = TileCollisionEditorViewState["collisionObjects"][number];
export type TileCollisionEditorObjectId = TileCollisionEditorObject["id"];
export type TileCollisionEditorPoint = NonNullable<TileCollisionEditorObject["points"]>[number];
export type TileCollisionObjectShape = Parameters<
  TileCollisionEditorStore["createSelectedTileCollisionObject"]
>[0];
export type TileCollisionNumericField = "x" | "y" | "width" | "height" | "rotation";
export type TileCollisionObjectPatch = Parameters<
  TileCollisionEditorStore["updateSelectedTileCollisionObjectDetails"]
>[1];

export interface TileCollisionObjectDraft {
  name: string;
  className: string;
  x: string;
  y: string;
  width: string;
  height: string;
  rotation: string;
  points: string;
}

export interface TileCollisionEditorSelection {
  selectedObjectId: TileCollisionEditorObjectId | undefined;
  selectedObject: TileCollisionEditorObject | undefined;
  selectedObjectIds: TileCollisionEditorObjectId[];
}

export interface TileCollisionObjectDraftCommitResult {
  nextDraft: TileCollisionObjectDraft;
  patch?: TileCollisionObjectPatch;
}

export function formatTileCollisionObjectPoints(
  points: readonly TileCollisionEditorPoint[] | undefined
): string {
  return (points ?? []).map((point) => `${point.x},${point.y}`).join(" ");
}

export function parseTileCollisionObjectPoints(value: string): TileCollisionEditorPoint[] {
  const trimmed = value.trim();

  if (!trimmed) {
    return [];
  }

  return trimmed.split(/\s+/).map((chunk) => {
    const [x, y] = chunk.split(",");
    const parsedX = Number.parseFloat(x ?? "");
    const parsedY = Number.parseFloat(y ?? "");

    if (Number.isNaN(parsedX) || Number.isNaN(parsedY)) {
      throw new Error("Invalid point");
    }

    return {
      x: parsedX,
      y: parsedY
    };
  });
}

export function createTileCollisionObjectDraft(
  selectedObject: TileCollisionEditorObject | undefined
): TileCollisionObjectDraft {
  return {
    name: selectedObject?.name ?? "",
    className: selectedObject?.className ?? "",
    x: String(selectedObject?.x ?? 0),
    y: String(selectedObject?.y ?? 0),
    width: String(selectedObject?.width ?? 0),
    height: String(selectedObject?.height ?? 0),
    rotation: String(selectedObject?.rotation ?? 0),
    points: formatTileCollisionObjectPoints(selectedObject?.points)
  };
}

export function resolveTileCollisionEditorSelectedObjectId(
  collisionObjects: readonly TileCollisionEditorObject[],
  selectedObjectId: TileCollisionEditorObjectId | undefined
): TileCollisionEditorObjectId | undefined {
  if (
    selectedObjectId &&
    collisionObjects.some((collisionObject) => collisionObject.id === selectedObjectId)
  ) {
    return selectedObjectId;
  }

  return collisionObjects[0]?.id;
}

export function deriveTileCollisionEditorSelection(
  collisionObjects: readonly TileCollisionEditorObject[],
  selectedObjectId: TileCollisionEditorObjectId | undefined
): TileCollisionEditorSelection {
  const resolvedSelectedObjectId = resolveTileCollisionEditorSelectedObjectId(
    collisionObjects,
    selectedObjectId
  );
  const selectedObject = resolvedSelectedObjectId
    ? collisionObjects.find((collisionObject) => collisionObject.id === resolvedSelectedObjectId)
    : undefined;

  return {
    selectedObjectId: resolvedSelectedObjectId,
    selectedObject,
    selectedObjectIds: resolvedSelectedObjectId ? [resolvedSelectedObjectId] : []
  };
}

export function resolveTileCollisionObjectNameCommit(args: {
  draft: TileCollisionObjectDraft;
  selectedObject: TileCollisionEditorObject;
}): TileCollisionObjectPatch {
  return {
    name: args.draft.name.trim() || args.selectedObject.name
  };
}

export function resolveTileCollisionObjectClassNameCommit(args: {
  draft: TileCollisionObjectDraft;
}): TileCollisionObjectPatch {
  return {
    className: args.draft.className
  };
}

export function resolveTileCollisionObjectNumericFieldCommit(args: {
  draft: TileCollisionObjectDraft;
  selectedObject: TileCollisionEditorObject;
  field: TileCollisionNumericField;
}): TileCollisionObjectDraftCommitResult {
  const nextValue = Number.parseFloat(args.draft[args.field]);

  if (Number.isNaN(nextValue)) {
    return {
      nextDraft: {
        ...args.draft,
        [args.field]: String(args.selectedObject[args.field])
      }
    };
  }

  return {
    nextDraft: args.draft,
    patch: {
      [args.field]: nextValue
    }
  };
}

export function resolveTileCollisionObjectPointsCommit(args: {
  draft: TileCollisionObjectDraft;
  selectedObject: TileCollisionEditorObject;
}): TileCollisionObjectDraftCommitResult {
  try {
    return {
      nextDraft: args.draft,
      patch: {
        points: parseTileCollisionObjectPoints(args.draft.points)
      }
    };
  } catch {
    return {
      nextDraft: {
        ...args.draft,
        points: formatTileCollisionObjectPoints(args.selectedObject.points)
      }
    };
  }
}
