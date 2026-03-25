"use client";

import type { EditorController } from "@pixel-editor/app-services";
import type {
  ObjectId,
  Point,
  PropertyTypeDefinition,
  TilesetDefinition,
  UpdateMapObjectDetailsInput
} from "@pixel-editor/domain";
import { useI18n } from "@pixel-editor/i18n/client";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";

import { CustomPropertiesEditor } from "./custom-properties-editor";
import {
  PropertyBrowserCheckboxRow,
  PropertyBrowserContent,
  PropertyBrowserGroup,
  PropertyBrowserTextareaRow,
  PropertyBrowserTextRow
} from "./property-browser";
import { TileCollisionCanvas } from "./tile-collision-canvas";
import { getObjectShapeLabel } from "./i18n-helpers";

function formatPoints(points: readonly Point[] | undefined): string {
  return (points ?? []).map((point) => `${point.x},${point.y}`).join(" ");
}

function parsePoints(value: string): Point[] | undefined {
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

export function TileCollisionEditorDialog(props: {
  propertyTypes: readonly PropertyTypeDefinition[] | undefined;
  selectedLocalId: number | null;
  store: EditorController;
  tileset: TilesetDefinition;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const selectedTile =
    props.selectedLocalId !== null
      ? props.tileset.tiles.find((tile) => tile.localId === props.selectedLocalId)
      : undefined;
  const collisionObjects = selectedTile?.collisionLayer?.objects ?? [];
  const [selectedObjectId, setSelectedObjectId] = useState<ObjectId | undefined>();
  const selectedObject = collisionObjects.find((object) => object.id === selectedObjectId);
  const [name, setName] = useState("");
  const [className, setClassName] = useState("");
  const [x, setX] = useState("0");
  const [y, setY] = useState("0");
  const [width, setWidth] = useState("0");
  const [height, setHeight] = useState("0");
  const [rotation, setRotation] = useState("0");
  const [points, setPoints] = useState("");

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  useEffect(() => {
    if (selectedObjectId && collisionObjects.some((object) => object.id === selectedObjectId)) {
      return;
    }

    setSelectedObjectId(collisionObjects[0]?.id);
  }, [collisionObjects, selectedObjectId]);

  useEffect(() => {
    setName(selectedObject?.name ?? "");
    setClassName(selectedObject?.className ?? "");
    setX(String(selectedObject?.x ?? 0));
    setY(String(selectedObject?.y ?? 0));
    setWidth(String(selectedObject?.width ?? 0));
    setHeight(String(selectedObject?.height ?? 0));
    setRotation(String(selectedObject?.rotation ?? 0));
    setPoints(formatPoints(selectedObject?.points));
  }, [selectedObject]);

  function commitSelectedObjectPatch(patch: UpdateMapObjectDetailsInput): void {
    if (!selectedObjectId) {
      return;
    }

    startTransition(() => {
      props.store.updateSelectedTileCollisionObjectDetails(selectedObjectId, patch);
    });
  }

  function commitNumericPatch(
    key: "x" | "y" | "width" | "height" | "rotation",
    value: string,
    fallback: number
  ): void {
    const nextValue = Number.parseFloat(value);

    if (Number.isNaN(nextValue)) {
      switch (key) {
        case "x":
          setX(String(fallback));
          break;
        case "y":
          setY(String(fallback));
          break;
        case "width":
          setWidth(String(fallback));
          break;
        case "height":
          setHeight(String(fallback));
          break;
        case "rotation":
          setRotation(String(fallback));
          break;
      }

      return;
    }

    commitSelectedObjectPatch({ [key]: nextValue });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-6 py-8">
      <div
        ref={dialogRef}
        className="flex h-[720px] w-[1120px] flex-col border border-slate-700 bg-slate-900 shadow-[0_18px_60px_rgba(2,6,23,0.7)] outline-none"
        role="dialog"
        tabIndex={-1}
        aria-modal="true"
        aria-label={t("action.editCollision")}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            props.onClose();
            return;
          }

          if ((event.key === "Delete" || event.key === "Backspace") && selectedObjectId) {
            event.preventDefault();
            props.store.removeSelectedTileCollisionObjects([selectedObjectId]);
          }
        }}
      >
        <div className="flex items-center gap-2 border-b border-slate-700 px-4 py-2">
          <button
            className="h-8 border border-slate-600 bg-slate-800 px-3 text-sm text-slate-100 transition hover:bg-slate-700"
            type="button"
            onClick={() => {
              const objectId = props.store.createSelectedTileCollisionObject("rectangle");
              if (objectId) {
                setSelectedObjectId(objectId);
              }
            }}
          >
            {getObjectShapeLabel("rectangle", t)}
          </button>
          <button
            className="h-8 border border-slate-600 bg-slate-800 px-3 text-sm text-slate-100 transition hover:bg-slate-700"
            type="button"
            onClick={() => {
              const objectId = props.store.createSelectedTileCollisionObject("point");
              if (objectId) {
                setSelectedObjectId(objectId);
              }
            }}
          >
            {getObjectShapeLabel("point", t)}
          </button>
          <button
            className="h-8 border border-slate-600 bg-slate-800 px-3 text-sm text-slate-100 transition hover:bg-slate-700"
            type="button"
            onClick={() => {
              const objectId = props.store.createSelectedTileCollisionObject("ellipse");
              if (objectId) {
                setSelectedObjectId(objectId);
              }
            }}
          >
            {getObjectShapeLabel("ellipse", t)}
          </button>
          <button
            className="h-8 border border-slate-600 bg-slate-800 px-3 text-sm text-slate-100 transition hover:bg-slate-700"
            type="button"
            onClick={() => {
              const objectId = props.store.createSelectedTileCollisionObject("capsule");
              if (objectId) {
                setSelectedObjectId(objectId);
              }
            }}
          >
            {getObjectShapeLabel("capsule", t)}
          </button>
          <button
            className="h-8 border border-slate-600 bg-slate-800 px-3 text-sm text-slate-100 transition hover:bg-slate-700"
            type="button"
            onClick={() => {
              const objectId = props.store.createSelectedTileCollisionObject("polygon");
              if (objectId) {
                setSelectedObjectId(objectId);
              }
            }}
          >
            {getObjectShapeLabel("polygon", t)}
          </button>
          <div className="mx-1 h-8 w-px bg-slate-700" />
          <button
            className="h-8 border border-slate-600 bg-slate-800 px-3 text-sm text-slate-100 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!selectedObjectId}
            type="button"
            onClick={() => {
              if (!selectedObjectId) {
                return;
              }

              props.store.removeSelectedTileCollisionObjects([selectedObjectId]);
            }}
          >
            {t("common.remove")}
          </button>
          <button
            className="h-8 border border-slate-600 bg-slate-800 px-3 text-sm text-slate-100 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!selectedObjectId}
            type="button"
            onClick={() => {
              if (!selectedObjectId) {
                return;
              }

              props.store.reorderSelectedTileCollisionObjects([selectedObjectId], "up");
            }}
          >
            {t("tileCollisionEditor.moveUp")}
          </button>
          <button
            className="h-8 border border-slate-600 bg-slate-800 px-3 text-sm text-slate-100 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!selectedObjectId}
            type="button"
            onClick={() => {
              if (!selectedObjectId) {
                return;
              }

              props.store.reorderSelectedTileCollisionObjects([selectedObjectId], "down");
            }}
          >
            {t("tileCollisionEditor.moveDown")}
          </button>
        </div>

        {props.selectedLocalId === null ? (
          <div className="flex min-h-0 flex-1 items-center justify-center px-6 text-sm text-slate-400">
            {t("tileCollisionEditor.noTileSelected")}
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 grid-cols-[392px_minmax(0,1fr)]">
            <div className="flex min-h-0 flex-col border-r border-slate-700 px-4 py-4">
              <TileCollisionCanvas
                objects={collisionObjects}
                selectedObjectIds={selectedObjectId ? [selectedObjectId] : []}
                tileLocalId={props.selectedLocalId}
                tileset={props.tileset}
                onMoveCommit={(objectIds, deltaX, deltaY) => {
                  props.store.moveSelectedTileCollisionObjects(objectIds, deltaX, deltaY);
                }}
                onSelectionChange={(objectIds) => {
                  setSelectedObjectId(objectIds[0]);
                }}
              />
            </div>

            <div className="grid min-h-0 grid-rows-[220px_minmax(0,1fr)]">
              <div className="border-b border-slate-700">
                <div className="border-b border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-100">
                  {t("shell.dock.objects")}
                </div>
                <div className="min-h-0 overflow-y-auto bg-slate-950">
                  {collisionObjects.length ? (
                    collisionObjects.map((object) => (
                      <button
                        key={object.id}
                        className={`flex w-full items-center justify-between gap-3 border-b border-slate-800 px-3 py-2 text-left transition ${
                          object.id === selectedObjectId
                            ? "bg-slate-800 text-slate-50"
                            : "text-slate-200 hover:bg-slate-900"
                        }`}
                        type="button"
                        onClick={() => {
                          setSelectedObjectId(object.id);
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

              <div className="min-h-0 overflow-y-auto">
                {selectedObject ? (
                  <PropertyBrowserContent>
                    <PropertyBrowserGroup title={t("shell.dock.properties")}>
                      <PropertyBrowserTextRow
                        label={t("common.name")}
                        value={name}
                        onChange={setName}
                        onCommit={() => {
                          commitSelectedObjectPatch({ name: name.trim() || selectedObject.name });
                        }}
                      />
                      <PropertyBrowserTextRow
                        label={t("common.class")}
                        value={className}
                        onChange={setClassName}
                        onCommit={() => {
                          commitSelectedObjectPatch({ className });
                        }}
                      />
                      <PropertyBrowserTextRow
                        label={t("common.x")}
                        type="number"
                        value={x}
                        onChange={setX}
                        onCommit={() => {
                          commitNumericPatch("x", x, selectedObject.x);
                        }}
                      />
                      <PropertyBrowserTextRow
                        label={t("common.y")}
                        type="number"
                        value={y}
                        onChange={setY}
                        onCommit={() => {
                          commitNumericPatch("y", y, selectedObject.y);
                        }}
                      />
                      {selectedObject.shape !== "point" ? (
                        <>
                          <PropertyBrowserTextRow
                            label={t("common.width")}
                            type="number"
                            value={width}
                            onChange={setWidth}
                            onCommit={() => {
                              commitNumericPatch("width", width, selectedObject.width);
                            }}
                          />
                          <PropertyBrowserTextRow
                            label={t("common.height")}
                            type="number"
                            value={height}
                            onChange={setHeight}
                            onCommit={() => {
                              commitNumericPatch("height", height, selectedObject.height);
                            }}
                          />
                        </>
                      ) : null}
                      <PropertyBrowserTextRow
                        label={t("common.rotation")}
                        type="number"
                        value={rotation}
                        onChange={setRotation}
                        onCommit={() => {
                          commitNumericPatch("rotation", rotation, selectedObject.rotation);
                        }}
                      />
                      <PropertyBrowserCheckboxRow
                        checked={selectedObject.visible}
                        label={t("common.visible")}
                        onChange={(checked) => {
                          commitSelectedObjectPatch({ visible: checked });
                        }}
                      />
                      {selectedObject.shape === "polygon" || selectedObject.shape === "polyline" ? (
                        <PropertyBrowserTextareaRow
                          label={t("common.points")}
                          value={points}
                          onChange={setPoints}
                          onCommit={() => {
                            try {
                              const parsedPoints = parsePoints(points);

                              commitSelectedObjectPatch(
                                parsedPoints !== undefined ? { points: parsedPoints } : {}
                              );
                            } catch {
                              setPoints(formatPoints(selectedObject.points));
                            }
                          }}
                        />
                      ) : null}
                    </PropertyBrowserGroup>

                    <div className="border-t border-slate-700">
                      <CustomPropertiesEditor
                        className="bg-slate-950"
                        objectReferenceOptions={[]}
                        properties={selectedObject.properties}
                        propertyTypes={props.propertyTypes}
                        onRemove={(propertyName) => {
                          props.store.removeSelectedTileCollisionObjectProperty(
                            selectedObject.id,
                            propertyName
                          );
                        }}
                        onUpsert={(property, previousName) => {
                          props.store.upsertSelectedTileCollisionObjectProperty(
                            selectedObject.id,
                            property,
                            previousName
                          );
                        }}
                        showHint={false}
                      />
                    </div>
                  </PropertyBrowserContent>
                ) : (
                  <div className="flex h-full items-center justify-center px-4 text-sm text-slate-400">
                    {t("tileCollisionEditor.noObjects")}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-slate-700 px-4 py-3">
          <button
            className="h-8 border border-slate-600 bg-slate-800 px-3 text-sm text-slate-100 transition hover:bg-slate-700"
            type="button"
            onClick={props.onClose}
          >
            {t("action.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
