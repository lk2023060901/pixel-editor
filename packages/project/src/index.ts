import {
  createHistoryCommand,
  type HistoryCommand
} from "@pixel-editor/command-engine";
import {
  cloneClassPropertyFieldDefinition,
  clonePropertyDefinition,
  clonePropertyTypeDefinition,
  type ClassPropertyFieldDefinition,
  type EditorMap,
  type EditorProject,
  type EditorProjectExportOptions,
  type EditorWorld,
  type GroupLayer,
  type LayerDefinition,
  type MapObject,
  type ObjectLayer,
  type ObjectTemplate,
  type PropertyDefinition,
  type PropertyTypeDefinition,
  type UpdateProjectDetailsInput,
  type TilesetDefinition
} from "@pixel-editor/domain";
import type { EditorWorkspaceState } from "@pixel-editor/editor-state";

function buildPropertyTypeRenameMap(
  previousPropertyTypes: readonly PropertyTypeDefinition[],
  nextPropertyTypes: readonly PropertyTypeDefinition[]
): ReadonlyMap<string, string> {
  const nextPropertyTypesById = new Map(
    nextPropertyTypes.map((propertyType) => [propertyType.id, propertyType])
  );
  const renameEntries = previousPropertyTypes.flatMap((propertyType) => {
    const nextPropertyType = nextPropertyTypesById.get(propertyType.id);

    if (!nextPropertyType || nextPropertyType.name === propertyType.name) {
      return [];
    }

    return [[propertyType.name, nextPropertyType.name] as const];
  });

  return new Map(renameEntries);
}

function remapPropertyTypeName(
  propertyTypeName: string | undefined,
  renameMap: ReadonlyMap<string, string>
): string | undefined {
  if (!propertyTypeName) {
    return undefined;
  }

  return renameMap.get(propertyTypeName) ?? propertyTypeName;
}

function remapClassName(
  className: string | undefined,
  renameMap: ReadonlyMap<string, string>
): string | undefined {
  if (!className) {
    return undefined;
  }

  return renameMap.get(className) ?? className;
}

function withOptionalClassName<T extends { className?: string }>(
  value: Omit<T, "className">,
  className: string | undefined
): T {
  return {
    ...value,
    ...(className !== undefined ? { className } : {})
  } as T;
}

function remapPropertyDefinition(
  property: PropertyDefinition,
  renameMap: ReadonlyMap<string, string>
): PropertyDefinition {
  const nextProperty = clonePropertyDefinition(property);
  const nextPropertyTypeName = remapPropertyTypeName(property.propertyTypeName, renameMap);

  if (nextPropertyTypeName !== undefined) {
    nextProperty.propertyTypeName = nextPropertyTypeName;
  } else {
    delete nextProperty.propertyTypeName;
  }

  return nextProperty;
}

function remapPropertyDefinitions(
  properties: readonly PropertyDefinition[],
  renameMap: ReadonlyMap<string, string>
): PropertyDefinition[] {
  return properties.map((property) => remapPropertyDefinition(property, renameMap));
}

function remapClassPropertyFieldDefinition(
  field: ClassPropertyFieldDefinition,
  renameMap: ReadonlyMap<string, string>
): ClassPropertyFieldDefinition {
  const nextField = cloneClassPropertyFieldDefinition(field);
  const nextPropertyTypeName = remapPropertyTypeName(field.propertyTypeName, renameMap);

  if (nextPropertyTypeName !== undefined) {
    nextField.propertyTypeName = nextPropertyTypeName;
  } else {
    delete nextField.propertyTypeName;
  }

  return nextField;
}

function remapPropertyTypeDefinition(
  propertyType: PropertyTypeDefinition,
  renameMap: ReadonlyMap<string, string>
): PropertyTypeDefinition {
  const nextPropertyType = clonePropertyTypeDefinition(propertyType);
  const nextName = remapPropertyTypeName(propertyType.name, renameMap);

  if (nextName !== undefined) {
    nextPropertyType.name = nextName;
  }

  if (nextPropertyType.kind === "class") {
    nextPropertyType.fields = nextPropertyType.fields.map((field) =>
      remapClassPropertyFieldDefinition(field, renameMap)
    );
  }

  return nextPropertyType;
}

function remapMapObject(
  object: MapObject,
  renameMap: ReadonlyMap<string, string>
): MapObject {
  return withOptionalClassName<MapObject>({
    ...object,
    properties: remapPropertyDefinitions(object.properties, renameMap)
  }, remapClassName(object.className, renameMap));
}

function remapObjectLayer(
  layer: ObjectLayer,
  renameMap: ReadonlyMap<string, string>
): ObjectLayer {
  return withOptionalClassName<ObjectLayer>({
    ...layer,
    properties: remapPropertyDefinitions(layer.properties, renameMap),
    objects: layer.objects.map((object) => remapMapObject(object, renameMap))
  }, remapClassName(layer.className, renameMap));
}

