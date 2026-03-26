import { describe, expect, it } from "vitest";

import { importTmjMapDocument } from "@pixel-editor/tiled-json";

import { importTmxMapDocument } from "./index";
import { stringifyTmxMapDocument } from "./export";

describe("stringifyTmxMapDocument", () => {
  it("serializes finite TMX documents with external tilesets and custom properties", () => {
    const imported = importTmjMapDocument({
      name: "demo",
      orientation: "orthogonal",
      width: 2,
      height: 2,
      tilewidth: 32,
      tileheight: 32,
      renderorder: "right-down",
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
          source: "../tilesets/terrain.tsx"
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

    const xml = stringifyTmxMapDocument({
      map: imported.map,
      tilesetReferences: imported.tilesetReferences
    });
    const roundTrip = importTmxMapDocument(xml);

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<tileset firstgid="1" source="../tilesets/terrain.tsx"/>');
    expect(xml).toContain('<property name="biome" type="string" propertytype="Biome" value="forest"/>');
    expect(xml).toContain('<point/>');
    expect(roundTrip.map.settings).toMatchObject({
      orientation: "orthogonal",
      width: 2,
      height: 2,
      tileWidth: 32,
      tileHeight: 32,
      backgroundColor: "#112233"
    });
    expect(roundTrip.map.layers).toHaveLength(2);
    expect(roundTrip.tilesetReferences).toEqual(imported.tilesetReferences);
    expect(roundTrip.issues).toEqual([]);
  });

  it("serializes infinite chunked layers and embedded tileset metadata", () => {
    const imported = importTmjMapDocument({
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
      ],
      tilesets: [
        {
          firstgid: 1,
          name: "Embedded",
          tilecount: 4,
          image: "../tilesets/embedded.png"
        }
      ]
    });

    const xml = stringifyTmxMapDocument({
      map: imported.map,
      tilesetReferences: imported.tilesetReferences
    });
    const roundTrip = importTmxMapDocument(xml);

    expect(xml).toContain('<chunk x="0" y="0" width="2" height="1">');
    expect(xml).toContain(
      '<tileset firstgid="1" name="Embedded" tilewidth="32" tileheight="32" tilecount="4" columns="0">'
    );
    expect(roundTrip.tilesetReferences).toEqual([
      {
        firstGid: 1,
        name: "Embedded",
        tileCount: 4,
        image: "../tilesets/embedded.png"
      }
    ]);
    expect(roundTrip.map.layers[0]?.kind).toBe("group");
    expect(
      roundTrip.map.layers[0]?.kind === "group" && roundTrip.map.layers[0].layers[0]?.kind === "tile"
        ? roundTrip.map.layers[0].layers[0].chunks
        : undefined
    ).toEqual([
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

  it("serializes image layers and text objects with XML child elements", () => {
    const imported = importTmjMapDocument({
      orientation: "orthogonal",
      width: 4,
      height: 4,
      tilewidth: 32,
      tileheight: 32,
      layers: [
        {
          type: "imagelayer",
          name: "Backdrop",
          image: "../images/bg.png",
          imagewidth: 256,
          imageheight: 128,
          repeatx: true
        },
        {
          type: "objectgroup",
          name: "Objects",
          objects: [
            {
              id: 3,
              name: "Label",
              x: 12,
              y: 14,
              text: {
                text: "Hello",
                fontfamily: "Fira Code",
                pixelsize: 18,
                wrap: true,
                color: "#112233"
              }
            },
            {
              id: 4,
              name: "Route",
              x: 0,
              y: 0,
              polyline: [
                { x: 0, y: 0 },
                { x: 16, y: 8 }
              ]
            }
          ]
        }
      ]
    });

    const xml = stringifyTmxMapDocument({
      map: imported.map,
      tilesetReferences: imported.tilesetReferences
    });
    const roundTrip = importTmxMapDocument(xml);

    expect(xml).toContain('<imagelayer id="1" name="Backdrop" visible="1" opacity="1" repeatx="1">');
    expect(xml).toContain('<image source="../images/bg.png" width="256" height="128"/>');
    expect(xml).toContain('<text fontfamily="Fira Code" pixelsize="18" wrap="1" color="#112233">');
    expect(xml).toContain('<polyline points="0,0 16,8"/>');
    expect(roundTrip.map.layers[0]).toMatchObject({
      kind: "image",
      name: "Backdrop",
      repeatX: true,
      imagePath: "../images/bg.png"
    });
    expect(roundTrip.map.layers[1]).toMatchObject({
      kind: "object",
      name: "Objects"
    });
  });
});
