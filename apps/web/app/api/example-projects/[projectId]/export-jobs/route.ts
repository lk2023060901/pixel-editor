import type {
  ExportJobReceipt,
  ExportedDocumentArtifactContract
} from "@pixel-editor/contracts";
import { queueExportJob } from "@pixel-editor/export-jobs";

interface QueueExportJobRequest {
  artifact?: unknown;
}

function isExportedDocumentArtifactContract(
  value: unknown
): value is ExportedDocumentArtifactContract {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as ExportedDocumentArtifactContract).id === "string" &&
    typeof (value as ExportedDocumentArtifactContract).kind === "string" &&
    typeof (value as ExportedDocumentArtifactContract).name === "string" &&
    typeof (value as ExportedDocumentArtifactContract).path === "string" &&
    typeof (value as ExportedDocumentArtifactContract).content === "string" &&
    typeof (value as ExportedDocumentArtifactContract).contentType === "string"
  );
}

export async function POST(
  request: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await context.params;
  let payload: QueueExportJobRequest;

  try {
    payload = (await request.json()) as QueueExportJobRequest;
  } catch {
    return new Response("Invalid export job payload", { status: 400 });
  }

  if (!isExportedDocumentArtifactContract(payload.artifact)) {
    return new Response("Export artifact is required", { status: 400 });
  }

  try {
    const queuedJob = await queueExportJob({
      projectId,
      artifact: payload.artifact
    });

    const receipt: ExportJobReceipt = {
      jobId: queuedJob.jobId,
      status: queuedJob.status,
      artifactPath: queuedJob.artifactPath
    };

    return Response.json(receipt, { status: 202 });
  } catch (error) {
    return new Response(
      error instanceof Error ? error.message : "Failed to queue export job",
      { status: 500 }
    );
  }
}
