"use client";

import type { EditorController } from "@pixel-editor/app-services";
import type {
  EditorMap,
  LayerDefinition,
  MapObject,
  ObjectLayer,
  PropertyTypeDefinition
} from "@pixel-editor/domain";
import { useI18n } from "@pixel-editor/i18n/client";
import { startTransition, useEffect, useState } from "react";

import {
  getLayerKindLabel,
  getObjectDrawOrderLabel,
  getObjectShapeLabel,
  getOrientationLabel,
  getRenderOrderLabel
} from "./i18n-helpers";
import { CustomPropertiesEditor } from "./custom-properties-editor";
import { buildObjectReferenceOptions } from "./object-reference-options";
import { Panel } from "./panel";
import {
  PropertyBrowserCheckboxRow,
  PropertyBrowserContent,
  PropertyBrowserGroup,
  PropertyBrowserReadOnlyRow,
  PropertyBrowserSelectRow,
  PropertyBrowserTextRow
} from "./property-browser";

interface MapDraft {
  name: string;
  orientation: EditorMap["settings"]["orientation"];
  renderOrder: EditorMap["settings"]["renderOrder"];
  width: string;
  height: string;
  tileWidth: string;
  tileHeight: string;
  infinite: boolean;
  backgroundColor: string;
}

interface LayerDraft {
  name: string;
  className: string;
  visible: boolean;
  locked: boolean;
  opacity: string;
  offsetX: string;
  offsetY: string;
  drawOrder: ObjectLayer["drawOrder"];
}

interface ObjectDraft {
  name: string;
  className: string;
  x: string;
  y: string;
  width: string;
  height: string;
  rotation: string;
  visible: boolean;
}

const orientationOptions: Array<EditorMap["settings"]["orientation"]> = [
  "orthogonal",
  "isometric",
  "staggered",
  "hexagonal",
  "oblique"
];

const renderOrderOptions: Array<EditorMap["settings"]["renderOrder"]> = [
  "right-down",
  "right-up",
  "left-down",
  "left-up"
];

const objectDrawOrderOptions: Array<ObjectLayer["drawOrder"]> = [
  "topdown",
  "index"
];

function createMapDraft(map?: EditorMap): MapDraft {
  return {
    name: map?.name ?? "",
    orientation: map?.settings.orientation ?? "orthogonal",
    renderOrder: map?.settings.renderOrder ?? "right-down",
    width: String(map?.settings.width || 64),
    height: String(map?.settings.height || 64),
    tileWidth: String(map?.settings.tileWidth ?? 32),
    tileHeight: String(map?.settings.tileHeight ?? 32),
    infinite: map?.settings.infinite ?? false,
    backgroundColor: map?.settings.backgroundColor ?? ""
  };
}

function createLayerDraft(layer?: LayerDefinition): LayerDraft {
  return {
    name: layer?.name ?? "",
    className: layer?.className ?? "",
    visible: layer?.visible ?? true,
    locked: layer?.locked ?? false,
    opacity: String(layer?.opacity ?? 1),
    offsetX: String(layer?.offsetX ?? 0),
    offsetY: String(layer?.offsetY ?? 0),
    drawOrder: layer?.kind === "object" ? layer.drawOrder : "topdown"
  };
}

function createObjectDraft(object?: MapObject): ObjectDraft {
  return {
    name: object?.name ?? "",
    className: object?.className ?? "",
    x: String(object?.x ?? 0),
    y: String(object?.y ?? 0),
    width: String(object?.width ?? 0),
    height: String(object?.height ?? 0),
    rotation: String(object?.rotation ?? 0),
    visible: object?.visible ?? true
  };
}

export interface PropertiesInspectorProps {
  activeMap: EditorMap | undefined;
  activeLayer: LayerDefinition | undefined;
  activeObject: MapObject | undefined;
  propertyTypes: readonly PropertyTypeDefinition[] | undefined;
  store: EditorController;
  embedded?: boolean;
}

