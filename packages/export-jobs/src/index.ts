import { promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import type {
  ExportJobStatus,
  ExportedDocumentArtifactContract
} from "@pixel-editor/contracts";

const defaultExportJobsRootDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../.tmp/export-jobs"
);

const jobStatuses = ["queued", "running", "completed", "failed"] as const;

export interface ExportJobStorageOptions {
  rootDirectory?: string;
}

export interface ExportJobRecord {
  jobId: string;
  projectId: string;
  status: ExportJobStatus;
  artifactPath: string;
  artifact: ExportedDocumentArtifactContract;
  createdAt: string;
  updatedAt: string;
  errorMessage?: string;
}

export interface QueueExportJobInput extends ExportJobStorageOptions {
  projectId: string;
  artifact: ExportedDocumentArtifactContract;
  jobId?: string;
  now?: Date;
}

function resolveExportJobsRootDirectory(
  options: ExportJobStorageOptions = {}
): string {
  return options.rootDirectory ?? defaultExportJobsRootDirectory;
}

function jobDirectory(rootDirectory: string, status: ExportJobStatus): string {
  return path.join(rootDirectory, status);
}

function jobFilePath(
  rootDirectory: string,
  status: ExportJobStatus,
  jobId: string
): string {
  return path.join(jobDirectory(rootDirectory, status), `${jobId}.json`);
}

async function ensureJobDirectories(rootDirectory: string): Promise<void> {
  await Promise.all(
    jobStatuses.map((status) => fs.mkdir(jobDirectory(rootDirectory, status), { recursive: true }))
  );
}

async function writeJobFile(
  rootDirectory: string,
  status: ExportJobStatus,
  record: ExportJobRecord
): Promise<void> {
  const filePath = jobFilePath(rootDirectory, status, record.jobId);
  await fs.writeFile(filePath, JSON.stringify(record, null, 2), "utf8");
}

async function readJobFile(filePath: string): Promise<ExportJobRecord> {
  const fileContent = await fs.readFile(filePath, "utf8");
  return JSON.parse(fileContent) as ExportJobRecord;
}

async function moveJobRecord(
  rootDirectory: string,
  fromStatus: ExportJobStatus,
  toStatus: ExportJobStatus,
  record: ExportJobRecord
): Promise<void> {
  const fromFilePath = jobFilePath(rootDirectory, fromStatus, record.jobId);

  await ensureJobDirectories(rootDirectory);
  await writeJobFile(rootDirectory, toStatus, record);
  await fs.rm(fromFilePath, { force: true });
}

function createUpdatedRecord(
  record: ExportJobRecord,
  status: ExportJobStatus,
  now: Date,
  errorMessage?: string
): ExportJobRecord {
  return {
    ...record,
    status,
    updatedAt: now.toISOString(),
    ...(errorMessage !== undefined ? { errorMessage } : {})
  };
}

export async function queueExportJob(
  input: QueueExportJobInput
): Promise<ExportJobRecord> {
  const rootDirectory = resolveExportJobsRootDirectory(input);
  const now = input.now ?? new Date();
  const jobId = input.jobId ?? crypto.randomUUID();
  const record: ExportJobRecord = {
    jobId,
    projectId: input.projectId,
    status: "queued",
    artifactPath: input.artifact.path,
    artifact: input.artifact,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };

  await ensureJobDirectories(rootDirectory);
  await writeJobFile(rootDirectory, "queued", record);

  return record;
}

function isMissingFileError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === "ENOENT"
  );
}

export async function claimNextQueuedExportJob(
  options: ExportJobStorageOptions = {}
): Promise<ExportJobRecord | undefined> {
  const rootDirectory = resolveExportJobsRootDirectory(options);
  await ensureJobDirectories(rootDirectory);

  const queuedDirectoryEntries = await fs.readdir(jobDirectory(rootDirectory, "queued"), {
    withFileTypes: true
  });
  const queuedFileNames = queuedDirectoryEntries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name)
    .sort();

  for (const fileName of queuedFileNames) {
    const queuedFilePath = path.join(jobDirectory(rootDirectory, "queued"), fileName);
    let queuedRecord: ExportJobRecord;

    try {
      queuedRecord = await readJobFile(queuedFilePath);
    } catch (error) {
      if (isMissingFileError(error)) {
        continue;
      }

      throw error;
    }

    const runningRecord = createUpdatedRecord(queuedRecord, "running", new Date());
    const runningFilePath = jobFilePath(rootDirectory, "running", queuedRecord.jobId);

    try {
      await fs.rename(queuedFilePath, runningFilePath);
    } catch (error) {
      if (isMissingFileError(error)) {
        continue;
      }

      throw error;
    }

    await fs.writeFile(runningFilePath, JSON.stringify(runningRecord, null, 2), "utf8");
    return runningRecord;
  }

  return undefined;
}

async function updateRunningJob(
  rootDirectory: string,
  jobId: string,
  status: Extract<ExportJobStatus, "completed" | "failed">,
  errorMessage?: string
): Promise<ExportJobRecord> {
  await ensureJobDirectories(rootDirectory);

  const runningFilePath = jobFilePath(rootDirectory, "running", jobId);
  const runningRecord = await readJobFile(runningFilePath);
  const updatedRecord = createUpdatedRecord(runningRecord, status, new Date(), errorMessage);

  await moveJobRecord(rootDirectory, "running", status, updatedRecord);

  return updatedRecord;
}

export async function completeExportJob(
  jobId: string,
  options: ExportJobStorageOptions = {}
): Promise<ExportJobRecord> {
  return updateRunningJob(resolveExportJobsRootDirectory(options), jobId, "completed");
}

export async function failExportJob(
  jobId: string,
  errorMessage: string,
  options: ExportJobStorageOptions = {}
): Promise<ExportJobRecord> {
  return updateRunningJob(
    resolveExportJobsRootDirectory(options),
    jobId,
    "failed",
    errorMessage
  );
}
