"use client";

import {
  type ObjectReferenceOption
} from "@pixel-editor/app-services/ui";
import {
  type PropertyDefinition,
  type PropertyTypeDefinition
} from "@pixel-editor/app-services/ui-custom-properties";
import { useI18n } from "@pixel-editor/i18n/client";

import {
  CustomPropertiesActionBar,
  CustomPropertiesHint,
  PropertyDraftEditor,
  PropertyListRow
} from "./custom-properties-editor-sections";
import {
  buildTypedOptionValue,
  getClassPropertyTypes,
  getEnumPropertyTypes
} from "./custom-properties-editor-utils";
import { PropertyBrowserGroup } from "./property-browser";
import { useCustomPropertiesEditorState } from "./use-custom-properties-editor-state";

export interface CustomPropertiesEditorProps {
  properties: readonly PropertyDefinition[];
  suggestedProperties?: readonly PropertyDefinition[];
  propertyTypes: readonly PropertyTypeDefinition[] | undefined;
  objectReferenceOptions: readonly ObjectReferenceOption[] | undefined;
  onUpsert: (property: PropertyDefinition, previousName?: string) => void;
  onRemove: (propertyName: string) => void;
  className?: string;
  showHint?: boolean;
}

export function CustomPropertiesEditor(props: CustomPropertiesEditorProps) {
  const { t } = useI18n();
  const propertyTypes = props.propertyTypes ?? [];
  const objectReferenceOptions = props.objectReferenceOptions ?? [];
  const suggestedProperties = props.suggestedProperties ?? [];
  const supportedPropertyTypes: Array<{ label: string; value: string }> = [
    { label: t("propertyType.string"), value: "string" },
    { label: t("propertyType.int"), value: "int" },
    { label: t("propertyType.float"), value: "float" },
    { label: t("propertyType.bool"), value: "bool" },
    { label: t("propertyType.color"), value: "color" },
    { label: t("propertyType.file"), value: "file" },
    { label: t("propertyType.object"), value: "object" },
    ...getEnumPropertyTypes(propertyTypes).map((propertyType) => ({
      label: t("propertiesEditor.enumTypeOption", { name: propertyType.name }),
      value: buildTypedOptionValue("enum", propertyType.name)
    })),
    ...getClassPropertyTypes(propertyTypes).map((propertyType) => ({
      label: t("propertiesEditor.classTypeOption", { name: propertyType.name }),
      value: buildTypedOptionValue("class", propertyType.name)
    }))
  ];
  const state = useCustomPropertiesEditorState({
    properties: props.properties,
    suggestedProperties,
    propertyTypes,
    onRemove: props.onRemove,
    onUpsert: props.onUpsert
  });

  return (
    <div className={props.className}>
      <PropertyBrowserGroup title={t("propertiesEditor.customProperties")}>
        {state.mergedProperties.length === 0 ? (
          <div className="border-b border-slate-800 bg-slate-950 px-2 py-2 text-sm text-slate-400">
            {t("propertiesEditor.noCustomProperties")}
          </div>
        ) : (
          state.mergedProperties.map((property) => (
            <PropertyListRow
              explicit={state.explicitPropertyNames.has(property.name)}
              key={property.name}
              objectReferenceOptions={objectReferenceOptions}
              property={property}
              propertyTypes={propertyTypes}
              selected={state.activePropertyKey === property.name}
              onSelect={() => {
                state.actions.selectProperty(property.name);
              }}
            />
          ))
        )}

        {state.activeDraft ? (
          <div className="border-t border-slate-700">
            <PropertyDraftEditor
              draft={state.activeDraft}
              identityLocked={state.activePropertyKey !== "__new__" && !state.selectedPropertyIsExplicit}
              nameInputRef={state.nameInputRef}
              objectReferenceOptions={objectReferenceOptions}
              propertyTypes={propertyTypes}
              supportedPropertyTypes={supportedPropertyTypes}
              onChange={state.setters.setActiveDraft}
            />
          </div>
        ) : null}

        <CustomPropertiesActionBar
          activeDraft={state.activeDraft}
          activePropertyKey={state.activePropertyKey}
          canRemove={state.selectedPropertyIsExplicit}
          canRename={state.activePropertyKey === "__new__" || state.selectedPropertyIsExplicit}
          previousName={state.previousName}
          onBeginCreate={state.actions.beginCreate}
          onFocusPropertyName={state.actions.focusPropertyName}
          onRemoveSelectedProperty={state.actions.removeSelectedProperty}
          onSaveActiveDraft={state.actions.saveActiveDraft}
        />
      </PropertyBrowserGroup>

      {props.showHint ?? true ? <CustomPropertiesHint /> : null}
    </div>
  );
}