function PropertiesInspectorContent({
  activeMap,
  activeLayer,
  activeObject,
  propertyTypes,
  store
}: Omit<PropertiesInspectorProps, "embedded">) {
  const { t } = useI18n();
  const [mapDraft, setMapDraft] = useState(() => createMapDraft(activeMap));
  const [layerDraft, setLayerDraft] = useState(() => createLayerDraft(activeLayer));
  const [objectDraft, setObjectDraft] = useState(() => createObjectDraft(activeObject));
  const objectReferenceOptions = buildObjectReferenceOptions(activeMap);

  useEffect(() => {
    setMapDraft(createMapDraft(activeMap));
  }, [activeMap]);

  useEffect(() => {
    setLayerDraft(createLayerDraft(activeLayer));
  }, [activeLayer]);

  useEffect(() => {
    setObjectDraft(createObjectDraft(activeObject));
  }, [activeObject]);

  if (!activeMap) {
    return <p className="px-3 py-3 text-sm text-slate-400">{t("mapProperties.noActiveMap")}</p>;
  }

  function applyMapDraft(nextDraft: MapDraft = mapDraft): void {
    if (!activeMap) {
      return;
    }

    const width = Number.parseInt(nextDraft.width, 10);
    const height = Number.parseInt(nextDraft.height, 10);
    const tileWidth = Number.parseInt(nextDraft.tileWidth, 10);
    const tileHeight = Number.parseInt(nextDraft.tileHeight, 10);

    if (
      Number.isNaN(tileWidth) ||
      Number.isNaN(tileHeight) ||
      (!nextDraft.infinite && (Number.isNaN(width) || Number.isNaN(height)))
    ) {
      setMapDraft(createMapDraft(activeMap));
      return;
    }

    startTransition(() => {
      store.updateActiveMapDetails({
        name: nextDraft.name.trim() || activeMap.name,
        orientation: nextDraft.orientation,
        renderOrder: nextDraft.renderOrder,
        tileWidth,
        tileHeight,
        infinite: nextDraft.infinite,
        ...(nextDraft.infinite ? {} : { width, height }),
        ...(nextDraft.backgroundColor.trim()
          ? { backgroundColor: nextDraft.backgroundColor.trim() }
          : {})
      });
    });
  }

  function applyLayerDraft(nextDraft: LayerDraft = layerDraft): void {
    if (!activeLayer) {
      return;
    }

    const opacity = Number.parseFloat(nextDraft.opacity);
    const offsetX = Number.parseFloat(nextDraft.offsetX);
    const offsetY = Number.parseFloat(nextDraft.offsetY);

    if (Number.isNaN(opacity) || Number.isNaN(offsetX) || Number.isNaN(offsetY)) {
      setLayerDraft(createLayerDraft(activeLayer));
      return;
    }

    startTransition(() => {
      store.updateActiveLayerDetails({
        name: nextDraft.name.trim() || activeLayer.name,
        className: nextDraft.className,
        visible: nextDraft.visible,
        locked: nextDraft.locked,
        opacity: Math.max(0, Math.min(opacity, 1)),
        offsetX,
        offsetY,
        ...(activeLayer.kind === "object" ? { drawOrder: nextDraft.drawOrder } : {})
      });
    });
  }

  function applyObjectDraft(nextDraft: ObjectDraft = objectDraft): void {
    if (!activeObject) {
      return;
    }

    const x = Number.parseFloat(nextDraft.x);
    const y = Number.parseFloat(nextDraft.y);
    const width = Number.parseFloat(nextDraft.width);
    const height = Number.parseFloat(nextDraft.height);
    const rotation = Number.parseFloat(nextDraft.rotation);

    if (
      Number.isNaN(x) ||
      Number.isNaN(y) ||
      Number.isNaN(width) ||
      Number.isNaN(height) ||
      Number.isNaN(rotation)
    ) {
      setObjectDraft(createObjectDraft(activeObject));
      return;
    }

    startTransition(() => {
      store.updateSelectedObjectDetails({
        name: nextDraft.name.trim() || activeObject.name,
        className: nextDraft.className,
        x,
        y,
        width,
        height,
        rotation,
        visible: nextDraft.visible
      });
    });
  }

  return (
    <PropertyBrowserContent>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <PropertyBrowserGroup title={t("propertiesInspector.mapSection")}>
          <PropertyBrowserTextRow
            label={t("common.name")}
            value={mapDraft.name}
            onCommit={() => {
              applyMapDraft();
            }}
            onChange={(value) => {
              setMapDraft((current) => ({ ...current, name: value }));
            }}
          />
          <PropertyBrowserSelectRow
            label={t("mapProperties.orientation")}
            options={orientationOptions.map((orientation) => ({
              value: orientation,
              label: getOrientationLabel(orientation, t)
            }))}
            value={mapDraft.orientation}
            onChange={(value) => {
              const nextDraft = {
                ...mapDraft,
                orientation: value as EditorMap["settings"]["orientation"]
              };
              setMapDraft(nextDraft);
              applyMapDraft(nextDraft);
            }}
          />
          <PropertyBrowserSelectRow
            label={t("mapProperties.renderOrder")}
            options={renderOrderOptions.map((renderOrder) => ({
              value: renderOrder,
              label: getRenderOrderLabel(renderOrder, t)
            }))}
            value={mapDraft.renderOrder}
            onChange={(value) => {
              const nextDraft = {
                ...mapDraft,
                renderOrder: value as EditorMap["settings"]["renderOrder"]
              };
              setMapDraft(nextDraft);
              applyMapDraft(nextDraft);
            }}
          />
          <PropertyBrowserTextRow
            disabled={mapDraft.infinite}
            label={t("common.width")}
            type="number"
            value={mapDraft.width}
            onCommit={() => {
              applyMapDraft();
            }}
            onChange={(value) => {
              setMapDraft((current) => ({ ...current, width: value }));
            }}
          />
          <PropertyBrowserTextRow
            disabled={mapDraft.infinite}
            label={t("common.height")}
            type="number"
            value={mapDraft.height}
            onCommit={() => {
              applyMapDraft();
            }}
            onChange={(value) => {
              setMapDraft((current) => ({ ...current, height: value }));
            }}
          />
          <PropertyBrowserTextRow
            label={t("mapProperties.tileWidthShort")}
            type="number"
            value={mapDraft.tileWidth}
            onCommit={() => {
              applyMapDraft();
            }}
            onChange={(value) => {
              setMapDraft((current) => ({ ...current, tileWidth: value }));
            }}
          />
          <PropertyBrowserTextRow
            label={t("mapProperties.tileHeightShort")}
            type="number"
            value={mapDraft.tileHeight}
            onCommit={() => {
              applyMapDraft();
            }}
            onChange={(value) => {
              setMapDraft((current) => ({ ...current, tileHeight: value }));
            }}
          />
          <PropertyBrowserTextRow
            label={t("common.color")}
            value={mapDraft.backgroundColor}
            onCommit={() => {
              applyMapDraft();
            }}
            onChange={(value) => {
              setMapDraft((current) => ({ ...current, backgroundColor: value }));
            }}
          />
          <PropertyBrowserCheckboxRow
            checked={mapDraft.infinite}
            label={t("common.infinite")}
            onChange={(checked) => {
              const nextDraft = { ...mapDraft, infinite: checked };
              setMapDraft(nextDraft);
              applyMapDraft(nextDraft);
            }}
          />
          <div className="border-t border-slate-700 p-0">
            <CustomPropertiesEditor
              className="bg-slate-950"
              properties={activeMap.properties}
              objectReferenceOptions={objectReferenceOptions}
              propertyTypes={propertyTypes}
              onRemove={(propertyName) => {
                store.removeActiveMapProperty(propertyName);
              }}
              onUpsert={(property, previousName) => {
                store.upsertActiveMapProperty(property, previousName);
              }}
              showHint={false}
            />
          </div>
        </PropertyBrowserGroup>

        {activeLayer ? (
          <PropertyBrowserGroup title={t("propertiesInspector.layerSection")}>
            <PropertyBrowserTextRow
              label={t("common.name")}
              value={layerDraft.name}
              onCommit={() => {
                applyLayerDraft();
              }}
              onChange={(value) => {
                setLayerDraft((current) => ({ ...current, name: value }));
              }}
            />
            <PropertyBrowserTextRow
              label={t("common.className")}
              value={layerDraft.className}
              onCommit={() => {
                applyLayerDraft();
              }}
              onChange={(value) => {
                setLayerDraft((current) => ({ ...current, className: value }));
              }}
            />
            <PropertyBrowserReadOnlyRow
              label={t("common.kind")}
              value={getLayerKindLabel(activeLayer.kind, t)}
            />
            <PropertyBrowserCheckboxRow
              checked={layerDraft.visible}
              label={t("common.visible")}
              onChange={(checked) => {
                const nextDraft = { ...layerDraft, visible: checked };
                setLayerDraft(nextDraft);
                applyLayerDraft(nextDraft);
              }}
            />
            <PropertyBrowserCheckboxRow
              checked={layerDraft.locked}
              label={t("common.locked")}
              onChange={(checked) => {
                const nextDraft = { ...layerDraft, locked: checked };
                setLayerDraft(nextDraft);
                applyLayerDraft(nextDraft);
              }}
            />
            <PropertyBrowserTextRow
              label={t("common.opacity")}
              type="number"
              value={layerDraft.opacity}
              onCommit={() => {
                applyLayerDraft();
              }}
              onChange={(value) => {
                setLayerDraft((current) => ({ ...current, opacity: value }));
              }}
            />
            <PropertyBrowserTextRow
              label={t("propertiesInspector.offsetX")}
              type="number"
              value={layerDraft.offsetX}
              onCommit={() => {
                applyLayerDraft();
              }}
              onChange={(value) => {
                setLayerDraft((current) => ({ ...current, offsetX: value }));
              }}
            />
            <PropertyBrowserTextRow
              label={t("propertiesInspector.offsetY")}
              type="number"
              value={layerDraft.offsetY}
              onCommit={() => {
                applyLayerDraft();
              }}
              onChange={(value) => {
                setLayerDraft((current) => ({ ...current, offsetY: value }));
              }}
            />
            {activeLayer.kind === "object" ? (
              <PropertyBrowserSelectRow
                label={t("propertiesInspector.drawOrder")}
                options={objectDrawOrderOptions.map((drawOrder) => ({
                  value: drawOrder,
                  label: getObjectDrawOrderLabel(drawOrder, t)
                }))}
                value={layerDraft.drawOrder}
                onChange={(value) => {
                  const nextDraft = {
                    ...layerDraft,
                    drawOrder: value as ObjectLayer["drawOrder"]
                  };
                  setLayerDraft(nextDraft);
                  applyLayerDraft(nextDraft);
                }}
              />
            ) : null}
            <div className="border-t border-slate-700 p-0">
              <CustomPropertiesEditor
                className="bg-slate-950"
                properties={activeLayer.properties}
                objectReferenceOptions={objectReferenceOptions}
                propertyTypes={propertyTypes}
                onRemove={(propertyName) => {
                  store.removeActiveLayerProperty(propertyName);
                }}
                onUpsert={(property, previousName) => {
                  store.upsertActiveLayerProperty(property, previousName);
                }}
                showHint={false}
              />
            </div>
          </PropertyBrowserGroup>
        ) : null}

        {activeObject ? (
          <PropertyBrowserGroup title={t("propertiesInspector.objectSection")}>
            <PropertyBrowserTextRow
              label={t("common.name")}
              value={objectDraft.name}
              onCommit={() => {
                applyObjectDraft();
              }}
              onChange={(value) => {
                setObjectDraft((current) => ({ ...current, name: value }));
              }}
            />
            <PropertyBrowserTextRow
              label={t("common.className")}
              value={objectDraft.className}
              onCommit={() => {
                applyObjectDraft();
              }}
              onChange={(value) => {
                setObjectDraft((current) => ({ ...current, className: value }));
              }}
            />
            <PropertyBrowserReadOnlyRow
              label={t("common.kind")}
              value={getObjectShapeLabel(activeObject.shape, t)}
            />
            <PropertyBrowserTextRow
              label={t("common.x")}
              type="number"
              value={objectDraft.x}
              onCommit={() => {
                applyObjectDraft();
              }}
              onChange={(value) => {
                setObjectDraft((current) => ({ ...current, x: value }));
              }}
            />
            <PropertyBrowserTextRow
              label={t("common.y")}
              type="number"
              value={objectDraft.y}
              onCommit={() => {
                applyObjectDraft();
              }}
              onChange={(value) => {
                setObjectDraft((current) => ({ ...current, y: value }));
              }}
            />
            <PropertyBrowserTextRow
              label={t("common.width")}
              type="number"
              value={objectDraft.width}
              onCommit={() => {
                applyObjectDraft();
              }}
              onChange={(value) => {
                setObjectDraft((current) => ({ ...current, width: value }));
              }}
            />
            <PropertyBrowserTextRow
              label={t("common.height")}
              type="number"
              value={objectDraft.height}
              onCommit={() => {
                applyObjectDraft();
              }}
              onChange={(value) => {
                setObjectDraft((current) => ({ ...current, height: value }));
              }}
            />
            <PropertyBrowserTextRow
              label={t("common.rotation")}
              type="number"
              value={objectDraft.rotation}
              onCommit={() => {
                applyObjectDraft();
              }}
              onChange={(value) => {
                setObjectDraft((current) => ({ ...current, rotation: value }));
              }}
            />
            <PropertyBrowserCheckboxRow
              checked={objectDraft.visible}
              label={t("common.visible")}
              onChange={(checked) => {
                const nextDraft = { ...objectDraft, visible: checked };
                setObjectDraft(nextDraft);
                applyObjectDraft(nextDraft);
              }}
            />
            <div className="border-t border-slate-700 p-0">
              <CustomPropertiesEditor
                className="bg-slate-950"
                properties={activeObject.properties}
                objectReferenceOptions={objectReferenceOptions}
                propertyTypes={propertyTypes}
                onRemove={(propertyName) => {
                  store.removeSelectedObjectProperty(propertyName);
                }}
                onUpsert={(property, previousName) => {
                  store.upsertSelectedObjectProperty(property, previousName);
                }}
                showHint={false}
              />
            </div>
          </PropertyBrowserGroup>
        ) : null}
      </div>
    </PropertyBrowserContent>
  );
}

export function PropertiesInspector({
  embedded = false,
  ...props
}: PropertiesInspectorProps) {
  const { t } = useI18n();
  const content = <PropertiesInspectorContent {...props} />;

  if (embedded) {
    return content;
  }

  return <Panel title={t("shell.dock.properties")}>{content}</Panel>;
}
