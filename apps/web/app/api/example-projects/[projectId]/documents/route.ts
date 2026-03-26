import { writeExampleProjectTextFile } from "../../../../../lib/example-projects/load-example-project-seed";

interface SaveExampleProjectDocumentRequest {
  path?: unknown;
  content?: unknown;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await context.params;
  let payload: SaveExampleProjectDocumentRequest;

  try {
    payload = (await request.json()) as SaveExampleProjectDocumentRequest;
  } catch {
    return new Response("Invalid save payload", { status: 400 });
  }

  if (typeof payload.path !== "string" || payload.path.trim().length === 0) {
    return new Response("Document path is required", { status: 400 });
  }

  if (typeof payload.content !== "string") {
    return new Response("Document content must be a string", { status: 400 });
  }

  try {
    await writeExampleProjectTextFile(projectId, payload.path, payload.content);
    return new Response(null, { status: 204 });
  } catch {
    return new Response("Failed to save example project document", { status: 500 });
  }
}
