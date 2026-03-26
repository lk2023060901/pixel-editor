import type {
  AssetReferenceDescriptor,
  AssetReferenceResolveOptions
} from "@pixel-editor/asset-reference";
import type { EditorProject } from "@pixel-editor/domain";

export interface TiledProjectImportIssue {
  severity: "warning";
  code: string;
  message: string;
  path: string;
}

export interface TiledProjectImportOptions
  extends Pick<AssetReferenceResolveOptions, "documentPath"> {}

export interface ImportedTiledProjectDocument {
  project: EditorProject;
  assetReferences: AssetReferenceDescriptor[];
  issues: TiledProjectImportIssue[];
}

export interface ExportTiledProjectDocumentInput {
  project: EditorProject;
}

export type TiledProjectJsonPrimitive = string | number | boolean | null;
export type TiledProjectJsonValue =
  | TiledProjectJsonPrimitive
  | TiledProjectJsonObject
  | TiledProjectJsonValue[];

export interface TiledProjectJsonObject {
  [key: string]: TiledProjectJsonValue;
}
