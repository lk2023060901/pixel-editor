"use client";

import { useState } from "react";

export function useEditorShellSubmenuState() {
  const [openSubmenuId, setOpenSubmenuId] = useState<string | null>(null);

  return {
    openSubmenuId,
    onSubmenuPointerEnter(submenuId: string) {
      setOpenSubmenuId(submenuId);
    }
  };
}
