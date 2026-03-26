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
  exportTsjTilesetDocument,
  importTsjTilesetDocument,
  stringifyTsjTilesetDocument
} from "./index";

describe("TSJ tileset adapters", () => {
  it("imports a TSJ image tileset into normalized domain entities", () => {
    const imported = importTsjTilesetDocument(
      {
        type: "tileset",
        version: "1.11",
        tiledversion: "1.11.2",
        name: "Terrain",
        tilewidth: 32,
        tileheight: 32,
        margin: 1,
        spacing: 2,
        tilecount: 6,
        columns: 3,
        image: "../tilesets/terrain.png",
        imagewidth: 100,
        imageheight: 70,
        objectalignment: "center",
        tilerendersize: "grid",
        fillmode: "preserve-aspect-fit",
        tileoffset: {
          x: 4,
          y: 8
        },
        properties: [
          {
            name: "biome",
            type: "string",
            propertytype: "Biome",
            value: "forest"
          }
        ],
        tiles: [
          {
            id: 0,
            type: "Grass",
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
                tileid: 1,
                duration: 150
              }
            ],
            objectgroup: {
              type: "objectgroup",
              draworder: "index",
              objects: [
                {
                  id: 9,
                  name: "Hit",
                  ellipse: true,
                  x: 1,
                  y: 2,
                  width: 3,
                  height: 4
                }
              ]
            }
          }
        ],
        wangsets: [
          {
            name: "Terrain",
            type: "mixed",
            colors: [
              {
                name: "Grass",
                color: "#00ff00"
              }
            ],
            wangtiles: [
              {
                tileid: 0,
                wangid: [1, 0, 0, 0, 0, 0, 0, 0]
              }
            ]
          }
        ]
      },
      {
        documentPath: "tilesets/terrain.tsj",
        assetRoots: ["maps", "tilesets", "templates"]
      }
    );

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
        imageWidth: 100,
        imageHeight: 70,
        margin: 1,
        spacing: 2,
        columns: 3
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
    expect(imported.tileset.tiles).toHaveLength(6);
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
    expect(imported.tileset.wangSets).toHaveLength(1);
    expect(imported.tileset.wangSets[0]).toMatchObject({
      name: "Terrain",
      type: "mixed"
    });
    expect(imported.assetReferences).toEqual([
      {
        kind: "image",
        ownerPath: "tsj.image",
        originalPath: "../tilesets/terrain.png",
        resolvedPath: "tilesets/terrain.png",
        pathKind: "relative",
        assetRoot: "tilesets",
        externalToProject: false,
        documentPath: "tilesets/terrain.tsj"
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

  it("exports a deterministic TSJ document for supported tileset content", () => {
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
      wangSets: [createWangSetDefinition({ name: "Terrain", type: "edge" })]
    };

    const document = exportTsjTilesetDocument({
      tileset,
      tiledVersion: "1.11.2"
    });

    expect(document).toEqual({
      type: "tileset",
      version: "1.11",
      tiledversion: "1.11.2",
      name: "Props",
      tilewidth: 32,
      tileheight: 32,
      spacing: 0,
      margin: 0,
      tilecount: 2,
      columns: 0,
      objectalignment: "bottom",
      tilerendersize: "grid",
      fillmode: "preserve-aspect-fit",
      properties: [
        {
          name: "category",
          type: "string",
          value: "props"
        }
      ],
      tileoffset: {
        x: 4,
        y: 8
      },
      tiles: [
        {
          id: 0,
          type: "Crate",
          probability: 0.25,
          properties: [
            {
              name: "loot",
              type: "string",
              value: "gold"
            }
          ],
          image: "../tilesets/crate.png",
          animation: [
            {
              tileid: 1,
              duration: 120
            }
          ],
          objectgroup: {
            type: "objectgroup",
            name: "collision",
            x: 0,
            y: 0,
            visible: true,
            opacity: 1,
            draworder: "index",
            objects: [
              {
                id: 1,
                name: "Solid",
                type: "",
                properties: [
                  {
                    name: "target",
                    type: "string",
                    value: "player"
                  }
                ],
                x: 2,
                y: 3,
                width: 20,
                height: 18,
                rotation: 0,
                visible: true
              }
            ]
          }
        },
        {
          id: 1,
          image: "../tilesets/barrel.png"
        }
      ],
      wangsets: [
        {
          name: "Terrain",
          type: "edge",
          colors: [],
          wangtiles: []
        }
      ]
    });
    expect(stringifyTsjTilesetDocument({ tileset })).toBe(stringifyTsjTilesetDocument({ tileset }));
    });
  });

  it("reports unknown fields and external TSJ references", () => {
    const imported = importTsjTilesetDocument(
      {
        type: "tileset",
        name: "External",
        tilewidth: 32,
        tileheight: 32,
        image: "https://example.com/terrain.png",
        mysteryfield: true,
        tiles: [
          {
            id: 0,
            image: "../tilesets/a.png",
            mystery: "ignored"
          }
        ]
      },
      {
        documentPath: "tilesets/external.tsj",
        assetRoots: ["maps", "tilesets", "templates"]
      }
    );

    expect(imported.issues).toEqual([
      {
        severity: "warning",
        code: "tsj.field.unknown",
        message: "Unknown TSJ field `mysteryfield` was ignored during import.",
        path: "tsj.mysteryfield"
      },
      {
        severity: "warning",
        code: "tsj.field.unknown",
        message: "Unknown TSJ field `mystery` was ignored during import.",
        path: "tsj.tiles[0].mystery"
      },
      {
        severity: "warning",
        code: "tsj.asset.externalReference",
        message:
          "External TSJ image reference `https://example.com/terrain.png` is outside known project asset roots.",
        path: "tsj.image"
      }
    ]);
  });
