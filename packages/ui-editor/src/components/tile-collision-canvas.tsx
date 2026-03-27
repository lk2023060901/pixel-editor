"use client";

import {
  type TileCollisionCanvasViewState
} from "@pixel-editor/app-services/ui";
import { useMemo, useState } from "react";

import type {
  EditorRenderBridge,
  EditorRenderObjectTransformPreview,
  EditorRenderProjectedMapObject
} from "../render-bridge";

import { buildTileVisualStyle } from "./tileset-view-helpers";

type CollisionCanvasObjectId = TileCollisionCanvasViewState["objects"][number]["id"];

const CANVAS_WIDTH = 360;
const CANVAS_HEIGHT = 360;
const CANVAS_PADDING = 24;

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
  const [dragState, setDragState] = useState<
    | {
        pointerId: number;
        objectIds: CollisionCanvasObjectId[];
        startLocalX: number;
        startLocalY: number;
        deltaX: number;
        deltaY: number;
      }
    | undefined
  >();
  const scale = Math.min(
    (CANVAS_WIDTH - CANVAS_PADDING * 2) / props.viewState.tileWidth,
    (CANVAS_HEIGHT - CANVAS_PADDING * 2) / props.viewState.tileHeight
  );
  const tileWidth = props.viewState.tileWidth * scale;
  const tileHeight = props.viewState.tileHeight * scale;
  const originX = Math.round((CANVAS_WIDTH - tileWidth) * 0.5);
  const originY = Math.round((CANVAS_HEIGHT - tileHeight) * 0.5);
  const objectTransformPreview: EditorRenderObjectTransformPreview | undefined = dragState
    ? {
        kind: "move",
        objectIds: dragState.objectIds,
        deltaX: dragState.deltaX,
        deltaY: dragState.deltaY
      }
    : undefined;
  const projectedObjects = useMemo(
    () => {
      const input = {
        map: props.viewState.previewMap,
        geometry: {
          tileWidth,
          tileHeight,
          gridOriginX: originX,
          gridOriginY: originY
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
      originX,
      originY,
      props.renderBridge,
      props.viewState.previewMap,
      props.selectedObjectIds,
      tileHeight,
      tileWidth
    ]
  );
  const tileBackgroundStyle = buildTileVisualStyle(props.viewState.tilePreview, scale);

  function toLocalPoint(target: HTMLDivElement, clientX: number, clientY: number) {
    const bounds = target.getBoundingClientRect();

    return {
      x: clientX - bounds.left,
      y: clientY - bounds.top
    };
  }

  return (
    <div
      className="relative h-[360px] w-[360px] border border-slate-700 bg-slate-950"
      onPointerDown={(event) => {
        const point = toLocalPoint(event.currentTarget, event.clientX, event.clientY);
        const objectId = props.renderBridge.pickProjectedObject(projectedObjects, point.x, point.y);

        if (!objectId) {
          props.onSelectionChange([]);
          return;
        }

        const nextSelection = props.selectedObjectIds.includes(objectId)
          ? [...props.selectedObjectIds]
          : [objectId];

        props.onSelectionChange(nextSelection);
        event.currentTarget.setPointerCapture(event.pointerId);
        setDragState({
          pointerId: event.pointerId,
          objectIds: nextSelection,
          startLocalX: point.x,
          startLocalY: point.y,
          deltaX: 0,
          deltaY: 0
        });
      }}
      onPointerMove={(event) => {
        if (!dragState || dragState.pointerId !== event.pointerId) {
          return;
        }

        const point = toLocalPoint(event.currentTarget, event.clientX, event.clientY);

        setDragState({
          ...dragState,
          deltaX: Math.round((point.x - dragState.startLocalX) / scale),
          deltaY: Math.round((point.y - dragState.startLocalY) / scale)
        });
      }}
      onPointerUp={(event) => {
        if (!dragState || dragState.pointerId !== event.pointerId) {
          return;
        }

        event.currentTarget.releasePointerCapture(event.pointerId);

        if (dragState.deltaX !== 0 || dragState.deltaY !== 0) {
          props.onMoveCommit(dragState.objectIds, dragState.deltaX, dragState.deltaY);
        }

        setDragState(undefined);
      }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(51,65,85,0.22)_1px,transparent_1px),linear-gradient(to_bottom,rgba(51,65,85,0.22)_1px,transparent_1px)] bg-[size:24px_24px]" />
      <div
        className="absolute border border-slate-600 bg-slate-900"
        style={{
          left: `${originX}px`,
          top: `${originY}px`,
          width: `${tileWidth}px`,
          height: `${tileHeight}px`
        }}
      >
        <div className="h-full w-full" style={tileBackgroundStyle} />
      </div>
      <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}>
        {projectedObjects.map(renderProjectedObject)}
      </svg>
    </div>
  );
}
