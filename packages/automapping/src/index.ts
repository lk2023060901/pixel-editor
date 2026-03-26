import {
  addTopLevelTileLayer,
  clonePropertyDefinition,
  createEmptyTileCell,
  getTileLayerBounds,
  getTileLayerCell,
  setTileLayerCell,
  type EditorMap,
  type LayerDefinition,
  type LayerId,
  type MapObject,
  type PropertyDefinition,
  type TileCell,
  type TileLayer,
  type TileLayerBoundsRect,
  updateLayerInMap
} from "@pixel-editor/domain";

import type {
  AppliedAutomappingRuleMatch,
  AutomappingCompiledInputLayer,
  AutomappingCompiledInputSet,
  AutomappingCompiledOutputLayer,
  AutomappingCompiledOutputSet,
  AutomappingCompiledRule,
  AutomappingEngineIssue,
  AutomappingInputConstraint,
  AutomappingOutputCell,
  AutomappingPatternCell,
  AutomappingRuleTileMatchType,
  AutomappingRuleOptions,
  CompileAutomappingRuleMapOptions,
  CompiledAutomappingRuleMap,
  ExecuteAutomappingOptions,
  ExecutedAutomappingRuleMap,
  RunAutomappingRuleMapOptions
} from "./types";

export * from "./types";

const DEFAULT_RULE_OPTIONS: AutomappingRuleOptions = {
  applyChance: 1,
  modX: 1,
  modY: 1,
  offsetX: 0,
  offsetY: 0,
  disabled: false,
  ignoreLock: false
};

type RuleLayerKind = "input" | "inputnot" | "output";

interface Coordinate {
  x: number;
  y: number;
}

interface CoordinateRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface LayerEntry {
  layer: LayerDefinition;
  path: string;
}

interface ParsedInputLayer {
  kind: "input" | "inputnot";
  setName: string;
  targetLayerName: string;
  layer: TileLayer;
  path: string;
  ignoreHorizontalFlip: boolean;
  ignoreVerticalFlip: boolean;
  ignoreDiagonalFlip: boolean;
}

interface ParsedOutputLayer {
  kind: "output";
  setName: string;
  targetLayerName: string;
  layer: TileLayer;
  path: string;
  probability?: number;
  properties: PropertyDefinition[];
}

interface ParsedRuleOptionPatch {
  applyChance?: number;
  modX?: number;
  modY?: number;
  offsetX?: number;
  offsetY?: number;
  disabled?: boolean;
  ignoreLock?: boolean;
}

interface ParsedRuleOptionsArea {
  rect: CoordinateRect;
  patch: ParsedRuleOptionPatch;
}

type PatternTokenKind =
  | "tile"
  | "empty"
  | "nonempty"
  | "other"
  | "negate"
  | "ignore";

interface PatternToken {
  kind: PatternTokenKind;
  pattern?: AutomappingPatternCell;
}

function appendIssue(
  issues: AutomappingEngineIssue[],
  severity: AutomappingEngineIssue["severity"],
  path: string,
  code: string,
  message: string
): void {
  issues.push({
    severity,
    code,
    message,
    path
  });
}

function toPropertyKey(name: string): string {
  return name.trim().toLowerCase();
}

function getPropertyByName(
  properties: readonly PropertyDefinition[],
  name: string
): PropertyDefinition | undefined {
  const key = toPropertyKey(name);
  return properties.find((property) => toPropertyKey(property.name) === key);
}

function getBooleanProperty(
  properties: readonly PropertyDefinition[],
  name: string
): boolean | undefined {
  const property = getPropertyByName(properties, name);

  return typeof property?.value === "boolean" ? property.value : undefined;
}

function getNumberProperty(
  properties: readonly PropertyDefinition[],
  name: string
): number | undefined {
  const property = getPropertyByName(properties, name);

  return typeof property?.value === "number" ? property.value : undefined;
}

function normalizeRuleProbability(value: number | undefined): number | undefined {
  if (value === undefined || Number.isNaN(value)) {
    return undefined;
  }

  return Math.max(0, Math.min(1, value));
}

function normalizeOutputProbability(value: number | undefined): number | undefined {
  if (value === undefined || Number.isNaN(value)) {
    return undefined;
  }

  return Math.max(0, value);
}

function listLayerEntries(
  layers: readonly LayerDefinition[],
  pathPrefix: string
): LayerEntry[] {
  const entries: LayerEntry[] = [];

  layers.forEach((layer, index) => {
    const path = `${pathPrefix}[${index}]`;

    if (layer.kind === "group") {
      entries.push(...listLayerEntries(layer.layers, `${path}.layers`));
      return;
    }

    entries.push({
      layer,
      path
    });
  });

  return entries;
}

function isCellOccupied(cell: TileCell | undefined): cell is TileCell {
  return cell !== undefined && cell.gid !== null;
}

function coordinateKey(x: number, y: number): string {
  return `${x},${y}`;
}

function parseCoordinateKey(key: string): Coordinate {
  const [rawX = "0", rawY = "0"] = key.split(",");
  const x = Number(rawX);
  const y = Number(rawY);
  return { x, y };
}