function remapLayer(
  layer: LayerDefinition,
  renameMap: ReadonlyMap<string, string>
): LayerDefinition {
  if (layer.kind === "group") {
    const groupLayer = withOptionalClassName<GroupLayer>({
      ...layer,
      properties: remapPropertyDefinitions(layer.properties, renameMap),
      layers: layer.layers.map((childLayer) => remapLayer(childLayer, renameMap))
    }, remapClassName(layer.className, renameMap));

    return groupLayer;
  }

  if (layer.kind === "object") {
    return remapObjectLayer(layer, renameMap);
  }

  return withOptionalClassName<Exclude<LayerDefinition, GroupLayer | ObjectLayer>>({
    ...layer,
    properties: remapPropertyDefinitions(layer.properties, renameMap)
  }, remapClassName(layer.className, renameMap));
}

function remapMap(
  map: EditorMap,
  renameMap: ReadonlyMap<string, string>
): EditorMap {
  return {
    ...map,
    properties: remapPropertyDefinitions(map.properties, renameMap),
    layers: map.layers.map((layer) => remapLayer(layer, renameMap))
  };
}

function remapCollisionLayer(
  layer: ObjectLayer | undefined,
  renameMap: ReadonlyMap<string, string>
): ObjectLayer | undefined {
  if (!layer) {
    return undefined;
  }

  return remapObjectLayer(layer, renameMap);
}

function remapTileset(
  tileset: TilesetDefinition,
  renameMap: ReadonlyMap<string, string>
): TilesetDefinition {
  return {
    ...tileset,
    properties: remapPropertyDefinitions(tileset.properties, renameMap),
    tiles: tileset.tiles.map((tile) => {
      const nextCollisionLayer = remapCollisionLayer(tile.collisionLayer, renameMap);

      return withOptionalClassName<typeof tile>({
        ...tile,
        properties: remapPropertyDefinitions(tile.properties, renameMap),
        ...(nextCollisionLayer !== undefined ? { collisionLayer: nextCollisionLayer } : {})
      }, remapClassName(tile.className, renameMap));
    })
  };
}

function remapTemplate(
  template: ObjectTemplate,
  renameMap: ReadonlyMap<string, string>
): ObjectTemplate {
  return {
    ...template,
    object: remapMapObject(template.object, renameMap)
  };
}

function remapWorld(
  world: EditorWorld,
  renameMap: ReadonlyMap<string, string>
): EditorWorld {
  return {
    ...world,
    properties: remapPropertyDefinitions(world.properties, renameMap)
  };
}

export function replaceProjectCommand(
  project: EditorProject
): HistoryCommand<EditorWorkspaceState> {
  return createHistoryCommand({
    id: "project.replace",
    description: `Replace project metadata with ${project.name}`,
    run: (state) => ({
      ...state,
      project,
      session: {
        ...state.session,
        hasUnsavedChanges: true
      }
    })
  });
}

function mergeProjectExportOptions(
  currentExportOptions: EditorProjectExportOptions,
  nextExportOptions: Partial<EditorProjectExportOptions> | undefined
): EditorProjectExportOptions {
  if (!nextExportOptions) {
    return { ...currentExportOptions };
  }

  return {
    ...currentExportOptions,
    ...nextExportOptions
  };
}

export function updateProjectDetailsCommand(
  input: UpdateProjectDetailsInput
): HistoryCommand<EditorWorkspaceState> {
  return createHistoryCommand({
    id: "project.details.update",
    description: "Update project details",
    run: (state) => {
      const nextProject: EditorProject = {
        ...state.project,
        compatibilityVersion: input.compatibilityVersion ?? state.project.compatibilityVersion,
        extensionsDirectory: input.extensionsDirectory ?? state.project.extensionsDirectory,
        exportOptions: mergeProjectExportOptions(
          state.project.exportOptions,
          input.exportOptions
        )
      };

      if (input.automappingRulesFile !== undefined) {
        const nextAutomappingRulesFile = input.automappingRulesFile?.trim();

        if (nextAutomappingRulesFile) {
          nextProject.automappingRulesFile = nextAutomappingRulesFile;
        } else {
          delete nextProject.automappingRulesFile;
        }
      }

      return {
        ...state,
        project: nextProject,
        session: {
          ...state.session,
          hasUnsavedChanges: true
        }
      };
    }
  });
}

export function replaceProjectPropertyTypesCommand(
  propertyTypes: readonly PropertyTypeDefinition[]
): HistoryCommand<EditorWorkspaceState> {
  return createHistoryCommand({
    id: "project.propertyTypes.replace",
    description: "Replace project property types",
    run: (state) => {
      const renameMap = buildPropertyTypeRenameMap(
        state.project.propertyTypes,
        propertyTypes
      );
      const nextPropertyTypes = propertyTypes.map((propertyType) =>
        remapPropertyTypeDefinition(propertyType, renameMap)
      );

      return {
        ...state,
        project: {
          ...state.project,
          propertyTypes: nextPropertyTypes
        },
        maps: state.maps.map((map) => remapMap(map, renameMap)),
        tilesets: state.tilesets.map((tileset) => remapTileset(tileset, renameMap)),
        templates: state.templates.map((template) => remapTemplate(template, renameMap)),
        worlds: state.worlds.map((world) => remapWorld(world, renameMap)),
        session: {
          ...state.session,
          hasUnsavedChanges: true
        }
      };
    }
  });
}
