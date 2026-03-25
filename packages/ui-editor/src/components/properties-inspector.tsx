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
import { startTransition, useEffect, useState, type ReactNode } from "react";

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

const rowLabelClass =
  "border-r border-slate-800 bg-slate-900 px-2 py-1.5 text-[11px] uppercase tracking-[0.14em] text-slate-500";
const inputClass =
  "w-full bg-slate-950 px-2 py-1.5 text-sm text-slate-100 outline-none placeholder:text-slate-500";

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

function InspectorSection(props: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-slate-700 last:border-b-0">
      <div className="border-b border-slate-700 bg-slate-800 px-2 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-300">
        {props.title}
      </div>
      {props.children}
    </section>
  );
}

function ReadOnlyRow(props: {
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[96px_1fr] border-b border-slate-800 last:border-b-0">
      <span className={rowLabelClass}>{props.label}</span>
      <span className="bg-slate-950 px-2 py-1.5 text-sm text-slate-300">{props.value}</span>
    </div>
  );
}

function TextRow(props: {
  label: string;
  value: string;
  type?: "text" | "number";
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid grid-cols-[96px_1fr] border-b border-slate-800 last:border-b-0">
      <span className={rowLabelClass}>{props.label}</span>
      <input
        className={inputClass}
        disabled={props.disabled}
        inputMode={props.type === "number" ? "numeric" : undefined}
        type={props.type ?? "text"}
        value={props.value}
        onChange={(event) => {
          props.onChange(event.target.value);
        }}
      />
    </label>
  );
}