function compareCoordinates(left: Coordinate, right: Coordinate): number {
  if (left.y !== right.y) {
    return left.y - right.y;
  }

  return left.x - right.x;
}

function sortCoordinates(coordinates: Iterable<Coordinate>): Coordinate[] {
  return [...coordinates].sort(compareCoordinates);
}

function collectOccupiedCoordinates(layer: TileLayer): Set<string> {
  const occupied = new Set<string>();

  for (const bounds of getTileLayerBounds(layer)) {
    for (let y = bounds.y; y < bounds.y + bounds.height; y += 1) {
      for (let x = bounds.x; x < bounds.x + bounds.width; x += 1) {
        if (isCellOccupied(getTileLayerCell(layer, x, y))) {
          occupied.add(coordinateKey(x, y));
        }
      }
    }
  }

  return occupied;
}

function splitConnectedCoordinates(occupied: Set<string>): Coordinate[][] {
  const remaining = new Set(occupied);
  const components: Coordinate[][] = [];

  while (remaining.size > 0) {
    const firstKey = remaining.values().next().value;

    if (firstKey === undefined) {
      break;
    }

    remaining.delete(firstKey);

    const component: Coordinate[] = [];
    const queue = [parseCoordinateKey(firstKey)];

    while (queue.length > 0) {
      const point = queue.shift();

      if (!point) {
        continue;
      }

      component.push(point);

      const neighbors: Coordinate[] = [
        { x: point.x - 1, y: point.y },
        { x: point.x + 1, y: point.y },
        { x: point.x, y: point.y - 1 },
        { x: point.x, y: point.y + 1 }
      ];

      for (const neighbor of neighbors) {
        const key = coordinateKey(neighbor.x, neighbor.y);

        if (!remaining.has(key)) {
          continue;
        }

        remaining.delete(key);
        queue.push(neighbor);
      }
    }

    components.push(sortCoordinates(component));
  }

  return components.sort((left, right) => compareCoordinates(left[0]!, right[0]!));
}

function getBoundsFromCoordinates(coordinates: readonly Coordinate[]): CoordinateRect {
  const minX = Math.min(...coordinates.map((coordinate) => coordinate.x));
  const minY = Math.min(...coordinates.map((coordinate) => coordinate.y));
  const maxX = Math.max(...coordinates.map((coordinate) => coordinate.x));
  const maxY = Math.max(...coordinates.map((coordinate) => coordinate.y));

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1
  };
}

function parseLayerRole(name: string):
  | { kind: RuleLayerKind; setName: string; targetLayerName: string }
  | undefined {
  const underscoreIndex = name.indexOf("_");

  if (underscoreIndex < 0) {
    return undefined;
  }

  const prefix = name.slice(0, underscoreIndex);
  const targetLayerName = name.slice(underscoreIndex + 1);
  const normalizedPrefix = prefix.toLowerCase();
  let kind: RuleLayerKind | undefined;
  let setName = prefix;

  if (normalizedPrefix.startsWith("inputnot")) {
    kind = "inputnot";
    setName = prefix.slice(8);
  } else if (normalizedPrefix.startsWith("input")) {
    kind = "input";
    setName = prefix.slice(5);
  } else if (normalizedPrefix.startsWith("output")) {
    kind = "output";
    setName = prefix.slice(6);
  }

  if (!kind || targetLayerName.length === 0) {
    return undefined;
  }

  return {
    kind,
    setName,
    targetLayerName
  };
}

function parseMapRuleOptions(
  ruleMap: EditorMap,
  issues: AutomappingEngineIssue[]
): { options: AutomappingRuleOptions; matchInOrder: boolean } {
  const nextOptions: AutomappingRuleOptions = {
    ...DEFAULT_RULE_OPTIONS
  };
  let matchInOrder = false;

  for (const property of ruleMap.properties) {
    const key = toPropertyKey(property.name);
    const value = property.value;

    if (key === "matchinorder" && typeof value === "boolean") {
      matchInOrder = value;
      continue;
    }

    if (key === "modx" && typeof value === "number") {
      nextOptions.modX = Math.max(1, Math.floor(value));
      continue;
    }

    if (key === "mody" && typeof value === "number") {
      nextOptions.modY = Math.max(1, Math.floor(value));
      continue;
    }

    if (key === "offsetx" && typeof value === "number") {
      nextOptions.offsetX = Math.floor(value);
      continue;
    }

    if (key === "offsety" && typeof value === "number") {
      nextOptions.offsetY = Math.floor(value);
      continue;
    }

    if (key === "probability" && typeof value === "number") {
      nextOptions.applyChance = normalizeRuleProbability(value) ?? nextOptions.applyChance;
      continue;
    }

    if (key === "disabled" && typeof value === "boolean") {
      nextOptions.disabled = value;
      continue;
    }

    if (key === "ignorelock" && typeof value === "boolean") {
      nextOptions.ignoreLock = value;
      continue;
    }

    if (
      key === "deletetiles" ||
      key === "matchoutsidemap" ||
      key === "overflowborder" ||
      key === "wrapborder" ||
      key === "automappingradius" ||
      key === "nooverlappingrules" ||
      key === "nooverlappingoutput"
    ) {
      appendIssue(
        issues,
        "warning",
        "ruleMap.properties",
        "automapping.ruleMap.option.unsupported",
        `Automapping rule map option \`${property.name}\` is not supported by the current execution engine.`
      );
    }
  }

  return {
    options: nextOptions,
    matchInOrder
  };
}

