"use client";

import type { Dispatch, SetStateAction } from "react";
import { useEffect, useRef, useState } from "react";

export type UpperRightDockTabId = "layers" | "objects" | "mini-map";
export type LowerRightDockTabId = "terrain-sets" | "tilesets";

export function useEditorShellLocalState(input: {
  hasActiveObject: boolean;
}) {
  const [upperRightDockTab, setUpperRightDockTab] = useState<UpperRightDockTabId>("layers");
  const [lowerRightDockTab, setLowerRightDockTab] = useState<LowerRightDockTabId>("tilesets");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [customTypesEditorOpen, setCustomTypesEditorOpen] = useState(false);
  const [projectPropertiesOpen, setProjectPropertiesOpen] = useState(false);
  const [tileAnimationEditorOpen, setTileAnimationEditorOpen] = useState(false);
  const [tileCollisionEditorOpen, setTileCollisionEditorOpen] = useState(false);
  const [saveTemplateDialogOpen, setSaveTemplateDialogOpen] = useState(false);
  const [statusInfo, setStatusInfo] = useState("");
  const menuBarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!openMenuId) {
      return;
    }

    function handlePointerDown(event: PointerEvent): void {
      if (menuBarRef.current?.contains(event.target as Node)) {
        return;
      }

      setOpenMenuId(null);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [openMenuId]);

  useEffect(() => {
    if (!saveTemplateDialogOpen || input.hasActiveObject) {
      return;
    }

    setSaveTemplateDialogOpen(false);
  }, [input.hasActiveObject, saveTemplateDialogOpen]);

  return {
    refs: {
      menuBarRef
    },
    state: {
      upperRightDockTab,
      lowerRightDockTab,
      openMenuId,
      customTypesEditorOpen,
      projectPropertiesOpen,
      tileAnimationEditorOpen,
      tileCollisionEditorOpen,
      saveTemplateDialogOpen,
      statusInfo
    },
    setters: {
      setUpperRightDockTab: setUpperRightDockTab as Dispatch<SetStateAction<UpperRightDockTabId>>,
      setLowerRightDockTab: setLowerRightDockTab as Dispatch<SetStateAction<LowerRightDockTabId>>,
      setOpenMenuId: setOpenMenuId as Dispatch<SetStateAction<string | null>>,
      setCustomTypesEditorOpen:
        setCustomTypesEditorOpen as Dispatch<SetStateAction<boolean>>,
      setProjectPropertiesOpen:
        setProjectPropertiesOpen as Dispatch<SetStateAction<boolean>>,
      setTileAnimationEditorOpen:
        setTileAnimationEditorOpen as Dispatch<SetStateAction<boolean>>,
      setTileCollisionEditorOpen:
        setTileCollisionEditorOpen as Dispatch<SetStateAction<boolean>>,
      setSaveTemplateDialogOpen:
        setSaveTemplateDialogOpen as Dispatch<SetStateAction<boolean>>,
      setStatusInfo: setStatusInfo as Dispatch<SetStateAction<string>>
    }
  };
}
