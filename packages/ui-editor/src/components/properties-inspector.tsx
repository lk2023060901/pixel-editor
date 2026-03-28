"use client";

import { type PropertiesInspectorViewState } from "@pixel-editor/app-services/ui";
import type { PropertiesInspectorStore } from "@pixel-editor/app-services/ui-store";
import { useI18n } from "@pixel-editor/i18n/client";

import { Panel } from "./panel";
import { PropertyBrowserContent } from "./property-browser";
import {
  PropertiesInspectorLayerSection,
  PropertiesInspectorMapSection,
  PropertiesInspectorObjectSection
} from "./properties-inspector-sections";
import { usePropertiesInspectorDrafts } from "./use-properties-inspector-drafts";

export interface PropertiesInspectorProps {
  viewState: PropertiesInspectorViewState;
  store: PropertiesInspectorStore;
  embedded?: boolean;
}

function PropertiesInspectorContent({
  viewState,
  store
}: Omit<PropertiesInspectorProps, "embedded">) {
  const { t } = useI18n();
  const drafts = usePropertiesInspectorDrafts({
    viewState,
    store
  });

  if (!drafts.activeMap) {
    return <p className="px-3 py-3 text-sm text-slate-400">{t("mapProperties.noActiveMap")}</p>;
  }

  return (
    <PropertyBrowserContent>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <PropertiesInspectorMapSection
          activeMap={drafts.activeMap}
          draft={drafts.drafts.mapDraft}
          setDraft={drafts.setters.setMapDraft}
          applyDraft={drafts.apply.applyMapDraft}
          objectReferenceOptions={drafts.objectReferenceOptions}
          propertyTypes={drafts.propertyTypes}
          onRemoveProperty={store.removeActiveMapProperty}
          onUpsertProperty={store.upsertActiveMapProperty}
        />

        {drafts.activeLayer ? (
          <PropertiesInspectorLayerSection
            activeLayer={drafts.activeLayer}
            draft={drafts.drafts.layerDraft}
            setDraft={drafts.setters.setLayerDraft}
            applyDraft={drafts.apply.applyLayerDraft}
            objectReferenceOptions={drafts.objectReferenceOptions}
            propertyTypes={drafts.propertyTypes}
            onRemoveProperty={store.removeActiveLayerProperty}
            onUpsertProperty={store.upsertActiveLayerProperty}
          />
        ) : null}

        {drafts.activeObject ? (
          <PropertiesInspectorObjectSection
            activeObject={drafts.activeObject}
            draft={drafts.drafts.objectDraft}
            setDraft={drafts.setters.setObjectDraft}
            applyDraft={drafts.apply.applyObjectDraft}
            objectReferenceOptions={drafts.objectReferenceOptions}
            propertyTypes={drafts.propertyTypes}
            onRemoveProperty={store.removeSelectedObjectProperty}
            onUpsertProperty={store.upsertSelectedObjectProperty}
          />
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