function parseRuleOptionPatch(
  properties: readonly PropertyDefinition[]
): ParsedRuleOptionPatch {
  const patch: ParsedRuleOptionPatch = {};
  const probability = normalizeRuleProbability(getNumberProperty(properties, "Probability"));

  if (probability !== undefined) {
    patch.applyChance = probability;
  }

  const modX = getNumberProperty(properties, "ModX");
  if (modX !== undefined) {
    patch.modX = Math.max(1, Math.floor(modX));
  }

  const modY = getNumberProperty(properties, "ModY");
  if (modY !== undefined) {
    patch.modY = Math.max(1, Math.floor(modY));
  }

  const offsetX = getNumberProperty(properties, "OffsetX");
  if (offsetX !== undefined) {
    patch.offsetX = Math.floor(offsetX);
  }

  const offsetY = getNumberProperty(properties, "OffsetY");
  if (offsetY !== undefined) {
    patch.offsetY = Math.floor(offsetY);
  }

  const disabled = getBooleanProperty(properties, "Disabled");
  if (disabled !== undefined) {
    patch.disabled = disabled;
  }

  const ignoreLock = getBooleanProperty(properties, "IgnoreLock");
  if (ignoreLock !== undefined) {
    patch.ignoreLock = ignoreLock;
  }

  return patch;
}

function mergeRuleOptions(
  base: AutomappingRuleOptions,
  patch: ParsedRuleOptionPatch
): AutomappingRuleOptions {
  return {
    applyChance: patch.applyChance ?? base.applyChance,
    modX: patch.modX ?? base.modX,
    modY: patch.modY ?? base.modY,
    offsetX: patch.offsetX ?? base.offsetX,
    offsetY: patch.offsetY ?? base.offsetY,
    disabled: patch.disabled ?? base.disabled,
    ignoreLock: patch.ignoreLock ?? base.ignoreLock
  };
}

function objectToTileRect(map: EditorMap, object: MapObject): CoordinateRect {
  const left = Math.floor(object.x / map.settings.tileWidth);
  const top = Math.floor(object.y / map.settings.tileHeight);
  const right = Math.ceil((object.x + object.width) / map.settings.tileWidth) - 1;
  const bottom = Math.ceil((object.y + object.height) / map.settings.tileHeight) - 1;

  return {
    x: left,
    y: top,
    width: Math.max(1, right - left + 1),
    height: Math.max(1, bottom - top + 1)
  };
}

function rectContainsCoordinate(rect: CoordinateRect, coordinate: Coordinate): boolean {
  return (
    coordinate.x >= rect.x &&
    coordinate.y >= rect.y &&
    coordinate.x < rect.x + rect.width &&
    coordinate.y < rect.y + rect.height
  );
}

function createEmptyPatternCell(): AutomappingPatternCell {
  return {
    matchKind: "empty",
    ignoreHorizontalFlip: false,
    ignoreVerticalFlip: false,
    ignoreDiagonalFlip: false
  };
}

function getResolvedMatchType(
  gid: number,
  options: CompileAutomappingRuleMapOptions
): AutomappingRuleTileMatchType | undefined {
  return options.ruleTileMetadataResolver?.(gid)?.matchType;
}

