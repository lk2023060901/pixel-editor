import { describe, expect, it } from "vitest";

import { importTmxMapDocument } from "@pixel-editor/tiled-xml";

import {
  compileAutomappingRuleMap,
  executeAutomappingRuleMap,
  runAutomappingRuleMap
} from "./index";

function importMap(xml: string) {
  return importTmxMapDocument(xml).map;
}

function getFiniteTileRows(mapXml: string, layerName: string): number[][] {
  const map = importMap(mapXml);
  const layer = map.layers.find((entry) => entry.kind === "tile" && entry.name === layerName);

  if (!layer || layer.kind !== "tile") {
    throw new Error(`Expected finite tile layer ${layerName}`);
  }

  const rows: number[][] = [];

  for (let y = 0; y < layer.height; y += 1) {
    const row: number[] = [];

    for (let x = 0; x < layer.width; x += 1) {
      row.push(layer.cells[y * layer.width + x]?.gid ?? 0);
    }

    rows.push(row);
  }

  return rows;
}

function getMapLayerRows(map: ReturnType<typeof importMap>, layerName: string): number[][] {
  const layer = map.layers.find((entry) => entry.kind === "tile" && entry.name === layerName);

  if (!layer || layer.kind !== "tile") {
    throw new Error(`Expected tile layer ${layerName}`);
  }

  const rows: number[][] = [];

  for (let y = 0; y < layer.height; y += 1) {
    const row: number[] = [];

    for (let x = 0; x < layer.width; x += 1) {
      row.push(layer.cells[y * layer.width + x]?.gid ?? 0);
    }

    rows.push(row);
  }

  return rows;
}

function automapRuleTileResolver(gid: number) {
  switch (gid) {
    case 17:
      return { matchType: "Negate" as const };
    case 18:
      return { matchType: "Ignore" as const };
    case 19:
      return { matchType: "NonEmpty" as const };
    case 20:
      return { matchType: "Empty" as const };
    case 21:
      return { matchType: "Other" as const };
    default:
      return undefined;
  }
}

