import { describe, expect, it } from "vitest";

import {
  importAutomappingRulesFile,
  matchesAutomappingMapName
} from "./index";

describe("@pixel-editor/tiled-automapping", () => {
  it("parses nested rules files, preserving filter inheritance and restore semantics", () => {
    const imported = importAutomappingRulesFile(
      [
        "# root comment",
        "[terrain*]",
        "rules/base.tmj",
        "sub/extra.txt",
        "rules/after.tmj",
        "[props*]",
        "rules/props.tmx"
      ].join("\n"),
      {
        documentPath: "maps/rules.txt",
        assetRoots: ["maps", "rules", "sub"],
        loadTextFile: (resolvedPath) => {
          if (resolvedPath === "maps/sub/extra.txt") {
            return ["nested/a.tmj", "[biome*]", "nested/b.tmj"].join("\n");
          }

          return undefined;
        }
      }
    );

    expect(imported.ruleMaps).toEqual([
      {
        filePath: "maps/rules/base.tmj",
        line: 3,
        mapNameFilter: "terrain*",
        sourceFilePath: "maps/rules.txt"
      },
      {
        filePath: "maps/sub/nested/a.tmj",
        line: 1,
        mapNameFilter: "terrain*",
        sourceFilePath: "maps/sub/extra.txt"
      },
      {
        filePath: "maps/sub/nested/b.tmj",
        line: 3,
        mapNameFilter: "biome*",
        sourceFilePath: "maps/sub/extra.txt"
      },
      {
        filePath: "maps/rules/after.tmj",
        line: 5,
        mapNameFilter: "terrain*",
        sourceFilePath: "maps/rules.txt"
      },
      {
        filePath: "maps/rules/props.tmx",
        line: 7,
        mapNameFilter: "props*",
        sourceFilePath: "maps/rules.txt"
      }
    ]);
    expect(imported.includes).toEqual([
      {
        filePath: "maps/sub/extra.txt",
        line: 4,
        mapNameFilter: "terrain*",
        sourceFilePath: "maps/rules.txt"
      }
    ]);
    expect(imported.assetReferences).toEqual([
      expect.objectContaining({
        kind: "map",
        ownerPath: "rules.entries[0].path",
        resolvedPath: "maps/rules/base.tmj"
      }),
      expect.objectContaining({
        kind: "automapping-rules",
        ownerPath: "rules.entries[1].path",
        resolvedPath: "maps/sub/extra.txt"
      }),
      expect.objectContaining({
        kind: "map",
        ownerPath: "rules.entries[1].entries[0].path",
        resolvedPath: "maps/sub/nested/a.tmj"
      }),
      expect.objectContaining({
        kind: "map",
        ownerPath: "rules.entries[1].entries[1].path",
        resolvedPath: "maps/sub/nested/b.tmj"
      }),
      expect.objectContaining({
        kind: "map",
        ownerPath: "rules.entries[2].path",
        resolvedPath: "maps/rules/after.tmj"
      }),
      expect.objectContaining({
        kind: "map",
        ownerPath: "rules.entries[3].path",
        resolvedPath: "maps/rules/props.tmx"
      })
    ]);
    expect(imported.issues).toEqual([]);
  });

  it("reports unresolved includes, missing files and external references", () => {
    const imported = importAutomappingRulesFile(
      ["../outside.tmj", "nested/missing.txt", "nested/rules.txt"].join("\n"),
      {
        documentPath: "maps/rules.txt",
        assetRoots: ["maps"],
        loadTextFile: (resolvedPath) =>
          resolvedPath === "maps/nested/rules.txt" ? "nested/second.tmj" : undefined
      }
    );

    expect(imported.ruleMaps).toEqual([
      {
        filePath: "outside.tmj",
        line: 1,
        sourceFilePath: "maps/rules.txt"
      },
      {
        filePath: "maps/nested/nested/second.tmj",
        line: 1,
        sourceFilePath: "maps/nested/rules.txt"
      }
    ]);
    expect(imported.issues).toEqual([
      expect.objectContaining({
        code: "automapping.rules.file.notFound",
        path: "rules.entries[1].path"
      }),
      expect.objectContaining({
        code: "automapping.rules.asset.externalReference",
        path: "rules.entries[0].path"
      })
    ]);
  });

  it("reports unresolved includes when no nested text loader is provided", () => {
    const imported = importAutomappingRulesFile("nested/rules.txt", {
      documentPath: "maps/rules.txt"
    });

    expect(imported.ruleMaps).toEqual([]);
    expect(imported.includes).toEqual([
      {
        filePath: "maps/nested/rules.txt",
        line: 1,
        sourceFilePath: "maps/rules.txt"
      }
    ]);
    expect(imported.issues).toEqual([
      expect.objectContaining({
        code: "automapping.rules.include.unresolved",
        path: "rules.entries[0].path"
      }),
      expect.objectContaining({
        code: "automapping.rules.empty",
        path: "rules"
      })
    ]);
  });

  it("matches map names against wildcard filters", () => {
    expect(matchesAutomappingMapName("terrain-01", "terrain*")).toBe(true);
    expect(matchesAutomappingMapName("props-01", "terrain*")).toBe(false);
    expect(matchesAutomappingMapName("starter-map", undefined)).toBe(true);
    expect(matchesAutomappingMapName("map-12", "map-??")).toBe(true);
  });
});
