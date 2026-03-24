"use client";

import type { EditorController } from "@pixel-editor/app-services";
import { startTransition, useState } from "react";

import { NumberField, TextAreaField, TextField } from "./editor-fields";

interface SpriteTilesetDraft {
  name: string;
  imagePath: string;
  imageWidth: string;
  imageHeight: string;
  tileWidth: string;
  tileHeight: string;
  columns: string;
}

interface CollectionTilesetDraft {
  name: string;
  tileWidth: string;
  tileHeight: string;
  imageSources: string;
}

const defaultSpriteDraft: SpriteTilesetDraft = {
  name: "New Sprite Tileset",
  imagePath: "",
  imageWidth: "256",
  imageHeight: "256",
  tileWidth: "32",
  tileHeight: "32",
  columns: "8"
};

const defaultCollectionDraft: CollectionTilesetDraft = {
  name: "New Image Collection",
  tileWidth: "32",
  tileHeight: "32",
  imageSources: ""
};

function parseInteger(value: string): number | undefined {
  if (!value.trim()) {
    return undefined;
  }

  const parsedValue = Number.parseInt(value, 10);

  return Number.isNaN(parsedValue) ? undefined : parsedValue;
}

export function TilesetCreateForms(props: {
  store: EditorController;
}) {
  const [spriteDraft, setSpriteDraft] = useState(defaultSpriteDraft);
  const [collectionDraft, setCollectionDraft] = useState(defaultCollectionDraft);

  return (
    <div className="mt-6 space-y-4 border-t border-slate-800 pt-4">
      <div>
        <p className="text-xs tracking-[0.18em] text-slate-500 uppercase">
          Create Sprite Sheet Tileset
        </p>
        <div className="mt-3 grid gap-3">
          <TextField
            label="Name"
            value={spriteDraft.name}
            onChange={(value) => {
              setSpriteDraft((current) => ({ ...current, name: value }));
            }}
          />
          <TextField
            label="Image Path"
            value={spriteDraft.imagePath}
            onChange={(value) => {
              setSpriteDraft((current) => ({ ...current, imagePath: value }));
            }}
          />
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label="Image Width"
              value={spriteDraft.imageWidth}
              onChange={(value) => {
                setSpriteDraft((current) => ({ ...current, imageWidth: value }));
              }}
            />
            <NumberField
              label="Image Height"
              value={spriteDraft.imageHeight}
              onChange={(value) => {
                setSpriteDraft((current) => ({ ...current, imageHeight: value }));
              }}
            />
            <NumberField
              label="Tile Width"
              value={spriteDraft.tileWidth}
              onChange={(value) => {
                setSpriteDraft((current) => ({ ...current, tileWidth: value }));
              }}
            />
            <NumberField
              label="Tile Height"
              value={spriteDraft.tileHeight}
              onChange={(value) => {
                setSpriteDraft((current) => ({ ...current, tileHeight: value }));
              }}
            />
            <NumberField
              label="Columns"
              value={spriteDraft.columns}
              onChange={(value) => {
                setSpriteDraft((current) => ({ ...current, columns: value }));
              }}
            />
          </div>
          <button
            className="rounded-xl border border-emerald-500/50 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-500/20"
            onClick={() => {
              const imageWidth = parseInteger(spriteDraft.imageWidth);
              const imageHeight = parseInteger(spriteDraft.imageHeight);
              const tileWidth = parseInteger(spriteDraft.tileWidth);
              const tileHeight = parseInteger(spriteDraft.tileHeight);
              const columns = parseInteger(spriteDraft.columns);

              if (
                !spriteDraft.imagePath.trim() ||
                imageWidth === undefined ||
                imageHeight === undefined ||
                tileWidth === undefined ||
                tileHeight === undefined ||
                columns === undefined
              ) {
                return;
              }

              startTransition(() => {
                props.store.createSpriteSheetTileset({
                  name: spriteDraft.name.trim() || "Untitled Tileset",
                  imagePath: spriteDraft.imagePath.trim(),
                  imageWidth,
                  imageHeight,
                  tileWidth,
                  tileHeight,
                  columns
                });
              });
            }}
          >
            Create Sprite Sheet Tileset
          </button>
        </div>
      </div>

      <div>
        <p className="text-xs tracking-[0.18em] text-slate-500 uppercase">
          Create Image Collection
        </p>
        <div className="mt-3 grid gap-3">
          <TextField
            label="Name"
            value={collectionDraft.name}
            onChange={(value) => {
              setCollectionDraft((current) => ({ ...current, name: value }));
            }}
          />
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label="Tile Width"
              value={collectionDraft.tileWidth}
              onChange={(value) => {
                setCollectionDraft((current) => ({ ...current, tileWidth: value }));
              }}
            />
            <NumberField
              label="Tile Height"
              value={collectionDraft.tileHeight}
              onChange={(value) => {
                setCollectionDraft((current) => ({ ...current, tileHeight: value }));
              }}
            />
          </div>
          <TextAreaField
            label="Image Sources"
            value={collectionDraft.imageSources}
            onChange={(value) => {
              setCollectionDraft((current) => ({ ...current, imageSources: value }));
            }}
          />
          <button
            className="rounded-xl border border-sky-500/50 bg-sky-500/10 px-3 py-2 text-sm font-medium text-sky-100 transition hover:bg-sky-500/20"
            onClick={() => {
              const tileWidth = parseInteger(collectionDraft.tileWidth);
              const tileHeight = parseInteger(collectionDraft.tileHeight);
              const imageSources = collectionDraft.imageSources
                .split(/\n|,/)
                .map((value) => value.trim())
                .filter(Boolean);

              if (
                tileWidth === undefined ||
                tileHeight === undefined ||
                imageSources.length === 0
              ) {
                return;
              }

              startTransition(() => {
                props.store.createImageCollectionTileset({
                  name: collectionDraft.name.trim() || "Untitled Collection",
                  tileWidth,
                  tileHeight,
                  imageSources
                });
              });
            }}
          >
            Create Image Collection
          </button>
        </div>
      </div>
    </div>
  );
}
