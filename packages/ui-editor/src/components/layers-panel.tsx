"use client";

import type { EditorController } from "@pixel-editor/app-services";
import type { EditorMap, LayerDefinition, LayerId } from "@pixel-editor/domain";
import { useI18n } from "@pixel-editor/i18n/client";
import type { ReactNode } from "react";
import { startTransition, useState } from "react";

import { getLayerKindLabel } from "./i18n-helpers";
import { Panel } from "./panel";

function LayerKindIcon(props: { kind: LayerDefinition["kind"] }) {
  if (props.kind === "object") {
    return (
      <svg
        aria-hidden="true"
        className="h-4 w-4 text-blue-300"
        fill="none"
        viewBox="0 0 16 16"
      >
        <rect x="2.5" y="2.5" width="11" height="11" rx="1" stroke="currentColor" />
      </svg>
    );
  }

  if (props.kind === "image") {
    return (
      <svg
        aria-hidden="true"
        className="h-4 w-4 text-amber-300"
        fill="none"
        viewBox="0 0 16 16"
      >
        <rect x="2.5" y="2.5" width="11" height="11" rx="1" stroke="currentColor" />
        <path d="M4 10.5 6.5 8l2 2 1.5-1.5L12 10.5" stroke="currentColor" />
        <circle cx="6" cy="5.5" r="1" fill="currentColor" />
      </svg>
    );
  }

  if (props.kind === "group") {
    return (
      <svg
        aria-hidden="true"
        className="h-4 w-4 text-amber-200"
        fill="none"
        viewBox="0 0 16 16"
      >
        <path
          d="M2.5 4.5h4l1 1h5v6H2.5z"
          stroke="currentColor"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 text-slate-200"
      fill="none"
      viewBox="0 0 16 16"
    >
      <rect x="2.5" y="2.5" width="11" height="11" stroke="currentColor" />
      <path d="M2.5 6.5h11M2.5 10.5h11M6.5 2.5v11M10.5 2.5v11" stroke="currentColor" />
    </svg>
  );
}

function VisibilityIcon(props: { visible: boolean }) {
  return props.visible ? (
    <svg
      aria-hidden="true"
      className="h-4 w-4 text-slate-300"
      fill="none"
      viewBox="0 0 16 16"
    >
      <path
        d="M1.5 8s2.2-3.5 6.5-3.5S14.5 8 14.5 8s-2.2 3.5-6.5 3.5S1.5 8 1.5 8Z"
        stroke="currentColor"
      />
      <circle cx="8" cy="8" r="2" stroke="currentColor" />
    </svg>
  ) : (
    <svg
      aria-hidden="true"
      className="h-4 w-4 text-slate-500"
      fill="none"
      viewBox="0 0 16 16"
    >
      <path
        d="M1.5 8s2.2-3.5 6.5-3.5S14.5 8 14.5 8s-2.2 3.5-6.5 3.5S1.5 8 1.5 8Z"
        stroke="currentColor"
      />
      <path d="M3 13 13 3" stroke="currentColor" />
    </svg>
  );
}

function LockIcon(props: { locked: boolean }) {
  return props.locked ? (
    <svg
      aria-hidden="true"
      className="h-4 w-4 text-slate-300"
      fill="none"
      viewBox="0 0 16 16"
    >
      <rect x="3.5" y="7" width="9" height="6" rx="1" stroke="currentColor" />
      <path d="M5.5 7V5.5a2.5 2.5 0 0 1 5 0V7" stroke="currentColor" />
    </svg>
  ) : (
    <svg
      aria-hidden="true"
      className="h-4 w-4 text-slate-500"
      fill="none"
      viewBox="0 0 16 16"
    >
      <rect x="3.5" y="7" width="9" height="6" rx="1" stroke="currentColor" />
      <path d="M5.5 7V5.5a2.5 2.5 0 0 1 4.4-1.6" stroke="currentColor" />
    </svg>
  );
}

function ToolbarIconButton(props: {
  title: string;
  disabled?: boolean;
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      aria-label={props.title}
      className={`flex h-6 w-6 items-center justify-center border text-slate-200 transition disabled:cursor-not-allowed disabled:opacity-40 ${
        props.active
          ? "border-slate-500 bg-slate-700"
          : "border-transparent bg-transparent hover:border-slate-600 hover:bg-slate-700/70"
      }`}
      disabled={props.disabled}
      title={props.title}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
}

function NewLayerButton(props: {
  labels: {
    newLayer: string;
    tileLayer: string;
    objectLayer: string;
  };
  onAddTileLayer: () => void;
  onAddObjectLayer: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative"
      onBlur={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
          return;
        }

        setOpen(false);
      }}
    >
      <ToolbarIconButton
        active={open}
        title={props.labels.newLayer}
        onClick={() => {
          setOpen((current) => !current);
        }}
      >
        <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 16 16">
          <path d="M8 3v10M3 8h10" stroke="currentColor" />
        </svg>
      </ToolbarIconButton>
      {open ? (
        <div className="absolute bottom-7 left-0 z-20 min-w-[148px] border border-slate-700 bg-slate-900 py-1 shadow-[0_12px_32px_rgba(2,6,23,0.6)]">
          <button
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-slate-200 transition hover:bg-slate-800"
            onClick={() => {
              setOpen(false);
              props.onAddTileLayer();
            }}
          >
            <span className="w-4">
              <LayerKindIcon kind="tile" />
            </span>
            <span>{props.labels.tileLayer}</span>
          </button>
          <button
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-slate-200 transition hover:bg-slate-800"
            onClick={() => {
              setOpen(false);
              props.onAddObjectLayer();
            }}
          >
            <span className="w-4">
              <LayerKindIcon kind="object" />
            </span>
            <span>{props.labels.objectLayer}</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

function LayerRow(props: {
  layer: LayerDefinition;
  selected: boolean;
  visibleLabel: string;
  hiddenLabel: string;
  lockedLabel: string;
  unlockedLabel: string;
  onSelect: () => void;
}) {
  return (
    <button
      className={`grid w-full grid-cols-[minmax(0,1fr)_24px_24px] items-center gap-1 border-b border-slate-800 px-2 py-1 text-left text-sm transition ${
        props.selected
          ? "bg-slate-800 text-slate-100"
          : "bg-slate-900 text-slate-300 hover:bg-slate-800/70"
      }`}
      onClick={props.onSelect}
    >
      <span className="flex min-w-0 items-center gap-2">
        <LayerKindIcon kind={props.layer.kind} />
        <span className={`truncate ${props.selected ? "font-semibold" : "font-normal"}`}>
          {props.layer.name}
        </span>
      </span>
      <span
        className="flex h-6 w-6 items-center justify-center"
        title={props.layer.visible ? props.visibleLabel : props.hiddenLabel}
      >
        <VisibilityIcon visible={props.layer.visible} />
      </span>
      <span
        className="flex h-6 w-6 items-center justify-center"
        title={props.layer.locked ? props.lockedLabel : props.unlockedLabel}
      >
        <LockIcon locked={props.layer.locked} />
      </span>
    </button>
  );
}

export interface LayersPanelProps {
  activeMap: EditorMap | undefined;
  activeLayerId: LayerId | undefined;
  store: EditorController;
  embedded?: boolean;
}

function LayersPanelContent({
  activeMap,
  activeLayerId,
  store
}: Omit<LayersPanelProps, "embedded">) {
  const { t } = useI18n();
  const activeLayerIndex =
    activeMap?.layers.findIndex((layer) => layer.id === activeLayerId) ?? -1;
  const displayedLayers = activeMap ? [...activeMap.layers].reverse() : [];
  const hasActiveLayer = activeLayerIndex >= 0;
  const hasSiblingLayers = Boolean(activeMap && activeMap.layers.length > 1 && hasActiveLayer);

  function addTileLayer(): void {
    startTransition(() => {
      store.addTileLayer();
    });
  }

  function addObjectLayer(): void {
    startTransition(() => {
      store.addObjectLayer();
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto bg-slate-900">
        {displayedLayers.map((layer) => (
          <LayerRow
            key={layer.id}
            hiddenLabel={t("layers.hidden")}
            layer={layer}
            lockedLabel={t("layers.locked")}
            selected={layer.id === activeLayerId}
            unlockedLabel={t("layers.unlocked")}
            visibleLabel={t("layers.visible")}
            onSelect={() => {
              startTransition(() => {
                store.setActiveLayer(layer.id);
              });
            }}
          />
        ))}

        {!activeMap ? (
          <div className="px-3 py-3 text-sm text-slate-400">{t("layers.noActiveMap")}</div>
        ) : null}
      </div>

      <div className="flex items-center gap-1 border-t border-slate-700 bg-slate-800 px-1 py-1">
        <NewLayerButton
          labels={{
            newLayer: t("layers.newLayer"),
            objectLayer: getLayerKindLabel("object", t),
            tileLayer: getLayerKindLabel("tile", t)
          }}
          onAddObjectLayer={addObjectLayer}
          onAddTileLayer={addTileLayer}
        />
        <ToolbarIconButton
          disabled={!activeMap || activeLayerIndex <= 0}
          title={t("action.raiseLayers")}
          onClick={() => {
            startTransition(() => {
              store.moveActiveLayer("up");
            });
          }}
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 16 16">
            <path d="M8 3 4.5 6.5M8 3l3.5 3.5M8 3v10" stroke="currentColor" />
          </svg>
        </ToolbarIconButton>
        <ToolbarIconButton
          disabled={
            !activeMap ||
            activeLayerIndex < 0 ||
            activeLayerIndex >= activeMap.layers.length - 1
          }
          title={t("action.lowerLayers")}
          onClick={() => {
            startTransition(() => {
              store.moveActiveLayer("down");
            });
          }}
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 16 16">
            <path d="M8 13 4.5 9.5M8 13l3.5-3.5M8 13V3" stroke="currentColor" />
          </svg>
        </ToolbarIconButton>
        <ToolbarIconButton disabled title={t("action.duplicateLayers")}>
          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 16 16">
            <rect x="5" y="4" width="7" height="7" stroke="currentColor" />
            <rect x="3" y="6" width="7" height="7" stroke="currentColor" />
          </svg>
        </ToolbarIconButton>
        <ToolbarIconButton
          disabled={!activeLayerId}
          title={t("action.removeLayers")}
          onClick={() => {
            startTransition(() => {
              store.removeActiveLayer();
            });
          }}
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 16 16">
            <path d="M3.5 4.5h9M6.5 4.5v7M9.5 4.5v7M5 4.5V3.5h6v1M4.5 4.5l.5 8h6l.5-8" stroke="currentColor" />
          </svg>
        </ToolbarIconButton>
        <div className="mx-1 h-4 w-px bg-slate-600" />
        <ToolbarIconButton
          disabled={!hasSiblingLayers}
          title={t("action.showHideOtherLayers")}
        >
          <VisibilityIcon visible />
        </ToolbarIconButton>
        <ToolbarIconButton
          disabled={!hasSiblingLayers}
          title={t("action.lockUnlockOtherLayers")}
        >
          <LockIcon locked />
        </ToolbarIconButton>
        <div className="min-w-0 flex-1" />
        <ToolbarIconButton disabled title={t("action.highlightCurrentLayer")}>
          <svg aria-hidden="true" className="h-4 w-4 text-amber-300" fill="none" viewBox="0 0 16 16">
            <path
              d="M8 2.5 9.7 6l3.8.5-2.8 2.7.7 3.8L8 11.2 4.6 13l.7-3.8L2.5 6.5 6.3 6 8 2.5Z"
              stroke="currentColor"
            />
          </svg>
        </ToolbarIconButton>
      </div>
    </div>
  );
}

export function LayersPanel({
  embedded = false,
  ...props
}: LayersPanelProps) {
  const { t } = useI18n();
  const content = <LayersPanelContent {...props} />;

  if (embedded) {
    return content;
  }

  return <Panel title={t("layers.title")}>{content}</Panel>;
}
