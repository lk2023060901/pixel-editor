import { describe, expect, it } from "vitest";

import { importTmxMapDocument } from "./index";

describe("importTmxMapDocument", () => {
  it("imports finite TMX documents through the shared TMJ normalization path", () => {
    const imported = importTmxMapDocument(`<?xml version="1.0" encoding="UTF-8"?>
<map version="1.11" tiledversion="1.11.2" name="xml-demo" orientation="orthogonal" renderorder="right-down" width="2" height="2" tilewidth="32" tileheight="32" infinite="0" backgroundcolor="#112233">
  <properties>
    <property name="biome" type="string" propertytype="Biome" value="forest"/>
  </properties>
  <tileset firstgid="1" source="../tilesets/terrain.tsx"/>
  <layer id="1" name="Ground" width="2" height="2">
    <data encoding="csv">
      1,0,
      2147483650,3
    </data>
  </layer>
  <objectgroup id="2" name="Objects" draworder="index">
    <object id="7" name="Spawn" x="32" y="48" width="16" height="16"/>
    <object id="8" name="Marker" x="8" y="12">
      <point/>
    </object>
  </objectgroup>
</map>`, {
      documentPath: "maps/demo.tmx",
      assetRoots: ["maps", "tilesets", "templates"]
    });

    expect(imported.map.name).toBe("xml-demo");
    expect(imported.map.settings.backgroundColor).toBe("#112233");
    expect(imported.map.layers).toHaveLength(2);
    expect(imported.map.layers[0]).toMatchObject({
      kind: "tile",
      name: "Ground"
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
    expect(imported.tilesetReferences).toEqual([
      {
        firstGid: 1,
        source: "../tilesets/terrain.tsx"
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
    expect(imported.assetReferences).toEqual([
      {
        kind: "tileset",
        ownerPath: "tmx.tilesets[0].source",
        originalPath: "../tilesets/terrain.tsx",
        resolvedPath: "tilesets/terrain.tsx",
        pathKind: "relative",
        assetRoot: "tilesets",
        externalToProject: false,
        documentPath: "maps/demo.tmx"
      }
    ]);
    expect(imported.issues).toEqual([]);
  });

  it("imports infinite chunked TMX layers and embedded tileset metadata", () => {
    const imported = importTmxMapDocument(`<?xml version="1.0" encoding="UTF-8"?>
<map version="1.11" tiledversion="1.11.2" name="infinite-xml" orientation="orthogonal" width="10" height="10" tilewidth="32" tileheight="32" infinite="1">
  <tileset firstgid="1" name="Embedded" tilewidth="32" tileheight="32" tilecount="4" columns="2">
    <image source="../tilesets/embedded.png" width="64" height="64"/>
  </tileset>
  <group id="1" name="Gameplay">
    <layer id="2" name="Chunks">
      <data encoding="csv">
        <chunk x="0" y="0" width="2" height="1">1,2</chunk>
      </data>
    </layer>
  </group>
</map>`);

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
    expect(imported.tilesetReferences).toEqual([
      {
        firstGid: 1,
        name: "Embedded",
        tileCount: 4,
        image: "../tilesets/embedded.png"
      }
    ]);
  });

  it("surfaces unsupported or lossy TMX input as import issues", () => {
    const imported = importTmxMapDocument(`<?xml version="1.0" encoding="UTF-8"?>
<map version="1.11" tiledversion="1.11.2" name="warnings" orientation="orthogonal" width="1" height="1" tilewidth="32" tileheight="32">
  <layer id="1" name="Encoded">
    <data encoding="base64">AAAA</data>
  </layer>
  <objectgroup id="2" name="Objects">
    <object id="3" name="Ref" template="../templates/ref.tx">
      <properties>
        <property name="target" type="object" value="3"/>
      </properties>
    </object>
  </objectgroup>
</map>`, {
      documentPath: "maps/demo.tmx",
      assetRoots: ["maps", "tilesets", "templates"]
    });

    expect(imported.assetReferences).toEqual([
      {
        kind: "template",
        ownerPath: "tmx.layers[1].objects[0].template",
        originalPath: "../templates/ref.tx",
        resolvedPath: "templates/ref.tx",
        pathKind: "relative",
        assetRoot: "templates",
        externalToProject: false,
        documentPath: "maps/demo.tmx"
      }
    ]);
    expect(imported.issues).toEqual([
      {
        severity: "warning",
        code: "tmx.object.templateUnsupported",
        message: "Template-backed object `Ref` keeps only inline attributes during TMX import.",
        path: "tmx.layers[1].objects[0]"
      },
      {
        severity: "warning",
        code: "tmj.tileData.encodingUnsupported",
        message: "Only array-based TMJ tile data is currently supported.",
        path: "tmj.layers[0].data"
      },
      {
        severity: "warning",
        code: "tmj.property.objectReferenceUnsupported",
        message: "Object property `target` uses unresolved TMJ object ids and is currently imported as null.",
        path: "tmj.layers[1].objects[0].properties[0]"
      }
    ]);
  });

  it("reports unknown attributes, unknown elements and external TMX references", () => {
    const imported = importTmxMapDocument(`<?xml version="1.0" encoding="UTF-8"?>
<map version="1.11" tiledversion="1.11.2" name="warnings" orientation="orthogonal" width="1" height="1" tilewidth="32" tileheight="32" mystery="1">
  <tileset firstgid="1" source="https://example.com/terrain.tsx"/>
  <unknown-node />
</map>`, {
      documentPath: "maps/demo.tmx",
      assetRoots: ["maps", "tilesets", "templates"]
    });

    expect(imported.issues).toEqual([
      {
        severity: "warning",
        code: "tmx.attribute.unknown",
        message: "Unknown TMX attribute `mystery` was ignored during import.",
        path: "tmx.@mystery"
      },
      {
        severity: "warning",
        code: "tmx.element.unknown",
        message: "Unknown TMX element <unknown-node> was ignored during import.",
        path: "tmx.unknown-node[0]"
      },
      {
        severity: "warning",
        code: "tmx.asset.externalReference",
        message:
          "External TMX tileset reference `https://example.com/terrain.tsx` is outside known project asset roots.",
        path: "tmx.tilesets[0].source"
      }
    ]);
  });
});
