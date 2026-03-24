import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@pixel-editor/app-services",
    "@pixel-editor/command-engine",
    "@pixel-editor/contracts",
    "@pixel-editor/domain",
    "@pixel-editor/editor-state",
    "@pixel-editor/map",
    "@pixel-editor/objects",
    "@pixel-editor/renderer-pixi",
    "@pixel-editor/tileset",
    "@pixel-editor/ui-editor"
  ]
};

export default nextConfig;
