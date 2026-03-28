"use client";

import type {
  InspectorLayerViewState,
  InspectorMapViewState,
  InspectorObjectViewState,
  PropertiesInspectorBlendMode as BlendMode,
  PropertiesInspectorLayerDraft as LayerDraft,
  PropertiesInspectorMapDraft as MapDraft,
  PropertiesInspectorObjectDraft as ObjectDraft,
  PropertiesInspectorObjectDrawOrder as ObjectLayerDrawOrder,
  PropertiesInspectorViewState
} from "@pixel-editor/app-services/ui";
import {
  propertiesInspectorBlendModeOptions,
  propertiesInspectorMapOrientationOptions,
  propertiesInspectorMapRenderOrderOptions,
  propertiesInspectorObjectDrawOrderOptions
} from "@pixel-editor/app-services/ui";
import type { PropertiesInspectorStore } from "@pixel-editor/app-services/ui-store";
import type { Dispatch, SetStateAction } from "react";
import { useI18n } from "@pixel-editor/i18n/client";

import {
  getBlendModeLabel,
  getLayerKindLabel,
  getObjectDrawOrderLabel,
  getObjectShapeLabel,
  getOrientationLabel,
  getRenderOrderLabel
} from "./i18n-helpers";
import { CustomPropertiesEditor } from "./custom-properties-editor";
import {
  PropertyBrowserCheckboxRow,
  PropertyBrowserGroup,
  PropertyBrowserReadOnlyRow,
  PropertyBrowserSelectRow,
  PropertyBrowserTextRow
} from "./property-browser";

interface PropertiesInspectorSectionSharedProps {
  objectReferenceOptions: PropertiesInspectorViewState["objectReferenceOptions"];
  propertyTypes: PropertiesInspectorViewState["propertyTypes"];
}

export interface PropertiesInspectorMapSectionProps
  extends PropertiesInspectorSectionSharedProps {
  activeMap: InspectorMapViewState;
  draft: MapDraft;
  setDraft: Dispatch<SetStateAction<MapDraft>>;
  applyDraft: (nextDraft?: MapDraft) => void;
  onRemoveProperty: PropertiesInspectorStore["removeActiveMapProperty"];
  onUpsertProperty: PropertiesInspectorStore["upsertActiveMapProperty"];
}

