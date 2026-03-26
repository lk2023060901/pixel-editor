import { describe, expect, it } from "vitest";

import {
  createGroupLayer,
  createImageLayer,
  createMap,
  createMapObject,
  createObjectLayer,
  createProperty,
  createTileCell,
  createTileLayer
} from "@pixel-editor/domain";

import { exportTmjMapDocument, importTmjMapDocument, stringifyTmjMapDocument } from "./index";

describe("importTmjMapDocument", () => {
  it("imports a finite orthogonal TMJ map into normalized domain entities", () => {
    const imported = importTmjMapDocument({
      name: "demo",
      orientation: "orthogonal",
      width: 2,
      height: 2,
      tilewidth: 32,
      tileheight: 32,
      renderorder: "right-down",
      compressionlevel: -1,
      backgroundcolor: "#112233",
      layers: [
        {
          type: "tilelayer",
          name: "Ground",
          width: 2,
          height: 2,
          data: [1, 0, 2147483650, 3]
        },
        {
          type: "objectgroup",
          name: "Objects",
          draworder: "index",
          objects: [
            {
              id: 7,
              name: "Spawn",
              x: 32,
              y: 48,
              width: 16,
              height: 16
            },
            {
              id: 8,
              name: "Marker",
              point: true,
              x: 8,
              y: 12
            }
          ]
        }
      ],
      tilesets: [
        {
          firstgid: 1,
          source: "../tilesets/terrain.tsj"
        }
      ],
      properties: [
        {
          name: "biome",
          type: "string",
          propertytype: "Biome",
          value: "forest"
        }
      ]
    });

    expect(imported.map.name).toBe("demo");
    expect(imported.map.settings.backgroundColor).toBe("#112233");
    expect(imported.map.layers).toHaveLength(2);
    expect(imported.map.layers[0]).toMatchObject({
      kind: "tile",
      name: "Ground"
    });
    expect(imported.map.layers[0]?.kind === "tile" ? imported.map.layers[0].cells[0] : undefined).toMatchObject({
      gid: 1
    });
    expect(imported.map.layers[0]?.kind === "tile" ? imported.map.layers[0].cells[2] : undefined).toMatchObject({
      gid: 2,
      flipHorizontally: true
    });
    expect(imported.map.layers[1]).toMatchObject({
      kind: "object",
      name: "Objects",
      drawOrder: "index"
    });
    expect(imported.map.nextObjectId).toBe(9);
    expect(imported.tilesetReferences).toEqual([
      {
        firstGid: 1,
        source: "../tilesets/terrain.tsj"
      }
    ]);
    expect(imported.map.properties).toEqual([
      {
        name: "biome",
        type: "enum",
        propertyTypeName: "Biome",
        value: "forest"
      }
    ]);
    expect(imported.issues).toEqual([]);
  });

  it("imports infinite tile chunks and nested group layers", () => {
    const imported = importTmjMapDocument({
      name: "infinite-map",
      orientation: "orthogonal",
      width: 10,
      height: 10,
      infinite: true,
      tilewidth: 32,
      tileheight: 32,
      layers: [
        {
          type: "group",
          name: "Gameplay",
          layers: [
            {
              type: "tilelayer",
              name: "Chunks",
              infinite: true,
              chunks: [
                {
                  x: 0,
                  y: 0,
                  width: 2,
                  height: 1,
                  data: [1, 2]
                }
              ]
            }
          ]
        }
      ]
    });

    const group = imported.map.layers[0];

    expect(group?.kind).toBe("group");
    expect(group?.kind === "group" ? group.layers[0] : undefined).toMatchObject({
      kind: "tile",
      infinite: true
    });
    expect(group?.kind === "group" && group.layers[0]?.kind === "tile" ? group.layers[0].chunks : undefined).toEqual([
      {
        x: 0,
        y: 0,
        width: 2,
        height: 1,
        cells: [
          {
            gid: 1,
            flipHorizontally: false,
            flipVertically: false,
            flipDiagonally: false
          },
          {
            gid: 2,
            flipHorizontally: false,
            flipVertically: false,
            flipDiagonally: false
          }
        ]
      }
    ]);
  });

  it("surfaces unsupported or lossy TMJ input as import issues", () => {
    const imported = importTmjMapDocument({
      name: "warnings",
      orientation: "orthogonal",
      width: 1,
      height: 1,
      tilewidth: 32,
      tileheight: 32,
      layers: [
        {
          type: "tilelayer",
          name: "Encoded",
          encoding: "base64",
          data: "AAAA"
        },
        {
          type: "objectgroup",
          name: "Objects",
          objects: [
            {
              id: 3,
              name: "Ref",
              properties: [
                {
                  name: "target",
                  type: "object",
                  value: 3
                }
              ]
            }
          ]
        }
      ]
    });

    expect(imported.issues).toEqual([
      {
        severity: "warning",
        code: "tmj.tileData.encodingUnsupported",
        message: "Only array-based TMJ tile data is currently supported.",
        path: "tmj.layers[0].data"
      },
      {
        severity: "warning",
        code: "tmj.property.objectReferenceUnsupported",
        message:
          "Object property `target` uses unresolved TMJ object ids and is currently imported as null.",
        path: "tmj.layers[1].objects[0].properties[0]"
      }
    ]);
    expect(imported.map.layers[1]?.kind === "object" ? imported.map.layers[1].objects[0]?.properties : undefined).toEqual([
      {
        name: "target",
        type: "object",
        value: null
      }
    ]);
  });

  it("exports a deterministic TMJ document for supported map content", () => {
    const groundLayer = {
      ...createTileLayer({
        name: "Ground",
        width: 2,
        height: 2,
        opacity: 0.75,
        offsetX: 8
      }),
      cells: [
        createTileCell(1),
        {
          gid: 2,
          flipHorizontally: true,
          flipVertically: false,
          flipDiagonally: false
        },
        createTileCell(null),
        {
          gid: 4,
          flipHorizontally: true,
          flipVertically: true,
          flipDiagonally: false
        }
      ]
    };
    const spawn = createMapObject({
      name: "Spawn",
      className: "SpawnPoint",
      shape: "rectangle",
      x: 32,
      y: 48,
      width: 16,
      height: 16
    });
    const marker = createMapObject({
      name: "Marker",
      shape: "point",
      x: 8,
      y: 12,
      properties: [createProperty("target", "object", { objectId: spawn.id })]
    });
    const objectLayer = createObjectLayer({
      name: "Objects",
      drawOrder: "index",
      objects: [spawn, marker]
    });
    const map = {
      ...createMap({
        name: "demo-export",
        orientation: "orthogonal",
        width: 2,
        height: 2,
        tileWidth: 32,
        tileHeight: 32,
        backgroundColor: "#112233",
        properties: [createProperty("difficulty", "string", "hard")],
        layers: [groundLayer, objectLayer]
      }),
      nextObjectId: 9
    };

    const document = exportTmjMapDocument({
      map,
      tiledVersion: "1.11.2",
      tilesetReferences: [{ firstGid: 1, source: "../tilesets/terrain.tsj" }]
    });

    expect(document).toMatchObject({
      type: "map",
      version: "1.11",
      tiledversion: "1.11.2",
      orientation: "orthogonal",
      renderorder: "right-down",
      width: 2,
      height: 2,
      tilewidth: 32,
      tileheight: 32,
      infinite: false,
      nextlayerid: 3,
      nextobjectid: 9,
      compressionlevel: -1,
      backgroundcolor: "#112233",
      properties: [
        {
          name: "difficulty",
          type: "string",
          value: "hard"
        }
      ],
      tilesets: [
        {
          firstgid: 1,
          source: "../tilesets/terrain.tsj"
        }
      ]
    });
    expect(document.layers).toEqual([
      {
        type: "tilelayer",
        width: 2,
        height: 2,
        id: 1,
        name: "Ground",
        x: 0,
        y: 0,
        visible: true,
        opacity: 0.75,
        offsetx: 8,
        data: [1, 2147483650, 0, 3221225476]
      },
      {
        type: "objectgroup",
        draworder: "index",
        id: 2,
        name: "Objects",
        x: 0,
        y: 0,
        visible: true,
        opacity: 1,
        objects: [
          {
            id: 1,
            name: "Spawn",
            type: "SpawnPoint",
            x: 32,
            y: 48,
            width: 16,
            height: 16,
            rotation: 0,
            visible: true
          },
          {
            properties: [
              {
                name: "target",
                type: "object",
                value: 1
              }
            ],
            id: 2,
            name: "Marker",
            type: "",
            x: 8,
            y: 12,
            width: 0,
            height: 0,
            rotation: 0,
            visible: true,
            point: true
          }
        ]
      }
    ]);
    expect(stringifyTmjMapDocument({ map })).toBe(stringifyTmjMapDocument({ map }));
  });

  it("round-trips infinite chunks, image layers and group layers through TMJ json", () => {
    const imageLayer = createImageLayer({
      name: "Backdrop",
      imagePath: "../images/backdrop.png",
      repeatX: true
    });
    const chunkedLayer = {
      ...createTileLayer({
        name: "Chunks",
        width: 1,
        height: 1,
        infinite: true
      }),
      chunks: [
        {
          x: 2,
          y: 0,
          width: 1,
          height: 1,
          cells: [createTileCell(3)]
        },
        {
          x: 0,
          y: 0,
          width: 1,
          height: 1,
          cells: [createTileCell(1)]
        }
      ]
    };
    const groupLayer = createGroupLayer({
      name: "Gameplay",
      layers: [chunkedLayer, imageLayer]
    });
    const map = createMap({
      name: "roundtrip",
      orientation: "orthogonal",
      width: 10,
      height: 10,
      tileWidth: 32,
      tileHeight: 32,
      infinite: true,
      layers: [groupLayer]
    });

    const exported = exportTmjMapDocument({ map });
    const imported = importTmjMapDocument(exported);

    expect(imported.issues).toEqual([]);
    expect(imported.map.settings.infinite).toBe(true);
    expect(imported.map.layers[0]).toMatchObject({
      kind: "group",
      name: "Gameplay"
    });
    expect(
      imported.map.layers[0]?.kind === "group" && imported.map.layers[0].layers[0]?.kind === "tile"
        ? imported.map.layers[0].layers[0].chunks
        : undefined
    ).toEqual([
      {
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        cells: [createTileCell(1)]
      },
      {
        x: 2,
        y: 0,
        width: 1,
        height: 1,
        cells: [createTileCell(3)]
      }
    ]);
    expect(
      imported.map.layers[0]?.kind === "group" && imported.map.layers[0].layers[1]?.kind === "image"
        ? imported.map.layers[0].layers[1]
        : undefined
    ).toMatchObject({
      kind: "image",
      imagePath: "../images/backdrop.png",
      repeatX: true
    });
  });
});
