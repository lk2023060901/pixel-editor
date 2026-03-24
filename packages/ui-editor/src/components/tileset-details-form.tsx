"use client";

import type { EditorController } from "@pixel-editor/app-services";
import type {
  TilesetDefinition,
  TilesetFillMode,
  TilesetObjectAlignment,
  TilesetTileRenderSize
} from "@pixel-editor/domain";
import { startTransition, useEffect, useState } from "react";

import { NumberField, SelectField, TextField } from "./editor-fields";

interface TilesetDetailsDraft {
  name: string;
  tileWidth: string;
  tileHeight: string;
  tileOffsetX: string;
  tileOffsetY: string;
  objectAlignment: TilesetObjectAlignment;
  tileRenderSize: TilesetTileRenderSize;
  fillMode: TilesetFillMode;
  imagePath: string;
  imageWidth: string;
  imageHeight: string;
  margin: string;
  spacing: string;
  columns: string;
}

const objectAlignmentOptions: Array<{ label: string; value: TilesetObjectAlignment }> = [
  { label: "Unspecified", value: "unspecified" },
  { label: "Top Left", value: "topleft" },
  { label: "Top", value: "top" },
  { label: "Top Right", value: "topright" },
  { label: "Left", value: "left" },
  { label: "Center", value: "center" },
  { label: "Right", value: "right" },
  { label: "Bottom Left", value: "bottomleft" },
  { label: "Bottom", value: "bottom" },
  { label: "Bottom Right", value: "bottomright" }
];

const tileRenderSizeOptions: Array<{ label: string; value: TilesetTileRenderSize }> = [
  { label: "Tile", value: "tile" },
  { label: "Grid", value: "grid" }
];

const fillModeOptions: Array<{ label: string; value: TilesetFillMode }> = [
  { label: "Stretch", value: "stretch" },
  { label: "Preserve Aspect Fit", value: "preserve-aspect-fit" }
];

function createDetailsDraft(tileset: TilesetDefinition): TilesetDetailsDraft {
  return {
    name: tileset.name,
    tileWidth: String(tileset.tileWidth),
    tileHeight: String(tileset.tileHeight),
    tileOffsetX: String(tileset.tileOffsetX),
    tileOffsetY: String(tileset.tileOffsetY),
    objectAlignment: tileset.objectAlignment,
    tileRenderSize: tileset.tileRenderSize,
    fillMode: tileset.fillMode,
    imagePath: tileset.kind === "image" && tileset.source ? tileset.source.imagePath : "",
    imageWidth:
      tileset.kind === "image" && tileset.source?.imageWidth !== undefined
        ? String(tileset.source.imageWidth)
        : "",
    imageHeight:
      tileset.kind === "image" && tileset.source?.imageHeight !== undefined
        ? String(tileset.source.imageHeight)
        : "",
    margin: tileset.kind === "image" && tileset.source ? String(tileset.source.margin) : "0",
    spacing: tileset.kind === "image" && tileset.source ? String(tileset.source.spacing) : "0",
    columns:
      tileset.kind === "image" && tileset.source?.columns !== undefined
        ? String(tileset.source.columns)
        : ""
  };
}

function parseInteger(value: string): number | undefined {
  if (!value.trim()) {
    return undefined;
  }

  const parsedValue = Number.parseInt(value, 10);

  return Number.isNaN(parsedValue) ? undefined : parsedValue;
}

