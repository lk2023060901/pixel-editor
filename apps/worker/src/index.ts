import { persistExampleProjectDocument } from "@pixel-editor/example-project-support";
import {
  claimNextQueuedExportJob,
  completeExportJob,
  failExportJob
} from "@pixel-editor/export-jobs";

function parsePollIntervalMilliseconds(): number {
  const rawValue = process.env.PIXEL_EDITOR_WORKER_POLL_MS;

  if (!rawValue) {
    return 1000;
  }

  const parsedValue = Number.parseInt(rawValue, 10);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 1000;
}

function shouldRunOnce(): boolean {
  return process.env.PIXEL_EDITOR_WORKER_RUN_ONCE === "1";
}

async function sleep(milliseconds: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

async function processNextExportJob(): Promise<boolean> {
  const job = await claimNextQueuedExportJob();

  if (!job) {
    return false;
  }

  try {
    await persistExampleProjectDocument({
      projectId: job.projectId,
      path: job.artifact.path,
      content: job.artifact.content,
      contentType: job.artifact.contentType
    });
    await completeExportJob(job.jobId);
    console.log(`[worker] completed export job ${job.jobId} -> ${job.artifactPath}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown export failure";

    await failExportJob(job.jobId, errorMessage);
    console.error(`[worker] failed export job ${job.jobId}: ${errorMessage}`);
  }

  return true;
}

async function runWorkerLoop(): Promise<void> {
  const pollIntervalMilliseconds = parsePollIntervalMilliseconds();
  const runOnce = shouldRunOnce();

  console.log(
    `[worker] Export job worker is ready (poll=${pollIntervalMilliseconds}ms, once=${runOnce})`
  );

  if (runOnce) {
    while (await processNextExportJob()) {
      // Drain the current queue and exit.
    }

    return;
  }

  for (;;) {
    const processedJob = await processNextExportJob();

    if (!processedJob) {
      await sleep(pollIntervalMilliseconds);
    }
  }
}

void runWorkerLoop().catch((error) => {
  console.error(
    `[worker] unrecoverable failure: ${error instanceof Error ? error.stack ?? error.message : String(error)}`
  );
  process.exitCode = 1;
});
