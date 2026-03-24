import type { LayerId, MapObject, ObjectBoundsRect } from "@pixel-editor/domain";

import type { TileSelectionBounds } from "./selection";
import type { TileStamp } from "./stamp";

export type ClipboardState =
  | { kind: "empty" }
  | {
      kind: "tile";
      stamp: TileStamp;
      sourceBounds: TileSelectionBounds;
    }
  | {
      kind: "object";
      objects: MapObject[];
      sourceLayerId: LayerId;
      sourceBounds: ObjectBoundsRect;
    };

export function createEmptyClipboardState(): ClipboardState {
  return { kind: "empty" };
}

export function createTileClipboardState(input: {
  stamp: TileStamp;
  sourceBounds: TileSelectionBounds;
}): ClipboardState {
  return {
    kind: "tile",
    stamp: input.stamp,
    sourceBounds: input.sourceBounds
  };
}

export function createObjectClipboardState(input: {
  objects: MapObject[];
  sourceLayerId: LayerId;
  sourceBounds: ObjectBoundsRect;
}): ClipboardState {
  return {
    kind: "object",
    objects: input.objects,
    sourceLayerId: input.sourceLayerId,
    sourceBounds: input.sourceBounds
  };
}

export function hasClipboardContent(clipboard: ClipboardState): boolean {
  return clipboard.kind !== "empty";
}
