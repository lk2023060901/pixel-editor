"use client";

import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";

export function useEditorShellNewMenuState() {
  const [newMenuOpen, setNewMenuOpen] = useState(false);

  return {
    state: {
      newMenuOpen
    },
    setters: {
      setNewMenuOpen: setNewMenuOpen as Dispatch<SetStateAction<boolean>>
    }
  };
}
