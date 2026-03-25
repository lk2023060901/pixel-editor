export type EntityId<TKind extends string> = string & {
  readonly __kind: TKind;
};

function createSeed(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createEntityId<TKind extends string>(
  kind: TKind,
  source: string = createSeed()
): EntityId<TKind> {
  return `${kind}_${source}` as EntityId<TKind>;
}

export type MapId = EntityId<"map">;
export type LayerId = EntityId<"layer">;
export type TilesetId = EntityId<"tileset">;
export type TileId = EntityId<"tile">;
export type ObjectId = EntityId<"object">;
export type WangSetId = EntityId<"wangSet">;
export type TemplateId = EntityId<"template">;
export type ProjectId = EntityId<"project">;
export type WorldId = EntityId<"world">;
export type PropertyTypeId = EntityId<"propertyType">;
