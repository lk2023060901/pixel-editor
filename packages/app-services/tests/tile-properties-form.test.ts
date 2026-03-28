import { describe, expect, it } from "vitest";

import {
  createTileMetadataDraft,
  resolveTileMetadataDraftCommit
} from "../src/ui";

describe("tile properties form helpers", () => {
  it("creates tile metadata drafts through exported APIs", () => {
    expect(
      createTileMetadataDraft({
        localId: 7,
        className: "wall",
        probability: 0.75,
        properties: [],
        suggestedProperties: []
      })
    ).toEqual({
      className: "wall",
      probability: "0.75"
    });
  });

  it("resolves tile metadata commits and resets invalid probability", () => {
    const tile = {
      localId: 7,
      className: "wall",
      probability: 0.75,
      properties: [],
      suggestedProperties: []
    } as const;

    expect(
      resolveTileMetadataDraftCommit({
        tile,
        draft: {
          className: "solid",
          probability: "1.5"
        }
      })
    ).toEqual({
      nextDraft: {
        className: "solid",
        probability: "1.5"
      },
      patch: {
        className: "solid",
        probability: 1.5
      }
    });

    expect(
      resolveTileMetadataDraftCommit({
        tile,
        draft: {
          className: "solid",
          probability: "-1"
        }
      })
    ).toEqual({
      nextDraft: createTileMetadataDraft(tile)
    });
  });
});