function SelectRow(props: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid grid-cols-[96px_1fr] border-b border-slate-800 last:border-b-0">
      <span className={rowLabelClass}>{props.label}</span>
      <select
        className={inputClass}
        value={props.value}
        onChange={(event) => {
          props.onChange(event.target.value);
        }}
      >
        {props.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function CheckboxRow(props: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="grid grid-cols-[96px_1fr] border-b border-slate-800 last:border-b-0">
      <span className={rowLabelClass}>{props.label}</span>
      <span className="flex items-center bg-slate-950 px-2 py-1.5 text-sm text-slate-200">
        <input
          checked={props.checked}
          type="checkbox"
          onChange={(event) => {
            props.onChange(event.target.checked);
          }}
        />
      </span>
    </label>
  );
}

function SectionFooter(props: {
  onApply: () => void;
  label: string;
}) {
  return (
    <div className="border-t border-slate-700 bg-slate-800 p-1">
      <button
        className="w-full border border-slate-600 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 transition hover:bg-slate-800"
        onClick={props.onApply}
        type="button"
      >
        {props.label}
      </button>
    </div>
  );
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

  function applyMapDraft(): void {
    if (!activeMap) {
      return;
    }

    const width = Number.parseInt(mapDraft.width, 10);
    const height = Number.parseInt(mapDraft.height, 10);
    const tileWidth = Number.parseInt(mapDraft.tileWidth, 10);
    const tileHeight = Number.parseInt(mapDraft.tileHeight, 10);

    if (
      Number.isNaN(tileWidth) ||
      Number.isNaN(tileHeight) ||
      (!mapDraft.infinite && (Number.isNaN(width) || Number.isNaN(height)))
    ) {
      return;
    }

    startTransition(() => {
      store.updateActiveMapDetails({
        name: mapDraft.name.trim() || activeMap.name,
        orientation: mapDraft.orientation,
        renderOrder: mapDraft.renderOrder,
        tileWidth,
        tileHeight,
        infinite: mapDraft.infinite,
        ...(mapDraft.infinite ? {} : { width, height }),
        ...(mapDraft.backgroundColor.trim()
          ? { backgroundColor: mapDraft.backgroundColor.trim() }
          : {})
      });
    });
  }

  function applyLayerDraft(): void {
    if (!activeLayer) {
      return;
    }

    const opacity = Number.parseFloat(layerDraft.opacity);
    const offsetX = Number.parseFloat(layerDraft.offsetX);
    const offsetY = Number.parseFloat(layerDraft.offsetY);

    if (Number.isNaN(opacity) || Number.isNaN(offsetX) || Number.isNaN(offsetY)) {
      return;
    }

    startTransition(() => {
      store.updateActiveLayerDetails({
        name: layerDraft.name.trim() || activeLayer.name,
        className: layerDraft.className,
        visible: layerDraft.visible,
        locked: layerDraft.locked,
        opacity: Math.max(0, Math.min(opacity, 1)),
        offsetX,
        offsetY,
        ...(activeLayer.kind === "object" ? { drawOrder: layerDraft.drawOrder } : {})
      });
    });
  }

  function applyObjectDraft(): void {
    if (!activeObject) {
      return;
    }

    const x = Number.parseFloat(objectDraft.x);
    const y = Number.parseFloat(objectDraft.y);
    const width = Number.parseFloat(objectDraft.width);
    const height = Number.parseFloat(objectDraft.height);
    const rotation = Number.parseFloat(objectDraft.rotation);

    if (
      Number.isNaN(x) ||
      Number.isNaN(y) ||
      Number.isNaN(width) ||
      Number.isNaN(height) ||
      Number.isNaN(rotation)
    ) {
      return;
    }

    startTransition(() => {
      store.updateSelectedObjectDetails({
        name: objectDraft.name.trim() || activeObject.name,
        className: objectDraft.className,
        x,
        y,
        width,
        height,
        rotation,
        visible: objectDraft.visible
      });
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <InspectorSection title={t("propertiesInspector.mapSection")}>
          <TextRow
            label={t("common.name")}
            value={mapDraft.name}
            onChange={(value) => {
              setMapDraft((current) => ({ ...current, name: value }));
            }}
          />
          <SelectRow
            label={t("mapProperties.orientation")}
            options={orientationOptions.map((orientation) => ({
              value: orientation,
              label: getOrientationLabel(orientation, t)
            }))}
            value={mapDraft.orientation}
            onChange={(value) => {
              setMapDraft((current) => ({
                ...current,
                orientation: value as EditorMap["settings"]["orientation"]
              }));
            }}
          />
          <SelectRow
            label={t("mapProperties.renderOrder")}
            options={renderOrderOptions.map((renderOrder) => ({
              value: renderOrder,
              label: getRenderOrderLabel(renderOrder, t)
            }))}
            value={mapDraft.renderOrder}
            onChange={(value) => {
              setMapDraft((current) => ({
                ...current,
                renderOrder: value as EditorMap["settings"]["renderOrder"]
              }));
            }}
          />
          <TextRow
            disabled={mapDraft.infinite}
            label={t("common.width")}
            type="number"
            value={mapDraft.width}
            onChange={(value) => {
              setMapDraft((current) => ({ ...current, width: value }));
            }}
          />
          <TextRow
            disabled={mapDraft.infinite}
            label={t("common.height")}
            type="number"
            value={mapDraft.height}
            onChange={(value) => {
              setMapDraft((current) => ({ ...current, height: value }));
            }}
          />
          <TextRow
            label={t("mapProperties.tileWidthShort")}
            type="number"
            value={mapDraft.tileWidth}
            onChange={(value) => {
              setMapDraft((current) => ({ ...current, tileWidth: value }));
            }}
          />
          <TextRow
            label={t("mapProperties.tileHeightShort")}
            type="number"
            value={mapDraft.tileHeight}
            onChange={(value) => {
              setMapDraft((current) => ({ ...current, tileHeight: value }));
            }}
          />
          <TextRow
            label={t("common.color")}
            value={mapDraft.backgroundColor}
            onChange={(value) => {
              setMapDraft((current) => ({ ...current, backgroundColor: value }));
            }}
          />
          <CheckboxRow
            checked={mapDraft.infinite}
            label={t("common.infinite")}
            onChange={(checked) => {
              setMapDraft((current) => ({ ...current, infinite: checked }));
            }}
          />
          <div className="border-t border-slate-700 p-2">
            <CustomPropertiesEditor
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
          <SectionFooter label={t("common.apply")} onApply={applyMapDraft} />
        </InspectorSection>

        {activeLayer ? (
          <InspectorSection title={t("propertiesInspector.layerSection")}>
            <TextRow
              label={t("common.name")}
              value={layerDraft.name}
              onChange={(value) => {
                setLayerDraft((current) => ({ ...current, name: value }));
              }}
            />
            <TextRow
              label={t("common.className")}
              value={layerDraft.className}
              onChange={(value) => {
                setLayerDraft((current) => ({ ...current, className: value }));
              }}
            />
            <ReadOnlyRow
              label={t("common.kind")}
              value={getLayerKindLabel(activeLayer.kind, t)}
            />
            <CheckboxRow
              checked={layerDraft.visible}
              label={t("common.visible")}
              onChange={(checked) => {
                setLayerDraft((current) => ({ ...current, visible: checked }));
              }}
            />
            <CheckboxRow
              checked={layerDraft.locked}
              label={t("common.locked")}
              onChange={(checked) => {
                setLayerDraft((current) => ({ ...current, locked: checked }));
              }}
            />
            <TextRow
              label={t("common.opacity")}
              type="number"
              value={layerDraft.opacity}
              onChange={(value) => {
                setLayerDraft((current) => ({ ...current, opacity: value }));
              }}
            />
            <TextRow
              label={t("propertiesInspector.offsetX")}
              type="number"
              value={layerDraft.offsetX}
              onChange={(value) => {
                setLayerDraft((current) => ({ ...current, offsetX: value }));
              }}
            />
            <TextRow
              label={t("propertiesInspector.offsetY")}
              type="number"
              value={layerDraft.offsetY}
              onChange={(value) => {
                setLayerDraft((current) => ({ ...current, offsetY: value }));
              }}
            />
            {activeLayer.kind === "object" ? (
              <SelectRow
                label={t("propertiesInspector.drawOrder")}
                options={objectDrawOrderOptions.map((drawOrder) => ({
                  value: drawOrder,
                  label: getObjectDrawOrderLabel(drawOrder, t)
                }))}
                value={layerDraft.drawOrder}
                onChange={(value) => {
                  setLayerDraft((current) => ({
                    ...current,
                    drawOrder: value as ObjectLayer["drawOrder"]
                  }));
                }}
              />
            ) : null}
            <div className="border-t border-slate-700 p-2">
              <CustomPropertiesEditor
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
            <SectionFooter label={t("common.apply")} onApply={applyLayerDraft} />
          </InspectorSection>
        ) : null}

        {activeObject ? (
          <InspectorSection title={t("propertiesInspector.objectSection")}>
            <TextRow
              label={t("common.name")}
              value={objectDraft.name}
              onChange={(value) => {
                setObjectDraft((current) => ({ ...current, name: value }));
              }}
            />
            <TextRow
              label={t("common.className")}
              value={objectDraft.className}
              onChange={(value) => {
                setObjectDraft((current) => ({ ...current, className: value }));
              }}
            />
            <ReadOnlyRow
              label={t("common.kind")}
              value={getObjectShapeLabel(activeObject.shape, t)}
            />
            <TextRow
              label={t("common.x")}
              type="number"
              value={objectDraft.x}
              onChange={(value) => {
                setObjectDraft((current) => ({ ...current, x: value }));
              }}
            />
            <TextRow
              label={t("common.y")}
              type="number"
              value={objectDraft.y}
              onChange={(value) => {
                setObjectDraft((current) => ({ ...current, y: value }));
              }}
            />
            <TextRow
              label={t("common.width")}
              type="number"
              value={objectDraft.width}
              onChange={(value) => {
                setObjectDraft((current) => ({ ...current, width: value }));
              }}
            />
            <TextRow
              label={t("common.height")}
              type="number"
              value={objectDraft.height}
              onChange={(value) => {
                setObjectDraft((current) => ({ ...current, height: value }));
              }}
            />
            <TextRow
              label={t("common.rotation")}
              type="number"
              value={objectDraft.rotation}
              onChange={(value) => {
                setObjectDraft((current) => ({ ...current, rotation: value }));
              }}
            />
            <CheckboxRow
              checked={objectDraft.visible}
              label={t("common.visible")}
              onChange={(checked) => {
                setObjectDraft((current) => ({ ...current, visible: checked }));
              }}
            />
            <div className="border-t border-slate-700 p-2">
              <CustomPropertiesEditor
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
            <SectionFooter label={t("common.apply")} onApply={applyObjectDraft} />
          </InspectorSection>
        ) : null}
      </div>
    </div>
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
