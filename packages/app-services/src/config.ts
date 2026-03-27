import type { FeatureStatusSummary } from "@pixel-editor/contracts";
import type { CreateMapInput } from "@pixel-editor/domain";

type MapBlueprint = Omit<
  CreateMapInput,
  "name" | "layers" | "properties" | "tilesetIds"
>;

export const foundationFeatureStatuses: FeatureStatusSummary[] = [
  { id: "FND-001", name: "Monorepo 工作区骨架", status: "已完成" },
  { id: "FND-002", name: "TypeScript 严格配置", status: "已完成" },
  { id: "FND-003", name: "Lint 与测试基础设施", status: "已完成" },
  { id: "FND-004", name: "Next.js Web 应用壳", status: "已完成" },
  { id: "DOM-001", name: "基础 ID 与引用模型", status: "开发中" },
  { id: "CMD-001", name: "Command 接口与执行上下文", status: "开发中" },
  { id: "REN-001", name: "Pixi 渲染器启动与宿主接口", status: "开发中" }
];

export const defaultProjectAssetRoots = ["maps", "tilesets", "templates"] as const;

export const defaultMapLayerNames = {
  tile: "Ground",
  object: "Objects"
} as const;

export const layerNamePrefixes = {
  tile: "Tile Layer",
  object: "Object Layer",
  image: "Image Layer",
  group: "Group Layer"
} as const;

export const objectNamePrefix = "Object";
export const mapNamePrefix = "map";
export const defaultWangSetName = "Unnamed Set";

export interface EditorNamingConfig {
  mapNamePrefix: string;
  defaultMapLayerNames: {
    tile: string;
    object: string;
  };
  layerNamePrefixes: {
    tile: string;
    object: string;
    image: string;
    group: string;
  };
  objectNamePrefix: string;
  defaultWangSetName: string;
}

export const defaultEditorNamingConfig: EditorNamingConfig = {
  mapNamePrefix,
  defaultMapLayerNames,
  layerNamePrefixes,
  objectNamePrefix,
  defaultWangSetName
};

export const quickMapBlueprint: MapBlueprint = {
  orientation: "orthogonal",
  width: 48,
  height: 32,
  tileWidth: 32,
  tileHeight: 32
};

export function createIndexedName(prefix: string, index: number): string {
  return `${prefix} ${index}`;
}

export function createIndexedSlug(prefix: string, index: number): string {
  return `${prefix}-${index}`;
}
