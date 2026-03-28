import type { UpdateTileMetadataInput } from "@pixel-editor/domain";

import type { TilePropertiesEditorViewState } from "./ui-models";

type TileMetadataSourceViewState = NonNullable<
  TilePropertiesEditorViewState["tile"]
>;

export interface TileMetadataDraft {
  className: string;
  probability: string;
}

export interface TileMetadataDraftCommitResolution {
  nextDraft: TileMetadataDraft;
  patch?: UpdateTileMetadataInput;
}

export function createTileMetadataDraft(
  tile?: TileMetadataSourceViewState
): TileMetadataDraft {
  return {
    className: tile?.className ?? "",
    probability: String(tile?.probability ?? 1)
  };
}

export function resolveTileMetadataDraftCommit(input: {
  draft: TileMetadataDraft;
  tile: TileMetadataSourceViewState;
}): TileMetadataDraftCommitResolution {
  const probability = Number.parseFloat(input.draft.probability);

  if (Number.isNaN(probability) || probability < 0) {
    return {
      nextDraft: createTileMetadataDraft(input.tile)
    };
  }

  return {
    nextDraft: input.draft,
    patch: {
      className: input.draft.className.trim() || null,
      probability
    }
  };
}