export function PropertiesInspectorMapSection(
  props: PropertiesInspectorMapSectionProps
) {
  const { t } = useI18n();

  return (
    <PropertyBrowserGroup title={t("propertiesInspector.mapSection")}>
      <PropertyBrowserTextRow
        label={t("common.name")}
        value={props.draft.name}
        onCommit={() => {
          props.applyDraft();
        }}
        onChange={(value) => {
          props.setDraft((current) => ({ ...current, name: value }));
        }}
      />
      <PropertyBrowserSelectRow
        label={t("mapProperties.orientation")}
        options={propertiesInspectorMapOrientationOptions.map((orientation) => ({
          value: orientation,
          label: getOrientationLabel(orientation, t)
        }))}
        value={props.draft.orientation}
        onChange={(value) => {
          const nextDraft = {
            ...props.draft,
            orientation: value as InspectorMapViewState["orientation"]
          };
          props.setDraft(nextDraft);
          props.applyDraft(nextDraft);
        }}
      />
      <PropertyBrowserSelectRow
        label={t("mapProperties.renderOrder")}
        options={propertiesInspectorMapRenderOrderOptions.map((renderOrder) => ({
          value: renderOrder,
          label: getRenderOrderLabel(renderOrder, t)
        }))}
        value={props.draft.renderOrder}
        onChange={(value) => {
          const nextDraft = {
            ...props.draft,
            renderOrder: value as InspectorMapViewState["renderOrder"]
          };
          props.setDraft(nextDraft);
          props.applyDraft(nextDraft);
        }}
      />
      <PropertyBrowserTextRow
        disabled={props.draft.infinite}
        label={t("common.width")}
        type="number"
        value={props.draft.width}
        onCommit={() => {
          props.applyDraft();
        }}
        onChange={(value) => {
          props.setDraft((current) => ({ ...current, width: value }));
        }}
      />
      <PropertyBrowserTextRow
        disabled={props.draft.infinite}
        label={t("common.height")}
        type="number"
        value={props.draft.height}
        onCommit={() => {
          props.applyDraft();
        }}
        onChange={(value) => {
          props.setDraft((current) => ({ ...current, height: value }));
        }}
      />
      <PropertyBrowserTextRow
        label={t("mapProperties.tileWidthShort")}
        type="number"
        value={props.draft.tileWidth}
        onCommit={() => {
          props.applyDraft();
        }}
        onChange={(value) => {
          props.setDraft((current) => ({ ...current, tileWidth: value }));
        }}
      />
      <PropertyBrowserTextRow
        label={t("mapProperties.tileHeightShort")}
        type="number"
        value={props.draft.tileHeight}
        onCommit={() => {
          props.applyDraft();
        }}
        onChange={(value) => {
          props.setDraft((current) => ({ ...current, tileHeight: value }));
        }}
      />
      <PropertyBrowserTextRow
        label={t("propertiesInspector.parallaxOriginX")}
        type="number"
        value={props.draft.parallaxOriginX}
        onCommit={() => {
          props.applyDraft();
        }}
        onChange={(value) => {
          props.setDraft((current) => ({ ...current, parallaxOriginX: value }));
        }}
      />
      <PropertyBrowserTextRow
        label={t("propertiesInspector.parallaxOriginY")}
        type="number"
        value={props.draft.parallaxOriginY}
        onCommit={() => {
          props.applyDraft();
        }}
        onChange={(value) => {
          props.setDraft((current) => ({ ...current, parallaxOriginY: value }));
        }}
      />
      <PropertyBrowserTextRow
        label={t("common.color")}
        value={props.draft.backgroundColor}
        onCommit={() => {
          props.applyDraft();
        }}
        onChange={(value) => {
          props.setDraft((current) => ({ ...current, backgroundColor: value }));
        }}
      />
      <PropertyBrowserCheckboxRow
        checked={props.draft.infinite}
        label={t("common.infinite")}
        onChange={(checked) => {
          const nextDraft = { ...props.draft, infinite: checked };
          props.setDraft(nextDraft);
          props.applyDraft(nextDraft);
        }}
      />
      <div className="border-t border-slate-700 p-0">
        <CustomPropertiesEditor
          className="bg-slate-950"
          properties={props.activeMap.properties}
          objectReferenceOptions={props.objectReferenceOptions}
          propertyTypes={props.propertyTypes}
          onRemove={props.onRemoveProperty}
          onUpsert={props.onUpsertProperty}
          showHint={false}
        />
      </div>
    </PropertyBrowserGroup>
  );
}

export interface PropertiesInspectorLayerSectionProps
  extends PropertiesInspectorSectionSharedProps {
  activeLayer: InspectorLayerViewState;
  draft: LayerDraft;
  setDraft: Dispatch<SetStateAction<LayerDraft>>;
  applyDraft: (nextDraft?: LayerDraft) => void;
  onRemoveProperty: PropertiesInspectorStore["removeActiveLayerProperty"];
  onUpsertProperty: PropertiesInspectorStore["upsertActiveLayerProperty"];
}

