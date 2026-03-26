import type {
  AssetReferenceDescriptor,
  AssetReferenceResolveOptions
} from "@pixel-editor/asset-reference";
import type { EditorWorld } from "@pixel-editor/domain";

export interface TiledWorldImportIssue {
  severity: "warning";
  code: string;
  message: string;
  path: string;
}

export interface TiledWorldImportOptions extends AssetReferenceResolveOptions {}

export interface ImportedTiledWorldDocument {
  world: EditorWorld;
  assetReferences: AssetReferenceDescriptor[];
  issues: TiledWorldImportIssue[];
}

export interface ExportTiledWorldDocumentInput {
  world: EditorWorld;
  documentPath?: string;
}

export type TiledWorldJsonPrimitive = string | number | boolean | null;
export type TiledWorldJsonValue =
  | TiledWorldJsonPrimitive
  | TiledWorldJsonObject
  | TiledWorldJsonValue[];

export interface TiledWorldJsonObject {
  [key: string]: TiledWorldJsonValue;
}
