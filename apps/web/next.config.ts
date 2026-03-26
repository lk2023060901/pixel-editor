import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@pixel-editor/app-services",
    "@pixel-editor/asset-reference",
    "@pixel-editor/command-engine",
    "@pixel-editor/contracts",
    "@pixel-editor/domain",
    "@pixel-editor/i18n",
    "@pixel-editor/editor-state",
    "@pixel-editor/map",
    "@pixel-editor/objects",
    "@pixel-editor/project",
    "@pixel-editor/renderer-pixi",
    "@pixel-editor/tiled-json",
    "@pixel-editor/tiled-project",
    "@pixel-editor/tiled-xml",
    "@pixel-editor/tileset",
    "@pixel-editor/ui-editor"
  ]
};

export default nextConfig;
