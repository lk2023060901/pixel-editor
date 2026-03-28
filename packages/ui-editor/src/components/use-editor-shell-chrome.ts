"use client";

import {
  deriveEditorShellChromePresentation
} from "@pixel-editor/app-services/ui-shell";
import type { TranslationFn } from "@pixel-editor/i18n";

export function useEditorShellChrome(input: {
  snapshot: Parameters<typeof deriveEditorShellChromePresentation>[0]["snapshot"];
  t: TranslationFn;
  customTypesEditorOpen: boolean;
}) {
  return deriveEditorShellChromePresentation({
    snapshot: input.snapshot,
    t: input.t,
    customTypesEditorOpen: input.customTypesEditorOpen
  });
}
