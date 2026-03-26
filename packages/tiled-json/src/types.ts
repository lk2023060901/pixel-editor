import type { EditorMap, TilesetDefinition } from "@pixel-editor/domain";

export interface TiledJsonImportIssue {
  severity: "warning";
  code: string;
  message: string;
  path: string;
}

export type TmjImportIssue = TiledJsonImportIssue;
export type TsjImportIssue = TiledJsonImportIssue;

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
  issues: TmjImportIssue[];
}

export interface ImportedTsjTilesetDocument {
  tileset: TilesetDefinition;
  issues: TsjImportIssue[];
}

export interface ExportTmjMapDocumentInput {
  map: EditorMap;
  tilesetReferences?: readonly ImportedTmjTilesetReference[];
  formatVersion?: string;
  tiledVersion?: string;
}

export interface ExportTsjTilesetDocumentInput {
  tileset: TilesetDefinition;
  formatVersion?: string;
  tiledVersion?: string;
}

export type TmjJsonPrimitive = string | number | boolean | null;
export type TmjJsonValue = TmjJsonPrimitive | TmjJsonObject | TmjJsonValue[];
export interface TmjJsonObject {
  [key: string]: TmjJsonValue;
}
