"use client";

import {
  createTileCollisionCanvasObjectTransformPreview,
  createTileCollisionCanvasPointerDownPlan,
  createTileCollisionCanvasPointerMovePlan,
  createTileCollisionCanvasPointerUpPlan,
  defaultTileCollisionCanvasDimensions,
  deriveTileCollisionCanvasLayout,
  type TileCollisionCanvasDragState,
  type TileCollisionCanvasViewState
} from "@pixel-editor/app-services/ui";
import { useMemo, useState } from "react";

import type { EditorRenderBridge, EditorRenderProjectedMapObject } from "../render-bridge";

import { buildTileVisualStyle } from "./tileset-view-helpers";

type CollisionCanvasObjectId = TileCollisionCanvasViewState["objects"][number]["id"];

function renderProjectedObject(object: EditorRenderProjectedMapObject) {
  const stroke = object.selected ? "#38bdf8" : "#f8fafc";
  const fillAlpha = object.shape === "tile" ? "rgba(245,158,11,0.18)" : "rgba(56,189,248,0.18)";
  const markerSize = Math.max(
    10,
    Math.min(
      object.screenWidth || 14,
      object.screenHeight || 14,
      18
    )
  );
  const width = Math.max(object.screenWidth, markerSize);
  const height = Math.max(object.screenHeight, markerSize);

  if (object.shape === "point") {
    return (
      <circle
        key={object.objectId}
        cx={object.screenX}
        cy={object.screenY}
        r={markerSize * 0.5}
        fill="rgba(56,189,248,0.4)"
        stroke={stroke}
        strokeWidth={2}
      />
    );
  }

  if (object.shape === "ellipse") {
    return (
      <ellipse
        key={object.objectId}
        cx={object.screenX + width / 2}
        cy={object.screenY + height / 2}
        rx={width / 2}
        ry={height / 2}
        fill="rgba(56,189,248,0.18)"
        stroke={stroke}
        strokeWidth={2}
      />
    );
  }

  if (
    (object.shape === "polygon" || object.shape === "polyline") &&
    object.screenPoints?.length
  ) {
    const points = object.screenPoints.map((point) => `${point.x},${point.y}`).join(" ");

    return object.shape === "polygon" ? (
      <polygon
        key={object.objectId}
        points={points}
        fill="rgba(56,189,248,0.18)"
        stroke={stroke}
        strokeWidth={2}
      />
    ) : (
      <polyline
        key={object.objectId}
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth={2}
      />
    );
  }

  const radius = object.shape === "capsule" ? Math.min(width, height) * 0.5 : Math.min(width, height) * 0.18;

  return (
    <rect
      key={object.objectId}
      x={object.screenX}
      y={object.screenY}
      width={width}
      height={height}
      rx={radius}
      ry={radius}
      fill={fillAlpha}
      stroke={stroke}
      strokeWidth={2}
    />
  );
}

export function TileCollisionCanvas(props: {
  renderBridge: EditorRenderBridge;
  viewState: TileCollisionCanvasViewState;
  selectedObjectIds: readonly CollisionCanvasObjectId[];
  onSelectionChange: (objectIds: CollisionCanvasObjectId[]) => void;
  onMoveCommit: (
    objectIds: readonly CollisionCanvasObjectId[],
    deltaX: number,
    deltaY: number
  ) => void;
}) {
  const [dragState, setDragState] = useState<TileCollisionCanvasDragState | undefined>();
  const layout = deriveTileCollisionCanvasLayout({
    viewState: props.viewState,
    dimensions: defaultTileCollisionCanvasDimensions
  });
  const objectTransformPreview = createTileCollisionCanvasObjectTransformPreview(dragState);
  const projectedObjects = useMemo(
    () => {
      const input = {
        map: props.viewState.previewMap,
        geometry: {
          tileWidth: layout.tileWidth,
          tileHeight: layout.tileHeight,
          gridOriginX: layout.originX,
          gridOriginY: layout.originY
        },
        viewport: {
          originX: 0,
          originY: 0
        },
        selectedObjectIds: props.selectedObjectIds as CollisionCanvasObjectId[]
      };

      return props.renderBridge.collectProjectedMapObjects(
        objectTransformPreview
          ? {
              ...input,
              objectTransformPreview
            }
          : input
      );
    },
    [
      objectTransformPreview,
      layout.originX,
      layout.originY,
      props.renderBridge,
      props.viewState.previewMap,
      props.selectedObjectIds,
      layout.tileHeight,
      layout.tileWidth
    ]
  );
  const tileBackgroundStyle = buildTileVisualStyle(props.viewState.tilePreview, layout.scale);

  function toLocalPoint(target: HTMLDivElement, clientX: number, clientY: number) {
    const bounds = target.getBoundingClientRect();

    return {
      x: clientX - bounds.left,
      y: clientY - bounds.top
    };
  }

  return (
    <div
      className="relative border border-slate-700 bg-slate-950"
      style={{
        width: `${layout.canvasWidth}px`,
        height: `${layout.canvasHeight}px`
      }}
      onPointerDown={(event) => {
        const point = toLocalPoint(event.currentTarget, event.clientX, event.clientY);
        const plan = createTileCollisionCanvasPointerDownPlan({
          pointerId: event.pointerId,
          point,
          pickedObjectId: props.renderBridge.pickProjectedObject(projectedObjects, point.x, point.y),
          selectedObjectIds: props.selectedObjectIds
        });

        if (plan.kind === "clear-selection") {
          props.onSelectionChange([]);
          return;
        }

        props.onSelectionChange(plan.nextSelectedObjectIds);
        event.currentTarget.setPointerCapture(event.pointerId);
        setDragState(plan.dragState);
      }}
      onPointerMove={(event) => {
        const plan = createTileCollisionCanvasPointerMovePlan({
          dragState,
          pointerId: event.pointerId,
          point: toLocalPoint(event.currentTarget, event.clientX, event.clientY),
          scale: layout.scale
        });

        if (plan.kind !== "drag") {
          return;
        }

        setDragState(plan.dragState);
      }}
      onPointerUp={(event) => {
        const plan = createTileCollisionCanvasPointerUpPlan({
          dragState,
          pointerId: event.pointerId
        });

        if (plan.kind !== "finish-drag") {
          return;
        }

        event.currentTarget.releasePointerCapture(event.pointerId);

        if (plan.commit) {
          props.onMoveCommit(
            plan.commit.objectIds,
            plan.commit.deltaX,
            plan.commit.deltaY
          );
        }

        setDragState(undefined);
      }}
    >
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(51,65,85,0.22)_1px,transparent_1px),linear-gradient(to_bottom,rgba(51,65,85,0.22)_1px,transparent_1px)]"
        style={{
          backgroundSize: `${layout.canvasPadding}px ${layout.canvasPadding}px`
        }}
      />
      <div
        className="absolute border border-slate-600 bg-slate-900"
        style={{
          left: `${layout.originX}px`,
          top: `${layout.originY}px`,
          width: `${layout.tileWidth}px`,
          height: `${layout.tileHeight}px`
        }}
      >
        <div className="h-full w-full" style={tileBackgroundStyle} />
      </div>
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${layout.canvasWidth} ${layout.canvasHeight}`}
      >
        {projectedObjects.map(renderProjectedObject)}
      </svg>
    </div>
  );
}
