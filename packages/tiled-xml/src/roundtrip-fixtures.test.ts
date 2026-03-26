import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { importTmjMapDocument, stringifyTmjMapDocument } from "@pixel-editor/tiled-json";

import { importTmxMapDocument, stringifyTmxMapDocument } from "./index";

interface MapRoundTripFixture {
  name: string;
  fixtureFilePath: string;
  documentPath: string;
  assetRoots: readonly string[];
}

const mapRoundTripFixtures: MapRoundTripFixture[] = [
  {
    name: "forest map with object layers and parallax",
    fixtureFilePath: "../../test-fixtures/tiled-roundtrip/forest/forest.tmx",
    documentPath: "maps/forest.tmx",
    assetRoots: ["maps"]
  },
  {
    name: "relative external tileset paths",
    fixtureFilePath: "../../test-fixtures/tiled-roundtrip/relative-paths/maps/relative_paths.tmx",
    documentPath: "maps/relative_paths.tmx",
    assetRoots: ["maps", "desert"]
  }
];

async function loadFixtureText(relativePath: string): Promise<string> {
  return readFile(new URL(relativePath, import.meta.url), "utf8");
}

function canonicalizeImportedMap(input: {
  map: Parameters<typeof stringifyTmjMapDocument>[0]["map"];
  tilesetReferences: Parameters<typeof stringifyTmjMapDocument>[0]["tilesetReferences"];
}): string {
  return stringifyTmjMapDocument({
    map: input.map,
    ...(input.tilesetReferences !== undefined
      ? { tilesetReferences: input.tilesetReferences }
      : {})
  });
}

describe("Tiled round-trip fixtures", () => {
  for (const fixture of mapRoundTripFixtures) {
    it(`preserves ${fixture.name} across TMX and TMJ round-trips`, async () => {
      const fixtureXml = await loadFixtureText(fixture.fixtureFilePath);
      const importedFixture = importTmxMapDocument(fixtureXml, {
        documentPath: fixture.documentPath,
        assetRoots: fixture.assetRoots
      });

      expect(importedFixture.issues).toEqual([]);

      const canonicalTmj = canonicalizeImportedMap(importedFixture);
      const reimportedTmj = importTmjMapDocument(JSON.parse(canonicalTmj) as object, {
        documentPath: fixture.documentPath.replace(/\.tmx$/u, ".tmj"),
        assetRoots: fixture.assetRoots
      });

      expect(reimportedTmj.issues).toEqual([]);
      expect(canonicalizeImportedMap(reimportedTmj)).toBe(canonicalTmj);

      const roundTrippedTmx = stringifyTmxMapDocument({
        map: importedFixture.map,
        tilesetReferences: importedFixture.tilesetReferences
      });
      const reimportedTmx = importTmxMapDocument(roundTrippedTmx, {
        documentPath: fixture.documentPath,
        assetRoots: fixture.assetRoots
      });

      expect(reimportedTmx.issues).toEqual([]);
      expect(canonicalizeImportedMap(reimportedTmx)).toBe(canonicalTmj);
    });
  }
});
