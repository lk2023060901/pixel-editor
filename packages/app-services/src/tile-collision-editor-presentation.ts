import type { I18nMessageKey, TranslationFn } from "@pixel-editor/i18n";

import type {
  TileCollisionEditorObject,
  TileCollisionEditorObjectId,
  TileCollisionObjectShape
} from "./tile-collision-editor-state";

export const tileCollisionEditorToolbarActionIds = {
  createRectangle: "create-rectangle",
  createPoint: "create-point",
  createEllipse: "create-ellipse",
  createCapsule: "create-capsule",
  createPolygon: "create-polygon",
  removeSelectedObject: "remove-selected-object",
  moveSelectedObjectUp: "move-selected-object-up",
  moveSelectedObjectDown: "move-selected-object-down"
} as const;

export type TileCollisionEditorToolbarActionId =
  (typeof tileCollisionEditorToolbarActionIds)[keyof typeof tileCollisionEditorToolbarActionIds];

export interface TileCollisionEditorToolbarActionItem {
  actionId: TileCollisionEditorToolbarActionId;
  label: string;
  disabled: boolean;
}

export interface TileCollisionEditorToolbarPresentation {
  createActions: TileCollisionEditorToolbarActionItem[];
  commandActions: TileCollisionEditorToolbarActionItem[];
}

export interface TileCollisionObjectListStore {
  selectObject: (objectId: TileCollisionEditorObjectId) => void;
}

export interface TileCollisionObjectListItemPresentation {
  id: TileCollisionEditorObjectId;
  name: string;
  shapeLabel: string;
  tone: "selected" | "interactive";
}

export type TileCollisionObjectListPresentation =
  | { kind: "empty" }
  | {
      kind: "list";
      items: TileCollisionObjectListItemPresentation[];
    };

export interface TileCollisionEditorDialogStore {
  createObject: (shape: TileCollisionObjectShape) => void;
  removeSelectedObject: () => void;
  reorderSelectedObject: (direction: "up" | "down") => void;
  closeDialog: () => void;
}

export type TileCollisionEditorActionPlan =
  | { kind: "noop" }
  | {
      kind: "create-object";
      shape: TileCollisionObjectShape;
    }
  | { kind: "remove-selected-object" }
  | {
      kind: "reorder-selected-object";
      direction: "up" | "down";
    }
  | { kind: "close-dialog" };

export type TileCollisionEditorDialogActionPlan =
  | { kind: "noop" }
  | {
      kind: "transition";
      run: (store: TileCollisionEditorDialogStore) => void;
    };

export type TileCollisionObjectListActionPlan =
  | { kind: "noop" }
  | {
      kind: "transition";
      run: (store: TileCollisionObjectListStore) => void;
    };

const tileCollisionEditorToolbarCreateActionShapes: Record<
  TileCollisionEditorToolbarActionId,
  TileCollisionObjectShape
> = {
  [tileCollisionEditorToolbarActionIds.createRectangle]: "rectangle",
  [tileCollisionEditorToolbarActionIds.createPoint]: "point",
  [tileCollisionEditorToolbarActionIds.createEllipse]: "ellipse",
  [tileCollisionEditorToolbarActionIds.createCapsule]: "capsule",
  [tileCollisionEditorToolbarActionIds.createPolygon]: "polygon",
  [tileCollisionEditorToolbarActionIds.removeSelectedObject]: "rectangle",
  [tileCollisionEditorToolbarActionIds.moveSelectedObjectUp]: "rectangle",
  [tileCollisionEditorToolbarActionIds.moveSelectedObjectDown]: "rectangle"
};

export function deriveTileCollisionEditorToolbarPresentation(input: {
  selectedObjectId: TileCollisionEditorObjectId | undefined;
  t: TranslationFn;
}): TileCollisionEditorToolbarPresentation {
  const hasSelection = input.selectedObjectId !== undefined;

  return {
    createActions: [
      tileCollisionEditorToolbarActionIds.createRectangle,
      tileCollisionEditorToolbarActionIds.createPoint,
      tileCollisionEditorToolbarActionIds.createEllipse,
      tileCollisionEditorToolbarActionIds.createCapsule,
      tileCollisionEditorToolbarActionIds.createPolygon
    ].map((actionId) => ({
      actionId,
      label: input.t(
        `objectShape.${tileCollisionEditorToolbarCreateActionShapes[actionId]}` as I18nMessageKey
      ),
      disabled: false
    })),
    commandActions: [
      {
        actionId: tileCollisionEditorToolbarActionIds.removeSelectedObject,
        label: input.t("common.remove"),
        disabled: !hasSelection
      },
      {
        actionId: tileCollisionEditorToolbarActionIds.moveSelectedObjectUp,
        label: input.t("tileCollisionEditor.moveUp"),
        disabled: !hasSelection
      },
      {
        actionId: tileCollisionEditorToolbarActionIds.moveSelectedObjectDown,
        label: input.t("tileCollisionEditor.moveDown"),
        disabled: !hasSelection
      }
    ]
  };
}

