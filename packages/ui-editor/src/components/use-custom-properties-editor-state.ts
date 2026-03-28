"use client";

import {
  mergeSuggestedPropertyDefinitions,
  type PropertyDefinition,
  type PropertyTypeDefinition
} from "@pixel-editor/app-services/ui-custom-properties";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";

import {
  NEW_PROPERTY_KEY,
  createEmptyPropertyDraft,
  createPropertyDraft,
  parseDraft,
  type PropertyDraft
} from "./custom-properties-editor-utils";

export function useCustomPropertiesEditorState(props: {
  properties: readonly PropertyDefinition[];
  suggestedProperties: readonly PropertyDefinition[];
  propertyTypes: readonly PropertyTypeDefinition[];
  onRemove: (propertyName: string) => void;
  onUpsert: (property: PropertyDefinition, previousName?: string) => void;
}) {
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [activePropertyKey, setActivePropertyKey] = useState<string | null>(null);
  const [activeDraft, setActiveDraft] = useState<PropertyDraft | null>(null);
  const [previousName, setPreviousName] = useState<string | undefined>(undefined);
  const [nameFocusToken, setNameFocusToken] = useState(0);
  const explicitPropertyNames = useMemo(
    () => new Set(props.properties.map((property) => property.name)),
    [props.properties]
  );
  const mergedProperties = useMemo(
    () => mergeSuggestedPropertyDefinitions(props.properties, props.suggestedProperties),
    [props.properties, props.suggestedProperties]
  );

  useEffect(() => {
    if (!activePropertyKey || activePropertyKey === NEW_PROPERTY_KEY) {
      return;
    }

    const property = mergedProperties.find((item) => item.name === activePropertyKey);

    if (!property) {
      setActivePropertyKey(null);
      setActiveDraft(null);
      setPreviousName(undefined);
      return;
    }

    setActiveDraft(createPropertyDraft(property, props.propertyTypes));
    setPreviousName(explicitPropertyNames.has(property.name) ? property.name : undefined);
  }, [activePropertyKey, explicitPropertyNames, mergedProperties, props.propertyTypes]);

  useEffect(() => {
    if (nameFocusToken === 0) {
      return;
    }

    nameInputRef.current?.focus();
    nameInputRef.current?.select();
  }, [nameFocusToken]);

  const selectedExistingProperty =
    activePropertyKey && activePropertyKey !== NEW_PROPERTY_KEY
      ? props.properties.find((property) => property.name === activePropertyKey)
      : undefined;
  const selectedMergedProperty =
    activePropertyKey && activePropertyKey !== NEW_PROPERTY_KEY
      ? mergedProperties.find((property) => property.name === activePropertyKey)
      : undefined;
  const selectedPropertyIsExplicit = selectedMergedProperty
    ? explicitPropertyNames.has(selectedMergedProperty.name)
    : false;

  return {
    activeDraft,
    activePropertyKey,
    mergedProperties,
    nameInputRef,
    previousName,
    selectedPropertyIsExplicit,
    explicitPropertyNames,
    setters: {
      setActiveDraft
    },
    actions: {
      beginCreate: () => {
        setActivePropertyKey(NEW_PROPERTY_KEY);
        setActiveDraft(createEmptyPropertyDraft());
        setPreviousName(undefined);
        setNameFocusToken((current) => current + 1);
      },
      selectProperty: (propertyName: string) => {
        if (activePropertyKey === propertyName) {
          setActivePropertyKey(null);
          setActiveDraft(null);
          setPreviousName(undefined);
          return;
        }

        setActivePropertyKey(propertyName);
      },
      focusPropertyName: () => {
        if (!activeDraft) {
          return;
        }

        setNameFocusToken((current) => current + 1);
      },
      removeSelectedProperty: () => {
        if (!selectedExistingProperty) {
          return;
        }

        startTransition(() => {
          props.onRemove(selectedExistingProperty.name);
        });
        setActivePropertyKey(null);
        setActiveDraft(null);
        setPreviousName(undefined);
      },
      saveActiveDraft: () => {
        if (!activeDraft) {
          return;
        }

        const nextProperty = parseDraft(activeDraft, props.propertyTypes);

        if (!nextProperty) {
          return;
        }

        startTransition(() => {
          props.onUpsert(nextProperty, previousName);
        });
        setActivePropertyKey(nextProperty.name);
        setActiveDraft(createPropertyDraft(nextProperty, props.propertyTypes));
        setPreviousName(nextProperty.name);
      }
    }
  };
}
