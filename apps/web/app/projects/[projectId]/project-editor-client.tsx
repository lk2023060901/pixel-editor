"use client";

import { EditorShell } from "@pixel-editor/ui-editor";
import { useState } from "react";

import { createEditorStoreFromExampleSeed } from "../../../lib/example-projects/create-store-from-seed";
import type { ExampleProjectSeed } from "../../../lib/example-projects/schema";

export interface ProjectEditorClientProps {
  seed: ExampleProjectSeed;
}

export function ProjectEditorClient({
  seed
}: ProjectEditorClientProps) {
  const [store] = useState(() => createEditorStoreFromExampleSeed(seed));

  return <EditorShell store={store} />;
}
