"use client";

import type { EditorController } from "@pixel-editor/app-services/ui";
import {
  type PropertiesInspectorViewState
} from "@pixel-editor/app-services/ui";
import { useI18n } from "@pixel-editor/i18n/client";
import { startTransition, useEffect, useState } from "react";

import {
  getBlendModeLabel,
  getLayerKindLabel,
  getObjectDrawOrderLabel,
  getObjectShapeLabel,
  getOrientationLabel,
  getRenderOrderLabel
} from "./i18n-helpers";
import { CustomPropertiesEditor } from "./custom-properties-editor";
import { Panel } from "./panel";
import {
  PropertyBrowserCheckboxRow,
  PropertyBrowserContent,
  PropertyBrowserGroup,
  PropertyBrowserReadOnlyRow,
  PropertyBrowserSelectRow,
  PropertyBrowserTextRow
} from "./property-browser";

type InspectorMapViewState = NonNullable<PropertiesInspectorViewState["map"]>;
type InspectorLayerViewState = NonNullable<PropertiesInspectorViewState["layer"]>;
type InspectorObjectViewState = NonNullable<PropertiesInspectorViewState["object"]>;
type BlendMode = Exclude<InspectorLayerViewState["blendMode"], undefined>;
type ObjectLayerDrawOrder = Exclude<InspectorLayerViewState["drawOrder"], undefined>;

