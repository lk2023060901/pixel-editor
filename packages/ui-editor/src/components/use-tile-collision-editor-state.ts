"use client";

import {
  createTileCollisionObjectDraft,
  deriveTileCollisionEditorSelection,
  resolveTileCollisionObjectClassNameCommit,
  resolveTileCollisionObjectNameCommit,
  resolveTileCollisionObjectNumericFieldCommit,
  resolveTileCollisionObjectPointsCommit,
  type TileCollisionEditorObject as CollisionObject,
  type TileCollisionEditorObjectId as CollisionObjectId,
  type TileCollisionEditorViewState,
  type TileCollisionNumericField as CollisionNumericField,
  type TileCollisionObjectDraft as CollisionObjectDraft,
  type TileCollisionObjectShape as CollisionObjectShape
} from "@pixel-editor/app-services/ui";
import type { TileCollisionEditorStore } from "@pixel-editor/app-services/ui-store";
import { startTransition, useEffect, useState } from "react";

export type UpsertSelectedCollisionObjectProperty = (
  property: Parameters<TileCollisionEditorStore["upsertSelectedTileCollisionObjectProperty"]>[1],
  previousName?: Parameters<TileCollisionEditorStore["upsertSelectedTileCollisionObjectProperty"]>[2]
) => void;

export function useTileCollisionEditorState(props: {
  store: TileCollisionEditorStore;
  viewState: TileCollisionEditorViewState;
}) {
  const collisionObjects = props.viewState.collisionObjects;
  const [selectedObjectId, setSelectedObjectId] = useState<CollisionObjectId | undefined>();
  const selection = deriveTileCollisionEditorSelection(collisionObjects, selectedObjectId);
  const currentSelectedObjectId = selection.selectedObjectId;
  const selectedObject = selection.selectedObject;
  const [draft, setDraft] = useState<CollisionObjectDraft>(() =>
    createTileCollisionObjectDraft(selectedObject)
  );

  useEffect(() => {
    if (selection.selectedObjectId === selectedObjectId) {
      return;
    }

    setSelectedObjectId(selection.selectedObjectId);
  }, [selectedObjectId, selection.selectedObjectId]);

  useEffect(() => {
    setDraft(createTileCollisionObjectDraft(selectedObject));
  }, [selectedObject]);

  function commitSelectedObjectPatch(
    patch: Parameters<TileCollisionEditorStore["updateSelectedTileCollisionObjectDetails"]>[1]
  ): void {
    if (!currentSelectedObjectId) {
      return;
    }

    startTransition(() => {
      props.store.updateSelectedTileCollisionObjectDetails(currentSelectedObjectId, patch);
    });
  }

  function commitNumericField(key: CollisionNumericField): void {
    if (!selectedObject) {
      return;
    }

    const resolution = resolveTileCollisionObjectNumericFieldCommit({
      draft,
      selectedObject,
      field: key
    });

    if (resolution.nextDraft !== draft) {
      setDraft(resolution.nextDraft);
    }

    if (resolution.patch) {
      commitSelectedObjectPatch(resolution.patch);
    }
  }

  function commitPoints(): void {
    if (!selectedObject) {
      return;
    }

    const resolution = resolveTileCollisionObjectPointsCommit({
      draft,
      selectedObject
    });

    if (resolution.nextDraft !== draft) {
      setDraft(resolution.nextDraft);
    }

    if (resolution.patch) {
      commitSelectedObjectPatch(resolution.patch);
    }
  }

  return {
    collisionObjects,
    selectedObjectId: currentSelectedObjectId,
    selectedObject,
    selectedObjectIds: selection.selectedObjectIds,
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
        if (!currentSelectedObjectId) {
          return;
        }

        props.store.removeSelectedTileCollisionObjects([currentSelectedObjectId]);
      },
      reorderSelectedObject: (direction: "up" | "down") => {
        if (!currentSelectedObjectId) {
          return;
        }

        props.store.reorderSelectedTileCollisionObjects([currentSelectedObjectId], direction);
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

        commitSelectedObjectPatch(
          resolveTileCollisionObjectNameCommit({
            draft,
            selectedObject
          })
        );
      },
      commitClassName: () => {
        commitSelectedObjectPatch(
          resolveTileCollisionObjectClassNameCommit({
            draft
          })
        );
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