function parseRuleMapLayers(ruleMap: EditorMap, issues: AutomappingEngineIssue[]): {
  inputLayers: ParsedInputLayer[];
  outputLayers: ParsedOutputLayer[];
  optionAreas: ParsedRuleOptionsArea[];
} {
  const inputLayers: ParsedInputLayer[] = [];
  const outputLayers: ParsedOutputLayer[] = [];
  const optionAreas: ParsedRuleOptionsArea[] = [];

  for (const entry of listLayerEntries(ruleMap.layers, "ruleMap.layers")) {
    const { layer, path } = entry;
    const layerName = layer.name;

    if (layerName.startsWith("//")) {
      continue;
    }

    const loweredName = layerName.toLowerCase();

    if (
      loweredName === "regions" ||
      loweredName === "regions_input" ||
      loweredName === "regions_output"
    ) {
      appendIssue(
        issues,
        "warning",
        path,
        "automapping.ruleMap.layer.unsupported",
        `Automapping layer \`${layerName}\` is recognized but not supported by the current execution engine.`
      );
      continue;
    }

    if (loweredName === "rule_options") {
      if (layer.kind !== "object") {
        appendIssue(
          issues,
          "error",
          path,
          "automapping.ruleMap.layer.invalidKind",
          "`rule_options` layers must be object layers."
        );
        continue;
      }

      layer.objects.forEach((object, objectIndex) => {
        const objectPath = `${path}.objects[${objectIndex}]`;

        if (object.shape !== "rectangle" || object.tile) {
          appendIssue(
            issues,
            "warning",
            objectPath,
            "automapping.ruleMap.ruleOptions.unsupportedObject",
            "Only rectangle rule option objects are currently supported."
          );
          return;
        }

        if (object.rotation !== 0) {
          appendIssue(
            issues,
            "warning",
            objectPath,
            "automapping.ruleMap.ruleOptions.unsupportedRotation",
            "Rotated rule option rectangles are not currently supported."
          );
          return;
        }

        optionAreas.push({
          rect: objectToTileRect(ruleMap, object),
          patch: parseRuleOptionPatch(object.properties)
        });
      });

      continue;
    }

    const role = parseLayerRole(layerName);

    if (!role) {
      appendIssue(
        issues,
        "error",
        path,
        "automapping.ruleMap.layer.invalidName",
        `Layer \`${layerName}\` is not a valid automapping layer name.`
      );
      continue;
    }

    if (layer.kind !== "tile") {
      appendIssue(
        issues,
        "error",
        path,
        "automapping.ruleMap.layer.invalidKind",
        `Automapping layer \`${layerName}\` must be a tile layer.`
      );
      continue;
    }

    if (role.kind === "output") {
      const probability = normalizeOutputProbability(getNumberProperty(layer.properties, "Probability"));
      const properties = layer.properties
        .filter((property) => toPropertyKey(property.name) !== "probability")
        .map((property) => clonePropertyDefinition(property));

      outputLayers.push({
        kind: "output",
        setName: role.setName,
        targetLayerName: role.targetLayerName,
        layer,
        path,
        ...(probability !== undefined ? { probability } : {}),
        properties
      });
      continue;
    }

    inputLayers.push({
      kind: role.kind,
      setName: role.setName,
      targetLayerName: role.targetLayerName,
      layer,
      path,
      ignoreHorizontalFlip: getBooleanProperty(layer.properties, "IgnoreHorizontalFlip") ?? false,
      ignoreVerticalFlip: getBooleanProperty(layer.properties, "IgnoreVerticalFlip") ?? false,
      ignoreDiagonalFlip: getBooleanProperty(layer.properties, "IgnoreDiagonalFlip") ?? false
    });
  }

  return {
    inputLayers,
    outputLayers,
    optionAreas
  };
}

function createPatternCell(
  layer: ParsedInputLayer,
  x: number,
  y: number,
  options: CompileAutomappingRuleMapOptions
): PatternToken | undefined {
  const cell = getTileLayerCell(layer.layer, x, y);

  if (!isCellOccupied(cell)) {
    return undefined;
  }

  const matchType = getResolvedMatchType(cell.gid ?? 0, options);

  switch (matchType) {
    case "Empty":
      return {
        kind: "empty",
        pattern: createEmptyPatternCell()
      };
    case "NonEmpty":
      return {
        kind: "nonempty"
      };
    case "Other":
      return {
        kind: "other"
      };
    case "Negate":
      return {
        kind: "negate"
      };
    case "Ignore":
      return {
        kind: "ignore"
      };
    default:
      return {
        kind: "tile",
        pattern: {
          matchKind: "tile",
          cell,
          ignoreHorizontalFlip: layer.ignoreHorizontalFlip,
          ignoreVerticalFlip: layer.ignoreVerticalFlip,
          ignoreDiagonalFlip: layer.ignoreDiagonalFlip
        }
      };
  }
}

function compileInputLayer(
  componentCoordinates: readonly Coordinate[],
  componentBounds: CoordinateRect,
  layerName: string,
  yesLayers: readonly ParsedInputLayer[],
  noLayers: readonly ParsedInputLayer[],
  options: CompileAutomappingRuleMapOptions
): { layer?: AutomappingCompiledInputLayer; hasIgnore: boolean } {
  const constraints: AutomappingInputConstraint[] = [];
  const usedTilePatterns = componentCoordinates.flatMap((coordinate) =>
    yesLayers.flatMap((layer) => {
      const token = createPatternCell(layer, coordinate.x, coordinate.y, options);
      return token?.kind === "tile" && token.pattern ? [token.pattern] : [];
    })
  );
  let hasIgnore = false;

  for (const coordinate of componentCoordinates) {
    const anyOf: AutomappingPatternCell[] = [];
    const noneOf: AutomappingPatternCell[] = [];
    let negate = false;

    for (const layer of yesLayers) {
      const token = createPatternCell(layer, coordinate.x, coordinate.y, options);

      if (!token) {
        continue;
      }

      switch (token.kind) {
        case "tile":
        case "empty":
          if (token.pattern) {
            anyOf.push(token.pattern);
          }
          break;
        case "nonempty":
          noneOf.push(createEmptyPatternCell());
          break;
        case "other":
          noneOf.push(...usedTilePatterns);
          break;
        case "negate":
          negate = true;
          break;
        case "ignore":
          hasIgnore = true;
          break;
      }
    }

    for (const layer of noLayers) {
      const token = createPatternCell(layer, coordinate.x, coordinate.y, options);

      if (!token) {
        continue;
      }

      switch (token.kind) {
        case "tile":
        case "empty":
          if (token.pattern) {
            noneOf.push(token.pattern);
          }
          break;
        case "nonempty":
          anyOf.push(createEmptyPatternCell());
          break;
        case "other":
          anyOf.push(...usedTilePatterns);
          break;
        case "negate":
          negate = true;
          break;
        case "ignore":
          hasIgnore = true;
          break;
      }
    }

    if (negate) {
      const swappedAnyOf = [...noneOf];
      noneOf.length = 0;
      noneOf.push(...anyOf);
      anyOf.length = 0;
      anyOf.push(...swappedAnyOf);
    }

    if (anyOf.length === 0 && noneOf.length === 0) {
      continue;
    }

    constraints.push({
      x: coordinate.x - componentBounds.x,
      y: coordinate.y - componentBounds.y,
      anyOf,
      noneOf
    });
  }

  if (constraints.length === 0) {
    return {
      hasIgnore
    };
  }

  return {
    layer: {
      layerName,
      constraints
    },
    hasIgnore
  };
}

