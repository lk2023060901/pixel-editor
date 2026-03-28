"use client";

import type {
  ObjectsPanelActionAvailability,
  ObjectsPanelViewState
} from "@pixel-editor/app-services/ui";
import { useI18n } from "@pixel-editor/i18n/client";

import { getObjectShapeLabel } from "./i18n-helpers";

type ObjectsPanelObjectItem = ObjectsPanelViewState["objects"][number];

function ActionButton(props: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
      disabled={props.disabled}
      onClick={props.onClick}
    >
      {props.label}
    </button>
  );
}

function DockActionButton(props: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="min-w-0 border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] text-slate-200 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
      disabled={props.disabled}
      onClick={props.onClick}
    >
      {props.label}
    </button>
  );
}

export function ObjectsPanelActionGroups(props: {
  actionAvailability: ObjectsPanelActionAvailability;
  onCopy: () => void;
  onCreateRectangle: () => void;
  onCut: () => void;
  onDetachTemplateInstances: () => void;
  onPaste: () => void;
  onRemoveSelected: () => void;
  onReplaceWithTemplate: () => void;
  onResetTemplateInstances: () => void;
  onSaveAsTemplate: () => void;
}) {
  const { t } = useI18n();

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-2">
        <ActionButton
          label={t("objects.addRectangle")}
          disabled={!props.actionAvailability.canCreateRectangle}
          onClick={props.onCreateRectangle}
        />
        <ActionButton
          label={t("objects.removeSelected")}
          disabled={!props.actionAvailability.canRemoveSelected}
          onClick={props.onRemoveSelected}
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <ActionButton
          label={t("common.copy")}
          disabled={!props.actionAvailability.canCopy}
          onClick={props.onCopy}
        />
        <ActionButton
          label={t("common.cut")}
          disabled={!props.actionAvailability.canCut}
          onClick={props.onCut}
        />
        <ActionButton
          label={t("common.paste")}
          disabled={!props.actionAvailability.canPaste}
          onClick={props.onPaste}
        />
        <ActionButton
          label={t("objects.saveAsTemplate")}
          disabled={!props.actionAvailability.canSaveAsTemplate}
          onClick={props.onSaveAsTemplate}
        />
        <ActionButton
          label={t("objects.replaceWithTemplate")}
          disabled={!props.actionAvailability.canReplaceWithTemplate}
          onClick={props.onReplaceWithTemplate}
        />
        <ActionButton
          label={t("objects.resetTemplateInstances")}
          disabled={!props.actionAvailability.canResetTemplateInstances}
          onClick={props.onResetTemplateInstances}
        />
        <ActionButton
          label={t("objects.detachTemplateInstances")}
          disabled={!props.actionAvailability.canDetachTemplateInstances}
          onClick={props.onDetachTemplateInstances}
        />
      </div>
    </>
  );
}

export function ObjectsClipboardCard(props: {
  clipboardSummary: string;
}) {
  const { t } = useI18n();

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-3 text-sm text-slate-300">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs tracking-[0.18em] text-slate-500 uppercase">
          {t("objects.clipboard")}
        </span>
        <span className="text-sm text-slate-100">{props.clipboardSummary}</span>
      </div>
    </div>
  );
}

