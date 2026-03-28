"use client";

import type { TileCollisionEditorViewState } from "@pixel-editor/app-services/ui";
import type { TileCollisionEditorStore } from "@pixel-editor/app-services/ui-store";
import type { Dispatch, SetStateAction } from "react";
import { useI18n } from "@pixel-editor/i18n/client";

import { CustomPropertiesEditor } from "./custom-properties-editor";
import { getObjectShapeLabel } from "./i18n-helpers";
import {
  PropertyBrowserCheckboxRow,
  PropertyBrowserContent,
  PropertyBrowserGroup,
  PropertyBrowserTextareaRow,
  PropertyBrowserTextRow
} from "./property-browser";
import type {
  CollisionNumericField,
  CollisionObject,
  CollisionObjectDraft,
  CollisionObjectId,
  CollisionObjectShape,
  UpsertSelectedCollisionObjectProperty
} from "./use-tile-collision-editor-state";

const collisionObjectShapes: CollisionObjectShape[] = [
  "rectangle",
  "point",
  "ellipse",
  "capsule",
  "polygon"
];

type RemoveSelectedCollisionObjectProperty = (
  propertyName: Parameters<TileCollisionEditorStore["removeSelectedTileCollisionObjectProperty"]>[1]
) => void;

export function TileCollisionEditorToolbar(props: {
  selectedObjectId: CollisionObjectId | undefined;
  onCreateObject: (shape: CollisionObjectShape) => void;
  onMoveSelectedObject: (direction: "up" | "down") => void;
  onRemoveSelectedObject: () => void;
}) {
  const { t } = useI18n();

  return (
    <div className="flex items-center gap-2 border-b border-slate-700 px-4 py-2">
      {collisionObjectShapes.map((shape) => (
        <button
          key={shape}
          className="h-8 border border-slate-600 bg-slate-800 px-3 text-sm text-slate-100 transition hover:bg-slate-700"
          type="button"
          onClick={() => {
            props.onCreateObject(shape);
          }}
        >
          {getObjectShapeLabel(shape, t)}
        </button>
      ))}
      <div className="mx-1 h-8 w-px bg-slate-700" />
      <button
        className="h-8 border border-slate-600 bg-slate-800 px-3 text-sm text-slate-100 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!props.selectedObjectId}
        type="button"
        onClick={props.onRemoveSelectedObject}
      >
        {t("common.remove")}
      </button>
      <button
        className="h-8 border border-slate-600 bg-slate-800 px-3 text-sm text-slate-100 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!props.selectedObjectId}
        type="button"
        onClick={() => {
          props.onMoveSelectedObject("up");
        }}
      >
        {t("tileCollisionEditor.moveUp")}
      </button>
      <button
        className="h-8 border border-slate-600 bg-slate-800 px-3 text-sm text-slate-100 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!props.selectedObjectId}
        type="button"
        onClick={() => {
          props.onMoveSelectedObject("down");
        }}
      >
        {t("tileCollisionEditor.moveDown")}
      </button>
    </div>
  );
}

export function TileCollisionObjectList(props: {
  collisionObjects: readonly CollisionObject[];
  selectedObjectId: CollisionObjectId | undefined;
  onSelectObject: (objectId: CollisionObjectId) => void;
}) {
  const { t } = useI18n();

  return (
    <div className="border-b border-slate-700">
      <div className="border-b border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-100">
        {t("shell.dock.objects")}
      </div>
      <div className="min-h-0 overflow-y-auto bg-slate-950">
        {props.collisionObjects.length ? (
          props.collisionObjects.map((object) => (
            <button
              key={object.id}
              className={`flex w-full items-center justify-between gap-3 border-b border-slate-800 px-3 py-2 text-left transition ${
                object.id === props.selectedObjectId
                  ? "bg-slate-800 text-slate-50"
                  : "text-slate-200 hover:bg-slate-900"
              }`}
              type="button"
              onClick={() => {
                props.onSelectObject(object.id);
              }}
            >
              <span className="min-w-0 flex-1 truncate">{object.name}</span>
              <span className="shrink-0 text-xs text-slate-400">
                {getObjectShapeLabel(object.shape, t)}
              </span>
            </button>
          ))
        ) : (
          <div className="flex h-[176px] items-center justify-center px-4 text-sm text-slate-400">
            {t("tileCollisionEditor.noObjects")}
          </div>
        )}
      </div>
    </div>
  );
}

