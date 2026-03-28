"use client";

import {
  deriveObjectsPanelActionAvailability,
  type ObjectsPanelActionAvailability,
  type ObjectsPanelViewState
} from "@pixel-editor/app-services/ui";
import type { ObjectsPanelStore } from "@pixel-editor/app-services/ui-store";
import { useI18n } from "@pixel-editor/i18n/client";
import { Panel } from "./panel";
import {
  ObjectsClipboardCard,
  ObjectsDockActionBar,
  ObjectsDockFilterBar,
  ObjectsDockObjectRows,
  ObjectsPanelActionGroups,
  ObjectsPanelObjectCards
} from "./objects-panel-sections";
import { useObjectsPanelState } from "./use-objects-panel-state";

export interface ObjectsPanelProps {
  viewState: ObjectsPanelViewState;
  store: ObjectsPanelStore;
  onDetachTemplateInstances?: () => void;
  onReplaceWithTemplate?: () => void;
  onResetTemplateInstances?: () => void;
  onSaveAsTemplate?: () => void;
  embedded?: boolean;
}

function ObjectsPanelContent({
  viewState,
  actionAvailability,
  state
}: Omit<ObjectsPanelProps, "embedded"> & {
  actionAvailability: ObjectsPanelActionAvailability;
  state: ReturnType<typeof useObjectsPanelState>;
}) {
  const { t } = useI18n();
  const clipboardSummary = viewState.hasObjectClipboard
    ? t("common.objectCount", { count: viewState.clipboardObjectCount })
    : t("common.empty");

  return (
    <>
      <ObjectsPanelActionGroups
        actionAvailability={actionAvailability}
        onCopy={state.actions.copySelectedObjectsToClipboard}
        onCreateRectangle={state.actions.createRectangleObject}
        onCut={state.actions.cutSelectedObjectsToClipboard}
        onDetachTemplateInstances={state.actions.openDetachTemplateInstances}
        onPaste={state.actions.pasteClipboardToActiveObjectLayer}
        onRemoveSelected={state.actions.removeSelectedObjects}
        onReplaceWithTemplate={state.actions.openReplaceWithTemplate}
        onResetTemplateInstances={state.actions.openResetTemplateInstances}
        onSaveAsTemplate={state.actions.openSaveAsTemplate}
      />

      <ObjectsClipboardCard clipboardSummary={clipboardSummary} />

      <ObjectsPanelObjectCards
        hasActiveLayer={viewState.hasActiveLayer}
        objects={viewState.objects}
        onSelectObject={state.actions.selectObject}
      />
    </>
  );
}

function ObjectsDockContent({
  viewState,
  actionAvailability,
  state
}: Omit<ObjectsPanelProps, "embedded"> & {
  actionAvailability: ObjectsPanelActionAvailability;
  state: ReturnType<typeof useObjectsPanelState>;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <ObjectsDockFilterBar
        filterText={state.filterText}
        onFilterTextChange={state.setFilterText}
      />

      <ObjectsDockObjectRows
        filteredObjects={state.filteredObjects}
        hasActiveLayer={viewState.hasActiveLayer}
        onSelectObject={state.actions.selectObject}
      />

      <ObjectsDockActionBar
        actionAvailability={actionAvailability}
        onCopy={state.actions.copySelectedObjectsToClipboard}
        onCreateRectangle={state.actions.createRectangleObject}
        onCut={state.actions.cutSelectedObjectsToClipboard}
        onDetachTemplateInstances={state.actions.openDetachTemplateInstances}
        onPaste={state.actions.pasteClipboardToActiveObjectLayer}
        onRemoveSelected={state.actions.removeSelectedObjects}
        onReplaceWithTemplate={state.actions.openReplaceWithTemplate}
        onResetTemplateInstances={state.actions.openResetTemplateInstances}
        onSaveAsTemplate={state.actions.openSaveAsTemplate}
      />
    </div>
  );
}

export function ObjectsPanel({
  embedded = false,
  ...props
}: ObjectsPanelProps) {
  const { t } = useI18n();
  const state = useObjectsPanelState(props);
  const actionAvailability = deriveObjectsPanelActionAvailability({
    activeTemplateName: props.viewState.activeTemplateName,
    hasActiveLayer: props.viewState.hasActiveLayer,
    hasObjectClipboard: props.viewState.hasObjectClipboard,
    hasObjectSelection: props.viewState.hasObjectSelection,
    hasTemplateInstanceSelection: props.viewState.hasTemplateInstanceSelection,
    saveAsTemplateEnabled: Boolean(props.onSaveAsTemplate),
    replaceWithTemplateEnabled: Boolean(props.onReplaceWithTemplate),
    resetTemplateInstancesEnabled: Boolean(props.onResetTemplateInstances),
    detachTemplateInstancesEnabled: Boolean(props.onDetachTemplateInstances)
  });
  const content = embedded
    ? <ObjectsDockContent {...props} actionAvailability={actionAvailability} state={state} />
    : <ObjectsPanelContent {...props} actionAvailability={actionAvailability} state={state} />;

  if (embedded) {
    return content;
  }

  return <Panel title={t("objects.title")}>{content}</Panel>;
}
