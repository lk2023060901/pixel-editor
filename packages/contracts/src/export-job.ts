import type { DocumentSummary } from "./editor";

export type ExportJobStatus = "queued" | "running" | "completed" | "failed";

export interface ExportedDocumentArtifactContract {
  id: string;
  kind: DocumentSummary["kind"] | "project";
  name: string;
  path: string;
  content: string;
  contentType: string;
}

export interface ExportJobReceipt {
  jobId: string;
  status: ExportJobStatus;
  artifactPath: string;
}
