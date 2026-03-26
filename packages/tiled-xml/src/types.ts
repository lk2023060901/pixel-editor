import type {
  AssetReferenceDescriptor,
  AssetReferenceResolveOptions
} from "@pixel-editor/asset-reference";
import type { EditorMap, TilesetDefinition } from "@pixel-editor/domain";
import type { ImportedTmjTilesetReference } from "@pixel-editor/tiled-json";

export interface TiledXmlImportIssue {
  severity: "warning";
  code: string;
  message: string;
  path: string;
}

export type TmxImportIssue = TiledXmlImportIssue;
export type TsxImportIssue = TiledXmlImportIssue;

export interface TiledXmlImportOptions extends AssetReferenceResolveOptions {}

export interface ImportedTmxTilesetReference {
  firstGid: number;
  source?: string;
  name?: string;
  tileCount?: number;
  image?: string;
}

export interface ImportedTmxMapDocument {
  map: EditorMap;
  tilesetReferences: ImportedTmxTilesetReference[];
  assetReferences: AssetReferenceDescriptor[];
  issues: TmxImportIssue[];
}

export interface ImportedTsxTilesetDocument {
  tileset: TilesetDefinition;
  assetReferences: AssetReferenceDescriptor[];
  issues: TsxImportIssue[];
}

export interface ExportTmxMapDocumentInput {
  map: EditorMap;
  tilesetReferences?: readonly ImportedTmjTilesetReference[];
  formatVersion?: string;
  tiledVersion?: string;
}

export interface ExportTsxTilesetDocumentInput {
  tileset: TilesetDefinition;
  formatVersion?: string;
  tiledVersion?: string;
}
