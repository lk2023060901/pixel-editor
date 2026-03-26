import type {
  AssetReferenceDescriptor,
  AssetReferenceResolveOptions
} from "@pixel-editor/asset-reference";
import type { EditorMap, TilesetDefinition } from "@pixel-editor/domain";

export interface TiledJsonImportIssue {
  severity: "warning";
  code: string;
  message: string;
  path: string;
}

export type TmjImportIssue = TiledJsonImportIssue;
export type TsjImportIssue = TiledJsonImportIssue;

export interface TiledJsonImportOptions extends AssetReferenceResolveOptions {}

export interface ImportedTmjTilesetReference {
  firstGid: number;
  source?: string;
  name?: string;
  tileCount?: number;
  image?: string;
}

export interface ImportedTmjMapDocument {
  map: EditorMap;
  tilesetReferences: ImportedTmjTilesetReference[];
  assetReferences: AssetReferenceDescriptor[];
  issues: TmjImportIssue[];
}

export interface ImportedTsjTilesetDocument {
  tileset: TilesetDefinition;
  assetReferences: AssetReferenceDescriptor[];
  issues: TsjImportIssue[];
}

export interface ExportTmjMapDocumentInput {
  map: EditorMap;
  tilesetReferences?: readonly ImportedTmjTilesetReference[];
  formatVersion?: string;
  tiledVersion?: string;
  minimized?: boolean;
  resolveObjectTypesAndProperties?: boolean;
}

export interface ExportTsjTilesetDocumentInput {
  tileset: TilesetDefinition;
  formatVersion?: string;
  tiledVersion?: string;
  minimized?: boolean;
  resolveObjectTypesAndProperties?: boolean;
}

export type TmjJsonPrimitive = string | number | boolean | null;
export type TmjJsonValue = TmjJsonPrimitive | TmjJsonObject | TmjJsonValue[];
export interface TmjJsonObject {
  [key: string]: TmjJsonValue;
}