function compileInputSets(
  inputLayers: readonly ParsedInputLayer[],
  componentCoordinates: readonly Coordinate[],
  componentBounds: CoordinateRect,
  options: CompileAutomappingRuleMapOptions
): AutomappingCompiledInputSet[] {
  const bySet = new Map<string, ParsedInputLayer[]>();

  inputLayers.forEach((layer) => {
    const list = bySet.get(layer.setName) ?? [];
    list.push(layer);
    bySet.set(layer.setName, list);
  });

  const inputSets: AutomappingCompiledInputSet[] = [];

  for (const [setName, setLayers] of bySet) {
    const layerNames = [...new Set(setLayers.map((layer) => layer.targetLayerName))].sort();
    const compiledLayers: AutomappingCompiledInputLayer[] = [];
    let hasIgnore = false;

    for (const layerName of layerNames) {
      const yesLayers = setLayers.filter(
        (layer) => layer.targetLayerName === layerName && layer.kind === "input"
      );
      const noLayers = setLayers.filter(
        (layer) => layer.targetLayerName === layerName && layer.kind === "inputnot"
      );
      const compiledLayer = compileInputLayer(
        componentCoordinates,
        componentBounds,
        layerName,
        yesLayers,
        noLayers,
        options
      );

      if (compiledLayer.layer) {
        compiledLayers.push(compiledLayer.layer);
      }

      hasIgnore = hasIgnore || compiledLayer.hasIgnore;
    }

    if (compiledLayers.length > 0 || hasIgnore) {
      inputSets.push({
        name: setName,
        layers: compiledLayers
      });
    }
  }

  return inputSets;
}

function compileOutputSetLayer(
  layer: ParsedOutputLayer,
  componentCoordinates: readonly Coordinate[],
  componentBounds: CoordinateRect
): AutomappingCompiledOutputLayer | undefined {
  const cells: AutomappingOutputCell[] = [];

  for (const coordinate of componentCoordinates) {
    const cell = getTileLayerCell(layer.layer, coordinate.x, coordinate.y);

    if (!isCellOccupied(cell)) {
      continue;
    }

    cells.push({
      x: coordinate.x - componentBounds.x,
      y: coordinate.y - componentBounds.y,
      cell
    });
  }

  if (cells.length === 0) {
    return undefined;
  }

  return {
    targetLayerName: layer.targetLayerName,
    cells,
    properties: layer.properties.map((property) => clonePropertyDefinition(property))
  };
}

function compileOutputSets(
  outputLayers: readonly ParsedOutputLayer[],
  componentCoordinates: readonly Coordinate[],
  componentBounds: CoordinateRect
): {
  defaultOutput?: AutomappingCompiledOutputSet;
  randomOutputs: AutomappingCompiledOutputSet[];
} {
  const bySet = new Map<string, ParsedOutputLayer[]>();

  outputLayers.forEach((layer) => {
    const list = bySet.get(layer.setName) ?? [];
    list.push(layer);
    bySet.set(layer.setName, list);
  });

  let defaultOutput: AutomappingCompiledOutputSet | undefined;
  const randomOutputs: AutomappingCompiledOutputSet[] = [];

  for (const [setName, setLayers] of bySet) {
    const compiledLayers = setLayers
      .map((layer) => compileOutputSetLayer(layer, componentCoordinates, componentBounds))
      .filter((layer): layer is AutomappingCompiledOutputLayer => layer !== undefined);

    if (compiledLayers.length === 0) {
      continue;
    }

    const probability =
      [...setLayers]
        .reverse()
        .find((layer) => layer.probability !== undefined)
        ?.probability ?? 1;

    const compiledOutputSet: AutomappingCompiledOutputSet = {
      name: setName,
      probability,
      layers: compiledLayers
    };

    if (setName.length === 0) {
      defaultOutput = compiledOutputSet;
      continue;
    }

    randomOutputs.push(compiledOutputSet);
  }

  return {
    ...(defaultOutput !== undefined ? { defaultOutput } : {}),
    randomOutputs
  };
}

function collectRuleCoordinates(
  inputLayers: readonly ParsedInputLayer[],
  outputLayers: readonly ParsedOutputLayer[]
): Set<string> {
  const coordinates = new Set<string>();

  [...inputLayers, ...outputLayers].forEach((layer) => {
    collectOccupiedCoordinates(layer.layer).forEach((key) => {
      coordinates.add(key);
    });
  });

  return coordinates;
}

