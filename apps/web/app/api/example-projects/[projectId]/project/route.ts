import { readExampleProjectFile } from "../../../../../lib/example-projects/load-example-project-seed";

export async function GET(
  _request: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await context.params;

  try {
    const projectFile = await readExampleProjectFile(projectId);

    return new Response(projectFile, {
      headers: {
        "content-type": "application/json; charset=utf-8"
      }
    });
  } catch {
    return new Response("Example project not found", { status: 404 });
  }
}
