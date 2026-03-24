import { notFound } from "next/navigation";

import { loadExampleProjectSeed } from "../../../lib/example-projects/load-example-project-seed";
import { ProjectEditorClient } from "./project-editor-client";

export default async function ProjectPage(props: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await props.params;
  let seed: Awaited<ReturnType<typeof loadExampleProjectSeed>>;

  try {
    seed = await loadExampleProjectSeed(projectId);
  } catch {
    notFound();
  }

  return <ProjectEditorClient seed={seed} />;
}
