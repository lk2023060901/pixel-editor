import { describe, expect, it } from "vitest";

import type { LayerId, MapId, ObjectId } from "@pixel-editor/domain";
import {
  clearEditorRuntimeIssueEntries,
  clearEditorRuntimeInteractions,
  createEditorRuntimeState,
  createObjectMovePreview,
  createShapeFillCanvasPreview,
  createTileClipboardState,
  replaceEditorRuntimeIssueSourceEntries,
  setEditorRuntimeClipboard,
  setEditorRuntimeIssuePanelOpen
} from "@pixel-editor/editor-state";

const mapId = "map-1" as MapId;
const layerId = "layer-1" as LayerId;
const objectId = "object-1" as ObjectId;

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
        }),
        objectTransformPreview: createObjectMovePreview({
          mapId,
          layerId,
          objectIds: [objectId],
          anchorX: 32,
          anchorY: 48,
          referenceX: 32,
          referenceY: 48
        })
      }
    });

    const nextRuntime = clearEditorRuntimeInteractions(runtime);

    expect(nextRuntime.clipboard).toEqual(clipboard);
    expect(nextRuntime.interactions.canvasPreview.kind).toBe("none");
    expect(nextRuntime.interactions.objectTransformPreview.kind).toBe("none");
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
        }),
        objectTransformPreview: { kind: "none" }
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

  it("replaces issue entries for a source and preserves clipboard state", () => {
    const clipboard = createTileClipboardState({
      stamp: {
        kind: "single",
        gid: 9
      },
      sourceBounds: {
        x: 1,
        y: 1,
        width: 1,
        height: 1
      }
    });
    const runtime = createEditorRuntimeState({ clipboard });

    const nextRuntime = replaceEditorRuntimeIssueSourceEntries(runtime, "map:1", [
      {
        id: "map:1:warning",
        sourceId: "map:1",
        sourceKind: "tmx",
        documentName: "demo",
        severity: "warning",
        code: "tmx.element.unknown",
        message: "Unknown element.",
        path: "tmx.unknown[0]"
      }
    ]);

    expect(nextRuntime.clipboard).toEqual(clipboard);
    expect(nextRuntime.issues.entries).toEqual([
      {
        id: "map:1:warning",
        sourceId: "map:1",
        sourceKind: "tmx",
        documentName: "demo",
        severity: "warning",
        code: "tmx.element.unknown",
        message: "Unknown element.",
        path: "tmx.unknown[0]"
      }
    ]);
  });

  it("opens and clears the issue panel without mutating interactions", () => {
    const runtime = createEditorRuntimeState({
      interactions: {
        canvasPreview: createShapeFillCanvasPreview({
          mapId,
          layerId,
          mode: "ellipse",
          originX: 7,
          originY: 9,
          gid: 31
        }),
        objectTransformPreview: { kind: "none" }
      }
    });

    const openedRuntime = setEditorRuntimeIssuePanelOpen(runtime, true);
    const clearedRuntime = clearEditorRuntimeIssueEntries(openedRuntime);

    expect(openedRuntime.issues.panelOpen).toBe(true);
    expect(clearedRuntime.issues.entries).toEqual([]);
    expect(clearedRuntime.interactions).toEqual(runtime.interactions);
  });
});
