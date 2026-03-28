"use client";

import type {
  LayersPanelActionId,
  LayersPanelIconKey,
  LayersPanelLayerRowPresentation,
  LayersPanelNewLayerItem,
  LayersPanelViewState
} from "@pixel-editor/app-services/ui";
import {
  createLayersPanelActionPlan,
  deriveLayersPanelLayerRowsPresentation,
  deriveLayersPanelToolbarPresentation,
  layersPanelActionIds,
  resolveLayersPanelNewLayerMenuOpen,
} from "@pixel-editor/app-services/ui";
import type { LayersPanelStore } from "@pixel-editor/app-services/ui-store";
import { useI18n } from "@pixel-editor/i18n/client";
import type { ReactNode } from "react";
import { startTransition, useState } from "react";

import { Panel } from "./panel";

function LayerKindIcon(props: { iconKey: LayersPanelIconKey }) {
  if (props.iconKey === "object-layer") {
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

  if (props.iconKey === "image-layer") {
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

  if (props.iconKey === "group-layer") {
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
  title: string;
  items: readonly LayersPanelNewLayerItem[];
  onAction: (actionId: LayersPanelActionId) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative"
      onBlur={(event) => {
        setOpen((current) =>
          resolveLayersPanelNewLayerMenuOpen({
            open: current,
            action: "blur-menu",
            relatedTargetInside: event.currentTarget.contains(event.relatedTarget as Node | null)
          })
        );
      }}
    >
      <ToolbarIconButton
        active={open}
        title={props.title}
        onClick={() => {
          setOpen((current) =>
            resolveLayersPanelNewLayerMenuOpen({
              open: current,
              action: "toggle-menu"
            })
          );
        }}
      >
        <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 16 16">
          <path d="M8 3v10M3 8h10" stroke="currentColor" />
        </svg>
      </ToolbarIconButton>
      {open ? (
        <div className="absolute bottom-7 left-0 z-20 min-w-[148px] border border-slate-700 bg-slate-900 py-1 shadow-[0_12px_32px_rgba(2,6,23,0.6)]">
          {props.items.map((item) => (
            <button
              key={item.actionId}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-slate-200 transition hover:bg-slate-800"
              onClick={() => {
                setOpen((current) =>
                  resolveLayersPanelNewLayerMenuOpen({
                    open: current,
                    action: "close-menu"
                  })
                );
                props.onAction(item.actionId);
              }}
            >
              <span className="w-4">
                <LayerKindIcon iconKey={item.iconKey} />
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function renderToolbarActionIcon(iconKey: LayersPanelIconKey) {
  switch (iconKey) {
    case "raise-layers":
      return (
        <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 16 16">
          <path d="M8 3 4.5 6.5M8 3l3.5 3.5M8 3v10" stroke="currentColor" />
        </svg>
      );
    case "lower-layers":
      return (
        <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 16 16">
          <path d="M8 13 4.5 9.5M8 13l3.5-3.5M8 13V3" stroke="currentColor" />
        </svg>
      );
    case "duplicate-layers":
      return (
        <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 16 16">
          <rect x="5" y="4" width="7" height="7" stroke="currentColor" />
          <rect x="3" y="6" width="7" height="7" stroke="currentColor" />
        </svg>
      );
    case "remove-layers":
      return (
        <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 16 16">
          <path d="M3.5 4.5h9M6.5 4.5v7M9.5 4.5v7M5 4.5V3.5h6v1M4.5 4.5l.5 8h6l.5-8" stroke="currentColor" />
        </svg>
      );
    case "show-hide-other-layers":
      return <VisibilityIcon visible />;
    case "lock-unlock-other-layers":
      return <LockIcon locked />;
    case "highlight-current-layer":
      return (
        <svg aria-hidden="true" className="h-4 w-4 text-amber-300" fill="none" viewBox="0 0 16 16">
          <path
            d="M8 2.5 9.7 6l3.8.5-2.8 2.7.7 3.8L8 11.2 4.6 13l.7-3.8L2.5 6.5 6.3 6 8 2.5Z"
            stroke="currentColor"
          />
        </svg>
      );
  }
}

function LayerRow(props: {
  presentation: LayersPanelLayerRowPresentation;
  onSelect: () => void;
  onToggleVisibility: () => void;
  onToggleLock: () => void;
}) {
  return (
    <div
      className={`grid w-full grid-cols-[minmax(0,1fr)_24px_24px] items-center gap-1 border-b border-slate-800 px-2 py-1 text-left text-sm transition ${
        props.presentation.isSelected
          ? "bg-slate-800 text-slate-100"
          : "bg-slate-900 text-slate-300 hover:bg-slate-800/70"
      }`}
    >
      <button
        className="flex min-w-0 items-center gap-2 text-left"
        type="button"
        onClick={props.onSelect}
      >
        <LayerKindIcon iconKey={props.presentation.iconKey} />
        <span
          className={`truncate ${props.presentation.isSelected ? "font-semibold" : "font-normal"} ${
            props.presentation.highlightName ? "text-emerald-200" : ""
          }`}
        >
          {props.presentation.name}
        </span>
      </button>
      <LayerStateButton
        selected={!props.presentation.visible}
        title={props.presentation.visibilityTitle}
        onClick={props.onToggleVisibility}
      >
        <VisibilityIcon visible={props.presentation.visible} />
      </LayerStateButton>
      <LayerStateButton
        selected={props.presentation.locked}
        title={props.presentation.lockTitle}
        onClick={props.onToggleLock}
      >
        <LockIcon locked={props.presentation.locked} />
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
  const rowsPresentation = deriveLayersPanelLayerRowsPresentation({ viewState, t });
  const toolbarPresentation = deriveLayersPanelToolbarPresentation({ viewState, t });

  function executeAction(actionId: LayersPanelActionId, layerId?: LayersPanelLayerRowPresentation["layerId"]): void {
    const plan = createLayersPanelActionPlan({
      actionId,
      ...(layerId === undefined ? {} : { layerId })
    });

    if (plan.kind !== "transition") {
      return;
    }

    startTransition(() => {
      plan.run(store);
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto bg-slate-900">
        {rowsPresentation.map((row) => (
          <LayerRow
            key={row.layerId}
            presentation={row}
            onSelect={() => {
              executeAction(layersPanelActionIds.selectLayer, row.layerId);
            }}
            onToggleVisibility={() => {
              executeAction(layersPanelActionIds.toggleLayerVisibility, row.layerId);
            }}
            onToggleLock={() => {
              executeAction(layersPanelActionIds.toggleLayerLock, row.layerId);
            }}
          />
        ))}

        {!viewState.hasMap ? (
          <div className="px-3 py-3 text-sm text-slate-400">{t("layers.noActiveMap")}</div>
        ) : null}
      </div>

      <div className="flex items-center gap-1 border-t border-slate-700 bg-slate-800 px-1 py-1">
        <NewLayerButton
          items={toolbarPresentation.newLayerItems}
          title={toolbarPresentation.newLayerTitle}
          onAction={executeAction}
        />
        {toolbarPresentation.toolbarItems.map((item) => {
          if (item.kind === "separator") {
            return <div key={item.id} className="mx-1 h-4 w-px bg-slate-600" />;
          }

          if (item.kind === "spacer") {
            return <div key={item.id} className="min-w-0 flex-1" />;
          }

          return (
            <ToolbarIconButton
              key={item.actionId}
              active={item.active}
              disabled={item.disabled}
              title={item.title}
              onClick={() => {
                executeAction(item.actionId);
              }}
            >
              {renderToolbarActionIcon(item.iconKey)}
            </ToolbarIconButton>
          );
        })}
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