export function TileCollisionObjectProperties(props: {
  draft: CollisionObjectDraft;
  propertyTypes: TileCollisionEditorViewState["propertyTypes"];
  selectedObject: CollisionObject;
  setDraft: Dispatch<SetStateAction<CollisionObjectDraft>>;
  onCommitClassName: () => void;
  onCommitName: () => void;
  onCommitNumericField: (key: CollisionNumericField) => void;
  onCommitPoints: () => void;
  onCommitVisible: (visible: boolean) => void;
  onRemoveProperty: RemoveSelectedCollisionObjectProperty;
  onUpsertProperty: UpsertSelectedCollisionObjectProperty;
}) {
  const { t } = useI18n();

  return (
    <PropertyBrowserContent>
      <PropertyBrowserGroup title={t("shell.dock.properties")}>
        <PropertyBrowserTextRow
          label={t("common.name")}
          value={props.draft.name}
          onChange={(value) => {
            props.setDraft((current) => ({ ...current, name: value }));
          }}
          onCommit={props.onCommitName}
        />
        <PropertyBrowserTextRow
          label={t("common.class")}
          value={props.draft.className}
          onChange={(value) => {
            props.setDraft((current) => ({ ...current, className: value }));
          }}
          onCommit={props.onCommitClassName}
        />
        <PropertyBrowserTextRow
          label={t("common.x")}
          type="number"
          value={props.draft.x}
          onChange={(value) => {
            props.setDraft((current) => ({ ...current, x: value }));
          }}
          onCommit={() => {
            props.onCommitNumericField("x");
          }}
        />
        <PropertyBrowserTextRow
          label={t("common.y")}
          type="number"
          value={props.draft.y}
          onChange={(value) => {
            props.setDraft((current) => ({ ...current, y: value }));
          }}
          onCommit={() => {
            props.onCommitNumericField("y");
          }}
        />
        {props.selectedObject.shape !== "point" ? (
          <>
            <PropertyBrowserTextRow
              label={t("common.width")}
              type="number"
              value={props.draft.width}
              onChange={(value) => {
                props.setDraft((current) => ({ ...current, width: value }));
              }}
              onCommit={() => {
                props.onCommitNumericField("width");
              }}
            />
            <PropertyBrowserTextRow
              label={t("common.height")}
              type="number"
              value={props.draft.height}
              onChange={(value) => {
                props.setDraft((current) => ({ ...current, height: value }));
              }}
              onCommit={() => {
                props.onCommitNumericField("height");
              }}
            />
          </>
        ) : null}
        <PropertyBrowserTextRow
          label={t("common.rotation")}
          type="number"
          value={props.draft.rotation}
          onChange={(value) => {
            props.setDraft((current) => ({ ...current, rotation: value }));
          }}
          onCommit={() => {
            props.onCommitNumericField("rotation");
          }}
        />
        <PropertyBrowserCheckboxRow
          checked={props.selectedObject.visible}
          label={t("common.visible")}
          onChange={props.onCommitVisible}
        />
        {props.selectedObject.shape === "polygon" || props.selectedObject.shape === "polyline" ? (
          <PropertyBrowserTextareaRow
            label={t("common.points")}
            value={props.draft.points}
            onChange={(value) => {
              props.setDraft((current) => ({ ...current, points: value }));
            }}
            onCommit={props.onCommitPoints}
          />
        ) : null}
      </PropertyBrowserGroup>

      <div className="border-t border-slate-700">
        <CustomPropertiesEditor
          className="bg-slate-950"
          objectReferenceOptions={[]}
          properties={props.selectedObject.properties}
          propertyTypes={props.propertyTypes}
          onRemove={props.onRemoveProperty}
          onUpsert={props.onUpsertProperty}
          showHint={false}
        />
      </div>
    </PropertyBrowserContent>
  );
}
