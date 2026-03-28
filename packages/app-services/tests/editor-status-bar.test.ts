import { describe, expect, it } from "vitest";

import {
  deriveEditorStatusBarPresentation,
  formatEditorStatusBarZoom,
  parseEditorStatusBarZoom,
  resolveEditorStatusBarLayerIconUrl,
  resolveEditorStatusBarZoomDraft
} from "../src/ui";

describe("editor status bar helpers", () => {
  it("formats and parses zoom values through shared helpers", () => {
    expect(formatEditorStatusBarZoom(1.5)).toBe("150 %");
    expect(parseEditorStatusBarZoom("150 %")).toBe(1.5);
    expect(parseEditorStatusBarZoom(" 75 ")).toBe(0.75);
    expect(parseEditorStatusBarZoom("abc")).toBeUndefined();
  });

  it("resolves zoom drafts with normalized fallback behavior", () => {
    expect(
      resolveEditorStatusBarZoomDraft({
        draft: "175%",
        fallbackZoom: 1
      })
    ).toEqual({
      nextDraft: "175 %",
      zoom: 1.75
    });
    expect(
      resolveEditorStatusBarZoomDraft({
        draft: "oops",
        fallbackZoom: 1.25
      })
    ).toEqual({
      nextDraft: "125 %"
    });
  });

  it("derives icon and zoom options through presentation api", () => {
    const presentation = deriveEditorStatusBarPresentation({
      activeLayerKind: "image",
      errorCount: 1,
      warningCount: 2,
      layerOptions: [],
      zoom: 2
    });

    expect(resolveEditorStatusBarLayerIconUrl("group")).toBe(
      "/vendor/tiled-statusbar/layer-tile.png"
    );
    expect(presentation.activeLayerIconUrl).toBe(
      "/vendor/tiled-statusbar/layer-image.png"
    );
    expect(presentation.zoomDraft).toBe("200 %");
    expect(presentation.zoomOptions).toContain("100 %");
    expect(presentation.zoomOptions).toContain("25600 %");
  });
});
