import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

function fromRepositoryRoot(path: string): string {
  return fileURLToPath(new URL(path, import.meta.url));
}

export default defineConfig({
  resolve: {
    alias: {
      "@pixel-editor/contracts": fromRepositoryRoot("./packages/contracts/src/index.ts"),
      "@pixel-editor/domain": fromRepositoryRoot("./packages/domain/src/index.ts"),
      "@pixel-editor/i18n": fromRepositoryRoot("./packages/i18n/src/index.ts"),
      "@pixel-editor/i18n/client": fromRepositoryRoot("./packages/i18n/src/client.tsx"),
      "@pixel-editor/command-engine": fromRepositoryRoot("./packages/command-engine/src/index.ts"),
      "@pixel-editor/asset-reference": fromRepositoryRoot("./packages/asset-reference/src/index.ts"),
      "@pixel-editor/editor-state": fromRepositoryRoot("./packages/editor-state/src/index.ts"),
      "@pixel-editor/project": fromRepositoryRoot("./packages/project/src/index.ts"),
      "@pixel-editor/app-services": fromRepositoryRoot("./packages/app-services/src/index.ts"),
      "@pixel-editor/map": fromRepositoryRoot("./packages/map/src/index.ts"),
      "@pixel-editor/objects": fromRepositoryRoot("./packages/objects/src/index.ts"),
      "@pixel-editor/tileset": fromRepositoryRoot("./packages/tileset/src/index.ts"),
      "@pixel-editor/tiled-project": fromRepositoryRoot("./packages/tiled-project/src/index.ts"),
      "@pixel-editor/tiled-json": fromRepositoryRoot("./packages/tiled-json/src/index.ts"),
      "@pixel-editor/tiled-xml": fromRepositoryRoot("./packages/tiled-xml/src/index.ts"),
      "@pixel-editor/renderer-pixi": fromRepositoryRoot("./packages/renderer-pixi/src/index.ts"),
      "@pixel-editor/ui-editor": fromRepositoryRoot("./packages/ui-editor/src/index.ts")
    }
  },
  test: {
    environment: "node",
    include: ["packages/**/*.test.ts"]
  }
});
