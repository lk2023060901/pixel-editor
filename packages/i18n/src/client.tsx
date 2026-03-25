"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useMemo } from "react";

import {
  createTranslator,
  getMessages,
  type I18nMessages,
  type SupportedLocale,
  type TranslationFn
} from "./shared";

interface I18nContextValue {
  locale: SupportedLocale;
  t: TranslationFn;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export interface I18nProviderProps {
  locale: SupportedLocale;
  messages?: I18nMessages;
  children: ReactNode;
}

export function I18nProvider({
  locale,
  messages,
  children
}: I18nProviderProps) {
  const resolvedMessages = messages ?? getMessages(locale);
  const value = useMemo<I18nContextValue>(() => {
    return {
      locale,
      t: createTranslator(locale, resolvedMessages)
    };
  }, [locale, resolvedMessages]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider.");
  }

  return context;
}
