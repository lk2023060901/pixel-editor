"use client";

import {
  deriveFilteredObjectsPanelItems,
  type ObjectsPanelViewState
} from "@pixel-editor/app-services/ui";
import type { ObjectsPanelStore } from "@pixel-editor/app-services/ui-store";
import { useI18n } from "@pixel-editor/i18n/client";
import { startTransition, useMemo, useState } from "react";

import { getObjectShapeLabel } from "./i18n-helpers";

export function useObjectsPanelState(props: {
  viewState: ObjectsPanelViewState;
  store: ObjectsPanelStore;
  onDetachTemplateInstances?: () => void;
  onReplaceWithTemplate?: () => void;
  onResetTemplateInstances?: () => void;
  onSaveAsTemplate?: () => void;
}) {
  const { t } = useI18n();
  const [filterText, setFilterText] = useState("");
  const filteredObjects = useMemo(() => {
    return deriveFilteredObjectsPanelItems({
      objects: props.viewState.objects,
      filterText,
      getShapeLabel: (shape) => getObjectShapeLabel(shape, t)
    });
  }, [filterText, props.viewState.objects, t]);

  return {
    filterText,
    filteredObjects,
    setFilterText,
    actions: {
      createRectangleObject: () => {
        startTransition(() => {
          props.store.createRectangleObject();
        });
      },
      removeSelectedObjects: () => {
        startTransition(() => {
          props.store.removeSelectedObjects();
        });
      },
      copySelectedObjectsToClipboard: () => {
        startTransition(() => {
          props.store.copySelectedObjectsToClipboard();
        });
      },
      cutSelectedObjectsToClipboard: () => {
        startTransition(() => {
          props.store.cutSelectedObjectsToClipboard();
        });
      },
      pasteClipboardToActiveObjectLayer: () => {
        startTransition(() => {
          props.store.pasteClipboardToActiveObjectLayer();
        });
      },
      selectObject: (objectId: ObjectsPanelViewState["objects"][number]["id"]) => {
        startTransition(() => {
          props.store.selectObject(objectId);
        });
      },
      openSaveAsTemplate: () => {
        props.onSaveAsTemplate?.();
      },
      openReplaceWithTemplate: () => {
        props.onReplaceWithTemplate?.();
      },
      openResetTemplateInstances: () => {
        props.onResetTemplateInstances?.();
      },
      openDetachTemplateInstances: () => {
        props.onDetachTemplateInstances?.();
      }
    }
  };
}