function compileRuleOptionsForComponent(
  baseOptions: AutomappingRuleOptions,
  componentCoordinates: readonly Coordinate[],
  optionAreas: readonly ParsedRuleOptionsArea[]
): AutomappingRuleOptions {
  let options = {
    ...baseOptions
  };

  for (const area of optionAreas) {
    const containsAllCoordinates = componentCoordinates.every((coordinate) =>
      rectContainsCoordinate(area.rect, coordinate)
    );

    if (!containsAllCoordinates) {
      continue;
    }

    options = mergeRuleOptions(options, area.patch);
  }

  return options;
}

export function compileAutomappingRuleMap(
  ruleMap: EditorMap,
  options: CompileAutomappingRuleMapOptions = {}
): CompiledAutomappingRuleMap {
  const issues: AutomappingEngineIssue[] = [];
  const { options: defaultOptions, matchInOrder } = parseMapRuleOptions(ruleMap, issues);
  const { inputLayers, outputLayers, optionAreas } = parseRuleMapLayers(ruleMap, issues);

  if (inputLayers.length === 0) {
    appendIssue(
      issues,
      "error",
      "ruleMap.layers",
      "automapping.ruleMap.input.missing",
      "No input_* or inputnot_* layers were found in the automapping rule map."
    );
  }

  if (outputLayers.length === 0) {
    appendIssue(
      issues,
      "error",
      "ruleMap.layers",
      "automapping.ruleMap.output.missing",
      "No output_* layers were found in the automapping rule map."
    );
  }

  const occupiedCoordinates = collectRuleCoordinates(inputLayers, outputLayers);
  const components = splitConnectedCoordinates(occupiedCoordinates);
  const rules: AutomappingCompiledRule[] = [];

  components.forEach((componentCoordinates, componentIndex) => {
    const componentBounds = getBoundsFromCoordinates(componentCoordinates);
    const inputSets = compileInputSets(
      inputLayers,
      componentCoordinates,
      componentBounds,
      options
    );

    if (inputSets.length === 0) {
      return;
    }

    const { defaultOutput, randomOutputs } = compileOutputSets(
      outputLayers,
      componentCoordinates,
      componentBounds
    );

    if (!defaultOutput && randomOutputs.length === 0) {
      return;
    }

    rules.push({
      id: `rule-${componentIndex + 1}`,
      x: componentBounds.x,
      y: componentBounds.y,
      width: componentBounds.width,
      height: componentBounds.height,
      inputSets,
      ...(defaultOutput !== undefined ? { defaultOutput } : {}),
      randomOutputs,
      options: compileRuleOptionsForComponent(defaultOptions, componentCoordinates, optionAreas)
    });
  });

  return {
    ruleMapName: ruleMap.name,
    rules,
    inputLayerNames: [...new Set(inputLayers.map((layer) => layer.targetLayerName))].sort(),
    outputLayerNames: [...new Set(outputLayers.map((layer) => layer.targetLayerName))].sort(),
    matchInOrder,
    issues
  };
}

function findTileLayerByName(layers: readonly LayerDefinition[], name: string): TileLayer | undefined {
  for (const layer of layers) {
    if (layer.kind === "group") {
      const nested = findTileLayerByName(layer.layers, name);

      if (nested) {
        return nested;
      }

      continue;
    }

    if (layer.kind === "tile" && layer.name === name) {
      return layer;
    }
  }

  return undefined;
}

function isWithinFiniteMap(map: EditorMap, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < map.settings.width && y < map.settings.height;
}

function resolveTargetCell(
  map: EditorMap,
  layerName: string,
  x: number,
  y: number
): TileCell | undefined {
  if (!map.settings.infinite && !isWithinFiniteMap(map, x, y)) {
    return undefined;
  }

  const layer = findTileLayerByName(map.layers, layerName);

  if (!layer) {
    return createEmptyTileCell();
  }

  return getTileLayerCell(layer, x, y);
}

function patternCellMatches(pattern: AutomappingPatternCell, cell: TileCell): boolean {
  if (pattern.matchKind === "empty") {
    return cell.gid === null;
  }

  return (
    pattern.cell?.gid === cell.gid &&
    (pattern.ignoreHorizontalFlip ||
      pattern.cell?.flipHorizontally === cell.flipHorizontally) &&
    (pattern.ignoreVerticalFlip || pattern.cell?.flipVertically === cell.flipVertically) &&
    (pattern.ignoreDiagonalFlip || pattern.cell?.flipDiagonally === cell.flipDiagonally)
  );
}

function inputLayerMatchesAt(
  map: EditorMap,
  layer: AutomappingCompiledInputLayer,
  originX: number,
  originY: number
): boolean {
  for (const constraint of layer.constraints) {
    const targetCell = resolveTargetCell(
      map,
      layer.layerName,
      originX + constraint.x,
      originY + constraint.y
    );

    if (!targetCell) {
      return false;
    }

    const anyMatch =
      constraint.anyOf.length === 0 ||
      constraint.anyOf.some((pattern) => patternCellMatches(pattern, targetCell));

    if (!anyMatch) {
      return false;
    }

    const noneMatch = constraint.noneOf.some((pattern) => patternCellMatches(pattern, targetCell));

    if (noneMatch) {
      return false;
    }
  }

  return true;
}

