import type {
  CreateImageCollectionTilesetInput,
  CreateImageTilesetInput
} from "@pixel-editor/domain";

export interface SpriteTilesetDraft {
  name: string;
  imagePath: string;
  imageWidth: string;
  imageHeight: string;
  tileWidth: string;
  tileHeight: string;
  columns: string;
}

export interface CollectionTilesetDraft {
  name: string;
  tileWidth: string;
  tileHeight: string;
  imageSources: string;
}

function parseInteger(value: string): number | undefined {
  if (!value.trim()) {
    return undefined;
  }

  const parsedValue = Number.parseInt(value, 10);

  return Number.isNaN(parsedValue) ? undefined : parsedValue;
}

export function createSpriteTilesetDraft(name: string): SpriteTilesetDraft {
  return {
    name,
    imagePath: "",
    imageWidth: "256",
    imageHeight: "256",
    tileWidth: "32",
    tileHeight: "32",
    columns: "8"
  };
}

export function createCollectionTilesetDraft(name: string): CollectionTilesetDraft {
  return {
    name,
    tileWidth: "32",
    tileHeight: "32",
    imageSources: ""
  };
}

export function updateSpriteTilesetDraftField<TKey extends keyof SpriteTilesetDraft>(args: {
  draft: SpriteTilesetDraft;
  field: TKey;
  value: SpriteTilesetDraft[TKey];
}): SpriteTilesetDraft {
  return {
    ...args.draft,
    [args.field]: args.value
  };
}

export function updateCollectionTilesetDraftField<TKey extends keyof CollectionTilesetDraft>(args: {
  draft: CollectionTilesetDraft;
  field: TKey;
  value: CollectionTilesetDraft[TKey];
}): CollectionTilesetDraft {
  return {
    ...args.draft,
    [args.field]: args.value
  };
}

export function resolveCollectionTilesetImageSources(value: string): string[] {
  return value
    .split(/\n|,/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function buildCreateSpriteTilesetInput(args: {
  draft: SpriteTilesetDraft;
  untitledName: string;
}): CreateImageTilesetInput | undefined {
  const imageWidth = parseInteger(args.draft.imageWidth);
  const imageHeight = parseInteger(args.draft.imageHeight);
  const tileWidth = parseInteger(args.draft.tileWidth);
  const tileHeight = parseInteger(args.draft.tileHeight);
  const columns = parseInteger(args.draft.columns);
  const imagePath = args.draft.imagePath.trim();

  if (
    !imagePath ||
    imageWidth === undefined ||
    imageHeight === undefined ||
    tileWidth === undefined ||
    tileHeight === undefined ||
    columns === undefined
  ) {
    return undefined;
  }

  return {
    name: args.draft.name.trim() || args.untitledName,
    imagePath,
    imageWidth,
    imageHeight,
    tileWidth,
    tileHeight,
    columns
  };
}

export function buildCreateCollectionTilesetInput(args: {
  draft: CollectionTilesetDraft;
  untitledName: string;
}): CreateImageCollectionTilesetInput | undefined {
  const tileWidth = parseInteger(args.draft.tileWidth);
  const tileHeight = parseInteger(args.draft.tileHeight);
  const imageSources = resolveCollectionTilesetImageSources(args.draft.imageSources);

  if (tileWidth === undefined || tileHeight === undefined || imageSources.length === 0) {
    return undefined;
  }

  return {
    name: args.draft.name.trim() || args.untitledName,
    tileWidth,
    tileHeight,
    imageSources
  };
}
