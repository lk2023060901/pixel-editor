import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  persistExampleProjectDocument,
  resolveExampleAssetFilePath,
  writeExampleProjectTextFile
} from "./index";

describe("@pixel-editor/example-project-support", () => {
  it("rejects asset paths that escape the example project root", () => {
    expect(() =>
      resolveExampleAssetFilePath("demo-project", "../outside.txt", {
        projectsRootDirectory: "/tmp/examples"
      })
    ).toThrowError("Invalid example asset path");
  });

  it("writes text and image exports into the target example project", async () => {
    const projectsRootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "pixel-editor-example-projects-")
    );

    await writeExampleProjectTextFile("demo-project", "project.json", "{}", {
      projectsRootDirectory
    });

    await persistExampleProjectDocument({
      projectId: "demo-project",
      path: "exports/map.tmj",
      content: "{\"type\":\"map\"}",
      contentType: "application/json",
      projectsRootDirectory
    });
    await persistExampleProjectDocument({
      projectId: "demo-project",
      path: "exports/map.png",
      content: "data:image/png;base64,AA==",
      contentType: "image/png",
      projectsRootDirectory
    });

    await expect(
      readFile(path.join(projectsRootDirectory, "demo-project", "exports", "map.tmj"), "utf8")
    ).resolves.toBe("{\"type\":\"map\"}");
    await expect(
      readFile(path.join(projectsRootDirectory, "demo-project", "exports", "map.png"))
    ).resolves.toEqual(Buffer.from([0]));
  });
});
