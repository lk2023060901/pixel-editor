"use client";

import type { FeatureStatusValue } from "@pixel-editor/contracts";
import { useI18n } from "@pixel-editor/i18n/client";

import { getFeatureStatusLabel } from "./i18n-helpers";

const statusClassNames: Record<FeatureStatusValue, string> = {
  未开始: "border-slate-700 bg-slate-900 text-slate-300",
  开发中: "border-amber-700 bg-amber-950 text-amber-200",
  测试中: "border-sky-700 bg-sky-950 text-sky-200",
  已完成: "border-emerald-700 bg-emerald-950 text-emerald-200"
};

export interface StatusPillProps {
  status: FeatureStatusValue;
}

export function StatusPill({ status }: StatusPillProps) {
  const { t } = useI18n();

  return (
    <span
      className={`rounded-full border px-2 py-1 text-[11px] font-medium ${statusClassNames[status]}`}
    >
      {getFeatureStatusLabel(status, t)}
    </span>
  );
}
