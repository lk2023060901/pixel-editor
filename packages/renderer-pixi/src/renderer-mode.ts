import type { EditorMap } from "@pixel-editor/domain";

import { supportsRenderedMapOrientation } from "./tile-texture";

export type RendererMode = "empty" | "unsupported" | "ready";

export function getRendererMode(map?: EditorMap): RendererMode {
  if (!map) {
    return "empty";
  }

  return supportsRenderedMapOrientation(map) ? "ready" : "unsupported";
}
