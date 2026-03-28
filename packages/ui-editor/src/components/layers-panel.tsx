"use client";

import type {
  LayersPanelLayerItemViewState,
  LayersPanelViewState
} from "@pixel-editor/app-services/ui";
import type { LayersPanelStore } from "@pixel-editor/app-services/ui-store";
import { useI18n } from "@pixel-editor/i18n/client";
import type { ReactNode } from "react";
import { startTransition, useState } from "react";

import { getLayerKindLabel } from "./i18n-helpers";
import { Panel } from "./panel";

function LayerKindIcon(props: { kind: LayersPanelLayerItemViewState["kind"] }) {
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

function LayerStateButton(props: {
  title: string;
  selected?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      aria-label={props.title}
      className={`flex h-6 w-6 items-center justify-center transition ${
        props.selected ? "bg-slate-700/90" : "hover:bg-slate-800/80"
      }`}
      title={props.title}
      type="button"
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
    imageLayer: string;
    groupLayer: string;
  };
  onAddTileLayer: () => void;
  onAddObjectLayer: () => void;
  onAddImageLayer: () => void;
  onAddGroupLayer: () => void;
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
          <button
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-slate-200 transition hover:bg-slate-800"
            onClick={() => {
              setOpen(false);
              props.onAddImageLayer();
            }}
          >
            <span className="w-4">
              <LayerKindIcon kind="image" />
            </span>
            <span>{props.labels.imageLayer}</span>
          </button>
          <button
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-slate-200 transition hover:bg-slate-800"
            onClick={() => {
              setOpen(false);
              props.onAddGroupLayer();
            }}
          >
            <span className="w-4">
              <LayerKindIcon kind="group" />
            </span>
            <span>{props.labels.groupLayer}</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

function LayerRow(props: {
  layer: LayersPanelLayerItemViewState;
  highlightCurrentLayer: boolean;
  visibleLabel: string;
  hiddenLabel: string;
  lockedLabel: string;
  unlockedLabel: string;
  onSelect: () => void;
  onToggleVisibility: () => void;
  onToggleLock: () => void;
}) {
  return (
    <div
      className={`grid w-full grid-cols-[minmax(0,1fr)_24px_24px] items-center gap-1 border-b border-slate-800 px-2 py-1 text-left text-sm transition ${
        props.layer.isSelected
          ? "bg-slate-800 text-slate-100"
          : "bg-slate-900 text-slate-300 hover:bg-slate-800/70"
      }`}
    >
      <button
        className="flex min-w-0 items-center gap-2 text-left"
        type="button"
        onClick={props.onSelect}
      >
        <LayerKindIcon kind={props.layer.kind} />
        <span
          className={`truncate ${props.layer.isSelected ? "font-semibold" : "font-normal"} ${
            props.layer.isSelected && props.highlightCurrentLayer ? "text-emerald-200" : ""
          }`}
        >
          {props.layer.name}
        </span>
      </button>
      <LayerStateButton
        selected={!props.layer.visible}
        title={props.layer.visible ? props.visibleLabel : props.hiddenLabel}
        onClick={props.onToggleVisibility}
      >
        <VisibilityIcon visible={props.layer.visible} />
      </LayerStateButton>
      <LayerStateButton
        selected={props.layer.locked}
        title={props.layer.locked ? props.lockedLabel : props.unlockedLabel}
        onClick={props.onToggleLock}
      >
        <LockIcon locked={props.layer.locked} />
      </LayerStateButton>
    </div>
  );
}

export interface LayersPanelProps {
  viewState: LayersPanelViewState;
  store: LayersPanelStore;
  embedded?: boolean;
}

function LayersPanelContent({ viewState, store }: Omit<LayersPanelProps, "embedded">) {
  const { t } = useI18n();

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

  function addImageLayer(): void {
    startTransition(() => {
      store.addImageLayer();
    });
  }

  function addGroupLayer(): void {
    startTransition(() => {
      store.addGroupLayer();
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto bg-slate-900">
        {viewState.layers.map((layer) => (
          <LayerRow
            key={layer.id}
            hiddenLabel={t("layers.hidden")}
            highlightCurrentLayer={viewState.highlightCurrentLayer}
            layer={layer}
            lockedLabel={t("layers.locked")}
            unlockedLabel={t("layers.unlocked")}
            visibleLabel={t("layers.visible")}
            onSelect={() => {
              startTransition(() => {
                store.setActiveLayer(layer.id);
              });
            }}
            onToggleVisibility={() => {
              startTransition(() => {
                store.toggleLayerVisibility(layer.id);
              });
            }}
            onToggleLock={() => {
              startTransition(() => {
                store.toggleLayerLock(layer.id);
              });
            }}
          />
        ))}

        {!viewState.hasMap ? (
          <div className="px-3 py-3 text-sm text-slate-400">{t("layers.noActiveMap")}</div>
        ) : null}
      </div>

      <div className="flex items-center gap-1 border-t border-slate-700 bg-slate-800 px-1 py-1">
        <NewLayerButton
          labels={{
            newLayer: t("layers.newLayer"),
            groupLayer: getLayerKindLabel("group", t),
            imageLayer: getLayerKindLabel("image", t),
            objectLayer: getLayerKindLabel("object", t),
            tileLayer: getLayerKindLabel("tile", t)
          }}
          onAddGroupLayer={addGroupLayer}
          onAddImageLayer={addImageLayer}
          onAddObjectLayer={addObjectLayer}
          onAddTileLayer={addTileLayer}
        />
        <ToolbarIconButton
          disabled={!viewState.canMoveActiveLayerUp}
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
          disabled={!viewState.canMoveActiveLayerDown}
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
          disabled={!viewState.hasActiveLayer}
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
          disabled={!viewState.hasSiblingLayers}
          active={viewState.otherLayersHidden}
          title={t("action.showHideOtherLayers")}
          onClick={() => {
            startTransition(() => {
              store.toggleOtherLayersVisibility();
            });
          }}
        >
          <VisibilityIcon visible />
        </ToolbarIconButton>
        <ToolbarIconButton
          disabled={!viewState.hasSiblingLayers}
          active={viewState.otherLayersLocked}
          title={t("action.lockUnlockOtherLayers")}
          onClick={() => {
            startTransition(() => {
              store.toggleOtherLayersLock();
            });
          }}
        >
          <LockIcon locked />
        </ToolbarIconButton>
        <div className="min-w-0 flex-1" />
        <ToolbarIconButton
          active={viewState.highlightCurrentLayer}
          disabled={!viewState.hasActiveLayer}
          title={t("action.highlightCurrentLayer")}
          onClick={() => {
            startTransition(() => {
              store.toggleHighlightCurrentLayer();
            });
          }}
        >
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
