export type FeatureStatusValue = "未开始" | "开发中" | "测试中" | "已完成";
export type ProjectAssetKind =
  | "folder"
  | "project"
  | "map"
  | "tileset"
  | "template"
  | "world"
  | "image"
  | "file";

export interface ProjectSummary {
  id: string;
  name: string;
  compatibilityVersion: string;
  assetRoots: string[];
}

export interface ProjectAssetSummary {
  id: string;
  name: string;
  path: string;
  kind: ProjectAssetKind;
  documentId?: string;
}

export interface DocumentSummary {
  id: string;
  name: string;
  kind: "map" | "tileset" | "template" | "world";
  layerCount?: number;
  objectCount?: number;
}

export interface FeatureStatusSummary {
  id: string;
  name: string;
  status: FeatureStatusValue;
}

export interface EditorViewportSnapshot {
  zoom: number;
  originX: number;
  originY: number;
  showGrid: boolean;
}

export interface EditorBootstrapContract {
  project: ProjectSummary;
  projectAssets: ProjectAssetSummary[];
  documents: DocumentSummary[];
  activeDocumentId?: string;
  activeTool: string;
  viewport: EditorViewportSnapshot;
  featureStatuses: FeatureStatusSummary[];
}
