import type {
  DocumentSummary,
  EditorBootstrapContract,
  HealthResponse,
  ProjectSummary
} from "@pixel-editor/contracts";
import type { EditorWorkspaceState } from "@pixel-editor/editor-state";
import { getActiveMap } from "@pixel-editor/editor-state";

import { foundationFeatureStatuses } from "./config";

function toProjectSummary(state: EditorWorkspaceState): ProjectSummary {
  return {
    id: state.project.id,
    name: state.project.name,
    compatibilityVersion: state.project.compatibilityVersion,
    assetRoots: state.project.assetRoots
  };
}

function toDocumentSummaries(state: EditorWorkspaceState): DocumentSummary[] {
  const mapDocuments = state.maps.map((map) => {
    const objectCount = map.layers.reduce((count, layer) => {
      if (layer.kind !== "object") {
        return count;
      }

      return count + layer.objects.length;
    }, 0);

    return {
      id: map.id,
      name: map.name,
      kind: "map" as const,
      layerCount: map.layers.length,
      objectCount
    };
  });
  const tilesetDocuments = state.tilesets.map((tileset) => ({
    id: tileset.id,
    name: tileset.name,
    kind: "tileset" as const
  }));
  const templateDocuments = state.templates.map((template) => ({
    id: template.id,
    name: template.name,
    kind: "template" as const
  }));
  const worldDocuments = state.worlds.map((world) => ({
    id: world.id,
    name: world.name,
    kind: "world" as const
  }));

  return [...mapDocuments, ...tilesetDocuments, ...templateDocuments, ...worldDocuments];
}

export function toEditorBootstrap(
  state: EditorWorkspaceState
): EditorBootstrapContract {
  const activeMap = getActiveMap(state);

  return {
    project: toProjectSummary(state),
    documents: toDocumentSummaries(state),
    activeTool: state.session.activeTool,
    viewport: state.session.viewport,
    featureStatuses: foundationFeatureStatuses,
    ...(activeMap ? { activeDocumentId: activeMap.id } : {})
  };
}

export function createHealthResponse(service: string): HealthResponse {
  return {
    status: "ok",
    service,
    timestamp: new Date().toISOString()
  };
}
