import { promises as fs } from "node:fs";

import { resolveExampleAssetFilePath } from "../../../../../../lib/example-projects/load-example-project-seed";

function guessContentType(fileName: string): string {
  if (fileName.endsWith(".svg")) {
    return "image/svg+xml";
  }

  if (fileName.endsWith(".png")) {
    return "image/png";
  }

  if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) {
    return "image/jpeg";
  }

  if (fileName.endsWith(".webp")) {
    return "image/webp";
  }

  return "application/octet-stream";
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ projectId: string; assetPath: string[] }> }
) {
  const { projectId, assetPath } = await context.params;

  try {
    const filePath = resolveExampleAssetFilePath(projectId, assetPath);
    const fileBuffer = await fs.readFile(filePath);

    return new Response(fileBuffer, {
      headers: {
        "content-type": guessContentType(filePath)
      }
    });
  } catch {
    return new Response("Example asset not found", { status: 404 });
  }
}
