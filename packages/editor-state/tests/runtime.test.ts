import { describe, expect, it } from "vitest";

import type { LayerId, MapId } from "@pixel-editor/domain";
import {
  clearEditorRuntimeInteractions,
  createEditorRuntimeState,
  createShapeFillCanvasPreview,
  createTileClipboardState,
  setEditorRuntimeClipboard
} from "@pixel-editor/editor-state";

const mapId = "map-1" as MapId;
const layerId = "layer-1" as LayerId;

describe("editor runtime state", () => {
  it("preserves clipboard contents when clearing transient interactions", () => {
    const clipboard = createTileClipboardState({
      stamp: {
        kind: "single",
        gid: 23
      },
      sourceBounds: {
        x: 4,
        y: 5,
        width: 1,
        height: 1
      }
    });
    const runtime = createEditorRuntimeState({
      clipboard,
      interactions: {
        canvasPreview: createShapeFillCanvasPreview({
          mapId,
          layerId,
          mode: "rectangle",
          originX: 2,
          originY: 3,
          gid: 23
        })
      }
    });

    const nextRuntime = clearEditorRuntimeInteractions(runtime);

    expect(nextRuntime.clipboard).toEqual(clipboard);
    expect(nextRuntime.interactions.canvasPreview.kind).toBe("none");
  });

  it("updates clipboard without mutating the interaction slice", () => {
    const runtime = createEditorRuntimeState({
      interactions: {
        canvasPreview: createShapeFillCanvasPreview({
          mapId,
          layerId,
          mode: "ellipse",
          originX: 7,
          originY: 9,
          gid: 31
        })
      }
    });
    const clipboard = createTileClipboardState({
      stamp: {
        kind: "single",
        gid: 31
      },
      sourceBounds: {
        x: 7,
        y: 9,
        width: 1,
        height: 1
      }
    });

    const nextRuntime = setEditorRuntimeClipboard(runtime, clipboard);

    expect(nextRuntime.clipboard).toEqual(clipboard);
    expect(nextRuntime.interactions).toEqual(runtime.interactions);
  });
});
