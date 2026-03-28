"use client";

import type { TileCollisionEditorViewState } from "@pixel-editor/app-services/ui";
import type { TileCollisionEditorStore } from "@pixel-editor/app-services/ui-store";
import { startTransition, useEffect, useState } from "react";

export type CollisionObject = TileCollisionEditorViewState["collisionObjects"][number];
export type CollisionObjectId = CollisionObject["id"];
export type CollisionPoint = NonNullable<CollisionObject["points"]>[number];
export type CollisionObjectShape = Parameters<
  TileCollisionEditorStore["createSelectedTileCollisionObject"]
>[0];
export type CollisionNumericField = "x" | "y" | "width" | "height" | "rotation";
export type UpsertSelectedCollisionObjectProperty = (
  property: Parameters<TileCollisionEditorStore["upsertSelectedTileCollisionObjectProperty"]>[1],
  previousName?: Parameters<TileCollisionEditorStore["upsertSelectedTileCollisionObjectProperty"]>[2]
) => void;

export interface CollisionObjectDraft {
  name: string;
  className: string;
  x: string;
  y: string;
  width: string;
  height: string;
  rotation: string;
  points: string;
}

function formatPoints(points: readonly CollisionPoint[] | undefined): string {
  return (points ?? []).map((point) => `${point.x},${point.y}`).join(" ");
}

function parsePoints(value: string): CollisionPoint[] | undefined {
  const trimmed = value.trim();

  if (!trimmed) {
    return [];
  }

  const points = trimmed.split(/\s+/).map((chunk) => {
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

  return points.length > 0 ? points : [];
}

function createCollisionObjectDraft(
  selectedObject: CollisionObject | undefined
): CollisionObjectDraft {
  return {
    name: selectedObject?.name ?? "",
    className: selectedObject?.className ?? "",
    x: String(selectedObject?.x ?? 0),
    y: String(selectedObject?.y ?? 0),
    width: String(selectedObject?.width ?? 0),
    height: String(selectedObject?.height ?? 0),
    rotation: String(selectedObject?.rotation ?? 0),
    points: formatPoints(selectedObject?.points)
  };
}

export function useTileCollisionEditorState(props: {
  store: TileCollisionEditorStore;
  viewState: TileCollisionEditorViewState;
}) {
  const collisionObjects = props.viewState.collisionObjects;
  const [selectedObjectId, setSelectedObjectId] = useState<CollisionObjectId | undefined>();
  const selectedObject = collisionObjects.find((object) => object.id === selectedObjectId);
  const [draft, setDraft] = useState<CollisionObjectDraft>(() =>
    createCollisionObjectDraft(selectedObject)
  );

  useEffect(() => {
    if (selectedObjectId && collisionObjects.some((object) => object.id === selectedObjectId)) {
      return;
    }

    setSelectedObjectId(collisionObjects[0]?.id);
  }, [collisionObjects, selectedObjectId]);

  useEffect(() => {
    setDraft(createCollisionObjectDraft(selectedObject));
  }, [selectedObject]);

  function commitSelectedObjectPatch(
    patch: Parameters<TileCollisionEditorStore["updateSelectedTileCollisionObjectDetails"]>[1]
  ): void {
    if (!selectedObjectId) {
      return;
    }

    startTransition(() => {
      props.store.updateSelectedTileCollisionObjectDetails(selectedObjectId, patch);
    });
  }

  function commitNumericField(key: CollisionNumericField): void {
    if (!selectedObject) {
      return;
    }

    const nextValue = Number.parseFloat(draft[key]);

    if (Number.isNaN(nextValue)) {
      setDraft((current) => ({
        ...current,
        [key]: String(selectedObject[key])
      }));
      return;
    }

    commitSelectedObjectPatch({ [key]: nextValue });
  }

  function commitPoints(): void {
    if (!selectedObject) {
      return;
    }

    try {
      const parsedPoints = parsePoints(draft.points);

      commitSelectedObjectPatch(parsedPoints !== undefined ? { points: parsedPoints } : {});
    } catch {
      setDraft((current) => ({
        ...current,
        points: formatPoints(selectedObject.points)
      }));
    }
  }

  return {
    collisionObjects,
    selectedObjectId,
    selectedObject,
    selectedObjectIds: selectedObjectId ? [selectedObjectId] : [],
    draft,
    setDraft,
    actions: {
      selectObject: setSelectedObjectId,
      selectObjects: (objectIds: CollisionObjectId[]) => {
        setSelectedObjectId(objectIds[0]);
      },
      createObject: (shape: CollisionObjectShape) => {
        const objectId = props.store.createSelectedTileCollisionObject(shape);

        if (objectId) {
          setSelectedObjectId(objectId);
        }
      },
      removeSelectedObject: () => {
        if (!selectedObjectId) {
          return;
        }

        props.store.removeSelectedTileCollisionObjects([selectedObjectId]);
      },
      reorderSelectedObject: (direction: "up" | "down") => {
        if (!selectedObjectId) {
          return;
        }

        props.store.reorderSelectedTileCollisionObjects([selectedObjectId], direction);
      },
      moveSelectedObjects: (
        objectIds: readonly CollisionObjectId[],
        deltaX: number,
        deltaY: number
      ) => {
        props.store.moveSelectedTileCollisionObjects(objectIds, deltaX, deltaY);
      },
      commitName: () => {
        if (!selectedObject) {
          return;
        }

        commitSelectedObjectPatch({
          name: draft.name.trim() || selectedObject.name
        });
      },
      commitClassName: () => {
        commitSelectedObjectPatch({
          className: draft.className
        });
      },
      commitNumericField,
      commitVisible: (visible: boolean) => {
        commitSelectedObjectPatch({ visible });
      },
      commitPoints,
      removeSelectedObjectProperty: (propertyName: string) => {
        if (!selectedObject) {
          return;
        }

        props.store.removeSelectedTileCollisionObjectProperty(selectedObject.id, propertyName);
      },
      upsertSelectedObjectProperty: ((property, previousName) => {
        if (!selectedObject) {
          return;
        }

        props.store.upsertSelectedTileCollisionObjectProperty(
          selectedObject.id,
          property,
          previousName
        );
      }) as UpsertSelectedCollisionObjectProperty
    }
  };
}