function ruleMatchesAt(rule: AutomappingCompiledRule, map: EditorMap, originX: number, originY: number): boolean {
  return rule.inputSets.some((inputSet) =>
    inputSet.layers.every((layer) => inputLayerMatchesAt(map, layer, originX, originY))
  );
}

function positiveModulo(value: number, bound: number): number {
  return ((value % bound) + bound) % bound;
}

function collectCandidateOrigins(
  rule: AutomappingCompiledRule,
  regions: readonly TileLayerBoundsRect[],
  map: EditorMap
): Coordinate[] {
  const candidates = new Set<string>();

  for (const region of regions) {
    const minX = region.x - (rule.width - 1);
    const minY = region.y - (rule.height - 1);
    const maxX = region.x + region.width - 1;
    const maxY = region.y + region.height - 1;

    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        if (positiveModulo(x + rule.options.offsetX, rule.options.modX) !== 0) {
          continue;
        }

        if (positiveModulo(y + rule.options.offsetY, rule.options.modY) !== 0) {
          continue;
        }

        if (
          !map.settings.infinite &&
          (x < 0 ||
            y < 0 ||
            x + rule.width > map.settings.width ||
            y + rule.height > map.settings.height)
        ) {
          continue;
        }

        candidates.add(coordinateKey(x, y));
      }
    }
  }

  return sortCoordinates([...candidates].map((key) => parseCoordinateKey(key)));
}

function chooseRandomOutputSet(
  outputSets: readonly AutomappingCompiledOutputSet[],
  random: () => number
): AutomappingCompiledOutputSet | undefined {
  if (outputSets.length === 0) {
    return undefined;
  }

  const totalWeight = outputSets.reduce((sum, outputSet) => sum + Math.max(0, outputSet.probability), 0);

  if (totalWeight <= 0) {
    return undefined;
  }

  let threshold = Math.max(0, Math.min(0.999999999, random())) * totalWeight;

  for (const outputSet of outputSets) {
    threshold -= Math.max(0, outputSet.probability);

    if (threshold < 0) {
      return outputSet;
    }
  }

  return outputSets[outputSets.length - 1];
}

function upsertLayerProperties(
  properties: readonly PropertyDefinition[],
  patches: readonly PropertyDefinition[]
): PropertyDefinition[] {
  const next = properties.map((property) => clonePropertyDefinition(property));

  for (const patch of patches) {
    const index = next.findIndex((property) => property.name === patch.name);

    if (index >= 0) {
      next[index] = clonePropertyDefinition(patch);
      continue;
    }

    next.push(clonePropertyDefinition(patch));
  }

  return next;
}

function collectDefaultExecutionRegions(map: EditorMap): TileLayerBoundsRect[] {
  if (!map.settings.infinite) {
    return map.settings.width > 0 && map.settings.height > 0
      ? [
          {
            x: 0,
            y: 0,
            width: map.settings.width,
            height: map.settings.height
          }
        ]
      : [];
  }

  const bounds: TileLayerBoundsRect[] = [];

  for (const entry of listLayerEntries(map.layers, "map.layers")) {
    if (entry.layer.kind !== "tile") {
      continue;
    }

    bounds.push(...getTileLayerBounds(entry.layer));
  }

  return bounds;
}

function applyOutputLayer(
  map: EditorMap,
  outputLayer: AutomappingCompiledOutputLayer,
  originX: number,
  originY: number,
  createdLayerIds: LayerId[],
  issues: AutomappingEngineIssue[],
  ruleId: string,
  outputSetName: string,
  ignoreLock: boolean
): EditorMap {
  let nextMap = map;
  let targetLayer = findTileLayerByName(nextMap.layers, outputLayer.targetLayerName);

  if (!targetLayer) {
    const created = addTopLevelTileLayer(nextMap, outputLayer.targetLayerName);
    nextMap = created.map;
    targetLayer = created.layer;
    createdLayerIds.push(created.layer.id);
  }

  if (targetLayer.locked && !ignoreLock) {
    appendIssue(
      issues,
      "warning",
      `rule:${ruleId}`,
      "automapping.output.lockedLayerSkipped",
      `Skipped automapping output for locked layer \`${outputLayer.targetLayerName}\` from set \`${outputSetName || "default"}\`.`
    );
    return nextMap;
  }

  let nextLayer = targetLayer;

  for (const cell of outputLayer.cells) {
    const x = originX + cell.x;
    const y = originY + cell.y;

    if (!nextMap.settings.infinite && !isWithinFiniteMap(nextMap, x, y)) {
      continue;
    }

    nextLayer = setTileLayerCell(nextLayer, x, y, cell.cell);
  }

  if (outputLayer.properties.length > 0) {
    nextLayer = {
      ...nextLayer,
      properties: upsertLayerProperties(nextLayer.properties, outputLayer.properties)
    };
  }

  return updateLayerInMap(nextMap, targetLayer.id, (layer) =>
    layer.kind === "tile" ? nextLayer : layer
  );
}