interface MapDraft {
  name: string;
  orientation: InspectorMapViewState["orientation"];
  renderOrder: InspectorMapViewState["renderOrder"];
  width: string;
  height: string;
  tileWidth: string;
  tileHeight: string;
  parallaxOriginX: string;
  parallaxOriginY: string;
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
  parallaxX: string;
  parallaxY: string;
  tintColor: string;
  blendMode: BlendMode;
  drawOrder: ObjectLayerDrawOrder;
  imagePath: string;
  repeatX: boolean;
  repeatY: boolean;
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

const orientationOptions: Array<InspectorMapViewState["orientation"]> = [
  "orthogonal",
  "isometric",
  "staggered",
  "hexagonal",
  "oblique"
];

const renderOrderOptions: Array<InspectorMapViewState["renderOrder"]> = [
  "right-down",
  "right-up",
  "left-down",
  "left-up"
];

const objectDrawOrderOptions: ObjectLayerDrawOrder[] = [
  "topdown",
  "index"
];

const blendModeOptions: BlendMode[] = [
  "normal",
  "add",
  "multiply",
  "screen",
  "overlay",
  "darken",
  "lighten",
  "color-dodge",
  "color-burn",
  "hard-light",
  "soft-light",
  "difference",
  "exclusion"
];

function createMapDraft(map?: InspectorMapViewState): MapDraft {
  return {
    name: map?.name ?? "",
    orientation: map?.orientation ?? "orthogonal",
    renderOrder: map?.renderOrder ?? "right-down",
    width: String(map?.width || 64),
    height: String(map?.height || 64),
    tileWidth: String(map?.tileWidth ?? 32),
    tileHeight: String(map?.tileHeight ?? 32),
    parallaxOriginX: String(map?.parallaxOriginX ?? 0),
    parallaxOriginY: String(map?.parallaxOriginY ?? 0),
    infinite: map?.infinite ?? false,
    backgroundColor: map?.backgroundColor ?? ""
  };
}

function createLayerDraft(layer?: InspectorLayerViewState): LayerDraft {
  return {
    name: layer?.name ?? "",
    className: layer?.className ?? "",
    visible: layer?.visible ?? true,
    locked: layer?.locked ?? false,
    opacity: String(layer?.opacity ?? 1),
    offsetX: String(layer?.offsetX ?? 0),
    offsetY: String(layer?.offsetY ?? 0),
    parallaxX: String(layer?.parallaxX ?? 1),
    parallaxY: String(layer?.parallaxY ?? 1),
    tintColor: layer?.tintColor ?? "",
    blendMode: layer?.blendMode ?? "normal",
    drawOrder: layer?.kind === "object" ? (layer.drawOrder ?? "topdown") : "topdown",
    imagePath: layer?.kind === "image" ? (layer.imagePath ?? "") : "",
    repeatX: layer?.kind === "image" ? (layer.repeatX ?? false) : false,
    repeatY: layer?.kind === "image" ? (layer.repeatY ?? false) : false
  };
}

function createObjectDraft(object?: InspectorObjectViewState): ObjectDraft {
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
  viewState: PropertiesInspectorViewState;
  store: EditorController;
  embedded?: boolean;
}

function PropertiesInspectorContent({
  viewState,
  store
}: Omit<PropertiesInspectorProps, "embedded">) {
  const { t } = useI18n();
  const activeMap = viewState.map;
  const activeLayer = viewState.layer;
  const activeObject = viewState.object;
  const [mapDraft, setMapDraft] = useState(() => createMapDraft(activeMap));
  const [layerDraft, setLayerDraft] = useState(() => createLayerDraft(activeLayer));
  const [objectDraft, setObjectDraft] = useState(() => createObjectDraft(activeObject));
  const objectReferenceOptions = viewState.objectReferenceOptions;
  const propertyTypes = viewState.propertyTypes;

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
    const parallaxOriginX = Number.parseFloat(nextDraft.parallaxOriginX);
    const parallaxOriginY = Number.parseFloat(nextDraft.parallaxOriginY);

    if (
      Number.isNaN(tileWidth) ||
      Number.isNaN(tileHeight) ||
      Number.isNaN(parallaxOriginX) ||
      Number.isNaN(parallaxOriginY) ||
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
        parallaxOriginX,
        parallaxOriginY,
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
    const parallaxX = Number.parseFloat(nextDraft.parallaxX);
    const parallaxY = Number.parseFloat(nextDraft.parallaxY);

    if (
      Number.isNaN(opacity) ||
      Number.isNaN(offsetX) ||
      Number.isNaN(offsetY) ||
      Number.isNaN(parallaxX) ||
      Number.isNaN(parallaxY)
    ) {
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
        parallaxX,
        parallaxY,
        tintColor: nextDraft.tintColor,
        blendMode: nextDraft.blendMode,
        ...(activeLayer.kind === "object" ? { drawOrder: nextDraft.drawOrder } : {}),
        ...(activeLayer.kind === "image"
          ? {
              imagePath: nextDraft.imagePath.trim(),
              repeatX: nextDraft.repeatX,
              repeatY: nextDraft.repeatY
            }
          : {})
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
                  orientation: value as InspectorMapViewState["orientation"]
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
                  renderOrder: value as InspectorMapViewState["renderOrder"]
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
            label={t("propertiesInspector.parallaxOriginX")}
            type="number"
            value={mapDraft.parallaxOriginX}
            onCommit={() => {
              applyMapDraft();
            }}
            onChange={(value) => {
              setMapDraft((current) => ({ ...current, parallaxOriginX: value }));
            }}
          />
          <PropertyBrowserTextRow
            label={t("propertiesInspector.parallaxOriginY")}
            type="number"
            value={mapDraft.parallaxOriginY}
            onCommit={() => {
              applyMapDraft();
            }}
            onChange={(value) => {
              setMapDraft((current) => ({ ...current, parallaxOriginY: value }));
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
            <PropertyBrowserTextRow
              label={t("propertiesInspector.parallaxX")}
              type="number"
              value={layerDraft.parallaxX}
              onCommit={() => {
                applyLayerDraft();
              }}
              onChange={(value) => {
                setLayerDraft((current) => ({ ...current, parallaxX: value }));
              }}
            />
            <PropertyBrowserTextRow
              label={t("propertiesInspector.parallaxY")}
              type="number"
              value={layerDraft.parallaxY}
              onCommit={() => {
                applyLayerDraft();
              }}
              onChange={(value) => {
                setLayerDraft((current) => ({ ...current, parallaxY: value }));
              }}
            />
            <PropertyBrowserTextRow
              label={t("propertiesInspector.tintColor")}
              value={layerDraft.tintColor}
              onCommit={() => {
                applyLayerDraft();
              }}
              onChange={(value) => {
                setLayerDraft((current) => ({ ...current, tintColor: value }));
              }}
            />
            <PropertyBrowserSelectRow
              label={t("propertiesInspector.blendMode")}
              options={blendModeOptions.map((blendMode) => ({
                value: blendMode,
                label: getBlendModeLabel(blendMode, t)
              }))}
              value={layerDraft.blendMode}
              onChange={(value) => {
                const nextDraft = {
                  ...layerDraft,
                  blendMode: value as BlendMode
                };
                setLayerDraft(nextDraft);
                applyLayerDraft(nextDraft);
              }}
            />
            {activeLayer.kind === "image" ? (
              <>
                <PropertyBrowserTextRow
                  label={t("common.imagePath")}
                  value={layerDraft.imagePath}
                  onCommit={() => {
                    applyLayerDraft();
                  }}
                  onChange={(value) => {
                    setLayerDraft((current) => ({ ...current, imagePath: value }));
                  }}
                />
                <PropertyBrowserCheckboxRow
                  checked={layerDraft.repeatX}
                  label={t("propertiesInspector.repeatX")}
                  onChange={(checked) => {
                    const nextDraft = { ...layerDraft, repeatX: checked };
                    setLayerDraft(nextDraft);
                    applyLayerDraft(nextDraft);
                  }}
                />
                <PropertyBrowserCheckboxRow
                  checked={layerDraft.repeatY}
                  label={t("propertiesInspector.repeatY")}
                  onChange={(checked) => {
                    const nextDraft = { ...layerDraft, repeatY: checked };
                    setLayerDraft(nextDraft);
                    applyLayerDraft(nextDraft);
                  }}
                />
              </>
            ) : null}
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
                    drawOrder: value as ObjectLayerDrawOrder
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