describe("@pixel-editor/automapping", () => {
  it("matches and applies the simple replace fixture", () => {
    const ruleMap = importMap(`<?xml version="1.0" encoding="UTF-8"?>
<map version="1.8" tiledversion="1.8.2" orientation="orthogonal" renderorder="right-down" width="7" height="3" tilewidth="16" tileheight="16" infinite="0">
 <properties>
  <property name="MatchInOrder" type="bool" value="true"/>
 </properties>
 <tileset firstgid="1" source="../spr_test_tileset.tsx"/>
 <layer id="1" name="input_set" width="7" height="3">
  <data encoding="csv">
0,0,0,0,0,0,0,
0,2,0,3,0,4,0,
0,0,0,0,0,0,0
</data>
 </layer>
 <layer id="2" name="output_set" width="7" height="3">
  <data encoding="csv">
0,0,0,0,0,0,0,
0,3,0,4,0,5,0,
0,0,0,0,0,0,0
</data>
 </layer>
</map>`);
    const targetMap = importMap(`<?xml version="1.0" encoding="UTF-8"?>
<map version="1.8" tiledversion="1.8.2" orientation="orthogonal" renderorder="right-down" width="5" height="5" tilewidth="16" tileheight="16" infinite="0">
 <tileset firstgid="1" source="../spr_test_tileset.tsx"/>
 <layer id="1" name="set" width="5" height="5">
  <data encoding="csv">
0,0,0,0,0,
0,2,3,4,0,
0,0,0,0,0,
0,4,3,2,0,
0,0,0,0,0
</data>
 </layer>
</map>`);
    const result = runAutomappingRuleMap(ruleMap, targetMap);

    expect(result.issues).toEqual([]);
    expect(getMapLayerRows(result.map, "set")).toEqual([
      [0, 0, 0, 0, 0],
      [0, 5, 5, 5, 0],
      [0, 0, 0, 0, 0],
      [0, 5, 5, 5, 0],
      [0, 0, 0, 0, 0]
    ]);
  });

  it("respects MatchInOrder when applying 2x2 rules", () => {
    const ruleMap = importMap(`<?xml version="1.0" encoding="UTF-8"?>
<map version="1.8" tiledversion="1.8.2" orientation="orthogonal" renderorder="right-down" width="4" height="4" tilewidth="16" tileheight="16" infinite="0">
 <properties>
  <property name="MatchInOrder" type="bool" value="true"/>
 </properties>
 <tileset firstgid="1" source="../spr_test_tileset.tsx"/>
 <layer id="1" name="input_set" width="4" height="4">
  <data encoding="csv">
0,0,0,0,
0,2,2,0,
0,2,2,0,
0,0,0,0
</data>
 </layer>
 <layer id="2" name="output_set" width="4" height="4">
  <data encoding="csv">
0,0,0,0,
0,3,3,0,
0,3,3,0,
0,0,0,0
</data>
 </layer>
</map>`);
    const targetMap = importMap(`<?xml version="1.0" encoding="UTF-8"?>
<map version="1.8" tiledversion="1.8.2" orientation="orthogonal" renderorder="right-down" width="5" height="5" tilewidth="16" tileheight="16" infinite="0">
 <tileset firstgid="1" source="../spr_test_tileset.tsx"/>
 <layer id="1" name="set" width="5" height="5">
  <data encoding="csv">
0,0,0,0,0,
2,2,2,2,0,
2,2,2,2,0,
0,2,2,2,0,
0,0,0,0,0
</data>
 </layer>
</map>`);
    const result = runAutomappingRuleMap(ruleMap, targetMap);

    expect(result.issues).toEqual([]);
    expect(getMapLayerRows(result.map, "set")).toEqual([
      [0, 0, 0, 0, 0],
      [3, 3, 3, 3, 0],
      [3, 3, 3, 3, 0],
      [0, 2, 2, 2, 0],
      [0, 0, 0, 0, 0]
    ]);
  });

  it("supports input layer flip masks", () => {
    const ruleMap = importMap(`<?xml version="1.0" encoding="UTF-8"?>
<map version="1.10" tiledversion="1.10.2" orientation="orthogonal" renderorder="right-down" width="10" height="5" tilewidth="16" tileheight="16" infinite="0">
 <tileset firstgid="1" source="../spr_test_tileset.tsx"/>
 <layer id="7" name="input_set" width="10" height="5">
  <data encoding="csv">
0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,2,0,0,
0,0,0,0,0,0,0,0,0,0
</data>
 </layer>
 <layer id="9" name="input_set" width="10" height="5">
  <properties>
   <property name="IgnoreVerticalFlip" type="bool" value="true"/>
  </properties>
  <data encoding="csv">
0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,2,0,0,0,0,
0,0,0,0,0,0,0,0,0,0
</data>
 </layer>
 <layer id="10" name="input_set" width="10" height="5">
  <properties>
   <property name="IgnoreHorizontalFlip" type="bool" value="true"/>
  </properties>
  <data encoding="csv">
0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,
0,0,0,2,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0
</data>
 </layer>
 <layer id="5" name="input_set" width="10" height="5">
  <properties>
   <property name="IgnoreHorizontalFlip" type="bool" value="true"/>
   <property name="IgnoreVerticalFlip" type="bool" value="true"/>
  </properties>
  <data encoding="csv">
0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,
0,2,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0
</data>
 </layer>
 <layer id="11" name="input_set" width="10" height="5">
  <properties>
   <property name="IgnoreDiagonalFlip" type="bool" value="true"/>
  </properties>
  <data encoding="csv">
0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,2,0,0,
0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0
</data>
 </layer>
 <layer id="8" name="input_set" width="10" height="5">
  <properties>
   <property name="IgnoreDiagonalFlip" type="bool" value="true"/>
   <property name="IgnoreVerticalFlip" type="bool" value="true"/>
  </properties>
  <data encoding="csv">
0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,2,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0
</data>
 </layer>
 <layer id="1" name="input_set" width="10" height="5">
  <properties>
   <property name="IgnoreDiagonalFlip" type="bool" value="true"/>
   <property name="IgnoreHorizontalFlip" type="bool" value="true"/>
  </properties>
  <data encoding="csv">
0,0,0,0,0,0,0,0,0,0,
0,0,0,2,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0
</data>
 </layer>
 <layer id="6" name="input_set" width="10" height="5">
  <properties>
   <property name="IgnoreDiagonalFlip" type="bool" value="true"/>
   <property name="IgnoreHorizontalFlip" type="bool" value="true"/>
   <property name="IgnoreVerticalFlip" type="bool" value="true"/>
  </properties>
  <data encoding="csv">
0,0,0,0,0,0,0,0,0,0,
0,2,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0
</data>
 </layer>
 <layer id="2" name="output_set" width="10" height="5">
  <data encoding="csv">
0,0,0,0,0,0,0,0,0,0,
0,5,0,6,0,7,0,8,0,0,
0,0,0,0,0,0,0,0,0,0,
0,9,0,10,0,11,0,12,0,0,
0,0,0,0,0,0,0,0,0,0
</data>
 </layer>
</map>`);
    const targetMap = importMap(`<?xml version="1.0" encoding="UTF-8"?>
<map version="1.10" tiledversion="1.10.2" orientation="orthogonal" renderorder="right-down" width="4" height="2" tilewidth="16" tileheight="16" infinite="0">
 <tileset firstgid="1" source="../spr_test_tileset.tsx"/>
 <layer id="1" name="set" width="4" height="2">
  <data encoding="csv">
2,1073741826,2147483650,3221225474,
536870914,1610612738,2684354562,3758096386
</data>
 </layer>
</map>`);
    const result = runAutomappingRuleMap(ruleMap, targetMap);

    expect(result.issues).toEqual([]);
    expect(getMapLayerRows(result.map, "set")).toEqual([
      [12, 11, 10, 9],
      [8, 7, 6, 5]
    ]);
  });

  it("supports rule option areas and creates missing output layers", () => {
    const ruleMap = importMap(`<?xml version="1.0" encoding="UTF-8"?>
<map version="1.8" tiledversion="1.8.4" orientation="orthogonal" renderorder="right-down" width="7" height="4" tilewidth="16" tileheight="16" infinite="0">
 <properties>
  <property name="MatchInOrder" type="bool" value="false"/>
  <property name="modX" type="int" value="2"/>
 </properties>
 <tileset firstgid="1" source="../spr_test_tileset.tsx"/>
 <layer id="1" name="input_set" width="7" height="4">
  <data encoding="csv">
0,0,0,0,0,0,0,
0,2,0,2,0,2,0,
0,0,0,0,0,0,0,
0,0,0,0,0,0,0
</data>
 </layer>
 <layer id="2" name="output_auto" width="7" height="4">
  <data encoding="csv">
0,0,0,0,0,0,0,
0,5,0,6,0,7,0,
0,0,0,0,0,0,0,
0,0,0,0,0,0,0
</data>
 </layer>
 <objectgroup id="4" name="rule_options">
  <object id="3" x="44" y="12" width="24" height="24">
   <properties>
    <property name="offsetX" type="int" value="1"/>
   </properties>
  </object>
  <object id="4" x="75" y="12" width="26" height="24">
   <properties>
    <property name="modX" type="int" value="1"/>
    <property name="modY" type="int" value="4"/>
   </properties>
  </object>
 </objectgroup>
</map>`);
    const targetMap = importMap(`<?xml version="1.0" encoding="UTF-8"?>
<map version="1.8" tiledversion="1.8.4" orientation="orthogonal" renderorder="right-down" width="5" height="5" tilewidth="16" tileheight="16" infinite="0">
 <tileset firstgid="1" source="../spr_test_tileset.tsx"/>
 <layer id="1" name="set" width="5" height="5">
  <data encoding="csv">
2,2,2,2,2,
2,2,2,2,2,
2,2,2,2,2,
2,2,2,2,2,
2,2,2,2,2
</data>
 </layer>
</map>`);
    const result = runAutomappingRuleMap(ruleMap, targetMap);

    expect(result.issues).toEqual([]);
    expect(getMapLayerRows(result.map, "set")).toEqual([
      [2, 2, 2, 2, 2],
      [2, 2, 2, 2, 2],
      [2, 2, 2, 2, 2],
      [2, 2, 2, 2, 2],
      [2, 2, 2, 2, 2]
    ]);
    expect(getMapLayerRows(result.map, "auto")).toEqual([
      [7, 7, 7, 7, 7],
      [5, 6, 5, 6, 5],
      [5, 6, 5, 6, 5],
      [5, 6, 5, 6, 5],
      [7, 7, 7, 7, 7]
    ]);
    expect(result.createdLayerIds).toHaveLength(1);
  });

  it("supports named output sets with deterministic probability selection", () => {
    const ruleMap = importMap(`<?xml version="1.0" encoding="UTF-8"?>
<map version="1.10" tiledversion="1.10.2" orientation="orthogonal" renderorder="right-down" width="4" height="4" tilewidth="16" tileheight="16" infinite="0">
 <tileset firstgid="1" source="../spr_test_tileset.tsx"/>
 <layer id="1" name="input_set" width="4" height="4">
  <data encoding="csv">
0,0,0,0,
0,2,0,0,
0,0,0,0,
0,0,0,0
</data>
 </layer>
 <layer id="5" name="outputB_auto" width="4" height="4">
  <data encoding="csv">
0,0,0,0,
0,7,0,0,
0,0,0,0,
0,0,0,0
</data>
 </layer>
 <layer id="6" name="outputA_auto" width="4" height="4">
  <properties>
   <property name="Probability" type="float" value="3"/>
  </properties>
  <data encoding="csv">
0,0,0,0,
0,6,0,0,
0,0,0,0,
0,0,0,0
</data>
 </layer>
 <layer id="2" name="output_auto_base" width="4" height="4">
  <data encoding="csv">
0,0,0,0,
0,5,0,0,
0,0,0,0,
0,0,0,0
</data>
 </layer>
</map>`);
    const targetMap = importMap(`<?xml version="1.0" encoding="UTF-8"?>
<map version="1.10" tiledversion="1.10.2" orientation="orthogonal" renderorder="right-down" width="5" height="5" tilewidth="16" tileheight="16" infinite="0">
 <tileset firstgid="1" source="../spr_test_tileset.tsx"/>
 <layer id="1" name="set" width="5" height="5">
  <data encoding="csv">
2,2,2,2,2,
2,2,2,2,2,
2,2,2,2,2,
2,2,2,2,2,
2,2,2,2,2
</data>
 </layer>
 <layer id="9" name="auto_base" width="5" height="5">
  <data encoding="csv">
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0
</data>
 </layer>
 <layer id="8" name="auto" width="5" height="5">
  <data encoding="csv">
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0
</data>
 </layer>
</map>`);
    const compiled = compileAutomappingRuleMap(ruleMap);
    const selectedA = executeAutomappingRuleMap(targetMap, compiled, {
      random: () => 0.9
    });
    const selectedB = executeAutomappingRuleMap(targetMap, compiled, {
      random: () => 0.1
    });

    expect(selectedA.issues).toEqual([]);
    expect(selectedA.matches[0]?.randomOutputSetName).toBe("A");
    expect(getMapLayerRows(selectedA.map, "auto_base")).toEqual([
      [5, 5, 5, 5, 5],
      [5, 5, 5, 5, 5],
      [5, 5, 5, 5, 5],
      [5, 5, 5, 5, 5],
      [5, 5, 5, 5, 5]
    ]);
    expect(getMapLayerRows(selectedA.map, "auto")).toEqual([
      [6, 6, 6, 6, 6],
      [6, 6, 6, 6, 6],
      [6, 6, 6, 6, 6],
      [6, 6, 6, 6, 6],
      [6, 6, 6, 6, 6]
    ]);

    expect(selectedB.issues).toEqual([]);
    expect(selectedB.matches[0]?.randomOutputSetName).toBe("B");
    expect(getMapLayerRows(selectedB.map, "auto")).toEqual([
      [7, 7, 7, 7, 7],
      [7, 7, 7, 7, 7],
      [7, 7, 7, 7, 7],
      [7, 7, 7, 7, 7],
      [7, 7, 7, 7, 7]
    ]);
  });

  it("does not match rules whose output region would fall outside a finite map", () => {
    const ruleMap = importMap(`<?xml version="1.0" encoding="UTF-8"?>
<map version="1.11" tiledversion="1.11.0" orientation="orthogonal" renderorder="right-down" width="5" height="3" tilewidth="16" tileheight="16" infinite="0">
 <tileset firstgid="1" source="../spr_test_tileset.tsx"/>
 <layer id="6" name="input_set" width="5" height="3">
  <data encoding="csv">
0,0,0,0,0,
0,3,0,0,0,
0,0,0,0,0
</data>
 </layer>
 <layer id="2" name="output_set" width="5" height="3">
  <data encoding="csv">
0,0,0,0,0,
0,0,0,4,0,
0,0,0,0,0
</data>
 </layer>
</map>`);
    const targetMap = importMap(`<?xml version="1.0" encoding="UTF-8"?>
<map version="1.11" tiledversion="1.11.0" orientation="orthogonal" renderorder="right-down" width="2" height="2" tilewidth="16" tileheight="16" infinite="0">
 <tileset firstgid="1" source="../spr_test_tileset.tsx"/>
 <layer id="1" name="set" width="2" height="2">
  <data encoding="csv">
2,2,
2,2
</data>
 </layer>
</map>`);
    const result = runAutomappingRuleMap(ruleMap, targetMap);

    expect(result.issues).toEqual([]);
    expect(result.matches).toEqual([]);
    expect(getMapLayerRows(result.map, "set")).toEqual([
      [2, 2],
      [2, 2]
    ]);
  });

  it("supports rule tile MatchType metadata through an injected resolver", () => {
    const ruleMap = importMap(`<?xml version="1.0" encoding="UTF-8"?>
<map version="1.8" tiledversion="1.8.4" orientation="orthogonal" renderorder="right-down" width="7" height="4" tilewidth="32" tileheight="32" infinite="0">
 <tileset firstgid="1" source="../spr_test_tileset.tsx"/>
 <tileset firstgid="17" source="../../../src/tiled/resources/automap-tiles.tsx"/>
 <layer id="1" name="input_in" width="7" height="4">
  <data encoding="csv">
18,0,19,2,0,3,8,
0,0,0,0,0,0,0,
20,0,21,0,0,9,9,
4,0,18,3,0,0,0
</data>
 </layer>
 <layer id="6" name="input_in" width="7" height="4">
  <data encoding="csv">
0,0,0,0,0,17,0,
0,0,0,0,0,0,0,
0,0,0,0,0,17,0,
0,0,0,0,0,0,0
</data>
 </layer>
 <layer id="2" name="output_in" width="7" height="4">
  <data encoding="csv">
0,0,5,5,0,0,10,
0,0,0,0,0,0,0,
6,0,7,0,0,11,0,
6,0,0,0,0,0,0
</data>
 </layer>
</map>`);
    const targetMap = importMap(`<?xml version="1.0" encoding="UTF-8"?>
<map version="1.8" tiledversion="1.8.4" orientation="orthogonal" renderorder="right-down" width="8" height="4" tilewidth="32" tileheight="32" infinite="0">
 <tileset firstgid="1" source="../spr_test_tileset.tsx"/>
 <layer id="1" name="in" width="8" height="4">
  <data encoding="csv">
2,3,3,3,8,8,8,8,
3,3,3,3,8,9,9,9,
0,3,3,3,8,9,9,9,
4,4,3,2,8,9,9,9
</data>
 </layer>
</map>`);
    const result = runAutomappingRuleMap(ruleMap, targetMap, {
      ruleTileMetadataResolver: automapRuleTileResolver
    });

    expect(result.issues).toEqual([]);
    expect(getMapLayerRows(result.map, "in")).toEqual([
      [7, 3, 3, 3, 8, 10, 10, 10],
      [3, 3, 3, 3, 11, 9, 9, 9],
      [6, 3, 3, 3, 11, 9, 9, 9],
      [6, 4, 5, 5, 11, 9, 9, 9]
    ]);
  });
});