export function PropertiesInspectorLayerSection(
  props: PropertiesInspectorLayerSectionProps
) {
  const { t } = useI18n();

  return (
    <PropertyBrowserGroup title={t("propertiesInspector.layerSection")}>
      <PropertyBrowserTextRow
        label={t("common.name")}
        value={props.draft.name}
        onCommit={() => {
          props.applyDraft();
        }}
        onChange={(value) => {
          props.setDraft((current) => ({ ...current, name: value }));
        }}
      />
      <PropertyBrowserTextRow
        label={t("common.className")}
        value={props.draft.className}
        onCommit={() => {
          props.applyDraft();
        }}
        onChange={(value) => {
          props.setDraft((current) => ({ ...current, className: value }));
        }}
      />
      <PropertyBrowserReadOnlyRow
        label={t("common.kind")}
        value={getLayerKindLabel(props.activeLayer.kind, t)}
      />
      <PropertyBrowserCheckboxRow
        checked={props.draft.visible}
        label={t("common.visible")}
        onChange={(checked) => {
          const nextDraft = { ...props.draft, visible: checked };
          props.setDraft(nextDraft);
          props.applyDraft(nextDraft);
        }}
      />
      <PropertyBrowserCheckboxRow
        checked={props.draft.locked}
        label={t("common.locked")}
        onChange={(checked) => {
          const nextDraft = { ...props.draft, locked: checked };
          props.setDraft(nextDraft);
          props.applyDraft(nextDraft);
        }}
      />
      <PropertyBrowserTextRow
        label={t("common.opacity")}
        type="number"
        value={props.draft.opacity}
        onCommit={() => {
          props.applyDraft();
        }}
        onChange={(value) => {
          props.setDraft((current) => ({ ...current, opacity: value }));
        }}
      />
      <PropertyBrowserTextRow
        label={t("propertiesInspector.offsetX")}
        type="number"
        value={props.draft.offsetX}
        onCommit={() => {
          props.applyDraft();
        }}
        onChange={(value) => {
          props.setDraft((current) => ({ ...current, offsetX: value }));
        }}
      />
      <PropertyBrowserTextRow
        label={t("propertiesInspector.offsetY")}
        type="number"
        value={props.draft.offsetY}
        onCommit={() => {
          props.applyDraft();
        }}
        onChange={(value) => {
          props.setDraft((current) => ({ ...current, offsetY: value }));
        }}
      />
      <PropertyBrowserTextRow
        label={t("propertiesInspector.parallaxX")}
        type="number"
        value={props.draft.parallaxX}
        onCommit={() => {
          props.applyDraft();
        }}
        onChange={(value) => {
          props.setDraft((current) => ({ ...current, parallaxX: value }));
        }}
      />
      <PropertyBrowserTextRow
        label={t("propertiesInspector.parallaxY")}
        type="number"
        value={props.draft.parallaxY}
        onCommit={() => {
          props.applyDraft();
        }}
        onChange={(value) => {
          props.setDraft((current) => ({ ...current, parallaxY: value }));
        }}
      />
      <PropertyBrowserTextRow
        label={t("propertiesInspector.tintColor")}
        value={props.draft.tintColor}
        onCommit={() => {
          props.applyDraft();
        }}
        onChange={(value) => {
          props.setDraft((current) => ({ ...current, tintColor: value }));
        }}
      />
      <PropertyBrowserSelectRow
        label={t("propertiesInspector.blendMode")}
        options={propertiesInspectorBlendModeOptions.map((blendMode) => ({
          value: blendMode,
          label: getBlendModeLabel(blendMode, t)
        }))}
        value={props.draft.blendMode}
        onChange={(value) => {
          const nextDraft = {
            ...props.draft,
            blendMode: value as BlendMode
          };
          props.setDraft(nextDraft);
          props.applyDraft(nextDraft);
        }}
      />
      {props.activeLayer.kind === "image" ? (
        <>
          <PropertyBrowserTextRow
            label={t("common.imagePath")}
            value={props.draft.imagePath}
            onCommit={() => {
              props.applyDraft();
            }}
            onChange={(value) => {
              props.setDraft((current) => ({ ...current, imagePath: value }));
            }}
          />
          <PropertyBrowserCheckboxRow
            checked={props.draft.repeatX}
            label={t("propertiesInspector.repeatX")}
            onChange={(checked) => {
              const nextDraft = { ...props.draft, repeatX: checked };
              props.setDraft(nextDraft);
              props.applyDraft(nextDraft);
            }}
          />
          <PropertyBrowserCheckboxRow
            checked={props.draft.repeatY}
            label={t("propertiesInspector.repeatY")}
            onChange={(checked) => {
              const nextDraft = { ...props.draft, repeatY: checked };
              props.setDraft(nextDraft);
              props.applyDraft(nextDraft);
            }}
          />
        </>
      ) : null}
      {props.activeLayer.kind === "object" ? (
        <PropertyBrowserSelectRow
          label={t("propertiesInspector.drawOrder")}
          options={propertiesInspectorObjectDrawOrderOptions.map((drawOrder) => ({
            value: drawOrder,
            label: getObjectDrawOrderLabel(drawOrder, t)
          }))}
          value={props.draft.drawOrder}
          onChange={(value) => {
            const nextDraft = {
              ...props.draft,
              drawOrder: value as ObjectLayerDrawOrder
            };
            props.setDraft(nextDraft);
            props.applyDraft(nextDraft);
          }}
        />
      ) : null}
      <div className="border-t border-slate-700 p-0">
        <CustomPropertiesEditor
          className="bg-slate-950"
          properties={props.activeLayer.properties}
          objectReferenceOptions={props.objectReferenceOptions}
          propertyTypes={props.propertyTypes}
          onRemove={props.onRemoveProperty}
          onUpsert={props.onUpsertProperty}
          showHint={false}
        />
      </div>
    </PropertyBrowserGroup>
  );
}