export function deriveTileCollisionObjectListPresentation(input: {
  collisionObjects: readonly TileCollisionEditorObject[];
  selectedObjectId: TileCollisionEditorObjectId | undefined;
  t: TranslationFn;
}): TileCollisionObjectListPresentation {
  if (input.collisionObjects.length === 0) {
    return { kind: "empty" };
  }

  return {
    kind: "list",
    items: input.collisionObjects.map((object) => ({
      id: object.id,
      name: object.name,
      shapeLabel: input.t(`objectShape.${object.shape}` as I18nMessageKey),
      tone: object.id === input.selectedObjectId ? "selected" : "interactive"
    }))
  };
}

export function createTileCollisionEditorToolbarActionPlan(input: {
  actionId: TileCollisionEditorToolbarActionId;
  selectedObjectId: TileCollisionEditorObjectId | undefined;
}): TileCollisionEditorActionPlan {
  switch (input.actionId) {
    case tileCollisionEditorToolbarActionIds.createRectangle:
    case tileCollisionEditorToolbarActionIds.createPoint:
    case tileCollisionEditorToolbarActionIds.createEllipse:
    case tileCollisionEditorToolbarActionIds.createCapsule:
    case tileCollisionEditorToolbarActionIds.createPolygon:
      return {
        kind: "create-object",
        shape: tileCollisionEditorToolbarCreateActionShapes[input.actionId]
      };
    case tileCollisionEditorToolbarActionIds.removeSelectedObject:
      return input.selectedObjectId === undefined
        ? { kind: "noop" }
        : { kind: "remove-selected-object" };
    case tileCollisionEditorToolbarActionIds.moveSelectedObjectUp:
      return input.selectedObjectId === undefined
        ? { kind: "noop" }
        : {
            kind: "reorder-selected-object",
            direction: "up"
          };
    case tileCollisionEditorToolbarActionIds.moveSelectedObjectDown:
      return input.selectedObjectId === undefined
        ? { kind: "noop" }
        : {
            kind: "reorder-selected-object",
            direction: "down"
          };
    default:
      return { kind: "noop" };
  }
}

export function createTileCollisionEditorKeyDownPlan(input: {
  key: string;
  selectedObjectId: TileCollisionEditorObjectId | undefined;
}): TileCollisionEditorActionPlan {
  if (input.key === "Escape") {
    return { kind: "close-dialog" };
  }

  if ((input.key === "Delete" || input.key === "Backspace") && input.selectedObjectId !== undefined) {
    return { kind: "remove-selected-object" };
  }

  return { kind: "noop" };
}

export function createTileCollisionObjectListActionPlan(input: {
  objectId?: TileCollisionEditorObjectId | undefined;
}): TileCollisionObjectListActionPlan {
  return input.objectId === undefined
    ? { kind: "noop" }
    : {
        kind: "transition",
        run: (store) => {
          store.selectObject(input.objectId!);
        }
      };
}

export function createTileCollisionEditorDialogActionPlan(
  plan: TileCollisionEditorActionPlan
): TileCollisionEditorDialogActionPlan {
  switch (plan.kind) {
    case "create-object":
      return {
        kind: "transition",
        run: (store) => {
          store.createObject(plan.shape);
        }
      };
    case "remove-selected-object":
      return {
        kind: "transition",
        run: (store) => {
          store.removeSelectedObject();
        }
      };
    case "reorder-selected-object":
      return {
        kind: "transition",
        run: (store) => {
          store.reorderSelectedObject(plan.direction);
        }
      };
    case "close-dialog":
      return {
        kind: "transition",
        run: (store) => {
          store.closeDialog();
        }
      };
    default:
      return { kind: "noop" };
  }
}