function applyOutputSet(
  map: EditorMap,
  outputSet: AutomappingCompiledOutputSet,
  originX: number,
  originY: number,
  createdLayerIds: LayerId[],
  issues: AutomappingEngineIssue[],
  ruleId: string,
  ignoreLock: boolean
): EditorMap {
  return outputSet.layers.reduce(
    (nextMap, outputLayer) =>
      applyOutputLayer(
        nextMap,
        outputLayer,
        originX,
        originY,
        createdLayerIds,
        issues,
        ruleId,
        outputSet.name,
        ignoreLock
      ),
    map
  );
}

function shouldApplyRuleMatch(rule: AutomappingCompiledRule, random: () => number): boolean {
  if (rule.options.applyChance >= 1) {
    return true;
  }

  if (rule.options.applyChance <= 0) {
    return false;
  }

  return random() <= rule.options.applyChance;
}

function applyRuleAtOrigin(
  map: EditorMap,
  rule: AutomappingCompiledRule,
  origin: Coordinate,
  createdLayerIds: LayerId[],
  issues: AutomappingEngineIssue[],
  random: () => number
): { map: EditorMap; randomOutputSetName?: string } {
  let nextMap = map;

  if (rule.defaultOutput) {
    nextMap = applyOutputSet(
      nextMap,
      rule.defaultOutput,
      origin.x,
      origin.y,
      createdLayerIds,
      issues,
      rule.id,
      rule.options.ignoreLock
    );
  }

  const randomOutputSet = chooseRandomOutputSet(rule.randomOutputs, random);

  if (randomOutputSet) {
    nextMap = applyOutputSet(
      nextMap,
      randomOutputSet,
      origin.x,
      origin.y,
      createdLayerIds,
      issues,
      rule.id,
      rule.options.ignoreLock
    );
  }

  return {
    map: nextMap,
    ...(randomOutputSet !== undefined ? { randomOutputSetName: randomOutputSet.name } : {})
  };
}

function collectRuleMatches(
  rule: AutomappingCompiledRule,
  map: EditorMap,
  regions: readonly TileLayerBoundsRect[]
): Coordinate[] {
  const origins = collectCandidateOrigins(rule, regions, map);

  return origins.filter((origin) => ruleMatchesAt(rule, map, origin.x, origin.y));
}

export function executeAutomappingRuleMap(
  targetMap: EditorMap,
  compiled: CompiledAutomappingRuleMap,
  options: ExecuteAutomappingOptions = {}
): ExecutedAutomappingRuleMap {
  const issues = [...compiled.issues];
  const matches: AppliedAutomappingRuleMatch[] = [];
  const createdLayerIds: LayerId[] = [];
  const regions = options.region ?? collectDefaultExecutionRegions(targetMap);
  const random = options.random ?? Math.random;

  if (regions.length === 0) {
    return {
      map: targetMap,
      matches,
      createdLayerIds,
      issues
    };
  }

  let nextMap = targetMap;

  if (compiled.matchInOrder) {
    for (const rule of compiled.rules) {
      if (rule.options.disabled) {
        continue;
      }

      for (const origin of collectCandidateOrigins(rule, regions, nextMap)) {
        if (!ruleMatchesAt(rule, nextMap, origin.x, origin.y)) {
          continue;
        }

        if (!shouldApplyRuleMatch(rule, random)) {
          continue;
        }

        const applied = applyRuleAtOrigin(
          nextMap,
          rule,
          origin,
          createdLayerIds,
          issues,
          random
        );
        nextMap = applied.map;
        matches.push({
          ruleId: rule.id,
          x: origin.x,
          y: origin.y,
          ...(applied.randomOutputSetName !== undefined
            ? { randomOutputSetName: applied.randomOutputSetName }
            : {})
        });
      }
    }
  } else {
    for (const rule of compiled.rules) {
      if (rule.options.disabled) {
        continue;
      }

      const ruleMatches = collectRuleMatches(rule, targetMap, regions);

      for (const origin of ruleMatches) {
        if (!shouldApplyRuleMatch(rule, random)) {
          continue;
        }

        const applied = applyRuleAtOrigin(
          nextMap,
          rule,
          origin,
          createdLayerIds,
          issues,
          random
        );
        nextMap = applied.map;
        matches.push({
          ruleId: rule.id,
          x: origin.x,
          y: origin.y,
          ...(applied.randomOutputSetName !== undefined
            ? { randomOutputSetName: applied.randomOutputSetName }
            : {})
        });
      }
    }
  }

  return {
    map: nextMap,
    matches,
    createdLayerIds,
    issues
  };
}

export function runAutomappingRuleMap(
  ruleMap: EditorMap,
  targetMap: EditorMap,
  options: RunAutomappingRuleMapOptions = {}
): ExecutedAutomappingRuleMap {
  return executeAutomappingRuleMap(
    targetMap,
    compileAutomappingRuleMap(ruleMap, options),
    options
  );
}
