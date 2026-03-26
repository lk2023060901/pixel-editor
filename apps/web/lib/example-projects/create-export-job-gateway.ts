import type { ExportJobGateway } from "@pixel-editor/app-services";
import type {
  ExportJobReceipt,
  ExportedDocumentArtifactContract
} from "@pixel-editor/contracts";

export function createExampleProjectExportJobGateway(
  projectId: string
): ExportJobGateway {
  return {
    async queueDocumentExport(
      document: ExportedDocumentArtifactContract
    ): Promise<ExportJobReceipt> {
      const response = await fetch(`/api/example-projects/${projectId}/export-jobs`, {
        method: "POST",
        headers: {
          "content-type": "application/json; charset=utf-8"
        },
        body: JSON.stringify({
          artifact: document
        })
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage || `Failed to queue export for ${document.path}`);
      }

      return (await response.json()) as ExportJobReceipt;
    }
  };
}