export function ObjectsPanelObjectCards(props: {
  hasActiveLayer: boolean;
  objects: readonly ObjectsPanelObjectItem[];
  onSelectObject: (objectId: ObjectsPanelObjectItem["id"]) => void;
}) {
  const { t } = useI18n();

  return (
    <div className="mt-4 space-y-2">
      {props.objects.map((object, index) => (
        <article
          key={object.id}
          className={`cursor-pointer rounded-xl border px-3 py-3 transition ${
            object.isSelected
              ? "border-emerald-500/60 bg-emerald-500/10"
              : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
          }`}
          onClick={() => {
            props.onSelectObject(object.id);
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <strong className="text-sm text-slate-100">{object.name}</strong>
            <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
              {getObjectShapeLabel(object.shape, t)}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            #{index + 1} · {object.x},{object.y} · {object.width}×{object.height}
          </p>
        </article>
      ))}

      {!props.hasActiveLayer ? (
        <p className="text-sm text-slate-400">{t("objects.selectObjectLayer")}</p>
      ) : null}

      {props.hasActiveLayer && props.objects.length === 0 ? (
        <p className="text-sm text-slate-400">{t("objects.noObjects")}</p>
      ) : null}
    </div>
  );
}

export function ObjectsDockFilterBar(props: {
  filterText: string;
  onFilterTextChange: (value: string) => void;
}) {
  const { t } = useI18n();

  return (
    <div className="border-b border-slate-800 p-1.5">
      <input
        className="w-full border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-slate-500"
        placeholder={t("common.filter")}
        value={props.filterText}
        onChange={(event) => {
          props.onFilterTextChange(event.target.value);
        }}
      />
    </div>
  );
}

export function ObjectsDockObjectRows(props: {
  filteredObjects: readonly ObjectsPanelObjectItem[];
  hasActiveLayer: boolean;
  onSelectObject: (objectId: ObjectsPanelObjectItem["id"]) => void;
}) {
  const { t } = useI18n();

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      {props.filteredObjects.map((object) => (
        <button
          key={object.id}
          className={`grid w-full grid-cols-[1fr_auto] items-center gap-2 border-b border-slate-800 px-2 py-1.5 text-left text-sm transition ${
            object.isSelected
              ? "bg-slate-800 text-slate-100"
              : "bg-slate-900 text-slate-300 hover:bg-slate-800/70"
          }`}
          onClick={() => {
            props.onSelectObject(object.id);
          }}
        >
          <span className="min-w-0 truncate font-medium">{object.name}</span>
          <span className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
            {getObjectShapeLabel(object.shape, t)}
          </span>
        </button>
      ))}

      {!props.hasActiveLayer ? (
        <div className="px-3 py-3 text-sm text-slate-400">{t("objects.selectObjectLayer")}</div>
      ) : null}

      {props.hasActiveLayer && props.filteredObjects.length === 0 ? (
        <div className="px-3 py-3 text-sm text-slate-400">
          {t("objects.noObjectsMatchFilter")}
        </div>
      ) : null}
    </div>
  );
}

export function ObjectsDockActionBar(props: {
  actionAvailability: ObjectsPanelActionAvailability;
  onCopy: () => void;
  onCreateRectangle: () => void;
  onCut: () => void;
  onDetachTemplateInstances: () => void;
  onPaste: () => void;
  onRemoveSelected: () => void;
  onReplaceWithTemplate: () => void;
  onResetTemplateInstances: () => void;
  onSaveAsTemplate: () => void;
}) {
  const { t } = useI18n();

  return (
    <div className="flex flex-wrap items-center gap-px border-t border-slate-700 bg-slate-800 p-1">
      <DockActionButton
        label={t("common.add")}
        disabled={!props.actionAvailability.canCreateRectangle}
        onClick={props.onCreateRectangle}
      />
      <DockActionButton
        label={t("common.delete")}
        disabled={!props.actionAvailability.canRemoveSelected}
        onClick={props.onRemoveSelected}
      />
      <DockActionButton
        label={t("common.copy")}
        disabled={!props.actionAvailability.canCopy}
        onClick={props.onCopy}
      />
      <DockActionButton
        label={t("common.cut")}
        disabled={!props.actionAvailability.canCut}
        onClick={props.onCut}
      />
      <DockActionButton
        label={t("common.paste")}
        disabled={!props.actionAvailability.canPaste}
        onClick={props.onPaste}
      />
      <DockActionButton
        label={t("objects.saveAsTemplate")}
        disabled={!props.actionAvailability.canSaveAsTemplate}
        onClick={props.onSaveAsTemplate}
      />
      <DockActionButton
        label={t("objects.replaceWithTemplate")}
        disabled={!props.actionAvailability.canReplaceWithTemplate}
        onClick={props.onReplaceWithTemplate}
      />
      <DockActionButton
        label={t("objects.resetTemplateInstances")}
        disabled={!props.actionAvailability.canResetTemplateInstances}
        onClick={props.onResetTemplateInstances}
      />
      <DockActionButton
        label={t("objects.detachTemplateInstances")}
        disabled={!props.actionAvailability.canDetachTemplateInstances}
        onClick={props.onDetachTemplateInstances}
      />
    </div>
  );
}
