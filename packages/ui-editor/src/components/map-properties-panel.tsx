"use client";

import type { EditorController } from "@pixel-editor/app-services";
import type { EditorMap } from "@pixel-editor/domain";
import { useI18n } from "@pixel-editor/i18n/client";
import { startTransition, useEffect, useState } from "react";

import { getOrientationLabel, getRenderOrderLabel } from "./i18n-helpers";
import { Panel } from "./panel";

interface MapDetailsDraft {
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

function createDraft(map?: EditorMap): MapDetailsDraft {
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

function NumberField(props: {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs tracking-[0.16em] text-slate-500 uppercase">{props.label}</span>
      <input
        className="w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-emerald-500"
        disabled={props.disabled}
        inputMode="numeric"
        type="number"
        value={props.value}
        onChange={(event) => {
          props.onChange(event.target.value);
        }}
      />
    </label>
  );
}

export interface MapPropertiesPanelProps {
  activeMap: EditorMap | undefined;
  store: EditorController;
  embedded?: boolean;
  compact?: boolean;
}

function MapPropertiesPanelContent({
  activeMap,
  store,
  compact = false
}: Omit<MapPropertiesPanelProps, "embedded">) {
  const { t } = useI18n();
  const [draft, setDraft] = useState(() => createDraft(activeMap));

  useEffect(() => {
    setDraft(createDraft(activeMap));
  }, [activeMap]);

  if (!activeMap) {
    return <p className="text-sm text-slate-400">{t("mapProperties.noActiveMap")}</p>;
  }

  function applyDraft(): void {
    if (!activeMap) {
      return;
    }

    const width = Number.parseInt(draft.width, 10);
    const height = Number.parseInt(draft.height, 10);
    const tileWidth = Number.parseInt(draft.tileWidth, 10);
    const tileHeight = Number.parseInt(draft.tileHeight, 10);

    if (
      Number.isNaN(tileWidth) ||
      Number.isNaN(tileHeight) ||
      (!draft.infinite && (Number.isNaN(width) || Number.isNaN(height)))
    ) {
      return;
    }

    startTransition(() => {
      store.updateActiveMapDetails({
        name: draft.name.trim() || activeMap.name,
        orientation: draft.orientation,
        renderOrder: draft.renderOrder,
        tileWidth,
        tileHeight,
        infinite: draft.infinite,
        ...(draft.infinite ? {} : { width, height }),
        ...(draft.backgroundColor.trim()
          ? { backgroundColor: draft.backgroundColor.trim() }
          : {})
      });
    });
  }

  if (compact) {
    const rowLabelClass =
      "border-r border-slate-800 bg-slate-900 px-2 py-1.5 text-[11px] uppercase tracking-[0.14em] text-slate-500";
    const inputClass =
      "w-full bg-slate-950 px-2 py-1.5 text-sm text-slate-100 outline-none placeholder:text-slate-500";

    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="grid grid-cols-[96px_1fr] border-b border-slate-800">
            <span className={rowLabelClass}>{t("common.name")}</span>
            <input
              className={inputClass}
              value={draft.name}
              onChange={(event) => {
                setDraft((current) => ({ ...current, name: event.target.value }));
              }}
            />
          </div>
          <div className="grid grid-cols-[96px_1fr] border-b border-slate-800">
            <span className={rowLabelClass}>{t("mapProperties.type")}</span>
            <select
              className={inputClass}
              value={draft.orientation}
              onChange={(event) => {
                setDraft((current) => ({
                  ...current,
                  orientation: event.target.value as EditorMap["settings"]["orientation"]
                }));
              }}
            >
              {orientationOptions.map((orientation) => (
                <option key={orientation} value={orientation}>
                  {getOrientationLabel(orientation, t)}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-[96px_1fr] border-b border-slate-800">
            <span className={rowLabelClass}>{t("mapProperties.order")}</span>
            <select
              className={inputClass}
              value={draft.renderOrder}
              onChange={(event) => {
                setDraft((current) => ({
                  ...current,
                  renderOrder: event.target.value as EditorMap["settings"]["renderOrder"]
                }));
              }}
            >
              {renderOrderOptions.map((renderOrder) => (
                <option key={renderOrder} value={renderOrder}>
                  {getRenderOrderLabel(renderOrder, t)}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-[96px_1fr] border-b border-slate-800">
            <span className={rowLabelClass}>{t("common.width")}</span>
            <input
              className={inputClass}
              disabled={draft.infinite}
              inputMode="numeric"
              type="number"
              value={draft.width}
              onChange={(event) => {
                setDraft((current) => ({ ...current, width: event.target.value }));
              }}
            />
          </div>
          <div className="grid grid-cols-[96px_1fr] border-b border-slate-800">
            <span className={rowLabelClass}>{t("common.height")}</span>
            <input
              className={inputClass}
              disabled={draft.infinite}
              inputMode="numeric"
              type="number"
              value={draft.height}
              onChange={(event) => {
                setDraft((current) => ({ ...current, height: event.target.value }));
              }}
            />
          </div>
          <div className="grid grid-cols-[96px_1fr] border-b border-slate-800">
            <span className={rowLabelClass}>{t("mapProperties.tileWidthShort")}</span>
            <input
              className={inputClass}
              inputMode="numeric"
              type="number"
              value={draft.tileWidth}
              onChange={(event) => {
                setDraft((current) => ({ ...current, tileWidth: event.target.value }));
              }}
            />
          </div>
          <div className="grid grid-cols-[96px_1fr] border-b border-slate-800">
            <span className={rowLabelClass}>{t("mapProperties.tileHeightShort")}</span>
            <input
              className={inputClass}
              inputMode="numeric"
              type="number"
              value={draft.tileHeight}
              onChange={(event) => {
                setDraft((current) => ({ ...current, tileHeight: event.target.value }));
              }}
            />
          </div>
          <div className="grid grid-cols-[96px_1fr] border-b border-slate-800">
            <span className={rowLabelClass}>{t("common.color")}</span>
            <input
              className={inputClass}
              placeholder="#0f172a"
              value={draft.backgroundColor}
              onChange={(event) => {
                setDraft((current) => ({ ...current, backgroundColor: event.target.value }));
              }}
            />
          </div>
          <label className="grid grid-cols-[96px_1fr] border-b border-slate-800">
            <span className={rowLabelClass}>{t("common.infinite")}</span>
            <span className="flex items-center gap-2 bg-slate-950 px-2 py-1.5 text-sm text-slate-200">
              <input
                checked={draft.infinite}
                type="checkbox"
                onChange={(event) => {
                  setDraft((current) => ({ ...current, infinite: event.target.checked }));
                }}
              />
              {t("mapProperties.infiniteMap")}
            </span>
          </label>
        </div>

        {draft.orientation !== "orthogonal" && (
          <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-3 text-sm text-amber-100">
            Canvas rendering and picking currently support orthogonal maps only. Non-orthogonal
            orientation settings are preserved in the domain model, but the editor canvas will stay
            in explicit unsupported mode until `REN-007` to `REN-010`.
          </p>
        )}

        <div className="border-t border-slate-700 bg-slate-800 p-1">
          <button
            className="w-full border border-slate-600 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 transition hover:bg-slate-800"
            onClick={applyDraft}
          >
            {t("common.apply")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <label className="space-y-2">
        <span className="text-xs tracking-[0.16em] text-slate-500 uppercase">{t("common.name")}</span>
        <input
          className="w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-emerald-500"
          value={draft.name}
          onChange={(event) => {
            const { value } = event.target;
            setDraft((current) => ({ ...current, name: value }));
          }}
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-xs tracking-[0.16em] text-slate-500 uppercase">
            {t("mapProperties.orientation")}
          </span>
          <select
            className="w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-emerald-500"
            value={draft.orientation}
            onChange={(event) => {
              const { value } = event.target;
              setDraft((current) => ({
                ...current,
                orientation: value as EditorMap["settings"]["orientation"]
              }));
            }}
          >
            {orientationOptions.map((orientation) => (
              <option key={orientation} value={orientation}>
                {getOrientationLabel(orientation, t)}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-xs tracking-[0.16em] text-slate-500 uppercase">
            {t("mapProperties.renderOrder")}
          </span>
          <select
            className="w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-emerald-500"
            value={draft.renderOrder}
            onChange={(event) => {
              const { value } = event.target;
              setDraft((current) => ({
                ...current,
                renderOrder: value as EditorMap["settings"]["renderOrder"]
              }));
            }}
          >
            {renderOrderOptions.map((renderOrder) => (
              <option key={renderOrder} value={renderOrder}>
                {getRenderOrderLabel(renderOrder, t)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField
          label={t("common.width")}
          value={draft.width}
          disabled={draft.infinite}
          onChange={(value) => {
            setDraft((current) => ({ ...current, width: value }));
          }}
        />
        <NumberField
          label={t("common.height")}
          value={draft.height}
          disabled={draft.infinite}
          onChange={(value) => {
            setDraft((current) => ({ ...current, height: value }));
          }}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField
          label={t("common.tileWidth")}
          value={draft.tileWidth}
          onChange={(value) => {
            setDraft((current) => ({ ...current, tileWidth: value }));
          }}
        />
        <NumberField
          label={t("common.tileHeight")}
          value={draft.tileHeight}
          onChange={(value) => {
            setDraft((current) => ({ ...current, tileHeight: value }));
          }}
        />
      </div>

      <label className="space-y-2">
        <span className="text-xs tracking-[0.16em] text-slate-500 uppercase">
          {t("mapProperties.backgroundColor")}
        </span>
        <input
          className="w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-emerald-500"
          placeholder="#0f172a"
          value={draft.backgroundColor}
          onChange={(event) => {
            const { value } = event.target;
            setDraft((current) => ({ ...current, backgroundColor: value }));
          }}
        />
      </label>

      <label className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-3 text-sm text-slate-200">
        <input
          checked={draft.infinite}
          type="checkbox"
          onChange={(event) => {
            const { checked } = event.target;
            setDraft((current) => ({ ...current, infinite: checked }));
          }}
        />
        {t("mapProperties.infiniteMap")}
      </label>

      <button
        className="rounded-xl border border-emerald-500/50 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-500/20"
        onClick={applyDraft}
      >
        {t("mapProperties.applyChanges")}
      </button>
    </div>
  );
}

export function MapPropertiesPanel({
  embedded = false,
  ...props
}: MapPropertiesPanelProps) {
  const { t } = useI18n();
  const content = <MapPropertiesPanelContent {...props} />;

  if (embedded) {
    return content;
  }

  return <Panel title={t("mapProperties.title")}>{content}</Panel>;
}
