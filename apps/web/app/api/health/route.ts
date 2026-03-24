import { createHealthResponse } from "@pixel-editor/app-services";

export async function GET() {
  return Response.json(createHealthResponse("web"));
}

