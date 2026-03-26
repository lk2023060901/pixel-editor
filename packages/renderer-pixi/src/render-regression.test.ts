import { execFile, spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import { promisify } from "node:util";

import { afterAll, describe, expect, it } from "vitest";

import baseline from "../../test-fixtures/renderer-regression/orthogonal-baseline.json";

const execFileAsync = promisify(execFile);
const repositoryRoot = "/Volumes/data/liukai/tools/pixel-editor";
const webAppRoot = `${repositoryRoot}/apps/web`;
const regressionPort = 3311;
const regressionUrl = `http://127.0.0.1:${regressionPort}/renderer-regression`;
const npmExecutable = process.platform === "win32" ? "npm.cmd" : "npm";
const nodeExecutable = process.execPath;

interface RendererRegressionResult {
  status: "running" | "complete" | "error";
  cases: Array<{
    id: string;
    width: number;
    height: number;
    sha256: string;
  }>;
  error?: string;
}

let nextDevServer: ChildProcess | undefined;
let nextDevLogs = "";
let webAppBuilt = false;

function resolveChromeBinary(): string | undefined {
  if (process.env.CHROME_BIN && existsSync(process.env.CHROME_BIN)) {
    return process.env.CHROME_BIN;
  }

  const defaultChromeBinary =
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

  return existsSync(defaultChromeBinary) ? defaultChromeBinary : undefined;
}

function decodeHtmlEntities(input: string): string {
  return input
    .replaceAll("&quot;", "\"")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

async function waitForServer(url: string): Promise<void> {
  const startedAt = Date.now();
  const timeoutMs = 60_000;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url, {
        cache: "no-store"
      });

      if (response.ok) {
        return;
      }
    } catch {
      // Server not ready yet.
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for renderer regression page.\n${nextDevLogs}`);
}

async function startNextDevServer(): Promise<void> {
  if (nextDevServer) {
    return;
  }

  if (!webAppBuilt) {
    const { stdout, stderr } = await execFileAsync(
      npmExecutable,
      ["run", "build", "--workspace", "@pixel-editor/web"],
      {
        cwd: repositoryRoot,
        env: {
          ...process.env,
          NEXT_TELEMETRY_DISABLED: "1"
        },
        maxBuffer: 10 * 1024 * 1024
      }
    );

    nextDevLogs += stdout;
    nextDevLogs += stderr;
    webAppBuilt = true;
  }

  nextDevServer = spawn(
    nodeExecutable,
    [
      "../../node_modules/next/dist/bin/next",
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(regressionPort)
    ],
    {
      cwd: webAppRoot,
      env: {
        ...process.env,
        NEXT_TELEMETRY_DISABLED: "1"
      },
      stdio: ["ignore", "pipe", "pipe"]
    }
  );

  nextDevServer.stdout?.on("data", (chunk) => {
    nextDevLogs += String(chunk);
  });
  nextDevServer.stderr?.on("data", (chunk) => {
    nextDevLogs += String(chunk);
  });

  await waitForServer(regressionUrl);
}

async function stopNextDevServer(): Promise<void> {
  if (!nextDevServer) {
    return;
  }

  const server = nextDevServer;
  nextDevServer = undefined;

  await new Promise<void>((resolve) => {
    server.once("exit", () => resolve());
    server.kill("SIGTERM");
    setTimeout(() => {
      if (!server.killed) {
        server.kill("SIGKILL");
      }
      resolve();
    }, 5_000);
  });
}

function createRegressionCaseUrl(caseId: string): string {
  return `${regressionUrl}?caseId=${encodeURIComponent(caseId)}`;
}

async function dumpRegressionDomForCase(
  chromeBinary: string,
  caseId: string
): Promise<string> {
  const { stdout, stderr } = await execFileAsync(chromeBinary, [
    "--headless",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--virtual-time-budget=45000",
    "--dump-dom",
    createRegressionCaseUrl(caseId)
  ]);

  if (stderr) {
    nextDevLogs += stderr;
  }

  return stdout;
}

function parseRegressionResult(dom: string): RendererRegressionResult {
  const match = dom.match(
    /<pre[^>]*data-testid="renderer-regression-results"[^>]*>([\s\S]*?)<\/pre>/
  );

  if (!match?.[1]) {
    throw new Error(`Unable to locate renderer regression result block.\n${dom}`);
  }

  return JSON.parse(decodeHtmlEntities(match[1])) as RendererRegressionResult;
}

async function waitForRegressionResult(
  chromeBinary: string,
  caseId: string
): Promise<RendererRegressionResult> {
  const startedAt = Date.now();
  const timeoutMs = 90_000;
  let lastResult: RendererRegressionResult | undefined;

  while (Date.now() - startedAt < timeoutMs) {
    const dom = await dumpRegressionDomForCase(chromeBinary, caseId);
    const result = parseRegressionResult(dom);

    lastResult = result;

    if (result.status === "complete") {
      return result;
    }

    if (result.status === "error") {
      throw new Error(result.error ?? "Renderer regression page returned an error state.");
    }

    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }

  throw new Error(
    `Timed out waiting for renderer regression completion.\n${JSON.stringify(lastResult)}`
  );
}

describe("renderer screenshot regression", () => {
  afterAll(async () => {
    await stopNextDevServer();
  });

  const chromeBinary = resolveChromeBinary();

  if (!chromeBinary) {
    it.skip("requires a local Chrome binary");
    return;
  }

  it(
    "matches the orthogonal screenshot baseline in headless Chrome",
    async () => {
      await startNextDevServer();

      for (const expectedCase of baseline.cases) {
        const result = await waitForRegressionResult(chromeBinary, expectedCase.id);

        expect(result.status).toBe("complete");
        expect(result.error).toBeUndefined();
        expect(result.cases).toEqual([expectedCase]);
      }
    },
    180_000
  );
});
