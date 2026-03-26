import type { DocumentRepository, SavedEditorDocument } from "@pixel-editor/app-services";

export function createExampleProjectDocumentRepository(
  projectId: string
): DocumentRepository {
  return {
    async saveDocument(document: SavedEditorDocument): Promise<void> {
      const response = await fetch(`/api/example-projects/${projectId}/documents`, {
        method: "POST",
        headers: {
          "content-type": "application/json; charset=utf-8"
        },
        body: JSON.stringify({
          path: document.path,
          content: document.content
        })
      });

      if (response.ok) {
        return;
      }

      const errorMessage = await response.text();
      throw new Error(errorMessage || `Failed to save ${document.path}`);
    }
  };
}