export function TilesetDetailsForm(props: {
  tileset: TilesetDefinition;
  store: EditorController;
}) {
  const [draft, setDraft] = useState(() => createDetailsDraft(props.tileset));

  useEffect(() => {
    setDraft(createDetailsDraft(props.tileset));
  }, [props.tileset]);

  return (
    <div className="mt-6 space-y-4 border-t border-slate-800 pt-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs tracking-[0.18em] text-slate-500 uppercase">Tileset Parameters</p>
        <button
          className="rounded-xl border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-100 transition hover:bg-amber-500/20"
          onClick={() => {
            const tileWidth = parseInteger(draft.tileWidth);
            const tileHeight = parseInteger(draft.tileHeight);
            const tileOffsetX = parseInteger(draft.tileOffsetX);
            const tileOffsetY = parseInteger(draft.tileOffsetY);
            const imageWidth = parseInteger(draft.imageWidth);
            const imageHeight = parseInteger(draft.imageHeight);
            const margin = parseInteger(draft.margin);
            const spacing = parseInteger(draft.spacing);
            const columns = draft.columns.trim() ? parseInteger(draft.columns) : null;

            if (
              tileWidth === undefined ||
              tileHeight === undefined ||
              tileOffsetX === undefined ||
              tileOffsetY === undefined
            ) {
              return;
            }

            startTransition(() => {
              const nextPatch = {
                name: draft.name.trim() || props.tileset.name,
                tileWidth,
                tileHeight,
                tileOffsetX,
                tileOffsetY,
                objectAlignment: draft.objectAlignment,
                tileRenderSize: draft.tileRenderSize,
                fillMode: draft.fillMode
              };

              props.store.updateActiveTilesetDetails({
                ...nextPatch,
                ...(props.tileset.kind === "image"
                  ? {
                      ...(draft.imagePath.trim()
                        ? { imagePath: draft.imagePath.trim() }
                        : {}),
                      ...(imageWidth !== undefined ? { imageWidth } : {}),
                      ...(imageHeight !== undefined ? { imageHeight } : {}),
                      ...(margin !== undefined ? { margin } : {}),
                      ...(spacing !== undefined ? { spacing } : {}),
                      ...(columns !== undefined ? { columns } : {})
                    }
                  : {})
              });
            });
          }}
        >
          Apply Tileset Changes
        </button>
      </div>

      <div className="grid gap-3">
        <TextField
          label="Name"
          value={draft.name}
          onChange={(value) => {
            setDraft((current) => ({ ...current, name: value }));
          }}
        />
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            label="Tile Width"
            value={draft.tileWidth}
            onChange={(value) => {
              setDraft((current) => ({ ...current, tileWidth: value }));
            }}
          />
          <NumberField
            label="Tile Height"
            value={draft.tileHeight}
            onChange={(value) => {
              setDraft((current) => ({ ...current, tileHeight: value }));
            }}
          />
          <NumberField
            label="Tile Offset X"
            value={draft.tileOffsetX}
            onChange={(value) => {
              setDraft((current) => ({ ...current, tileOffsetX: value }));
            }}
          />
          <NumberField
            label="Tile Offset Y"
            value={draft.tileOffsetY}
            onChange={(value) => {
              setDraft((current) => ({ ...current, tileOffsetY: value }));
            }}
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <SelectField
            label="Object Alignment"
            value={draft.objectAlignment}
            options={objectAlignmentOptions}
            onChange={(value) => {
              setDraft((current) => ({
                ...current,
                objectAlignment: value as TilesetObjectAlignment
              }));
            }}
          />
          <SelectField
            label="Render Size"
            value={draft.tileRenderSize}
            options={tileRenderSizeOptions}
            onChange={(value) => {
              setDraft((current) => ({
                ...current,
                tileRenderSize: value as TilesetTileRenderSize
              }));
            }}
          />
          <SelectField
            label="Fill Mode"
            value={draft.fillMode}
            options={fillModeOptions}
            onChange={(value) => {
              setDraft((current) => ({
                ...current,
                fillMode: value as TilesetFillMode
              }));
            }}
          />
        </div>

        {props.tileset.kind === "image" && (
          <>
            <TextField
              label="Image Path"
              value={draft.imagePath}
              onChange={(value) => {
                setDraft((current) => ({ ...current, imagePath: value }));
              }}
            />
            <div className="grid grid-cols-2 gap-3">
              <NumberField
                label="Image Width"
                value={draft.imageWidth}
                onChange={(value) => {
                  setDraft((current) => ({ ...current, imageWidth: value }));
                }}
              />
              <NumberField
                label="Image Height"
                value={draft.imageHeight}
                onChange={(value) => {
                  setDraft((current) => ({ ...current, imageHeight: value }));
                }}
              />
              <NumberField
                label="Margin"
                value={draft.margin}
                onChange={(value) => {
                  setDraft((current) => ({ ...current, margin: value }));
                }}
              />
              <NumberField
                label="Spacing"
                value={draft.spacing}
                onChange={(value) => {
                  setDraft((current) => ({ ...current, spacing: value }));
                }}
              />
              <NumberField
                label="Columns"
                value={draft.columns}
                onChange={(value) => {
                  setDraft((current) => ({ ...current, columns: value }));
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
