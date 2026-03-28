"use client";

import type {
  ObjectsPanelViewState
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
  store,
  onDetachTemplateInstances,
  onReplaceWithTemplate,
  onResetTemplateInstances,
  onSaveAsTemplate,
  state
}: Omit<ObjectsPanelProps, "embedded"> & {
  state: ReturnType<typeof useObjectsPanelState>;
}) {
  const { t } = useI18n();
  const clipboardSummary = viewState.hasObjectClipboard
    ? t("common.objectCount", { count: viewState.clipboardObjectCount })
    : t("common.empty");

  return (
    <>
      <ObjectsPanelActionGroups
        activeTemplateName={viewState.activeTemplateName}
        hasActiveLayer={viewState.hasActiveLayer}
        hasObjectClipboard={viewState.hasObjectClipboard}
        hasObjectSelection={viewState.hasObjectSelection}
        hasTemplateInstanceSelection={viewState.hasTemplateInstanceSelection}
        onCopy={state.actions.copySelectedObjectsToClipboard}
        onCreateRectangle={state.actions.createRectangleObject}
        onCut={state.actions.cutSelectedObjectsToClipboard}
        onDetachTemplateInstances={state.actions.openDetachTemplateInstances}
        onPaste={state.actions.pasteClipboardToActiveObjectLayer}
        onRemoveSelected={state.actions.removeSelectedObjects}
        onReplaceWithTemplate={state.actions.openReplaceWithTemplate}
        onResetTemplateInstances={state.actions.openResetTemplateInstances}
        onSaveAsTemplate={state.actions.openSaveAsTemplate}
        saveAsTemplateEnabled={Boolean(onSaveAsTemplate)}
        replaceWithTemplateEnabled={Boolean(onReplaceWithTemplate)}
        resetTemplateInstancesEnabled={Boolean(onResetTemplateInstances)}
        detachTemplateInstancesEnabled={Boolean(onDetachTemplateInstances)}
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
  store,
  onDetachTemplateInstances,
  onReplaceWithTemplate,
  onResetTemplateInstances,
  onSaveAsTemplate,
  state
}: Omit<ObjectsPanelProps, "embedded"> & {
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
        activeTemplateName={viewState.activeTemplateName}
        hasActiveLayer={viewState.hasActiveLayer}
        hasObjectClipboard={viewState.hasObjectClipboard}
        hasObjectSelection={viewState.hasObjectSelection}
        hasTemplateInstanceSelection={viewState.hasTemplateInstanceSelection}
        onCopy={state.actions.copySelectedObjectsToClipboard}
        onCreateRectangle={state.actions.createRectangleObject}
        onCut={state.actions.cutSelectedObjectsToClipboard}
        onDetachTemplateInstances={state.actions.openDetachTemplateInstances}
        onPaste={state.actions.pasteClipboardToActiveObjectLayer}
        onRemoveSelected={state.actions.removeSelectedObjects}
        onReplaceWithTemplate={state.actions.openReplaceWithTemplate}
        onResetTemplateInstances={state.actions.openResetTemplateInstances}
        onSaveAsTemplate={state.actions.openSaveAsTemplate}
        saveAsTemplateEnabled={Boolean(onSaveAsTemplate)}
        replaceWithTemplateEnabled={Boolean(onReplaceWithTemplate)}
        resetTemplateInstancesEnabled={Boolean(onResetTemplateInstances)}
        detachTemplateInstancesEnabled={Boolean(onDetachTemplateInstances)}
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
  const content = embedded
    ? <ObjectsDockContent {...props} state={state} />
    : <ObjectsPanelContent {...props} state={state} />;

  if (embedded) {
    return content;
  }

  return <Panel title={t("objects.title")}>{content}</Panel>;
}