export interface PropertiesInspectorObjectSectionProps
  extends PropertiesInspectorSectionSharedProps {
  activeObject: InspectorObjectViewState;
  draft: ObjectDraft;
  setDraft: Dispatch<SetStateAction<ObjectDraft>>;
  applyDraft: (nextDraft?: ObjectDraft) => void;
  onRemoveProperty: PropertiesInspectorStore["removeSelectedObjectProperty"];
  onUpsertProperty: PropertiesInspectorStore["upsertSelectedObjectProperty"];
}

export function PropertiesInspectorObjectSection(
  props: PropertiesInspectorObjectSectionProps
) {
  const { t } = useI18n();

  return (
    <PropertyBrowserGroup title={t("propertiesInspector.objectSection")}>
      <PropertyBrowserTextRow
        label={t("common.name")}
        value={props.draft.name}
        onCommit={() => {
          props.applyDraft();
        }}
        onChange={(value) => {
          props.setDraft((current) => ({ ...current, name: value }));
        }}
      />
      <PropertyBrowserTextRow
        label={t("common.className")}
        value={props.draft.className}
        onCommit={() => {
          props.applyDraft();
        }}
        onChange={(value) => {
          props.setDraft((current) => ({ ...current, className: value }));
        }}
      />
      <PropertyBrowserReadOnlyRow
        label={t("common.kind")}
        value={getObjectShapeLabel(props.activeObject.shape, t)}
      />
      <PropertyBrowserTextRow
        label={t("common.x")}
        type="number"
        value={props.draft.x}
        onCommit={() => {
          props.applyDraft();
        }}
        onChange={(value) => {
          props.setDraft((current) => ({ ...current, x: value }));
        }}
      />
      <PropertyBrowserTextRow
        label={t("common.y")}
        type="number"
        value={props.draft.y}
        onCommit={() => {
          props.applyDraft();
        }}
        onChange={(value) => {
          props.setDraft((current) => ({ ...current, y: value }));
        }}
      />
      <PropertyBrowserTextRow
        label={t("common.width")}
        type="number"
        value={props.draft.width}
        onCommit={() => {
          props.applyDraft();
        }}
        onChange={(value) => {
          props.setDraft((current) => ({ ...current, width: value }));
        }}
      />
      <PropertyBrowserTextRow
        label={t("common.height")}
        type="number"
        value={props.draft.height}
        onCommit={() => {
          props.applyDraft();
        }}
        onChange={(value) => {
          props.setDraft((current) => ({ ...current, height: value }));
        }}
      />
      <PropertyBrowserTextRow
        label={t("common.rotation")}
        type="number"
        value={props.draft.rotation}
        onCommit={() => {
          props.applyDraft();
        }}
        onChange={(value) => {
          props.setDraft((current) => ({ ...current, rotation: value }));
        }}
      />
      <PropertyBrowserCheckboxRow
        checked={props.draft.visible}
        label={t("common.visible")}
        onChange={(checked) => {
          const nextDraft = { ...props.draft, visible: checked };
          props.setDraft(nextDraft);
          props.applyDraft(nextDraft);
        }}
      />
      <div className="border-t border-slate-700 p-0">
        <CustomPropertiesEditor
          className="bg-slate-950"
          properties={props.activeObject.properties}
          objectReferenceOptions={props.objectReferenceOptions}
          propertyTypes={props.propertyTypes}
          onRemove={props.onRemoveProperty}
          onUpsert={props.onUpsertProperty}
          showHint={false}
        />
      </div>
    </PropertyBrowserGroup>
  );
}
