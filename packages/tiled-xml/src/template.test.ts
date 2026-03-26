import { describe, expect, it } from "vitest";

import {
  createMapObject,
  createObjectTemplate,
  createProperty
} from "@pixel-editor/domain";

import {
  importTxTemplateDocument,
  stringifyTxTemplateDocument
} from "./index";

describe("TX template adapters", () => {
  it("imports an object template document and resolves external tileset references", () => {
    const imported = importTxTemplateDocument(`<?xml version="1.0" encoding="UTF-8"?>
<template>
  <tileset firstgid="1" source="../tilesets/terrain.tsx"/>
  <object id="7" name="Spawn" type="Encounter" gid="1" x="32" y="64" width="32" height="32">
    <properties>
      <property name="facing" type="string" value="south"/>
    </properties>
  </object>
</template>`, {
      documentPath: "templates/spawn.tx",
      assetRoots: ["maps", "tilesets", "templates"]
    });

    expect(imported.template).toMatchObject({
      name: "spawn",
      object: {
        name: "Spawn",
        className: "Encounter",
        shape: "tile",
        x: 32,
        y: 64,
        width: 32,
        height: 32,
        tile: {
          gid: 1
        },
        properties: [
          {
            name: "facing",
            type: "string",
            value: "south"
          }
        ]
      }
    });
    expect(imported.tilesetReferences).toEqual([
      {
        firstGid: 1,
        source: "../tilesets/terrain.tsx"
      }
    ]);
    expect(imported.assetReferences).toEqual([
      {
        kind: "tileset",
        ownerPath: "tx.tilesets[0].source",
        originalPath: "../tilesets/terrain.tsx",
        resolvedPath: "tilesets/terrain.tsx",
        pathKind: "relative",
        assetRoot: "tilesets",
        externalToProject: false,
        documentPath: "templates/spawn.tx"
      }
    ]);
    expect(imported.issues).toEqual([]);
  });

  it("exports a deterministic TX document for supported template content", () => {
    const xml = stringifyTxTemplateDocument({
      template: createObjectTemplate(
        "Spawn Template",
        createMapObject({
          name: "Spawn",
          className: "Encounter",
          shape: "tile",
          x: 16,
          y: 24,
          width: 32,
          height: 32,
          tile: {
            tileId: 2
          },
          properties: [createProperty("facing", "string", "north")]
        })
      ),
      tilesetSource: "../tilesets/terrain.tsx"
    });
    const roundTrip = importTxTemplateDocument(xml, {
      documentPath: "templates/spawn-template.tx",
      assetRoots: ["maps", "tilesets", "templates"]
    });

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<template>');
    expect(xml).toContain('<tileset firstgid="1" source="../tilesets/terrain.tsx"/>');
    expect(xml).toContain('<object id="1" name="Spawn" type="Encounter" gid="3"');
    expect(roundTrip.template.object).toMatchObject({
      name: "Spawn",
      className: "Encounter",
      shape: "tile",
      tile: {
        gid: 3
      }
    });
  });

  it("reports embedded tilesets as unsupported TX issues", () => {
    const imported = importTxTemplateDocument(`<?xml version="1.0" encoding="UTF-8"?>
<template>
  <tileset firstgid="1" name="Embedded" tilewidth="32" tileheight="32" tilecount="1" columns="1">
    <image source="../tilesets/embedded.png" width="32" height="32"/>
  </tileset>
  <object id="1" name="Marker" x="0" y="0" width="16" height="16"/>
</template>`);

    expect(imported.issues).toEqual([
      {
        severity: "warning",
        code: "tx.tileset.embeddedUnsupported",
        message:
          "Embedded tilesets in template files are not currently represented by the domain model.",
        path: "tx.tilesets[0]"
      }
    ]);
  });
});
