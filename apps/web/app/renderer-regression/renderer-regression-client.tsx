"use client";

import { useEffect, useState } from "react";

import {
  createRendererRegressionCases,
  exportRendererSnapshotImageDataUrl
} from "@pixel-editor/renderer-pixi";

interface RendererRegressionCaseResult {
  id: string;
  width: number;
  height: number;
  sha256: string;
}

type RendererRegressionState =
  | { status: "running"; cases: RendererRegressionCaseResult[] }
  | { status: "complete"; cases: RendererRegressionCaseResult[] }
  | { status: "error"; cases: RendererRegressionCaseResult[]; error: string };

function hexEncode(bytes: Uint8Array): string {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

async function computeSha256(dataUrl: string): Promise<string> {
  const image = new Image();

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Failed to decode renderer regression image."));
    image.src = dataUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas 2D context is unavailable for renderer regression.");
  }

  context.drawImage(image, 0, 0);

  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
  const digest = await crypto.subtle.digest("SHA-256", data);

  return hexEncode(new Uint8Array(digest));
}

export default function RendererRegressionClient(props: { caseId?: string }) {
  const [state, setState] = useState<RendererRegressionState>({
    status: "running",
    cases: []
  });

  useEffect(() => {
    let cancelled = false;

    async function runRegression(): Promise<void> {
      try {
        const cases = createRendererRegressionCases();
        const selectedCase =
          props.caseId === undefined
            ? undefined
            : cases.find((testCase) => testCase.id === props.caseId);

        if (!selectedCase) {
          throw new Error(
            props.caseId === undefined
              ? "Missing renderer regression case id."
              : `Unknown renderer regression case id: ${props.caseId}`
          );
        }

        const dataUrl = await exportRendererSnapshotImageDataUrl({
          snapshot: selectedCase.snapshot,
          width: selectedCase.width,
          height: selectedCase.height,
          ...(selectedCase.layout !== undefined ? { layout: selectedCase.layout } : {}),
          antialias: false,
          labels: {
            noActiveMap: ""
          }
        });
        const sha256 = await computeSha256(dataUrl);
        const results: RendererRegressionCaseResult[] = [
          {
            id: selectedCase.id,
            width: selectedCase.width,
            height: selectedCase.height,
            sha256
          }
        ];

        if (!cancelled) {
          setState({
            status: "complete",
            cases: results
          });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            status: "error",
            cases: [],
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
    }

    void runRegression();

    return () => {
      cancelled = true;
    };
  }, [props.caseId]);

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-slate-100">
      <pre
        data-testid="renderer-regression-results"
        id="renderer-regression-results"
      >
        {JSON.stringify(state)}
      </pre>
    </main>
  );
}
