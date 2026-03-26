import { mkdtemp, readFile, readdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { completeExportJob, claimNextQueuedExportJob, failExportJob, queueExportJob } from "./index";

describe("@pixel-editor/export-jobs", () => {
  it("queues and completes export jobs through queued/running/completed directories", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "pixel-editor-export-jobs-"));
    const queued = await queueExportJob({
      rootDirectory,
      projectId: "demo-project",
      artifact: {
        id: "document-map",
        kind: "map",
        name: "starter-map",
        path: "maps/starter-map.tmj",
        content: "{\"type\":\"map\"}",
        contentType: "application/json"
      },
      jobId: "job-1",
      now: new Date("2026-03-26T10:00:00.000Z")
    });

    expect(queued.status).toBe("queued");
    await expect(readdir(path.join(rootDirectory, "queued"))).resolves.toEqual(["job-1.json"]);

    const running = await claimNextQueuedExportJob({ rootDirectory });

    expect(running).toMatchObject({
      jobId: "job-1",
      status: "running",
      artifactPath: "maps/starter-map.tmj"
    });
    await expect(readdir(path.join(rootDirectory, "queued"))).resolves.toEqual([]);
    await expect(readdir(path.join(rootDirectory, "running"))).resolves.toEqual(["job-1.json"]);

    const completed = await completeExportJob("job-1", { rootDirectory });

    expect(completed.status).toBe("completed");
    await expect(readdir(path.join(rootDirectory, "running"))).resolves.toEqual([]);
    await expect(readdir(path.join(rootDirectory, "completed"))).resolves.toEqual([
      "job-1.json"
    ]);
    await expect(
      readFile(path.join(rootDirectory, "completed", "job-1.json"), "utf8")
    ).resolves.toContain("\"status\": \"completed\"");
  });

  it("moves failed jobs into the failed directory with an error message", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "pixel-editor-export-jobs-"));

    await queueExportJob({
      rootDirectory,
      projectId: "demo-project",
      artifact: {
        id: "document-tileset",
        kind: "tileset",
        name: "terrain-core",
        path: "tilesets/terrain-core.tsj",
        content: "{\"type\":\"tileset\"}",
        contentType: "application/json"
      },
      jobId: "job-2"
    });
    await claimNextQueuedExportJob({ rootDirectory });

    const failed = await failExportJob("job-2", "Disk is full", { rootDirectory });

    expect(failed).toMatchObject({
      jobId: "job-2",
      status: "failed",
      errorMessage: "Disk is full"
    });
    await expect(readdir(path.join(rootDirectory, "failed"))).resolves.toEqual(["job-2.json"]);
  });
});
