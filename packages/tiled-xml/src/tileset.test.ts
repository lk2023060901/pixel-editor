import { describe, expect, it } from "vitest";

import {
  createMapObject,
  createObjectLayer,
  createProperty,
  createTileDefinition,
  createTileset,
  createWangSetDefinition,
  type TilesetDefinition
} from "@pixel-editor/domain";

import {
  exportTsxTilesetDocument,
  importTsxTilesetDocument,
  stringifyTsxTilesetDocument
} from "./index";

describe("TSX tileset adapters", () => {
  it("imports a TSX image tileset into normalized domain entities", () => {
    const imported = importTsxTilesetDocument(`<?xml version="1.0" encoding="UTF-8"?>
<tileset version="1.11" tiledversion="1.11.2" name="Terrain" tilewidth="32" tileheight="32" spacing="1" margin="2" tilecount="4" columns="2" objectalignment="center" tilerendersize="grid" fillmode="preserve-aspect-fit">
  <tileoffset x="4" y="8"/>
  <image source="../tilesets/terrain.png" width="66" height="66"/>
  <properties>
    <property name="biome" type="string" propertytype="Biome" value="forest"/>
  </properties>
  <tile id="0" type="Grass" probability="0.5">
    <properties>
      <property name="walkable" type="bool" value="true"/>
    </properties>
    <animation>
      <frame tileid="1" duration="150"/>
    </animation>
    <objectgroup draworder="index">
      <object id="9" name="Hit" x="1" y="2" width="3" height="4">
        <ellipse/>
      </object>
    </objectgroup>
  </tile>
  <wangsets>
    <wangset name="Terrain">
      <wangcornercolor name="Grass" color="#00ff00" tile="0" probability="1"/>
      <wangtile tileid="0" wangid="0x01020304"/>
    </wangset>
  </wangsets>
</tileset>`, {
      documentPath: "tilesets/terrain.tsx",
      assetRoots: ["maps", "tilesets", "templates"]
    });

    expect(imported.tileset).toMatchObject({
      kind: "image",
      name: "Terrain",
      tileWidth: 32,
      tileHeight: 32,
      tileOffsetX: 4,
      tileOffsetY: 8,
      objectAlignment: "center",
      tileRenderSize: "grid",
      fillMode: "preserve-aspect-fit",
      source: {
        imagePath: "../tilesets/terrain.png",
        imageWidth: 66,
        imageHeight: 66,
        margin: 2,
        spacing: 1,
        columns: 2
      },
      properties: [
        {
          name: "biome",
          type: "enum",
          propertyTypeName: "Biome",
          value: "forest"
        }
      ]
    });
    expect(imported.tileset.tiles[0]).toMatchObject({
      localId: 0,
      className: "Grass",
      probability: 0.5,
      properties: [
        {
          name: "walkable",
          type: "bool",
          value: true
        }
      ],
      animation: [
        {
          tileId: 1,
          durationMs: 150
        }
      ],
      collisionLayer: {
        kind: "object",
        drawOrder: "index"
      }
    });
    expect(imported.tileset.wangSets[0]).toMatchObject({
      name: "Terrain",
      type: "corner"
    });
    expect(imported.assetReferences).toEqual([
      {
        kind: "image",
        ownerPath: "tsx.image",
        originalPath: "../tilesets/terrain.png",
        resolvedPath: "tilesets/terrain.png",
        pathKind: "relative",
        assetRoot: "tilesets",
        externalToProject: false,
        documentPath: "tilesets/terrain.tsx"
      }
    ]);
    expect(imported.issues).toEqual([
      {
        severity: "warning",
        code: "tsj.wangSet.colorsUnsupported",
        message: "Wang set colors are not represented by the current domain model.",
        path: "tsj.wangsets[0].colors"
      },
      {
        severity: "warning",
        code: "tsj.wangSet.tilesUnsupported",
        message: "Wang tile assignments are not represented by the current domain model.",
        path: "tsj.wangsets[0].wangtiles"
      }
    ]);
  });

  it("exports a deterministic TSX document for supported tileset content", () => {
    const collisionObject = createMapObject({
      name: "Solid",
      shape: "rectangle",
      x: 2,
      y: 3,
      width: 20,
      height: 18,
      properties: [createProperty("target", "string", "player")]
    });
    const tileset: TilesetDefinition = {
      ...createTileset({
        name: "Props",
        kind: "image-collection",
        tileWidth: 32,
        tileHeight: 32,
        properties: [createProperty("category", "string", "props")]
      }),
      tileOffsetX: 4,
      tileOffsetY: 8,
      objectAlignment: "bottom",
      tileRenderSize: "grid",
      fillMode: "preserve-aspect-fit",
      tiles: [
        {
          ...createTileDefinition(0),
          className: "Crate",
          imageSource: "../tilesets/crate.png",
          probability: 0.25,
          properties: [createProperty("loot", "string", "gold")],
          animation: [
            {
              tileId: 1,
              durationMs: 120
            }
          ],
          collisionLayer: createObjectLayer({
            name: "collision",
            drawOrder: "index",
            objects: [collisionObject]
          })
        },
        {
          ...createTileDefinition(1),
          imageSource: "../tilesets/barrel.png"
        }
      ],
      wangSets: [createWangSetDefinition({ name: "Decor", type: "mixed" })]
    };

    const xml = stringifyTsxTilesetDocument({ tileset });
    const roundTrip = importTsxTilesetDocument(xml);

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<tileoffset x="4" y="8"/>');
    expect(xml).toContain('<property name="category" type="string" value="props"/>');
    expect(xml).toContain('<tile id="0" type="Crate" probability="0.25">');
    expect(xml).toContain('<image source="../tilesets/crate.png"/>');
    expect(xml).toContain('<frame tileid="1" duration="120"/>');
    expect(xml).toContain('<wangset name="Decor" type="mixed"/>');
    expect(roundTrip.tileset).toMatchObject({
      kind: "image-collection",
      name: "Props",
      tileOffsetX: 4,
      tileOffsetY: 8,
      objectAlignment: "bottom",
      tileRenderSize: "grid",
      fillMode: "preserve-aspect-fit"
    });
    expect(roundTrip.tileset.tiles[0]).toMatchObject({
      localId: 0,
      className: "Crate",
      imageSource: "../tilesets/crate.png"
    });
  });

  it("surfaces unsupported legacy terrain metadata as explicit TSX issues", () => {
    const imported = importTsxTilesetDocument(`<?xml version="1.0" encoding="UTF-8"?>
<tileset version="1.11" tiledversion="1.11.2" name="Legacy" tilewidth="32" tileheight="32" tilecount="1" columns="1">
  <image source="../tilesets/legacy.png" width="32" height="32"/>
  <terraintypes>
    <terrain name="Grass" tile="0"/>
  </terraintypes>
</tileset>`);

    expect(imported.issues).toEqual([
      {
        severity: "warning",
        code: "tsx.terrainTypesUnsupported",
        message: "Legacy terrain types are not represented by the current domain model and were skipped.",
        path: "tsx.terraintypes"
      }
    ]);
  });

  it("reports unknown attributes and external TSX references", () => {
    const imported = importTsxTilesetDocument(`<?xml version="1.0" encoding="UTF-8"?>
<tileset version="1.11" tiledversion="1.11.2" name="Warnings" tilewidth="32" tileheight="32" mystery="1">
  <image source="https://example.com/terrain.png" width="32" height="32"/>
</tileset>`, {
      documentPath: "tilesets/warnings.tsx",
      assetRoots: ["maps", "tilesets", "templates"]
    });

    expect(imported.issues).toEqual([
      {
        severity: "warning",
        code: "tsx.attribute.unknown",
        message: "Unknown TSX attribute `mystery` was ignored during import.",
        path: "tsx.@mystery"
      },
      {
        severity: "warning",
        code: "tsx.asset.externalReference",
        message:
          "External TSX image reference `https://example.com/terrain.png` is outside known project asset roots.",
        path: "tsx.image"
      }
    ]);
  });
});
