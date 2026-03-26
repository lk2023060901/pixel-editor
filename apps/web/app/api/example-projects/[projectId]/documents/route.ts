import { persistExampleProjectDocument } from "@pixel-editor/example-project-support";

interface SaveExampleProjectDocumentRequest {
  path?: unknown;
  content?: unknown;
  contentType?: unknown;
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
    await persistExampleProjectDocument({
      projectId,
      path: payload.path,
      content: payload.content,
      ...(typeof payload.contentType === "string"
        ? { contentType: payload.contentType }
        : {})
    });
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof Error && error.message === "Image content must be a base64 data URL") {
      return new Response(error.message, { status: 400 });
    }

    return new Response("Failed to save example project document", { status: 500 });
  }
}
